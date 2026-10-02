# DMG-01 geometry reference stack

The public Game Boy geometry is deliberately hybrid. No single available source is treated as
Nintendo production CAD.

## 1. Full assembly / internals

The assembly, internal boards, controls, rear enclosure, cartridge study, component identities, and
explosion hierarchy are grounded in the documented open-source reconstruction at
`tiansongyu/open-console-cad`, pinned at commit
`55081da3b4864aba36082644f9a3c5cedf1061c8`.

Upstream Game Boy asset metadata:

- 410 components / 768 solids;
- 660,428 web-preview triangles;
- 90 × 148 × 32 mm nominal body envelope;
- 47 × 43 mm display window;
- GLB SHA-256 `9aed0c26e836442ffce065f3607316df7f6d55742b708b9db2394e09e8d99beb`;
- source-model SHA-256 `a8c3adf2c8ede383d21c6863a61415319c32aa56cde5caf3cd3b27a827e0b21c`;
- original project content licensed MIT.

The upstream project explicitly treats local contours, wall thicknesses, holes, packages, contacts,
wiring, and fit clearances as approximate study geometry. This is therefore a strong P4 external CAD
reconstruction, not Nintendo factory CAD.

## 2. Visible front enclosure

The visible front shell is replaced at runtime by the independently authored
`guighub/DMG-01-Shell` v38 front STL, pinned at commit
`758e2841dc163b472815c39c651df641966e58eb` and blob
`312893a8b6cb58eb97665c2dcb9be3b24b99ad3b`.

That source documents the front shell as mostly complete and compatible with original Game Boy
parts, while warning that some screw holes may be slightly offset. Its rear shell is explicitly
incomplete, so the rear is not substituted here.

The runtime orients the STL, uniformly registers it against the assembly-model front envelope, and
records raw bounds, registration scale, fitted bounds, and front-plane residual in
`window.__dmgDebug.state.geometry.frontShellReference`.

## 3. Direct hardware-photo cross-checks

Rendered exterior QA is also checked against photographs of real DMG-01 hardware. These photos are
reference evidence only; they are not shipped as runtime textures.

- Front: Wikimedia Commons `File:DMG-01.jpg` — high-resolution scan of an original Game Boy,
  2107 × 3614 px, Chrisweird, CC BY-SA 3.0:
  https://commons.wikimedia.org/wiki/File:DMG-01.jpg
- Rear: Wikimedia Commons `File:Game-Boy-BL.jpg` — rear view photographed by Evan-Amos,
  2730 × 3450 px, public domain:
  https://commons.wikimedia.org/wiki/File:Game-Boy-BL.jpg
- Rear/battery compartment: Wikimedia Commons `File:Nintendo_Game_Boy_DMG-01-0247.jpg`:
  https://commons.wikimedia.org/wiki/File:Nintendo_Game_Boy_DMG-01-0247.jpg
- Disassembly/internal arrangement: Wikimedia Commons category
  `Disassembled Game Boy DMG-01`, including opened-case, motherboard, display-board, LCD-module,
  and casing photographs:
  https://commons.wikimedia.org/wiki/Category:Disassembled_Game_Boy_DMG-01

Wesk's BitBuilt DMG scan renders are additionally used as a visual cross-check for shell shape. They
are not redistributed by this project.

Photo comparison constrains visible silhouette, feature placement, seam relationships, cartridge
seating, control apertures, battery-door/rear relief, side ports, and gross depth. It does **not**
pretend that perspective photographs supply manufacturing tolerances or hidden dimensions.

## 4. Deterministic rendered G4 QA

The browser smoke workflow records geometry diagnostics plus deterministic inspection views:

- front, rear, and rear with cartridge ejected;
- rear three-quarter;
- left, right, and top orthographic views;
- front three-quarter;
- low-percentage continuous-dissection frames;
- fully exploded stack;
- a production-mode shadow-map frame.

Orthographic cameras remove focal-length ambiguity for elevation checks. QA lighting is
camera-relative and fog-free so deep layers remain inspectable; production presentation keeps its own
lighting/fog. Dissection frames intentionally allow intermediate clipping: every part moves
continuously from its actual assembled origin toward its source-authored exploded offset, making the
origin/path legible instead of teleporting or appearing only after shell clearance.

Rendered G4 review remains in progress and direct user visual acceptance is open. These checks do not
mean the model is factory CAD or manufacturing-tolerance accurate.
