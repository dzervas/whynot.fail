---
title: "Reverse Engineering a USB Protocol"
date: 2024-03-15
tags: ["reversing", "hardware", "python"]
categories: ["reverse-engineering"]
build_status: "failing"
writer: "dzervas"
description: "How I spent 3 weekends staring at hex dumps and questioning my life choices"
---

This is one of those projects where I knew I was going to fail but did it anyway. The target: a cheap Chinese laser engraver with proprietary software that only runs on Windows XP.

## The Setup

First, I needed to capture USB traffic. On Linux, this is surprisingly easy with `usbmon`:

```bash
# Load the kernel module
sudo modprobe usbmon

# Find your device
lsusb
# Bus 002 Device 015: ID 1a86:7523 QinHeng Electronics CH340 serial converter

# Capture with Wireshark
sudo wireshark -i usbmon2
```

> [!NOTE]
> You can also use `tcpdump` if you prefer the terminal: `tcpdump -i usbmon2 -w capture.pcap`

## Analyzing the Traffic

After capturing a simple "draw a square" operation, I got about 500 packets. Here's what a typical control packet looked like:

```
0000   80 01 00 00 00 00 00 00  a5 00 10 00 00 00 00 00   ................
0010   00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00   ................
0020   01 00 00 00 e8 03 00 00  00 00 00 00 00 00 00 00   ................
```

Looks like garbage, right? After hours of staring, patterns emerged:

| Offset | Size | Meaning |
|--------|------|---------|
| 0x00 | 1 | Command type (0x80 = move, 0x81 = laser on) |
| 0x01 | 1 | Flags |
| 0x08 | 1 | Magic byte (always 0xa5) |
| 0x20 | 4 | X coordinate (little-endian) |
| 0x24 | 4 | Y coordinate (little-endian) |

> [!WARNING]
> The coordinates are in some weird unit that's NOT millimeters. I think it's 1/1000th of an inch but honestly I'm not sure.

## Writing the Parser

Time to write some Python:

```python
import struct
from dataclasses import dataclass
from enum import IntEnum

class CommandType(IntEnum):
    MOVE = 0x80
    LASER_ON = 0x81
    LASER_OFF = 0x82
    HOME = 0x83

@dataclass
class LaserCommand:
    cmd_type: CommandType
    x: int
    y: int
    
    @classmethod
    def from_bytes(cls, data: bytes) -> 'LaserCommand':
        if len(data) < 0x28:
            raise ValueError(f"Packet too short: {len(data)} bytes")
        
        if data[0x08] != 0xa5:
            raise ValueError(f"Invalid magic byte: {data[0x08]:02x}")
        
        cmd_type = CommandType(data[0x00])
        x = struct.unpack('<I', data[0x20:0x24])[0]
        y = struct.unpack('<I', data[0x24:0x28])[0]
        
        return cls(cmd_type, x, y)

# Parse a capture file
def parse_capture(filename: str) -> list[LaserCommand]:
    commands = []
    with open(filename, 'rb') as f:
        while chunk := f.read(0x40):
            try:
                cmd = LaserCommand.from_bytes(chunk)
                commands.append(cmd)
            except ValueError as e:
                print(f"Skipping invalid packet: {e}")
    return commands
```

> [!DANGER]
> I'm pretty sure there's a checksum somewhere that I'm ignoring. This will probably cause issues.

## The Part Where It All Falls Apart

So I can parse the commands. Cool. Now I need to SEND them. This is where things went sideways:

```python
import usb.core
import usb.util

# Find the device
dev = usb.core.find(idVendor=0x1a86, idProduct=0x7523)

# This works
dev.set_configuration()

# This does not work
dev.write(0x02, command_bytes)  # Device hangs, requires power cycle
```

> [!INFO]
> Turns out the device expects a specific initialization sequence that I never captured because I started capturing AFTER the software was already running. Classic mistake.

## What I Learned

1. Always capture from device plug-in, not mid-session
2. Chinese datasheets translated by Google are... creative
3. Sometimes proprietary software exists for a reason
4. I should probably just buy a better laser engraver

The project sits in my graveyard of unfinished repos, hence the `failing` build status. Maybe someday I'll revisit it. Probably not.

```python
# TODO: Figure out init sequence
# TODO: Find the checksum algorithm  
# TODO: Test on actual hardware without bricking it
# TODO: Question life choices
```
