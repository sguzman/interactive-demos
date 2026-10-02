> **Public rendition.** Derived from Works expression `expression:eta-unitas-6497-2-public-engineering-guide:en:v1`. Canonical technical authority remains **internal engineering corpus**; this repository owns the public implementation and rendition. Technical claim status follows the frozen Works provenance contract.

[← Interactive Demos](../) · [Open 3D specimen ↗](../watch/)

# ETA / Unitas 6497-2

## Inside a hand-wound mechanical watch

A mechanical watch is easiest to understand when you stop treating it as a tiny collection
of mysterious gears.

It is a controlled energy-release system.

You put energy into it by turning the crown. A mainspring stores that energy. The barrel
tries to release it into a train of gears. The escapement refuses to let that train run
freely. Instead, it releases the train in small steps and passes some energy into a balance
and hairspring. That oscillator swings back and forth at a controlled rate, and its motion
determines when the escapement may release the next step.

The hands are the visible consequence of that loop.

~~~text
wind the crown
-> store energy in the mainspring
-> release it through the barrel
-> transmit it through the going train
-> meter it through the escapement
-> sustain the balance/hairspring oscillator
-> release the train at controlled intervals
-> move the hands
~~~

The ETA / Unitas 6497-2 is a particularly good movement for studying this system. It is
large, manually wound, mechanically legible, and divided into subsystems that can be
inspected both as physical ideas and in the accompanying 3D reconstruction.

This guide has two goals.

First, it explains how the movement works.

Second, it explains what the interactive reconstruction knows, what it derives, what it
approximates, and what it does not yet know.

Those two goals matter together. A polished 3D model can look more exact than its evidence
really is. The reconstruction is most useful when its causal structure and its uncertainty
are both visible.

---

## Why this movement is worth studying

The 6497-2 is a large manual-wind movement in ETA's UNITAS family. Its scale makes the
architecture unusually easy to follow: the barrel, wheel train, escapement, balance,
bridges, keyless works, and motion works can be treated as distinct systems without losing
their relationships.

That makes it useful for more than watchmaking vocabulary.

It provides compact examples of several general engineering ideas:

- stored energy is not the same thing as immediately usable power;
- a gear train transforms motion as well as transmitting it;
- an oscillator needs both a restoring mechanism and periodic replacement of losses;
- a regulator changes timing by changing an oscillator's effective behavior;
- a contact mechanism can alternate between locking, releasing, and transferring work;
- bearings, surface condition, lubrication, and service state are part of the mechanism;
- a useful simulation can have correct causal architecture while still containing
  reconstructed geometry and normalized parameters.

The movement therefore rewards progressive depth. You can understand its central idea in a
minute and still find meaningful technical questions several layers later.

---

## The movement at a glance

Current ETA documentation anchors the movement at:

| Property | Value |
| --- | --- |
| Calibre | ETA 6497-2 UNITAS |
| Type | Manual-wind mechanical movement |
| Layout | Lépine |
| Diameter | 36.60 mm |
| Height | 4.50 mm |
| Display | Hours, minutes, small seconds |
| Frequency | 3 Hz |
| Alternations | 21,600 A/h |
| Jewels | 17 |
| Regulator | ETACHRON |
| Typical lift angle | 44° |
| Power reserve | 53 h minimum / 60 h typical |

A dated 2020 ETA manufacturing-information document also specifies **25 winding-stem turns
for complete winding** in that document state.

That last number needs a qualifier. The 2020 document carried older reserve figures than the
current 2025 communication. The 25-turn value is therefore preserved here as a dated
manufacturer anchor, not described as if ETA had independently reconfirmed it in the 2025
reserve revision.

This is the kind of distinction that will recur throughout the guide: useful evidence keeps
its date and scope.

---

# Start here: make the interactive watch run

[Open the 3D specimen](../watch/) · [Overview](../watch/?view=overview) · [Winding](../watch/?view=winding) · [Train](../watch/?view=train) · [Escapement](../watch/?view=escapement)

