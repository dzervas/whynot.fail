---
writer: dzervas
build: passing
date: "2019-10-20"
tags:
- factory
- 3D-printing
- ender-3
url: /factory/plastic-v02
title: Chinese Factory v0.2 - Plastic À La Crème
image: /img/factory/plastic-v02/image.jpg
---

Take a breath, sit back and think: Why the fuck not spend some money instead of
endless, painful hours? You don't have money ok, ok, but what if you... *WAIT*.
Wow, a new world, 3D printing, ACTUAL 3D printed hollow cubes that I PRINTED.
Oh wait, is that smoke?

<!--more-->
---

Welcome ladies and gentlemen on another miserable and painful part oooooof
*drumroll* the CHINESE FACTORY!!! Starring:
 - Tears
 - Anxiety
 - A Creality Ender 3 3D Printer kit that I got from gearbest
 - 1 month waiting
 - Smokey electronics

This time, I thought I knew, once I again. That I learned from my mistakes. If
you don't know what I'm talking about, check [this](/factory/plastic-v01) out. It
was time to buy my first, whole, kit 3D printer. Backed by a very big community,
Ender 3 by Creality was a very good shot. Everyone was astonshed by the results
that this baby could achieve. Medium printing speed, medium noise, but the
object was very nice. I also ordered with it TWO BlTouch clones. Not one (couse
I knew), but TWO. Noice.

{{< figure
	src="/img/factory/plastic-v02/waiting-the-order.gif"
	caption="Me waiting for a month my order to arrive"
>}}

I saw a couple youtube videos, just to be sure and get some tips, but the build
process was pretty simple. They nagged that it lacked a step or two or a screw,
but with my experience on the Rostock Mini and the Prusa i3, I couldn't even get
why they were nagging. I had spares of everything: nuts, bolts, motors, drivers,
boards, beds. I was fairly sure that as soon as something goes wrong (cause I was
FAIRLY sure about that), I'll be able to replace it. The device even came
pre-flashed! I didn't even have to fiddle with Marlin! What I was missing all
these years...

## First prints

After I put everything together, I turn on the machine, I select a pre-sliced
model and I hit print. AND IT PRINTS. The bed was a bit off. BUT IT PRINTS.
I tried not to cry cause that shithole that I called home would flood in an
instant and burn my printer.

Ok, everything works, I level the bed a bit and I fire up Cura for some serius
(meh) shit: my first useful model. A little [ventring](https://www.thingiverse.com/thing:2912394)
to cool the parts all around the hotend. And it prints it smooth as fuck.
I just couldn't believe it... I had a working 3D printer!

{{< figure
	src="/img/factory/plastic-v02/ventring.jpg"
	caption="Ventring is loading :D"
>}}

So now, lets mount the BLTouch. I start printing the model, but somehow, I
forgot that the silver "ear" of the paper clip holding the bed is open on the
left side of the bed. And it gets stuck on the Z axis. And before I know it,
the cable connecting the controller to the screen is orange-ish and the
controller is smoking a pack of Marlboros...

I turn off everything, I panic and I'm just staring at the black aluminum brick
that I had in front of me...

## The Controller Fix

I plug the printer again, to see what the damage was: XYZ and the screen were
dead. Everything else seemed fine. Thermistors, heaters, extruder, all fine.
The screen was completely optional to me, as I ran the printer via USB, so the
real problem was XYZ. Debugging was officially in progress...

{{< figure
	src="/img/factory/plastic-v02/ender-3.jpg"
	caption="You can see the \"ears\" of the clips on the left and right side of the bed - moments before the disaster"
>}}

I was pretty sure that the stepper controllers were fried. They are fragile and
it happens. Problem was that they were soldered on the PCB. BTW, a quick note:

> Dear 3D printing community,
> 
> That's enough. PLEASE understand that the 3D printing controllers break. A lot.
> Removable microcontrollers and stepper drivers, are NOT optional.
> I know you like overselling AVR based crap at $100+, but that's enough.
> Those things lack even the most basic protections.
> Overcurrent, overvoltage and reverse voltage protections to MCU input/output,
> especially when dealing with stepper drivers, missing? For real? FUCK. OFF.
> No 24v support? FUUUUCK. OOOOOFF.
> Not breaking out unused GPIOs? FUUUUUUUUUUUUUCK. OOOOOOOOOOOOOOOOOFF.
> 
> Thank you.

After I was done panicing and crying over my dead printer, I remembered that
I know how to wield a soldering iron. So I found the pinouts of the Creality
"Melzi" board and scratched the traces (to expose some copper and solder on it)
of `dir` & `step` to break out the pins and hook them on the backup stepper
drivers that I had. I quickly soldered a circuit on protoboard
(with solder bridges) to have a nice pinout and hooked the board on it.

{{< gallery >}}
	{{< figure
		src="/img/factory/plastic-v02/pcb-steppers-broken-out.jpg"
		caption="Here you can see the craftmanship that went into breaking out the stepper motors' pins..."
	>}}
	{{< figure
		src="/img/factory/plastic-v02/custom-stepper-pcb-front.jpg"
		caption="Front side of the custom stepper motor PCB"
	>}}
	{{< figure
		src="/img/factory/plastic-v02/custom-stepper-pcb-front.jpg"
		caption="Back side of the custom stepper motor PCB"
	>}}
{{< /gallery >}}

Nope, XYZ still dead. Ugh...

The logic analyzer kindly explained to me that the pins coming from the MCU,
were dead - this happens when you feed weird stuff to AVR (e.g. over 5v). They
don't die, they give away that specific pin, they are very tough...

Well ok, that's fine, I had a lot of spare pins in the screen
connector, now unused. The idea was to remap the step/dir pins to them. That
was fairly easy, as I had hooked the whole lanes from the PCB to the steppers,
without cutting any traces. After some pain to understand which screen pin
is which, I finally did it :) I changed which MCU pins talk to the stepper
drivers.

