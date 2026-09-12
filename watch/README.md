# Watch demo

Interactive exploded reconstruction of the ETA/Unitas 6497-2 inside a 44 mm exhibition-style wristwatch shell.

## Current milestone

**M5h — finite polygon escapement contact.**

The watch is now substantially beyond a decorative exploded view. Crown winding creates persistent reserve; the keyless works separate winding and hand-setting modes; stored reserve gates runtime; M5f integrates the balance as explicit angular position/velocity state; and M5h now constrains escapement release and impulse admission from finite reconstructed tooth and pallet-jewel surfaces rather than from a tooth-tip point against abstract face segments.

## Files

- `index.html` — UI shell and import map.
- `main-m5a.js` — current scene orchestration path; historical filename retained for continuity.
- `movement.js` — movement/watch construction, metadata and provenance.
- `train-m3g.js` — pitch, staff, bearing, endshake and wheel-body-clearance reconstruction.
- `winding-m4a.js` — crown/ratchet/click and stored-reserve state.
- `keyless-m4b.js` — stem modes and hand-setting path.
- `power-m4c.js` — reserve-consuming runtime gate.
- `escapement-m5b.js` — pallet/safety geometry and event diagnostics.
- `escapement-m5c.js` — historical normalized oscillator envelope and reserve/impulse proxy.
- `escapement-m5d.js` — calibrated entry/exit face geometry and the earlier point/segment half-tooth contact solver.
- `escapement-m5e.js` — explicit educational amplitude→rate modifier.
- `escapement-m5f.js` — integrated θ/ω balance/hairspring state with a pluggable impulse-admission hook.
- `escapement-m5g.js` — historical geometry-admitted impulse gate built on the M5d point/segment contact representation.
- `escapement-m5h.js` — current finite-surface solver: escape-tooth polygons, pallet-jewel polygons, polygon separation/overlap, lock/impulse/drop/capture release and polygon-admitted Δω.
- `escapement-m5a.js` — compatibility re-export pointing at the current escapement implementation.

## Current causal chain

`crown → stored reserve → drive proxy → integrated balance θ/ω → pallet motion → finite tooth/jewel polygon contact → lock / impulse / drop / capture → geometry-admitted Δω + escape release → train → hands`

M5h replaces the last major **point/line** abstraction in the escapement. Each active escape tooth is reconstructed as the same tapered/hooked 2D primitive used by the visible escape wheel. Each calibrated entry/exit pallet face becomes the working edge of a finite jewel polygon extending back toward the pallet staff.

The solver now evaluates convex-surface contact using polygon separation and overlap. Those finite surfaces decide:

- whether the starting pallet is still locking the active tooth;
- whether a valid impulse-following interval exists;
- how far the escape wheel may rotate during the current half-tooth release;
- when the tooth leaves both pallets and enters free-flight drop;
- when the opposite pallet captures the incoming tooth;
- whether either polygon penetrates beyond the reconstruction guard;
- whether a center crossing is allowed to deliver the M5f angular-velocity impulse.

## Tooth polygon

The M5h escape-tooth polygon mirrors the current visible educational escape-wheel primitive rather than inventing a second unrelated shape. Current reconstructed dimensions are approximately:

- tip radius: **2.25 mm**;
- tooth depth: **0.70 mm**;
- base width: **0.17 mm**;
- tip width: **26% of base width**;
- hook/skew: **0.22 mm**.

Those values belong to the reconstruction. They are not ETA manufacturing tooth dimensions.

## Pallet-jewel polygons

M5d already calibrated entry and exit working faces against the reconstructed escape-wheel phase. M5h retains those calibrated working edges but gives each one finite jewel depth, currently **0.18 mm**, extending back toward the pallet staff.

This means the solver now reasons about an area rather than an infinitely thin line.

## Polygon contact state

The live M5h panel reports:

- current surface event;
- active entry→exit or exit→entry surfaces;
- signed polygon gap;
- overlap / penetration depth;
- geometry-derived release angle within the 12° half-tooth step;
- derived free-flight drop gap;
- current polygon impulse-gate decision;
- solver health.

The optional M5h overlay draws the active start jewel, target jewel, tracked tooth polygon and nearest surface-contact line directly over the movement.

## Monotonic release

Within each beat the solver keeps escape-wheel release monotonic. Even if a noisy reconstructed surface solution would suggest a tiny backwards correction, the escape wheel is not allowed to reverse inside the current half-tooth event. On the next beat the absolute completed half-tooth count advances and the within-beat release resets.

## Geometry-admitted impulse retained and deepened

M5f exposes a pluggable impulse-admission hook. M5h installs a polygon-based gate there, replacing the historical M5g point/segment gate for the live model.

A center crossing is only an opportunity. M5h samples the corresponding alternating pallet transition and requires a coherent polygonal impulse interval before Δω reaches the balance. Surface penetration or absence of a usable impulse interval denies the kick.

## Reconstruction targets, not ETA tolerances

Current M5h surface parameters are deliberately explicit simulation/reconstruction values, including:

- unlock surface gap: **0.028 mm**;
- target capture surface gap: **0.030 mm**;
- impulse following envelope: **0.080 mm**;
- maximum tolerated polygon overlap: **0.018 mm**;
- pallet-jewel modeled depth: **0.18 mm**.

They are not factory pallet clearances, production jewel dimensions or ETA contact tolerances.

## What M5h still does not mean

The architectural improvement is real: **finite reconstructed surfaces now govern both train release and energy admission into the oscillator**. But M5h is still not a production escapement contact simulation. It does not model measured ETA pallet/escape CAD, exact jewel bevels, elastic impact, oil films, sliding friction, contact stress, impulse efficiency, or real material deformation.

The sourced ETA specification remains **3 Hz / 21,600 A/h**. Balance inertia, hairspring stiffness, damping, impulse magnitude, restart behavior and amplitude→rate behavior remain educational parameters.

## Next

The next useful step is to move from quasi-static convex contact toward a **shared force/work model**: derive a normalized impulse-work quantity from relative surface travel, distinguish barrel-side drive from oscillator-side delivered work, and begin consolidating train load, escapement work and oscillator energy into the same state model. A later geometric pass can add explicit roller-jewel/fork-slot and horn safety polygons to the same collision framework.

Full provenance and research notes: `../docs/watch-eta-6497-2.html`.
