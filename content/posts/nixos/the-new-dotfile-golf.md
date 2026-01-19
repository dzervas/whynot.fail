---
date: 2024-08-10T00:00:00
draft: false
url: /nixos/the-new-dotfile-golf
tags:
  - nixos
  - linux
  - nix
writer: dzervas
build_status: passing
image: /images/notion-7d2a4e0e-192e-479d-803b-2f78843e00e3-42c260c3-5398-4b7d-b076-b4408f8a128d.webp
title: Nix/NixOS is the new “dotfiles golf” - and that’s awesome
---
For the past month I’ve been transitioning to NixOS, both my work laptop and my personal desktop.

It’s been an amazing voyage. The learning curve is steep for the first 1-2 days, till you grasp the whole idea but then that’s mostly it.

The language syntax is a bit weird and ugly but it really is quite simple - and I say that with 0 background in math or functional languages.

You quickly learn that “RTFM” is not a thing in Nix since there’s no manual and the tools at your disposal are [grep.app](http://grep.app) to see what others did (though due to the frequent changes in how stuff work could mislead you) and the [NixOS forums](https://discourse.nixos.org) which is amazing.

The question that arises before you even consider scrapping what you’ve been building for the past N years is “why? yea all the hipsters use it but WHY?”

I was very resilient too since every month or so something new and shiny comes up that nobody asked for, everyone around you loses their mind about it and 2 weeks later it’s abandoned.

welp, I have 2 extremely solid reasons: reproducibility and stability

## Stability

The idea in NixOS is that your whole OS is split in configurable and non-configurable parts. The configurable is managed by the `configuration.nix` file. The non-configurable is most probably files under your home directory, like browser files regarding your sessions n stuff that doesn’t make sense to configure statically.

Stability comes from the fact that after you change your `configuration.nix` you have to `rebuild` and then `switch` to the new generation for it to take effect. Every time you `rebuild`, a new “version” of your whole OS (only the managed part, the rest remain intact) gets created and `switch`ing to it activates it.

That means that you’re able to do something magic: <u>**rollbacks**</u>. Did you break your fstab? Boot to the previous working generation and you’re good to go! Did the latest update break your browser? rollback! The boot manager is configured to give you a choice of the last N generations so you just pick what you want - THAT easy, no weird arcane magic.

## Reproducibility

That leads us to the second amazing feature: reproducibility.

I know that everyone talks about it when nix comes in the discussion but it does actually affect you, it’s not just a “good principal”.

Imagine being sure that your hacky script that logs you into your machine with port knocking works EVERY time - and when I say every time, I mean it. If the module (aka piece of nix code) that configures it compiles, it WILL work. Just formatted? it works. Moved from i3 to Plasma 6 and btrfs? it works.

It really empowers you and gives a much greater pleasure into optimizing small aspects of your desktop since you know that they’ll be there for quite a long time and are much harder to randomly break.

## Golfing

So that brings us to this post’s title: dotfile golfing.

The dotfiles now hold a much greater power. It’s super easy to set up and keep 2 machines in sync. Just define some host-specific quirks for each machine (e.g. a desktop doesn’t need `laptop-tools` ) and you’re good to go.

That has led all the people with weird setups (⇒ people that have a `dotfiles` repo) to have a much, MUCH better experience. They don’t have to keep track of what they install and how so that they can set up the whole thing again.

Sets of dotifile hacks are now their own “packages” (flakes in nix world) that anyone can use - [stylix](https://stylix.danth.me/) for example, which tries to do the impossible: make the theming/styling consistent across the whole OS, from NeoVim to GTK to Plymouth, all with the same colors and wallpapers.

## Bonus

You also get the following amazing features as a bonus:

Formatting has become way, WAY easier. After setting up the partitions in a new machine, `nixos-install --flake github.com:dzervas/dotfiles` will set up the new machine. The next reboot will have everything ready for me - yes even that port knocking script - honestly the biggest hurdle when setting up a new machine after your nix config has stabilized is logging in to every service & website you use

You can even create an ISO with your whole config ready to go with GitHub actions (as I did [here](https://github.com/dzervas/dotfiles/blob/main/.github/workflows/iso.yaml)) so you can work on a new machine without even formatting. Boot the ISO and do whatever needs doing. My work laptop is now officially disposable!

---
My nix config: [dotfiles](https://github.com/dzervas/dotfiles)

