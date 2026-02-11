# Frontend Guide: Lateral Beam Shift Simulator

## Purpose
This frontend visualizes lateral beam displacement through a parallel plate at a fixed angle of incidence (AOI) of 45 degrees.

It is a single-page app with no build step:
- `index.html` defines UI and page copy
- `app.js` computes geometry and renders to `<canvas>`

## What This Simulator Shows
- Input beam enters the plate at 45 degrees AOI
- Beam refracts inside the plate using Snell's law
- Emergent beam is parallel to incident beam (air -> plate -> air)
- The app reports lateral beam shift in mm

Important:
- This is **not** a wavelength-shift simulator.
- Output is spatial shift (beam displacement), not spectral shift.

## Inputs
- Refractive index `n`: `1.0` to `2.5`
- Thickness `t` (mm): `0.3` to `10.0`

Both slider and numeric inputs are synchronized.

## Formula / Physics Model
Core model in `app.js`:
- Snell: `sin(r) = sin(i) / n`
- Fixed incidence: `i = 45 deg`
- Thickness is measured along the surface normal
- Lateral shift is measured perpendicular to beam direction

Equivalent closed form:

`shift = t * sin(i - r) / cos(r)`, with `r = asin(sin(i)/n)`

## Rendering Notes
- Canvas size is intentionally compact (`640 x 380`) for focus.
- Internal draw scale is fixed (`6 px/mm`) and not user-configurable.
- Shift is highlighted by:
  - dashed guides from rays
  - orange double-headed arrow
  - numeric label on arrow

## Quick Local Run
Open `index.html` in a browser.

No package manager, bundler, or server is required for basic use.

## Manual Verification Checklist
When making frontend changes:
- Change `n` and confirm shift changes smoothly.
- Change `t` and confirm shift grows approximately linearly.
- Confirm thickness is clamped to `0.3` to `10.0` in UI and runtime.
- Confirm the orange shift marker remains visible and aligned.
- Confirm context/help text still matches behavior.
