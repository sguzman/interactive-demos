# Nintendo Game Boy DMG-01 — interactive engineering specimen

Public projection of `specimen:nintendo-game-boy-dmg-01`.

This is a **multi-layer causal reconstruction**, not a full commercial-game emulator.

## Base scope

- original monochrome Nintendo Game Boy / DMG-01;
- representative physical reconstruction anchored to DMG-CPU-06 + DMG-LCD-06;
- power/jack boards shown as explicit representative revision choices;
- later Game Boy models are not silently merged into the base specimen.

## Public layers

- physical product / exploded assembly;
- electrical buses, rails, and board boundaries;
- CPU-visible memory/register ownership;
- temporal PPU/DMA access state;
- cartridge mapper state;
- human-input/JOYP state;
- PPU/LCD path;
- APU/audio path;
- service diagnostic graph.

## Deterministic demo

The browser runtime uses a purpose-built deterministic state model rather than a commercial ROM.

Pressing A deliberately:

~~~text
physical button
-> active-low JOYP state
-> deterministic demo state
-> visible LCD change
-> short CH1 presentation tone
~~~

The tone is synthesized browser presentation, not a captured Game Boy waveform.

## Provenance boundary

The specimen keeps several evidence classes distinct:

- Nintendo OEM service/electrical material;
- Nintendo developer documentation;
- community technical references;
- empirical hardware databases;
- board reverse engineering;
- die reverse engineering;
- community repair;
- Engineering derivation;
- P4/P5 reconstruction/presentation.

A high-precision reverse-engineered fact is not relabeled as Nintendo OEM documentation.

## Debug / browser QA

The page exposes `window.__dmgDebug` for deterministic browser tests.

The runtime smoke test checks power, JOYP, cartridge mapping, PPU access permissions, OAM DMA,
volume-state independence, service diagnosis, layer/explosion state independence, and guide
deep-links.


## Reference-grounded geometry

The visible DMG product geometry no longer uses the original hand-built primitive blockout.

The runtime uses a **hybrid reference stack** rather than trusting one reconstruction for every geometric layer.

The full assembly, internals, rear enclosure, component identities, and explosion hierarchy come from
the pinned `tiansongyu/open-console-cad` GLB:

- upstream commit: `55081da3b4864aba36082644f9a3c5cedf1061c8`;
- Game Boy GLB SHA-256: `9aed0c26e836442ffce065f3607316df7f6d55742b708b9db2394e09e8d99beb`;
- 410 documented components;
- 660,428 triangles;
- 90 × 148 × 32 mm nominal product envelope;
- embedded part IDs, part numbers, assembly groups, material roles, and explosion offsets.

The assembly project explicitly describes the model as unofficial and locally approximate. It is
therefore treated as a strong P4 reconstruction source, **not** Nintendo factory CAD.

For the visible **front enclosure**, the runtime now replaces the assembly-model shell with the pinned
`guighub/DMG-01-Shell` v38 front STL:

- upstream commit: `758e2841dc163b472815c39c651df641966e58eb`;
- pinned front-shell blob: `312893a8b6cb58eb97665c2dcb9be3b24b99ad3b`;
- license: MIT;
- upstream scope statement: front shell mostly complete and compatible with original Game Boy parts;
- upstream caveat: some screw holes may be slightly offset;
- the upstream rear shell is explicitly incomplete, so it is **not** substituted into this specimen.

The independent shell is automatically oriented and uniformly registered to the assembly-model front
envelope. Runtime diagnostics record the raw STL bounds, registration scale, fitted bounds, and
front-plane residual so the replacement cannot silently drift away from the canonical assembly.

As an additional visual cross-check, exterior proportions and shell construction are reviewed against
Wesk's BitBuilt DMG scan renders (front, rear, and battery cover; approximately 2.5 million triangles
per source mesh). Those scans are used as visual reference only and are not redistributed here.

Engineering closure additionally compares the rendered public specimen against Nintendo envelope
data, teardown photography, revision-specific board references, the printable-replica shell, scan
renders, and the frozen landmark ledger.

The deterministic causal runtime remains separate from geometry provenance.

### Reference-conformance gate

The public runtime now exposes a machine-checkable geometry audit in
`window.__dmgDebug.state.geometry.referenceConformance`. It checks the imported product envelope
against the 90 × 148 × 32 mm nominal DMG envelope and checks source-authored landmark coordinates
for the LCD window, D-pad, A/B, START/SELECT, and battery LED.

The pinned upstream source itself records:

- 15 staged reconstruction passes;
- 410 component entries / 768 solids;
- 660,428 web-preview triangles;
- 0.10 mm linear and 0.15 rad angular GLB tessellation settings;
- 26 direct model measurements and 14 native drawing dimensions checked;
- 627 candidate interference pairs checked with zero clashes above the source audit threshold;
- source rebuild and STEP round-trip checks passing.

Those are **upstream reconstruction QA facts**, not claims that the geometry is Nintendo production
CAD or manufacturing-tolerance accurate. Local contours, wall thicknesses, hole positions,
packages, contacts, wiring, and fit clearances remain explicitly approximate in the pinned source.

The projection is still in active rendered G4 review. Automated geometry, runtime, registration,
orthographic, three-quarter, transition, exploded, and production-shadow evidence is generated by
CI, but user visual acceptance is explicitly still open.

The explode control is a continuous dissection, not a staged reveal: every part moves linearly from
its assembled origin toward its source-authored exploded offset, and clipping during intermediate
travel is intentional so the origin of each part remains legible. ENG-DMG-022 remains open for
visible geometry cleanup, dissection quality, and direct user acceptance.
