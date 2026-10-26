# v0.4.3 phone Full View

User reference: Taipei in the upper-left, New Taipei in the lower-right, both islands visible with generous sea around them. This applies to **Full View**, separately from the closer Taipei opening established in v0.4.2.

- `greater-taipei-v0.4.3.html?view=panorama`: directly review Full View.
- `greater-taipei-v0.4.3.html`: ordinary opening remains Taipei; use the existing phone menu's 全景 button or Home normally.

The camera uses actual retained two-island outlines. A 20° oblique pitch and a frame based on their combined width give a full view on a 392×697 stage: Taipei coast spans approximately x.03–.53/y.42–.55; New Taipei x.39–1.01/y.62–.77. Wider phone ratios receive an additional projection-based fit to keep shorelines in frame. No city placement, models, roads, lakes, logo dimensions or CSS are changed. In phone panorama only, the signs hover 10% lower so the Taipei sign clears the logo; their font/box dimensions and leader anchoring remain intact.

`mobile-panorama-v043.js` is used only for phone portrait panorama and panorama refitting on viewport resize. The original overview calculations continue to set label scale, lighting thresholds and maximum zoom, avoiding a new camera frame changing unrelated rendering. Desktop/landscape return the original panorama. The v0.4.2 phone Taipei opening and Home remain intact. Existing idle orbit/user-interruption behavior is preserved.

Builder: `tools/build_mobile_panorama_preview.py` copies v0.4.2, adds the camera helper, adjusts panorama/resize entry points and an explicit review query; it never overwrites previous entries. New metadata is `v043-version.json`.

Tests: `node tools/check_mobile_panorama.mjs` checks projected shore bounds across phone ratios and unchanged desktop/landscape. `tools/check_mobile_panorama.py` checks the real phone view, normal Full View menu, exact v0.4.2 Home return, hidden policy bubbles in panorama and city-sign clearance from the logo, and captures the actual frame. Prior page/style/logo hashes and production homepage are preserved during packaging.