The frozen version of the public demo begins **unwound and stopped**.

That is mechanically coherent for a hand-wound watch, but it creates a bad first impression
if you are expecting the model to start moving immediately.

The operating idea is simple:

1. keep the stem in its winding position;
2. wind the crown to add reserve;
3. let the model run at a normal mechanical time scale;
4. use the inspection views to follow the resulting motion.

The current interface exposes much more than that basic path. It contains exploded-view
controls, multiple subsystem views, simulation speeds, geometry guides, escapement stepping,
oscillator diagnostics, winding and setting controls, visibility layers, load/work
diagnostics, and lighting controls.

You do not need most of them to understand the watch.

For a first pass, use four views:

- **Overview** — orient yourself in the movement;
- **Winding** — watch energy enter the barrel side;
- **Train** — follow rotation through the wheel train;
- **Escapement** — inspect the lock/release/impulse mechanism.

The public interface now puts this basic path first. **Wind & Run** establishes a healthy
demonstration state, while the deeper diagnostic instrument lives under **Advanced
inspection**. The mechanical explanation in this guide does not depend on those presentation
shortcuts.

The important point is conceptual:

> A hand-wound movement does not have useful mechanical state until you put energy into it.

---

# The whole watch in one causal loop

A physical movement can be divided into several subsystems, but it only becomes a watch when
the subsystems close into one causal loop.

~~~text
operator
-> crown / stem
-> winding transmission
-> barrel arbor
-> mainspring
-> barrel drum
-> going train
-> escape wheel
-> pallet lever
-> balance + hairspring
-> controlled escape-wheel release
-> train advance
-> motion works
-> hands
~~~

The escapement and oscillator form the critical loop inside that longer chain.

The gear train supplies torque to the escape wheel.

The escape wheel pushes through the pallet system during impulse.

The pallet system transfers some work to the balance.

The balance and hairspring oscillate.

When the oscillator returns through the appropriate region, it moves the pallet system far
enough to unlock the next escape-wheel tooth.

The train advances again.

Then the sequence repeats.

This means the oscillator is not simply a decorative wheel that happens to swing while the
gears turn. Its motion controls when the gear train is allowed to advance.

Likewise, the escapement is not merely a brake. It both **meters release** and **transfers
energy** to the oscillator that controls the next release.

The movement is a loop, not a one-way chain.

---

# Anatomy: the subsystems you are looking at

The 3D model contains many named objects, but a useful first anatomy groups them by job.

## Winding and setting

The crown and stem are the human interface.

Behind them sit the parts that decide whether crown motion should wind the watch or set the
hands: the winding pinion, sliding pinion, setting lever, yoke, yoke spring, setting wheels,
minute wheel, setting-lever jumper, and related winding components.

Collectively, this family is often discussed as the **keyless works**.

"Keyless" is historical terminology: the point is that the crown and stem perform jobs that
older watches could require a separate key to perform.

## Power storage

ETA's current service vocabulary exposes the power store mainly as the **movement barrel,
complete**.

Mechanically, that assembly contains distinct ideas:

- a barrel arbor connected to the winding side;
- a mainspring that stores elastic energy;
- a barrel drum that releases stored energy into the going train.

Historical exact-6497-2 documentation exposes drum, arbor, and mainspring separately even
though the current service sheet treats the barrel as a complete replacement assembly.

## Going train

The core train contains:

- centre wheel;
- third wheel;
- second/fourth wheel;
- escape wheel.

The names can be confusing because watchmaking terminology often reflects where a wheel
appears in a traditional train or which hand it carries. What matters here is the sequence of
meshes that transforms the barrel's slow release into the much faster motion required at the
escapement.

## Escapement

The main actors are:

- escape wheel;
- pallet fork / lever;
- pallet contact surfaces;
- roller and impulse-jewel system associated with the balance;
- banking and safety geometry.

This is the mechanism that alternately holds and releases the train.

