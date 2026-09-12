# Watch demo

Interactive exploded reconstruction of the ETA/Unitas 6497-2 inside a 44 mm exhibition-style wristwatch shell.

## Current milestone

**M6e — stage-resolved closed-loop normalized movement mechanics.**

The watch is now operating as one connected educational system rather than a collection of synchronized animations. Crown winding creates spring state at the barrel arbor; the barrel drum releases that state into the train; named train stages contribute load and transmission loss; downstream demand feeds load back toward the barrel; finite tooth/pallet polygons govern escapement release and work transfer; delivered work replenishes an integrated balance oscillator; and the resulting oscillator/contact state meters the train and hands.

This is **normalized mechanics**, not production-calibrated watch physics. The architecture is causal while torque, friction, inertia, spring turns, efficiencies and work units remain reconstruction parameters unless explicitly sourced.

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
- `escapement-m6b.js` — dynamic reaction-load feedback and torque-margin stall; exposes a load-model provider interface.
- `escapement-m6c.js` — reconciled spring → train → contact → balance work ledger.
- `escapement-m6d.js` — movement-level operating-state coordinator and hysteretic torque-stall latch.
- `escapement-m6e.js` — stage-resolved centre→third→fourth→escape load / efficiency model feeding the M6 feedback loop.
- `escapement-m5a.js` — compatibility re-export pointing at the current implementation.

## Current causal loop

`crown → arbor winding → spring twist → barrel torque → stage-resolved train reaction load → compounded transmission → available escapement work → polygon contact transfer → delivered Δω → integrated balance θ/ω → pallet / escape release → train → hands`

The return path is explicit too:

`escapement demand / rejected work / low amplitude / geometry blockage → higher reaction load → lower torque margin / transmission → weaker available escapement work → weaker impulse or stall`

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

M6b makes the load state responsive to what the rest of the movement is doing. Reaction load can include ordinary running demand, recent delivered escapement work, rejected work/backpressure, low oscillator amplitude, unhealthy polygon contact, and stalled state.

Conceptually:

`drive margin = spring torque − dynamic train load`

`post-load drive = positive drive margin × load-dependent transmission`

If drive margin collapses, the movement can stop with **reserve still remaining**. Reserve therefore no longer automatically means usable motion.

M6b also exposes a load-model provider so later passes can replace its aggregate target with a more structured train model without breaking the rest of the closed loop.

## M6c — shared normalized work ledger

M6c reconciles one detailed escapement opportunity across the modeled power path:

`spring-side budget`

`− train/load loss`

`= train-side available work`

`− contact loss`

`= balance-delivered work`

The UI exposes the arithmetic residual directly. The intended residual is zero within numerical tolerance. This is a consistency check against hidden creation or destruction of normalized work between layers.

M6c also exposes a normalized **spring differential turn** state. Current full twist maps to **8 modeled relative turns**. This is a presentation mapping, not a measured 6497-2 mainspring turn count.

## M6d — system closure and stall hysteresis

M6d reads barrel, load-feedback, work-ledger, polygon-contact, oscillator and power-gate states as one movement. It exposes operating states such as `UNWOUND`, `WINDING`, `RUNNING`, `PAUSED`, `TORQUE STALL`, `GEOMETRY BLOCKED`, `OSCILLATOR STALLED`, and `ESCAPEMENT HELD`.

A load-induced torque stall is hysteretic: it enters at a low drive margin and remains latched until winding or load relief restores a larger release margin. This prevents simulation chatter around one threshold.

The system panel also reports normalized balance-energy proxy, end-to-end delivery fraction, modeled total-loss fraction, spring-torque/load ratio, reserve, and work-ledger closure.

## M6e — stage-resolved train path

M6e removes another anonymous scalar from the system. The reconstructed train load is now decomposed into named stages matching the active reference topology:

- **centre wheel 80 → third pinion 10**;
- **third wheel 60 → fourth pinion 8**;
- **fourth wheel 120 → escape pinion 10**;
- staff pivot / jewel loss;
- motion-works / display load;
- escapement standing and dynamic demand.

Each stage has an explicit normalized base-load contribution and stage efficiency. The stage efficiencies compound into a transmission ceiling; M6b then applies load-dependent degradation beneath that ceiling.

Current educational stage base loads are approximately:

- centre→third: **0.012**;
- third→fourth: **0.011**;
- fourth→escape: **0.013**;
- pivots / jewels: **0.014**;
- motion works: **0.008**;
- standing escapement demand: **0.017**.

Current educational stage efficiencies are approximately 99.1%, 98.9%, 98.6%, 99.2%, and 99.5% for the successive train/pivot/display elements. Their product forms the stage transmission ceiling. These are **not measured ETA efficiencies**.

Dynamic running, delivered-work demand, rejected-work backpressure, low amplitude, geometry blockage and stall penalties are added primarily on the escapement/load side and feed the same M6b/M6d torque-margin loop.

## Geometry and oscillator causality retained

M6 does not replace the M5 escapement work; it gives it an upstream mechanical context. The active path still uses integrated balance angle **θ** and angular velocity **ω**, reconstructed amplitude-dependent rate behavior, finite escape-tooth and pallet-jewel polygons, geometry-constrained lock/impulse/drop/capture, surface-follow distance and contact quality, variable impulse Δω, and geometry-derived escape release as the timing source for the downstream train.

## Reconstruction parameters, not ETA measurements

Current M6-specific normalized parameters include values such as:

- modeled full drum release / spring differential: **8 turns**;
- low-twist torque knee: **0.12**;
- stage base loads and efficiencies listed above;
- feedback gains for impulse demand, rejected work, low amplitude and geometry blockage;
- torque-stall entry margin: approximately **0.018 normalized**;
- torque-stall release margin: approximately **0.055 normalized**.

These values are deliberately visible in code and diagnostics. They are **not** ETA production torque, friction, efficiency, mainspring-turn or stall specifications.

The official/source-backed anchors remain the caliber identity, 36.60 mm diameter, 4.50 mm height, 3 Hz / 21,600 A/h rate, 17 jewels, 44° lift angle, and 53 h minimum / 60 h typical reserve.

## What is now genuinely coupled

At the normalized educational level, the model couples winding input, stored spring state, barrel torque, arbor versus drum roles, stage-resolved train reaction load, transmission loss, finite escapement contact, available/delivered/lost work, balance angular state and amplitude, torque/geometry/oscillator stall modes, escape release, wheel-train progress, and displayed time.

That is the current meaning of **M6 closed-loop**.

## What M6 still does not claim

M6 is not a rigid-body or manufacturing-grade movement simulator. It still does not contain measured ETA barrel torque in N·mm, actual mainspring active-turn geometry, individual wheel/pinion tooth-force vectors, bearing and pivot friction curves, gear inertia, pallet friction / lubrication behavior, elastic impact or contact stress, balance inertia, hairspring stiffness / terminal-curve geometry, physical work in joules, positional timing errors, temperature response, or real production amplitude/rate performance.

Those are now calibration / fidelity problems on top of an established causal architecture rather than missing connections between independent animations.

## Sensible future work

The next deepening passes should increasingly replace normalized assumptions with defensible reference or measured values: better barrel/mainspring geometry and torque data, per-mesh inertia and friction, explicit force/torque propagation, finite roller-jewel / fork-slot / safety polygons, more physical contact work, and eventually position / temperature / regulator effects.

Full provenance and research notes: `../docs/watch-eta-6497-2.html`.
