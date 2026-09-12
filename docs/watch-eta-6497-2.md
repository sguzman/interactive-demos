# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M5i — normalized escapement impulse work transfer.**

This remains an educational reconstruction, not manufacturing CAD or calibrated watchmaking physics. Official movement facts, reference-derived geometry, approximate geometry, and presentation/simulation assumptions remain distinct provenance classes.

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

M3 established the reference-derived train topology and pitch/stack diagnostics. M4 added stateful winding, hand setting, stored reserve, and a runtime energy gate. M5a–M5d made the Swiss lever event-resolved and then geometry-constrained. M5e exposed an educational amplitude/rate law. M5f replaced the assigned oscillator clock with an integrated balance/hairspring state carrying angular position **θ** and angular velocity **ω**. M5g made geometry admit or deny an impulse. M5h replaced point/line contact with finite escape-tooth and pallet-jewel polygons governing lock, impulse following, drop, target capture, penetration health, release, and impulse admission.

M5i adds the next missing link: **an admitted contact no longer delivers a fixed-size impulse.**

## Current causal chain

> crown → stored reserve → drive proxy → finite tooth/jewel polygon path → available work → transferred / rejected work → scaled Δω → integrated θ/ω oscillator → polygon-constrained escape release → train → hands

The same finite-surface model that decides whether contact is possible now also influences how strongly that contact replenishes the balance.

## Why M5i exists

Through M5h, the model could distinguish two cases:

- geometry admits an impulse;
- geometry denies an impulse.

But every admitted detailed crossing still received essentially the same M5f velocity kick after reserve and amplitude saturation were applied. A barely useful polygon contact and a long, close-following impulse path were both treated as equivalent once admitted.

M5i replaces that binary energy-transfer abstraction with explicit normalized work bookkeeping.

## Available work

M5i treats the existing reserve-derived drive proxy as the **available train-side work budget** for one impulse opportunity.

The value is normalized from 0 to 1. It is deliberately called **work units**, not joules.

Conceptually:

> available work = reserve-derived drive proxy

This is still not a physical barrel-torque integral. A future M6 power-transmission model can replace the direct reserve proxy with an explicit barrel-drum / train-load state without changing the work-transfer interface introduced here.

## Polygon surface-follow distance

For each center-crossing opportunity, M5i samples the same alternating M5h polygon path used to validate the escapement.

During those samples it accumulates only positive escape-wheel travel that is still classified as:

> **IMPULSE · POLYGON SURFACE**

Angular release is converted to a path length at the reconstructed **2.25 mm escape-tooth tip radius**.

The ideal half-tooth arc is therefore based on the 12° release interval, but M5i does not assume the tooth follows the pallet for the full 12°.

The current normalization treats **40% of the full half-tooth tip arc** as the reference path coverage for a full normalized impulse-follow interval. That 40% value is an educational choice, not an ETA contact-duration measurement.

## Contact quality

Surface-follow length alone is not enough. M5i also evaluates how closely the active tooth and pallet-jewel polygons track while the tooth is following the impulse surface.

The M5h signed polygon gap is converted into a normalized contact-quality factor:

- a small positive separation scores highly;
- larger positive separation lowers quality toward zero at the current impulse envelope;
- overlap also lowers quality as penetration approaches the maximum accepted M5h overlap;
- an unhealthy M5h polygon path receives zero useful transfer.

The present gap-response exponent is **1.35**. This is a transparent simulation parameter, not a friction law or measured pallet efficiency curve.

## Transfer efficiency

The current educational transfer efficiency is approximately:

> transfer efficiency = path coverage × contact quality

Both terms are normalized to 0–1.

A path can therefore lose transfer efficiency because it follows the pallet for too little distance, because the finite surfaces track poorly, or because the underlying M5h polygon gate rejects the path entirely.

## Delivered and lost work

M5i then separates the available budget into delivered and rejected/lost portions:

> delivered work = available work × transfer efficiency

> rejected/lost work = available work − delivered work

These values are shown directly in the UI.

“Lost work” is intentionally broad bookkeeping. It does **not** claim to distinguish real physical loss channels such as sliding friction, impact, oil-film shear, elastic deformation, sound, train friction, or pallet recoil. It simply records the part of the current normalized work budget that the reconstructed impulse path does not deliver to the oscillator.

## Work becomes variable Δω

M5f still represents escapement impulse as an angular-velocity increment **Δω** applied near balance center crossing.

M5i extends M5f's impulse-admission interface so an admission result can also return a continuous **impulse scale**.

Because M5i's bookkeeping is energy-like while M5f's actuator is velocity-like, the current mapping is:

> Δω scale ≈ √(transfer efficiency)

The square-root relationship is intentionally closer to an energy→velocity relationship than a direct linear mapping would be, while still avoiding a false claim that the model knows actual balance inertia.

The resulting detailed kick is conceptually:

