# Watch demo

Interactive exploded reconstruction of the ETA/Unitas 6497-2 inside a 44 mm exhibition-style wristwatch shell.

## Current milestone

**M6d — closed-loop normalized movement mechanics.**

The watch is now operating as one connected educational system rather than a collection of synchronized animations. Crown winding creates spring state at the barrel arbor; the barrel drum releases that state into the train; train demand feeds load back toward the barrel; finite tooth/pallet polygons govern escapement release and work transfer; delivered work replenishes an integrated balance oscillator; and the resulting oscillator/contact state meters the train and hands.

This is **normalized mechanics**, not production-calibrated watch physics. The architecture is increasingly causal while torque, friction, inertia, spring turns, efficiencies and work units remain reconstruction parameters unless explicitly sourced.

## Files

- `index.html` — UI shell and import map.
- `main-m5a.js` — current scene orchestration path; historical filename retained for continuity.
- `movement.js` — movement/watch construction, metadata and provenance.
- `train-m3g.js` — pitch, staff, bearing, endshake and wheel-body-clearance reconstruction.
- `winding-m4a.js` — crown/ratchet/click and persistent reserve state.
- `keyless-m4b.js` — stem modes and hand-setting path.
- `power-m4c.js` — reserve-consuming runtime gate.
- `escapement-m5f.js` — integrated balance θ/ω oscillator and continuous impulse scaling.
- `escapement-m5h.js` — finite tooth / pallet-jewel polygon contact.
- `escapement-m5i.js` — normalized available / delivered / lost escapement-work transfer.
- `escapement-m6a.js` — barrel arbor/drum separation and spring-torque → train-drive state.
- `escapement-m6b.js` — downstream demand → dynamic upstream train-load feedback and torque-margin stall.
- `escapement-m6c.js` — reconciled spring → train → contact → balance work ledger.
- `escapement-m6d.js` — closed-loop operating-state coordinator and hysteretic torque-stall latch.
- `escapement-m5a.js` — compatibility re-export pointing at the current implementation.

## Current causal loop

`crown → arbor winding → spring twist → barrel torque → dynamic reaction load → train transmission → available escapement work → polygon contact transfer → delivered Δω → integrated balance θ/ω → pallet / escape release → train → hands`

The return path is now explicit too:

`escapement demand / rejected work / low amplitude / geometry blockage → higher train reaction load → lower torque margin / transmission → weaker available escapement work → weaker impulse`

That feedback loop is the central M6 change.

## M6a — barrel arbor versus barrel drum

M6a separated the two power roles of the going barrel.

- crown / ratchet motion belongs to the **arbor winding side**;
- the click holds the arbor during release;
- reserve consumption accumulates a separate **barrel-drum release** state;
- the visible barrel drum rotates from that release state;
- spring twist feeds a reconstructed normalized torque curve;
- train load and transmission reduce spring torque to the work budget presented to M5i.

The current full-release drum mapping is **8 turns**. The low-twist torque knee is around **12% normalized twist**. Both are educational reconstruction parameters.

## M6b — dynamic load feedback

M6a still used one fixed train load. M6b makes the load state responsive to what the rest of the movement is doing.

The reaction-load target now includes normalized contributions from:

- baseline train load;
- ordinary running load;
- recent delivered escapement-work demand;
- rejected / lost escapement work as backpressure;
- low oscillator amplitude;
- unhealthy polygon contact;
- stalled movement state.

The target is smoothed rather than applied as an instantaneous discontinuity. Increasing load also reduces transmission efficiency.

Conceptually:

`drive margin = spring torque − dynamic train load`

`post-load drive = positive drive margin × load-dependent transmission`

If the drive margin falls below the M6 reconstruction threshold, the movement can now be held with **reserve still remaining**. Reserve therefore no longer automatically means usable motion.

## M6c — shared normalized work ledger

M6c reconciles one detailed escapement opportunity across the whole modeled power path.

For each non-fast-forward work event it records:

`spring-side budget`

`− train/load loss`

`= train-side available work`

`− contact loss`

`= balance-delivered work`

