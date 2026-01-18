---
date: 2019-12-04T00:00:00
url: /coding/rust-c-api-pain
tags:
  - coding
  - rust
  - programming
writer: dzervas
build_status: failing
image: /images/notion-6d2ace92-b62a-4879-b306-6cbe6ae6d0e1-image.jpg
title: Rust, let me share your awesomeness with C
---
Ahoy reader, this is kinda an open letter. But mostly is my desperation in computer font. Rust why don’t you love me? I read about you, I spent nights and days. I fought the borrow checker monster for you. I learned about lifetimes. And you promised two things: - “Systems” language, close to C - Memory safety

I just wanna call you via a C binary. I don’t want you to fly. I just wanna love you…

But before we get to the chase, lets get to drama. You know how I love backstories (and I’ve been watching How to get away with murder).

## The story

The project that all this happend for is not a new idea to me. It boiled inside me for quite some time. I’m referring to mage I started writing it about 6 months ago, when a friend asked me for a stable tool that is able to listen for TCP shells and have TTY support for his OSCP (that’s a story for another day, for more check out [netcatty](https://github.com/dzervas/netcatty)). Of course I stopped whatever (another project) I was doing and started coding. I was currently into Go, so I went with it. As I was writing netcatty, first of all I lost a huge oportunity to name it netkitty which is way better and second I started spiraling out about what I could actually do. Why only TCP? I can do better!

That’s where mage was born. Mage is a tiny protocol, intended to be encapsulated inside all kinds of transports. HTTP requests, headers, cookies, TCP timestamps, DNS queries etc. What a marvelous idea!

Remember when post-exploitation toolkits & implants communicated with the C2 over TCP or HTTP? Remember when you could feel the earth shaking every time a meterpreter payload exited the final gateway of a target cause a stray UDP connection to a russian server on port 1337 just opened? Remember when the connection would get killed and your server banned after 5’ you got a shell? Well mage is willing to do its magic to stop this madness.

![The blue team laughing at your windows/meterpreter/reverse_tcp](/images/notion-d0b35ea8-7e06-4ca0-87d8-e9accc2926ef-blue-team-laughing.jpg)

The idea is that you generate a binary payload (msf or whatever) and you “wrap” it using mage. By wrap I mean that the mage .so (or .dll) would be injected inside the binary and then binary patch all the `socket.h` (or `winsock`) calls to use the mage functions (spoiler: “wrapping” is not yet implemented, that’s what this post is about).

The mage primarilly does the following: - Connect to the C2 (completely ignoring the address that the implant wanted to connect to) over whatever protocol you set up during wrapping - Exchange keys with the server (libsodium) - Start encrypted communication with the server (libsodium)

Useful features include chunking, very low overhead, support for out-of-order packet reception (and maybe sometime packet retransmission?)

That’s all good, but I’m still talking about a Go project huh? No…

As any good project, you have to write it at least twice for it to be good. I think I maybe overdid it and rewrote it too fast. [Here](https://github.com/dzervas/mage). I rewrote it in rust. Rust was a much better fit, as it’s much closer to the system, it doesn’t carry a GC and the overal Rust - `insert-lang-here` interfacing I THOUGHT was easier. If I only knew…

## The target

As said, wrapping is not ready. Nor any actually useful transports. Right now the protocol, encryption/decryption, multiplexing and thread channels are ready. To start implementing wrapping, I had to create a libC API. All answers led to `cbindgen`, a very cool project that all it does is generate C headers, but to use it, you need to create a C API!

The “final” struct that I wanted to export was `Connection` (see [here](https://github.com/dzervas/mage/blob/master/src/connection.rs)):

```rust
pub struct Connection<'conn> {
    pub id: u32,
    stream: Stream,
    reader: &'conn mut dyn Read,
    writer: &'conn mut dyn Write,
    channels: HashMap<u8, Vec<(Sender<Vec<u8>>, Receiver<Vec<u8>>)>>
}
impl<'conn> Connection<'conn> {
pub fn new(id: u32, reader: &'conn mut impl Read, writer: &'conn mut impl Write, server: bool, seed: &[u8], remote_key: &[u8]) -> Result<Self>
...
}
impl Read for Connection<'_> {...}
impl Write for Connection<'_> {...}
```

The C API has to be like that (to be in-place compatible with `socket.h`):

```rust
#[no_mangle]
pub unsafe extern "C" fn connect(_socket: c_int, _sockaddr: *const c_void, _address_len: c_void) -> c_int
#[no_mangle]
pub unsafe extern "C" fn send(_socket: c_int, msg: *const c_void, size: usize, _flags: c_int) -> usize
#[no_mangle]
pub unsafe extern "C" fn recv(_socket: c_int, msg: *mut c_void, size: usize, _flags: c_int) -> usize
```

It does not implement all the `socket.h` functions, but I started with the most vital ones.

This is my target, expose `connect`, `send` and `recv` to C and let them handle the whole logic. No mystery threads n’ stuff, it could mess a lot wit AV evasion (while it AV evasion has nothing to do with this project, I shouldn’t make it harder)

## The problem

The problem that I quickly realized was that there was no way to have a “state”. I couldn’t just pass the `Connection` struct back & forth, as `socket.h` does! I have to adhere to the function signatures and if someone messes with my struct in a completely unchecked manner, anything could go wrong.

So I went on and tried to create a static object holding a `Connection`, that would be initialized on `connect`. Oh the horror…

Rust says that it needs to know the size of `Connection` at compile time to let me have it as static. That’s not possible. I add a reference, but it can’t live long enough so I go with `Box`. `lazy_static` enters the game. No idea what it does, but it solved a problem with static. But introduces another. No mutability. So I add a `Mutex`.

Right now we have this:

```rust
lazy_static! {
	static ref CONN: Mutex<Option<Box<Connection>>> = Mutex::new(None);
}
```

Ok, that’s fine. It compiles (nobody knows if this actually works yet). But then starts another rabbit hole. Inside `connect`, among other stuff I call `Connection::new`. `Connection::new` accepts `reader: &'conn mut impl Read, writer: &'conn mut impl Write`. And these are satisified by a `TcpStream` and `TcpStream.try_clone.unwrap()`. Now I can’t borrow these, as they’re inside the function scope.

This is the problem. I don’t know how to pass `TcpStream` to a new static `Connection`. I tried making it static as well, `Box`ing and `Rc`ing them. Didn’t fucking work. If anyone can help, please do so…

![My code after all the "tries”](/images/notion-b2b5a373-c5d0-48ff-a3e2-da9b4bcf101b-code-after-trial-and-error.jpg)

---
I know that you don’t read this type of posts often - or I don’t often read them (ranting due to lack of skill). But this was mainly a rubber duck debugging session for me and it’s one of the very few moments that I’m so stuck, that I’m thinking about abandoning the project. Most times I just get bored or find something new. This is different. I’ve hit a brick wall and can’t find even a really dirty hack around it (even though I hate “hacky” code).

Happy Hacking!

