# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M2 — bridge / plate fidelity.**

The demo is a movement-first educational reconstruction centered on the ETA/Unitas 6497-2 family. M2 moves beyond the original generic mechanical-watch sketch: the movement now has separate barrel, train, pallet and balance bridges; official bridge screw counts; bridge-side jewel positions; explicit dial-side keyless works; improved gear teeth; a more legible Swiss-lever escape wheel; and camera presets for inspecting the bridge side, dial side, winding system and escapement.

The project is still intentionally not manufacturing CAD. Every important object is expected to carry a provenance label so that official dimensions and facts remain distinct from reference-derived or presentation geometry.

## Target

The movement target is the **ETA / Unitas 6497-2**. The surrounding wristwatch shell is a 44 mm exhibition-style presentation influenced by the OP XI / Luminor lineage, but it is not asserted as exact production-case geometry.

The movement is the strict target; the shell is context.

## Why this movement

The 6497 family is unusually good for an interactive explainer:

- large 36.60 mm movement diameter;
- manual winding and therefore a clean, visible power path;
- classical Swiss lever escapement;
- small-seconds layout;
- extensive technical/service documentation;
- unusually legible bridge architecture;
- decades of use as a teaching and modification platform.

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

- ETA Technical Communication, 6497-2 (CT 6497-2 FDE 482448 14): https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/

## Official parts backbone

ETA's 6497-2 spare-parts documentation provides a useful canonical vocabulary for the reconstruction. M2 uses the following part identities where relevant:

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

Current ETA spare-parts communication:

- https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1632/

## Bridge screw counts used in M2

The official 6497 documentation gives a useful mechanical constraint that is visually obvious in teardown material:

- **barrel bridge: 3 screws**;
- **train wheel bridge: 2 screws**;
- **pallet bridge: 2 screws**;
- **balance bridge: 1 screw**.

The train wheel bridge also visibly carries three jewels supporting the third, seconds/fourth and escape wheel pivots in teardown references.

Useful teardown reference:

- Case & Caliber, ETA 6497 disassembly: https://caseandcaliber.com/eta-6497-disassembly/

## Reference-watch lineage

The shell and dial presentation take cues from the **Panerai Luminor Marina / OP XI** lineage because it is a famous wristwatch presentation of a 6497-2-derived hand-wound movement. Brand marks and exact production engraving are intentionally excluded.

This project should not silently slide from "6497-2 reference reconstruction" into "exact PAM111 clone." A branded case reproduction would be a separate fidelity problem.

## Constructive geometry policy

Authored geometry is expressed in **millimetres** and should be generated from inspectable parameters wherever practical.

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

M2 adds actual holes to bridge shapes rather than drawing every bridge as an opaque slab. Generic gear teeth are tapered rather than rectangular, while the escape wheel receives visibly asymmetric hooked teeth.

The constructive layer remains deliberately small. Boolean CSG should only be added when it becomes materially useful for faithful plate recesses, bridge undercuts, screw seats or case geometry.

## Provenance classes

Every important component should carry one of these classes:

- **official** — a dimension or fact directly supported by technical material;
- **reference-derived** — reconstructed from service diagrams, teardown photographs or multiple secondary references;
- **approximate** — deliberately simplified while preserving role and relative placement;
- **presentation** — geometry added for clarity or visual communication rather than mechanical fidelity.

M2 intentionally labels the bridge contours `reference-derived`, not `official`. Their screw counts and part identities are much firmer than their current exact outlines.

## Functional assemblies

The scene distinguishes:

1. **case / protection** — case, crystal, exhibition back and crown guard;
2. **display** — dial and hands;
3. **motion works** — driver cannon pinion and hour wheel;
4. **winding / keyless works** — stem-side winding pinion, sliding pinion, setting wheel, minute wheel, yoke and setting lever, plus bridge-side crown wheel, crown-wheel ring, ratchet, click and click spring;
5. **power** — barrel and mainspring;
6. **wheel train** — centre, third, seconds/fourth and escape wheels with visible arbors;
7. **escapement** — escape wheel, pallet fork and stones;
8. **oscillator / regulation** — balance, hairspring, bridge shock setting and regulator indication;
9. **structure** — mainplate, barrel bridge, train bridge, pallet bridge, balance bridge, jewels and screws.

## M2 changes now implemented

- separated bridge parts instead of one generic `bridges` object;
- three-screw barrel bridge;
- two-screw train bridge;
- two-screw pallet bridge;
- one-screw balance bridge;
- bridge jewel seats aligned to the pivots they retain;
- visible balance shock setting and regulator indication;
- dial-side keyless works;
- crown wheel ring and click spring;
- explicit wheel arbors;
- tapered general gear teeth;
- asymmetric escape-wheel tooth geometry;
- official current 53 h minimum / 60 h typical power-reserve facts;
- camera presets for overview, bridge side, dial side, escapement and winding inspection.

## Remaining realism milestones

### M3 — train fidelity

Next target:

- derive better wheel/pinion diameters and tooth-count relationships;
- solve centre distances instead of merely placing visually plausible gears;
- model the second-wheel/small-seconds output more faithfully;
- distinguish wheel and pinion arbors/staffs more accurately;
- replace independent decorative train speeds with ratios derived from a gear graph.

### M4 — winding fidelity

- model the winding stem, winding pinion and sliding pinion as a causal state machine;
- distinguish winding vs hand-setting crown position;
- transmit crown rotation through the crown wheel and ratchet;
- represent stored mainspring energy;
- animate the click as a one-way constraint.

### M5 — escapement fidelity

- improve escape tooth geometry from real references;
- place locking and impulse faces on the pallet stones;
- introduce banking limits;
- model roller jewel / fork interaction;
- make escape motion causal rather than beat-indexed animation;
- improve balance staff and regulator geometry.

### M6 — simulation

- barrel energy drives the train;
- gear ratios derive all wheel speeds;
- escapement meters release;
- balance state controls release timing;
- hands derive from the same solved mechanical state.

### M7 — shell fidelity

- refine case, crystal, crown guard, dial and caseback from explicit reference dimensions;
- keep this separate from the movement-fidelity truth claims.

## Lighting and inspection

The demo is meant to function as an inspection tool, not merely a beauty render. It therefore provides:

- hard movable key light via azimuth/elevation/distance controls;
- intensity and ambient controls;
- shadow toggle;
- visible light gizmo;
- hard, raking, top, backlit, studio and dark presets;
- camera presets aimed at actual mechanical subsystems.

## Accuracy statement

Until geometry is tagged `official`, do not interpret it as a manufacturing dimension. The project is explicitly allowed to become more exact over time, but it must preserve the boundary between sourced measurements and reconstruction.
