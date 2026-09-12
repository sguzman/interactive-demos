# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M6d — closed-loop normalized movement mechanics.**

This remains an educational reconstruction, not manufacturing CAD or calibrated watchmaking physics. Official movement facts, reference-derived geometry, approximate geometry, and presentation/simulation assumptions remain distinct provenance classes.

## Official movement facts

ETA technical material supports:

- diameter: **36.60 mm**;
- height: **4.50 mm**;
- frequency: **3 Hz / 21,600 A/h**;
- jewels: **17**;
- lift angle: **44°**;
- power reserve: **53 h minimum / 60 h typical**;
- manual winding;
- hours, minutes, small seconds;
- ETACHRON regulation.

Primary source: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/

## What M6 now means

M3 established train topology and stack geometry. M4 introduced winding, setting and stored reserve. M5 progressively made the escapement event-resolved, geometry-constrained, finite-surface-based, and coupled to an integrated balance oscillator through variable work-scaled impulse.

M6 closes the current normalized mechanical architecture around that escapement.

The live causal loop is now approximately:

> crown → barrel arbor winding → spring twist → barrel torque → dynamic train reaction load → train transmission → available escapement work → finite polygon work transfer → delivered Δω → integrated balance θ/ω → pallet / escape release → train → hands

with a feedback path:

> escapement demand / rejected work / low amplitude / geometry blockage → greater reaction load → lower torque margin / transmission → weaker available escapement work → weaker impulse or stall

This is the central M6 achievement.

## M6a — barrel arbor and barrel drum

M6a stopped treating reserve as the escapement's work source directly.

The barrel now has distinct causal roles:

- winding acts on the **arbor / ratchet side**;
- the click holds the arbor during release;
- running advances a separate **barrel-drum release** state;
- the visible drum follows that release state;
- normalized spring twist feeds a reconstructed torque curve;
- train load and transmission reduce that torque before M5i receives an available-work budget.

Current educational M6a parameters include:

- modeled full barrel-drum release: **8 turns**;
- low-twist torque knee: **0.12 normalized twist**;
- reconstructed torque plateau coefficients: **0.74 / 0.22 / 0.04**.

These are not ETA service values.

## M6b — dynamic train-load feedback

M6a still used one static train load. M6b lets the downstream mechanism push back upstream.

The reaction-load target now incorporates normalized contributions from:

- baseline train load;
- ordinary running demand;
- recent delivered escapement work;
- rejected / lost escapement work as backpressure;
- low oscillator amplitude;
- unhealthy polygon contact;
- stalled movement state.

The load target is smoothed over time rather than applied as a discontinuous jump.

Increasing reaction load also reduces transmission efficiency. The resulting quantities are approximately:

> drive margin = spring torque − dynamic train load

> post-load drive = positive drive margin × load-dependent transmission

That post-load drive becomes M5i's available work budget.

A major consequence is that **reserve and usable power are now separate concepts**. If dynamic reaction load consumes the available torque margin, the movement can stop with reserve remaining.

Current M6b reconstruction values include roughly:

- base normalized train load: **0.075**;
- nominal transmission: **0.94** before load-dependent loss;
- torque-margin stall threshold: approximately **0.018 normalized**;
- explicit feedback gains for impulse demand, rejected work, low amplitude, geometry failure, and stalled state.

Again, these are educational parameters rather than measured ETA losses.

## M6c — shared normalized work ledger

M6c makes the normalized opportunity budget auditable end to end.

For each detailed escapement opportunity it records:

> spring-side budget

> − train / load loss

> = train-side available work

> − escapement contact loss

> = balance-delivered work

The arithmetic residual is exposed directly in the UI.

Under the current accounting:

> residual = spring budget − train loss − contact loss − delivered work

and the intended residual is numerically zero within tolerance.

This does not turn normalized units into joules. It does make hidden bookkeeping inconsistency much harder: later improvements to train losses, contact efficiency or spring torque have to reconcile through the same ledger.

M6c also exposes a **spring differential turn** state. Full normalized twist currently maps to **8 modeled relative turns**. That is an educational presentation mapping, not a measured active-turn count for the 6497-2 mainspring.

## M6d — closed-loop operating state

M6d coordinates barrel, load-feedback, work-ledger, polygon-contact, oscillator and power-gate states into one movement-level operating mode.

The live system can distinguish states including:

- `UNWOUND`;
- `WINDING`;
- `RUNNING`;
- `WINDING WHILE RUNNING`;
- `PAUSED`;
- `TORQUE STALL`;
- `GEOMETRY BLOCKED`;
- `OSCILLATOR STALLED`;
- `ESCAPEMENT HELD`.

### Torque-stall hysteresis

A single threshold can produce simulation chatter when torque and load hover around equality. M6d therefore adds a hysteretic torque-stall latch.

