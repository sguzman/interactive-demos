# Watch demo

Interactive exploded reconstruction of the ETA/Unitas 6497-2 movement family inside a 44 mm exhibition-style wristwatch shell.

## Files

- `index.html` — UI shell and import map.
- `style.css` — inspection-oriented overlay UI.
- `main.js` — scene orchestration, interaction, animation, exploded state, inspector.
- `geometry.js` — constructive geometry vocabulary.
- `materials.js` — reusable metal, jewel, crystal, dial, leather, and gizmo materials.
- `lighting.js` — movable hard-key inspection rig and presets.
- `movement.js` — movement/watch construction, functional assemblies, metadata and provenance.

## Model contract

The geometry is built in millimetres and is intentionally inspectable. Official dimensions are used where sourced; unsourced shapes are explicitly marked `reference-derived`, `approximate`, or `presentation` in the component inspector.

The 6497-2 movement is the strict target. The current 44 mm cushion shell is a reference-derived presentation based on the OP XI / PAM111 lineage rather than exact production CAD.

## M1 limitations

- bridge contours are only first-pass reference silhouettes;
- train positions and wheel dimensions are not yet manufacturing coordinates;
- gear rotation rates are visual, not yet solved from a single mechanical state;
- escape-wheel motion is beat-stepped for legibility;
- winding is shown architecturally but does not yet store/consume a simulated spring-energy state;
- exact engravings, finishing, Incabloc geometry, regulator details, and case revisions are deferred.

## Next

M2 focuses on plate/bridge fidelity and placement. M3 focuses on wheel/pinion relationships. M4 makes winding causal. M5 upgrades the Swiss lever escapement. M6 replaces decorative animation with a shared mechanical simulation state.

Full provenance and research notes: `../docs/watch-eta-6497-2.html`.
