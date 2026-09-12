# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M4b — stem selection and causal hand setting.**

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
- M3f replaced the decorative train radius with a pitch-radius-native educational spur construction and added stepped staffs;
- M3g added explicit wheel-body gaps, jewel-to-jewel bearing spans, pivot shoulders, and small endshake reconstruction targets.

Current reference train counts remain:

- centre wheel: **80 teeth**;
- third wheel: **60 teeth + 10-leaf pinion**;
- seconds/fourth wheel: **120 teeth + 8-leaf pinion**;
- escape wheel: **15 teeth + 10-leaf pinion**.

At 21,600 A/h this closes to approximately 5 s/rev for the escape wheel, 60 s/rev for the seconds/fourth wheel, 7.5 min/rev for the third wheel, and 1 h/rev for the centre wheel.

The current pitch solve is still based on **reference-derived reconstruction centres**, not ETA manufacturing coordinates.

## M4a retained — causal manual winding

M4a remains active inside M4b. User input can still wind the crown, drive the crown wheel and ratchet, advance the one-way click state, and accumulate normalized mainspring energy mapped to the official 60 h typical reserve. The current 45-turn full-wind interaction mapping remains a reconstruction assumption, not an ETA service specification.

The simplified return path continues to behave like an upstream free-return/clutch state: the crown can return without visually forcing the meshed crown wheel and ratchet through one another.

## M4b — stem position becomes a mode selector

M4b adds a second stem position and turns the crown from a single-purpose winding control into a mode-dependent input.

### Position 0 — winding

In the default position:

- the M4a winding controls are enabled;
- the crown wheel and ratchet can advance;
- stored mainspring energy can increase;
- the setting controls are disabled;
- the reconstructed sliding pinion remains on the winding side.

### Position 1 — hand setting

Selecting the setting position:

- translates the visible crown/stem outward;
- disables the barrel-winding controls;
- shifts the reconstructed sliding pinion toward the setting wheel;
- moves the yoke and setting-lever geometry with the selection state;
- enables clockwise/counter-clockwise setting input;
- rotates the visible setting wheel and minute wheel;
- changes the displayed hour and minute hands without adding mainspring energy.

A dedicated **Keyless works** camera preset centers the dial-side setting mechanism for inspection.

### Reconstruction pull distance

The current visible stem pull is **1.35 mm**. This is a presentation/reconstruction displacement chosen to make the state transition easy to read. It is not asserted as an ETA production stem-position dimension.

### Reconstructed setting ratio

The visible setting chain currently uses the constructive tooth counts already present in the demo:

- sliding pinion: **14 teeth**;
- setting wheel: **22 teeth**;
- minute wheel: **28 teeth**.

Those counts drive the visible intermediate-wheel rotations. M4b then uses the reconstructed minute-wheel rotation as a direct proxy for hand-setting displacement. That final mapping is intentionally a simplification rather than a claim about the exact production cannon-pinion / minute-wheel ratio.

### Isolation between modes

The important causal rule in M4b is mode exclusivity:

- winding position can increase stored mainspring energy;
- setting position cannot increase stored mainspring energy;
- setting position can change hour/minute display offset;
- winding position cannot use the setting controls.

This is still not a complete keyless-work simulation, but it establishes the correct topological distinction between winding and hand-setting modes.

## What M4b still does not claim

M4b does **not yet** model:

- exact ETA stem travel;
- production Breguet/clutch tooth geometry;
- exact yoke and setting-lever pivot geometry;
- exact keyless-work tooth counts for every part;
- exact motion-work setting ratio;
- friction, backlash, or spring loading in the keyless works;
- barrel torque release into the train;
- reserve depletion through the escapement.

The train and hands still have an underlying presentation timing graph even at zero stored mainspring energy. M4c will address that power-release mismatch.

## M3g diagnostics retained

M4b preserves the earlier geometry inspection tools:

- **Train mesh** view;
- pitch-circle/contact guides;
- **Train stack** side view;
- staff / bridge-clearance guides;
- endshake guides and optional exaggerated endshake motion;
- wheel-body axial-gap guides.

## Lighting

The balanced camera-axis lighting system remains in place:

- **Camera aligned / balanced** default;
- movable manual key light;
- combined camera + manual mode;
- high-headroom intensity and exposure controls;
- intentionally excessive **Full bright / diagnostic** preset for geometry inspection.

## Provenance classes

- **official** — directly supported by technical material;
- **reference-derived** — reconstructed from service diagrams, teardown photographs, or multiple references;
- **approximate** — simplified geometry preserving mechanical role and relationship;
- **presentation** — geometry, controls, or simulation assumptions added for readability and interaction.

## Next milestones

### M4c — power release

- let stored mainspring energy gate whether the train can run;
- decrement reserve from simulated running time;
- separate winding of the barrel arbor from release of the barrel drum;
- freeze train and hands when reserve reaches zero;
- keep torque magnitude normalized until escapement/friction modeling is credible.

### M5 — escapement fidelity

- locking and impulse faces;
- banking limits;
- roller jewel / fork interaction;
- causal escape release.

### M6 — system simulation

- barrel energy drives train;
- escapement meters release;
- balance state governs timing;
- hands derive from the same shared mechanical state.

## Sources

- ETA 6497-2 Technical Communication: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/
- ETA 6497-2 spare-parts communication: https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1632/
- Case & Caliber ETA 6497 disassembly: https://caseandcaliber.com/eta-6497-disassembly/
- Horology Student Unitas/ETA 6497/6498 reference: https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/
