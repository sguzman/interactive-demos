# Watch demo

Interactive exploded reconstruction of the ETA/Unitas 6497-2 inside a 44 mm exhibition-style wristwatch shell.

## Current milestone

**M5e — amplitude-dependent simulated rate.**

The watch is now substantially beyond a decorative exploded view. Crown winding creates persistent reserve; the keyless works separate winding and hand-setting modes; stored reserve gates runtime; reserve strength affects discrete escapement impulse; the balance carries a dynamic normalized amplitude state; M5d constrains half-tooth escape release from reconstructed pallet/contact geometry; and M5e now lets balance amplitude perturb oscillator phase speed instead of assuming perfectly nominal timekeeping at every usable amplitude.

## Files

- `index.html` — UI shell and import map.
- `style.css` — inspection-oriented overlay UI.
- `main-m5a.js` — current scene orchestration path; historical filename retained for cache/link continuity.
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
- `escapement-m5e.js` — educational amplitude→rate / isochronism layer with separate runtime and oscillator-phase clocks, effective Hz/Ah, seconds/day error and accumulated phase drift.
- `escapement-m5a.js` — compatibility re-export pointing at the current escapement implementation.

## Model contract

The geometry is built in millimetres and is intentionally inspectable. Official dimensions/specifications are used where sourced; unsourced geometry and dynamic parameters are explicitly treated as `reference-derived`, `approximate`, or `presentation` rather than silently promoted to manufacturing truth.

The ETA/Unitas 6497-2 is the strict movement target. The 44 mm cushion/exhibition shell is a reference-derived presentation influenced by the OP XI / Luminor lineage rather than exact branded production CAD.

## Current causal chain

`crown → winding train → stored reserve → drive proxy → escapement impulse → balance amplitude → amplitude-dependent oscillator rate → pallet motion/contact geometry → escape-wheel release → train → hands`

M5e separates two clocks that were previously identical:

- **reserve-consuming runtime** — how much simulated running time has actually been paid for by the mainspring state;
- **oscillator phase time** — how quickly the balance/pallet/escape sequence advances.

Amplitude now changes the second relative to the first. That means the watch can gain or lose simulated time while consuming reserve normally.

## Nominal rate vs simulated rate

The sourced specification remains **3 Hz / 21,600 A/h**. M5e does not replace it.

The current educational isochronism curve uses a normalized reference amplitude around **0.74**. Within a narrow deadband around that point the simulated rate is nominal. Below it, increasingly weak amplitude is modeled as running slow; above it, unusually high amplitude can run slightly fast.

At 1× model strength the current endpoints are approximately:

- low-amplitude side: down to **−120 s/day** near the unlock threshold;
- high-amplitude side: up to **+12 s/day** near normalized amplitude 1.0.

These are transparent simulation parameters, not measured ETA 6497-2 rate-vs-amplitude data. The UI also provides 5× and 20× diagnostic exaggeration so drift can be inspected without waiting for long simulated durations.

## M5d contact model retained

The geometry solver still tracks the expected 15-tooth escape-wheel tooth against reconstructed entry/exit pallet faces. Spatial face travel, target capture and a small penetration guard constrain the half-tooth release used by the downstream train.

Current contact-space values remain educational reconstruction targets rather than production tolerances:

- escape wheel: 15 teeth;
- tooth pitch: 24°;
- release per beat: 12° / half tooth;
- unlock face travel: 0.030 mm;
- target-face capture distance: 0.040 mm;
- nominal tooth/face contact tolerance: 0.035 mm;
- penetration guard: 0.006 mm.

## M5e boundaries

M5e does **not** claim measured ETA isochronism, balance inertia, hairspring stiffness, amplitude in physical degrees, real positional rate error, actual regulator behavior, temperature compensation, poise error, beat error, real torque-to-rate calibration, or production timing performance. The rate curve is deliberately explicit precisely so these assumptions remain replaceable rather than hidden.

The next useful step is to improve the oscillator itself: stop using a phase clock whose speed is directly assigned from a curve and begin representing balance phase/velocity as state, so impulse timing and hairspring restoring behavior can move toward a real oscillator integration.

Full provenance and research notes: `../docs/watch-eta-6497-2.html`.
