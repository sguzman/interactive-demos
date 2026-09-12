# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M3g — endshake, pivot shoulders, and bearing-stack clearance.**

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

## M3f — true-pitch train and stepped staffs

M3f replaced the earlier decorative train tooth radius with a dedicated train-only spur construction whose input has exact pitch-radius semantics. The tooth flank shape is still educational rather than a generated manufacturing profile, but the pitch circles, contact points, and visible tooth envelopes now belong to the same geometric model.

M3f also tightened the bridge-side stack and replaced uniform rods with stepped staffs. Current large-wheel planes are:

- centre: **z = -0.90 mm**;
- third: **z = -1.23 mm**;
- seconds/fourth: **z = -1.55 mm**;
- escape: **z = -0.92 mm**.

Driven pinions remain in the plane of the wheel that drives them. The reconstruction uses the visible mainplate and bridge geometry as an internal clearance envelope rather than pretending those z dimensions came from ETA production drawings.

## M3g — bearing stack and endshake

M3g turns the axial stack from a static placement decision into an explicit inspection model.

### Pivot finishing

The centre, third, seconds/fourth, and escape staffs now receive additional bearing-shape cues:

- narrow conical pivot noses;
- explicit wheel-seat shoulders;
- narrower bridge-side pivot regions;
- visible relation between the staff and the mainplate/bridge jewel centres.

These diameters are **reconstruction geometry**. Their purpose is to make the mechanical role legible and give later refinement a concrete target.

### Endshake targets

M3g introduces small nominal axial-play targets:

- centre wheel: **0.040 mm**;
- third wheel: **0.040 mm**;
- seconds/fourth wheel: **0.040 mm**;
- escape wheel: **0.035 mm**.

These values are deliberately classified as **reconstruction targets, not asserted ETA production tolerances**. They let the model represent the concept of endshake and test whether the current wheel/bridge stack has room for it.

The demo exposes optional endshake motion at **1×**, **10×**, and **25×**. Only 1× corresponds to the reconstruction target; 10× and 25× are explicit diagnostic exaggerations for visual inspection.

### Wheel-body axial gaps

The M3f large-wheel stack was intentionally arranged so neighboring projected wheel envelopes can overlap in XY while remaining separated axially. M3g now calculates and reports those body gaps instead of leaving them implicit.

The important distinction is:

- **gear mesh** happens wheel → small coaxial pinion at the pitch tangent plane;
- **large wheel bodies** may visually overlap in front projection but must remain separated in z.

The new **Show wheel-body gap guides** overlay exposes that separation.

### Inspection controls

The **Train stack** camera preset now enables the stack-related diagnostics together. Additional controls are available for:

- staff / clearance guides;
- endshake range guides;
- wheel-body gap guides;
- exaggerated endshake motion.

The endshake guide links each wheel’s tiny working range to the reconstructed mainplate and bridge jewel regions, making it clear that endshake is axial bearing play rather than gear backlash.

## Camera-axis inspection lighting

Lighting remains at the balanced M3e default:

- **Camera aligned / balanced** is the default;
- the source is directional and therefore independent of zoom distance;
- **Full bright / diagnostic** remains available when geometry is hard to read;
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

### M4a — causal winding state

- explicit crown/stem state: pushed in / winding / setting transition;
- user-driven winding input rather than decorative oscillation;
- crown wheel and ratchet angle derived from that input;
- one-way click constraint;
- normalized mainspring stored-energy state;
- visible power-reserve readout for the simulation state;
- no claim yet that torque curves or friction losses are production-accurate.

### M4b — setting works

- setting position for the stem;
- sliding/winding pinion state change;
- motion-works coupling;
- hand-setting interaction while isolating the barrel winding path.

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
