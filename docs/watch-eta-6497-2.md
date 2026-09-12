# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M6a — barrel arbor / drum power separation.**

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

M3 established the train topology and pitch/stack diagnostics. M4 added stateful winding, hand setting, reserve, and a runtime energy gate. M5a–M5d made the Swiss lever event-resolved and geometry-constrained. M5e added an educational amplitude/rate law. M5f replaced the assigned oscillator clock with an integrated balance/hairspring state carrying angular position **θ** and angular velocity **ω**. M5h replaced point/line contact with finite escape-tooth and pallet-jewel polygons. M5i turned those finite contact paths into normalized available, delivered, and rejected impulse work, continuously scaling the balance's Δω packet.

M6a adds the upstream power source that M5i was missing.

## Current causal chain

> crown → barrel arbor winding → mainspring twist → barrel torque → train load / transmission → available escapement work → finite polygon work transfer → scaled Δω → integrated balance θ/ω → polygon-constrained escape release → train → hands

The important change is that **reserve itself is no longer passed directly into the escapement as its work budget**.

## Going-barrel role separation

The current reconstruction now distinguishes two causal sides of the barrel.

### Barrel arbor / winding side

Crown input turns the winding train and ratchet. That side is interpreted as the **barrel-arbor winding side**. During normal release, the click holds the ratchet/arbor side against reverse motion.

The UI reports cumulative reconstructed arbor/ratchet turns and whether that side is winding or held by the click.

### Barrel drum / release side

Reserve consumption now accumulates a separate **barrel-drum release angle**. The visible barrel drum is rotated from this release state while the arbor/ratchet remains the held side.

The current presentation mapping is:

- one nominal full reserve release → **8 barrel-drum turns**.

This value is a reconstruction/presentation choice, not an ETA service dimension or measured 6497-2 barrel period.

## Mainspring twist state

M6a interprets the existing normalized reserve value as **normalized mainspring twist**.

That is still an abstraction: the model does not yet derive twist from a geometric difference between arbor angle and drum angle. The advantage is architectural: stored state now has a named mechanical meaning that can feed an explicit torque law.

## Reconstructed torque curve

M6a converts normalized twist to normalized barrel torque.

The current curve intentionally has two qualitative features:

- a sharp torque falloff close to the fully unwound state;
- a relatively flatter torque plateau through most of the usable reserve.

Current educational parameters include:

- low-twist knee: **0.12 normalized twist**;
- plateau base: **0.74 normalized torque**;
- linear plateau gain: **0.22**;
- quadratic plateau gain: **0.04**.

At full twist the normalized torque approaches 1.0. These coefficients describe a useful pedagogical shape only; they are not measured ETA mainspring torque.

## Train load and transmission

Barrel torque does not now arrive untouched at M5i. M6a inserts an explicit train-side reduction.

Current reconstruction parameters:

- static normalized train load: **0.12**;
- train transmission efficiency: **0.92**.

Conceptually:

> usable torque = max(0, spring torque − static train load)

> normalized escapement drive = normalized usable torque × transmission efficiency

The resulting **escapement drive** is the work budget supplied to M5i.

## M5i external work-budget interface

M5i previously used M5f's historical reserve-derived drive proxy as its available-work budget. M6a gives M5i an external work-budget provider instead.

M5i still computes:

- polygon surface-follow distance;
- contact quality;
- transfer efficiency;
- delivered work;
- rejected/lost work;
- continuous impulse scale.

But its available work now comes from:

> spring twist → spring torque → train load / loss

rather than directly from reserve.

To preserve M5f's existing Δω actuator while changing the upstream drive source, M5i rescales the historical kick by the ratio between the external M6a work budget and the old reserve-drive proxy. In detailed mode this makes the final kick approximately proportional to the post-train M6a drive. The same continuous scale is used by the fast-forward envelope approximation.

## Live M6a diagnostics

The **Barrel → train power path · M6a** panel reports:

- mainspring twist;
- normalized spring torque;
- barrel-arbor winding/held state and cumulative turns;
- cumulative barrel-drum release turns;
- normalized train load;
- train transmission efficiency;
- normalized escapement work budget;
- current power topology.

Typical topology labels include:

- `ARBOR WINDING · DRUM HELD`;
- `ARBOR HELD · DRUM RELEASING`;
- `ARBOR WINDING + DRUM RELEASING`;
- `ARBOR HELD · DRUM HELD`;
- `UNWOUND`.

## What is now mechanically distinct

M6a creates separate first-class states for:

- user input at the crown;
- ratchet/arbor winding motion;
- stored spring twist;
- spring torque;
- barrel-drum release motion;
- train load;
- train transmission loss;
- escapement-side available work;
- polygon contact transfer;
- delivered oscillator impulse;
- oscillator θ/ω state.

That is a much better foundation for later physical calibration than one scalar reserve percentage controlling everything directly.

## Reconstruction values, not ETA measurements

The following M6a values are educational simulation parameters:

- full-release barrel-drum turns: **8.0**;
- low-twist torque knee: **0.12**;
- torque-plateau coefficients: **0.74 / 0.22 / 0.04**;
- static train load: **0.12 normalized**;
- train transmission efficiency: **0.92**.

The model still does not contain measured:

- ETA barrel torque in N·mm;
- mainspring arbor turns;
- mainspring torque-deflection data;
- actual barrel-drum revolution count over a full reserve;
- wheel-train friction or tooth-force losses;
- jewel-bearing friction;
- pallet efficiency;
- balance inertia;
- physical impulse work in joules.

## M5h / M5i geometry and work retained

The finite-surface solver still uses reconstructed 2D polygons for the active escape tooth and pallet jewels. Current explicit reconstruction values include a 2.25 mm tooth-tip radius, 12° half-tooth release, 0.18 mm pallet-jewel depth, 0.028 mm unlock gap, 0.030 mm capture gap, 0.080 mm impulse-following envelope, and 0.018 mm maximum accepted polygon overlap.

M5i still samples the polygon path, measures finite surface-follow distance and contact quality, splits available work into delivered and rejected portions, and scales the balance Δω continuously rather than treating all admitted contact as equally strong.

## Inspection workflow

For the clearest M6a inspection:

1. assemble the movement;
2. choose **Winding** view and wind the crown;
3. watch arbor turns, spring twist, and spring torque rise;
4. switch to **Escapement** view and run at 0.1× or 0.25×;
5. compare M6a escapement drive with M5i available/delivered work and M5f last Δω;
6. use 3600× only when you want to see the barrel-drum release and torque falloff over the reserve quickly.

## Next milestones

### M6b — shared load feedback

- replace the fixed train load with a load state influenced by escapement release and oscillator demand;
- let blocked/failed release feed back into the power path instead of merely holding the clock;
- distinguish load used to accelerate the train from load rejected at the escapement;
- expose instantaneous drive margin.

### M6c — geometric mainspring state

- derive spring twist from explicit relative arbor/drum state rather than identifying twist directly with reserve;
- improve barrel-arbor and drum geometry;
- connect winding input and release output through the same relative-angle state.

### Later escapement geometry

- finite roller-jewel / fork-slot polygons;
- horn / safety-dart collision checks;
- improved pallet/tooth shapes as defensible reference geometry becomes available.

## Sources

- ETA 6497-2 Technical Communication: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/
- ETA 6497-2 spare-parts communication: https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1632/
- Case & Caliber ETA 6497 disassembly: https://caseandcaliber.com/eta-6497-disassembly/
- Horology Student Unitas/ETA 6497/6498 reference: https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/
