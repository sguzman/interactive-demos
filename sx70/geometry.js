import * as THREE from 'three';
import { COMPONENTS, RECONSTRUCTION } from './spec.js';

const DEG = Math.PI / 180;

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: options.metalness ?? 0.12,
    roughness: options.roughness ?? 0.58,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide
  });
}

const materials = {
  chrome: material(0xb8bec4, { metalness: 0.82, roughness: 0.26 }),
  chromeDark: material(0x596169, { metalness: 0.75, roughness: 0.34 }),
  leather: material(0x3a2418, { metalness: 0.02, roughness: 0.9 }),
  black: material(0x111417, { metalness: 0.04, roughness: 0.86 }),
  bellows: material(0x171311, { metalness: 0.0, roughness: 0.96 }),
  glass: material(0x183149, { metalness: 0.08, roughness: 0.18, transparent: true, opacity: 0.72 }),
  link: material(0x8c9298, { metalness: 0.8, roughness: 0.3 }),
  filmDoor: material(0x24282b, { metalness: 0.18, roughness: 0.64 }),
  accent: material(0xd7c7a1, { metalness: 0.35, roughness: 0.46 })
};

function box(w, h, d, mat = materials.black) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(radius, depth, mat = materials.chrome, radialSegments = 48) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, radialSegments), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function mark(mesh, componentKey) {
  const meta = COMPONENTS[componentKey];
  if (!meta) return mesh;
  mesh.userData.inspectable = true;
  mesh.userData.componentKey = componentKey;
  mesh.userData.component = meta;
  return mesh;
}

function lerpPose(mesh, folded, open, t) {
  mesh.position.set(
    THREE.MathUtils.lerp(folded.position[0], open.position[0], t),
    THREE.MathUtils.lerp(folded.position[1], open.position[1], t),
    THREE.MathUtils.lerp(folded.position[2], open.position[2], t)
  );
  mesh.rotation.set(
    THREE.MathUtils.lerp(folded.rotation[0], open.rotation[0], t),
    THREE.MathUtils.lerp(folded.rotation[1], open.rotation[1], t),
    THREE.MathUtils.lerp(folded.rotation[2], open.rotation[2], t)
  );
}

function setCylinderBetween(mesh, a, b, radiusScale = 1) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const direction = end.clone().sub(start);
  const length = Math.max(0.001, direction.length());

  mesh.position.copy(midpoint);
  mesh.scale.set(radiusScale, length, radiusScale);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
}

function makeLink(radius = 1.25) {
  const link = cylinder(radius, 1, materials.link, 18);
  return mark(link, 'erectingLinks');
}

