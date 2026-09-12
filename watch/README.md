# Watch demo

Interactive exploded reconstruction of the ETA/Unitas 6497-2 inside a 44 mm exhibition-style wristwatch shell.

## Current milestone

**M6a — barrel arbor / drum power separation.**

The watch is now substantially beyond a decorative exploded view. Crown winding creates persistent reserve; the keyless works separate winding and hand-setting modes; M5f integrates the balance as explicit angular position/velocity state; M5h constrains escapement release from finite tooth/pallet-jewel surfaces; M5i converts polygon-following contact into normalized delivered/lost impulse work; and M6a now inserts an explicit barrel and train power state upstream of that work model.

## Files

- `index.html` — UI shell and import map.
- `main-m5a.js` — current scene orchestration path; historical filename retained for continuity.
- `movement.js` — movement/watch construction, metadata and provenance.
- `train-m3g.js` — pitch, staff, bearing, endshake and wheel-body-clearance reconstruction.
- `winding-m4a.js` — crown/ratchet/click and stored-reserve state.
- `keyless-m4b.js` — stem modes and hand-setting path.
- `power-m4c.js` — reserve-consuming runtime gate.
- `escapement-m5f.js` — integrated θ/ω balance/hairspring state and continuous impulse scaling.
- `escapement-m5h.js` — finite tooth/pallet-jewel polygon contact.
- `escapement-m5i.js` — normalized available/delivered/lost impulse-work layer, now able to accept an external work budget.
- `escapement-m6a.js` — current barrel/train power layer: spring twist → torque → train load/transmission → escapement work budget, plus separate arbor and drum motion roles.
- `escapement-m5a.js` — compatibility re-export pointing at the current implementation.

## Current causal chain

`crown → barrel arbor winding → mainspring twist → barrel torque → train load / transmission → M5i available work → polygon contact transfer → scaled Δω → integrated balance θ/ω → polygon-constrained escape release → train → hands`

The important M6a change is that **remaining reserve itself is no longer the work budget presented directly to the escapement**.

## Arbor versus drum

The current reconstruction now distinguishes the two causal roles of a going barrel:

- while winding, the crown/ratchet side represents rotation of the **barrel arbor**;
- during running, the click holds that arbor side while the **barrel drum** becomes the release side;
- reserve consumption accumulates a separate barrel-drum release angle;
- the visible barrel drum now rotates from that release state rather than remaining permanently static.

The current full-reserve-to-drum-motion mapping is **8 drum turns over one nominal full release**. That is an educational reconstruction value, not an ETA service dimension.

## Normalized mainspring torque

Stored reserve is interpreted as normalized spring twist. M6a converts that twist through a deliberately simple reconstructed torque curve:

- torque falls sharply close to the fully unwound state;
- most of the reserve sits on a flatter torque plateau;
- full wind reaches a normalized torque of approximately 1.0.

The current curve uses a low-twist knee around **12% normalized twist** and a polynomial plateau. This is shape-only educational behavior, not measured 6497-2 mainspring torque.

## Train load and transmission

M6a then reduces barrel torque by an explicit train-side model before the escapement sees it.

Current reconstruction values:

- static normalized train load: **0.12**;
- train transmission efficiency: **92%**.

Conceptually:

`usable torque = max(0, spring torque − train load)`

`escapement drive = normalized usable torque × transmission efficiency`

That resulting **escapement drive** is now supplied to M5i as its available-work budget.

## M5i work transfer downstream

M5i still measures finite polygon surface-follow distance and contact quality. The difference is upstream provenance:

Before M6a:

`reserve proxy → available impulse work`

After M6a:

`reserve → spring twist → spring torque → train load/loss → available impulse work`

M5i then derives delivered versus rejected work and continuously scales the M5f Δω packet from that delivered fraction.

## Live M6a diagnostics

The **Barrel → train power path · M6a** panel reports:

- normalized mainspring twist;
- normalized spring torque;
- arbor winding/held state and cumulative ratchet/arbor turns;
- cumulative barrel-drum release turns;
- normalized train load;
- train transmission efficiency;
- normalized escapement work budget;
- current power topology such as `ARBOR HELD · DRUM RELEASING`.

This panel is intended to make the asymmetry of a going barrel legible: the arbor is the user-input side, while the drum is the slow release side.

## Reconstruction targets, not ETA measurements

M6a's current values are explicitly educational parameters:

- full-release barrel-drum rotation: **8.0 turns**;
- low-twist torque knee: **0.12 normalized twist**;
- torque-plateau coefficients: reconstructed, dimensionless;
- static train load: **0.12 normalized**;
- train transmission efficiency: **0.92**.

The model still does not know actual ETA barrel torque in N·mm, mainspring turns, gear tooth forces, train friction, bearing losses, pallet efficiency, balance inertia, or physical work in joules.

## What M6a changes architecturally

M6a is the first pass where the power source is represented as more than a scalar reserve bucket. There are now distinct states for:

- user winding input at the arbor;
- stored spring twist;
- spring torque;
- slow barrel-drum release;
- train load/loss;
- escapement-side work budget;
- geometric work transfer into the oscillator.

That is still normalized mechanics, but it gives later work somewhere coherent to attach measured torque curves, train losses and barrel geometry instead of burying them inside one reserve percentage.

## Next

The next useful step is **M6b: shared torque/load feedback**. Instead of a fixed train load, the model can derive instantaneous load from escapement release, wheel acceleration and oscillator demand, then let unsuccessful release feed back into the barrel/drum state. After that, a deeper barrel pass can model arbor/drum relative angle and mainspring twist from geometry rather than using reserve as the twist state.

Full provenance and research notes: `../docs/watch-eta-6497-2.html`.
