# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M3a — reference train kinematics.**

M2 established the first serious bridge/plate pass: separate barrel, train, pallet and balance bridges; official bridge screw counts; bridge-side jewel locations; dial-side keyless works; visible shock setting/regulator indication; and improved constructive wheel geometry.

M3a begins replacing decorative animation with a mechanically constrained timing graph. The wheel train and hands now derive from a reference-documented 6497 training-tool ratio set rather than arbitrary per-wheel speeds.

The project remains an educational reconstruction, not manufacturing CAD. Every important object should preserve provenance so official dimensions and facts remain distinct from reference-derived or presentation geometry.

## Target

The movement target is the **ETA / Unitas 6497-2**. The surrounding wristwatch shell is a 44 mm exhibition-style presentation influenced by the OP XI / Luminor lineage, but it is not asserted as exact production-case geometry.

The movement is the strict target; the shell is context.

## Official movement facts

ETA's current 6497-2 technical communication specifies:

- diameter: **36.60 mm**;
- movement height: **4.50 mm**;
- frequency: **3 Hz / 21,600 A/h**;
- jewel count: **17**;
- typical balance lift angle: **44°**;
- minimum power reserve: **53 h**;
- typical power reserve: **60 h**;
- manual winding;
- hours, minutes and small seconds;
- ETACHRON regulator system.

Primary source:

- ETA Technical Communication, 6497-2: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/

## Official parts backbone

ETA's 6497-2 spare-parts documentation is the canonical naming spine. M2/M3a use these identities where relevant:

- pos. 1 — main plate, assembled;
- pos. 12 — escape wheel;
- pos. 13 — third wheel;
- pos. 14 — second / seconds wheel;
- pos. 15 — centre wheel;
- pos. 16 — train wheel bridge, jewelled;
- pos. 17 — movement barrel, complete;
- pos. 18 — barrel bridge, jewelled;
- pos. 19 — crown wheel ring;
- pos. 20 — crown wheel;
- pos. 21 — click spring;
- pos. 22 — click;
- pos. 23 — ratchet wheel;
- pos. 24 — driver cannon pinion;
- pos. 25 — pallet fork;
- pos. 26 — pallet bridge, jewelled;
- pos. 27 — timed balance regulated, with stud;
- pos. 28 — balance bridge, assembled;
- pos. 29 — hour wheel.

ETA spare-parts communication:

- https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1632/

## M2 bridge constraints

The current bridge pass respects these documented visual/mechanical constraints:

- barrel bridge: **3 screws**;
- train wheel bridge: **2 screws**;
- pallet bridge: **2 screws**;
- balance bridge: **1 screw**;
- train bridge: three visible jewels supporting the third, seconds/fourth and escape-wheel pivots.

Teardown reference:

- https://caseandcaliber.com/eta-6497-disassembly/

## M3a train kinematics

The first train-kinematics pass uses a **reference-derived training-tool ratio set** documented by Horology Student. It is useful because it closes mathematically at 21,600 A/h:

- escape wheel: 15 teeth, associated 10-leaf pinion in the reported train data;
- seconds/fourth wheel: 120 teeth, 8-leaf pinion;
- third wheel: 60 teeth, 10-leaf pinion;
- centre wheel: 80 teeth.

At 6 beats per second this produces:

- escape wheel: one revolution per **5 s**;
- seconds/fourth wheel: one revolution per **60 s**;
- third wheel: one revolution per **450 s / 7.5 min**;
- centre wheel: one revolution per **3600 s / 1 h**.

The demo derives those periods from the ratios in `watch/kinematics.js` and validates the closure at startup. Small seconds is driven from the seconds/fourth-wheel state; the minute hand follows the centre-wheel period; the hour hand follows a 12-hour period.

Important caveat: the source describes an ETA training-tool version and explicitly notes that ratios can differ from another deconstructed movement. Therefore these tooth counts are tagged **reference-derived**, not official manufacturing counts for every 6497-2 production variant. Visual wheel tooth counts/centre distances are still being brought into alignment during M3.

Reference:

