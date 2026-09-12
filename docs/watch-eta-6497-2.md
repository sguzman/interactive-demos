# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M3e — pitch-envelope meshing + balanced camera-axis inspection lighting.**

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

Pitch-derived wheels are much larger than the old decorative placeholders, so a real compound train cannot keep every wheel body in one flat plane. M3d introduced explicit bridge-side wheel planes:

- centre wheel: **z = -0.65 mm**;
- third wheel: **z = -1.10 mm**;
- seconds/fourth wheel: **z = -1.55 mm**;
- escape wheel: **z = -0.65 mm**.

The z values remain reconstruction dimensions. The mechanically important constraint is relational:

- the **third pinion** is placed in the centre-wheel plane;
- the **seconds/fourth pinion** is placed in the third-wheel plane;
- the **escape pinion** is placed in the seconds/fourth-wheel plane.

That gives each compound wheel/pinion assembly a reason for its axial arrangement rather than simply drawing four wheel bodies on one sheet.

## M3e pitch-envelope meshing and contact phase

M3e addresses the user's correct visual complaint that the train still did not *read* as connected even though the pitch-radius math closed.

The simplified constructive gear primitive does not take a true pitch radius directly: its authored `radius` sits between root and tip conventions. M3e therefore compensates the visual radius so the simplified tooth envelope actually straddles the solved pitch circle instead of sitting noticeably inside it.

It also solves a static tooth/gap phase through the compound train:

1. the centre wheel is the phase anchor;
2. the third pinion is rotated so a gap complements the centre-wheel tooth phase at their line of centres;
3. the seconds/fourth pinion is solved from the already-constrained third-wheel phase;
4. the escape pinion is solved from the seconds/fourth-wheel phase.

The dynamic velocity ratios remain those from M3a, so this phase solve changes initial engagement, not the train ratios.

### Mesh guides

The demo now has an optional **Show pitch mesh guides** control plus a dedicated **Train mesh** camera preset.

For each compound mesh the guide shows:

- the upstream wheel pitch circle;
- the driven pinion pitch circle in the same axial plane;
- the line of centres connecting them.

This matters because a front projection can make the large wheel bodies look separated: the real train connection is wheel → **small coaxial pinion**, not wheel → neighboring large wheel. The guides make that hidden relationship explicit instead of asking the viewer to infer it.

## Camera-axis inspection lighting

The M3d lighting fix overshot in the opposite direction, so M3e rebalances the default rather than removing the useful headroom.

Current behavior:

- **Camera aligned / balanced** is the default;
- the camera source remains directional and therefore independent of zoom distance;
- default camera intensity, ambient/fill, environment reflection and exposure are all reduced from M3d;
- **Full bright / diagnostic** remains intentionally excessive when geometry is genuinely hard to read;
- camera and manual intensity sliders still reach **700**;
- exposure still reaches **3.20×**;
- manual azimuth/elevation/distance controls remain available for raking light.

The goal is now a neutral middle default with a very large usable adjustment range in both directions.

## Simulation presentation

The train defaults to **1× real time**. Optional 10×, 60×, and 300× inspection scales accelerate the train and hands for visual study. The balance remains at the documented real 3 Hz.

## Constructive geometry policy

Authored geometry is expressed in millimetres. Current primitives include:

- `disc`, `ring`, `box`;
- `roundedPlate`, `caseRing`, `polygonPlate`, `plateWithHoles`;
- `gear`, `escapeWheel`, `pinion`;
- `screw`, `jewel`, `shockSetting`;
- `coil`, `pathTube`, `makeHand`.

M3e still uses deliberately simplified tooth geometry. True involute/cycloidal tooth profiles remain a later fidelity problem.

## Provenance classes

- **official** — directly supported by technical material;
- **reference-derived** — reconstructed from service diagrams, teardown photographs, or multiple sources;
- **approximate** — simplified geometry preserving role and relative placement;
- **presentation** — geometry or controls added for readability/explanation.

## Next milestones

### M3f — interference, staffs and bridge clearance

- inspect pitch-derived wheel envelopes against bridges and neighboring parts;
- replace uniform arbors with more believable stepped staffs / shoulders;
- refine bridge-side and mainplate-side pivot heights;
- align staffs with jewel seats through the compound planes;
- make bridge clearances and wheel endshake visually defensible;
- keep explicit diagnostics for any reconstructed rather than sourced dimensions.

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
