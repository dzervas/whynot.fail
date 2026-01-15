---
title: "Building a Mechanical Keyboard from Scratch"
date: 2024-01-20
tags: ["hardware", "electronics", "diy"]
categories: ["hardware"]
build_status: "passing"
writer: "dzervas"
description: "From PCB design to firmware - a complete custom keyboard journey"
---

After years of using off-the-shelf keyboards, I finally did it. Designed and built my own 60% mechanical keyboard. It only took 6 months, 3 PCB revisions, and several hundred dollars more than just buying a nice keyboard.

Worth it? Absolutely.

## The Design

Started with KiCad for the PCB design. Here's the basic schematic for a single key:

```
          VCC
           |
          [R] 10K
           |
    +------+------+
    |             |
   [SW]          COL
    |
   ROW
```

> [!INFO]
> This is a basic matrix scanning setup. The diode (not shown) on each switch prevents ghosting when multiple keys are pressed.

## Bill of Materials

| Component | Quantity | Source | Cost |
|-----------|----------|--------|------|
| Cherry MX Blues | 61 | AliExpress | $25 |
| 1N4148 Diodes | 61 | LCSC | $2 |
| ATmega32U4 | 1 | Mouser | $8 |
| USB-C Connector | 1 | LCSC | $0.50 |
| PCB (5 pcs) | 1 | JLCPCB | $15 |
| Stabilizers | 4 | KBDFans | $12 |
| Keycaps | 1 set | Drop | $50 |
| Case | 1 | 3D Printed | $5 |

Total: ~$120 (plus the ones I broke learning to solder)

## The Firmware

Went with QMK because why reinvent the wheel:

```c
#include QMK_KEYBOARD_H

const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
    /* Base Layer
     * ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───────┐
     * │Esc│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │ 0 │ - │ = │ Bkspc │
     * ├───┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─────┤
     * │ Tab │ Q │ W │ E │ R │ T │ Y │ U │ I │ O │ P │ [ │ ] │  \  │
     * ├─────┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴─────┤
     * │ Caps │ A │ S │ D │ F │ G │ H │ J │ K │ L │ ; │ ' │ Enter  │
     * ├──────┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴────────┤
     * │ Shift  │ Z │ X │ C │ V │ B │ N │ M │ , │ . │ / │  Shift   │
     * ├────┬───┴┬──┴─┬─┴───┴───┴───┴───┴───┴──┬┴───┼───┴┬────┬────┤
     * │Ctrl│GUI │Alt │         Space          │Alt │ Fn │Menu│Ctrl│
     * └────┴────┴────┴────────────────────────┴────┴────┴────┴────┘
     */
    [0] = LAYOUT_60_ansi(
        KC_ESC,  KC_1,    KC_2,    KC_3,    KC_4,    KC_5,    KC_6,    KC_7,    KC_8,    KC_9,    KC_0,    KC_MINS, KC_EQL,  KC_BSPC,
        KC_TAB,  KC_Q,    KC_W,    KC_E,    KC_R,    KC_T,    KC_Y,    KC_U,    KC_I,    KC_O,    KC_P,    KC_LBRC, KC_RBRC, KC_BSLS,
        KC_CAPS, KC_A,    KC_S,    KC_D,    KC_F,    KC_G,    KC_H,    KC_J,    KC_K,    KC_L,    KC_SCLN, KC_QUOT,          KC_ENT,
        KC_LSFT,          KC_Z,    KC_X,    KC_C,    KC_V,    KC_B,    KC_N,    KC_M,    KC_COMM, KC_DOT,  KC_SLSH,          KC_RSFT,
        KC_LCTL, KC_LGUI, KC_LALT,                            KC_SPC,                            KC_RALT, MO(1),   KC_APP,  KC_RCTL
    ),
    
    /* Function Layer */
    [1] = LAYOUT_60_ansi(
        KC_GRV,  KC_F1,   KC_F2,   KC_F3,   KC_F4,   KC_F5,   KC_F6,   KC_F7,   KC_F8,   KC_F9,   KC_F10,  KC_F11,  KC_F12,  KC_DEL,
        _______, _______, KC_UP,   _______, _______, _______, _______, _______, _______, _______, KC_PSCR, KC_SCRL, KC_PAUS, _______,
        _______, KC_LEFT, KC_DOWN, KC_RGHT, _______, _______, _______, _______, _______, _______, KC_HOME, KC_PGUP,          _______,
        _______,          _______, _______, _______, _______, _______, _______, KC_MUTE, KC_VOLD, KC_VOLU, KC_END,           KC_PGDN,
        _______, _______, _______,                            _______,                            _______, _______, _______, _______
    )
};
```

> [!WARNING]
> Flashing the wrong firmware can brick your microcontroller. Always double-check your target before hitting flash!

## PCB Manufacturing

Sent the Gerbers to JLCPCB:

```bash
# Generate Gerber files from KiCad
kicad-cli pcb export gerbers \
    --output ./gerbers/ \
    --layers F.Cu,B.Cu,F.SilkS,B.SilkS,F.Mask,B.Mask,Edge.Cuts \
    keyboard.kicad_pcb

# Generate drill files
kicad-cli pcb export drill \
    --output ./gerbers/ \
    keyboard.kicad_pcb

# Zip them up
cd gerbers && zip ../keyboard-gerbers.zip *
```

> [!NOTE]
> JLCPCB accepts KiCad files directly now, but generating Gerbers manually gives you a chance to inspect them in a viewer first.

## Assembly Tips

Things I learned the hard way:

1. **Solder the diodes first** - They're the smallest and hardest to reach later
2. **Test each row/column before soldering all switches** - Finding a cold joint under 61 switches is not fun
3. **Use flux** - Seriously, flux makes everything easier
4. **Hot air station > soldering iron for SMD** - The ATmega32U4 has a lot of tiny pins

```python
# Quick test script for matrix scanning
import serial
import time

ser = serial.Serial('/dev/ttyACM0', 9600)
time.sleep(2)  # Wait for Arduino reset

print("Press keys to test matrix...")
while True:
    if ser.in_waiting:
        data = ser.readline().decode().strip()
        row, col = data.split(',')
        print(f"Key pressed: Row {row}, Col {col}")
```

## The Result

After all that work, I now have a keyboard that:
- Types letters (revolutionary!)
- Makes satisfying clicky sounds
- Impresses exactly zero non-keyboard people
- Cost 3x what a comparable keyboard would have
- Is MINE

> [!INFO]
> The total build time was about 20 hours spread over 6 months. Most of that was waiting for parts from China.

Build status: **passing** - because it actually works and I use it every day. That's rare for my projects.

Next up: split ergonomic version. I've learned nothing.
