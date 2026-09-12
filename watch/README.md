# Watch demo

Interactive exploded reconstruction of the ETA/Unitas 6497-2 inside a 44 mm exhibition-style wristwatch shell.

## Current milestone

**M5c — reserve-coupled oscillator amplitude.**

The watch is now substantially beyond a decorative exploded view. Crown winding creates persistent reserve; the keyless works separate winding and hand-setting modes; stored reserve gates runtime; the Swiss lever escapement releases the train beat by beat; pallet lock/impulse faces and safety geometry are inspectable; and the balance now carries a normalized amplitude state that is replenished by discrete reserve-dependent impulse packets and can decay into a low-amplitude stall.

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
- `power-m4c.js` — energy/runtime gate, now also able to hold reserve when the escapement stalls.
- `escapement-m5b.js` — event-resolved Swiss lever geometry and pallet/safety diagnostics.
- `escapement-m5c.js` — normalized damping, reserve-dependent impulse packets, amplitude state, unlock threshold and restart behavior.
- `escapement-m5a.js` — compatibility re-export pointing at the current escapement implementation.

## Model contract

The geometry is built in millimetres and is intentionally inspectable. Official dimensions/specifications are used where sourced; unsourced geometry and dynamic parameters are explicitly treated as `reference-derived`, `approximate`, or `presentation` rather than silently promoted to manufacturing truth.

The ETA/Unitas 6497-2 is the strict movement target. The 44 mm cushion/exhibition shell is a reference-derived presentation influenced by the OP XI / Luminor lineage rather than exact branded production CAD.

## Current causal chain

`crown → winding train → stored reserve → drive proxy → escapement impulse → balance amplitude → unlock/release → escape wheel → train → hands`

This chain is real inside the educational model, but several links are still normalized rather than calibrated physical parameters.

## M5c boundaries

M5c does **not** yet claim measured ETA balance inertia, hairspring stiffness, barrel torque curve, pallet efficiency, true balance amplitude in degrees, lubrication losses, exact self-start behavior, or amplitude-dependent rate error. The nominal oscillator cadence still follows the official 3 Hz specification while amplitude and unlock reliability are dynamic.

## Next

M5d should constrain lock/release increasingly from reconstructed tooth/pallet geometry rather than phase windows. M5e should begin coupling amplitude to simulated rate. M6 remains the broader shared-system pass: barrel release, train force transmission, escapement, oscillator state, reserve and rate all converging on one mechanical state model.

Full provenance and research notes: `../docs/watch-eta-6497-2.html`.
