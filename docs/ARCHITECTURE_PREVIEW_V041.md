# v0.4.1 — building diversity on the v0.4 map

Current review: `greater-taipei-v0.4.1.html`, optional `?view=street` or `?view=street&city=newtaipei`.
Actual-model catalog: `architecture-v041-types.html` (rotate/zoom/select each of 24 types).

The user returned to v0.4.0 after rejecting the v0.5 geographic experiment. This version changes ordinary street architecture only. Two islands, policy parcels, landmarks, eight existing highrise types, roads, lakes, boats, pedestrians/vehicles, native UI and logo proportions stay on the v0.4 baseline. No v0.5 geographic projection, mainland, river/road graph or rural layout is used.

## Visible building changes

The old `detail-street-elements.js` reused the same apartment body for all ordinary houses. Changing color, height and shop names did not provide enough structural variety.

`architecture-v041-catalog.js` supplies 24 different massing families: courtyard, round-corner hotel, stepped garden, brick market, barrel library, art deco, oval balconies, paired gables, ribbon offices, sawtooth workshop, clock hall, fan theatre, glass atrium, zigzag housing, horizontal balconies, chamfered corner, loft warehouse, butterfly gallery, reading colonnade, stacked community, dome hall, arc shopping, brick courtyard and sloping eco office.

The city contains 80 ordinary street buildings (43 Taipei / 37 New Taipei). Each receives a unique normalized mass descriptor; variants alter the body/wing/roof arrangement rather than relying on paint or floor count. A balancing allocator prohibits the same family within 48 art units in the same city. Components/materials are intentionally shared; this is not a claim of 80 separately sculpted models or zero shared elements. The previously approved policy campuses, highrises and landmarks are deliberately retained.

Facades use several systems, including arched windows, framed bays, full-width balconies, curtain walls, fins, timber bands and columns. Roofs include tile texture, glass barrel ribs, solar equipment and planted terraces. Full model bounds include shop fronts, planters, benches and entrance paving, and must fit within the existing parcel. Adjacent ordinary-building bounds must not overlap.

## Isolation and verification

`tools/build_architecture_preview.py` stages the original v0.4 builders and swaps only the street factory; it writes new `v041-*` assets and entry files. `v041-art-data.json` must be byte-identical to the original v0.4 art data. Original modules and frozen archive remain untouched.

- `tools/check_architecture_preview.py [--no-screenshots]`: actual WebGL load, all 24 types, unique mass descriptors, neighbor spacing, exact layout data, nonoverlap, parcel containment, 26 themes / 118 source items, 89 people / 26 cars per city, preserved forest and exact native CSS; desktop/mobile street captures.
- `tools/check_architecture_catalog.py`: actual 24-model gallery plus close-up captures.
- `tools/check_taipei_roads.mjs`: existing continuous, nonoverlapping street union.
- `tools/package_site.py`: adds separate preview files; production `VERSION` stays 2.0.18 and production homepage remains byte-identical.

Immutable reference: `/previews/preview-v0.4.0/?view=street` and tag `preview-v0.4.0`. Do not overwrite that archive. Publish this review through the existing Pages site under the new v0.4.1 filename; do not replace `tpencore.tw`'s homepage.
