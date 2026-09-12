# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M3d — compound train planes + camera-axis inspection lighting.**

The project remains an educational reconstruction, not manufacturing CAD. Official movement facts, reference-derived geometry, approximation, and presentation-only geometry remain separate provenance classes.

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

## M2 structural pass

M2 established separate barrel, train, pallet and balance bridges; documented bridge screw counts; bridge-side jewel positions; keyless works; crown-wheel ring/click spring; explicit arbors; visible shock setting/regulator indication; constructive bridge holes; tapered gear teeth; and a more specific escape-wheel primitive.

## M3a timing graph

`watch/kinematics.js` uses a reference-derived 6497 training-tool ratio set:

- escape wheel: **15 teeth**, associated **10-leaf pinion**;
- seconds/fourth wheel: **120 teeth**, **8-leaf pinion**;
- third wheel: **60 teeth**, **10-leaf pinion**;
- centre wheel: **80 teeth**.

At 21,600 A/h / 6 beats per second this closes to:

- escape: **5 s/rev**;
- seconds/fourth: **60 s/rev**;
- third: **450 s / 7.5 min per rev**;
- centre: **3600 s / 1 h per rev**.

The Swiss-lever timing model advances the escape wheel **half a tooth per beat**, not a full tooth.

Reference: https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/

## M3b visible train counts

M3b made the visible train use the same reference tooth/leaf counts as the timing graph:

- centre wheel: **80 teeth**;
- third wheel: **60 teeth + 10-leaf pinion**;
- seconds/fourth wheel: **120 teeth + 8-leaf pinion**;
- escape wheel: **15 teeth + 10-leaf pinion**.

## M3c pitch-derived train geometry

M3c removed another arbitrary layer. The current reference-derived centre coordinates are used to solve a nominal module and pitch radius for each external wheel/pinion mesh using:

`module = 2 × centre_distance / (wheel_teeth + pinion_leaves)`

Current reconstruction solve:

- centre wheel → third pinion: centre distance **6.466 mm**, module **0.1437 mm**, nominal pitch radii **5.748 mm + 0.718 mm**;
- third wheel → seconds/fourth pinion: centre distance **5.972 mm**, module **0.1756 mm**, nominal pitch radii **5.269 mm + 0.703 mm**;
- seconds/fourth wheel → escape pinion: centre distance **9.277 mm**, module **0.1427 mm**, nominal pitch radii **8.563 mm + 0.714 mm**.

Those radii close against the current centre distances by construction. The centre coordinates remain **reference-derived reconstruction coordinates**, not ETA manufacturing coordinates.

## M3d compound wheel planes

Pitch-derived wheels are much larger than the old decorative placeholders, so a real compound train cannot keep every wheel body in one flat plane. M3d therefore introduces explicit bridge-side wheel planes:

- centre wheel: **z = -0.65 mm**;
- third wheel: **z = -1.10 mm**;
- seconds/fourth wheel: **z = -1.55 mm**;
- escape wheel: **z = -0.65 mm**.

The z values are still reconstruction dimensions. The mechanically important constraint is relational:

- the **third pinion** is placed in the centre-wheel plane;
- the **seconds/fourth pinion** is placed in the third-wheel plane;
- the **escape pinion** is placed in the seconds/fourth-wheel plane.

That means each compound wheel/pinion assembly now has a reason for its axial arrangement. Large wheel bodies can pass over or under one another while the pinions meet the wheels that actually drive them.

The existing long visible arbors span these planes; later work will refine shoulder heights, pivot lengths, bridge clearances and jewel seating.

## Camera-axis inspection lighting

The default lighting is intentionally an **inspection instrument** rather than a dark beauty render.

Current controls include:

- **Camera aligned** mode: a directional source conceptually behind the camera shines straight through the orbit target;
- **Manual key only**: movable azimuth/elevation/distance key for raking light;
- **Camera + manual key**: frontal readability plus surface relief;
- camera intensity up to **700**;
- manual key intensity up to **700**;
- ambient/fill up to **1.20**;
- exposure up to **3.20×**;
- **Full bright / diagnostic** preset;
- neutral `RoomEnvironment` reflections, broad fill, rim light and a lighter backboard.

The camera source is directional so its readability does not collapse with camera distance.

## Simulation presentation

The train defaults to **1× real time**. Optional 10×, 60×, and 300× inspection scales accelerate the train and hands for visual study. The balance remains at the documented real 3 Hz.

## Constructive geometry policy

Authored geometry is expressed in millimetres. Current primitives include:

- `disc`, `ring`, `box`;
- `roundedPlate`, `caseRing`, `polygonPlate`, `plateWithHoles`;
- `gear`, `escapeWheel`, `pinion`;
- `screw`, `jewel`, `shockSetting`;
- `coil`, `pathTube`, `makeHand`.

## Provenance classes

- **official** — directly supported by technical material;
- **reference-derived** — reconstructed from service diagrams, teardown photographs, or multiple sources;
- **approximate** — simplified geometry preserving role and relative placement;
- **presentation** — geometry or controls added for readability/explanation.

## Next milestones

### M3e — interference and staff refinement

- inspect pitch-derived wheel envelopes against bridges and neighboring parts;
- refine arbor/staff shoulder geometry;
- improve bridge-side pivot heights and clearances;
- add optional train mesh/pitch diagnostics in the scene.

### M4 — winding fidelity

- stateful crown/stem positions;
- winding vs hand-setting modes;
- causal keyless works and ratchet rotation;
- one-way click behavior;
- stored mainspring energy.

### M5 — escapement fidelity

- locking/impulse faces;
- banking limits;
- roller jewel / fork interaction;
- causal escape release.

### M6 — system simulation

- barrel energy drives train;
- escapement meters release;
- balance state governs timing;
- hands derive from the shared mechanical state.
