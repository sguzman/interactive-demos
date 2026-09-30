import * as THREE from 'three';

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: opts.metalness ?? 0.35,
    roughness: opts.roughness ?? 0.45,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: THREE.DoubleSide,
    depthWrite: opts.depthWrite ?? true
  });
}

const materials = {
  shutter: mat(0x22262b, { metalness: 0.55, roughness: 0.32 }),
  reflex: mat(0x9fc4d6, { metalness: 0.52, roughness: 0.28, transparent: true, opacity: 0.42, depthWrite: false }),
  motor: mat(0x59656f, { metalness: 0.72, roughness: 0.35 }),
  cam: mat(0xc8a66a, { metalness: 0.62, roughness: 0.34 }),
  active: mat(0x73c8ff, { metalness: 0.15, roughness: 0.4 }),
  brake: mat(0xffab6e, { metalness: 0.15, roughness: 0.4 })
};

function box(w,h,d,material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  m.castShadow = true;
  return m;
}

function cyl(r,h,material,segments=32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),material);
  m.castShadow = true;
  return m;
}

export function createMechanismVisualization() {
  const root = new THREE.Group();
  root.name = 'SX-70 exposure mechanism overlay';

  const shutter = new THREE.Group();
  shutter.position.set(-17,60,76);

  const leftBlade = box(25,32,1.2,materials.shutter);
  const rightBlade = box(25,32,1.2,materials.shutter);
  leftBlade.position.x = -14;
  rightBlade.position.x = 14;
  shutter.add(leftBlade,rightBlade);
  root.add(shutter);

  const reflexCarrier = new THREE.Group();
  const carrierPlate = box(67,3.2,52,materials.reflex);
  reflexCarrier.add(carrierPlate);
  root.add(reflexCarrier);

  const motorGroup = new THREE.Group();
  motorGroup.position.set(29,8,5);
  const motor = cyl(8,25,materials.motor,36);
  motor.rotation.z = Math.PI/2;
  motorGroup.add(motor);

  const cam = cyl(11,3,materials.cam,40);
  cam.rotation.x = Math.PI/2;
  cam.position.set(-18,7,10);
  motorGroup.add(cam);
  root.add(motorGroup);

  const state = {
    visible: false,
    shutterPosition: 1,
    reflexProgress: 0,
    motorRunning: false,
    motorBraked: false,
    camAngle: 0
  };

  function setVisible(value) {
    state.visible = Boolean(value);
    root.visible = state.visible;
  }

  function update(cycleState, dt = 0) {
    if (!cycleState) return;
    state.shutterPosition = cycleState.shutterPosition;
    state.reflexProgress = cycleState.reflexProgress;
    state.motorRunning = cycleState.motorRunning;
    state.motorBraked = cycleState.motorBraked;

    const open = THREE.MathUtils.clamp(cycleState.shutterPosition,0,1);
    leftBlade.position.x = THREE.MathUtils.lerp(-2.8,-14,open);
    rightBlade.position.x = THREE.MathUtils.lerp(2.8,14,open);

    const r = THREE.MathUtils.clamp(cycleState.reflexProgress,0,1);
    reflexCarrier.position.set(
      0,
      THREE.MathUtils.lerp(41,58,r),
      THREE.MathUtils.lerp(-1,20,r)
    );
    reflexCarrier.rotation.x = THREE.MathUtils.lerp(-18*Math.PI/180,-67*Math.PI/180,r);

    if (cycleState.motorRunning) state.camAngle += dt * 8.0;
    cam.rotation.z = state.camAngle;
    motor.rotation.x = state.camAngle * 1.8;

    if (cycleState.motorBraked) {
      motor.material = materials.brake;
      cam.material = materials.brake;
    } else if (cycleState.motorRunning) {
      motor.material = materials.active;
      cam.material = materials.active;
    } else {
      motor.material = materials.motor;
      cam.material = materials.cam;
    }
  }

  setVisible(false);

  return {
    root,
    state,
    setVisible,
    update
  };
}
