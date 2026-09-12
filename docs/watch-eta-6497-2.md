# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M3f — true-pitch train teeth + stepped staffs + clearance-aware axial stack.**

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

## M3a — reference train timing

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

The Swiss-lever timing model advances the escape wheel **half a tooth per beat**.

Reference: https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/

## M3b–M3e — counts, pitch solve, axial planes and mesh phase

The reconstruction progressively removed decorative assumptions:

- M3b made the visible train use the reference tooth/leaf counts;
- M3c solved nominal module and pitch radius from the current reference-derived centre coordinates;
- M3d separated compound wheel bodies into different axial planes so wheel bodies could pass over/under one another while pinions remained in the plane of the wheel that drives them;
- M3e solved initial tooth/gap phase and added pitch-circle diagnostics.

The current nominal mesh solve remains:

- centre wheel → third pinion: centre distance **6.466 mm**, module **0.1437 mm**, pitch radii **5.748 mm + 0.718 mm**;
- third wheel → seconds/fourth pinion: centre distance **5.972 mm**, module **0.1756 mm**, pitch radii **5.269 mm + 0.703 mm**;
- seconds/fourth wheel → escape pinion: centre distance **9.277 mm**, module **0.1427 mm**, pitch radii **8.563 mm + 0.714 mm**.

Those pitch radii close against the current centre distances by construction. The XY centres themselves are still **reference-derived reconstruction coordinates**, not ETA manufacturing coordinates.

## M3f — true-pitch tooth semantics

The earlier constructive `gear()` primitive did not use its input radius as a strict pitch radius. That meant the mathematics could close while the rendered teeth still looked visibly disconnected.

M3f adds a dedicated train-only spur construction whose input **is** the pitch radius. It uses:

- a pitch circle with exact semantic meaning;
- approximate addendum and dedendum around that pitch line;
- tooth width of roughly half a circular pitch at the pitch circle;
- narrower tooth tips and wider roots;
- a hub/rim/spoke structure independent of tooth placement.

The profile is still **not a generated involute**. It is an educational tooth form designed so a solved pitch pair visibly meets where the pitch circles are tangent. This is a materially stronger claim than the old decorative radius while remaining below manufacturing CAD.

### Contact diagnostics

**Show pitch mesh guides** now displays for each train mesh:

- both pitch circles;
- the line of centres;
- a bright contact marker at the pitch tangent point.

The dedicated **Train mesh** camera view enables those guides automatically.

## M3f — clearance-aware axial stack

M3f also tightens the reconstructed bridge-side stack. Current wheel planes are:

- centre: **z = -0.90 mm**;
- third: **z = -1.23 mm**;
- seconds/fourth: **z = -1.55 mm**;
- escape: **z = -0.92 mm**.

Driven pinions remain in the plane of the wheel that drives them:

- third pinion → centre-wheel plane;
- seconds/fourth pinion → third-wheel plane;
- escape pinion → seconds/fourth-wheel plane.

The current clearance envelope uses visible reconstruction surfaces already present in the model:

- mainplate bridge-side reference surface: about **z = -0.57 mm**;
- barrel-bridge underside reference: about **z = -1.91 mm**;
- train-bridge underside reference: about **z = -1.93 mm**;
- mainplate jewel centre: about **z = -0.68 mm**;
- centre-wheel upper jewel centre: about **z = -2.70 mm**;
- train-wheel upper jewel centres: about **z = -2.72 mm**.

These are reconstruction dimensions, not sourced ETA stack heights. They are used to make the current model internally coherent and to expose remaining interference rather than hide it.

## M3f — stepped staffs and pivots

The old train used generic uniform rods. M3f hides those presentation arbors and adds separate stepped staffs for the centre, third, seconds/fourth and escape assemblies.

Each staff now has:

- a narrow mainplate-side pivot;
- a central arbor;
- a wider wheel-seat collar;
- a narrower bridge neck;
- a small polished bridge-side pivot extending into the visible jewel plane.

This is still schematic, but it gives the wheel/pinion/bridge stack a recognizable bearing relationship instead of making the wheels float on identical cylinders.

### Staff / clearance diagnostics

The new **Train stack** view turns the movement sideways and automatically enables **Show staff / clearance guides**. The guide overlays:

- the reconstructed mainplate-side clearance plane;
- the reconstructed bridge-underside plane;
- vertical staff lines running between the plate and bridge jewel regions.

This is intended as an engineering inspection aid, not a presentation effect.

## Camera-axis inspection lighting

Lighting remains at the balanced M3e default after the previous over-bright correction:

- **Camera aligned / balanced** is the default;
- the source is directional and therefore independent of zoom distance;
- **Full bright / diagnostic** remains available when geometry is genuinely hard to read;
- camera and manual intensity sliders retain large headroom;
- manual azimuth/elevation/distance controls remain available for raking light.

## Simulation presentation

The train defaults to **1× real time**. Optional 10×, 60×, and 300× inspection scales accelerate the train and hands for visual study. The balance remains at the documented real 3 Hz.

## Provenance classes

- **official** — directly supported by technical material;
- **reference-derived** — reconstructed from service diagrams, teardown photographs, or multiple sources;
- **approximate** — simplified geometry preserving role and relative placement;
- **presentation** — geometry or controls added for readability/explanation.

## Next milestones

### M3g — bridge and endshake refinement

- compare the new staff stack against the actual bridge/jewel geometry in more detail;
- refine pivot lengths, shoulders and wheel-seat positions;
- model small endshake/clearance rather than merely positive gross clearance;
- improve wheel/pinion tooth flank shape toward a more defensible horological profile;
- begin checking bridge contours against the enlarged pitch-derived wheel envelopes.

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
