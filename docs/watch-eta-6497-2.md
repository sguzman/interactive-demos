# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M4a — causal manual winding state.**

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

## M4a — causal manual winding

M4a is the first subsystem that is no longer merely animated for presentation. User input now changes persistent mechanical state.

### Crown input

The demo adds an interactive crown driver. The **Wind crown** control advances the crown in the winding direction; **Return crown** rotates the crown itself back. Both controls can be clicked for a visible step or held continuously. Keyboard shortcuts are `W` for wind and `R` for return.

The return path is intentionally simplified as an upstream winding-clutch/free-return behavior: on return, the crown moves but the visible crown wheel and ratchet remain stationary. This avoids the physically impossible visual of meshed crown-wheel and ratchet teeth passing through one another.

The visible crown receives an indexed overlay so axial rotation can be read even though the crown body is round.

### Crown wheel → ratchet coupling

The M4a state graph uses the visible reconstruction tooth counts:

- crown wheel: **34 teeth**;
- ratchet wheel: **44 teeth**.

The current interaction model therefore advances the ratchet by the crown-wheel/ratchet ratio while winding. This is a causal visual relationship inside the reconstruction; it is not presented as a complete production model of the entire keyless train between fingertip and barrel arbor.

### One-way click constraint

The crucial asymmetry is now explicit:

- positive winding advances crown wheel and ratchet;
- return input reverses only the crown input in the current simplified free-return path;
- crown wheel and ratchet remain stationary on return;
- the click prevents reverse ratchet motion;
- the UI reports the click as **RATCHETING**, **LOCKED / RETURN**, or **SEATED**;
- the reconstructed click receives a tiny tooth-lift motion during forward winding and remains seated on return.

This replaces the old decorative sinusoidal ratchet motion with a persistent one-way state constraint while keeping the visible gear mesh coherent.

### Stored mainspring energy

Accepted winding increments a normalized energy state from 0 to 1. That state is displayed as:

- percentage stored energy;
- an equivalent reserve readout scaled to the official **60 h typical** reserve;
- accumulated ratchet-click count;
- a blue procedural mainspring overlay that contracts and becomes more visually intense as stored energy rises.

The **60 h** endpoint is official. The current mapping of a full wind to **45 crown turns** is explicitly a **reconstruction/presentation assumption** chosen to make the interaction practical. It is not an ETA service specification.

### Full-wind stop

Once the normalized energy reaches 1.0, further positive winding is blocked and the UI reports a full-wind stop. Return motion remains available. The demo therefore now has a meaningful winding state rather than an indefinitely spinning decoration.

### What M4a intentionally does not claim

M4a does **not yet** model:

- production torque curves;
- exact clutch/Breguet-tooth geometry in the return path;
- friction losses;
- exact crown-turn count to full wind;
- exact keyless-work tooth counts beyond the visible reconstruction;
- barrel torque release into the train;
- depletion of reserve through the escapement.

The wheel train and hands still run from the existing presentation timing graph even at zero stored energy. Coupling stored barrel energy to train release is a later system-simulation milestone rather than being silently faked here.

## M3g bearing/endshake diagnostics retained

M4a preserves the M3g train inspection tools:

- **Train mesh** view;
- pitch-circle/contact guides;
- **Train stack** side view;
- staff / bridge-clearance guides;
- endshake guides and optional exaggerated endshake motion;
- wheel-body axial-gap guides.

The nominal endshake targets remain reconstruction values, not asserted ETA production tolerances.

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

### M4b — keyless / setting state

- explicit stem positions;
- winding vs hand-setting mode;
- sliding-pinion / yoke state transition;
- motion-works coupling for hand setting;
- isolate the barrel winding path while setting the hands.

### M4c — power release

- let stored mainspring energy gate whether the train can run;
- decrement reserve from simulated running time;
- begin separating barrel-arbor winding from barrel-drum release;
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
