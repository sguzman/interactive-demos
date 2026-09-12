import * as THREE from 'three';

const DEG = Math.PI / 180;
const SPOT_CANDELA_SCALE = 92;
const CAMERA_DIRECTIONAL_SCALE = 0.017;

// Lighting is an inspection instrument, not just presentation. The default is
// camera-aligned but deliberately balanced: bright enough to read small metal
// features without flattening the entire movement into white. Full bright stays
// available as an explicit diagnostic escape hatch.
export const LIGHT_PRESETS = {
  camera: {
    mode: 'camera', azimuth: 35, elevation: 46, distance: 60,
    intensity: 230, cameraIntensity: 235, ambient: .52, rim: 1.18, warm: .10,
    exposure: 1.55
  },
  fullbright: {
    mode: 'both', azimuth: 28, elevation: 52, distance: 54,
    intensity: 390, cameraIntensity: 560, ambient: .95, rim: 1.05, warm: .06,
    exposure: 2.15
  },
  hard: {
    mode: 'both', azimuth: 35, elevation: 46, distance: 58,
    intensity: 285, cameraIntensity: 205, ambient: .44, rim: 1.42, warm: .14,
    exposure: 1.58
  },
  raking: {
    mode: 'manual', azimuth: -20, elevation: 12, distance: 45,
    intensity: 370, cameraIntensity: 160, ambient: .34, rim: 1.00, warm: .03,
    exposure: 1.62
  },
  top: {
    mode: 'both', azimuth: 92, elevation: 82, distance: 54,
    intensity: 330, cameraIntensity: 175, ambient: .42, rim: .72, warm: .03,
    exposure: 1.60
  },
  backlit: {
    mode: 'manual', azimuth: 168, elevation: 24, distance: 50,
    intensity: 390, cameraIntensity: 120, ambient: .26, rim: 2.75, warm: .02,
    exposure: 1.68
  },
  studio: {
    mode: 'both', azimuth: 40, elevation: 52, distance: 64,
    intensity: 245, cameraIntensity: 190, ambient: .58, rim: 1.48, warm: .24,
    exposure: 1.52
  },
  dark: {
    mode: 'manual', azimuth: -42, elevation: 26, distance: 44,
    intensity: 165, cameraIntensity: 90, ambient: .14, rim: .80, warm: .06,
    exposure: 1.26
  }
};

export function createLightingRig(scene, materials) {
  const ambient = new THREE.HemisphereLight(0xe8f0ff, 0x3a2e28, 1.0);
  scene.add(ambient);

  const key = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 2.75, 0.035, 1.7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.00010;
  key.shadow.normalBias = 0.014;
  key.shadow.camera.near = 3;
  key.shadow.camera.far = 190;
  scene.add(key);
  scene.add(key.target);

  // Broad non-shadowing fill: enough to keep metal readable without erasing
  // relief. User controls still have much more headroom than the balanced preset.
  const fill = new THREE.DirectionalLight(0xe5efff, 1.0);
  fill.position.set(-26, 34, 44);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xa7ceff, 1.0);
  rim.position.set(-36, 18, -34);
  scene.add(rim);

  const warm = new THREE.PointLight(0xffbd7a, 1, 120, 2);
  warm.position.set(-25, -23, 30);
  scene.add(warm);

  // Camera-axis inspection source. It sits conceptually just behind the camera
  // and shines through the orbit target. Directional lighting makes readability
  // independent of zoom distance.
  const cameraKey = new THREE.DirectionalLight(0xffffff, 1.0);
  scene.add(cameraKey);
  scene.add(cameraKey.target);

  const cameraFill = new THREE.DirectionalLight(0xd8e8ff, .7);
  scene.add(cameraFill);
  scene.add(cameraFill.target);

  const gizmo = new THREE.Group();
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.0, 24, 16), materials.lightGizmo);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.7, .065, 8, 48),
    materials.lightGizmo
  );
  halo.rotation.x = Math.PI / 2;
  gizmo.add(orb, halo);
  scene.add(gizmo);

  const state = {
    ...LIGHT_PRESETS.camera,
    shadows: true,
    gizmo: true
  };

  function manualEnabled() {
    return state.mode === 'manual' || state.mode === 'both';
  }

  function cameraEnabled() {
    return state.mode === 'camera' || state.mode === 'both';
  }

  function applyPosition() {
    const az = state.azimuth * DEG;
    const el = state.elevation * DEG;
    const planar = state.distance * Math.cos(el);
    const x = planar * Math.cos(az);
    const y = planar * Math.sin(az);
    const z = state.distance * Math.sin(el);
    key.position.set(x, y, z);
    key.target.position.set(0, 0, 0);
    gizmo.position.copy(key.position);
    gizmo.visible = state.gizmo && manualEnabled();
  }

  function apply() {
    key.intensity = manualEnabled() ? state.intensity * SPOT_CANDELA_SCALE : 0;
    key.castShadow = state.shadows && manualEnabled();

    ambient.intensity = .42 + state.ambient * 1.45;
    fill.intensity = .58 + state.ambient * .98;
    rim.intensity = state.rim;
    warm.intensity = state.warm * 2400;

    cameraKey.intensity = cameraEnabled() ? state.cameraIntensity * CAMERA_DIRECTIONAL_SCALE : 0;
    cameraFill.intensity = cameraEnabled() ? Math.max(.30, state.cameraIntensity * .0038) : 0;
    applyPosition();
  }

  function followCamera(camera, target) {
    const axis = camera.position.clone().sub(target).normalize();

    cameraKey.position.copy(camera.position).addScaledVector(axis, 12);
    cameraKey.target.position.copy(target);
    cameraKey.target.updateMatrixWorld();

    // A slightly offset secondary source restores some shape to nearly frontal
    // metal without overpowering the camera-axis key.
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    cameraFill.position.copy(camera.position)
      .addScaledVector(axis, 8)
      .addScaledVector(right, 12);
    cameraFill.target.position.copy(target);
    cameraFill.target.updateMatrixWorld();
  }

  function setPreset(name) {
    Object.assign(state, LIGHT_PRESETS[name] ?? LIGHT_PRESETS.camera);
    apply();
    return { ...state };
  }

  function patch(values) {
    Object.assign(state, values);
    apply();
    return { ...state };
  }

  apply();
  return {
    state,
    key,
    ambient,
    fill,
    rim,
    warm,
    cameraKey,
    cameraFill,
    gizmo,
    setPreset,
    patch,
    apply,
    followCamera
  };
}
