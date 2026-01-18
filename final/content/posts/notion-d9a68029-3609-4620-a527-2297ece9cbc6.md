---
date: 2022-11-02T00:00:00
draft: false
url: /reversing/the-art-of-cracking-software
tags:
  - reversing
  - windows
writer: dzervas
build_status: unknown
image: /images/notion-d9a68029-3609-4620-a527-2297ece9cbc6-warez-szene-razor1911-ist-zurueckgekehrt.webp
title: The art of cracking software
---
As the years have gone by, it seems that cracking software is more and more synonymous to “malware”. As this world no longer knows how to operate in a manner of doing something for the common good, selfless moves that would give access to people that can’t bear the stupid “entry price” have been shadowed by moves that replace that “entry price” with remote access instead of money. It pains me and makes me sad, but at least I can share some aspect of it, as I’d rather not go to jail.

For some reason I’m not completely sure, I’ve picked up the hobby of cracking niche softwares’ licensing mechanisms. Maybe it’s because that I know for a fact that they can be cracked - something that isn’t given for hacking cloud-based software.

This is a research post. I don’t use or share my cracks. I do it for fun. Please don’t hurt me.

# Defining the target

My targets are exclusively Windows programs, but I’m sure a lot of the described techniques apply to any OS.

Each time I start cracking a program, I’ve got to set a clear target. Most times is “permanent license that gives me access to everything” but that requires to know the following:

 - Is there a trial version? If yes:
 - Forget about any kind of cloud-based features (cloud save, cloud-based computing, etc.)
 - Is the license “just a serial number” or a whole file (binary or not)?
 - Does the software provide means of offline license activation?
 - What language is the app written in?
 - Do we have any kind of debug symbols?
 - Any kind of obfuscation or anti-reversing?
The only blocker in the above questions is if we have no access to the premium binary. Maybe the URL to download it is tucked somewhere inside the trial binary. If not, too bad, find something else.

I’d also stop as soon as I found that the app has anti-reversing or serious obfuscation. I’d really like to have fun and not spend the good part of a year for a single app. I’m not a good reverser anyway and I don’t want to be - these people are scary.

Another part of my cracking adventure is developing the “perfect crack”. The one that tinkers the app the least and allows me to maintain it across versions. I don’t want just to patch a DLL. It’s dirty. We’ll see better techniques further down.

# First impressions

Play a bit around with the software see what it does. Identify useful strings (like `Trial` or `Expires`) inside the app so you’ve got stuff to search.

How does it behave if you give it a wrong serial number? If you disable the internet? Where does it store license stuff? Maybe in the registry? Are there any interesting keys in there? If the license is stored in a file, poke it. Is it encrypted? Signed? Has a checksum?

At this point there are no wrong directions. Poke the program and start building confidence in the app. What it means to run correctly. You should crash the app at least once. Don’t be afraid, you can just re-install it.

# Network inspection

Fire up Burp and pass the whole VM traffic through it (you’re using a VM right? RIIIIGHT???)

Identify the URLs and check for SSL pinning. Then install Burp’s root cert in the VM and check again.

If it’s SSL pinned bypassing it shouldn’t be that hard (we’ll see some examples later)

Right now you’re looking for the following:

 - Does the serial number get sent to the backend?
 - If yes, check the responses of correct and incorrect license numbers
 - If not, check for kinda weird-looking strings, encrypted strings and signatures. Maybe the license is used to generate another string to obfuscate it over the wire
There’s a pretty good chance that right now you’ve found already a solid entrypoint. The app sends some computer based fingerprint with the license key to the licensing server and expects a structured response that describes the kind of license that we have.

In my experience following this route has not been fruitful. In all of such encounters the request and response are signed and sometimes even encrypted. But the most problematic aspect is identifying the required structure that the app expects. Instead of `22-dec-2022` that the expiration date is set you try `22-dec-2032` - after bypassing the signature check of course. But for some reason it doesn’t work - data are encoded elsewhere as well? Maybe if you change `trial` to `premium`? Or to `ultimate`? Why are there both strings inside the app? Is that case sensitive?

These might seem like easy problems but, let me tell you, they’re definitely not. Compilers have gone mental with optimization and understanding a C++ object through reversing is it’s own mountain. How would you know that `ultimate` needs a `is_network_license` to false - while `trial` does not?

From all the programs that I’ve cracked, I’ve never found one that does a “simple enough” network call to check the license. They all use some kind of licensing solution that has signatures and encryptions n stuff that make network-based cracking as hard as “regular” cracking (hooking/patching n stuff).