- https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/

## Corrected escapement timing

M3a also fixes an important conceptual error from M1/M2 animation: at 21,600 A/h the lever releases the escape wheel by **half a tooth per beat**, not one full tooth per beat. With a 15-tooth escape wheel and 6 beats per second, that gives 30 beat-steps per full revolution and therefore a 5-second escape-wheel period.

This is still a timing model, not yet a geometric locking/impulse simulation. M5 will make pallet locking, impulse faces, banking and roller-jewel interaction causal.

## Constructive geometry policy

Authored geometry is expressed in **millimetres** and generated from inspectable parameters where practical.

Current primitive vocabulary:

- `disc`
- `ring`
- `box`
- `roundedPlate`
- `caseRing`
- `polygonPlate`
- `plateWithHoles`
- `gear`
- `escapeWheel`
- `pinion`
- `screw`
- `jewel`
- `shockSetting`
- `coil`
- `pathTube`
- `makeHand`

Bridge holes are constructive geometry. Generic gear teeth are tapered rather than rectangular; the escape wheel receives asymmetric hooked presentation teeth. Boolean CSG remains deferred until it materially helps with plate recesses, screw seats, bridge undercuts or case geometry.

## Provenance classes

- **official** — dimension or fact directly supported by technical material;
- **reference-derived** — reconstructed from service diagrams, teardown photographs or multiple references;
- **approximate** — deliberately simplified while preserving role and relative placement;
- **presentation** — geometry added for clarity or visual communication rather than mechanical fidelity.

M3a's timing ratios are **reference-derived**. ETA's frequency, movement dimensions, jewel count, lift angle and reserve figures remain **official**.

## Functional assemblies

1. **case / protection** — case, crystal, exhibition back and crown guard;
2. **display** — dial and hands;
3. **motion works** — driver cannon pinion and hour wheel;
4. **winding / keyless works** — dial-side crown-position mechanism plus bridge-side crown wheel, ratchet, click and spring;
5. **power** — barrel and mainspring;
6. **wheel train** — centre, third, seconds/fourth and escape wheels with visible arbors;
7. **escapement** — escape wheel, pallet fork and pallet stones;
8. **oscillator / regulation** — balance, hairspring, balance bridge, shock setting and regulator indication;
9. **structure** — mainplate, individual bridges, jewels and screws.

## Remaining realism milestones

### M3b — train geometry fidelity

Next target:

- align visible wheel/pinion tooth counts with the reference-derived ratio set where defensible;
- add the missing escape pinion explicitly;
- solve more plausible centre distances from pitch/module assumptions instead of hand placement;
- improve arbors/staffs and wheel heights;
- keep the training-tool ratio caveat visible.

### M4 — winding fidelity

- make crown/stem position stateful;
- distinguish winding from hand-setting;
- transmit crown rotation through the keyless works and ratchet;
- animate the click as a one-way constraint;
- store normalized mainspring energy.

### M5 — escapement fidelity

- improve escape tooth geometry from real references;
- place locking and impulse faces on pallet stones;
- introduce banking limits;
- model roller jewel / fork interaction;
- make escape motion causal rather than beat-indexed timing;
- improve balance staff and hairspring geometry.

### M6 — system simulation

- barrel energy drives the train;
- gear ratios derive all wheel speeds;
- escapement meters release;
- balance state controls release timing;
- hands derive from the same solved mechanical state.

### M7 — shell fidelity

- refine case, crystal, crown guard, dial and caseback from explicit reference dimensions;
- keep shell-fidelity truth claims separate from movement fidelity.

## Inspection tools

The demo provides:

- hard movable key light via azimuth/elevation/distance controls;
- intensity and ambient controls;
- shadow toggle;
- visible light gizmo;
- hard, raking, top, backlit, studio and dark presets;
- camera presets for overview, bridge side, dial side, escapement and winding.

## Accuracy statement

Until geometry is tagged `official`, do not interpret it as a manufacturing dimension. The project is explicitly allowed to become more exact over time, but it must preserve the boundary between sourced measurement and reconstruction.
