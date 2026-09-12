# ETA / Unitas 6497-2 watch reconstruction

## Target

This demo is a **movement-first educational reconstruction** centered on the ETA/Unitas 6497-2 family and the Panerai OP XI / PAM111 reference lineage.

The first goal is not to produce manufacturing-grade CAD. The goal is to make a real mechanical architecture spatially legible: power storage, winding, wheel train, escapement, oscillator, motion works, dial/hands, and case should be understandable as separate but interacting systems.

The wristwatch shell is a 44 mm exhibition-style presentation derived from the well-documented Luminor/OP XI family. Brand marks and exact production engravings are intentionally omitted from the procedural model.

## Why this movement

The 6497 family is unusually good for an interactive explainer:

- it is large and visually legible;
- it is manually wound, so the power path is comparatively clean;
- it has a classical Swiss lever escapement;
- it has extensive service/disassembly documentation;
- it has a long history as a teaching/watchmaking movement;
- it has been used and modified in large exhibition-back wristwatches.

## Primary movement facts

ETA currently lists the 6497-2 UNITAS as:

- diameter: **36.60 mm**;
- height: **4.50 mm**;
- display: hours, minutes, small seconds;
- architecture: Lépine calibre;
- winding: manual;
- frequency: **21,600 alternations/hour (3 Hz)**;
- jewels: **17**;
- regulator: ETACHRON.

Primary source:

- ETA 6497-2 product/technical portal: https://portal.eta.ch/fr/6497-2-6497-2-3.html

## Reference-watch lineage

The visual shell and presentation take cues from the **Panerai Luminor Marina PAM00111 / OP XI** lineage because it is one of the best-known wristwatch uses of a 6497-2-derived movement. The OP XI is documented as a hand-wound movement based on the Unitas 6497-2, running at 21,600 vph with 17 jewels and decorated/redesigned bridges.

Reference sources:

- Fratello, Panerai 2000s buying guide / PAM111 discussion: https://www.fratellowatches.com/buying-guide-the-best-panerai-watches-from-the-2000s/
- Panerai movement reference database, OP XI: https://panerai.watchlounge.com/manual-movements/
- Panerai archive examples for 44 mm Luminor Marina case/dial architecture: https://www.panerai.com/us/en/collections/special-editions-archive/2013/pam00464-luminor-marina-acciaio---44mm.html

The demo is **not** presented as a dimensionally exact reproduction of a specific production PAM111 case revision. The movement and functional layout are the stricter target; the shell is a documented reference frame around it.

## Parts and disassembly references

Case & Caliber's 6497 disassembly guide is particularly useful because it identifies major parts and the order in which the movement is opened. It includes references for the hour wheel, cannon pinion, balance, pallet bridge and fork, crown wheel, ratchet wheel, click, centre wheel, barrel, second/fourth wheel, third wheel, and escape wheel.

- https://caseandcaliber.com/eta-6497-disassembly/

Caliber Corner also collects assembly/disassembly resources for the 6497/6498 family, including references to ETA's original interactive service material:

- https://calibercorner.com/eta-unitas-caliber-6497-6498-assembly-disassembly/

## Geometry policy

All authored geometry should be expressed in **millimetres** and generated from inspectable parameters where practical.

Preferred primitive vocabulary:

- `disc`
- `ring`
- `box`
- `roundedPlate`
- `caseRing`
- `gear`
- `pinion`
- `screw`
- `jewel`
- `coil`
- `bridge`
- `pathTube`

The geometry layer is deliberately constructive. A later version may add Boolean operations (`union`, `subtract`, `intersect`) if they materially improve plate/bridge fidelity.

## Provenance classes

Every important component should eventually carry a provenance class:

- **official** — dimension or fact directly supported by ETA/Panerai technical material;
- **reference-derived** — reconstructed from teardown photographs, service diagrams, or multiple secondary references;
- **approximate** — deliberately simplified geometry preserving function and relative placement;
- **presentation** — geometry added for clarity, lighting, or visual communication rather than mechanical fidelity.

The component inspector should expose this distinction instead of allowing approximate geometry to masquerade as measured CAD.

## Functional assemblies

The scene should distinguish at least:

1. **case / protection** — case, bezel, crystal, exhibition back, crown guard;
2. **display** — dial, hour/minute hands, small-seconds display;
3. **motion works** — cannon pinion, hour wheel, hand-driving reduction;
4. **winding / keyless works** — crown, stem, crown wheel, ratchet wheel, click;
5. **power** — barrel, mainspring, arbor;
6. **wheel train** — centre wheel, third wheel, fourth/seconds wheel, escape wheel;
7. **escapement** — escape wheel, pallet fork, pallet stones;
8. **oscillator / regulation** — balance, hairspring, regulator;
9. **structure** — mainplate, barrel bridge, train-wheel bridge, pallet bridge, balance cock, jewels and screws.

## Realism milestones

### M1 — architecture

Correct overall movement diameter/height, recognizable system layout, explicit assemblies, and honest provenance labels.

### M2 — bridge and plate fidelity

Replace generic bars with reference-derived bridge silhouettes and more faithful screw/jewel placement.

### M3 — train fidelity

Improve wheel and pinion proportions, arbor relationships, gear pairing, and small-seconds output.

### M4 — winding fidelity

Represent stem, crown wheel, ratchet wheel, click, barrel arbor, and the causal path from crown rotation to stored spring energy.

### M5 — escapement fidelity

Improve escape-wheel tooth shape, pallet geometry, banking/locking visualization, impulse transfer, balance staff, and hairspring presentation.

### M6 — simulation

Animate a simplified but causal mechanism: winding raises stored energy; the barrel drives the train; the escapement meters release; the balance oscillates at a documented/visualized rate; hands derive from train state rather than independent decorative animation.

### M7 — shell fidelity

Refine the 44 mm exhibition case, crystal, crown guard, dial layout, strap, and caseback using documented reference geometry.

## Lighting requirement

The demo is an inspection tool, not only a beauty render. It must provide:

- hard movable key light;
- azimuth/elevation/distance controls;
- intensity control;
- ambient/fill control;
- shadow toggle;
- presets for hard inspection, raking side light, top inspection, backlight, and studio presentation.

The default should favor readable edges and surface relief over soft cinematic lighting.

## Accuracy statement

Until a component is tagged `official`, its geometry must not be interpreted as a manufacturing dimension. The project is allowed to become more exact over time, but it should never hide the boundary between sourced measurement and visual reconstruction.