export function createSX70Model() {
  const root = new THREE.Group();
  root.name = 'Polaroid SX-70 public reconstruction';

  const pickables = [];
  const componentRoots = new Map();
  const register = (key, object) => {
    componentRoots.set(key, object);
    object.traverse(child => {
      if (child.isMesh) {
        mark(child, key);
        pickables.push(child);
      }
    });
    return object;
  };

  const base = new THREE.Group();
  const baseShell = box(RECONSTRUCTION.base.width, RECONSTRUCTION.base.height, RECONSTRUCTION.base.depth, materials.chrome);
  baseShell.position.y = 0;
  base.add(baseShell);

  const leatherTop = box(91, 2.5, 146, materials.leather);
  leatherTop.position.set(0, RECONSTRUCTION.base.height / 2 + 1.35, -4);
  base.add(leatherTop);

  const filmDoor = box(100, 12, 27, materials.filmDoor);
  filmDoor.position.set(0, -1, 74);
  base.add(filmDoor);

  const rollerA = cylinder(5.1, 89, materials.chromeDark, 32);
  rollerA.rotation.z = Math.PI / 2;
  rollerA.position.set(0, 8.4, 63.2);
  base.add(rollerA);
  const rollerB = rollerA.clone();
  rollerB.position.z = 70.4;
  base.add(rollerB);

  register('base', base);
  mark(filmDoor, 'frontDoor');
  mark(rollerA, 'frontDoor');
  mark(rollerB, 'frontDoor');
  root.add(base);

  const rearPanel = new THREE.Group();
  const rearFrame = box(
    RECONSTRUCTION.body.rearPanelWidth,
    RECONSTRUCTION.body.rearPanelHeight,
    RECONSTRUCTION.body.rearPanelThickness,
    materials.chrome
  );
  const rearLeather = box(
    RECONSTRUCTION.body.rearPanelWidth - 12,
    RECONSTRUCTION.body.rearPanelHeight - 13,
    2.4,
    materials.leather
  );
  rearLeather.position.z = -RECONSTRUCTION.body.rearPanelThickness / 2 - 1.25;
  rearPanel.add(rearFrame, rearLeather);
  register('rearPanel', rearPanel);
  root.add(rearPanel);

  const forwardPanel = new THREE.Group();
  const forwardFrame = box(
    RECONSTRUCTION.body.forwardPanelWidth,
    RECONSTRUCTION.body.forwardPanelHeight,
    RECONSTRUCTION.body.forwardPanelThickness,
    materials.chrome
  );
  const forwardInset = box(
    RECONSTRUCTION.body.forwardPanelWidth - 13,
    RECONSTRUCTION.body.forwardPanelHeight - 14,
    2.2,
    materials.black
  );
  forwardInset.position.z = RECONSTRUCTION.body.forwardPanelThickness / 2 + 1.15;
  forwardPanel.add(forwardFrame, forwardInset);
  register('forwardPanel', forwardPanel);
  root.add(forwardPanel);

  const lensHousing = new THREE.Group();
  const lensBody = box(
    RECONSTRUCTION.body.lensHousingWidth,
    RECONSTRUCTION.body.lensHousingHeight,
    RECONSTRUCTION.body.lensHousingDepth,
    materials.black
  );
  lensHousing.add(lensBody);

  const frontTrim = box(
    RECONSTRUCTION.body.lensHousingWidth - 5,
    RECONSTRUCTION.body.lensHousingHeight - 5,
    2.7,
    materials.chromeDark
  );
  frontTrim.position.z = RECONSTRUCTION.body.lensHousingDepth / 2 + 1.5;
  lensHousing.add(frontTrim);

  const lensBarrel = cylinder(17.5, 14, materials.chromeDark, 64);
  lensBarrel.rotation.x = Math.PI / 2;
  lensBarrel.position.set(-17, 1, RECONSTRUCTION.body.lensHousingDepth / 2 + 8);
  lensHousing.add(lensBarrel);

  const lensGlass = cylinder(14.1, 1.7, materials.glass, 64);
  lensGlass.rotation.x = Math.PI / 2;
  lensGlass.position.set(-17, 1, RECONSTRUCTION.body.lensHousingDepth / 2 + 15.4);
  lensHousing.add(lensGlass);

  const photocell = cylinder(5.8, 3.2, materials.glass, 32);
  photocell.rotation.x = Math.PI / 2;
  photocell.position.set(17, 4, RECONSTRUCTION.body.lensHousingDepth / 2 + 15);
  lensHousing.add(photocell);

  const shutterButton = cylinder(3.5, 5, materials.accent, 24);
  shutterButton.rotation.z = Math.PI / 2;
  shutterButton.position.set(37, -13, 5);
  lensHousing.add(shutterButton);

  register('lensHousing', lensHousing);
  mark(lensBarrel, 'takingLens');
  mark(lensGlass, 'takingLens');
  root.add(lensHousing);

  const viewfinder = new THREE.Group();
  const vfBody = box(69, 24, 24, materials.black);
  viewfinder.add(vfBody);
  const eyepiece = cylinder(7.6, 4, materials.glass, 32);
  eyepiece.rotation.x = Math.PI / 2;
  eyepiece.position.set(18, 0, -14);
  viewfinder.add(eyepiece);
  register('viewfinder', viewfinder);
  root.add(viewfinder);

  const bellows = new THREE.Group();
  const bellowsFolds = [];
  for (let i = 0; i < 8; i += 1) {
    const fold = box(80 - i * 2.8, 3.2, 52 - i * 1.4, materials.bellows);
    bellows.add(fold);
    bellowsFolds.push(fold);
  }
  register('bellows', bellows);
  root.add(bellows);

  const links = {
    leftRear: makeLink(),
    rightRear: makeLink(),
    leftFront: makeLink(),
    rightFront: makeLink()
  };
  for (const link of Object.values(links)) {
    root.add(link);
    pickables.push(link);
  }

  const poses = {
    rearPanel: {
      folded: { position: [0, 17, -26], rotation: [87 * DEG, 0, 0] },
      open: { position: [0, 58, -43], rotation: [-33 * DEG, 0, 0] }
    },
    forwardPanel: {
      folded: { position: [0, 22, 4], rotation: [89 * DEG, 0, 0] },
      open: { position: [0, 63, 15], rotation: [26 * DEG, 0, 0] }
    },
    lensHousing: {
      folded: { position: [0, 24, 39], rotation: [88 * DEG, 0, 0] },
      open: { position: [0, 59, 56], rotation: [0, 0, 0] }
    },
    viewfinder: {
      folded: { position: [0, 25, -18], rotation: [88 * DEG, 0, 0] },
      open: { position: [0, 96, -11], rotation: [-5 * DEG, 0, 0] }
    }
  };

  const state = {
    deployment: 0,
    targetDeployment: 0,
    focus: RECONSTRUCTION.focus.normalizedDefault,
    explosion: 0
  };

  function updateBellows(t) {
    const rearAnchor = new THREE.Vector3(0, 25, -39).lerp(new THREE.Vector3(0, 46, -24), t);
    const frontAnchor = new THREE.Vector3(0, 26, 34).lerp(new THREE.Vector3(0, 48, 48), t);

    for (let i = 0; i < bellowsFolds.length; i += 1) {
      const p = (i + 1) / (bellowsFolds.length + 1);
      const fold = bellowsFolds[i];
      const pos = rearAnchor.clone().lerp(frontAnchor, p);
      pos.y += Math.sin(p * Math.PI) * 7 * t;
      fold.position.copy(pos);
      fold.rotation.x = THREE.MathUtils.lerp(88 * DEG, 3 * DEG, t);
      const spread = THREE.MathUtils.lerp(0.2, 1, t);
      fold.scale.set(THREE.MathUtils.lerp(0.68, 1, spread), 1, THREE.MathUtils.lerp(0.35, 1, spread));
    }
  }

  function updateLinks(t) {
    const folded = {
      leftRear: [[-42, 10, -45], [-42, 19, -20]],
      rightRear: [[42, 10, -45], [42, 19, -20]],
      leftFront: [[-40, 10, 18], [-40, 24, 38]],
      rightFront: [[40, 10, 18], [40, 24, 38]]
    };
    const open = {
      leftRear: [[-43, 10, -58], [-43, 78, -47]],
      rightRear: [[43, 10, -58], [43, 78, -47]],
      leftFront: [[-40, 11, 39], [-40, 70, 50]],
      rightFront: [[40, 11, 39], [40, 70, 50]]
    };

    for (const [name, mesh] of Object.entries(links)) {
      const a = new THREE.Vector3(...folded[name][0]).lerp(new THREE.Vector3(...open[name][0]), t);
      const b = new THREE.Vector3(...folded[name][1]).lerp(new THREE.Vector3(...open[name][1]), t);
      setCylinderBetween(mesh, a.toArray(), b.toArray());
    }
  }

  function applyDeployment(t) {
    const clamped = THREE.MathUtils.clamp(t, 0, 1);
    state.deployment = clamped;

    lerpPose(rearPanel, poses.rearPanel.folded, poses.rearPanel.open, clamped);
    lerpPose(forwardPanel, poses.forwardPanel.folded, poses.forwardPanel.open, clamped);
    lerpPose(lensHousing, poses.lensHousing.folded, poses.lensHousing.open, clamped);
    lerpPose(viewfinder, poses.viewfinder.folded, poses.viewfinder.open, clamped);
    updateBellows(clamped);
    updateLinks(clamped);
    applyExplosion(state.explosion);
    applyFocus(state.focus);
  }

  function applyFocus(value) {
    state.focus = THREE.MathUtils.clamp(value, 0, 1);
    const travel = (state.focus - 0.5) * RECONSTRUCTION.focus.frontElementTravelMmPresentation;
    lensBarrel.position.z = RECONSTRUCTION.body.lensHousingDepth / 2 + 8 + travel;
    lensGlass.position.z = RECONSTRUCTION.body.lensHousingDepth / 2 + 15.4 + travel;
  }

  function applyExplosion(value) {
    state.explosion = THREE.MathUtils.clamp(value, 0, 1);
    const e = state.explosion;
    base.position.set(0, -6 * e, 0);
    rearPanel.position.x = -11 * e;
    forwardPanel.position.x = 11 * e;
    lensHousing.position.x = 23 * e;
    viewfinder.position.x = -19 * e;
    bellows.position.x = -8 * e;
    for (const [name, link] of Object.entries(links)) {
      link.visible = e < 0.82;
      link.userData.explosionName = name;
    }
  }

  function setDeploymentTarget(value) {
    state.targetDeployment = THREE.MathUtils.clamp(value, 0, 1);
  }

  function step(dt) {
    const speed = 2.25;
    if (Math.abs(state.deployment - state.targetDeployment) > 0.0005) {
      const next = THREE.MathUtils.damp(state.deployment, state.targetDeployment, speed, dt);
      applyDeployment(next);
    } else if (state.deployment !== state.targetDeployment) {
      applyDeployment(state.targetDeployment);
    }
  }

  function setExplode(value) {
    state.explosion = THREE.MathUtils.clamp(value, 0, 1);
    applyDeployment(state.deployment);
  }

  applyDeployment(0);

  return {
    root,
    pickables,
    components: componentRoots,
    state,
    setDeploymentTarget,
    setDeploymentImmediate: applyDeployment,
    setFocus: applyFocus,
    setExplode,
    step
  };
}