## Oscillator and regulation

The timebase is centered on:

- balance;
- balance spring / hairspring;
- regulator system;
- balance staff and bearings;
- shock-protection components.

ETA identifies the regulator system as ETACHRON and the shock protection as Incabloc.

## Display and motion works

The controlled train ultimately feeds:

- minutes;
- hours;
- small seconds.

The current component map includes a driver cannon pinion and hour wheel. The
second/fourth wheel supplies the small-seconds output, while the centre wheel supplies the
central minute-train output.

## Structure and bearings

The main plate and bridges hold the geometry together. Jewels and pivots support rotating
parts. Screws, shock protection, clearances, surface finishes, lubricants, and service state
determine whether the nominal geometry is actually able to operate with acceptable losses.

These are not background parts. They are the conditions under which the mechanism remains a
mechanism.

---

# Winding the mainspring: storing energy without confusing the turns

[Inspect the winding side in 3D](../watch/?view=winding)

A hand-wound watch begins with human work at the crown.

The winding path is approximately:

~~~text
crown / stem
-> winding pinion / sliding pinion
-> crown wheel
-> ratchet wheel
-> barrel arbor
-> mainspring
~~~

Turning the crown rotates the winding side of the barrel system and increases relative strain
in the mainspring.

During running, the jobs separate. The ratchet/click system holds the winding side while the
barrel drum becomes the release side that drives the train.

That gives us one of the most important distinctions in the entire specimen:

~~~text
crown / stem turns
!=
ratchet / arbor turns
!=
mainspring development turns
!=
barrel-drum release turns
~~~

The dated ETA anchor says complete winding through the stem takes 25 turns in the 2020
document state.

The public simulation currently maps full normalized release to **eight modeled barrel-drum
turns**.

Those are not conflicting measurements. They are descriptions of different parts of the
power path, and the eight-turn drum value is a reconstruction parameter rather than ETA
production data.

## Reserve is not stored energy in joules

ETA's current reserve specification is 53 hours minimum and 60 hours typical.

That does not tell us the exact physical energy stored by the mainspring.

To calculate a real energy curve, we would need stronger physical data: current spring
geometry and material properties, working barrel dimensions, active spring development,
torque as a function of wind state, losses through the train, and other quantities that the
current public documentary record does not fully establish.

The present Engineering corpus deliberately leaves those quantities unknown instead of
turning convenient simulation values into physical measurements.

This is a recurring rule:

> A model can need a number before the evidence can supply a physical number.

When that happens, the reconstruction may use an explicit normalized parameter. The parameter
remains useful as long as its status remains visible.

---

# The going train: turning slow stored motion into timed motion

[Inspect the train in 3D](../watch/?view=train)

The current reference train uses this topology:

~~~text
centre 80 -> third pinion 10
third 60 -> second/fourth pinion 8
second/fourth 120 -> escape pinion 10
escape wheel 15
~~~

The wheel identities and 3 Hz movement frequency are manufacturer-grounded.

The tooth counts come from an audited secondary transcription of ETA training-tool material.
They are therefore reference evidence rather than a claim that every production 6497-2 ever
made must contain exactly this execution.

That provenance does not prevent useful derivation.

At 3 Hz, the oscillator produces six alternations, or half-cycles, per second.

In the Swiss-lever release model, the escape wheel advances by half a tooth per beat:

~~~text
6 beats/s
x 0.5 tooth/beat
= 3 escape teeth/s
~~~

With a 15-tooth escape wheel:

~~~text
15 teeth / 3 teeth/s
= 5 s per escape-wheel revolution
~~~

The upstream ratios then give:

| Member | Reference period |
| --- | ---: |
| Escape wheel | 5 s |
| Second/fourth wheel | 60 s |
| Third wheel | 450 s / 7.5 min |
| Centre wheel | 3600 s / 60 min |

The centre-to-escape speed multiplication is 720.