Current educational thresholds are approximately:

- stall enters below **0.018 normalized drive margin**;
- stall remains latched until margin recovers above approximately **0.055**.

Winding or reduced downstream demand can therefore restore enough margin to restart without the state flickering rapidly around one boundary.

### System-level diagnostics

The M6d panel reports:

- operating mode;
- torque-stall latch state;
- normalized balance-energy proxy based on oscillator amplitude²;
- end-to-end delivered fraction from spring opportunity budget to balance-delivered work;
- total modeled loss fraction;
- spring-torque / train-load ratio;
- reserve;
- causal work-ledger closure residual.

## The M5 escapement remains the mechanical gate

M6 does not replace the detailed M5 escapement. It supplies the missing upstream power and feedback context.

The live path still includes:

- integrated balance angle **θ** and angular velocity **ω**;
- reconstructed amplitude-dependent rate behavior;
- finite escape-tooth and pallet-jewel polygons;
- geometry-derived lock, impulse, drop, capture and penetration checks;
- polygon surface-follow distance and contact quality;
- continuously scaled impulse rather than one fixed admitted kick;
- geometry-derived escape release as the timing source for the downstream wheel train.

The important difference is that the strength of that impulse is now downstream of barrel torque, dynamic load and train transmission.

## End-to-end normalized closure

At the present educational level, the movement now couples:

1. crown input;
2. arbor winding state;
3. normalized spring twist;
4. normalized spring torque;
5. separate drum release state;
6. dynamic train reaction load;
7. load-dependent transmission;
8. escapement-side available work;
9. finite polygon contact transfer;
10. rejected / delivered work;
11. balance angular state and amplitude;
12. geometry / amplitude / torque stall conditions;
13. escape-wheel release;
14. wheel-train progress;
15. displayed time.

The downstream system also feeds back into the upstream load state, so the architecture is no longer one-way.

## What remains normalized or approximate

The M6 architecture is closed-loop in the software / educational sense, but it is not factory-calibrated physics.

The model still does **not** contain measured:

- ETA barrel torque in N·mm;
- real mainspring torque-deflection data;
- active mainspring turns and geometric spring strain;
- actual barrel-drum revolution count over a full reserve;
- per-wheel / per-pinion inertia;
- gear-tooth force vectors;
- pivot and jewel-bearing friction curves;
- lubrication losses;
- pallet friction and physical efficiency;
- elastic impact / contact stress / compliance;
- balance inertia;
- hairspring stiffness or terminal-curve geometry;
- physical work in joules;
- positional timing errors;
- regulator adjustment mechanics in the dynamic model;
- temperature dependence;
- measured production amplitude or timing performance.

These are now mostly **calibration and fidelity problems attached to an established causal architecture**, rather than missing causal connections between independent animations.

## Inspection workflow

For the clearest M6 inspection:

1. assemble the movement;
2. wind from the **Winding** view and watch arbor state, spring twist and spring torque rise;
3. switch to **Escapement**;
4. enable the M5h tooth / pallet polygon overlay;
5. run at `0.1×` or `0.25×`;
6. compare M6b dynamic load and drive margin with M5i available / delivered / lost work;
7. compare M6c ledger closure with M5f last Δω and oscillator amplitude;
8. use the M6d panel to see whether the full movement regards itself as running, paused, torque-stalled, geometry-blocked, oscillator-stalled or unwound;
9. use `3600×` only for accelerated reserve / torque-falloff inspection.

## Provenance boundary

Current M6-specific values such as the 8-turn full-release mapping, normalized torque curve, reaction-load gains, load-dependent transmission law, stall thresholds and work units are transparent **simulation parameters**.

They should not be confused with the source-backed ETA anchors: caliber identity, 36.60 mm diameter, 4.50 mm height, 3 Hz / 21,600 A/h rate, 17 jewels, 44° lift angle, and 53 h minimum / 60 h typical reserve.

## Future deepening after M6

The highest-value next work is no longer “connect the subsystems”; they are connected. It is to replace normalized assumptions with more defensible mechanics where data permits:

- better barrel / mainspring geometry and torque calibration;
- per-mesh wheel/pinion inertia and friction;
- force/torque propagation rather than only normalized opportunity work;
- finite roller-jewel / fork-slot / horn / safety-dart collision geometry;
- regulator / hairspring geometry;
- positional and temperature effects;
- validation against measured 6497-2 amplitude, reserve and rate behavior if suitable data can be sourced.

## Sources

- ETA 6497-2 Technical Communication: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/
- ETA 6497-2 spare-parts communication: https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1632/
- Case & Caliber ETA 6497 disassembly: https://caseandcaliber.com/eta-6497-disassembly/
- Horology Student Unitas/ETA 6497/6498 reference: https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/
