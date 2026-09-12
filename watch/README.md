# Watch demo

Interactive exploded reconstruction of the ETA/Unitas 6497-2 inside a 44 mm exhibition-style wristwatch shell.

## Current milestone

**M5f — state-integrated balance / hairspring oscillator.**

The watch is now substantially beyond a decorative exploded view. Crown winding creates persistent reserve; the keyless works separate winding and hand-setting modes; stored reserve gates runtime; M5d constrains escape release from reconstructed pallet/contact geometry; and M5f replaces the assigned balance phase clock with an integrated oscillator carrying explicit angular position and angular velocity state.

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
- `power-m4c.js` — reserve-consuming runtime gate; it now also exposes the original advance function so deeper oscillator layers can own the escapement gate without losing M4c accounting.
- `escapement-m5b.js` — event-resolved Swiss lever geometry and pallet/safety diagnostics.
- `escapement-m5c.js` — historical normalized amplitude envelope; now supports external oscillator ownership for M5f.
- `escapement-m5d.js` — reconstructed entry/exit contact faces, spatial unlock/capture thresholds, penetration guard and geometry-derived half-tooth release.
- `escapement-m5e.js` — transparent educational amplitude→rate curve retained as an optional stiffness/rate modifier.
- `escapement-m5f.js` — current oscillator implementation: θ/ω state, restoring acceleration, damping, center-crossing impulse kicks, phase recovery, slow-speed ODE integration and high-speed envelope fast-forward.
- `escapement-m5a.js` — compatibility re-export pointing at the current escapement implementation.

## Current causal chain

`crown → stored reserve → drive proxy → center-crossing impulse Δω → integrated balance θ/ω → pallet motion/contact geometry → escape-wheel release → train → hands`

The central M5f change is that the balance is no longer told what phase it should be at. Instead, a second-order oscillator is advanced from its current state:

- hairspring restoring acceleration pulls the balance toward zero;
- damping removes energy continuously;
- successful escapement impulses add angular velocity near center crossing;
- reserve controls the available impulse strength;
- oscillator amplitude emerges from the θ/ω state;
- unwrapped phase is recovered from θ and ω;
- that recovered phase drives the M5d pallet/contact solver;
- geometry-constrained escape release still meters the downstream train.

## M5f physical-state variables

The live M5f panel exposes:

- balance angle `θ` in degrees;
- angular velocity `ω` in rad/s;
- normalized oscillator amplitude;
- restoring and damping acceleration terms;
- last impulse velocity increment `Δω`;
- effective frequency and educational seconds/day rate error;
- accumulated oscillator phase drift relative to reserve-consuming runtime;
- center crossings and successful impulse count;
- current integrator mode;
- a phase portrait plotting `θ` against `ω/ω₀`.

At normal and slow inspection speeds the oscillator uses explicit numerical integration. Large diagnostic time scales would require thousands of 3 Hz cycles per rendered frame, so M5f switches to a clearly labelled fast-forward envelope approximation instead of pretending the browser has integrated every oscillation.

## Nominal specification vs reconstruction physics

The sourced ETA specification remains **3 Hz / 21,600 A/h**. M5f does not replace that specification.

Current M5f dynamic coefficients are educational reconstruction parameters, including:

- visual angle normalization: about **0.43 rad** maximum;
- damping ratio: **0.006**;
- maximum center-crossing impulse kick: about **0.42 rad/s** before reserve/saturation scaling;
- normalized unlock threshold: **0.18**;
- restart reserve threshold: **1.2%**;
- restart amplitude seed: **0.34 normalized amplitude**.

The M5e isochronism curve remains available as an explicit, user-adjustable modifier of the oscillator's natural frequency. Its amplitude→rate relationship is also reconstruction-level rather than measured ETA timing data.

## M5d contact model retained

The geometry solver still tracks the expected 15-tooth escape-wheel tooth against reconstructed entry/exit pallet faces. Spatial face travel, target capture and a penetration guard constrain the half-tooth release used by the downstream train.

Current contact-space values remain educational reconstruction targets rather than production tolerances:

- escape wheel: 15 teeth;
- tooth pitch: 24°;
- release per beat: 12° / half tooth;
- unlock face travel: 0.030 mm;
- target-face capture distance: 0.040 mm;
- nominal tooth/face contact tolerance: 0.035 mm;
- penetration guard: 0.006 mm.

## M5f boundaries

M5f is still not a calibrated physical model of an ETA 6497-2 balance. It does **not** claim measured balance inertia, hairspring stiffness, damping/Q, real impulse torque, pallet efficiency, oil friction, physical balance amplitude in degrees, regulator geometry, positional error, beat error, poise, temperature effects, or measured isochronism.

The important architectural improvement is narrower and real: oscillator phase is now an output of state integration rather than an input assigned from time.

## Next

M5g should tighten the coupling between actual M5d geometry events and impulse delivery: instead of applying the normalized impulse at every eligible center crossing, the impulse should be admitted only when the geometry solver is specifically in a valid impulse-contact state. After that, the deeper M6 work can begin separating barrel-arbor winding from barrel-drum torque release and moving train force transmission into the same shared state model.

Full provenance and research notes: `../docs/watch-eta-6497-2.html`.