It was alive :)

## The Rabbit Hole Exhaustion

After that incident, about a year passed and I don't know why I left the printer
on the side. I had fiddled with it too much, I did stuff that where not
neceserry. I tried to switch to RAMPS 1.4, but had problem with the heating
elements not heating enough, even after cutting the D1 diode
(spoiler: it was the polyfuse), I switched to klipper from Marlin and broke the
printer into two boards etc. etc. I didn't get to print anything at that point.
Always something was problematic and didn't let me print.

## The Slap

About a year passes and I get a girlfriend. I tell her that I have a 3D printer
that is currently in an unknown state. She was AMAZED and asked me why I don't
fix it. That was it. That was the slap that I needed to get back in track and
fix the damn thing. When a partner gets excited about a nerdy thing you don't
let neither the parter nor the thing go. You just hold on to what you do. Until
they orgasm. Or until you orgasm. Or both. Or until you finish the project (lol).
Anyway...

I ordered a replacement board. Gearbest gave me $50 off and I got a new official
Creality board for about $20 more. Kinda stupid move as the price was insane
(70$ for an arduino with 4 stepper drivers), I know, but I couldn't get back to
the rabbit hole again...

I hook it up, I hook up the BLTouch and *BOOM*. It works... and unbelievably
silent. A quick google search showed my that I luckily upgraded to TMC drivers
that are extremely silent. The only noise was the fans! Wow...

## The Happy Ending

After some playing around and overcoming some difficulties:
- `G28` negates bed leveling, you need a Marlin setting to fix that
- Probe X/Y offset settings are not for fun, the bed mesh is shifted
- Teflon tube on the hotend goes ALL the way down to the heatblock
- PLA pieces can get into the hotend fan and stop it ([and we know what that means](/factory/plastic-v01))
- PLA and PLA+ are not the same
- Ender 3 plastic extruder is trash - get the aluminum one
- Glass bed with carbon finish is amazing - well worth the 20$
- OctoPrint is quite neat & it can send you image notification on Telegram

{{< figure
	src="/img/factory/plastic-v02/print-successful.jpg"
	caption="Example of successful print! :) The design was a bust, but who cares"
>}}

The printer was actually fine. It still prints very nicely! I've print several
stuff for home and the GF even got the handle of [tinkercad](https://tinkercad.com)
and designed & printed some stuff!

[WhyNot.Fail](https://whynot.fail) is not only about fails, but for success
stories too, as 99% of the time they include massive failures.
