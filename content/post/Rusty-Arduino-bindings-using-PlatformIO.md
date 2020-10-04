---
writer: dzervas
build: failing
date: 2020-10-05
tags:
- coding
- rust
- arduino
- microcontrollers
- embedded
title: Rusty Arduino bindings using PlatformIO
url: "/coding/rusty-arduino-bindings"
image: "/img/coding/rusty-arduino-bindings/image.jpg"

---
Oh Rust, how much I love you... Love at ~~first~~ third sight, like I had with my English teacher. She was ugly but I was 10 and she was a female that stood near me for an hour and talked to me in a soothing voice. That's what Rust is, ugly but it's there for you with a soothing voice.

<!--more-->

On the other side we have C++ that the Arduino Framework is written on. Classes here and there, mixed with C, requiring a 3 day workshop to understand what's the "standard" way of blinking a LED - hence the headache of each Arduino library taking the matters on their own hands. I hate reading C++ by the way and don't know how to write it. That's why I want to just forget about it and just call it from Rust.

I'm gonna use [PlatformIO](platformio.org/) which is the swiss-army-knife for the Arduino Framework - manages libraries, board definitions, toolchains, flashing... Everything that you'd possibly need to write and deploy code to an MCU. Apart from Rust. pio knows nothing about Rust and was never intended to do so.

Now lets make those two KISS, run Rust on MCUs while using the Arduino Framework!

TL;DR: My attempt lives in [this](https://github.com/dzervas/platformio-arduino-rust) repo. I failed.

# HOw hArD CAn tHAT bE?

![Me explaining why C++ is so great](/img/coding/rusty-arduino-bindings/how-hard-can-that-be.jpg)

What I want to achieve is to be able to call `digitalRead` and `Serial.println`
from Rust code that will run on my NRF52. I choose the NRF52 cause I want to
build a Bluetooth keyboard with it and Rust has official [Tier 2](https://forge.rust-lang.org/release/platform-support.html#tier-2)
support for it, unlike XTensa (ESP32/8266) and AVR (ATMega/ATTiny).

First of all, let's lay down some ground rules on HOW I am willing to achieve that:

* I'm not re-writing Arduino code - I'm not gonna implement the whole standard library, I have a life to live as well
* I'm not re-writing Rust `std - see above`
* Automatic binding creation with [bindgen](https://github.com/rust-lang/rust-bindgen) - I won't write a different crate for each and every target
* At least some basic support for some 3rd party Arduino libraries - such as the [BlueFruit](https://github.com/adafruit/Adafruit_nRF52_Arduino/tree/master/libraries/Bluefruit52Lib) that gives me all the core Bluetooth functionality for the NRF52 and is very well maintained
* Minimum boilerplate so that all this work does not remain a "Blink.rs"
* Support for targets other than NRF52 with not too much effort
* Usage of PlatformIO - the only "good enough" build system for the Arduino framework

Ugh... That's not gonna take a weekend, I was sure even when I started this, but I had no idea how the lack of compiler/linker knowledge would hit me. I should have known that a project exclusively around compiler & linkers will hit hard.

The plan to achieve the above was hella abstract:

1. Generate Rust headers with [bindgen](https://github.com/rust-lang/rust-bindgen)
2. Write a blinky in Rust
3. Compile the rest of the Arduino framework
4. Compile Rust to an object file
5. Link the above two together
6. Get the firmware
7. Profit

# Aaaaaaand ACTION

Bindgen kinda compiles the header that you pass to it with LVM and generates Rust headers. It's a marvelous project, but it might miss something. Unless of course it's C++ code. Then it trips like an LSD overdose.

![Bindgen trying to understand why there are globals and classess in a header](/img/1-m9slyvmopbkne3qmx7xfsa.jpeg)

After some time around though, I got it, I just passed almost all of the compiler flags that platformio was passing to gcc directly to [bindgen](https://github.com/rust-lang/rust-bindgen). It kiiiiinda worked, in a weird way. WIN!

Writing a Rust blinky was easy (the code is [here](https://github.com/dzervas/platformio-arduino-rust/blob/master/src/lib.rs)). WIN!

Platformio compiles the whole framework when you give it empty source code (main.c). WIN!

I copy-pasted the link command that platformio was using and I added Rust's compiled object file (which can be done using [this](https://github.com/dzervas/platformio-arduino-rust/blob/master/.cargo/config#L5) option). And it worked! WIN!

I got the firmware! I WIN! Profit!

I flashed the firmware and actually, the LED blinked. I was excited as fuck. Somewhere at this point I started writing this post and I'd mark it as build: passing, but then...

# Doing all these at once

There's a reason that I don't have exact commands of the above steps so everyone can happily write Rust on their little fella. First of all, it's been almost 2 months that I haven't touched the project or this draft so I have no idea what I actually did. Second, this did not turn out as a win. While I can blink a LED, there's almost nothing else I can do.

I started fumbling with platformio to incorporate bindgen execution, Rust compilation and final code linking with just a `platformio run`. Then I met [SCons](https://scons.org/). SCons is the build system that platformio uses to put all these bits and pieces together: toolchains, frameworks, compilers, linkers, linker scripts, source code, header files, etc. I tried to manually change variables, redefine functions, and all the good monkey patching that Python can do but it was a dead end. My brain stack pointer was always overflowing, I just couldn't follow what was done where and why. Nevertheless, I kinda [did it](https://github.com/dzervas/platformio-arduino-rust/blob/master/cargo_build.py). Didn't have a good time though.

I could build blinky with one command, good.

![Too soon...](/img/64176833-silhouette-of-happy-people-jumping-over-firework-concept-about-having-fun-and-success.jpg)

# Doing something usefull

Print "Hello World". Nope. Never. Not a chance. I needed somehow to export the `Serial` object from C++ to Rust and call `Serial.println`. After hours and hours of reading the headers and the source of the Arduino Framework and trying different options to bindgen, I could not do that. Required huge amount of effort.

Any useful API in Arduino is a C++ class so if I wanted to overcome this, I had to write everything from the ground. That's when I tossed the project.

# Conclusion

I don't get why C/C++ build systems are so complex. I definitely lack deep knowledge, especially in C++, but come on... This is just too much. Even the Makefiles of a project bigger than 1k SLOC don't make any sense and you need a manual to understand where anything takes place and why it's done. It's a shame.

About the C++ vs bindgen fight, there's not much to tell, I don't think that there will be a time where bindgen will be able to handle the code that I read. It's too complex, it's too human.

Also there are other solutions to write Rust on an MCU instead of this bad idea:

* [Rust Embedded](https://rust-embedded.github.io) - lacks USB stack for nrf52 and the BLE stack is on it's very early steps
* [MyNewt Rust bindings](https://mynewt.apache.org/latest/tutorials/other/rust.html)
* FreeRTOS Rust bindings - I don't see much development and I'm very sceptic