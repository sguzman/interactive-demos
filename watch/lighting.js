import * as THREE from 'three';

const DEG = Math.PI / 180;
const SPOT_CANDELA_SCALE = 78;

// The UI keeps human-friendly 0–260 intensity values. Three.js spot/point
// lights use physically based falloff, so those values are scaled into a much
// larger candela range before reaching the renderer. The previous rig fed the
// UI number straight into the SpotLight, which made a metal-heavy watch almost
// black at ~60 mm distance.
export const LIGHT_PRESETS = {
  hard:       { azimuth: 35,  elevation: 46, distance: 60, intensity: 190, ambient: .48, rim: 1.45, warm: .18, exposure: 1.58, headlampIntensity: 1.15 },
  fullbright: { azimuth: 28,  elevation: 50, distance: 58, intensity: 225, ambient: .92, rim: 1.00, warm: .08, exposure: 1.72, headlampIntensity: 2.20 },
  raking:     { azimuth: -20, elevation: 13, distance: 48, intensity: 230, ambient: .30, rim: 1.10, warm: .04, exposure: 1.62, headlampIntensity: .72 },
  top:        { azimuth: 92,  elevation: 82, distance: 58, intensity: 215, ambient: .42, rim: .75,  warm: .04, exposure: 1.60, headlampIntensity: .95 },
  backlit:    { azimuth: 168, elevation: 24, distance: 54, intensity: 235, ambient: .26, rim: 2.80, warm: .02, exposure: 1.64, headlampIntensity: .58 },
  studio:     { azimuth: 40,  elevation: 52, distance: 68, intensity: 170, ambient: .72, rim: 1.60, warm: .32, exposure: 1.52, headlampIntensity: 1.25 },
  dark:       { azimuth: -42, elevation: 26, distance: 46, intensity: 115, ambient: .18, rim: .85,  warm: .08, exposure: 1.28, headlampIntensity: .35 }
};

export function createLightingRig(scene, materials) {
  const ambient = new THREE.HemisphereLight(0xe3ecff, 0x2a211c, 1.0);
  scene.add(ambient);

  const key = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 2.9, 0.04, 2.0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.00012;
  key.shadow.normalBias = 0.016;
  key.shadow.camera.near = 3;
  key.shadow.camera.far = 170;
  scene.add(key);
  scene.add(key.target);

  // A broad directional fill prevents metal faces that miss the spot highlight
  // from collapsing into black. It is intentionally weaker than the key.
  const fill = new THREE.DirectionalLight(0xd8e7ff, 1.0);
  fill.position.set(-26, 34, 44);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x9bc8ff, 1.0);
  rim.position.set(-36, 18, -34);
  scene.add(rim);

  const warm = new THREE.PointLight(0xffbd7a, 1, 120, 2);
  warm.position.set(-25, -23, 30);
  scene.add(warm);

  // Camera-following inspection lamp. This is not a beauty-render cheat; it is
  // an explicit readability tool so bridge-side and dial-side inspection stay
  // usable regardless of where the movable key is parked.
  const headlamp = new THREE.DirectionalLight(0xffffff, 1.0);
  scene.add(headlamp);
  scene.add(headlamp.target);

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
    ...LIGHT_PRESETS.hard,
    shadows: true,
    gizmo: true,
    headlamp: true
  };

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
    gizmo.visible = state.gizmo;
  }

  function apply() {
    // SpotLight intensity is scaled because inverse-square falloff otherwise
    // makes a value like 145 essentially useless at the model's working range.
    key.intensity = state.intensity * SPOT_CANDELA_SCALE;
    key.castShadow = state.shadows;

    ambient.intensity = .42 + state.ambient * 1.75;
    fill.intensity = .55 + state.ambient * .95;
    rim.intensity = state.rim;
    warm.intensity = state.warm * 2400;
    headlamp.intensity = state.headlamp ? state.headlampIntensity : 0;
    applyPosition();
  }

  function followCamera(camera, target) {
    headlamp.position.copy(camera.position);
    headlamp.target.position.copy(target);
    headlamp.target.updateMatrixWorld();
  }

  function setPreset(name) {
    Object.assign(state, LIGHT_PRESETS[name] ?? LIGHT_PRESETS.hard);
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
    headlamp,
    gizmo,
    setPreset,
    patch,
    apply,
    followCamera
  };
}
