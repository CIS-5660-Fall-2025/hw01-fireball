# Project 1: Fireball

I created a fireball effect - the fireball has a base shape that grows and resets over time, with noise-based displacement and spark effects.

## Features

- Base shape deformation that cycles between minimal and intense over time
- Multi-octave noise using fbm for surface detail
- Color gradient from yellow core to red edges
- Spark effects around edges
- Simple dark background with floating embers

## Controls

- Fire Size: Controls overall displacement amount
- Fire Speed: Adjusts animation speed
- Fire Intensity: Changes color brightness
- Reset: Returns all values to defaults

## Implementation

Used these functions:
- random
- mix
- smoothstep
- pow
- fract

The fireball combines:
- High-amplitude base deformation using sin/cos
- High-frequency fbm noise for detail
- Color gradient based on displacement
- Animated growth cycle (10s period)
- Added a dark background with floating ember effects for better atmosphere