# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M3b — reference train geometry + inspection-light rebuild.**

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

## M3b visible train

`watch/train-refinement.js` now makes the visible train use those same reference counts. It replaces the placeholder wheel meshes after scene construction while preserving the existing movement assembly and inspector.

Current M3b visual declarations:

- centre wheel: **80 teeth**;
- third wheel: **60 teeth + 10-leaf pinion**;
- seconds/fourth wheel: **120 teeth + 8-leaf pinion**;
- escape wheel: **15 teeth + 10-leaf pinion**.

Important boundary: **the wheel radii and centre distances are still reconstruction geometry.** M3b aligns topology and count. M3c will work toward a more defensible pitch/module/centre-distance model and staff heights.

## Lighting repair

The earlier lighting really was too dark. Two technical problems were responsible:

1. the movement is mostly metallic PBR material but the scene had no environment map, leaving many metal faces with little useful reflection;
2. the SpotLight UI intensity was fed straight into a physically attenuated light, making values around 145 very weak at roughly 60 mm working distance.

The rebuilt rig adds:

- a neutral `RoomEnvironment` reflection field for metal readability;
- a scaled movable spot key;
- broad directional fill;
- a camera-following inspection light;
- exposure control;
- a **Full bright / diagnostic** preset;
- existing hard/raking/top/backlit/studio/dark modes.

The lighting is now explicitly an inspection system, not just a beauty-render setup.

## Simulation presentation

The train defaults to **1× real time**. Optional 10×, 60×, and 300× inspection scales accelerate the train and hands for visual study. The balance remains at the documented real 3 Hz, so accelerated modes are presentation tools rather than claims of synchronized physical simulation.

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

### M3c — train layout fidelity

- derive more defensible pitch radii / module assumptions;
- solve better centre distances;
- improve wheel heights, staffs and meshing planes;
- keep the training-tool-ratio caveat explicit.

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
