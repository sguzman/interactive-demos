import * as THREE from 'three';

const DEG = Math.PI / 180;
const SPOT_CANDELA_SCALE = 115;
const CAMERA_DIRECTIONAL_SCALE = 0.024;

// Lighting is an inspection instrument, not just presentation. The default is
// deliberately bright and camera-aligned so small bridge, tooth, jewel and screw
// features remain readable. The manual key remains available for raking light.
export const LIGHT_PRESETS = {
  camera: {
    mode: 'camera', azimuth: 35, elevation: 46, distance: 60,
    intensity: 260, cameraIntensity: 430, ambient: .82, rim: 1.35, warm: .12,
    exposure: 1.95
  },
  fullbright: {
    mode: 'both', azimuth: 28, elevation: 52, distance: 54,
    intensity: 420, cameraIntensity: 620, ambient: 1.00, rim: 1.10, warm: .08,
    exposure: 2.35
  },
  hard: {
    mode: 'both', azimuth: 35, elevation: 46, distance: 58,
    intensity: 330, cameraIntensity: 300, ambient: .62, rim: 1.50, warm: .16,
    exposure: 1.85
  },
  raking: {
    mode: 'manual', azimuth: -20, elevation: 12, distance: 45,
    intensity: 430, cameraIntensity: 220, ambient: .42, rim: 1.05, warm: .04,
    exposure: 1.90
  },
  top: {
    mode: 'both', azimuth: 92, elevation: 82, distance: 54,
    intensity: 380, cameraIntensity: 250, ambient: .54, rim: .75, warm: .04,
    exposure: 1.85
  },
  backlit: {
    mode: 'manual', azimuth: 168, elevation: 24, distance: 50,
    intensity: 440, cameraIntensity: 180, ambient: .34, rim: 3.10, warm: .02,
    exposure: 1.92
  },
  studio: {
    mode: 'both', azimuth: 40, elevation: 52, distance: 64,
    intensity: 285, cameraIntensity: 290, ambient: .78, rim: 1.70, warm: .28,
    exposure: 1.78
  },
  dark: {
    mode: 'manual', azimuth: -42, elevation: 26, distance: 44,
    intensity: 180, cameraIntensity: 120, ambient: .18, rim: .85, warm: .08,
    exposure: 1.35
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

  // Broad non-shadowing fill: geometry inspection should not lose whole faces
  // just because the hard key is grazing them.
  const fill = new THREE.DirectionalLight(0xe5efff, 1.0);
  fill.position.set(-26, 34, 44);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xa7ceff, 1.0);
  rim.position.set(-36, 18, -34);
  scene.add(rim);

  const warm = new THREE.PointLight(0xffbd7a, 1, 120, 2);
  warm.position.set(-25, -23, 30);
  scene.add(warm);

  // Explicit camera-axis inspection source. A directional light is intentional:
  // its readability does not collapse with camera distance. It sits conceptually
  // just behind the camera and shines exactly down the viewing axis.
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

    ambient.intensity = .68 + state.ambient * 2.35;
    fill.intensity = .95 + state.ambient * 1.65;
    rim.intensity = state.rim;
    warm.intensity = state.warm * 3000;

    cameraKey.intensity = cameraEnabled() ? state.cameraIntensity * CAMERA_DIRECTIONAL_SCALE : 0;
    cameraFill.intensity = cameraEnabled() ? Math.max(.6, state.cameraIntensity * .0055) : 0;
    applyPosition();
  }

  function followCamera(camera, target) {
    const axis = camera.position.clone().sub(target).normalize();

    // Put the conceptual lamp a little behind the camera, pointing through the
    // camera target. DirectionalLight position determines direction only.
    cameraKey.position.copy(camera.position).addScaledVector(axis, 12);
    cameraKey.target.position.copy(target);
    cameraKey.target.updateMatrixWorld();

    // Slightly offset secondary camera fill keeps relief on nearly frontal metal.
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
