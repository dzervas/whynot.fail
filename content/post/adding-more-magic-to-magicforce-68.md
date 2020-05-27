+++
build = "failing"
date = 2020-05-27T14:15:34Z
draft = true
image = "/img/hardware/magicforce-68-reversing/image.jpeg"
tags = ["hardware"]
title = "Adding more magic to Magicforce 68"
url = "hardware/magicforce-68-reversing"
writer = "dzervas"

+++
This is a small journey on how I reverse engineered the [MagicForce 68](https://drop.com/buy/magicforce-68-key-mini-mechanical-keyboard) keyboard and tried to add bluetooth functionality to it. It's a small keyboard (68 keys, 65%) and is USB-only (it's not the smart model). It has a controller that I can't flash with a custom firmware, so I had to hook wires on it.

TL;DR: I failed. But here's what I tried.

# The Hardware

The first step in determining what I was against, was to at least partially disassemble the keyboard.

After the 6 screws under the keyboard and removed, the bottom cover is free and can be carefully removed as well (it has wires to the mini-USB  connector board, so beware). The nice red PCB is now ready to be destroyed 😈

{{< figure src="/img/hardware/magicforce-68-reversing/magicforce_pcb_back.jpeg" caption="Pretty simple schematic, hackable to the bone" >}}

This is what I collected:
It uses the [Holtek HT68FB550](https://www.holtek.com/productdetail?p_p_auth=q0FpqQ4D&p_p_id=productvgpageportlet_WAR_holtekprodportlet&p_p_lifecycle=0&p_p_state=maximized&p_p_mode=view&_productvgpageportlet_WAR_holtekprodportlet_virtualGroupId=318) MCU - [Datasheet](https://www.holtek.com/documents/10179/116711/HT68FB540_550_560v170.pdf) - LQFP48 package

It exposes in the 5 pin header:

* `VCC`
* `GND`
* `PA0/TCK1/OCDSDA` - Used for debugging
* `Reset/OCDSCK` - Used for debugging & programming
* `UDN/GPIO0` - USB D-, used for programming

Debugging & programming are different procedures, according to the datasheet, they use different pins. But they refer to a "Holtek Writer" as the programmer AND debugger. I could find only the [e-WriterPro](https://www.holtek.com/e-writerpro). Seems fucked up (no docs, too expensive, not gonna work on linux/open source software, etc.).

It is a classic matrix-diode style keyboard, it gives logical 1 (5V if I remember correct) to rows and reads it from the columns (that way because of the direction of the diodes).

Matrix to MCU pin mapping (Rows: Top to Bottom, Columns: Left to Rigth):

| Name | Pin | Pin Description |
| --- | --- | --- |
| PgDown, PgUp, Insert | 42 | NC |
| \`123... | 43 | NC |
| Tab..., Delete | 44 | NC |
| Caps..., Right | 45 | NC |
| Shift..., Up | 46 | NC |
| Ctr..., Left, Down | 47 | NC |

| Name | Pin | Pin Description |
| --- | --- | --- |
| \` | 14 | PD1 |
| 1 | 27 | PD2 |
| 2 | 28 | PD3 |
| 3 | 29 | PD4 |
| 4 | 30 | PD5 |
| 5 | 31 | PD6 |
| 6 | 32 | PD7 |
| 7 | 33 | PE0/VDDIO |
| Left | 34 | PA0/TCK1/OCDSDA |
| 8 | 7 | PE2 |
| 0 | 11 | NC |
| 9 | 10 | NC |
| -, Insert | 12 | NC |
| =, PgUp | 26 | NC |
| Backspace, PgDown | 37 | PA3/TCK2 |
| Delete, Up, Down, Right | 36 | PA2/TP3_1/OSC2 |

All LEDs have a common cathode on Pin 39 - `PA5/SDIA/TP1_0` and a common anode to Vcc.

These are all the data that I gathered. Also, (spoiler) I ended up desoldering all of the switches to create my own keyboard so I got access to the front of the PCB. It's empty, but it's VERY time consuming to remove all the buttons so here are some photos:

{{< gallery >}}
{{< figure src="/img/hardware/magicforce-68-reversing/magicforce_pcb_front.jpeg" caption="Full front side of the PCB" >}}
{{< figure src="/img/hardware/magicforce-68-reversing/magicforce_pcb_front_botright.jpeg" caption="Middle bottom  - space button" >}}
{{< figure src="/img/hardware/magicforce-68-reversing/magicforce_pcb_front_middle.jpeg" caption="Bottom right - arrows & headers" >}}
{{< /gallery >}}

# The hack

Ok, so now we know what we're up against. But what now?

The idea begun with my frustration with wires - right, bluetooth. But how?

I had an [Adafruit Feather Bluefruit](https://www.adafruit.com/product/3406) at hand, based on the marvellous [NRF52832](https://www.nordicsemi.com/Products/Low-power-short-range-wireless/nRF52832). I love the NRF52 family, but after a bit of research I learned that the 52832 does not have USB support and does not have a "CryptoCell", which means a crypto accelerator which mean no [BLE Secure Connecttion](https://medium.com/rtone-iot-security/deep-dive-into-bluetooth-le-security-d2301d640bfc). The NRF52840 offers all these goodies (while the BLE SC support for arduino is [under development](https://github.com/adafruit/Adafruit_nRF52_Arduino/pull/466) at the time of writing) but I had to spend money before even having a PoC. Let's get to work with the 52832!

There was a side idea, that apart from the regular bluetooth keyboard functionality to add U2F and/or GPG SmartCard support. So I started searching if anything like this exists

1. [OpenSK](https://github.com/google/OpenSK): Written in Rust (🎉) but does not support at all the 52832 and Rust support for the NRFs is pretty useless (maybe I'll revisit this at some point)
2. [QMK](https://docs.qmk.fm/) support for my microcontroller - nope
3. Any github project with over 200 commits that is a keyboard implementation for my MCU, preferrably in MicroPython - none
4. [MicroPython](https://micropython.org/) that led me to [this](/notes/micropython-on-nrf52832-with-openocd/) and was a no due to the problems with FS & other unsupported features - nope

I was forced to write the whole firmware from scratch in Arduino. Ugh... "Δε γαμιεται..." (roughly translates to "Fuck it..." in Greek). I'll do it. I'll hook the rows & columns of the keyboard, connectt them to my MCU and control them. I was sure that the on-board MCU won't interfere (it did) and it'll work like a charm (it didn't) and I'll throw in an OLED as well (I didn't). But before that, let's write & test the firmware. Then I'll solder wires on the PCB.

{{< figure src="" caption="The test setup - the MCU, a keypad & an OLED" >}}

There you go, [Plikter](https://github.com/dzervas/plikter). It is comprised of the firmware that runs on the feather and 2 shift registers that read the columns as there are not enough pins on the feather - and of course these are on a custom board whose gerbers you'll find in the repo - made with a plotter following the etching method described perfectly by [stavros](https://www.stavros.io/posts/make-pcbs-at-home/). Soldering time!

{{< gallery >}}
{{< figure src="" caption="The Plikter board" >}}
{{< figure src="" caption="Keyboard hooked - wires from rows & columnns to the MCU & Plikter board" >}}
{{< /gallery >}}

# The outcome

It didn't work.

I debugged it and I think that the internal resistors on the ports of the keyboard MCU that were connected to the rows & columns were interfering, but I'm not sure.

Anyway, I had a (mostly) ready firmware & hardware for a keyboard and I was too frustrated by flying USB wires on my desktop. I made the [SiCK-68](https://www.thingiverse.com/thing:3478494), but that's a story for another time.

Hope you had fun!