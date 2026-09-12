# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M5a — event-resolved Swiss lever release.**

The project remains an educational reconstruction, not manufacturing CAD. Official movement facts, reference-derived geometry, approximation, and presentation-only simulation assumptions remain separate provenance classes.

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
- M3f replaced decorative train radius logic with a pitch-radius-native educational spur construction and added stepped staffs;
- M3g added explicit wheel-body gaps, jewel-to-jewel bearing spans, pivot shoulders, and small endshake reconstruction targets.

Current reference train counts remain:

- centre wheel: **80 teeth**;
- third wheel: **60 teeth + 10-leaf pinion**;
- seconds/fourth wheel: **120 teeth + 8-leaf pinion**;
- escape wheel: **15 teeth + 10-leaf pinion**.

At 21,600 A/h this closes to approximately 5 s/rev for the escape wheel, 60 s/rev for the seconds/fourth wheel, 7.5 min/rev for the third wheel, and 1 h/rev for the centre wheel.

The current pitch solve is still based on **reference-derived reconstruction centres**, not ETA manufacturing coordinates.

## M4a — causal winding

M4a introduced persistent user-operated winding state:

- crown input advances the crown wheel and ratchet;
- the click enforces one-way ratchet behavior;
- accepted winding accumulates normalized mainspring energy;
- a blue procedural mainspring overlay visualizes stored energy;
- a full-wind stop prevents infinite winding.

The current interaction mapping uses **45 crown turns** to represent a full wind. That is a presentation/reconstruction assumption, not an ETA service specification. The **60 h typical reserve** endpoint is sourced from ETA.

## M4b — stem positions and hand setting

M4b makes the crown a two-mode control:

- **Position 0 · winding** keeps the M4a power-storage path active;
- **Position 1 · setting** pulls the reconstructed crown/stem outward, shifts the sliding pinion and selector pieces toward the setting path, disables barrel winding, and lets the user set the visible hour/minute hands.

The visible reconstruction currently uses:

- sliding pinion: **14 teeth**;
- setting wheel: **22 teeth**;
- minute wheel: **28 teeth**;
- crown pull: **1.35 mm** presentation/reconstruction displacement.

The setting-wheel and minute-wheel motion is causal inside the educational model. The final mapping from minute-wheel movement to the hand-setting displacement remains reconstruction-level rather than an asserted ETA production ratio.

## M4c — energy-gated power release

M4c closed the first causal power loop. The watch now starts **stopped and unwound**. Crown winding creates reserve, positive reserve opens the power gate, running consumes reserve, and zero reserve freezes mechanical elapsed time.

Reserve depletion is intentionally normalized and linear against the sourced **60 h typical** endpoint. It is not a production torque curve.

## M5a — event-resolved Swiss lever release

M5a changes the escapement from a decorative timing animation into an explicit event sequence.

### Six beats per second

A 3 Hz balance completes three full oscillations per second, giving **six alternations / beats per second**. M5a therefore treats one beat as **1/6 s** of mechanical time.

The balance still uses a prescribed educational oscillator rather than a solved spring-mass dynamic system, but its center crossings now define the cadence for escapement events.

### Lock → unlock → impulse → relock

Each beat is resolved into four presentation states:

1. **LOCK · ENTRY** — the escape wheel is held;
2. **UNLOCK** — the pallet moves off the locked tooth;
3. **IMPULSE** — the escape wheel advances while the fork crosses toward the opposite bank;
4. **LOCK · EXIT** — the next pallet holds the next tooth and the train waits.

The exact fractional timing of these windows is **reconstruction timing for visibility**, not an ETA production lift/lock specification.

### Half-tooth release

The reference escape wheel has **15 teeth**. In a Swiss lever escapement, M5a advances the escape wheel by **one half-tooth per beat**, or 12° per release event. Thirty half-tooth releases therefore produce one full escape-wheel revolution, matching the existing 5 s/rev reference period at six beats per second.

The escape wheel no longer advances continuously across the whole beat. It remains stationary in the lock windows and advances only through the reconstructed unlock/impulse window.

### Escapement now meters train progress