The UI exposes the arithmetic residual directly. Under the current bookkeeping, the target residual is zero within numerical tolerance. This is a consistency check against hidden creation or destruction of normalized work between layers.

M6c also exposes a normalized **spring differential turn** state. Current full twist maps to **8 modeled relative turns**. This is a presentation mapping, not a measured 6497-2 mainspring turn count.

## M6d — system closure and stall hysteresis

M6d reads the barrel, feedback, work-ledger, polygon-contact, oscillator and power-gate states as one movement.

It exposes one operating state such as:

- `UNWOUND`;
- `WINDING`;
- `RUNNING`;
- `WINDING WHILE RUNNING`;
- `PAUSED`;
- `TORQUE STALL`;
- `GEOMETRY BLOCKED`;
- `OSCILLATOR STALLED`;
- `ESCAPEMENT HELD`.

M6d also adds torque-stall hysteresis. A load-induced stall enters at a low drive margin and remains latched until winding or load relief restores a larger release margin. This prevents an educational simulation artifact where the movement could chatter rapidly between run and stall around one threshold.

The live system panel also reports:

- normalized balance-energy proxy from oscillator amplitude²;
- end-to-end delivered fraction from spring-side opportunity budget to balance-delivered work;
- modeled total-loss fraction;
- spring-torque / load ratio;
- current reserve;
- work-ledger closure residual.

## Geometry and oscillator causality retained

M6 does not replace the M5 escapement work; it finally gives it an upstream mechanical context.

The active path still uses:

- integrated balance angle **θ** and angular velocity **ω**;
- reconstructed amplitude-dependent rate behavior;
- finite escape-tooth and pallet-jewel polygons;
- geometry-constrained lock, impulse, drop and capture;
- surface-follow distance and contact quality;
- variable impulse Δω rather than fixed admitted kicks;
- geometry-derived escape release as the timing source for the downstream train.

## Reconstruction parameters, not ETA measurements

Current M6-specific normalized parameters include values such as:

- modeled full drum release / spring differential: **8 turns**;
- low-twist torque knee: **0.12**;
- dynamic base train load: approximately **0.075**;
- nominal M6b transmission: approximately **94%** before load-dependent loss;
- load-feedback gains for impulse demand, rejected work, low amplitude and geometry blockage;
- torque-stall entry margin: approximately **0.018 normalized**;
- torque-stall release margin: approximately **0.055 normalized**.

These values are deliberately visible in code and diagnostics. They are **not** ETA production torque, friction, efficiency, mainspring-turn or stall specifications.

The official/source-backed anchors remain things such as the caliber identity, dimensions, 3 Hz / 21,600 A/h rate, 17 jewels, 44° lift angle, and 53 h minimum / 60 h typical reserve.

## What is now genuinely coupled

At the normalized educational level, the model now couples:

- winding input;
- stored spring state;
- barrel torque;
- arbor versus drum roles;
- dynamic train reaction load;
- transmission loss;
- finite escapement contact;
- available / delivered / lost work;
- balance angular state and amplitude;
- torque, geometry and oscillator stall modes;
- escape release;
- wheel-train progress;
- displayed time.

That is the current meaning of **M6 closed-loop**.

## What M6 still does not claim

M6 is not a rigid-body or manufacturing-grade movement simulator. It still does not contain measured:

- ETA barrel torque in N·mm;
- actual mainspring active-turn geometry;
- individual wheel/pinion tooth-force vectors;
- bearing and pivot friction curves;
- gear inertia;
- pallet friction / lubrication behavior;
- elastic impact or contact stress;
- balance inertia;
- hairspring stiffness / terminal-curve geometry;
- physical work in joules;
- positional timing errors;
- temperature response;
- real production amplitude or rate performance.

Those are calibration / fidelity problems on top of the now-established causal architecture rather than missing connections between otherwise independent animations.

## Sensible future work

The next deepening passes should increasingly replace normalized assumptions with defensible reference or measured values: a better barrel / mainspring geometry model, per-mesh train losses and inertia, explicit roller-jewel / fork-slot / safety polygons, more physical contact force/work, and eventually position / temperature / regulator effects.

Full provenance and research notes: `../docs/watch-eta-6497-2.html`.