> delivered Δω = base M5f kick × √(transfer efficiency)

The base M5f kick still includes reserve-derived drive and amplitude saturation.

## Fast-forward behavior

At ordinary and slow speeds, each detected center crossing gets its own M5i polygon-work estimate.

At high diagnostic time scales the browser still uses M5f's explicit **FAST-FORWARD ENVELOPE** approximation. Previously that approximation only used the fraction of binary admitted representative paths. M5i upgrades it to use the **mean continuous impulse scale** returned by the alternating geometry probes.

Therefore degraded contact/work transfer weakens fast-forward oscillator replenishment even when both representative pallet paths remain technically admissible.

## Live M5i diagnostics

The new **Impulse work transfer · M5i** panel reports:

- available train work;
- delivered oscillator-side work;
- rejected/lost work;
- polygon surface-follow distance in millimetres;
- contact quality;
- total transfer efficiency;
- resulting Δω packet scale;
- explicit work-transfer verdict.

The M5h polygon panel remains active underneath it, exposing the surface event, signed gap, overlap depth, release angle, drop gap, impulse gate and solver health. The optional M5h polygon overlay still draws the active finite tooth and pallet-jewel shapes directly on the movement.

## M5h finite contact retained

The active surface solver still uses reconstructed convex 2D polygons.

Current reconstructed escape-tooth dimensions include:

- tip radius: **2.25 mm**;
- tooth depth: **0.70 mm**;
- base width: **0.17 mm**;
- tip width: **26% of base width**;
- hook/skew: **0.22 mm**;
- tooth count: **15**;
- tooth pitch: **24°**;
- half-tooth release: **12°**.

Current pallet/contact reconstruction parameters include:

- modeled pallet-jewel depth: **0.18 mm**;
- unlock surface gap: **0.028 mm**;
- target capture surface gap: **0.030 mm**;
- impulse-following envelope: **0.080 mm**;
- maximum accepted polygon overlap: **0.018 mm**;
- release search: **72 samples**;
- capture refinement: **28 bounded iterations**.

None of those are asserted ETA manufacturing tolerances.

## M5i work parameters

The additional M5i normalization parameters are:

- impulse-path samples: **32**;
- sampled beat window: approximately **0.06–0.52** of each beat;
- reference follow fraction: **0.40** of the half-tooth tip arc;
- contact-gap exponent: **1.35**;
- minimum useful Δω scale: **0.02**.

These are educational reconstruction parameters. They are not measured ETA energy, efficiency, impulse duration, or friction values.

## What M5i improves

Before M5i:

> valid contact → fixed admitted impulse packet

After M5i:

> valid contact → measure surface following → estimate transfer efficiency → split available work into delivered/lost work → continuously scale impulse packet

This is still normalized physics, but it removes another discrete hidden assumption and gives later power-transmission work a clean interface to connect to.

## What M5i still does not claim

M5i does **not** yet model or claim:

- work in physical joules;
- measured ETA barrel torque;
- actual escape-wheel torque;
- force vectors at tooth/pallet contact;
- true pallet sliding friction;
- lubrication losses;
- measured pallet efficiency;
- elastic impact, rebound or compliance;
- contact stress;
- calibrated balance inertia;
- hairspring elastic energy;
- train inertia or tooth friction;
- production amplitude or timing performance.

The sourced nominal specification remains **3 Hz / 21,600 A/h**.

## Inspection workflow

For the clearest M5i inspection:

1. wind the watch;
2. choose **Escapement** view;
3. assemble the movement;
4. enable **Show M5h tooth / jewel polygons**;
5. use `0.1×` or `0.25×` mechanical time;
6. watch surface-follow distance, contact quality, transfer efficiency and delivered work together with the M5f θ/ω state and phase portrait;
7. compare the reported Δω scale with the actual **Last impulse Δω** readout.

## Next milestones

### M6a — barrel and train-side torque state

- separate barrel-arbor winding from barrel-drum release;
- represent spring twist / stored state independently from drum rotation;
- give the barrel a normalized torque-vs-state curve rather than passing reserve directly into the escapement;
- represent train load and transmission before the escape wheel;
- feed M5i's available-work budget from that explicit train-side drive state.

### Later escapement geometry

- add finite roller-jewel / fork-slot polygons;
- add horn / safety-dart collision checks;
- improve pallet/tooth shapes as defensible reference geometry becomes available.

### M6 shared system mechanics

- consolidate barrel torque, train transmission, escapement work, oscillator state and reserve into one shared mechanical state;
- migrate normalized assumptions toward measured/reference parameters wherever defensible data exists.

## Sources

- ETA 6497-2 Technical Communication: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/
- ETA 6497-2 spare-parts communication: https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1632/
- Case & Caliber ETA 6497 disassembly: https://caseandcaliber.com/eta-6497-disassembly/
- Horology Student Unitas/ETA 6497/6498 reference: https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/
