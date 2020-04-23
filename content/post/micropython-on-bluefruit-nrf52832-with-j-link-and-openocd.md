+++
build = "passing"
date = 2020-04-22T21:00:00Z
draft = true
image = ""
tags = ["notes", "hardware"]
title = "MicroPython on Bluefruit NRF52832 with J-Link and openocd"
url = "notes/micropython-on-nrf52832-with-openocd"
writer = "dzervasg"

+++
First of all, lets flash Adafruit's NRF52 bootloader for easier future flashing

My J-Link was "Broken. No longer used" - or so the JLink tools said (AKA bought from e-bay). So I had to go to [openocd](http://openocd.org)).

Connect the J-Link (or any SWD capable debugger supported by openocd - even an FT232 breakout will do) to the target - I have a Bluefruit by Adafruit.

    git clone https://github.com/adafruit/Adafruit_nRF52_Bootloader
    cd Adafruit_nRF52_Bootloader
    make BOARD=feather_nrf52832 all
    FIRMWARE=lib/softdevice/s132_nrf52_6.1.1/s132_nrf52_6.1.1_softdevice.hex
    sudo openocd -f board/nordic_nrf52_dk.cfg -c init -c "reset init" -c halt -c "nrf5 mass_erase" -c "program $FIRMWARE verify" -c reset -c exit
    FIRMWARE=_build/build-feather_nrf52832/feather_nrf52832_bootloader-0.3.2-28-g79a6a0c-nosd.hex
    sudo openocd -f board/nordic_nrf52_dk.cfg -c init -c "reset init" -c halt -c "program $FIRMWARE verify" -c reset -c exit

**NOTE**: `nrf5` command was missing from my package manager's `openocd` and I needed to install the git version!

Now the bootloader should be flash and we're able to flash over serial from now on! Lets flash micropython (I advise not flashing master but a stable tag)

    git clone https://github.com/micropython/micropython
    cd micropython/ports/nrf
    ./drivers/bluetooth/download_ble_stack.sh
    make BOARD=feather52 SD=s132 FROZEN_MPY_DIR=freeze all
    pip install --user adafruit-nrfutil
    adafruit-nrfutil dfu genpkg --dev-type 0x0052 --application build-feather52-s132/firmware.hex firmware.zip
    adafruit-nrfutil dfu serial --package firmware.zip -p /dev/ttyUSB0 -b 115200

Done!

    dzervas nrf> miniterm.py --raw /dev/ttyUSB0 115200
    --- Miniterm on /dev/ttyUSB0  115200,8,N,1 ---
    --- Quit: Ctrl+] | Menu: Ctrl+T | Help: Ctrl+T followed by Ctrl+H ---
    MicroPython v1.12-dirty on 2020-04-23; Bluefruit nRF52 Feather with NRF52832
    Type "help()" for more information.
    >>>