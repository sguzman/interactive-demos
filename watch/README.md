# Watch demo

Interactive exploded reconstruction of the ETA/Unitas 6497-2 inside a 44 mm exhibition-style wristwatch shell.

## Current milestone

**M5i — normalized escapement impulse work transfer.**

The watch is now substantially beyond a decorative exploded view. Crown winding creates persistent reserve; the keyless works separate winding and hand-setting modes; stored reserve gates runtime; M5f integrates the balance as explicit angular position/velocity state; M5h constrains escapement release and impulse admission from finite reconstructed tooth and pallet-jewel surfaces; and M5i now makes the size of each admitted balance impulse depend on how much normalized work that polygonal contact path can actually transfer.

## Files

- `index.html` — UI shell and import map.
- `main-m5a.js` — current scene orchestration path; historical filename retained for continuity.
- `movement.js` — movement/watch construction, metadata and provenance.
- `train-m3g.js` — pitch, staff, bearing, endshake and wheel-body-clearance reconstruction.
- `winding-m4a.js` — crown/ratchet/click and stored-reserve state.
- `keyless-m4b.js` — stem modes and hand-setting path.
- `power-m4c.js` — reserve-consuming runtime gate.
- `escapement-m5b.js` — pallet/safety geometry and event diagnostics.
- `escapement-m5c.js` — normalized reserve/drive proxy.
- `escapement-m5d.js` — earlier calibrated point/segment contact solver.
- `escapement-m5e.js` — explicit educational amplitude→rate modifier.
- `escapement-m5f.js` — integrated θ/ω balance/hairspring state; its impulse-admission hook now accepts a continuous impulse scale as well as yes/no admission.
- `escapement-m5g.js` — historical point/segment geometry-admitted impulse gate.
- `escapement-m5h.js` — finite tooth/pallet-jewel polygon contact, lock/impulse/drop/capture and polygon-admitted release.
- `escapement-m5i.js` — current normalized impulse-work layer: reserve drive + polygon-following distance + contact quality → delivered/lost work → variable Δω.
- `escapement-m5a.js` — compatibility re-export pointing at the current escapement implementation.

## Current causal chain

`crown → stored reserve → drive proxy → finite tooth/jewel contact path → available work → transferred / rejected work → scaled Δω → integrated balance θ/ω → polygon-constrained escape release → train → hands`

The key M5i change is that **admitted contact no longer means a fixed-size kick**.

For every balance center-crossing opportunity, M5i samples the M5h polygonal impulse path. The model measures how far the escape tooth follows the active pallet impulse surface and how good that contact is while following. Remaining spring drive supplies a normalized work budget. The work layer then derives:

- available train-side work;
- polygon surface-follow distance;
- contact-quality factor;
- normalized transfer efficiency;
- delivered oscillator-side work;
- rejected/lost work;
- a continuous scale for the M5f angular-velocity impulse.

## Normalized work model

The work bookkeeping is intentionally dimensionless. `1.0 work unit` means the full current normalized drive budget for one impulse opportunity, **not one joule**.

The current educational calculation is conceptually:

`available work = reserve-derived drive proxy`

`transfer efficiency = polygon-follow coverage × contact quality`

`delivered work = available work × transfer efficiency`

`lost work = available work − delivered work`

The balance is still driven by Δω, not by an explicit calibrated inertia/energy equation. M5i therefore maps transferred work fraction to the M5f velocity-kick scale with a square root:

`Δω scale ≈ √(transfer efficiency)`

This keeps the bookkeeping energy-like without pretending that the model knows the real 6497-2 balance inertia or pallet efficiency.

## Surface-follow distance

The ideal geometric reference is the arc swept at the reconstructed 2.25 mm escape-tooth tip radius through one 12° half-tooth release. M5i does not assume that the tooth remains on the impulse surface for that entire arc. It samples the M5h state across the beat and accumulates only positive release travel that is still classified as polygonal impulse following.

A reference follow fraction of **40% of the half-tooth arc** currently maps to full path coverage. This is an educational normalization chosen for an inspectable response, not an ETA contact-duration measurement.

## Contact quality

While the tooth follows the impulse surface, contact quality is derived from the signed M5h polygon gap:

- close non-penetrating surfaces score highly;
- a growing positive gap lowers the score;
- excessive overlap also lowers the score;
- a polygon path already rejected by M5h has zero transfer efficiency.

The current gap response exponent is **1.35**. Again, this is a simulation parameter, not a measured friction or efficiency law.

## Live M5i diagnostics

The **Impulse work transfer · M5i** panel reports:

- available train work;
- delivered work;
- rejected/lost work;
- surface-follow distance in mm;
- contact quality;
- transfer efficiency;
- resulting Δω packet scale;
- explicit work-transfer verdict.

The M5h polygon-contact panel and overlays remain active underneath this layer, so the work quantities can be inspected alongside the actual finite tooth/jewel geometry that generated them.

## Fast-forward behavior

At detailed speeds, every center crossing receives its own polygon-work estimate. At very high diagnostic time scales, M5f still uses its explicit envelope approximation. The representative alternating impulse probes now contribute their **mean continuous impulse scale**, not merely the fraction of binary admitted contacts, so degraded work transfer also weakens fast-forward oscillator replenishment.

## Reconstruction targets, not ETA measurements

M5i reuses the M5h reconstructed surface parameters:

- escape-tooth tip radius: **2.25 mm**;
- half-tooth release: **12°**;
- pallet-jewel modeled depth: **0.18 mm**;
- unlock surface gap: **0.028 mm**;
- capture surface gap: **0.030 mm**;
- impulse following envelope: **0.080 mm**;
- maximum tolerated polygon overlap: **0.018 mm**.

M5i adds its own explicit normalization choices:

- work sample count: **32**;
- reference impulse-follow fraction: **0.40** of the half-tooth arc;
- contact-gap exponent: **1.35**;
- minimum useful Δω scale: **0.02**.

None of these are ETA torque, energy, contact-efficiency or pallet-loss measurements.

## What M5i still does not mean

The architectural improvement is real: **contact geometry now controls not only whether impulse exists, but how much normalized impulse reaches the balance**. But this still is not calibrated power-flow physics. The model does not yet contain measured barrel torque, train tooth forces, pallet friction, contact normals integrated into force, balance inertia, elastic impact, oil-film losses, or real work in joules.

The sourced nominal specification remains **3 Hz / 21,600 A/h**.

## Next

The next sensible jump is **M6a: barrel arbor versus barrel drum and train-side torque state**. Winding should increase spring twist at the arbor; running should release the barrel drum against a normalized load; that load should propagate through the train to become the drive budget consumed by the escapement work model. That will let “available impulse work” stop being a direct reserve proxy and become downstream of an explicit power-transmission state.

Full provenance and research notes: `../docs/watch-eta-6497-2.html`.
