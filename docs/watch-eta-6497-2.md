# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M5g — geometry-admitted escapement impulse.**

This remains an educational reconstruction, not manufacturing CAD. Official movement facts, reference-derived geometry, approximate geometry, and presentation/simulation assumptions remain distinct provenance classes.

## Official movement facts

ETA technical material supports:

- diameter: **36.60 mm**;
- height: **4.50 mm**;
- frequency: **3 Hz / 21,600 A/h**;
- jewels: **17**;
- lift angle: **44°**;
- power reserve: **53 h minimum / 60 h typical**;
- manual winding;
- hours, minutes, small seconds;
- ETACHRON regulation.

Primary source: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/

## Earlier causal milestones retained

M3 established the reference-derived train topology and its pitch/stack diagnostics. M4 added stateful winding, hand setting, stored reserve, and an energy gate. M5a–M5d made the Swiss lever path event-resolved and then geometry-constrained. M5e made normalized balance amplitude affect simulated rate. M5f replaced the assigned oscillator clock with an integrated balance/hairspring state carrying explicit angular position **θ** and angular velocity **ω**.

The reference train remains:

- centre wheel: 80 teeth;
- third wheel: 60 teeth / 10-leaf pinion;
- seconds/fourth wheel: 120 teeth / 8-leaf pinion;
- escape wheel: 15 teeth / 10-leaf pinion.

The sourced nominal rate remains **3 Hz / 21,600 A/h**.

## M5f oscillator retained

The balance is still numerically integrated from a normalized restoring term and damping term. Successful escapement impulse is represented as an angular-velocity increment **Δω**. At ordinary speeds the model uses bounded ODE substeps; very large diagnostic time scales switch to an explicitly labelled envelope approximation rather than attempting thousands of 3 Hz cycles per rendered frame.

Current educational parameters remain reconstruction-level rather than measured ETA constants, including:

- visual angle normalization: about 0.43 rad;
- damping ratio: 0.006;
- maximum normalized impulse kick: about 0.42 rad/s before reserve/saturation scaling;
- unlock amplitude: 0.18 normalized;
- restart reserve threshold: 1.2%;
- restart amplitude seed: 0.34 normalized.

## M5g — center crossing becomes only an opportunity

M5f still contained one important shortcut: if the balance crossed center with sufficient amplitude, reserve was available, and the geometry solver was broadly healthy, an impulse kick was delivered.

M5g removes that rule.

A center crossing now creates only an **impulse opportunity**. Before the M5f oscillator may receive Δω, M5g probes the calibrated M5d entry/exit pallet path for the corresponding beat.

The causal chain is now approximately:

> crown → reserve → drive proxy → balance center crossing → pallet/tooth impulse-path admission → Δω → integrated θ/ω oscillator → pallet/contact geometry → escape-wheel release → train → hands

## Geometry admission test

For each detailed center crossing, M5g samples the alternating M5d contact path over the reconstructed unlock/impulse interval. The gate requires:

1. the starting pallet face to clear the M5d **0.030 mm** unlock target;
2. the geometry-derived half-tooth release to progress through a nontrivial impulse interval;
3. the tracked escape tooth to remain within a reconstruction-level contact envelope during that interval;
4. the existing M5d **0.006 mm** penetration guard to remain satisfiable;
5. all contact values to remain finite and coherent.

If any of those conditions fail, the crossing receives **no angular-velocity kick**.

## Reused M5d contact geometry

M5g does not invent a separate pallet model. It reuses the calibrated M5d solver faces and tooth phase.

Current M5d reconstruction targets remain:

- escape wheel: 15 teeth;
- tooth pitch: 24°;
- half-tooth release: 12° per beat;
- unlock face travel: 0.030 mm;
- target-face capture distance: 0.040 mm;
- nominal tooth/face contact tolerance: 0.035 mm;
- penetration guard: 0.006 mm.

The extra M5g admission envelope is derived from that reconstruction tolerance for diagnostic robustness. It is **not** an ETA production impulse-face clearance or measured pallet efficiency.

## Live M5g diagnostics

The **Impulse contact gate · M5g** panel exposes:

- gate decision: ADMITTED or DENIED;
- current ENTRY→EXIT or EXIT→ENTRY transition;
- nearest sampled tooth/face gap;
- geometry-derived release span;
- count of sampled points lying inside the reconstructed impulse interval;
- explicit admission or denial reason;
- admitted and denied gate probes;
- optional contact marker joining the tracked tooth to the nearest reconstructed face point.

Green indicates an admitted geometric path; red indicates a denied path.

## Detailed mode and fast-forward mode

At ordinary and slow simulation speeds every detected center crossing asks the M5g geometry gate directly before Δω is delivered.

At large diagnostic time scales, the M5f envelope fast-forward remains active. M5g probes both alternating pallet parities and uses the admitted fraction of those representative paths to scale the average impulse replenishment. This is explicitly an approximation; it avoids pretending the browser performed thousands of detailed contact solves per frame.

## Why this matters

Before M5g, geometry constrained **escape-wheel release**, but energy delivery into the balance was still admitted one level earlier by oscillator timing plus a broad health flag.

After M5g, the same reconstructed contact topology can veto both directions of causality:

- impossible pallet/tooth geometry can stop escape-wheel release;
- impossible pallet/tooth impulse geometry can also stop energy transfer into the balance.

That makes the escapement less like two synchronized animations and more like one coupled mechanism.

## What M5g still does not claim

M5g is not factory escapement physics. It still does not claim:

- exact ETA pallet-jewel or escape-tooth polygons;
- measured lock, draw, drop, impulse-face angles, or banking coordinates;
- rigid-body collision manifolds;
- friction, lubrication, impact compliance, rebound, or elastic deformation;
- measured pallet efficiency or actual impulse work;
- calibrated balance inertia or hairspring stiffness;
- real torque-to-rate behavior or production timing performance.

The important architectural improvement is narrower: **a center crossing no longer guarantees an impulse; reconstructed geometry must admit it.**

## Inspection workflow

For the clearest M5g inspection:

1. wind the watch;
2. choose **Escapement** view;
3. assemble the movement for direct geometric correspondence;
4. enable **Show M5d solver faces / contact point**;
5. enable **Show M5g admitted/denied contact marker**;
6. run at 0.1× or 0.25×;
7. watch the M5g gate decision together with M5f θ, ω, Δω and the M5d release state.

## Next milestones

### M5h — polygonal tooth/jewel contact

- replace tracked tooth-tip / face-segment distance with reconstructed escape-tooth and pallet-jewel polygons;
- derive lock depth, drop and impulse work interval from surface intersections;
- bring roller-jewel/fork-slot and horn safety checks into the same geometric framework.

### M6 — shared system mechanics

- separate barrel-arbor winding from barrel-drum release;
- represent train load/torque transmission more explicitly;
- couple barrel torque, train load, escapement contact, oscillator state and reserve into one shared state model;
- replace normalized constants with defensible measured/reference values where possible.

## Sources

- ETA 6497-2 Technical Communication: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/
- ETA 6497-2 spare-parts communication: https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1632/
- Case & Caliber ETA 6497 disassembly: https://caseandcaliber.com/eta-6497-disassembly/
- Horology Student Unitas/ETA 6497/6498 reference: https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/
