# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M4c — energy-gated power release.**

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

## M4c — power release

M4c closes the first causal power loop.

The watch now starts **stopped and unwound**. The train no longer advances from wall-clock time by itself.

The runtime is now:

1. crown winding creates stored mainspring reserve;
2. any positive reserve opens the power gate;
3. one shared **mechanical elapsed time** advances;
4. balance, pallet/escapement presentation, escape wheel, fourth/seconds wheel, third wheel, centre wheel, small seconds, minute hand and hour hand all derive from that same mechanical clock;
5. running consumes reserve;
6. reserve reaching zero freezes the mechanical clock and therefore stops the movement.

This removes the previous contradiction where a visibly unwound watch could continue running.

### Reserve depletion model

For M4c, depletion is intentionally simple and explicit:

- normalized stored energy is mapped linearly to the sourced **60 h typical reserve**;
- one simulated second of running consumes one second from that reserve at 1×;
- winding while the watch is running can replenish reserve;
- hand setting remains possible independently of whether the movement has power.

This is a **normalized runtime model**, not a production torque curve. It does not yet model declining torque, friction losses, position-dependent rate error, or escapement efficiency.

### Mechanical time scale

The old train-only speed control is now a **mechanical time scale** because M4c ties visible motion and reserve depletion to the same simulated clock.

Available modes include:

- `0×` — paused, reserve preserved;
- `1×` — real-time simulation;
- `10×`, `60×`, `300×` — inspection speeds;
- `3600×` — reserve demonstration mode, where one simulated hour passes per real second.

At 3600×, a full nominal 60 h reserve can therefore be observed running down in about one real minute. This is explicitly a simulation-time acceleration, not a claim about watch behavior.

## What M4c intentionally does not claim

M4c does **not yet** model:

- production mainspring torque curves;
- exact barrel-arbor vs barrel-drum release geometry;
- friction losses through each wheel/pinion pair;
- escapement efficiency;
- amplitude decay as reserve falls;
- positional rate error;
- exact keyless clutch/Breguet-tooth geometry;
- exact crown-turn count to full wind.

The power model currently decides whether the mechanical clock may advance and how long nominal reserve remains. It does not yet calculate force transmission through the train.

## Inspection tools retained

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
- **presentation** — geometry, controls, or simulation assumptions added for readability and interaction.

## Next milestones

### M5 — escapement fidelity

- locking and impulse faces;
- banking limits;
- roller jewel / fork interaction;
- discrete causal escape release rather than merely sharing a timing clock;
- begin relating balance amplitude to delivered impulse.

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
