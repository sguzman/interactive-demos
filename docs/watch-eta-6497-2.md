# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M5b — pallet-face and safety geometry diagnostics.**

This remains an educational reconstruction, not manufacturing CAD. Official movement facts, reference-derived geometry, approximation, and presentation-only simulation assumptions remain separate provenance classes.

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

## Geometry lineage: M3a–M3g

The train reconstruction progressed from timing topology toward a mechanically legible 3D stack:

- M3a encoded a reference-derived 6497 train ratio set and verified the 3 Hz / 21,600 A/h timing closure;
- M3b made the visible train use the same published tooth/leaf counts;
- M3c derived nominal module and pitch radii from the current reconstruction centres;
- M3d separated compound wheel bodies into distinct axial planes;
- M3e solved initial tooth/gap phase and added pitch-circle/contact diagnostics;
- M3f added pitch-radius-native educational spur construction and stepped staffs;
- M3g added wheel-body gaps, jewel-to-jewel bearing spans, pivot shoulders, and endshake reconstruction targets.

Current reference train counts remain:

- centre wheel: **80 teeth**;
- third wheel: **60 teeth + 10-leaf pinion**;
- seconds/fourth wheel: **120 teeth + 8-leaf pinion**;
- escape wheel: **15 teeth + 10-leaf pinion**.

At 21,600 A/h this closes to approximately 5 s/rev for the escape wheel, 60 s/rev for the seconds/fourth wheel, 7.5 min/rev for the third wheel, and 1 h/rev for the centre wheel.

## M4 — causal winding, setting, and reserve

M4 established the first stateful user-operated mechanism:

- crown winding advances the crown wheel and ratchet;
- the click enforces one-way ratchet behavior;
- accepted winding accumulates normalized mainspring energy;
- the stem has separate winding and hand-setting states;
- positive reserve opens the movement gate;
- running consumes reserve;
- zero reserve stops mechanical elapsed time.

The current full-wind mapping uses **45 crown turns** as a presentation assumption. The **60 h typical reserve** endpoint is sourced from ETA.

## M5a — event-resolved Swiss lever release

M5a changed the escapement from synchronized animation into an explicit event sequence.

A 3 Hz balance gives **six alternations / beats per second**, so one beat is **1/6 s**. Each beat is divided into:

1. **LOCK · ENTRY**;
2. **UNLOCK**;
3. **IMPULSE**;
4. **LOCK · EXIT**.

The 15-tooth escape wheel advances **one half-tooth per beat**, or 12° per release event. Thirty half-tooth releases therefore give one complete escape-wheel revolution in 5 seconds.

Most importantly, released escape-wheel angle is converted back into **released train time**. The fourth/seconds, third and centre wheels and the hands now wait during lock and advance during release.

## M5b — pallet-face and safety geometry diagnostics

M5b begins replacing abstract state labels with inspectable escapement geometry.

### Explicit locking and impulse faces

Each pallet stone now receives two colored educational overlays:

- **blue locking face** — the surface region responsible for holding the escape tooth;
- **gold impulse face** — the surface region associated with escape-to-pallet impulse during release.

These overlays follow the pallet fork and alternate through the M5a entry/exit sequence. They are not claimed to be measured ETA production faces yet.

### Banking geometry

The pallet remains constrained between reconstructed banking limits. M5b exposes the current bank target as approximately **±7.7°** around the pallet neutral orientation and can draw the banking arc directly in the scene.

That bank angle is a reconstruction target derived from the existing educational pallet travel, not an ETA tolerance.

### Lock depth, draw, and drop targets

The escapement panel now exposes three geometric concepts numerically:

- **lock depth target: 1.8°**;
- **draw target: 12.0°**;
- **drop target: 2.2°**.

These values are deliberately labeled **targets**. They make the concepts first-class in the model without claiming to reproduce ETA factory geometry. The displayed lock depth falls away during release; drop markers appear around unlock/relock transitions.

### Roller / fork safety envelope

M5b retains the roller table, guard roller, impulse jewel, fork horns and safety dart from M5a, and adds a visible diagnostic envelope for:

- roller-to-fork-slot clearance;
- horn clearance around the impulse jewel path;
- guard/dart safety relationship.

Current reconstruction targets include roughly **0.12 mm roller/fork clearance** and **0.10 mm horn clearance**. These are presentation values for geometric reasoning, not production measurements.

### Active contact and drop markers

A highlighted contact marker follows the currently active entry/exit side. A secondary marker indicates the reconstructed drop region during relevant transitions. These make it possible to inspect where the state machine believes the escape tooth is interacting with the pallet geometry.

### Event-level stepping

M5a already allowed stepping one whole beat. M5b adds **Step next event**, which advances mechanical time only far enough to cross the next event boundary:

- lock → unlock;
- unlock → impulse;
- impulse → relock;
- relock → next beat.

At `0× paused`, this lets the escapement be examined one transition at a time rather than jumping directly from one beat to the next.

## What M5b intentionally does not claim

M5b still does **not** model or assert:

- measured ETA entry/exit pallet face coordinates;
- exact draw angle from production geometry;
- exact lock depth or drop;
- exact banking-pin positions;
- exact horn and guard clearances;
- true roller-jewel path under rigid-body contact;
- pallet/escape friction and lubrication;
- impulse energy transfer into balance amplitude;
- free balance amplitude determined by spring torque and losses;
- production torque transmission through the train.

The M5b values are explicit reconstruction targets so that later measurements can replace them cleanly.

## Inspection tools

Current useful inspection controls include:

- **Escapement** camera preset;
- `0.1×`, `0.25×`, and `0.5×` slow mechanical time;
- `0× paused`;
- **Step next event**;
- **Step one beat**;
- escape → pallet → balance center-line guides;
- pallet-face / safety diagnostics;
- train pitch/contact guides;
- train stack and endshake diagnostics;
- keyless-works inspection;
- camera-aligned and movable inspection lighting.

## Provenance classes

- **official** — directly supported by technical material;
- **reference-derived** — reconstructed from service diagrams, teardown photographs, or multiple references;
- **approximate** — simplified geometry preserving mechanical role and relationship;
- **presentation** — geometry, controls, or simulation assumptions added for readability and interaction.

## Next milestones

### M5c — impulse / oscillator coupling

- create a normalized impulse packet at each release;
- let impulse magnitude affect balance amplitude;
- let lower stored reserve reduce delivered impulse;
- make low amplitude eventually fail to unlock reliably;
- stop prescribing a perfect balance amplitude independent of power state.

### M5d — geometry-constrained escapement

- replace more event-window assumptions with actual tooth/pallet intersection tests;
- derive lock and release from reconstructed face geometry;
- improve drop and safety validation from geometry;
- migrate diagnostic targets toward measured/reference dimensions where available.

### M6 — system simulation

- separate barrel arbor winding from barrel drum release;
- improve power transmission through the train;
- couple reserve, escapement impulse, amplitude and rate;
- let the balance state genuinely govern timing rather than only following the official nominal rate.

## Sources

- ETA 6497-2 Technical Communication: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/
- ETA 6497-2 spare-parts communication: https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1632/
- Case & Caliber ETA 6497 disassembly: https://caseandcaliber.com/eta-6497-disassembly/
- Horology Student Unitas/ETA 6497/6498 reference: https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/
