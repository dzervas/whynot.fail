---
writer: dzervas
build: passing
date: "2020-07-01"
draft: true
tags:
- coding
- rust
- arduino
- microcontrollers
- embedded
title: Rusty Arduino bindings using PlatformIO
url: /coding/rusty-arduino-bindings
image: /img/coding/rusty-arduino-bindings/image.jpg
---

Oh Rust, how much I love you... Love at ~~first~~ third sight,
like I had with my English teacher. She was ugly but I was 12 and she was
a female that stood near me for an hour and talked to me in a calm voice.
That's what Rust is, ugly but it's there for you with a calm voice.

Somehow, that's what Arduino is as well - oh the spaghetti you'll see in the
libraries... You need to have the low standards that a professional coder has
to stand the horrible code that goes into Arduino libraries - you see
a ProCoder (TM) gets paid to touch code that was written by interns that didn't
want to be there and just wanted to stick it to their parents or pay their rent.

Now KISS!

Let's run Rust on MCUs while using Arduino Framework!

# HOw hArD CAn tHAT bE?

{{<
    figure src="/img/coding/rusty-arduino-bindings/how-hard-can-that-be.jpg"
    caption="An intern designing a future proof API"
>}}

What I want to achieve is to be able to call `digitalRead` and `Serial.println`
from Rust code that will run on my NRF52. I choose the NRF52 cause I want to
build a Bluetooth keyboard with it and Rust has official [Tier 2](https://forge.rust-lang.org/release/platform-support.html#tier-2)
support for it, unlike XTensa (ESP32/8266) and AVR (ATMega/ATTiny).

First of all, let's lay down some ground rules on HOW I am willing to achieve that:

- I'm not re-writing Arduino code - I'm not gonna implement the whole standard library, I have other problems as well
- I'm not re-writing Rust `std`
- Automatic binding creation with [bindgen](https://github.com/rust-lang/rust-bindgen) - I won't write a different crate for each and every target
- At least some basic support for some 3rd party Arduino libraries - such as the [BlueFruit](https://github.com/adafruit/Adafruit_nRF52_Arduino/tree/master/libraries/Bluefruit52Lib) that gives me all the core Bluetooth functionality for the NRF52 and is very well maintained
- Minimum boilerplate so that all this work does not remain a "Blink.rs"
- Support for targets other than NRF52 with not too much effort
- Usage of PlatformIO - the only "good enough" build system for the Arduino framework

Ugh... That's not gonna take a weekend, I was sure even when I started this,
but I had no idea how the lack of compiler/linker knowledge would hit me.
I should have known that a project exclusively around compiler & linkers will
hit hard.