That is an elegant mechanical bridge between the timebase and the display. The
second/fourth wheel turns once per minute and can carry the small-seconds indication. The
centre wheel turns once per hour and participates in the minute output.

## Kinematics are not the same thing as visual teeth

The 3D reconstruction contains older procedural geometry with decorative tooth counts that do
not always match the adopted kinematic reference.

That is allowed, as long as the layers remain distinct.

A gear can be:

- correctly identified as the centre wheel;
- assigned the reference kinematic ratio;
- drawn with a simplified visual tooth pattern for presentation.

The visual mesh does not become manufacturing truth merely because it looks like a gear.

---

# The Swiss-lever escapement: lock, unlock, impulse, repeat

[Inspect the escapement in 3D](../watch/?view=escapement)

The escapement is where continuous stored energy becomes discrete controlled release.

A useful event sequence is:

~~~text
locked rest
-> balance approaches center
-> unlocking
-> impulse
-> drop
-> opposite lock
-> run to banking / draw
-> detached balance arc
-> reverse half-cycle
~~~

Each term names a different mechanical job.

## Lock

An escape-wheel tooth rests against a pallet locking surface and the train is held.

The barrel may still contain energy. The gear train may still be loaded. But the escapement
prevents further rotation.

## Unlock

As the balance returns toward the interaction region, the roller jewel acts through the fork
and moves the pallet lever.

That movement removes enough lock for the escape-wheel tooth to begin moving.

## Impulse

Once released, the escape wheel does not merely escape.

During the impulse interval, its tooth acts across a pallet surface. Energy passes through the
lever/fork and roller-jewel system toward the balance.

This replaces some of the energy the oscillator loses to friction, air drag, internal losses,
and interaction with the escapement.

## Drop and opposite lock

After the active tooth leaves the pallet, the escape wheel moves freely through a small
interval called drop until another tooth reaches the opposite pallet.

The other pallet then locks the train for the next half-cycle.

## Draw and banking

Locking geometry can bias the lever toward a stable bank. Banking limits the lever's angular
travel and establishes its rest condition.

## Safety action

Fork horns, roller geometry, and guard/safety features help prevent false unlocking or
overbanking when the movement is disturbed.

This safety behavior is mechanically distinct from ordinary impulse transfer.

## The detached arc matters

For much of its motion, the balance should be substantially free from the train.

That matters because the oscillator is useful as a timebase only if the train does not
continuously dictate its motion.

The escapement therefore has to do two apparently contradictory things:

- deliver enough energy to sustain oscillation;
- interfere as little as practical outside the required contact intervals.

That tension is at the heart of mechanical watch escapement design.

## What the 3D model gets right, and what remains reconstructed

The public M5 lineage makes several high-value structural choices:

- a 15-tooth escape wheel;
- alternating pallet action;
- explicit lock, unlock, impulse, and capture states;
- finite tooth and pallet geometry;
- banking;
- roller and impulse-jewel representation;
- fork horns and guard geometry;
- geometry-gated impulse;
- missed-unlock and invalid-contact behavior.

But the current contact dimensions and center distances are not production drawings from ETA.

Historical base-family dimensions help constrain interpretation, but the older 2.5 Hz family
cannot simply be substituted for the modern 3 Hz 6497-2.

The current public geometry remains a reconstruction.

---

# The balance and hairspring: where the timebase comes from

A mechanical oscillator needs two basic things:

1. inertia;
2. a restoring force.

In this watch, the balance supplies rotational inertia and the hairspring supplies a restoring
torque that pulls the balance back toward equilibrium.

A simplified model is:

~~~text
I * theta_ddot + c * theta_dot + kappa * theta = tau_impulse(t)
~~~

where:

- `I` is the balance's rotational inertia;
- `kappa` is the hairspring's effective torsional stiffness;
- `c` represents effective losses;
- `tau_impulse(t)` represents intermittent drive from the escapement.

For a lightly damped idealized oscillator:

~~~text
f0 ~= (1 / 2pi) * sqrt(kappa / I)
~~~

The important point is not the equation itself.

The important point is that **3 Hz is a property of a coupled oscillator**, not a magical
property of one wheel.

ETA specifies the 6497-2 at 3 Hz, or 21,600 alternations per hour. Real rate then depends on
more than nominal frequency: amplitude, escapement interaction, position, temperature,
friction, geometry, adjustment, and manufacturing variation can all matter.

## ETACHRON and regulation

ETA identifies the movement with ETACHRON regulation.

At a high level, regulation changes how the hairspring behaves so that the oscillator's rate
can be adjusted.

The frozen corpus also preserves dated ETA adjustment criteria for rate, position, and
physical amplitude. Those criteria are valuable because they anchor the fact that real
watchmaking amplitude is a physical angular quantity used in timing and adjustment.

## Physical amplitude is not the model's amplitude

The public reconstruction also uses a quantity called amplitude.

These are different objects.

~~~text
ETA / timegrapher balance amplitude
=
physical angular amplitude, measured in degrees

public normalized oscillator amplitude
=
dimensionless reconstruction state

M5 visual angle scale
=
presentation / dynamical model scale
~~~

The model's 0-to-1 normalized amplitude and its 0.43 rad visual scale should never be read as
a physical maximum balance amplitude.

A polished graph does not change the quantity being graphed.

This is one of the most important model-reading rules in the entire project.

---

# Setting and display: routing the same crown into a different job

The crown is not only an energy input.

Pulling or positioning the stem changes the mechanical route so that crown rotation can set
the hands instead of winding the mainspring.

That is the key idea behind the keyless works:

~~~text
one human interface
+
mechanically selected path
=
different function
~~~

In winding mode, crown motion is routed toward the barrel.

In setting mode, it is routed toward the setting wheels and motion works.

The exact path contains several small components, but the conceptual job is straightforward:
engage the correct train, hold that state reliably, and transmit user motion without
accidentally driving the wrong subsystem.

The display then converts controlled train motion into readable time:

- the centre/minute train supports the minute indication;
- the motion works derive the slower hour indication;
- the second/fourth wheel supplies the small-seconds output.

The same machine therefore supports two kinds of motion at the hands:

- motion generated by normal timed running;
- motion imposed directly by the user during setting.

The keyless and motion-work systems keep those paths mechanically coherent.

---

# The parts that make motion possible: bearings, surfaces, oil, and service state

It is tempting to describe a watch by naming the large moving parts and stop there.

That misses a major part of the engineering.

A real movement operates at surfaces.

Pivots rotate in bearings. Teeth slide and roll through contact. Pallets lock and impulse.
Setting parts rub under load. The balance staff must survive shock without permanently losing
its geometry.

For that reason, the useful tribological object is not merely:

~~~text
component -> material
~~~

It is closer to:

~~~text
component
-> bulk material
-> surface state
-> contact partner
-> motion
-> load / speed
-> lubricant or surface treatment
-> service state
~~~

## Manufacturer-anchored materials

The frozen exact-calibre evidence includes:

- main plate and bridges: brass;
- escape wheel: steel;
- pallet fork: steel;
- balance: gilt Glucydur;
- balance spring: nickel steel;
- 17 jewels;
- selected explicitly plated parts, including gold-plated dial fasteners and a
  nickel-plated setting-lever jumper.

Those facts do not tell us every alloy grade, hardness, plating thickness, or surface finish.

Again, identity and material class are not permission to invent missing process data.

## Jewels and shock protection

Jewels provide hard, wear-resistant bearing surfaces for many rotating members.

ETA specifies 17 jewels, but the frozen current public communication does not independently
name the exact material of every movement jewel.

Supplier-family material context can help explain watch stones, but it should not be promoted
into an unsupported part-by-part ETA material list.

The Incabloc balance bearing is also more than a colored jewel.

Conceptually, it is a system:

~~~text
balance-staff pivot
<-> pierced jewel
<-> endstone
<-> shock setting / guide
<-> retaining and return structure
~~~

Its job includes both low-friction bearing support and the ability to survive displacement
under shock without turning a delicate balance staff into a rigid sacrificial pin.

## Why several lubricants exist

ETA's current service communication names several lubricant classes.

That immediately tells us something important: a watch does not have one generic "oil
problem."

Different contacts have different speed, pressure, geometry, retention, and friction needs.

The frozen corpus includes examples such as:

- **Moebius 9010** — a thin oil associated with faster, lower-load applications;
- **HP-1300 / 9104** — a more viscous high-pressure oil class;
- **9501 and 9504** — greases used for selected frictional contacts;
- **9415** — a specialized escapement lubricant used at pallet-stone service points.

The exact service diagram matters if you are repairing the movement. For understanding the
mechanism, the lesson is simpler:

> Lubricant choice is part of contact design.

## Epilame is not oil

Fixodrop appears in the service system as an **epilame** treatment.

Its job is not simply to lubricate a contact. It changes surface-energy behavior so that
lubricant is less likely to spread away from the intended region.

That distinction is mechanically useful:

~~~text
lubricant
=
fluid or grease intended to control friction / wear at a contact

epilame
=
surface treatment intended to control lubricant spreading / retention behavior
~~~

Treating both as "oil" would erase the reason both exist.

## Service state is physical state

ETA's current instructions treat the complete barrel as a prelubricated service assembly:
do not wash it; replace it with the appropriate original prelubricated part if necessary.

That is not mere paperwork.

Cleaning, relubricating, contaminating, wearing, or replacing a component changes the
physical system that actually runs.

A useful movement ontology therefore includes service state alongside component identity.

---

# Why a wound movement can still stop

Power reserve answers one question:

> How much stored running duration is available under the relevant specification or model?

It does not answer another:

> Can the movement successfully deliver enough drive through its present mechanical state to
> complete the next required events?

A movement can retain spring energy and still stop.

Conceptually, causes can include:

- too little usable torque at the relevant wind state;
- excessive friction or downstream load;
- insufficient oscillator amplitude;
- blocked or invalid escapement geometry;
- poor contact behavior;
- contamination;
- damage;
- maladjustment.

This distinction is especially visible in the public simulation.

The M6 model separates reserve from drive margin. It can hold the movement while normalized
reserve remains if the modeled load, geometry, or oscillator state prevents a valid release.

That is a better educational model than silently draining reserve through a mechanism that is
supposed to be stalled.

The exact thresholds are not ETA failure limits. They are reconstruction parameters used to
make the causal distinction explicit.

---

# What is real, what is derived, and what is reconstructed

The 3D model combines evidence from different sources and different levels of certainty.

To keep those levels visible, the project uses six provenance classes:

- **P0 — manufacturer:** direct manufacturer evidence;
- **P1 — direct measurement:** measurement from an identified physical specimen;
- **P2 — derived:** calculation from other evidence;
- **P3 — audited secondary:** non-manufacturer evidence reviewed and retained with scope;
- **P4 — reconstruction:** values or geometry introduced to build the model;
- **P5 — presentation:** choices made mainly to communicate or render the system.

A visible object can legitimately combine several classes.

For example, a wheel may have:

- P0 identity;
- P3 reference tooth-count evidence;
- P2 derived revolution period;
- P4/P5 visual geometry.

There is no contradiction in that mixture as long as the layers are not collapsed.

## The nonimplications to remember

~~~text
official component identity
!=
official component geometry

25 winding-stem turns
!=
8 modeled drum-release turns

reference tooth counts
!=
universal production tooth counts

historical family dimensions
!=
current 6497-2 production dimensions

Three.js millimetres
!=
manufacturing tolerances

normalized torque / load / work
!=
SI torque / force / energy

normalized oscillator amplitude
!=
timegrapher amplitude