This is the most important architectural change in M5a.

Previously, the balance, pallet, escape wheel and train all derived independently from the same mechanical clock. They were synchronized, but the escapement was not actually the thing releasing the train.

M5a now converts **escape-wheel released angle back into released train time**. The fourth/seconds wheel, third wheel, centre wheel, small-seconds hand, minute hand and hour hand all use that released time.

Therefore:

- while the escape wheel is locked, the train visibly waits;
- during unlock/impulse, released train time advances;
- after relock, the train stops again until the next beat.

This is still an event-resolved educational model, not a rigid-body contact solver, but the causal direction is now much closer to the real mechanism: **oscillator cadence → pallet release → escape-wheel release → train progress**.

### Added escapement geometry

M5a also adds geometry that was missing from the earlier broad pallet/balance representation:

- roller table;
- guard roller;
- ruby impulse jewel;
- fork horns;
- safety dart;
- banking pins;
- optional escape-wheel → pallet → balance center-line guides;
- a temporary impulse-contact flash during the impulse window.

These additions are **reference-derived / presentation geometry**. Their existence and functional roles are real; their exact dimensions, clearances and face angles are not yet asserted as ETA production geometry.

### Beat stepping and slow motion

The simulation now includes `0.1×`, `0.25×` and `0.5×` mechanical-time modes for escapement inspection.

At `0× paused`, **Step exactly one beat** advances the power-gated mechanism by one 1/6 s beat while consuming the corresponding nominal reserve. This makes the lock/unlock/impulse/relock sequence much easier to inspect than watching it only at full speed.

## What M5a intentionally does not claim

M5a does **not yet** model:

- exact entry/exit pallet locking-face geometry;
- exact impulse-face geometry;
- draw angle;
- drop;
- lock depth;
- exact banking-pin placement;
- exact roller-jewel path and fork-slot clearance;
- horn safety clearances;
- impulse energy transfer into balance amplitude;
- free balance amplitude determined from spring torque and losses;
- friction or lubrication at pallet/escape contact;
- production torque transfer through the train.

The oscillator frequency is still prescribed from the official 3 Hz rate. M5a makes release event-driven and causal at the timing/topology level; it does not yet solve contact mechanics.

## Inspection tools retained

- **Escapement** close view with optional center-line guides;
- exact-one-beat step control;
- slow mechanical-time modes;
- **Train mesh** view;
- pitch-circle/contact guides;
- **Train stack** side view;
- staff / bridge-clearance guides;
- endshake guides and optional exaggerated endshake motion;
- wheel-body axial-gap guides;
- **Keyless works** inspection view;
- camera-aligned and movable inspection lighting.

## Provenance classes

- **official** — directly supported by technical material;
- **reference-derived** — reconstructed from service diagrams, teardown photographs, or multiple references;
- **approximate** — simplified geometry preserving mechanical role and relationship;
- **presentation** — geometry, controls or simulation assumptions added for readability and interaction.

## Next milestones

### M5b — pallet-face and safety geometry

- explicit entry and exit locking faces;
- explicit impulse faces;
- improve fork-slot / roller-jewel geometry;
- more defensible banking limits;
- show lock depth and drop diagnostically;
- constrain escape-to-pallet contact with geometry rather than only phase windows.

### M5c — impulse / oscillator coupling

- model a normalized impulse packet delivered at each beat;
- let delivered impulse affect balance amplitude;
- let insufficient reserve reduce amplitude and eventually stop reliable unlocking;
- stop prescribing perfect amplitude independently of power state.

### M6 — system simulation

- separate barrel arbor winding from barrel drum release;
- power transmission through the train;
- escapement meters release;
- balance state governs timing;
- hands derive from the same shared mechanical state;
- reserve, amplitude and rate become coupled instead of only gated.

## Sources

- ETA 6497-2 Technical Communication: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/
- ETA 6497-2 spare-parts communication: https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1632/
- Case & Caliber ETA 6497 disassembly: https://caseandcaliber.com/eta-6497-disassembly/
- Horology Student Unitas/ETA 6497/6498 reference: https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/
