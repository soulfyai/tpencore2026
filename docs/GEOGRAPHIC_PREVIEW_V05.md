# 大台北地理與建築預覽 v0.5.0

Review entry: `greater-taipei-v0.5.0.html`. Street view: `?view=street`.

This is a separate preview. Production VERSION remains 2.0.18. Production HTML/CSS/logo dimensions and the frozen `preview-v0.4.0` archive remain unchanged.

## Geography

Both municipalities use one WGS84 local projection (origin 121.55°E, 25.05°N, 1.5 world units/km). Taipei's administrative polygon is subtracted from New Taipei, producing a real enclave rather than two islands. Landmark anchors use actual longitude/latitude. The shared mainland continues into Taiwan instead of turning the southern administrative boundary into a coastline.

Administrative polygons come from the repository's `data/geo.json`; no Google Maps imagery or tiles are copied. River courses, roads, facility placements, urban density and hill elevations are illustrative. They are not cadastral maps, DEM elevations, real street layouts or actual policy service locations. Eight small park ponds, bridges and policy campuses are designed scene elements. Correct Taipei place names 基隆河／基隆路 are retained.

The exported road network has one connected component, 493 shared edges and seven river crossings. Road surfaces are unioned once to avoid stacked asphalt/junction flicker. Taipei/New Taipei surfaces do not overlap.

## Architecture

32 structural families are available; 31 are used across 137 buildings in this scene. Examples include courtyard/L/H buildings, terrace towers, oval/cylindrical/triangular towers, glass atria, sawtooth workshops, barrel-roof markets, dome halls, fan theatres, stacked communities and garden villas. Structural variations change massing and wings, rather than just color or floor count.

A canonical occupancy signature at three height slices rejects exact silhouettes across both municipalities, ignoring facade color, absolute storey count and quarter-turn rotation. Same-family models are prohibited within roughly 6 world units; neighboring structural IoU is checked separately. This does not claim 137 hand-authored asset families: models share reviewed material/window components and structural families.

Policy campuses select compatible building types and add relevant facilities (track, playground, transit canopy, medical cross, food inspection market, water tanks). Full model bounds must fit inside the parcel. People/cars are retained. Flags are reanchored to the highest completed structure in each city.

## Rebuild and verify

```
python3 tools/build_geographic_preview.py
python3 tools/package_site.py
python tools/check_geographic_preview.py
```

Browser validation needs Playwright, Chromium and locally available Three.js 0.160.0. The test captures desktop/mobile default and street views while retaining native UI CSS. Weather fallback is allowed when offline.

The committed geographic export is validated against its source SHA256; CI does not need geographic libraries. Regenerate only when boundaries/layout rules change:

```
# Requires Shapely 2.1.x in your Python environment
python3 tools/export_geography_v05.py
```

Rollback/comparison: `previews/preview-v0.4.0/?view=street`, tag `preview-v0.4.0`, and checksummed `archives/preview-v0.4.0.zip`. v0.5 changes are isolated under new filenames and a staging builder.
