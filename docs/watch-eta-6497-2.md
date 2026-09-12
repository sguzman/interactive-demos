# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M5c — reserve-coupled oscillator amplitude.**

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

M5c removes the previous assumption that the balance always has the same amplitude whenever the watch has any power.

The balance now carries a **normalized oscillator-amplitude state** from 0 to 1. That state is deliberately dimensionless: it is not being presented as a measured ETA balance amplitude in degrees.

### Damping between beats

Between escapement events, normalized balance amplitude decays exponentially. The current educational damping coefficient is:

- **0.16 / simulated second**.

This is a simulation parameter, not a measured friction or hairspring-loss coefficient.

### Discrete impulse packets

At each successful beat, the escapement adds a discrete impulse packet to the oscillator state rather than simply resetting the balance to a fixed animation amplitude.

The maximum normalized packet coefficient is currently:

- **0.070**.

Actual packet strength is multiplied by a reconstruction-level **barrel-drive proxy** derived from remaining normalized reserve. High reserve gives stronger packets; very low reserve gives weaker packets.

### Barrel-drive proxy

M5c introduces a deliberately non-production drive proxy so the relationship between reserve and amplitude can be inspected.

The proxy has two parts:

- a broad decline across the reserve range;
- a deliberately visible collapse near the bottom of reserve.

The collapse region begins around **0.15% normalized reserve** and spans roughly another **1.5%**. Those values are simulation choices designed to make end-of-reserve behavior visible. They are not an ETA mainspring torque curve.

### Unlock threshold

The pallet is now allowed to continue releasing the train only while normalized balance amplitude remains above a reconstruction threshold:

- **unlock threshold: 0.18 normalized amplitude**.

When amplitude falls below that threshold, the power-release gate changes to **STOPPED · ESCAPEMENT** / **LOW BALANCE AMPLITUDE**.

Crucially, remaining mainspring reserve is then **held rather than silently consumed** through a motionless train.

This creates a second causal gate:

> stored reserve is necessary, but usable oscillator amplitude is also necessary.

### Restart behavior

If the oscillator has stalled, winding can restart it. The current restart rule is:

- reserve must be at least **1.2% normalized**;
- the educational restart seeds normalized balance amplitude to **0.34**.

This is a practical interaction rule because the demo has no wrist-shake / manual balance-start gesture. It is not a claim about the exact self-start behavior of a real 6497-2.

### What now happens near the end of reserve

As reserve falls:

1. the barrel-drive proxy weakens;
2. each impulse packet becomes smaller;
3. damping removes more amplitude than weak impulses restore;
4. balance amplitude trends downward;
5. unlock margin approaches zero;
6. the escapement can stall before the normalized spring state reaches mathematical zero;
7. the remaining residual reserve stays stored until the user winds again.

The UI exposes:

- normalized balance amplitude;
- oscillator state;
- normalized barrel-drive proxy;
- current impulse packet strength;
- unlock margin;
- successful impulse count;
- missed-unlock count.

## What M5c intentionally does not claim

M5c still does **not** model or assert:

- ETA balance inertia;
- hairspring stiffness or exact torque law;
- measured balance amplitude in degrees;
- actual barrel torque curve;
- pallet efficiency;
- lubrication losses;
- aerodynamic losses;
- position-dependent amplitude;
- rate error caused by amplitude;
- exact self-start threshold;
- exact relationship between reserve percentage and delivered impulse.

The oscillator is now dynamically stateful, but the values are normalized educational dynamics rather than calibrated production physics.

## Inspection tools

Useful controls now include:

- **Escapement** camera preset;
- `0.1×`, `0.25×`, and `0.5×` slow mechanical time;
- `0× paused`;
- **Step next event**;
- **Step one beat**;
- live balance-amplitude / impulse / unlock-margin readouts;
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

### M5d — geometry-constrained escapement

- replace more event-window assumptions with tooth/pallet intersection tests;
- derive lock and release from reconstructed face geometry;
- improve drop and safety validation from geometry;
- migrate diagnostic targets toward measured/reference dimensions where available.

### M5e — amplitude / rate coupling

- let normalized balance amplitude affect oscillator rate rather than keeping frequency perfectly fixed at nominal 3 Hz;
- expose rate error as an educational output;
- distinguish nominal specification from simulated instantaneous rate;
- preserve clear provenance around any assumed isochronism model.

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
