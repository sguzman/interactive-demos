import * as THREE from 'three';

const DEG = Math.PI / 180;

export const LIGHT_PRESETS = {
  hard:     { azimuth: 35,  elevation: 42, distance: 58, intensity: 145, ambient: .24, rim: 1.0, warm: .25 },
  raking:   { azimuth: -18, elevation: 12, distance: 52, intensity: 175, ambient: .10, rim: .55, warm: .05 },
  top:      { azimuth: 90,  elevation: 82, distance: 62, intensity: 160, ambient: .18, rim: .35, warm: .08 },
  backlit:  { azimuth: 165, elevation: 26, distance: 66, intensity: 185, ambient: .08, rim: 2.8, warm: .02 },
  studio:   { azimuth: 42,  elevation: 50, distance: 72, intensity: 92,  ambient: .58, rim: 1.4, warm: .62 },
  dark:     { azimuth: -42, elevation: 26, distance: 46, intensity: 82,  ambient: .05, rim: .75, warm: .12 }
};

export function createLightingRig(scene, materials) {
  const ambient = new THREE.HemisphereLight(0xdce8ff, 0x17110d, LIGHT_PRESETS.hard.ambient);
  scene.add(ambient);

  const key = new THREE.SpotLight(0xffffff, LIGHT_PRESETS.hard.intensity, 0, Math.PI / 3.7, 0.02, 1.45);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.00018;
  key.shadow.normalBias = 0.018;
  key.shadow.camera.near = 4;
  key.shadow.camera.far = 160;
  scene.add(key);
  scene.add(key.target);

  const rim = new THREE.DirectionalLight(0x8fbfff, LIGHT_PRESETS.hard.rim);
  rim.position.set(-34, 18, -30);
  scene.add(rim);

  const warm = new THREE.PointLight(0xffb76b, LIGHT_PRESETS.hard.warm * 45, 100, 2);
  warm.position.set(-26, -24, 32);
  scene.add(warm);

  const gizmo = new THREE.Group();
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.0, 24, 16), materials.lightGizmo);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.7, .065, 8, 48),
    materials.lightGizmo
  );
  halo.rotation.x = Math.PI / 2;
  gizmo.add(orb, halo);
  scene.add(gizmo);

  const state = { ...LIGHT_PRESETS.hard, shadows: true, gizmo: true };

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
    key.intensity = state.intensity;
    key.castShadow = state.shadows;
    ambient.intensity = state.ambient;
    rim.intensity = state.rim;
    warm.intensity = state.warm * 45;
    applyPosition();
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
  return { state, key, ambient, rim, warm, gizmo, setPreset, patch, apply };
}
