import * as THREE from 'three';

function lineFromPoints(points, color, opacity = 0.92) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: false
  });
  const line = new THREE.Line(geometry, material);
  line.renderOrder = 20;
  return line;
}

function node(position, color, radius = 2.2) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 20, 14),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthTest: false })
  );
  mesh.position.set(...position);
  mesh.renderOrder = 21;
  return mesh;
}

function opticalSurface(width, height, color, opacity = 0.24) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.55,
      roughness: 0.25,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  mesh.renderOrder = 10;
  return mesh;
}

const VIEWING_POINTS = {
  scene: [-17, 60, 142],
  lens: [-17, 60, 83],
  fixedMirror: [-17, 64, 37],
  fresnel: [-17, 40, -2],
  corrector: [-17, 78, -15],
  concaveMirror: [-17, 94, -32],
  aerialImage: [-17, 91, -12],
  eye: [-17, 96, -39]
};

const EXPOSURE_POINTS = {
  scene: [-17, 60, 142],
  lens: [-17, 60, 83],
  takingMirror: [-17, 47, 19],
  film: [-17, 7, -18]
};

export function createOpticsVisualization() {
  const root = new THREE.Group();
  root.name = 'SX-70 optical explanation overlay';

  const viewing = new THREE.Group();
  viewing.name = 'Viewing optical graph';

  // The path revisits the fixed mirror physically; the conceptual polyline is split so the
  // repeated participation is legible rather than flattened into one impossible straight ray.
  viewing.add(
    lineFromPoints([
      VIEWING_POINTS.scene,
      VIEWING_POINTS.lens,
      VIEWING_POINTS.fixedMirror,
      VIEWING_POINTS.fresnel
    ], 0x75c9ff),
    lineFromPoints([
      VIEWING_POINTS.fresnel,
      VIEWING_POINTS.fixedMirror,
      VIEWING_POINTS.corrector,
      VIEWING_POINTS.concaveMirror,
      VIEWING_POINTS.aerialImage,
      VIEWING_POINTS.eye
    ], 0x75c9ff)
  );

  const fixedMirror = opticalSurface(64, 42, 0x9fc6d7, 0.3);
  fixedMirror.position.set(...VIEWING_POINTS.fixedMirror);
  fixedMirror.rotation.set(57 * Math.PI / 180, 0, 0);
  fixedMirror.userData.opticalRole = 'Fixed viewing mirror · P0 function / P4 pose';
  viewing.add(fixedMirror);

  const fresnel = opticalSurface(69, 53, 0x7db7c4, 0.22);
  fresnel.position.set(...VIEWING_POINTS.fresnel);
  fresnel.rotation.set(-18 * Math.PI / 180, 0, 0);
  fresnel.userData.opticalRole = 'Reflective Fresnel focus surface · P0 function / P4 pose';
  viewing.add(fresnel);

  const concave = opticalSurface(52, 30, 0xc2d7e0, 0.2);
  concave.position.set(...VIEWING_POINTS.concaveMirror);
  concave.rotation.set(12 * Math.PI / 180, 0, 0);
  concave.userData.opticalRole = 'Concave aspheric relay mirror · P0 function / P4 pose';
  viewing.add(concave);

  for (const [name, position] of Object.entries(VIEWING_POINTS)) {
    const n = node(position, name === 'eye' ? 0xe7f4ff : 0x75c9ff, name === 'eye' ? 2.8 : 1.8);
    n.userData.opticalNode = name;
    viewing.add(n);
  }

  const exposure = new THREE.Group();
  exposure.name = 'Exposure optical graph';
  exposure.add(lineFromPoints([
    EXPOSURE_POINTS.scene,
    EXPOSURE_POINTS.lens,
    EXPOSURE_POINTS.takingMirror,
    EXPOSURE_POINTS.film
  ], 0xffb36e));

  const takingMirror = opticalSurface(69, 53, 0xe0b178, 0.3);
  takingMirror.position.set(...EXPOSURE_POINTS.takingMirror);
  takingMirror.rotation.set(-41 * Math.PI / 180, 0, 0);
  takingMirror.userData.opticalRole = 'Reverse-side taking mirror · P0 function / P4 pose';
  exposure.add(takingMirror);

  const filmPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(78, 82),
    new THREE.MeshBasicMaterial({
      color: 0xf5e1bc,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  filmPlane.position.set(...EXPOSURE_POINTS.film);
  filmPlane.rotation.x = -Math.PI / 2;
  filmPlane.userData.opticalRole = 'Integral-film exposure plane · P0 function / P4 pose';
  exposure.add(filmPlane);

  for (const [name, position] of Object.entries(EXPOSURE_POINTS)) {
    const n = node(position, name === 'film' ? 0xffe1b5 : 0xffb36e, name === 'film' ? 2.8 : 1.8);
    n.userData.opticalNode = name;
    exposure.add(n);
  }

  const commonLensMarker = opticalSurface(39, 39, 0x90d5ff, 0.16);
  commonLensMarker.position.set(...VIEWING_POINTS.lens);
  commonLensMarker.rotation.set(0, 0, 0);
  commonLensMarker.userData.opticalRole = 'Shared four-element taking lens · P0 function / P4 pose';
  root.add(commonLensMarker, viewing, exposure);

  const state = {
    mode: 'none',
    deployment: 0,
    focus: 0.55
  };

  function syncVisibility() {
    const ready = state.deployment > 0.94;
    root.visible = ready && state.mode !== 'none';
    viewing.visible = state.mode === 'viewing';
    exposure.visible = state.mode === 'exposure';
    commonLensMarker.visible = state.mode === 'viewing' || state.mode === 'exposure';
  }

  function setMode(mode) {
    state.mode = ['viewing', 'exposure'].includes(mode) ? mode : 'none';
    syncVisibility();
  }

  function setDeployment(value) {
    state.deployment = THREE.MathUtils.clamp(value, 0, 1);
    syncVisibility();
  }

  function setFocus(value) {
    state.focus = THREE.MathUtils.clamp(value, 0, 1);
    // Presentation-only reminder that the front group moves during focus. The optical graph is
    // intentionally not recalculated as a calibrated ray trace.
    const offset = (state.focus - 0.5) * 5.5;
    commonLensMarker.position.z = VIEWING_POINTS.lens[2] + offset;
  }

  setMode('none');
  setDeployment(0);

  return {
    root,
    state,
    setMode,
    setDeployment,
    setFocus
  };
}
