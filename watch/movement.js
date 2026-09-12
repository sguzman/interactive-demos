import * as THREE from 'three';
import {
  box, caseRing, coil, disc, escapeWheel, gear, jewel, makeHand, pathTube,
  pinion, plateWithHoles, polygonPlate, ring, roundedPlate, screw,
  setShadows, shockSetting
} from './geometry.js';
import { createMaterials } from './materials.js';
import { ETA6497_2, LAYOUT, MILESTONE, PARTS } from './spec.js';

export const MODEL = {
  movement: ETA6497_2.caliber,
  movementDiameter: ETA6497_2.diameterMm,
  movementHeight: ETA6497_2.heightMm,
  frequencyHz: ETA6497_2.frequencyHz,
  beatsPerHour: ETA6497_2.alternationsPerHour,
  jewels: ETA6497_2.jewels,
  liftAngleDeg: ETA6497_2.liftAngleDeg,
  powerReserveMinHours: ETA6497_2.powerReserveMinHours,
  powerReserveTypicalHours: ETA6497_2.powerReserveTypicalHours,
  referenceWatch: '44 mm exhibition wristwatch / OP XI lineage reference shell',
  referenceCaseDiameter: 44,
  milestone: MILESTONE.id
};

function dialTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const c = 512;
  ctx.fillStyle = '#101216';
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.translate(c, c);
  ctx.strokeStyle = '#dfe3cf';
  ctx.fillStyle = '#e7ead8';
  ctx.lineCap = 'round';

  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2 - Math.PI / 2;
    const major = i % 5 === 0;
    const r1 = major ? 404 : 423;
    const r2 = 452;
    ctx.lineWidth = major ? 8 : 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
    ctx.stroke();
  }

  ctx.font = '700 126px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('12', 0, -330);
  ctx.fillText('3', 338, 0);
  ctx.fillText('6', 0, 336);

  // Small seconds at 9 o'clock in this wristwatch orientation.
  const sx = -302;
  const sy = 0;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sx, sy, 104, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2 - Math.PI / 2;
    const r1 = i % 5 === 0 ? 78 : 87;
    const r2 = 96;
    ctx.lineWidth = i % 5 === 0 ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1);
    ctx.lineTo(sx + Math.cos(a) * r2, sy + Math.sin(a) * r2);
    ctx.stroke();
  }

  ctx.font = '600 31px Arial, sans-serif';
  ctx.fillStyle = '#a8ada3';
  ctx.fillText('6497-2 REFERENCE', 70, 128);
  ctx.font = '500 22px Arial, sans-serif';
  ctx.fillStyle = '#777f78';
  ctx.fillText('21,600 A/h · MANUAL WIND', 70, 170);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addBridgeScrew(group, x, y, z, materials, radius = .31) {
  const s = screw({ radius, headHeight: .18, material: materials.blueSteel, slotMaterial: materials.darkSteel });
  s.position.set(x, y, z);
  group.add(s);
  return s;
}

function addBridgeJewel(group, x, y, z, materials, radius = .42) {
  const j = jewel({ radius, height: .18, material: materials.ruby });
  j.position.set(x, y, z);
  group.add(j);
  return j;
}

