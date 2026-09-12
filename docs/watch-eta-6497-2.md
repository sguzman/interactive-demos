# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M5h — finite polygon escapement contact.**

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

M3 established the reference-derived train topology and its pitch/stack diagnostics. M4 added stateful winding, hand setting, stored reserve, and an energy gate. M5a–M5d made the Swiss lever path event-resolved and geometry-constrained. M5e made normalized balance amplitude affect simulated rate. M5f replaced the assigned oscillator clock with an integrated balance/hairspring state carrying explicit angular position **θ** and angular velocity **ω**. M5g then made reconstructed contact geometry admit or deny each escapement impulse instead of granting a kick automatically at every eligible center crossing.

The sourced nominal rate remains **3 Hz / 21,600 A/h**.

## M5h — finite surfaces replace point / line contact

M5d and M5g still represented the active escape tooth as a point and each pallet working face as a line segment. That was enough to establish causal geometry, but it could not represent surface overlap, finite jewel area, penetration depth, or a true free-flight gap between finite bodies.

M5h replaces that abstraction with convex 2D polygons.

The current causal chain is approximately:

> crown → stored reserve → drive proxy → integrated balance θ/ω → pallet motion → finite escape-tooth / pallet-jewel contact → lock / impulse / drop / capture → geometry-admitted Δω + escape release → train → hands

## Escape-tooth polygon

The tracked tooth polygon mirrors the current visible reconstructed escape-wheel primitive instead of introducing unrelated solver geometry.

Current reconstruction dimensions are approximately:

- escape tip radius: **2.25 mm**;
- tooth depth: **0.70 mm**;
- tooth base width: **0.17 mm**;
- tooth tip width: **26% of base width**;
- tooth hook/skew: **0.22 mm**;
- tooth count: **15**;
- angular tooth pitch: **24°**;
- nominal release per beat: **12° / half tooth**.

These are reconstruction dimensions used by the demo. They are not ETA manufacturing tooth coordinates.

## Pallet-jewel polygons

M5h keeps the entry and exit working edges calibrated by the M5d solver, but each working edge now becomes one edge of a finite rectangular jewel polygon extending back toward the pallet staff.

The current modeled jewel depth is **0.18 mm**. The working-edge length still derives from the M5d reconstructed face length.

This lets the solver distinguish an infinitely thin contact line from an actual finite solid region.

## Polygon separation and overlap

M5h uses a convex separating-axis test to decide whether the active tooth and pallet jewel overlap. When they are separated, the solver also computes a nearest edge/vertex distance. The resulting signed gap is conceptually:

- positive — surfaces are separated;
- approximately zero — surfaces are touching;
- negative — polygons overlap, with magnitude representing penetration depth.

The current maximum accepted reconstruction overlap is **0.018 mm**. Larger overlap marks the state unhealthy and can feed the existing geometry hold behavior.

## Lock

At the beginning of each beat, the active tooth is tested against the starting pallet-jewel polygon. If the surface separation remains inside the current **0.028 mm unlock gap**, the escape wheel remains locked at zero within-beat release.

This replaces the earlier test based only on how far a pallet-face center had moved from its calibration point.

## Impulse following

Once the starting surface clears lock, M5h searches the 12° half-tooth interval for the greatest forward escape-wheel angle at which the starting tooth can still follow the starting pallet jewel inside the current **0.080 mm impulse envelope** without exceeding the penetration limit.

That quasi-static surface-following solution becomes the candidate impulse release angle.

The model remains educational: it does not yet solve contact force, friction, relative sliding work, or elastic impact.

## Drop

If the starting tooth can no longer follow its pallet surface and the target pallet has not yet captured the incoming tooth, the solver enters **DROP · POLYGON FREE FLIGHT**.

The live diagnostics report the minimum remaining finite-surface gap during that free-flight state. Drop therefore becomes a spatial gap between reconstructed bodies rather than only an angular event label.

## Target capture and relock

The solver searches for the first escape-wheel angle at which the incoming tooth polygon approaches the opposite pallet-jewel polygon inside the current **0.030 mm capture gap**. A bounded binary refinement then finds the capture angle more precisely.

That capture angle clamps the half-tooth release and creates the next lock state.

## Monotonic within-beat release

Escape-wheel release is monotonic inside each beat. Once a greater release angle has been achieved, later numerical noise or a slightly different quasi-static surface solution cannot rotate the escape wheel backward within that same half-tooth event.

At the next beat, the completed half-tooth count advances and the within-beat release begins again from zero.

