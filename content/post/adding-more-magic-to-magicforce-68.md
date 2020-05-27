+++
build = "failing"
date = 2020-05-27T14:15:34Z
draft = true
image = "/img/index.jpg"
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
