---
date: 2023-03-25T00:00:00
url: /reversing/fusion-360-internals
tags:
  - reversing
  - windows
writer: dzervas
build_status: failing
image: /images/notion-0c84cb3e-b45c-4163-aa77-3bc1a74f515b-DALLE_2023-03-25_18.11.05_-_add_a_small_door_under_the_logo_that_shows_entry_into_a_steampunk_coding_world.png
title: 'Fusion 360 Internals: Trying to re-invent Fusion’s GUI (and failing)'
---
This is one of those weird ones where I try to do something batshit crazy and I end up inevitably failing. It was almost too clear that this is gonna be the path but I needed something to hyperfocus on to have some stress-free moments.

This is how I tried to use only the engine/rendering canvas of Fusion and re-implement the whole GUI around it from scratch (toolbars, browser, history bar, etc.).

# Wait what? What do you mean? Why? What?

Ok so let’s take it from the top. I love Fusion’s UX. It’s amazing. Everything is where it should be and stuff just work as you expect them. It does some weird fuckery when you try to direct model (organic handles, mouse shells, etc.) but it’s not the point of the software anyway. And almost nobody can rival it in my eyes. I’ve tried Solidworks, OnShape, BricsCAD, FreeCAD, Solid Edge, SolveSpace, Rhino 3D with Grasshoper. I’ve tried it all. I’ve seen it all. I’m dissapointed.

“Awesome, where’s the problem”, I can hear you say.

Linux. The problem is Linux. Running Fusion on Linux is… shitty. While [cryinkfly has done an amazing work on the matter](https://github.com/cryinkfly/Autodesk-Fusion-360-for-Linux), it’s not good enough for me. Crashes, glitches, overlayed artifacts across all workspaces and in general it makes the app quite cumbersome. It kills the UX.

So there were 3 solutions to that problem:

 - ~~Pivot to Windows~~ - nope, I prefer to leave computers behind
 - Windows VM - It sucks, it’s slow and it also sucks
 - Hook Fusion using frida to fix the artifacts/problems (and maybe give the solutions to Autodesk almost ready to implement) - too hard, too specific and too fragile. An update could render my whole work useless
 - Fix wine - it’s actually the best solution as it will benefit more apps. But I thought it would be harder (little did I know…)
Instead, I chose the 4th (5th?) option: Use the “hard parts” of Fusion by re-write the GUI as an open-source shell. Sure it would require “some” reversing but at some point I could have a Window with JUST the Canvas in it (where the 3D objects are drawn).

Before I let you know my evil plan (according to Autodesk I imagine), let’s talk a bit about the guts of Fusion

# Fusion 360’s GUI internals

Fusion is written completely in Qt 5, start to finish. At the time of writing (25 March 2023) it uses Qt 5.15.2, the upstream LTS version.

They use MANY of Qt’s features and every component is written in a different “Qt manner”. Is the whole app a Qt demonstration? I guess we’ll never know…

 - The whole window is a `QGuiApplication` window
 - The top toolbar and the botton design history bar are regular `QWidgets`, buttons, labels, icons, tooltips and the rest
 - All the sidepanels and overlays (Learning Center, Data Panel, Browser, Comments and Notification Center) are all HTML/CSS/JS that run inside different `QtWebEngine`s with a custom [CEF](https://github.com/chromiumembedded) that gives access to the JS→C++ bridge. That bridge is called `FermontJS` and talks with the `Neuron` engine BTW
 - I have no idea where, but QtQuick is involved somwhere
 - The main “viewport” or `Shell` as Autodesk calls it (the main gray window that 3D stuff appear) is something… weird. Something very weird. It’s a class inside the `NuBase10.dll` that is called `Nu::GraphicsCanvas`
The last bit is what we’re looking for. The `QtWidgets` parts can be re-written. The toolbar is dynamically generated based on some XMLs, the design history is by definition programmatically populated, HTML/CSS/JS components are just in the installation folder for anyone to grab, `FermontJS` is just a node script and `Neuron` can be run in its own process (I think???).

Not easy to do all that but certaintly doable.The hard part would be that damned `GraphicsCanvas`. It has many other names, `Canvas`, `QtCanvas` (sub/super classes) but its the same damned thing. If I could make an instance of it on its own window it would prove that I can actually run the part of Fusion that handles the CAD engine and renders what the user sees.

# How would that help you with wine?

The plan for the “final form” of the project was:

 1. Wrap the required DLLs using winelib
 2. Dynamically link against them a Rust binary that:
 3. Cross-compile that binary for every platform
 4. Create an installer that pulls the required DLLs so that Autodesk won’t cry us a river for “redistribution”
Not an easy project but kiiiiiinda, maaaaaybe doable.

# So what’s the problem(s)?

First of all, the `GraphicsCanvas` ain’t “just a `QtObject`”. At all. It’s too intertwined with commands, threads, events, `Shell`s, `Workspace`s, etc. for me to figure out. I just don’t get it. Couldn’t they just wrap a `QOpenGLWidget` or a `QSurface` and be done with it? Apparently not…

While they DID do both of the above, they also did sooooooo much more beyond that that my reversing skills started laughing hysterically - and not the good kind of laugh, the “oh boy what the actual fuck is this” kind of laugh.

Even so, I thought to start throwing shit to the wall till something sticks. I see the canvas gone, or glitched, or (praying) in a separate window and I whipped out frida.

But frida seems to be as confused as me when dealing with C++ MSVC ABI when dealing with object instances on Windows. I just tried calling `QWindow(nullptr)::QWindow` from the `Qt5Gui.dll` and after that call `show()::QWindow`. Frida wouldn’t have me do my shit. Frida was done with me.

# And now?

This is the point where I give up. This might seem a small post but it took me a great 6 months to learn what I did. Did you know there’s a “Command Panel” in Fusion? Did you know that there’s a [github repo](https://github.com/kantoku-code/Fusion360_Small_Tools_for_Developers) just describing the commands in it? Did you know that you can dump the Qt tree of Fusion while its running?

Useful Fusion commands (Opened by File > View > Show Text Commands (Ctrl-Alt-C), all commands are Txt):

```python
TextCommands.List /hidden - Show all text commands
Options.DebugEnvironment /show - Show a debug environment, didn't see something interesting
Options.showAllCommands /on - ???
Options.showAllOptions - Make MANY preferences visible
Toolkit.DumpQt - Dump QT object info. [/styles] [/class] [/rect]
```

Also got to learn about C++ RTTI and vftables and that nothing can be compared to the hatred that I have for that FUCKING LANGUAGE THAT HELL GIFTED TO US.

REALLY. WHAT THE FUCK IS WRONG WITH YOU PEOPLE.

If someone is able to make a PoC that shows that indeed a Canvas can be drawn on its own (with some boilerplate), I’ll be more than happy to open this can of worms.

Also I re-implemented Fusion’s installer in python that also knows about Fusion’s build versions, [check it out](https://github.com/dzervas/fusion360-streamer).

C ya

