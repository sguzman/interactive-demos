# ETA / Unitas 6497-2 watch reconstruction

## Current state

**Milestone: M5e — amplitude-dependent simulated rate.**

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

At the official nominal rate this closes to approximately 5 s/rev for the escape wheel, 60 s/rev for the seconds/fourth wheel, 7.5 min/rev for the third wheel, and 1 h/rev for the centre wheel. Pitch-radius reconstruction, separate axial wheel planes, staffs, jewel spans, endshake diagnostics and wheel-body clearance guides remain active.

### M4 — winding, setting and reserve

Crown winding creates persistent reserve, the click enforces one-way ratchet behavior, the stem separates winding from hand-setting mode, positive reserve opens the movement gate, and running consumes reserve. The current full-wind interaction maps **45 crown turns** to the sourced **60 h typical reserve** endpoint; the 45-turn count is a presentation assumption, not an ETA service specification.

### M5a–M5c — event release and oscillator amplitude

The Swiss lever path is event-resolved at six nominal beats per second. The 15-tooth escape wheel releases one half-tooth per beat. M5c then gives the balance a normalized amplitude state that loses energy through damping and receives reserve-dependent impulse packets. At low reserve the oscillator can fall below the unlock threshold and stall while residual spring reserve remains held.

Current normalized M5c dynamics remain educational parameters rather than ETA measurements:

- damping: **0.16 / simulated second**;
- maximum impulse coefficient: **0.070**;
- unlock threshold: **0.18 normalized amplitude**;
- restart reserve threshold: **1.2%**;
- restart amplitude seed: **0.34 normalized amplitude**.

### M5d — geometry-constrained pallet contact

M5d moves escape release toward reconstructed spatial contact rather than fixed fractions of a beat. Entry/exit solver faces are calibrated against the visible 15-tooth escape wheel. Start-face travel, target-face approach, tooth-to-segment gap and a penetration guard constrain each 12° half-tooth release.

Current contact-space reconstruction targets remain:

- unlock face travel: **0.030 mm**;
- target-face capture distance: **0.040 mm**;
- nominal contact tolerance: **0.035 mm**;
- penetration guard: **0.006 mm**.

The downstream fourth, third and centre wheels and the hands inherit released time derived from that geometry-constrained escape angle.

## M5e — amplitude-dependent simulated rate

M5e removes another idealization: usable balance amplitude no longer implies perfectly nominal timekeeping.

### Two clocks instead of one

The model now explicitly separates:

1. **reserve-consuming runtime** — how many simulated seconds the spring has paid for;
2. **oscillator phase time** — how rapidly the balance/pallet/escape sequence advances.

Before M5e these clocks were effectively identical. M5e lets oscillator phase gain or lose time relative to reserve-consuming runtime.

This is the central architectural change because the watch can now consume one hour of modeled reserve while the oscillator/trains indicate slightly more or slightly less than one hour.

### Nominal ETA specification remains separate

The sourced nominal reference remains:

- **3.000 Hz**;
- **21,600 A/h**.

M5e reports that nominal value separately from the model's instantaneous effective frequency. The simulation therefore does not silently replace an ETA specification with an assumed rate curve.

### Educational isochronism curve

The current amplitude-to-rate relationship is deliberately transparent and replaceable. It uses normalized oscillator amplitude rather than physical degrees.

Current reconstruction parameters:

- normalized reference amplitude: **0.74**;
- nominal deadband around that point: **±0.025 normalized amplitude**;
- low-amplitude endpoint near the unlock threshold: approximately **−120 s/day** at 1× model strength;
- high-amplitude endpoint near normalized amplitude 1.0: approximately **+12 s/day** at 1× model strength.

Below the nominal zone, lower amplitude is modeled as increasingly slow. Above it, unusually high amplitude can run slightly fast. The shape is smooth rather than a hard linear corner.

These values are **not measured ETA 6497-2 isochronism data**. They are educational assumptions whose purpose is to make the previously hidden amplitude→rate dependency explicit.

### Rate multiplier

The model converts seconds/day error into a phase multiplier:

> rate multiplier = 1 + (seconds/day error ÷ 86,400)

The oscillator phase clock advances by reserve-consuming runtime multiplied by this factor. The geometry-constrained escapement then uses that oscillator phase, so rate error propagates naturally into:

- balance center crossings;
- pallet motion;
- geometry-constrained escape release;
- fourth/seconds wheel progress;
- third and centre wheel progress;
- small seconds, minute and hour hands.