unresolved physical quantity
!=
unfinished compulsory research
~~~

These are not legalistic caveats added after the interesting part.

They are what let the interesting part remain trustworthy.

---

# Under the hood: how the interactive simulation became causal

The physical watch should be understood before the simulation's milestone vocabulary.

Once that foundation exists, the M5/M6 lineage becomes useful because it shows how the
interactive model moved from animated representation toward a more explicit causal system.

The broad progression was:

~~~text
visual train motion
-> coupled train behavior
-> winding and finite reserve
-> event-resolved escapement
-> integrated oscillator
-> finite contact/work transfer
-> barrel/load feedback
-> normalized work closure
-> stage-resolved train load
~~~

## Integrated oscillator state

The later M5 model no longer treats the balance as a perfect prescribed visual phase.

It integrates an oscillator state with angle and angular velocity, applies restoring and
damping behavior, and adds discrete impulse effects.

This matters because the oscillator can now succeed, weaken, or fail as state rather than
merely displaying a perpetual animation.

## Finite escapement work

The model also moves beyond a fixed impulse packet.

Finite reconstructed contact geometry affects how much of an available work budget is
delivered or rejected during an impulse opportunity.

The units remain normalized. The important improvement is causal: contact quality and
geometry now influence oscillator drive.

## M6a: barrel-side state

M6a separates arbor winding from barrel-drum release and maps normalized spring state into a
reconstructed torque curve.

The current torque shape and eight-drum-turn full-release mapping are P4 parameters.

## M6b: load can push back

M6b introduces downstream reaction load.

Running demand, contact behavior, low oscillator amplitude, geometry problems, and stall
state can raise modeled load.

The model then computes a drive margin approximately as:

~~~text
spring torque - dynamic train load
~~~

A movement can therefore have reserve but insufficient modeled margin.

## M6c: work bookkeeping

M6c exposes a normalized work ledger:

~~~text
spring-side budget
- train/load loss
= train-side available work
- escapement contact loss
= balance-delivered work
~~~

The point is not to claim joules.

The point is to make inconsistent hidden bookkeeping harder.

## M6d: movement-level operating state

M6d coordinates the barrel, load, contact, oscillator, and power-gate state into movement-level
modes such as:

- unwound;
- winding;
- running;
- winding while running;
- paused;
- torque stall;
- geometry blocked;
- oscillator stalled;
- escapement held.

It also uses hysteresis around the reconstructed torque-stall condition so the simulation does
not chatter rapidly between running and stalled states near one threshold.

## M6e: stage-resolved train load

M6e decomposes part of the train load into named reconstructed contributions associated with
the centre-to-third, third-to-fourth, and fourth-to-escape path, plus pivots/jewels, motion
works, and escapement demand.

This is a meaningful architectural improvement.

It is not a claim that ETA published these normalized per-stage efficiencies.

## What M6e is good for

The current simulation is best understood as:

> a causal educational reconstruction whose architecture is ahead of its physical calibration.

It is useful for seeing dependencies.

Wind state affects drive.

Load affects usable margin.

Contact affects work transfer.

Work transfer affects the oscillator.

The oscillator and geometry affect release.

Release affects the train and display.

That is a much stronger educational object than a collection of unrelated animations.

It still is not a validated predictive simulation of a particular physical 6497-2 specimen.

---

# What we still do not know

The current documentary/reconstruction program is complete for its declared scope, but many
physical quantities remain unresolved.

Important examples include:

- exact current production wheel and pinion diameters beyond sourced anchors;
- pivot and jewel-hole geometry;
- production endshake and side shake;
- depthing and backlash;
- exact current motion-works tooth counts;
- current barrel inner diameter and working arbor dimensions;
- current mainspring dimensions and material properties needed for a calibrated energy model;
- physical torque versus wind;
- absolute stored energy and physical train efficiency;
- exact current escapement center distances and contact geometry;
- balance inertia;
- hairspring dimensions, stiffness, and terminal geometry;
- damping / Q;
- physical impulse energy;
- detailed ETACHRON geometry and sensitivity;
- specimen-specific rate, amplitude, positional, temperature, wear, and shock behavior;
- many exact alloy grades, hardnesses, roughnesses, lubricant quantities, and friction
  coefficients.

