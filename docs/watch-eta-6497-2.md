# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M3c — mesh-derived train geometry + camera-axis inspection lighting.**

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

M3b made the visible train use the same reference tooth/leaf counts as the timing graph:

- centre wheel: **80 teeth**;
- third wheel: **60 teeth + 10-leaf pinion**;
- seconds/fourth wheel: **120 teeth + 8-leaf pinion**;
- escape wheel: **15 teeth + 10-leaf pinion**.

## M3c mesh-derived train geometry

M3c removes another arbitrary layer. The current reference-derived centre coordinates are now used to solve a nominal module and pitch radius for each external wheel/pinion mesh using:

`module = 2 × centre_distance / (wheel_teeth + pinion_leaves)`

Current reconstruction solve:

- centre wheel → third pinion: centre distance **6.466 mm**, module **0.1437 mm**, nominal pitch radii **5.748 mm + 0.718 mm**;
- third wheel → seconds/fourth pinion: centre distance **5.972 mm**, module **0.1756 mm**, nominal pitch radii **5.269 mm + 0.703 mm**;
- seconds/fourth wheel → escape pinion: centre distance **9.277 mm**, module **0.1427 mm**, nominal pitch radii **8.563 mm + 0.714 mm**.

Those sums close to the current centre distances by construction. This is a meaningful improvement over hand-picked wheel radii, but the centre coordinates themselves are still **reference-derived reconstruction coordinates**, not ETA manufacturing drawings. M3c therefore improves internal geometric consistency without upgrading provenance to official CAD.

The escape-wheel tooth radius remains separately reference-derived because its wheel geometry belongs to the escapement; only its pinion participates in the seconds-to-escape train mesh solve.

## Lighting repair and camera-axis mode

The earlier lighting really was too dark. The movement is dominated by metallic PBR materials, so useful inspection requires both reflections and direct illumination.

The current rig includes:

- neutral `RoomEnvironment` reflections for metal readability;
- a much stronger movable spot key;
- broad fill and rim sources;
- higher scene-environment intensity;
- exposure range up to **3.20×**;
- manual-key intensity range up to **700**;
- explicit **Camera aligned** mode;
- a separate camera-light intensity range up to **700**;
- **Camera + manual key** mode for combined frontal and raking inspection;
- **Full bright / diagnostic** preset for maximum readability.

Camera-aligned mode conceptually places a directional inspection source just behind the camera and aims it through the orbit target. Because it is directional, its apparent brightness does not collapse as the camera moves farther from the watch. A slightly offset camera fill preserves relief on nearly frontal metal faces.

The manual azimuth/elevation/distance controls remain available for deliberate raking light.

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

### M3d — wheel planes and staffs

- refine z-heights for wheels and pinions so each mesh occupies a defensible plane;
- improve staffs/arbors and bridge clearances;
- inspect interference introduced by the larger pitch-derived wheel radii;
- continue replacing decorative geometry with dimensionally constrained relationships.

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
