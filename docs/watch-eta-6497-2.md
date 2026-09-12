# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M5d — geometry-constrained escapement contact.**

This remains an educational reconstruction, not manufacturing CAD. Official movement facts, reference-derived geometry, approximation, and presentation-only simulation assumptions remain separate provenance classes.

## Target

The strict movement target is the **ETA / Unitas 6497-2**. The surrounding 44 mm exhibition-style wristwatch shell is a documented reference frame influenced by the OP XI / Luminor lineage rather than an asserted exact production-case CAD model.

## Official movement facts

ETA technical material supports:

- diameter: **36.60 mm**;
- height: **4.50 mm**;
- frequency: **3 Hz / 21,600 A/h**;
- jewels: **17**;
- typical lift angle: **44°**;
- power reserve: **53 h minimum / 60 h typical**;
- manual winding;
- hours, minutes, small seconds;
- ETACHRON regulator system.

Primary source: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/

## Geometry lineage: M3a–M3g

The train reconstruction progressed from timing topology toward a mechanically legible 3D stack:

- M3a encoded a reference-derived 6497 train ratio set and verified the 3 Hz / 21,600 A/h timing closure;
- M3b made the visible train use the same published tooth/leaf counts;
- M3c derived nominal module and pitch radii from the current reconstruction centres;
- M3d separated compound wheel bodies into distinct axial planes;
- M3e solved initial tooth/gap phase and added pitch-circle/contact diagnostics;
- M3f added pitch-radius-native educational spur construction and stepped staffs;
- M3g added wheel-body gaps, jewel-to-jewel bearing spans, pivot shoulders, and endshake reconstruction targets.

Current reference train counts remain:

- centre wheel: **80 teeth**;
- third wheel: **60 teeth + 10-leaf pinion**;
- seconds/fourth wheel: **120 teeth + 8-leaf pinion**;
- escape wheel: **15 teeth + 10-leaf pinion**.

At 21,600 A/h this closes to approximately 5 s/rev for the escape wheel, 60 s/rev for the seconds/fourth wheel, 7.5 min/rev for the third wheel, and 1 h/rev for the centre wheel.

## M4 — causal winding, setting, and reserve

M4 established the first stateful user-operated mechanism:

- crown winding advances the crown wheel and ratchet;
- the click enforces one-way ratchet behavior;
- accepted winding accumulates normalized mainspring energy;
- the stem has separate winding and hand-setting states;
- positive reserve opens the movement gate;
- running consumes reserve;
- zero reserve stops mechanical elapsed time.

The current full-wind mapping uses **45 crown turns** as a presentation assumption. The **60 h typical reserve** endpoint is sourced from ETA.

## M5a — event-resolved Swiss lever release

A 3 Hz balance gives **six alternations / beats per second**. M5a resolves each beat as:

1. **LOCK · ENTRY**;
2. **UNLOCK**;
3. **IMPULSE**;
4. **LOCK · EXIT**.

The 15-tooth escape wheel advances **one half-tooth per beat**, or 12° per release event. Released escape-wheel angle is converted back into released train time, so the downstream train waits during lock and advances during release.

## M5b — pallet-face and safety geometry

M5b added inspectable reconstruction geometry around the event model:

- explicit locking-face and impulse-face overlays on both pallet stones;
- reconstructed banking limits;
- roller/fork-slot and horn/dart safety envelopes;
- active contact and drop markers;
- event-level stepping;
- explicit diagnostic targets for lock depth, draw, drop and clearance.

Current M5b targets remain presentation/reconstruction values, not ETA tolerances:

- lock depth: **1.8°**;
- draw: **12.0°**;
- drop: **2.2°**;
- banking: approximately **±7.7°**;
- roller/fork clearance: approximately **0.12 mm**;
- horn clearance: approximately **0.10 mm**.

## M5c — reserve-coupled oscillator amplitude

M5c removed the assumption that the balance always has the same amplitude whenever the watch has any power.

The balance carries a normalized oscillator-amplitude state from 0 to 1. Between escapement events that state loses amplitude through a normalized damping model; successful unlocks add discrete impulse packets whose strength depends on a reconstruction-level barrel-drive proxy.

Current educational dynamics parameters include:

- damping: **0.16 / simulated second**;
- maximum normalized impulse coefficient: **0.070**;
- unlock threshold: **0.18 normalized amplitude**;
- restart reserve threshold: **1.2%**;
- restart amplitude seed: **0.34 normalized amplitude**.

Near the bottom of reserve, the drive proxy weakens enough that damping can exceed replenishment. The oscillator can therefore enter **STOPPED · ESCAPEMENT** while residual reserve remains. That reserve is held rather than consumed through a motionless train.

These are simulation parameters, not ETA torque, inertia, hairspring or measured balance-amplitude data.

## M5d — geometry-constrained escapement contact

M5d moves the escape-wheel release decision away from fixed fractions of a beat and toward spatial contact geometry.

### Contact-face calibration

The solver starts from the existing reference-derived movement centres for the escape wheel and pallet fork. It then aligns a reconstructed **entry pallet contact face** to the nearest visible escape-wheel tooth around the expected pallet contact sector. The **exit pallet contact face** is calibrated one half-tooth later.

Because the escape wheel has 15 teeth:

- tooth pitch = **24°**;
- one Swiss-lever half-tooth release = **12°**.

The solver therefore maintains an alternating entry/exit contact sequence tied directly to the visible escape-wheel phase rather than an arbitrary independent animation phase.

