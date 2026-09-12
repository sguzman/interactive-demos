# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M5f — state-integrated balance / hairspring oscillator.**

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

## Earlier reconstruction milestones retained

### M3 — train geometry and bearings

The train remains modeled around the reference-derived 6497 topology:

- centre wheel: **80 teeth**;
- third wheel: **60 teeth + 10-leaf pinion**;
- seconds/fourth wheel: **120 teeth + 8-leaf pinion**;
- escape wheel: **15 teeth + 10-leaf pinion**.

At the official nominal rate this closes to approximately 5 s/rev for the escape wheel, 60 s/rev for the seconds/fourth wheel, 7.5 min/rev for the third wheel, and 1 h/rev for the centre wheel.

### M4 — winding, setting and reserve

Crown winding creates persistent reserve, the click enforces one-way ratchet behavior, the stem separates winding from hand-setting mode, positive reserve opens the movement gate, and running consumes reserve. The current full-wind interaction maps **45 crown turns** to the sourced **60 h typical reserve** endpoint; the 45-turn count is a presentation assumption, not an ETA service specification.

### M5a–M5d — Swiss lever release and contact geometry

The Swiss lever path is event-resolved at six nominal beats per second. The 15-tooth escape wheel releases one half-tooth per beat. M5d then constrains that release from reconstructed spatial contact: entry/exit pallet faces, start-face travel, target-face approach, tooth-to-segment gap and a penetration guard determine the allowed 12° half-tooth release.

Current contact-space reconstruction targets remain:

- unlock face travel: **0.030 mm**;
- target-face capture distance: **0.040 mm**;
- nominal contact tolerance: **0.035 mm**;
- penetration guard: **0.006 mm**.

The downstream fourth, third and centre wheels and the hands inherit released time derived from the geometry-constrained escape angle.

### M5e — explicit amplitude / rate model

M5e separated reserve-consuming runtime from oscillator phase time and exposed a transparent educational isochronism curve. The sourced nominal reference remains **3 Hz / 21,600 A/h**; the current amplitude→rate curve is explicitly simulation-level rather than measured ETA timing data.

## M5f — state-integrated balance and hairspring

M5f removes a deeper idealization: the balance is no longer told what phase it should be at.

The oscillator now owns two explicit mechanical state variables:

- angular position **θ**;
- angular velocity **ω**.

Those states are numerically integrated forward. The current educational equation is conceptually:

> θ¨ = restoring acceleration + damping acceleration

with discrete escapement impulses applied as changes in angular velocity near balance center crossings.

### Restoring acceleration

The modeled hairspring provides a restoring term approximately proportional to balance angle:

> restoring ≈ −ωₙ² θ

The nominal natural frequency is anchored to the official **3 Hz** specification. The optional M5e isochronism curve can perturb that natural frequency as an explicitly assumed amplitude-dependent stiffness/rate modifier.

This is still a normalized model: no claim is made that the coefficient equals a measured ETA hairspring stiffness divided by a measured balance inertia.

### Damping acceleration

A velocity-dependent damping term removes oscillator energy continuously:

> damping ≈ −2 ζωₙ ω

The current reconstruction uses a damping ratio of approximately **0.006**. This value is chosen for an inspectable educational response and is not a measured ETA Q factor.

### Escapement impulse becomes Δω

Instead of directly adding “amplitude points,” M5f delivers successful escapement impulse as an angular-velocity increment **Δω** near balance center crossing.

The maximum current normalized kick is approximately **0.42 rad/s** before reserve and saturation scaling. Remaining spring reserve still feeds a normalized drive proxy, so weaker reserve produces weaker available impulse.

The visible causal path is now:

> reserve → drive proxy → impulse Δω → θ/ω oscillator state → pallet/contact geometry → escape release → train → hands

### Amplitude now emerges from state

Normalized amplitude is derived from the current phase-space state instead of being the primary oscillator state:

> amplitude ∝ √(θ² + (ω/ω₀)²)

The model still uses a visual normalization corresponding to about **0.43 rad** maximum balance angle. That normalization is a presentation parameter, not a claim about real 6497-2 balance amplitude in degrees.

### Phase is recovered from θ and ω

M5f recovers the oscillator phase from its state approximately as:

> phase = atan2(ωₙ θ, ω)

That phase is unwrapped continuously and converted into the oscillator-time coordinate consumed by the M5d geometry/contact solver.

This reverses the earlier architecture. Before M5f, phase was assigned first and balance position followed it. Now balance state evolves first and phase is measured from that state.

### Center crossings and impulse admission

A center crossing is detected when θ changes sign. If the oscillator has sufficient normalized amplitude, spring reserve is available, and the geometry solver is healthy, the model delivers an impulse kick in the direction of motion.

Current normalized thresholds retained in the educational model include:

- unlock amplitude: **0.18**;
- restart reserve threshold: **1.2%**;
- restart amplitude seed: **0.34**.

The current impulse is still admitted from center-crossing eligibility rather than from an exact M5d tooth/pallet impulse-contact manifold. Tightening that coupling is the next milestone.

## Live M5f diagnostics

The new **Balance / hairspring state · M5f** panel exposes:

- balance angle θ in degrees;
- angular velocity ω in rad/s;
- normalized amplitude;
- restoring acceleration;
- damping acceleration;
- last impulse Δω;
- effective frequency;
- educational seconds/day error;
- accumulated phase drift;
- center-crossing count;
- successful impulse count;
- current integrator mode.

