# AGENTS: Frontend Contribution Notes

Scope: this file applies to frontend work in this repository.

## Project Shape
- Static frontend only
- Main files:
  - `index.html` (UI layout, text, styles)
  - `app.js` (math + canvas drawing)

Do not introduce backend assumptions in docs or code unless explicitly requested.

## Behavior Invariants (Do Not Break)
- AOI is fixed at 45 degrees.
- Model assumes air -> plate -> air.
- Reported result is lateral beam shift in mm.
- Thickness must remain constrained to `0.3` to `10.0` mm.
- Refractive index input range remains `1.0` to `2.5`.

## Formula and Units
- Use Snell's law as implemented:
  - `sin(r) = sin(i) / n`
  - `i = 45 deg`
- Thickness input is in mm.
- Canvas scale is internal; final displayed result must be in mm.
- Do not relabel this as wavelength shift unless spectral modeling is added.

## UI/UX Requirements
- Keep the diagram compact and focused.
- Preserve the context/help text blocks unless replacing with clearer equivalents.
- Keep shift marker explicit (guides + arrow + numeric label).
- Keep slider and number fields synchronized for each input.

## Editing Guidance
- Prefer minimal changes over broad rewrites.
- If changing physics logic, update both:
  - `FRONTEND.md` (human docs)
  - on-page context/help copy in `index.html`
- If adding new controls, include short helper text for each.

## Validation Steps After Changes
- Open `index.html` and verify:
  - all controls work
  - no NaN/blank result states
  - shift marker aligns with ray geometry
  - text labels still match actual behavior
