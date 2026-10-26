# v0.4.2 phone opening frame

Entry: `greater-taipei-v0.4.2.html` (no view parameter).

The user's reference shows a close, diagonal Taipei-wide composition with sea below the logo, 101 in the middle/right and most streets in the lower half. The previously supplied v0.4.1 `?view=street` link instead intentionally starts on a street close-up, while its ordinary city frame is substantially farther away.

This camera-only preview builds from v0.4.1. In portrait stages up to 600px wide, the Taipei city frame uses a -25° orbit and 0.56 distance factor, with aspect compensation. A four-iteration camera/target translation places the rendered 101 base near normalized (0.60,0.68), retaining relative geography/building placement. The source anchor is the actual art model, not the older native landmark proxy. The resulting shoreline and prominent tower are framed in the reference's direction. This is a composition match, not a claim of pixel-identical rendering across browser chrome, aspect ratios and day/night modes.

The same cityFrame is used on startup, Taipei selection and Home. User orbit/pan/zoom remains free. Instructions retain their original flow. Desktop/landscape and New Taipei cityFrame return their original v0.4.1 values. Explicit `?view=street` retains the separate street-review camera. Time controls, styles, logo sizes, land, roads, lakes, policies, architecture and production homepage remain unchanged.

Implementation: `prototypes/mobile-opening-v042.js` is inserted into a new HTML copy by `tools/build_mobile_opening_preview.py`, which preserves the v0.4.1 entry and records its hash in `v042-version.json`.

Validation:

- `node tools/check_mobile_opening.mjs`: several portrait aspect ratios preserve the intended 101 composition; desktop, landscape, New Taipei and input frames are unchanged.
- `python tools/check_mobile_opening.py`: real phone context with touch/viewport, normal instructions dismissal, actual 101 anchor projection, Home return and rendered screenshot.
- Packaging checks preserve all prior entry/archive hashes and style blocks. Publication adds a new review page only.