## Polygon-admitted escapement impulse

M5f exposes an impulse-admission hook. M5h now installs the live admission gate directly from polygon contact rather than using M5g's historical point/segment gate.

For each balance center-crossing opportunity, M5h samples the corresponding alternating entry→exit or exit→entry surface path. A Δω kick is admitted only when:

- the polygon solver remains healthy;
- a nontrivial polygon impulse-following interval exists;
- the geometry-derived release progresses across enough of the half-tooth event;
- the active surfaces do not exceed the penetration guard.

A denied surface path delivers **no angular-velocity kick** to the M5f balance.

## Live M5h diagnostics

The **Polygon contact solver · M5h** panel reports:

- current surface event;
- active ENTRY→EXIT or EXIT→ENTRY surfaces;
- signed polygon gap;
- overlap / penetration depth;
- current release angle within the 12° half-tooth step;
- derived free-flight drop gap;
- current polygon impulse-gate decision;
- solver health.

The optional overlay draws:

- the starting pallet-jewel polygon;
- the target pallet-jewel polygon;
- the active escape-tooth polygon;
- the nearest contact/separation line.

Green indicates a healthy surface solution; red indicates a penetration/health check.

## Current M5h reconstruction parameters

The following are explicit educational parameters rather than ETA production tolerances:

- pallet-jewel depth: **0.18 mm**;
- unlock surface gap: **0.028 mm**;
- target capture surface gap: **0.030 mm**;
- impulse-following envelope: **0.080 mm**;
- maximum tolerated polygon overlap: **0.018 mm**;
- release search: **72 samples** over one 12° half-tooth interval;
- capture refinement: **28 bounded search iterations**.

The underlying M5f oscillator parameters also remain normalized reconstruction values: damping ratio, impulse gain, restart threshold, amplitude normalization and educational isochronism law are not measured ETA constants.

## Why this matters

M5h gives the escapement finite bodies on both sides of the contact.

Before M5h:

> tracked tooth tip → abstract pallet-face line

After M5h:

> finite hooked tooth polygon ↔ finite pallet-jewel polygon

That means lock, impulse following, drop, capture, penetration health, escape release, and impulse admission can now refer to the same surface model.

## What M5h still does not claim

M5h is still not factory escapement physics. It does not yet claim or solve:

- ETA production tooth and pallet-jewel CAD;
- exact jewel bevels and edge radii;
- exact lock, draw, drop, or banking dimensions;
- rigid-body impact dynamics;
- oil-film behavior;
- Coulomb / viscous sliding friction;
- contact stress or elastic deformation;
- measured pallet efficiency;
- physical impulse work in joules;
- calibrated train torque at the escape wheel;
- measured balance inertia or hairspring stiffness;
- real production timing performance.

The important architectural improvement is that **finite reconstructed surfaces now govern both directions of escapement causality: release of the train and admission of energy into the oscillator.**

## Inspection workflow

For the clearest M5h inspection:

1. wind the watch;
2. choose **Escapement** view;
3. assemble the movement;
4. enable **Show M5h tooth / jewel polygons**;
5. run at `0.1×` or `0.25×`;
6. compare polygon gap, overlap, release angle, drop gap and impulse-gate state with the M5f θ/ω phase portrait.

The older M5d solver overlay can still be enabled for comparison, which makes the progression from point/segment contact to finite-surface contact directly visible.

## Next milestones

### M5i — impulse work / force proxy

- derive a normalized impulse-work quantity from surface-following travel and available train drive;
- separate available escape-wheel work from work actually delivered to the balance;
- let the delivered Δω depend on geometric work interval rather than only a binary admitted/denied gate;
- expose lost / rejected work diagnostically.

### M5j — roller and safety polygons

- represent roller jewel, fork slot, horns and safety dart as finite collision geometry;
- apply the same polygon framework to fork/roller engagement and overbanking prevention.

### M6 — shared system mechanics

- separate barrel-arbor winding from barrel-drum release;
- represent train load/torque transmission more explicitly;
- couple barrel torque, train load, escapement contact work, oscillator state and reserve into one shared state model;
- replace normalized constants with defensible measured/reference values where possible.

## Sources

- ETA 6497-2 Technical Communication: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/
- ETA 6497-2 spare-parts communication: https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1632/
- Case & Caliber ETA 6497 disassembly: https://caseandcaliber.com/eta-6497-disassembly/
- Horology Student Unitas/ETA 6497/6498 reference: https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/
