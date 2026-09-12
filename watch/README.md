# Watch demo

Interactive exploded reconstruction of the ETA/Unitas 6497-2 inside a 44 mm exhibition-style wristwatch shell.

## Current milestone

**M5d — geometry-constrained escapement contact.**

The watch is now substantially beyond a decorative exploded view. Crown winding creates persistent reserve; the keyless works separate winding and hand-setting modes; stored reserve gates runtime; reserve strength affects discrete escapement impulse; the balance carries a dynamic normalized amplitude state; and the Swiss lever escapement now derives its half-tooth release from reconstructed pallet/contact geometry rather than only from fixed fractions of a beat.

## Files

- `index.html` — current UI shell and import map.
- `style.css` — inspection-oriented overlay UI.
- `main-m5a.js` — current scene orchestration path; the historical filename is retained for cache/link continuity while the escapement import advances through milestone shims.
- `geometry.js` — constructive geometry vocabulary.
- `materials.js` — reusable metal, jewel, crystal, dial, leather, and gizmo materials.
- `lighting.js` — camera-aligned and movable inspection lighting.
- `movement.js` — movement/watch construction, functional assemblies, metadata and provenance.
- `train-m3g.js` — pitch, staff, bearing, endshake and wheel-body-clearance reconstruction.
- `winding-m4a.js` — crown/ratchet/click and stored-reserve state.
- `keyless-m4b.js` — stem modes and hand-setting path.
- `power-m4c.js` — energy/runtime gate, including reserve hold on escapement stall.
- `escapement-m5b.js` — event-resolved Swiss lever geometry and pallet/safety diagnostics.
- `escapement-m5c.js` — normalized damping, reserve-dependent impulse packets, amplitude state, unlock threshold and restart behavior.
- `escapement-m5d.js` — reconstructed entry/exit solver faces, tooth-to-segment contact tests, spatial unlock/capture thresholds, penetration guard and geometry-derived half-tooth release.
- `escapement-m5a.js` — compatibility re-export pointing at the current escapement implementation.

## Model contract

The geometry is built in millimetres and is intentionally inspectable. Official dimensions/specifications are used where sourced; unsourced geometry and dynamic parameters are explicitly treated as `reference-derived`, `approximate`, or `presentation` rather than silently promoted to manufacturing truth.

The ETA/Unitas 6497-2 is the strict movement target. The 44 mm cushion/exhibition shell is a reference-derived presentation influenced by the OP XI / Luminor lineage rather than exact branded production CAD.

## Current causal chain

`crown → winding train → stored reserve → drive proxy → escapement impulse → balance amplitude → pallet motion → geometric contact clearance → escape-wheel release → train → hands`

M5d is important because the escapement is no longer merely *labeled* with lock/unlock/impulse states. The release fraction used by the downstream train is now derived from spatial pallet-face travel and a tooth/face contact solver. The solver tracks the specific 15-tooth escape-wheel tooth expected to reach each reconstructed pallet face and can clamp candidate release before a tooth passes through the target face.

## M5d reconstruction targets

Current contact-space values are educational reconstruction targets, not ETA production tolerances:

- escape wheel: 15 teeth;
- tooth pitch: 24°;
- release per beat: 12° / half tooth;
- unlock face travel: 0.030 mm;
- target-face capture distance: 0.040 mm;
- nominal tooth/face contact tolerance: 0.035 mm;
- penetration guard: 0.006 mm.

The contact solver runs in assembled movement design coordinates. Exploded-view offsets are presentation transforms and intentionally do not alter the mechanical solution.

## M5d boundaries

M5d is not a rigid-body solver and does **not** yet claim measured ETA pallet coordinates, true tooth-tip polygons, production lock depth/drop/draw, friction, lubrication, impact/rebound, exact pallet efficiency, measured balance inertia, hairspring stiffness, or amplitude-dependent rate error. Contact currently uses simplified tooth tips against reconstructed face segments.

## Next

M5e should begin coupling amplitude to simulated rate rather than keeping the oscillator perfectly nominal at 3 Hz. A later geometric pass should replace tooth-tip/segment distance with actual reconstructed tooth and jewel-face polygon intersection. M6 remains the broader shared-system pass: barrel release, train force transmission, escapement, oscillator state, reserve and rate converging on one mechanical state model.

Full provenance and research notes: `../docs/watch-eta-6497-2.html`.