So now what?

# Dynamic Instrumentation - Native apps

Let me introduce you to the amazing world of: 🌈[frida](https://frida.re)🌈

It’s a stupidly powerful dynamic instrumentation framework, mainly targeting mobile apps but it works great on all Desktop OSes as well. Think of it like Inspect Element for native apps.

It works by injecting a JavaScript Engine inside the target process. That essentially allows you to inject or even replace native function with JavaScript code. Here for example we hook the debugging output the target app runs:

```javascript
let OutputDebugStringW_export = Module.getExportByName("kernel32.dll", "OutputDebugStringW");
let OutputDebugStringW_new = new NativeCallback((str) => {
		// Redefine the code executed - yeap, plain javascript.
		// `str` is gonna be a pointer as we tell further down.
		// As the return type is void, we don't have to return anything

		// Since this is a pointer, we can treat it in any way we like. Here we read it as Utf16 - part of the frida API
		console.log(str.readUtf16String());
	},
	"void", // Return type
	[ "pointer" ] // Argument list. They will be passed to the above function as regular arguments
);
```

The above can then be run as follows:

```javascript
frida.exe -f MyAwesomeApp.exe -l HookDebugStringW.js
```

This will spawn the app but you can also hook onto an already running process with `-n` flag instead of `-f`. After that you’re thrown into an interactive JS shell that you can enter commands or change the script that is automatically re-applied once it changes on disk. I can’t possibly overstate how powerful this tool is. And it doesn’t stop there!

The exact reason of why would you hook a debug output is not the point. That could be an exported symbol of the program or even one of its DLLs. But what if you just wanna search for a bunch of function names and wanna see if they get called in the specific flow that you’re researching? Enter `frida-trace`.

Instead of writing hooks like the above over and over, that tool does most of the job for you and can also pattern match function names. Almost my first command when I start the reversing phase is the following:

```javascript
frida-trace.exe -n MyAwesomeApp.exe -i 'MyAwesomeApp.exe!*License*'
```

I run that right before I click some kind of license checking button after I’ve entered the license string and I check to see if any function with a name that matches the pattern `*License*` (note: case sensitive) inside the module `MyAwesomeApp.exe` (note: case sensitive as well - many times the module name is in a different case than the file. Use `Process.enumerateModulesSync()` inside the frida shell) fires up. I’m limiting the search in that module to avoid hooking thousands of functions - which is a very good recipe for an instant crash. You can either make the pattern a bit more targeted and remove the module part or change the module to a spicy named DLL. You can also hook all the functions of a module with `-I liblicense_of_MyAwesomeApp.dll` but again, if the exports are too many it’ll crash.

At this point, for the not-so-experienced crackers, I should note that the whole time I’m talking about functions that have exported symbols. If the app has stripped the names of the functions and the function that you’re aiming for is called from inside the module, the aforementioned technique will bear no fruits as there won’t be any functions found to hook. The windows-native functions though (`user32.dll` or `kernel32.dll` for example) will always work as those DLLs have well known exports. It’s a very accurate way of finding out the environment variables that the app accepts, WMI queries that it does, registry keys that it uses and maybe even some crypto stuff that it uses to check the license.

# Reversing - Native apps

I don’t know what you’re expecting here but I’m not a good reverser. At all. Fire up ghidra and start looking for strings and go back from there. I’ve got one piece of a one-liner though to find spicy DLLs fast:

```bash
fd . ~/.wine/drive_c/Program\ Files/MyAwesomeApp -H -t f -x sh -c 'strings -a -e l "{}" | rg -i "license" && echo -e "\t>{}"'
```

What this does is run `strings`to all the files recursively under `~/.wine/...` but with a twist: the `-e l` flag. This makes all the difference. You see Windows like 16 bit little endian characters. But not always. Maybe big endian (`-e b`) or maybe regular ASCII (no `-e` flag at all). This note took me a week to find out. Cheers.

While it’s very tempting, don’t invest much time finding “a single function that if returns true everything is super-premium-ultimate-version”. Nowadays everyone loves object orientation and most often than not a “subtle” change could require huge changes in the object that represents the license. I have however stumbled upon such a marvelously written software!

It’s one of the most widely used software in its market and: IT’S CLOUD BASED. Yeap. It’s mostly an electron app that loads remote content and I just didn’t even try to crack it for months. “It should load the code that is required for my specific license” I thought. NOP! It had an `isUltimate` function that when hooked to return `true`, I was magically Ultimate.

Most of the other software though weren’t that nice. Even apps that share just a tiny fraction of the market used some kind of licensing solution that as said before has some difficulty - Stripped symbols, encryption, signing, public/private keys and even sometimes statically compiled crypto functions.

## A word on keygens

I think that key generators are the epitome of art in terms of cracking. It’s so slick and not intruding and sometimes quite hard to counter-measure from the perspective of the developer so many times it’s resilient to updates. But it’s hard. Very hard.

I’ve stumbled upon a C# app that I cracked using a keygen. I found a “magic license key” to put it in offline mode so that it accepts license keys that are checked using some math. But it used some archaic Windows hashing function that was a pain to re-implement and required some very weird math. It was also hidden in plain site - The function `CheckLicense` was never called (and it also had some even more weird math that took me 3 days to understand that make no actual sense) and the actual function was named something like `CalculateOrbitalTrajectory`. The only way that I could find that was through dynamic instrumentation.

On another app I cracked the public DSA-512 public key that it used to verify the license signature. I had already cracked it through hooking but I wanted to completely own it so I cracked the key - I never got to use it tho as it needed some weird transformations and I got bored. Again, the structuring of data is a huge roadblock. Here’s though how I cracked a DSA-512 public key in 2 days (there are MUCH better and faster ways to do it but that’s the only way it worked for me - also I’m bad at cryptanalysis):

```bash
# All the key data have been changed
# Extract the PEM public key from inside the binary
openssl dsa -pubin -in anotherAwesomeApp_public_key.pem -noout -modulus
read DSA key
Public Key=2A0ABA86F22281B123F33D9E073AC921C0F2BCB0114C07F632129B64C3CA4181D84C998C2556DC69CB30E0D6B7CB761274AAFC6834FE74D6721E6EA6BCD68DEA
# Hex to decimal
$ echo "ibase=16;2A0ABA86F22281B123F33D9E073AC921C0F2BCB0114C07F632129B64C3CA4181D84C998C2556DC69CB30E0D6B7CB761274AAFC6834FE74D6721E6EA6BCD68DEA" | bc
22019134240820916317814169763607118015464182266127018258054642617293\
88614872096293260765941335270405591230469600688971077042627869124706\
949973008545385962


# And then run [cado-nfs](http://cado-nfs.gforge.inria.fr/) through docker to
# factor the number (steps from [here](https://www.doyler.net/security-not-included/cracking-256-bit-rsa-keys)):

$ docker run -d --name anotherAwesomeApp_public cyrilbouvier/cado-nfs.py 2201913424082091631781416976360711801546418226612701825805464261729388614872096293260765941335270405591230469600688971077042627869124706949973008545385962
$ docker logs -f anotherAwesomeApp_public
Unable to find image 'cyrilbouvier/cado-nfs.py:latest' locally
latest: Pulling from cyrilbouvier/cado-nfs.py
43c265008fae: Pull complete
50baea060b67: Pull complete
5f3e0aed5ee6: Pull complete
80c73fc9483b: Pull complete
Digest: sha256:83513a532bc3cfc09ddc44e9c12b9283ace37736fed29f6259cb2b98a1342ab3
Status: Downloaded newer image for cyrilbouvier/cado-nfs.py:latest
Info:root: Using default parameter file /cado-nfs/share/cado-nfs-2.2.1/factor/params.c155
Info:root: No database exists yet
Info:root: Created temporary directory /tmp/cado.gcsugjj0
Info:Database: Opened connection to database /tmp/cado.gcsugjj0/c155.db
Info:root: Set tasks.threads=6 based on detected physical cpus
Info:root: tasks.polyselect.threads = 2
Info:root: tasks.sieve.las.threads = 2
Info:root: slaves.scriptpath is /cado-nfs/bin
Info:root: Command line parameters: /cado-nfs/bin/cado-nfs.py 2201913424082091631781416976360711801546418226612701825805464261729388614872096293260765941335270405591230469600688971077042627869124706949973008545385962
Info:root: If this computation gets interrupted, it can be resumed with /cado-nfs/bin/cado-nfs.py /tmp/cado.gcsugjj0/c155.parameters_snapshot.0
Info:Server Launcher: Adding e13824a36734 to whitelist to allow clients on localhost to connect
Info:HTTP server: Using non-threaded HTTPS server
Info:HTTP server: Using whitelist: localhost,e13824a36734
Info:Complete Factorization: Factoring 2201913424082091631781416976360711801546418226612701825805464261729388614872096293260765941335270405591230469600688971077042627869124706949973008545385962
Info:HTTP server: serving at https://e13824a36734:41869 (0.0.0.0)
Info:HTTP server: For debugging purposes, the URL above can be accessed if the server.only_registered=False parameter is added
Info:HTTP server: You can start additional cado-nfs-client.py scripts with parameters: --server=https://e13824a36734:41869 --certsha1=313aa0820967f6db061e8fc9cbf2bde7ecdacab5
Info:HTTP server: If you want to start additional clients, remember to add their hosts to server.whitelist
Info:Client Launcher: Starting client id localhost on host localhost
Info:Client Launcher: Starting client id localhost+2 on host localhost
Info:Client Launcher: Starting client id localhost+3 on host localhost
Info:Client Launcher: Running clients: localhost+3 (Host localhost, PID 16), localhost+2 (Host localhost, PID 14), localhost (Host localhost, PID 12)
Info:Polynomial Selection (size optimized): Starting
Info:Polynomial Selection (size optimized): 0 polynomials in queue from previous run
Info:Polynomial Selection (size optimized): Adding workunit c155_polyselect1_0-1000 to database
Info:Polynomial Selection (size optimized): Adding workunit c155_polyselect1_1000-2000 to database
Info:Polynomial Selection (size optimized): Adding workunit c155_polyselect1_2000-3000 to database

...

Info:Square Root: Starting
Info:Square Root: Creating file of (a,b) values
Info:Square Root: finished
Info:Square Root: Factors: 2 79 104569920747<hidden>8189807 43 31
Info:Square Root: Total cpu/real time for sqrt: 0.02/0.0144372
Info:Polynomial Selection (size optimized): Aggregate statistics:
Info:Polynomial Selection (size optimized): potential collisions: 71168.8
Info:Polynomial Selection (size optimized): raw lognorm (nr/min/av/max/std): 72294/45.370/55.413/60.780/0.874
Info:Polynomial Selection (size optimized): optimized lognorm (nr/min/av/max/std): 67782/45.250/50.101/56.280/1.689
Info:Polynomial Selection (size optimized): 10 best raw logmu:
Info:Polynomial Selection (size optimized): 10 best opt logmu:
Info:Polynomial Selection (size optimized): Total time: 49493.9
Info:Polynomial Selection (root optimized): Aggregate statistics:
Info:Polynomial Selection (root optimized): Total time: 4050.98
Info:Polynomial Selection (root optimized): Rootsieve time: 4050.39
Info:Generate Factor Base: Total cpu/real time for makefb: 21.54/5.23901
Info:Generate Free Relations: Total cpu/real time for freerel: 271.45/44.1077
Info:Lattice Sieving: Aggregate statistics:
Info:Lattice Sieving: Total number of relations: 48074999
Info:Lattice Sieving: Average J: 7752.25 for 1680511 special-q, max bucket fill: 0.732933
Info:Lattice Sieving: Total CPU time: 2.90978e+06s
Info:Filtering - Duplicate Removal, splitting pass: Total cpu/real time for dup1: 104.66/78.7711
Info:Filtering - Duplicate Removal, splitting pass: Aggregate statistics:
Info:Filtering - Duplicate Removal, splitting pass: CPU time for dup1: 78.7s
Info:Filtering - Duplicate Removal, removal pass: Total cpu/real time for dup2: 641.15/153.957
Info:Filtering - Singleton removal: Total cpu/real time for purge: 427.7/143.297
Info:Filtering - Merging: Total cpu/real time for merge: 631.74/620.553
Info:Filtering - Merging: Total cpu/real time for replay: 103.78/94.0045
Info:Linear Algebra: Total cpu/real time for bwc: 160799/0.000371933
Info:Linear Algebra: Aggregate statistics:
Info:Linear Algebra: Krylov: WCT time 18123.13
Info:Linear Algebra: Lingen CPU time 379.27, WCT time 81.51
Info:Linear Algebra: Mksol: WCT time 9798.28
Info:Quadratic Characters: Total cpu/real time for characters: 78.49/28.6099
Info:Square Root: Total cpu/real time for sqrt: 0.02/0.0144372
Info:HTTP server: Shutting down HTTP server
Info:Complete Factorization: Total cpu/elapsed time for entire factorization: 3.12641e+06/720361
Info:root: Cleaning up computation data in /tmp/cado.06lc2ugg
2 79 104569920747<hidden>8189807 43 31

# Unfortunately that's as far as I got :)
```

# Dynamic Instrumentation & Reversing - C# apps

One word: [dnSpy](https://github.com/dnSpy/dnSpy). Again, a gift given by gods. Unfortunately frida won’t work with the C# runtime but dnSpy has your back. It fully decompiles the app and is an amazing debugger.

The exact same principals as above apply but the problem is that the resulting crack can’t be a javascript file and this raises a problem that I’ve been obsessing about for the past two weeks: Crack deployment.

As I said in the prologue, I like clean cracks that are transparent to the user (can inspect them easily) and are able to be maintained for future proofing. JavaScript is an amazing solution to the above problems (although it has some others of its own) but as frida isn’t available for C#, we can’t use it. Of course we could patch the binary with dnSpy but patched binaries just don’t cut it for me. They’re dirty. We’ll talk about this problem later.

# Dynamic Instrumentation & Reversing - Java apps

Well here, we’ve got a problem. I was stunned to find out that the main target of frida, the Java VM is actually the mobile Java VM. Frida-ing “Regular” Java, running on Windows and Linux won’t do it. It spits out some errors about some not found classes (that contain the name `Zygote` which is an Android-y name) and doesn’t work. I was heart broken and at that point I didn’t go any further.

Of course there’s JadX for reversing, but it doesn’t offer a debugger for desktop apps either. Why does everyone forget that Java runs on desktops, is above me.

Maybe I’ll come around it and find good tooling around Java, who knows. If you happen to know good tools, leave a comment below

# Crack deployment

As we’re reaching the end of this post (yes, it has one, even if it doesn’t seem like it) I’d like to close with the problem I’ve been burdened for the last two weeks. Let’s say I’ve written some good frida scripts that do their job and I’ve patched a C# DLL as a PoC. Now what? I don’t want to have to run the app through frida and have a statically patched binary! That’s dirty! When the app updates, I’ll have problems. I break the PE’s signature, it’s hard to replicate, it’s hard to explain and it’s not transparent. I’ve found the following solutions till now - unfortunately without a good implementation (yet?):

 - Create an AppInit_DLL (for what that is click [here](https://learn.microsoft.com/en-us/windows/win32/dlls/secure-boot-and-appinit-dlls#about-appinit_dlls)) that is app-aware so that when `MyApp.exe` loads `user32.dll` [frida-gadget](https://frida.re/docs/gadget/) can be injected or a nicely written Rust dll can be injected. I’ve not seen a tool like this but I’d like to develop one.
 - Patch the target exe to include our custom frida-gadget/DLL as a DLL import and load it. This differs than static patching as there’s a single global script to patch all of our cracked exes and the change is almost self-explanatory. When the exe is cracked, it’ll have a `libcrack.dll` import that does all the hooking job. Simple and clean - with an asterisk though as that change breaks the PE’s signature, something that I’ve got no idea how big of a problem is. I’ve tried using the [LIEF](https://lief-project.github.io/doc/stable/tutorials/06_pe_hooking.html) python library but I wasn’t able to run the exe after patching successfully after [injecting the frida-gadget library](https://lief-project.github.io/doc/stable/tutorials/09_frida_lief.html) - I’ve even opened an [issue about it](https://github.com/lief-project/LIEF/issues/777)
 - Maybe find DLLs that the app optionally searches for and if found load them? That’s too app-specific though and prone to break across updates (maybe it requires different exports or it changes the program behavior in a way that we don’t like).
 - ??? - please comment if you have a good idea
# Closing

I still don’t get why companies charge such a stupid amount of money for their software when we’re talking about hobbyist clients. It’s a win-win. You’ll never make a 50k$/year sale to that person but if you give it to them for free, it’s almost sure that they’re gonna root for you and advertise you. For free. Also if they land a job around the market you’re in, there’s a pretty good chance that they’ll push the company to buy your software - even for 50k/year.

Maybe I’m too naive. Maybe I “don’t get business”. Truth is, I’m not good at that “capitalism” game.

On the other hand, I tend to draw a line on apps that I crack. There are some amazing software that cost something very reasonable and they get regular updates, good communities n stuff. I like to support them if I can.

In any case, cracking is not that hard, it just requires time. You get to dead ends quite often but it’s not hard to understand what you see. Most times, when I’m stuck I start from a new lead. Eventually everything falls together. Give or take, a month is enough to crack “most” programs (I’m not talking about apps around computer security, such as IDA Pro. I’ve heard it’s a HUGE undertaking).