### Accumulated phase drift

The UI now shows **oscillator phase drift** directly:

> oscillator phase time − reserve-consuming runtime

A negative value means the modeled watch has fallen behind nominal runtime; a positive value means it has gained.

This is important because instantaneous `s/day` is only a rate. Phase drift is the accumulated timing consequence.

### Effective frequency and alternations

M5e reports live:

- effective frequency in Hz;
- effective alternations per hour;
- current seconds/day error;
- rate multiplier;
- accumulated phase drift;
- current isochronism zone.

When the movement is stopped, the effective frequency is reported as zero rather than pretending the oscillator is still running nominally.

### Isochronism curve plot

The controls include a small live curve showing normalized amplitude on the horizontal axis and modeled seconds/day error on the vertical axis. The current oscillator state is plotted as a moving point so weakening amplitude can be seen moving down the assumed rate curve before eventual unlock failure.

### Diagnostic exaggeration

The UI offers four rate-model strengths:

- **0×** — disable amplitude-rate coupling and retain nominal phase speed;
- **1×** — educational model;
- **5×** — diagnostic exaggeration;
- **20×** — extreme inspection.

Only the assumed rate error is magnified. Reserve, amplitude damping, pallet geometry and contact constraints are not multiplied by this control.

This makes phase drift observable on short browser timescales without falsely claiming the exaggerated settings represent a real 6497-2.

## Current causal chain

The educational model is now approximately:

> crown → winding train → stored reserve → drive proxy → escapement impulse → balance amplitude → amplitude-dependent phase speed → pallet motion/contact geometry → escape-wheel release → train → hands

The remaining weak link is that oscillator phase speed is still assigned from the isochronism curve rather than emerging from an integrated balance/hairspring equation of motion.

## What M5e does not claim

M5e does **not** claim or model as production truth:

- measured ETA rate-vs-amplitude curves;
- physical balance amplitude in degrees;
- ETA balance inertia;
- hairspring stiffness or nonlinear spring law;
- real regulator pin geometry and effective hairspring length changes;
- beat error;
- poise error;
- positional timing error;
- temperature effects;
- shock response;
- real mainspring torque-to-rate calibration;
- escapement friction/lubrication influence on rate;
- factory timing tolerances or adjustment grades.

The 3 Hz / 21,600 A/h figure is official; the amplitude-dependent deviations are explicitly reconstruction-level simulation parameters.

## Inspection workflow

For ordinary viewing, leave rate-model strength at **1×**. To make the rate coupling obvious quickly:

1. wind the watch;
2. choose the **Escapement** view;
3. use `300×` or `3600×` mechanical time for accelerated reserve behavior;
4. switch rate-model strength to `5×` or `20×` if you want phase drift to become visually obvious;
5. watch balance amplitude, seconds/day error and accumulated phase drift together.

For contact inspection, return to `0.1×` / `0.25×` or `0× paused` and use the event-step controls and M5d contact overlay.

## Provenance classes

- **official** — directly supported by technical material;
- **reference-derived** — reconstructed from service diagrams, teardown photographs, or multiple references;
- **approximate** — simplified geometry preserving mechanical role and relationship;
- **presentation** — geometry, controls, thresholds or simulation assumptions added for readability and interaction.

## Next milestones

### M5f — state-integrated oscillator

- represent oscillator phase and angular velocity as explicit state rather than deriving phase from a rate multiplier;
- add a normalized restoring term for the hairspring;
- deliver escapement impulse into angular velocity/energy at the correct event;
- let frequency emerge from oscillator state instead of directly assigning it from an isochronism curve;
- keep all uncalibrated constants explicitly normalized.

### M5g — deeper polygonal escapement contact

- replace tooth-tip / face-segment distance with reconstructed tooth and pallet-face polygon intersection;
- derive lock depth and drop from those surfaces;
- include roller-jewel / fork-slot and horn safety checks in the same contact framework.

### M6 — shared system simulation

- separate barrel-arbor winding from barrel-drum release;
- improve force transmission through the train;
- couple reserve, escapement impulse, oscillator state and rate in one integrated system;
- migrate normalized assumptions toward measured/reference parameters as defensible data becomes available.

## Sources

- ETA 6497-2 Technical Communication: https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/
- ETA 6497-2 spare-parts communication: https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1632/
- Case & Caliber ETA 6497 disassembly: https://caseandcaliber.com/eta-6497-disassembly/
- Horology Student Unitas/ETA 6497/6498 reference: https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/
