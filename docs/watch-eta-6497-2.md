# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M6e — stage-resolved closed-loop normalized movement mechanics.**

This remains an educational reconstruction, not manufacturing CAD or calibrated watchmaking physics. Official movement facts, reference-derived geometry, approximate geometry, and presentation/simulation assumptions remain distinct provenance classes.

## Official movement facts

ETA technical material supports:

- diameter: **36.60 mm**;
- height: **4.50 mm**;
- frequency: **3 Hz / 21,600 A/h**;
- jewels: **17**;
- lift angle: **44°**;
- power reserve: **53 h minimum / 60 h typical**;
- dated 2020 complete winding input: **25 winding-stem turns**;
- manual winding;
- hours, minutes, small seconds;
- ETACHRON regulation.

Primary source: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/

## Canonical projection identity

Public canonical identifier:

`specimen:eta-unitas-6497-2`

This repository is the public implementation/projection surface. The canonical Engineering corpus is private and is not linked from this public document.

Current public synchronization pass:

- **date:** 2026-09-19;
- **projection milestone:** M6e;
- **Engineering research state:** core documentary/reconstruction scope complete; optional physical-specimen enrichment available but not required.

Provenance classes used by the projection:

- **P0** manufacturer;
- **P1** direct measurement;
- **P2** derived;
- **P3** audited secondary;
- **P4** reconstruction;
- **P5** presentation.

A part can have P0 identity while its Three.js shape remains P4/P5.

## What M6 now means

M3 established train topology and stack geometry. M4 introduced winding, setting and stored reserve. M5 progressively made the escapement event-resolved, geometry-constrained, finite-surface-based, and coupled to an integrated balance oscillator through variable work-scaled impulse.

M6 closes the current normalized mechanical architecture around that escapement and then resolves more of the formerly anonymous train load into the actual reconstructed gear-train stages.

The live causal loop is now approximately:

> crown → barrel arbor winding → spring twist → barrel torque → stage-resolved train reaction load → compounded transmission → available escapement work → finite polygon work transfer → delivered Δω → integrated balance θ/ω → pallet / escape release → train → hands

with a feedback path:

> escapement demand / rejected work / low amplitude / geometry blockage → greater reaction load → lower torque margin / transmission → weaker available escapement work → weaker impulse or stall

This is the central M6 achievement.

## M6a — barrel arbor and barrel drum

M6a stopped treating reserve as the escapement's work source directly.

The winding-input endpoint is now calibrated to ETA's dated 2020 manufacturer instruction of **25 winding-stem turns to complete winding**. This is a winding-side input anchor. It does **not** establish barrel-drum rundown turns or mainspring development turns.

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

The reaction-load target incorporates normalized contributions from ordinary running, recent delivered escapement work, rejected work/backpressure, low oscillator amplitude, unhealthy polygon contact, and stalled movement state. The target is smoothed rather than applied as a discontinuous jump.

Increasing reaction load also reduces transmission efficiency. The resulting quantities are approximately:

> drive margin = spring torque − dynamic train load

> post-load drive = positive drive margin × load-dependent transmission

That post-load drive becomes M5i's available work budget.

A major consequence is that **reserve and usable power are now separate concepts**. If dynamic reaction load consumes the available torque margin, the movement can stop with reserve remaining.

M6b also exposes a pluggable load-model interface. Later M6 passes can therefore replace the aggregate load target with a structured train model while preserving the same upstream/downstream feedback architecture.

Current M6b reconstruction values include roughly:

- base normalized train load: **0.075**;
- nominal transmission ceiling before later stage resolution: **0.94**;
- torque-margin stall threshold: approximately **0.018 normalized**;
- explicit feedback gains for impulse demand, rejected work, low amplitude, geometry failure, and stalled state.

These are educational parameters rather than measured ETA losses.

## M6c — shared normalized work ledger

M6c makes the normalized opportunity budget auditable end to end.

For each detailed escapement opportunity it records:

> spring-side budget

> − train / load loss

> = train-side available work

> − escapement contact loss

> = balance-delivered work

The arithmetic residual is exposed directly in the UI:

> residual = spring budget − train loss − contact loss − delivered work

The intended residual is numerically zero within tolerance.

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

M6d refreshes the current load/torque feedback before making that latch decision so winding can release a stall as soon as the reconstructed torque margin actually recovers.

### System-level diagnostics

The M6d panel reports operating mode, torque-stall latch state, normalized balance-energy proxy based on oscillator amplitude², end-to-end delivered fraction, modeled total-loss fraction, spring-torque / train-load ratio, reserve, and causal work-ledger closure residual.

## M6e — stage-resolved train path

M6e removes another anonymous scalar from the power path. Instead of treating the train reaction load as one undifferentiated number, the load model is now decomposed into stages matching the active reconstructed 6497 topology.

The currently modeled stages are:

- **centre wheel 80 → third pinion 10**;
- **third wheel 60 → fourth pinion 8**;
- **fourth wheel 120 → escape pinion 10**;
- staff pivot / jewel load;
- motion-works / display load;
- standing and dynamic escapement demand.

### Stage base loads

Current normalized educational base-load contributions are approximately:

- centre → third: **0.012**;
- third → fourth: **0.011**;
- fourth → escape: **0.013**;
- pivots / jewels: **0.014**;
- motion works / display: **0.008**;
- standing escapement demand: **0.017**.

Dynamic running demand, delivered-work demand, rejected-work backpressure, low amplitude, geometry blockage and stall penalties are added primarily on the escapement/load side.

### Stage transmission

Each stage also carries an explicit educational efficiency:

- centre → third: **99.1%**;
- third → fourth: **98.9%**;
- fourth → escape: **98.6%**;
- pivots / jewels: **99.2%**;
- motion works / display: **99.5%**.

