---
date: 2021-04-28T00:00:00
url: /notes/clear-nrf52-saved-bt-bonds
tags:
  - notes
  - hardware
  - microcontrollers
  - embedded
writer: dzervas
build_status: passing
title: Clear nrf52 saved BT bonds
---
Often the nRF52 micros get stuck or misbehave and reach a weird state with the pairings. Often the solution is just to clear them so here’s adafruit’s code to do that and a [platform.io](http://platform.io/) ini to make it easy.

`platformio.ini`

```bash
[env:clearbonds]
platform = nordicnrf52
board = particle_xenon
framework = arduino
```

The board can be any nrf52 board, it can be any generic board that uses the same chip that you actually have. For example `particle_xenon` uses nRF52840, so it can be used for any 52840 board. It might though not flash the correct LEDs, so just hook up the serial port.

`src/main.cpp`

```c++
/*********************************************************************
 This is an example for our nRF52 based Bluefruit LE modules
 Pick one up today in the adafruit shop!
 Adafruit invests time and resources providing this open source code,
 please support Adafruit and open-source hardware by purchasing
 products from Adafruit!
 MIT license, check LICENSE for more information
 All text above, and the splash screen below must be included in
 any redistribution
*********************************************************************/

/* This sketch remove the folder that contains the bonding information
 * used by Bluefruit which is "/adafruit/bond"
 */

#include <bluefruit.h>
#include <utility/bonding.h>

void setup() {
  Serial.begin(115200);
  while ( !Serial ) delay(10);   // for nrf52840 with native usb

  Serial.println("Bluefruit52 Clear Bonds Example");
  Serial.println("-------------------------------\n");

  Bluefruit.begin();

  Serial.println();
  Serial.println("----- Before -----\n");
  bond_print_list(BLE_GAP_ROLE_PERIPH);
  bond_print_list(BLE_GAP_ROLE_CENTRAL);

  Bluefruit.clearBonds();
  Bluefruit.Central.clearBonds();

  Serial.println();
  Serial.println("----- After  -----\n");

  bond_print_list(BLE_GAP_ROLE_PERIPH);
  bond_print_list(BLE_GAP_ROLE_CENTRAL);
}

void loop() {
  // Toggle both LEDs every 1 second
  digitalToggle(LED_RED);

  delay(1000);
}
```

