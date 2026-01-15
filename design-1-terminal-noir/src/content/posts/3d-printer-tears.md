---
title: "My 3D Printer Made Me Cry (Again)"
date: 2024-06-22
tags: ["3d-printing", "hardware", "failure"]
build_status: "unknown"
writer: "dzervas"
description: "A tale of layer shifts, spaghetti monsters, and existential dread"
---

It's 3 AM. I'm watching my Ender 3 slowly transform what should be a simple bracket into modern art. The kind of modern art that makes you question if the universe is just trolling you personally.

## The Symptoms

Started innocently enough. Print looked fine for the first 30 layers, then:

- Layer shift at layer 47
- Another shift at layer 89, opposite direction
- Extruder started clicking
- Spaghetti mode activated

> [!INFO]
> "Spaghetti mode" is what happens when your print detaches from the bed and the printer keeps going anyway, creating a beautiful mess of plastic noodles.

## The Investigation

Let's go through the usual suspects:

### Belt Tension

```bash
# My scientific method for checking belt tension
# (There's no actual command, I'm just venting)

1. Pluck the belt like a guitar string
2. Listen for a low "twang"
3. Question if that sounds right
4. Google "ender 3 belt tension frequency"
5. Find 47 different opinions
6. Give up
```

The belts seemed fine. Moving on.

### Extruder Issues

Opened up the extruder and found this:

| Component | Expected State | Actual State |
|-----------|---------------|--------------|
| Gear teeth | Clean | Full of plastic dust |
| Spring | Tensioned | Barely there |
| Arm | Intact | Cracked |

> [!WARNING]
> The stock plastic extruder arm is garbage. It WILL crack eventually. Just replace it with an aluminum one now and save yourself the debugging session.

### Temperature Tower

Ran a temperature tower to check for heat creep:

```gcode
; Temperature Tower Start
M104 S220 ; Start at 220C
G28 ; Home all axes
G1 Z5 F3000 ; Lift nozzle

; Layer 0-20: 220C
; Layer 21-40: 215C  
M104 S215

; Layer 41-60: 210C
M104 S210

; You get the idea...
```

Results were inconclusive. Everything printed "fine" except my actual part.

## The Solution (Sort Of)

After replacing:
- Extruder arm (cracked)
- Bowden tube (worn)
- Nozzle (clogged)
- My will to live (depleted)

The print... still failed. But differently! Progress?

> [!NOTE]
> I eventually discovered the SD card was corrupted. The gcode file had random bytes injected into it. Literal hours of debugging for a $3 SD card.

## Lessons Learned

1. Always verify your gcode file is intact
2. Keep spare parts on hand
3. The problem is never what you think it is
4. Sometimes the problem IS what you think it is, but also 3 other things

## Current Status

Build status is "unknown" because I'm too afraid to try printing that bracket again. It sits in my slicer, mocking me. One day I'll click print. One day.

> [!DANGER]
> If you're considering getting into 3D printing, know that it's 10% making cool things and 90% debugging why the cool thing turned into a plastic tumor.

The bracket was supposed to take 4 hours to print. I've now spent approximately 40 hours NOT printing it. This is fine.

```
  /\___/\
 (  o o  )  <- me, at 3 AM, watching layer 47
 (  =^=  )
  )     (
 (       )
  \     /
   )   (
  /     \
 ( (   ) )
  ""   ""
```