A real specimen, proprietary manufacturing drawing, stronger service source, or better
measurement campaign could resolve some of these later.

That would enrich the model.

It does not retroactively make the current research unfinished.

---

# The mental model to keep

If you retain only one model, retain this one:

~~~text
human work
-> mainspring stores energy
-> barrel releases energy
-> train transforms and transmits motion
-> escapement locks and meters release
-> escapement also impulses the oscillator
-> balance + hairspring determine the timing of the next release
-> controlled train motion advances the display
~~~

Then add one more layer:

~~~text
all of this depends on
geometry
+ bearings
+ surfaces
+ lubrication
+ adjustment
+ service state
~~~

And one final layer for the simulation:

~~~text
the reconstruction can make causal dependencies explicit
without every parameter being a measured physical quantity
~~~

That is the reason to keep the interactive model and the documentation together.

The 3D scene lets you see and manipulate the mechanism.

The guide tells you what relationships matter.

The provenance boundary tells you how literally to read what you see.

---

# Sources and provenance

The guide is derived from a frozen Engineering research state and a frozen version of the
public Interactive Demos implementation.

Important public source families in that research include:

## ETA — current product and service documentation

ETA's current product page and 2025 Technical Communication provide the principal current
anchors for identity, dimensions, frequency, jewel count, reserve, lift angle, component
vocabulary, assembly/service information, and lubrication instructions.

- ETA 6497-2 product page:
  https://portal.eta.ch/en/6497-2-6497-2-3.html
- ETA 2025 Technical Communication:
  https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/

## ETA — dated manufacturing and historical exact-calibre documentation

The dated 2020 Manufacturing Information supplies the 25 winding-stem-turn anchor, material
facts, oscillator/regulation information, and adjustment-state evidence used in this guide.

Historical exact-6497-2 documentation helps preserve internal component identity that later
service documentation collapses into larger replacement assemblies.

- ETA 2020 Manufacturing Information:
  https://www.files.masteroftime.ch/6497-2%20ETA%20Manufacturing%20information.pdf
- ETA 6497-2 / 6498-2 historical technical communication:
  https://primrosesupplies.com/Swiss%20Tech%20Guides/ETA%20Tech%20Guides/Mechanical/6497-2%266498-2.pdf

## Historical base-family reference

An older 2.5 Hz FHF / Unitas 6497/6498 document supplies comparative family geometry and
mainspring/barrel information.

Those values are historical comparison evidence, not current 6497-2 production dimensions.

- https://myretrowatches.co.uk/wp-content/uploads/2025/06/FHF-6497-6498-Parts-List.pdf

## Audited train reference

Horology Student's 6497 material supplies the current reference tooth-count set used for the
train derivations, with its own warning that another production movement may differ.

- https://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/

## Swiss-lever mechanism context

Horopedia is used for general Swiss-lever mechanism vocabulary and event structure, not for
calibre-specific production dimensions.

- https://horopedia.org/distribution-mechanism-swiss-lever-escapement/

## Lubricant and supplier context

Moebius supplier documentation is used to understand lubricant and epilame classes. Supplier
catalog material is retained with scope rather than silently promoted into ETA production
truth.

- https://www.moebius-lubricants.ch/en/products/oils
- https://www.moebius-lubricants.ch/en/products/greases
- https://www.moebius-lubricants.ch/en/products/epilames

## Interactive reconstruction

The public reconstruction is a model and presentation source, not a manufacturer-fact source.

- Gallery: https://sguzman.github.io/interactive-demos/
- Watch: https://sguzman.github.io/interactive-demos/watch/

The frozen Works lineage preserves the exact source versions used for this expression.