Those stage values multiply to form the transmission ceiling used by the M6b load-feedback layer. M6b can then reduce actual transmission further as the current reaction load rises.

The important architectural change is not the numerical values—they are reconstructed placeholders. It is that later measured or better-founded losses can now be attached to **specific mechanical stages** instead of replacing one opaque efficiency scalar.

### Live M6e diagnostics

The **Stage-resolved train path · M6e** panel shows:

- centre→third load;
- third→fourth load;
- fourth→escape load;
- pivot/jewel load;
- motion-works load;
- escapement + feedback load;
- compounded stage transmission ceiling;
- total stage-derived target load.

These values feed the same M6b torque-margin calculation, the M6c ledger, and the M6d movement-level stall / operating-state logic.

## Physical amplitude versus normalized oscillator state

The public oscillator uses integrated angle/velocity state and a normalized 0–1 amplitude coordinate.

Do not collapse:

```text
normalized model amplitude
!=
visual balance angle
!=
physical balance amplitude in degrees
```

The M5f `0.43 rad` scale is a P4 visual/dynamical normalization, not the physical maximum swing of the real movement.

ETA's dated 2020 adjustment sheet instead gives physical amplitude criteria including:

- up to **320°** in the horizontal CH position at 0 h;
- minimum **210°** at 12H / 0 h;
- minimum **200°** at 12H / 24 h.

These manufacturer criteria are reference envelopes, not a direct map onto the demo's normalized oscillator variable.

## Materials, surfaces, lubrication and service state

The Engineering materials/tribology pass adds exact-calibre manufacturer anchors:

- main plate and bridges: **brass**;
- escape wheel: **steel**;
- pallet fork: **steel**;
- balance: **gilt Glucydur**;
- balance spring: **nickel steel**.

Current ETA service documentation distinguishes lubricant and surface-treatment classes including:

- Moebius 9010;
- HP-1300 / 9104;
- HP-1300 SC / 9104-SC;
- 9501;
- 9504;
- 9415 for pallet-stone service points;
- Fixodrop 8981 epilame treatment.

The complete movement barrel is a particularly important service object: ETA marks it as **do not wash** and directs replacement with an original **prelubricated** ETA part when required.

Therefore the model now treats service condition as a separate physical state:

```text
component identity
+
surface condition
+
epilame condition
+
lubricant identity / amount / age
+
contamination / wear / assembly state
=
tribological operating state
```

Lubricant identity is not converted into an invented friction coefficient.

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

The important difference is that the strength of that impulse is now downstream of barrel torque, stage-resolved train load, dynamic feedback and transmission.

## End-to-end normalized closure

At the present educational level, the movement now couples:

1. crown input;
2. arbor winding state;
3. normalized spring twist;
4. normalized spring torque;
5. separate drum release state;
6. stage-resolved train load;
7. downstream demand feedback;
8. stage-compounded and load-dependent transmission;
9. escapement-side available work;
10. finite polygon contact transfer;
11. rejected / delivered work;
12. balance angular state and amplitude;
13. geometry / amplitude / torque stall conditions;
14. escape-wheel release;
15. wheel-train progress;
16. displayed time.

The downstream system feeds back into the upstream load state, so the architecture is no longer one-way.

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
- measured per-stage train efficiencies;
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
6. compare the M6e stage target with M6b dynamic load and drive margin;
7. compare M5i available / delivered / lost work with M6c ledger closure;
8. compare M5f last Δω and oscillator amplitude with the delivered-work state;
9. use the M6d panel to see whether the full movement regards itself as running, paused, torque-stalled, geometry-blocked, oscillator-stalled or unwound;
10. use `3600×` only for accelerated reserve / torque-falloff inspection.

## Provenance boundary

Current M6-specific values such as the 8-turn full-release mapping, normalized torque curve, stage loads and efficiencies, feedback gains, load-dependent transmission law, stall thresholds and work units are transparent **simulation parameters**.

They should not be confused with the source-backed ETA anchors: caliber identity, 36.60 mm diameter, 4.50 mm height, 3 Hz / 21,600 A/h rate, 17 jewels, 44° lift angle, 53 h minimum / 60 h typical reserve, and the dated 2020 25-turn winding-stem complete-wind instruction.

## Completion and optional physical enrichment

The current documentary / analytical / reconstruction scope is complete.

The remaining unmeasured quantities are explicit evidence boundaries, not unfinished debt.

If an identified physical 6497-2 later becomes conveniently available and direct work is desirable, an optional enrichment protocol can add:

- specimen identity/provenance;
- 25-turn complete-wind check;
- measured rundown reserve;
- timegrapher rate / amplitude / beat error;
- positional variation;
- train tooth counts;
- dimensional geometry;
- barrel / mainspring measurements where appropriate;
- service / tribology observations;
- model-versus-specimen residuals and uncertainty.

No physical purchase, ownership, teardown, or direct measurement is required for the specimen to remain research-complete for its current scope.

## Sources

- ETA 6497-2 Technical Communication: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/
- ETA 6497-2 Manufacturing Information 2020: https://www.files.masteroftime.ch/6497-2%20ETA%20Manufacturing%20information.pdf
- ETA 6497-2 spare-parts communication: https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1632/
- Case & Caliber ETA 6497 disassembly: https://caseandcaliber.com/eta-6497-disassembly/
- Horology Student Unitas/ETA 6497/6498 reference: https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/

- Moebius lubricant / epilame supplier documentation: https://www.moebius-lubricants.ch/en/
- Incabloc supplier-family shock-bearing / jewel documentation: https://www.incabloc.ch/en/
