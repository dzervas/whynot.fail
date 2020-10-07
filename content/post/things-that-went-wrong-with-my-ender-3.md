+++
build = "failing"
date = 2020-10-07T00:00:00Z
image = "/img/ender-3-sad.jpg"
tags = ["3D-printing", "ender-3", "rant", "factory"]
title = "Things that went wrong with my Ender 3"
url = "/factory/things-that-went-wrong-with-my-ender-3"
writer = "dzervas"

+++
Why is it that hard to 3D print across years? Why can't I have consistent printing experience, while not spending a kidney? I don't get it. Why is the machine constantly failing? I'm a computer guy, I know that human errors are all over the place but how does a machine break on its own so frequently. And don't get me wrong, it might be a budget Creality Ender 3 but it's proven to be a good machine and its components are not majestic. This is me... sad...

<!--more-->

It's not often that I'm deeply sad about technology. Most times I'm angry and I do dirty or too opinionated jokes about the subject and I'm feeling better. But at this point, I'm just sad. Today my printer broke again and I have to spent half its cost to fix it. I just want it to do what it was supposed to do, not something else, not hack it, not do it super fast or majestically. I just want to print plastic stuff for fun.

![This pupper is too reaching for its plastic toys](/img/sad-puppy.jpg)

# A list of things that went wrong

 1. After my first 2 prints, the bed clipper got caught on the right side of the frame, the stepper started skipping and the board was deep fried like a McNugget, one LCD wire was glowing orange for a moment. Result: LCD dead, board resuracted (too many hours)
 2. Couldn't get BLTouch clone work with Marlin as it had a bug or something? Result: Countless hours debugging
 3. Bed mesh generated with BLTouch was not in effect during printing - G28 was ruining it. Result: Countless hours debugging, went to Klipper
 4. A bit of plastic got into the hotend fan (not the part fan) and it stopped. The hotend overheated and the teflon inside it got too hot. Result: Got to undo the hotend and replace the teflon tube
 5. My raspberry pi (OctoPi) had some undervoltage problem (while being powered directly from a PC PSU), octopi was lagging and the prints were failing. Results: Many random failed prints, went to a proper x86 full blown server that was hanging around
 6. BLTouch accuracy is inconsistent - might be 0.03mm might be 0.1mm. Result: Countless hours debugging, never found the culprit. Gonna buy a new one from trianglelabs? I'm not paying \~60E for a probe
 7. My X gantry was tilted and first 1-2 layers were sometimes a bit off in the back vs front. Result: Bought dual Z system which is not very good
 8. Extruder started skipping (known Ender 3 plastic extruder problem). Result: Bought an aluminum one
 9. While the bed mesh was calibrating, BLTouch hit on a clipper and half of it came apart (after the rest of the BLTouch problems). Result: Me sad, continued to work exactly as before, even with the same accuracy
10. At some point, the temperature readings started being bonkers. could be constant 5 C (My room is never below 26). Tried several different thermistors, I think the MCU's pin is problematic. Result: Me absolutely terrified
11. After changing server the temperature problem was gone for quite long. But it came back after 2-3 power cycles (printer was unused for 2-3 months), and probably hotend MOSFET got overheated and died - when I turn up the temperature nothing happens, the PSU fan does not get noisy as it did. Result: Me writing this post and probably getting the SKR mini

![Expected result of my printer in the next 100 hours of tinkering with it. Send help](/img/nuke.jpg)

# Conclusion

After all these, for some reason I still think that Ender 3 is a piece of nice machinery and I suggest to any 3D printing enthusiast to get one. What I do not suggest is getting into 3D printing in the first place. It's a sad place where your dreams get brutally murdered and your 48 hour long print fails at the last hour or a small fire takes place.

I got the bug though, so I'll probably continue to have it as a "hobby" - frightened, anxious and sad. I wish you the best of luck.