The panel also includes a live phase portrait plotting **θ** horizontally against **ω/ω₀** vertically. A sustained oscillator traces a loop; damping contracts it; impulse replenishment pushes it outward.

## Detailed integration versus fast-forward

At ordinary and slow inspection rates, M5f explicitly integrates the oscillator with small substeps. The current target step is approximately **1/240 s** of simulated mechanical time.

Very large diagnostic time scales such as `300×` or `3600×` could require thousands or tens of thousands of 3 Hz oscillations per rendered browser frame. M5f therefore switches beyond a bounded detailed interval to an explicitly labeled **FAST-FORWARD ENVELOPE** approximation.

In fast-forward mode:

- amplitude decay and average impulse replenishment are integrated as an envelope;
- oscillator phase is advanced from the educational rate model;
- θ and ω are reconstructed from the resulting envelope and phase;
- the UI explicitly identifies that the fast-forward approximation is active.

This is a performance strategy, not hidden physics.

## M5e isochronism model retained as a modifier

The rate model remains user-adjustable:

- **0×** — nominal spring / no assumed amplitude-rate coupling;
- **1×** — educational curve;
- **5×** — diagnostic exaggeration;
- **20×** — extreme inspection.

At 1×, the current reconstruction curve uses a normalized reference amplitude around 0.74, with a low-amplitude endpoint near −120 s/day and a high-amplitude endpoint near +12 s/day. These remain explicit assumptions, not measured ETA timing data.

In M5f the curve no longer directly assigns oscillator phase speed. It perturbs the natural frequency used in the restoring term, while θ and ω are still integrated as mechanical state.

## Power-system ownership change

M5f now owns the escapement gate. The older M5c normalized-envelope layer remains available for historical UI and geometry dependencies, but it no longer controls reserve release when the external M5f oscillator is active.

The M4c power system exposes its original reserve-consuming `advance` path so M5f can:

1. decide whether the physical oscillator can unlock;
2. hold reserve on oscillator/contact stall;
3. otherwise call the original reserve-consumption path without losing M4 accounting.

## Current causal chain

The educational model is now approximately:

> crown → winding train → stored reserve → drive proxy → impulse Δω → integrated balance θ/ω → recovered oscillator phase → pallet motion/contact geometry → geometry-constrained escape release → train → hands

This is the first milestone where balance phase is genuinely downstream of an oscillator state rather than being prescribed first.

## What M5f does not claim

M5f does **not** claim or model as production truth:

- measured ETA balance inertia;
- measured hairspring stiffness;
- actual damping/Q;
- real impulse torque or pallet efficiency;
- real balance amplitude in physical degrees;
- exact impulse timing/contact duration;
- regulator-pin geometry or effective hairspring-length changes;
- beat error;
- poise error;
- positional timing error;
- temperature effects;
- shock response;
- real lubrication/friction losses;
- calibrated barrel torque-to-oscillator dynamics;
- factory timing performance.

The official 3 Hz / 21,600 A/h value remains the nominal reference. M5f improves system architecture and state causality without pretending normalized coefficients are factory measurements.

## Inspection workflow

For the clearest physical-state inspection:

1. wind the watch;
2. choose the **Escapement** view;
3. run at `0.1×`, `0.25×`, `0.5×`, or `1×`;
4. watch θ, ω, restoring acceleration, damping, and Δω together;
5. inspect the phase portrait while impulses maintain the oscillator;
6. enable the M5d contact overlay when you want to compare oscillator-driven pallet phase with escape-wheel contact.

Use `300×` or `3600×` for reserve/run-down demonstrations; the UI will explicitly show the fast-forward envelope mode when detailed ODE stepping is bypassed.

## Provenance classes

- **official** — directly supported by technical material;
- **reference-derived** — reconstructed from service diagrams, teardown photographs, or multiple references;
- **approximate** — simplified geometry preserving mechanical role and relationship;
- **presentation** — geometry, controls, thresholds or normalized simulation assumptions added for readability and interaction.

## Next milestones

### M5g — geometry-admitted impulse

- make the actual M5d impulse-contact state admit or reject the M5f Δω packet;
- deliver impulse only while the tracked escape tooth and pallet impulse face are in a valid geometric work interval;
- expose delivered impulse work and missed-contact diagnostics;
- remove the remaining assumption that every eligible center crossing automatically receives impulse.

### M5h — deeper polygonal contact

- replace tooth-tip / face-segment distance with reconstructed tooth and pallet-face polygon intersection;
- derive lock depth and drop from those surfaces;
- include roller-jewel / fork-slot and horn safety checks in the same contact framework.

### M6 — shared system simulation

- separate barrel-arbor winding from barrel-drum release;
- improve force transmission through the train;
- couple barrel torque, train load, escapement impulse, oscillator state and reserve into one integrated system;
- migrate normalized assumptions toward measured/reference parameters as defensible data becomes available.

## Sources

- ETA 6497-2 Technical Communication: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/
- ETA 6497-2 spare-parts communication: https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1632/
- Case & Caliber ETA 6497 disassembly: https://caseandcaliber.com/eta-6497-disassembly/
- Horology Student Unitas/ETA 6497/6498 reference: https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/