export function buildWatch() {
  const materials = createMaterials();
  const watch = new THREE.Group();
  watch.name = 'ETA 6497-2 reference watch';
  watch.rotation.x = -.08;

  const layers = new Map();
  const parts = [];
  const pickables = [];
  const animated = {};

  function layer(name) {
    if (!layers.has(name)) {
      const group = new THREE.Group();
      group.name = `layer:${name}`;
      group.userData.layer = name;
      layers.set(name, group);
      watch.add(group);
    }
    return layers.get(name);
  }

  function register(object, meta) {
    object.name = meta.name;
    object.userData.meta = meta;
    object.userData.basePosition = object.position.clone();
    object.userData.explodeDistance = meta.explodeDistance ?? 0;
    object.userData.explodeDirection = (meta.explodeDirection ?? new THREE.Vector3(0, 0, 1)).clone().normalize();
    setShadows(object, true);
    object.traverse(child => {
      if (!child.isMesh) return;
      child.userData.pickRoot = object;
      pickables.push(child);
    });
    layer(meta.layer).add(object);
    parts.push(object);
    return object;
  }

  const meta = (name, category, layerName, text, provenance, facts = {}, explodeDistance = 0, explodeDirection = new THREE.Vector3(0,0,1)) => ({
    name, category, layer: layerName, text, provenance, facts, explodeDistance, explodeDirection
  });

  // ---------------------------------------------------------------------------
  // Reference shell. It provides a wristwatch context but is deliberately less
  // exact than the movement reconstruction.
  // ---------------------------------------------------------------------------

  const straps = new THREE.Group();
  for (const side of [-1, 1]) {
    const strap = roundedPlate(24, 38, 3.2, 2.8, materials.leather, { bevelSize: .35, bevelThickness: .25 });
    strap.position.set(0, side * 39, -2.8);
    strap.rotation.z = side * .018;
    straps.add(strap);
    for (let i = -2; i <= 2; i++) {
      const stitchL = box(.34, 4.5, .12, materials.lume);
      stitchL.position.set(-9.3, side * 39 + i * 5.6, -1.33);
      straps.add(stitchL);
      const stitchR = stitchL.clone();
      stitchR.position.x = 9.3;
      straps.add(stitchR);
    }
  }
  register(straps, meta(
    '24 mm leather strap', 'Wearability', 'case',
    'A reference strap sized to the large 44 mm exhibition-case presentation.',
    'reference-derived', { 'Width': '24 mm', 'Role': 'presentation shell' }, 4, new THREE.Vector3(0, .9, -.22)
  ));

  const caseBody = new THREE.Group();
  const cushion = caseRing({ width: 44, height: 44, cornerRadius: 7.2, innerRadius: 20.25, depth: 5.9, material: materials.brushedSteel });
  cushion.position.z = -1.25;
  caseBody.add(cushion);
  const bezel = ring(20.0, 1.0, materials.caseSteel, 20, 160);
  bezel.position.z = 2.3;
  caseBody.add(bezel);
  const innerRehaut = ring(19.25, .36, materials.darkSteel, 12, 128);
  innerRehaut.position.z = 2.25;
  caseBody.add(innerRehaut);

  const crown = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 3.2, 40), materials.caseSteel);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(24.2, 0, -.55);
  crown.castShadow = crown.receiveShadow = true;
  caseBody.add(crown);
  const guardTop = roundedPlate(5.8, 3.5, 1.1, 3.1, materials.brushedSteel);
  guardTop.position.set(25.0, 4.1, -.4);
  caseBody.add(guardTop);
  const guardBottom = guardTop.clone();
  guardBottom.position.y = -4.1;
  caseBody.add(guardBottom);
  const lever = roundedPlate(2.0, 9.2, .8, 1.15, materials.caseSteel);
  lever.position.set(27.0, 0, 1.15);
  lever.rotation.z = -.08;
  caseBody.add(lever);

  register(caseBody, meta(
    '44 mm cushion case & crown guard', 'Case / protection', 'case',
    'A 44 mm exhibition-style wristwatch shell referencing the OP XI/Luminor lineage. The movement geometry is the stricter target.',
    'reference-derived', { 'Case target': '44 mm', 'Exact production case CAD': 'no' }, 5.5, new THREE.Vector3(.12, 0, -1)
  ));

  const crystal = new THREE.Group();
  const glass = disc(19.45, .72, materials.glass, 128);
  glass.position.z = 3.45;
  crystal.add(glass);
  const edge = ring(19.05, .22, materials.glass, 12, 144);
  edge.position.z = 3.45;
  crystal.add(edge);
  register(crystal, meta(
    'Front crystal', 'Case / protection', 'case',
    'Transparent front crystal. Thickness and curvature are presentation geometry.',
    'presentation', { 'Role': 'protect dial and hands' }, 18, new THREE.Vector3(0, 0, 1)
  ));

  const caseback = new THREE.Group();
  const backRing = ring(19.55, .9, materials.brushedSteel, 18, 144);
  backRing.position.z = -3.8;
  caseback.add(backRing);
  const backGlass = disc(16.9, .55, materials.glass, 128);
  backGlass.position.z = -3.8;
  caseback.add(backGlass);
  register(caseback, meta(
    'Exhibition caseback', 'Case / protection', 'case',
    'A transparent rear window keeps the hand-wound movement visible.',
    'reference-derived', { 'Window': 'transparent exhibition back' }, 20, new THREE.Vector3(0, 0, -1)
  ));

  // ---------------------------------------------------------------------------
  // Display and motion works
  // ---------------------------------------------------------------------------

  const dialMat = materials.dial.clone();
  dialMat.map = dialTexture();
  dialMat.needsUpdate = true;
  const dial = disc(19.25, .48, dialMat, 128);
  dial.position.z = 2.05;
  register(dial, meta(
    'Black reference dial', 'Display', 'display',
    'Procedural dial with 12/3/6 numerals and small seconds at 9. Branding is intentionally omitted.',
    'reference-derived', { 'Small seconds': '9 o’clock', 'Texture': 'procedural canvas' }, 13, new THREE.Vector3(0,0,1)
  ));

  const hands = new THREE.Group();
  const hour = makeHand({ length: 10.4, width: 1.05, depth: .16, tail: 1.7, material: materials.caseSteel, lumeMaterial: materials.lume });
  hour.rotation.z = -.75;
  hour.position.z = 2.42;
  const minute = makeHand({ length: 15.2, width: .72, depth: .14, tail: 2.0, material: materials.caseSteel, lumeMaterial: materials.lume });
  minute.rotation.z = 1.10;
  minute.position.z = 2.62;
  const seconds = makeHand({ length: 4.0, width: .16, depth: .10, tail: 1.2, material: materials.blueSteel });
  seconds.position.set(LAYOUT.secondWheel[0], LAYOUT.secondWheel[1], 2.66);
  hands.add(hour, minute, seconds);
  register(hands, meta(
    'Hour, minute & small-seconds hands', 'Display', 'display',
    'The visible output of the motion works. Small seconds is driven from the seconds/fourth wheel position.',
    'reference-derived', { 'Small seconds': '9 o’clock', 'Drive': 'second/fourth wheel' }, 15, new THREE.Vector3(0,0,1)
  ));
  animated.hourHand = hour;
  animated.minuteHand = minute;
  animated.secondsHand = seconds;

  const motion = new THREE.Group();
  const cannon = pinion({ radius: .92, teeth: 12, thickness: 1.0, material: materials.brushedSteel });
  cannon.position.z = 1.35;
  motion.add(cannon);
  const hourWheel = gear({ radius: 2.25, teeth: 36, thickness: .42, material: materials.brass, hubRadius: .78, spokeCount: 4, toothDepth: .25, toothWidth: .15 });
  hourWheel.position.z = 1.55;
  motion.add(hourWheel);
  register(motion, meta(
    'Driver cannon pinion & hour wheel', 'Motion works', 'motion',
    'The motion works reduce and distribute wheel-train output to the central minute and hour hands.',
    'reference-derived', { 'Driver cannon pinion': `ETA pos. ${PARTS.cannonPinion.etaPos}`, 'Hour wheel': `ETA pos. ${PARTS.hourWheel.etaPos}` }, 9, new THREE.Vector3(0,0,1)
  ));

  // Keyless works are now explicitly represented on the dial side. Their exact
  // outlines remain approximate, but the parts and causal relationships are real.
  const keyless = new THREE.Group();
  const windingPinion = pinion({ radius: .82, teeth: 12, thickness: .72, material: materials.brushedSteel });
  windingPinion.position.set(14.5, .1, .85);
  keyless.add(windingPinion);
  const slidingPinion = pinion({ radius: .96, teeth: 14, thickness: .78, material: materials.brushedSteel });
  slidingPinion.position.set(12.7, .15, .88);
  keyless.add(slidingPinion);
  const settingWheel = gear({ radius: 1.55, teeth: 22, thickness: .32, material: materials.brass, hubRadius: .38, spokeCount: 4, toothDepth: .18, toothWidth: .11 });
  settingWheel.position.set(10.4, -1.0, .9);
  keyless.add(settingWheel);
  const minuteWheel = gear({ radius: 1.9, teeth: 28, thickness: .34, material: materials.brass, hubRadius: .42, spokeCount: 4, toothDepth: .2, toothWidth: .12 });
  minuteWheel.position.set(7.4, -1.1, .92);
  keyless.add(minuteWheel);
  const yoke = polygonPlate([[11.0,1.4],[13.5,.9],[13.8,2.0],[11.5,2.8],[9.7,2.2]], .24, materials.brushedSteel, { bevelSize: .04, bevelThickness: .03, bevelSegments: 2 });
  yoke.position.z = 1.03;
  keyless.add(yoke);
  const settingLever = polygonPlate([[14.8,-2.2],[12.3,-2.4],[11.2,-3.7],[12.1,-4.5],[15.4,-3.4]], .24, materials.brushedSteel, { bevelSize: .04, bevelThickness: .03, bevelSegments: 2 });
  settingLever.position.z = 1.02;
  keyless.add(settingLever);
  register(keyless, meta(
    'Dial-side keyless & setting works', 'Winding / setting', 'winding',
    'Winding pinion, sliding pinion, setting wheel, minute wheel, yoke and setting lever make the crown a two-mode control: winding in one position and hand-setting in the other.',
    'reference-derived', { 'Winding pinion': 'ETA pos. 3 family', 'Sliding pinion': 'ETA pos. 4 family', 'Stem': 'ETA pos. 5 family', 'Geometry': 'M2 approximate outlines' }, 10, new THREE.Vector3(.2,-.03,1)
  ));

  // ---------------------------------------------------------------------------
  // Mainplate and bearings
  // ---------------------------------------------------------------------------

  const mainplate = new THREE.Group();
  const plate = disc(MODEL.movementDiameter / 2, 1.05, materials.plate, 160);
  plate.position.z = 0;
  mainplate.add(plate);
  const outerMachining = ring(17.25, .16, materials.brushedSteel, 10, 128);
  outerMachining.position.z = -.58;
  mainplate.add(outerMachining);
  const bridgeSideWell = disc(15.8, .08, materials.darkSteel, 144);
  bridgeSideWell.position.z = -.57;
  mainplate.add(bridgeSideWell);
  register(mainplate, meta(
    'Mainplate', 'Movement structure', 'structure',
    'Structural reference for the movement. The 36.60 mm diameter is official; internal milling and recesses are reconstructed for M2 readability.',
    'official', { 'ETA position': PARTS.mainplate.etaPos, 'Movement diameter': '36.60 mm', 'Movement height': '4.50 mm', 'Internal milling': 'reference-derived / approximate' }, 5.2, new THREE.Vector3(0,0,-1)
  ));

  const plateJewels = new THREE.Group();
  const lowerJewelPositions = [
    [LAYOUT.centerWheel[0], LAYOUT.centerWheel[1]],
    [LAYOUT.thirdWheel[0], LAYOUT.thirdWheel[1]],
    [LAYOUT.secondWheel[0], LAYOUT.secondWheel[1]],
    [LAYOUT.escapeWheel[0], LAYOUT.escapeWheel[1]],
    [LAYOUT.pallet[0], LAYOUT.pallet[1]],
    [LAYOUT.balance[0], LAYOUT.balance[1]]
  ];
  for (const [x, y] of lowerJewelPositions) {
    const j = jewel({ radius: .38, height: .22, material: materials.ruby });
    j.position.set(x, y, -.68);
    plateJewels.add(j);
  }
  register(plateJewels, meta(
    'Mainplate-side jewel bearings', 'Movement structure', 'structure',
    'Lower bearing jewels are aligned with the main train, pallet and balance pivots. The movement officially contains 17 jewels; M2 shows the mechanically legible set rather than claiming every jewel seat is fully reconstructed.',
    'reference-derived', { 'Official jewel count': '17', 'Shown on mainplate side': String(lowerJewelPositions.length) }, 6.2, new THREE.Vector3(0,0,-1)
  ));

  // ---------------------------------------------------------------------------
  // Power and winding
  // ---------------------------------------------------------------------------

  const barrel = new THREE.Group();
  const barrelDrum = disc(5.35, 1.25, materials.copper, 96);
  barrel.add(barrelDrum);
  const barrelLid = ring(4.55, .28, materials.gilt, 10, 96);
  barrelLid.position.z = .68;
  barrel.add(barrelLid);
  const spring = coil({ radius: 4.15, turns: 8, wire: .07, material: materials.blueSteel, innerRatio: .12 });
  spring.position.z = .74;
  barrel.add(spring);
  barrel.position.set(LAYOUT.barrel[0], LAYOUT.barrel[1], -.55);
  register(barrel, meta(
    'Mainspring barrel', 'Power storage', 'power',
    'The crown winds a coiled mainspring in the barrel. ETA specifies a 53 h minimum and 60 h typical power reserve for the current 6497-2 communication.',
    'reference-derived', { 'ETA position': PARTS.barrel.etaPos, 'Minimum reserve': `${MODEL.powerReserveMinHours} h`, 'Typical reserve': `${MODEL.powerReserveTypicalHours} h` }, 9.2, new THREE.Vector3(.2,.12,-1)
  ));
  animated.barrel = barrel;

  const winding = new THREE.Group();
  const ratchet = gear({ radius: 4.35, teeth: 44, thickness: .42, material: materials.brushedSteel, hubRadius: 1.0, spokeCount: 5, toothDepth: .34, toothWidth: .18 });
  ratchet.position.set(LAYOUT.barrel[0], LAYOUT.barrel[1], -1.55);
  winding.add(ratchet);
  const crownWheelRing = ring(2.15, .12, materials.darkSteel, 8, 72);
  crownWheelRing.position.set(LAYOUT.crownWheel[0], LAYOUT.crownWheel[1], -1.62);
  winding.add(crownWheelRing);
  const crownWheel = gear({ radius: 3.1, teeth: 34, thickness: .42, material: materials.brushedSteel, hubRadius: .75, spokeCount: 4, toothDepth: .3, toothWidth: .16 });
  crownWheel.position.set(LAYOUT.crownWheel[0], LAYOUT.crownWheel[1], -1.55);
  winding.add(crownWheel);
  const stem = pathTube([[18.0,0,-1.0],[14.8,0,-1.0],[12.5,1.2,-1.0]], .17, materials.brushedSteel, 50);
  winding.add(stem);
  const click = polygonPlate([[9.2,10.0],[10.8,9.2],[11.5,10.0],[10.1,11.0]], .26, materials.blueSteel, { bevelSize: .05, bevelThickness: .04, bevelSegments: 2 });
  click.position.z = -1.68;
  winding.add(click);
  const clickSpring = pathTube([[10.0,11.0,-1.69],[12.2,11.3,-1.69],[13.4,9.8,-1.69],[12.8,8.3,-1.69]], .09, materials.blueSteel, 44);
  winding.add(clickSpring);
  register(winding, meta(
    'Crown wheel, ratchet, click & click spring', 'Winding system', 'winding',
    'The bridge-side winding train transmits crown torque to the barrel arbor; the click and spring prevent reverse unwinding.',
    'reference-derived', { 'Crown wheel': `ETA pos. ${PARTS.crownWheel.etaPos}`, 'Crown wheel ring': `ETA pos. ${PARTS.crownWheelRing.etaPos}`, 'Click spring': `ETA pos. ${PARTS.clickSpring.etaPos}`, 'Click': `ETA pos. ${PARTS.click.etaPos}`, 'Ratchet': `ETA pos. ${PARTS.ratchetWheel.etaPos}` }, 10.5, new THREE.Vector3(.32,.05,-1)
  ));
  animated.ratchet = ratchet;
  animated.crownWheel = crownWheel;

  // ---------------------------------------------------------------------------
  // Wheel train. M2 improves tooth silhouette and explicit arbors but still does
  // not claim manufacturing tooth counts or centre distances.
  // ---------------------------------------------------------------------------

  const train = new THREE.Group();
  const centerWheel = gear({ radius: 4.25, teeth: 64, thickness: .46, material: materials.brass, hubMaterial: materials.brushedSteel, hubRadius: .75, spokeCount: 5, toothDepth: .32, toothWidth: .16 });
  centerWheel.position.set(LAYOUT.centerWheel[0], LAYOUT.centerWheel[1], -.72);
  train.add(centerWheel);
  const centerPinion = pinion({ radius: .82, teeth: 10, thickness: .8, material: materials.brushedSteel });
  centerPinion.position.set(LAYOUT.centerWheel[0], LAYOUT.centerWheel[1], -1.0);
  train.add(centerPinion);

  const thirdWheel = gear({ radius: 3.55, teeth: 60, thickness: .42, material: materials.gilt, hubMaterial: materials.brushedSteel, hubRadius: .62, spokeCount: 5, toothDepth: .28, toothWidth: .14 });
  thirdWheel.position.set(LAYOUT.thirdWheel[0], LAYOUT.thirdWheel[1], -.76);
  train.add(thirdWheel);
  const thirdPinion = pinion({ radius: .70, teeth: 10, thickness: .72, material: materials.brushedSteel });
  thirdPinion.position.set(LAYOUT.thirdWheel[0], LAYOUT.thirdWheel[1], -1.02);
  train.add(thirdPinion);

  const secondWheel = gear({ radius: 3.15, teeth: 56, thickness: .40, material: materials.brass, hubMaterial: materials.brushedSteel, hubRadius: .55, spokeCount: 5, toothDepth: .27, toothWidth: .13 });
  secondWheel.position.set(LAYOUT.secondWheel[0], LAYOUT.secondWheel[1], -.72);
  train.add(secondWheel);
  const secondPinion = pinion({ radius: .62, teeth: 9, thickness: .68, material: materials.brushedSteel });
  secondPinion.position.set(LAYOUT.secondWheel[0], LAYOUT.secondWheel[1], -1.0);
  train.add(secondPinion);

  const escape = escapeWheel({ radius: 2.35, teeth: 15, thickness: .34, material: materials.gilt, hubMaterial: materials.brushedSteel, hubRadius: .42, spokeCount: 5, toothDepth: .9, toothWidth: .2, hook: .24 });
  escape.position.set(LAYOUT.escapeWheel[0], LAYOUT.escapeWheel[1], -.7);
  train.add(escape);

  for (const [x,y] of [LAYOUT.centerWheel, LAYOUT.thirdWheel, LAYOUT.secondWheel, LAYOUT.escapeWheel]) {
    const arbor = disc(.16, 2.25, materials.brushedSteel, 24);
    arbor.position.set(x, y, -1.1);
    train.add(arbor);
  }

  register(train, meta(
    'Centre, third, seconds & escape wheels', 'Wheel train', 'train',
    'The train carries power from the barrel toward the escapement. M2 replaces rectangular-looking teeth with tapered profiles, gives the escape wheel visibly asymmetric teeth, and exposes the arbors.',
    'reference-derived', { 'Centre wheel': `ETA pos. ${PARTS.centerWheel.etaPos}`, 'Third wheel': `ETA pos. ${PARTS.thirdWheel.etaPos}`, 'Seconds wheel': `ETA pos. ${PARTS.secondWheel.etaPos}`, 'Escape wheel': `ETA pos. ${PARTS.escapeWheel.etaPos}`, 'Tooth counts': 'visual approximation in M2' }, 11.5, new THREE.Vector3(-.05,-.08,-1)
  ));
  Object.assign(animated, { centerWheel, thirdWheel, fourthWheel: secondWheel, escapeWheel: escape });

  // ---------------------------------------------------------------------------
  // Escapement and oscillator
  // ---------------------------------------------------------------------------

  const pallet = new THREE.Group();
  const forkBody = polygonPlate([[-.45,-2.6],[.45,-2.6],[.75,.65],[.34,2.25],[-.34,2.25],[-.75,.65]], .3, materials.brushedSteel, { bevelSize: .05, bevelThickness: .04, bevelSegments: 2 });
  pallet.add(forkBody);
  for (const x of [-.52, .52]) {
    const stone = roundedPlate(.42, 1.0, .12, .28, materials.ruby, { bevelSize: .04, bevelThickness: .03, bevelSegments: 2 });
    stone.position.set(x, 2.03, .05);
    stone.rotation.z = x < 0 ? -.16 : .16;
    pallet.add(stone);
  }
  pallet.position.set(LAYOUT.pallet[0], LAYOUT.pallet[1], -.45);
  pallet.rotation.z = -.22;
  register(pallet, meta(
    'Pallet fork & stones', 'Swiss lever escapement', 'escapement',
    'The pallet fork alternately locks and releases the escape wheel and passes impulses to the balance. Clearances are still enlarged for visibility.',
    'reference-derived', { 'ETA position': PARTS.palletFork.etaPos, 'Geometry': 'M2 visibility-biased' }, 13.2, new THREE.Vector3(-.08,-.18,-1)
  ));
  animated.pallet = pallet;

  const balance = new THREE.Group();
  balance.add(ring(4.05, .27, materials.gilt, 12, 128));
  balance.add(disc(.58, .46, materials.brushedSteel, 48));
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2;
    const spoke = box(.32, 3.45, .24, materials.gilt);
    spoke.position.set(Math.cos(a) * 1.8, Math.sin(a) * 1.8, 0);
    spoke.rotation.z = a - Math.PI / 2;
    balance.add(spoke);
  }
  const hairspring = coil({ radius: 3.15, turns: 7.5, wire: .045, material: materials.blueSteel, innerRatio: .10 });
  hairspring.position.z = .34;
  balance.add(hairspring);
  balance.position.set(LAYOUT.balance[0], LAYOUT.balance[1], -.22);
  register(balance, meta(
    'Balance wheel & hairspring', 'Oscillator / regulation', 'regulation',
    'The balance and hairspring form the oscillator. ETA specifies 3 Hz / 21,600 alternations per hour and a 44° typical lift angle.',
    'official', { 'ETA position': PARTS.balance.etaPos, 'Frequency': '3 Hz', 'Alternations': '21,600 A/h', 'Lift angle': '44°' }, 15, new THREE.Vector3(-.18,-.14,-1)
  ));
  animated.balance = balance;

  // ---------------------------------------------------------------------------
  // M2 bridges. They are now separate inspectable parts with correct official
  // screw counts and bridge-side jewel locations aligned to the pivots they hold.
  // Contours remain reference-derived rather than manufacturing CAD.
  // ---------------------------------------------------------------------------

  const barrelBridge = new THREE.Group();
  const barrelBridgePlate = plateWithHoles([
    [-1.7,4.8],[1.4,10.7],[8.6,11.4],[13.6,8.8],[15.0,5.2],[13.7,1.1],[9.7,-.1],[6.4,1.1],[3.7,.1],[-.9,.5]
  ], .74, materials.bridge, [
    [LAYOUT.centerWheel[0], LAYOUT.centerWheel[1], .58],
    [LAYOUT.barrel[0], LAYOUT.barrel[1], .72]
  ], { bevelSize: .18, bevelThickness: .12, bevelSegments: 3 });
  barrelBridgePlate.position.z = -2.28;
  barrelBridge.add(barrelBridgePlate);
  addBridgeJewel(barrelBridge, LAYOUT.centerWheel[0], LAYOUT.centerWheel[1], -2.7, materials, .44);
  const barrelScrews = [[1.5,8.8],[12.9,6.7],[2.0,1.1]];
  for (const [x,y] of barrelScrews) addBridgeScrew(barrelBridge, x, y, -2.73, materials);
  register(barrelBridge, meta(
    'Barrel bridge, jewelled', 'Movement structure', 'structure',
    'The barrel bridge supports the barrel/centre-wheel side of the movement. M2 uses the official three-screw count and a reference-derived broad bridge silhouette.',
    'reference-derived', { 'ETA position': PARTS.barrelBridge.etaPos, 'Official screw count': String(PARTS.barrelBridge.screws), 'Contour': 'reference-derived M2' }, 16.0, new THREE.Vector3(.08,.06,-1)
  ));

  const trainBridge = new THREE.Group();
  const trainBridgePlate = plateWithHoles([
    [1.4,3.4],[-2.8,4.4],[-7.7,3.0],[-13.5,1.5],[-15.1,-1.9],[-13.5,-4.8],[-9.1,-5.1],[-7.0,-3.6],[-3.7,-4.3],[-2.6,-8.1],[-4.7,-9.5],[-7.3,-9.2],[-8.6,-6.5],[-7.2,-2.8],[-2.6,-.2],[.9,.5]
  ], .74, materials.bridge, [
    [LAYOUT.thirdWheel[0], LAYOUT.thirdWheel[1], .54],
    [LAYOUT.secondWheel[0], LAYOUT.secondWheel[1], .54],
    [LAYOUT.escapeWheel[0], LAYOUT.escapeWheel[1], .48]
  ], { bevelSize: .18, bevelThickness: .12, bevelSegments: 3 });
  trainBridgePlate.position.z = -2.3;
  trainBridge.add(trainBridgePlate);
  addBridgeJewel(trainBridge, LAYOUT.thirdWheel[0], LAYOUT.thirdWheel[1], -2.72, materials, .42);
  addBridgeJewel(trainBridge, LAYOUT.secondWheel[0], LAYOUT.secondWheel[1], -2.72, materials, .42);
  addBridgeJewel(trainBridge, LAYOUT.escapeWheel[0], LAYOUT.escapeWheel[1], -2.72, materials, .38);
  for (const [x,y] of [[-2.3,3.0],[-12.7,-3.2]]) addBridgeScrew(trainBridge, x, y, -2.75, materials);
  register(trainBridge, meta(
    'Train wheel bridge, jewelled', 'Movement structure', 'structure',
    'The train bridge carries the upper pivots of the third, seconds and escape wheels. Teardown references show three visible jewels and two bridge screws.',
    'reference-derived', { 'ETA position': PARTS.trainBridge.etaPos, 'Official screw count': String(PARTS.trainBridge.screws), 'Visible supported pivots': 'third / seconds / escape' }, 16.8, new THREE.Vector3(-.02,.03,-1)
  ));

  const palletBridge = new THREE.Group();
  const palletBridgePlate = plateWithHoles([
    [-10.1,-11.6],[-9.5,-8.7],[-6.0,-8.2],[-4.5,-10.0],[-5.2,-12.0],[-8.2,-12.6]
  ], .68, materials.bridge, [[LAYOUT.pallet[0], LAYOUT.pallet[1], .42]], { bevelSize: .14, bevelThickness: .1, bevelSegments: 3 });
  palletBridgePlate.position.z = -2.28;
  palletBridge.add(palletBridgePlate);
  addBridgeJewel(palletBridge, LAYOUT.pallet[0], LAYOUT.pallet[1], -2.67, materials, .34);
  for (const [x,y] of [[-9.2,-10.8],[-5.4,-10.8]]) addBridgeScrew(palletBridge, x, y, -2.71, materials, .28);
  register(palletBridge, meta(
    'Pallet bridge, jewelled', 'Movement structure', 'structure',
    'The pallet bridge retains the upper pallet pivot. The 6497 family uses two screws here; M2 now models that explicitly.',
    'reference-derived', { 'ETA position': PARTS.palletBridge.etaPos, 'Official screw count': String(PARTS.palletBridge.screws) }, 17.2, new THREE.Vector3(-.08,-.08,-1)
  ));

  const balanceBridge = new THREE.Group();
  const balanceBridgePlate = plateWithHoles([
    [-16.2,-11.5],[-15.4,-7.4],[-13.4,-5.9],[-10.3,-5.7],[-7.6,-7.2],[-6.7,-10.2],[-8.2,-13.1],[-12.3,-13.7],[-15.4,-13.0]
  ], .72, materials.bridge, [[LAYOUT.balance[0], LAYOUT.balance[1], .86]], { bevelSize: .17, bevelThickness: .12, bevelSegments: 3 });
  balanceBridgePlate.position.z = -2.3;
  balanceBridge.add(balanceBridgePlate);
  const shock = shockSetting({ radius: .92, material: materials.brushedSteel, jewelMaterial: materials.ruby, springMaterial: materials.blueSteel });
  shock.position.set(LAYOUT.balance[0], LAYOUT.balance[1], -2.73);
  balanceBridge.add(shock);
  addBridgeScrew(balanceBridge, -14.6, -9.3, -2.74, materials);
  const regulator = pathTube([
    [LAYOUT.balance[0] + .3, LAYOUT.balance[1] + .2, -2.86],
    [-8.9,-7.3,-2.86],
    [-7.7,-6.7,-2.86]
  ], .11, materials.blueSteel, 42);
  balanceBridge.add(regulator);
  const regulatorPointer = polygonPlate([[-8.2,-7.1],[-7.0,-6.6],[-7.9,-6.0]], .10, materials.blueSteel, { bevel: false });
  regulatorPointer.position.z = -2.86;
  balanceBridge.add(regulatorPointer);
  register(balanceBridge, meta(
    'Balance bridge, shock setting & regulator', 'Oscillator / regulation', 'regulation',
    'The balance bridge now carries a visible shock setting plus an ETACHRON-style regulator indication. The bridge uses the official one-screw retention pattern.',
    'reference-derived', { 'ETA position': PARTS.balanceBridge.etaPos, 'Official screw count': String(PARTS.balanceBridge.screws), 'Regulator': ETA6497_2.regulator, 'Shock setting': 'schematic Incabloc-style presentation' }, 18.0, new THREE.Vector3(-.12,-.06,-1)
  ));

  // Dial-side screws provide hard-light relief and mark future exact placement work.
  const dialSideScrews = new THREE.Group();
  for (const [x,y] of [[12,8],[13,-6],[-12,7],[-13,-7]]) {
    const s = screw({ radius: .29, headHeight: .16, material: materials.blueSteel, slotMaterial: materials.darkSteel });
    s.position.set(x,y,.72);
    dialSideScrews.add(s);
  }
  register(dialSideScrews, meta(
    'Dial-side movement screws', 'Movement structure', 'structure',
    'These screws remain presentation/reference geometry and are not yet asserted as exact production locations.',
    'presentation', { 'Purpose': 'surface readability / future placement target' }, 7, new THREE.Vector3(0,0,1)
  ));

  return { watch, layers, parts, pickables, animated, materials };
}
