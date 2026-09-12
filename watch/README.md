# Watch demo

Interactive exploded reconstruction of the ETA/Unitas 6497-2 inside a 44 mm exhibition-style wristwatch shell.

## Current milestone

**M5g — geometry-admitted escapement impulse.**

The watch is now substantially beyond a decorative exploded view. Crown winding creates persistent reserve; the keyless works separate winding and hand-setting modes; stored reserve gates runtime; M5d constrains escape release from reconstructed pallet/contact geometry; M5f integrates the balance as explicit angular position/velocity state; and M5g now makes that same reconstructed contact path decide whether a center crossing is actually allowed to deliver an escapement impulse into the balance.

## Files

- `index.html` — UI shell and import map.
- `main-m5a.js` — current scene orchestration path; historical filename retained for continuity.
- `movement.js` — movement/watch construction, metadata and provenance.
- `train-m3g.js` — pitch, staff, bearing, endshake and wheel-body-clearance reconstruction.
- `winding-m4a.js` — crown/ratchet/click and stored-reserve state.
- `keyless-m4b.js` — stem modes and hand-setting path.
- `power-m4c.js` — reserve-consuming runtime gate.
- `escapement-m5b.js` — pallet/safety geometry and event diagnostics.
- `escapement-m5c.js` — historical normalized oscillator envelope and reserve/impulse proxy.
- `escapement-m5d.js` — reconstructed entry/exit contact faces and geometry-constrained half-tooth release.
- `escapement-m5e.js` — explicit educational amplitude→rate modifier.
- `escapement-m5f.js` — integrated θ/ω balance/hairspring state with a pluggable impulse-admission hook.
- `escapement-m5g.js` — current impulse gate: samples the calibrated M5d entry/exit tooth/pallet path and admits Δω only when that geometry contains a coherent impulse interval.
- `escapement-m5a.js` — compatibility re-export pointing at the current escapement implementation.

## Current causal chain

`crown → stored reserve → drive proxy → balance center crossing → reconstructed pallet/tooth impulse-path gate → impulse Δω → integrated balance θ/ω → pallet/contact geometry → escape-wheel release → train → hands`

M5g removes the remaining rule that a healthy center crossing automatically gets a kick. A center crossing is now only an **opportunity**. The geometry gate then checks the alternating entry/exit path sampled from the same calibrated M5d faces used to constrain escape-wheel release.

For an impulse to be admitted, the reconstructed path must show all of the following:

- the starting pallet face clears its M5d unlock threshold;
- the geometry-derived half-tooth release progresses through a nontrivial impulse interval;
- the tracked escape tooth stays inside a reconstruction-level contact envelope during that interval;
- the M5d penetration guard can keep the candidate path non-penetrating;
- the underlying contact values remain finite and coherent.

If those conditions fail, the M5f oscillator receives **no Δω** for that crossing.

## Live M5g diagnostics

The new impulse-gate panel reports:

- ADMITTED / DENIED decision;
- entry→exit or exit→entry transition;
- nearest tooth/face path gap;
- geometry-derived release span;
- number of sampled points that formed an impulse interval;
- explicit admission/denial reason;
- admitted and denied geometry probes;
- an optional contact marker showing the tracked tooth and nearest reconstructed face point.

At large fast-forward scales M5f still uses its explicit envelope approximation. M5g samples both alternating pallet parities to determine what fraction of nominal impulse opportunities remain geometrically admissible instead of performing thousands of contact probes per rendered frame.

## Reconstruction targets, not ETA tolerances

M5g reuses the M5d reconstruction targets:

- escape wheel: 15 teeth;
- tooth pitch: 24°;
- release per beat: 12° / half tooth;
- unlock face travel: 0.030 mm;
- target-face capture distance: 0.040 mm;
- nominal tooth/face contact tolerance: 0.035 mm;
- penetration guard: 0.006 mm.

The extra M5g admission envelope is derived from those reconstructed contact tolerances for diagnostic robustness. It is not an ETA production impulse-face clearance or pallet efficiency specification.

## What M5g does and does not mean

The architectural improvement is real: **geometry can now veto energy transfer into the oscillator**. But the geometry being consulted is still simplified reconstructed geometry, not factory CAD. M5g does not yet model exact escape-tooth polygons, jewel impulse-face polygons, friction, lubrication, elastic impact, measured pallet efficiency, or calibrated impulse torque.

The sourced ETA specification remains **3 Hz / 21,600 A/h**. Balance inertia, hairspring stiffness, damping, impulse magnitude, restart behavior and amplitude→rate behavior remain educational parameters.

## Next

The next geometric step should replace point/segment contact with actual reconstructed **escape-tooth and pallet-jewel polygons**, so lock, impulse, drop and contact admission can be derived from surface intersections rather than from a tracked tooth tip against line segments. After that, M6 can begin consolidating barrel torque release, train force transmission, escapement contact and oscillator dynamics into one shared mechanical state.

Full provenance and research notes: `../docs/watch-eta-6497-2.html`.