### Spatial event boundaries

The old M5a/M5b event labels were primarily triggered by fractions of one 1/6 s beat. M5d instead measures pallet-face movement in millimetres.

Current reconstruction contact targets are:

- unlock clearance: **0.030 mm** of start-face travel;
- target-face capture distance: **0.040 mm**;
- nominal contact tolerance: **0.035 mm**;
- tooth/face penetration guard: **0.006 mm**.

These values are explicitly **reconstruction targets**, not ETA production tolerances.

The event labels are now derived from those spatial relations:

- **LOCK** while the active face has not moved beyond the unlock clearance;
- **UNLOCK** once the starting face has spatially cleared;
- **IMPULSE** while the opposite face is still approaching and the tooth travels through the allowed half-step;
- **DROP / APPROACH** near the end of release;
- **LOCK** again once the target face enters the capture region.

### Tooth-to-segment contact test

For each beat, M5d tracks the specific escape-wheel tooth expected to interact with the current entry/exit face. It evaluates the distance from that tooth tip to the reconstructed face segment in the movement design plane.

That contact distance is exposed live in the UI. The solver also runs a short one-dimensional search when the candidate release would drive the tooth too close through the target face. The release angle is then clamped back to the last non-penetrating solution.

This is the first pass where a geometric contact test can directly limit escape-wheel motion rather than merely describing it after the fact.

### Geometry-derived released train time

The geometry solver produces a release fraction from 0 to 1 across each half-tooth event. That fraction determines the escape-wheel angle:

> completed half-steps + current geometry-constrained half-step fraction

The resulting escape angle is converted back into released train time exactly as in M5a. Therefore the fourth/seconds, third and centre wheels and the hands now inherit **geometry-constrained escape release**, not the old beat-window release fraction.

### Solver diagnostics

M5d adds a dedicated live panel showing:

- geometry event;
- active constraint;
- start-face travel in millimetres;
- target-face remaining distance in millimetres;
- tooth-to-face gap;
- active escape-wheel tooth number;
- geometry-derived release percentage;
- solver health.

An optional overlay draws the two reconstructed solver faces, the expected contact tooth, the nearest contact point, and the path between the calibrated entry/exit contact targets.

The solver intentionally works in the **assembled movement design coordinates**. Exploded-view offsets are presentation-only and do not change the mechanical contact solution; assemble the watch for the clearest visual agreement between the overlay and the mechanism.

### Geometry health gate

M5d also adds a defensive contact-health gate. If the reconstruction produces an invalid contact solution, the power system is allowed to hold rather than silently consume reserve while impossible geometry continues moving.

Normal calibrated operation should remain in **CONTACT SOLVER OK**.

## What M5d still does not claim

M5d is a significant step toward contact-based behavior, but it is still not a rigid-body or production escapement simulation. It does **not yet** claim:

- measured ETA pallet-face coordinates;
- exact escape-tooth tip geometry;
- exact lock depth, draw, drop, or banking-pin coordinates;
- continuous collision manifolds between real polygonal tooth and jewel surfaces;
- friction, lubrication, elastic deformation, rebound, or impact dynamics;
- actual pallet impulse efficiency;
- measured balance inertia or hairspring torque;
- amplitude-dependent rate error;
- positional timing effects.

The contact solver uses simplified tooth-tip-to-face-segment geometry and explicit reconstruction clearances. Its purpose is to move causality into geometry without pretending we already possess factory CAD or calibrated physics.

## Inspection tools

Useful controls now include:

- **Escapement** camera preset;
- `0.1×`, `0.25×`, and `0.5×` slow mechanical time;
- `0× paused`;
- **Step next event**;
- **Step one beat**;
- live balance-amplitude / impulse / unlock-margin readouts;
- live M5d contact-solver distances and release state;
- optional M5d solver-face / contact overlay;
- pallet-face / safety diagnostics;
- train pitch/contact guides;
- train stack and endshake diagnostics;
- keyless-works inspection;
- camera-aligned and movable inspection lighting.

## Provenance classes

- **official** — directly supported by technical material;
- **reference-derived** — reconstructed from service diagrams, teardown photographs, or multiple references;
- **approximate** — simplified geometry preserving mechanical role and relationship;
- **presentation** — geometry, controls, thresholds or simulation assumptions added for readability and interaction.

## Next milestones

### M5e — amplitude / rate coupling

- let normalized balance amplitude affect oscillator rate rather than keeping frequency perfectly fixed at nominal 3 Hz;
- expose rate error as an educational output;
- distinguish nominal specification from simulated instantaneous rate;
- preserve clear provenance around any assumed isochronism model.

### M5f — deeper geometric contact

- replace tooth-tip/face-segment tests with actual reconstructed tooth and pallet-face polygons;
- derive lock depth and drop from polygon intersections;
- validate horn / roller-jewel safety geometry from the same contact framework;
- migrate reconstruction targets toward measured/reference dimensions where available.

### M6 — system simulation

- separate barrel-arbor winding from barrel-drum release;
- improve power transmission through the train;
- couple reserve, escapement impulse, amplitude and rate into one shared system state;
- move from nominal-clock gating toward a genuinely state-driven oscillator.

## Sources

- ETA 6497-2 Technical Communication: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/
- ETA 6497-2 spare-parts communication: https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1632/
- Case & Caliber ETA 6497 disassembly: https://caseandcaliber.com/eta-6497-disassembly/
- Horology Student Unitas/ETA 6497/6498 reference: https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/
