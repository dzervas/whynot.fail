---
writer: dzervas
build: failing
date: "2019-10-11"
tags:
- factory
- 3D-printing
- rostock-mini
- delta
title: Chinese Factory v0.1 - The Plastic
url: /factory/plastic-v01
image: /img/factory/plastic-v01/image.jpg
---

All I ever wanted, was a tiny Chinese factory inside my house. I’m not talking
about the people, suicidal thoughts or racism against Chinese people, I’m
talking about being able to make stuff. Quickly and effortlessly. So, instead of
paying a factory and waiting for a month, I'd like to pay 10x the cost and cry
myself to sleep, before I can get what I want. But it's a one time thing :)
(per machine).

After having so much stuff in mind, it was clear what was the first machine that
I needed: *angel voices* a 3D printer.

<!--more-->

Not only I wanted to make several dumb plastic stuff for the house (like a hanger,
soap holder, etc.) and enclosures for several hardware projects, but most
importantly: make OTHER machines. It's like the saying: Crack a hash and you'll
pwn 1 machine, learn to phish and you'll pwn the planet. So, it was clear
(although the saying is not), I NEEDED a 3D Printer.

I have had experience with a 3D printer and it was absolutely horrible:
Warped bed, 2 broken control boards (!) and more than 200 hours of debugging
and never been able to print anything but a 10x10mm hollow box. It was a Prusa i3.
What did I learned from that:

1. How a 3D printer works
2. EVERYTHING can and will go wrong
3. Auto bed leveling is not optional
4. Stepper motors & drivers are rather expensive (most likely the most expensive part on a printer)
5. Locknuts on heatbed help a lot (to keep it sturdy for longer times)
6. Only Thor can turn locknuts

I thank [tolabaki](https://tolabaki.gr) hackerspace for that. I even spent 2 nights
in a couch made from old computer cases for that printer (named Pamela), turned
out that wasn't enough, we needed money as well...

So after having learned that, you think I'd have an idea on where to head next,
for a successful 3D Printer. A ready kit that it's proven to work and has a wide
community? LOL NO. A FUCKING REPRAP DELTA PRINTER THAN NOBODY HAS EVER HEARD BEFORE.
I have no idea how I settled for that thing, really. Maybe the lack of money.
The printer I'm talking about is [Rostock Mini](https://reprap.org/wiki/Rostock_mini).

{{<
	figure src="/img/factory/plastic-v01/crowd-dissaproves.jpg"
	caption="You can see the raction of the 3D Printing community for my choice"
>}}

So, let's start gathering parts: [3DHubs](https://www.3dhubs.com/) for 3D printed
parts and eBay for everything else. Now great ideas started flying... Why get a
5mm carbon rod that the RepRap clearly references? I'll get a 6mm! Sure it'll work
the same! Order the printer base cut in CNC? Nah, lets gather everything else
and I'll just make some holes on a piece of wood. That fan for the all metal
E3D v5 hotend is optional, I'm sure.

Can see where this is going? Let's break down this disaster...

## The carbon rods

As this is a delta 3D printer, it uses some rods to hold the "effector". The
effector is the base that holds the hotend. It needs to be very lightweight,
as the motors are pretty far away and the only thing moving the whole construction
are GT2 belts. So a good idea is carbon fiber rods. The printer was designed for
5mm carbon fiber rods but I got 1m long 6mm OD carbon fiber rod and cut it by
hand.

{{< gallery >}}
    {{< figure
		src="/img/factory/plastic-v01/rostock-mini-carbon-rod.jpg"
		caption="The carbon rods - clearly cut by hand"
	>}}
	{{< figure
		src="/img/factory/plastic-v01/rostock-mini-broken-plastic.jpg"
		caption="The carbon rod mounts - clearly \"post-processed\" with a drill"
	>}}
{{< /gallery >}}

The rods where not of the exactly same length and 3D printing teaches you that
almost everything has to be precise as fuck. But that did not prove as huge of
a problem as the reality of 5mm vs 6mm holes for the rods on tiny plastic parts.
When I realised that, I tried drilling the holes. But the parts just broke (duh...).

So I went for the second best option: find a solution that does not involve cutting
the rod by hand and re-printing the small parts that the rods go in. [Kossel](https://reprap.org/wiki/Kossel),
that everybody knows and loves, uses some rods that are metal but are ready to
go. Their length was precise, they have bearings on their ends etc. They were
20cm instead of 15cm, but I calculated and saw that I'll just lose some printing
area, that was fine.

Months pass and the rods arrive. YEY! I try to fit them on the effector. NOOOO.
They go all over the place, as the bearings are much smaller than the original
printed part... Fuck...

So I got lock nuts, to hold them in place. That seemed to work, so let's move on...

## The CNC cut base

I was not able to find a CNC inside Greece and for some reason I didn't want to
use 3DHubs (maybe it had no support for CNC yet?). I thought that I'll be able
to get around it by using a piece of wood and make some holes. NOPE.

> 3D printing teaches you that almost everything has to be precise as fuck.

Uuugh... Some time passes and I finally find a CNC, right in my city, Heraklion.
YEYA. I cut the base DXFs in a CNC! YEYA!!! Wait, that doesn't seem right. The
holes are way off. No...

{{< figure
	src="/img/factory/plastic-v01/rostock-mini-base.jpg"
	caption="The base is clearly completely disoriented, as well as my workspace"
>}}

But STILL, I thought that this piece of crap might be able to work, so lets move
on...

## The E3D v5 "optional" fan

I have everything hooked on RAMPS 1.4, motors seem to work correct, endstops work,
heatbed works, hotend works. Lets try to melt some PLA. YEY IT WORKS!

I just play around for some time (less than an hour) and everything goes to hell.
I thought that currently I didn't need the PROVIDED fan that sits on the hotend,
as I was just testing... The nut that holds the PTFE (push fit nut?) had melted...

That was the last sign that I needed to let this project to the side, until I
get a proper 3D printer as a kit with auto bed leveling and a community to support
it...

Till then, I'll be crying in my shower, see ya!
