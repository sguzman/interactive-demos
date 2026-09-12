import * as THREE from 'three';
import {
  box, caseRing, coil, disc, gear, jewel, makeHand, pathTube,
  pinion, polygonPlate, ring, roundedPlate, screw, setShadows
} from './geometry.js';
import { createMaterials } from './materials.js';

export const MODEL = {
  movement: 'ETA / Unitas 6497-2',
  movementDiameter: 36.6,
  movementHeight: 4.5,
  frequencyHz: 3,
  beatsPerHour: 21600,
  jewels: 17,
  referenceWatch: 'Panerai Luminor Marina PAM00111 / OP XI lineage',
  referenceCaseDiameter: 44
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

  // Small-seconds register at 9 o'clock, matching the 6497 wristwatch orientation.
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
  // Reference shell — 44 mm exhibition watch, deliberately separate from the
  // stricter movement target. Geometry is reference-derived/presentation-grade.
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
    'A reference 24 mm leather strap sized to the large 44 mm exhibition-case presentation.',
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

  // Crown and a simplified bridge/lever silhouette inspired by Luminor architecture.
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
    'A 44 mm exhibition-style wristwatch shell referencing the Luminor/OP XI lineage. The movement geometry is the stricter target; this shell is intentionally reference-derived.',
    'reference-derived', { 'Case target': '44 mm', 'Material reference': '316L-style steel', 'Exact PAM case CAD': 'no' }, 5.5, new THREE.Vector3(.12, 0, -1)
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
    'Transparent front crystal. Thickness and curvature are presentation geometry rather than a measured production crystal.',
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
    'A transparent rear window keeps the large hand-wound movement visible, matching the educational purpose of the reference shell.',
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
    'A procedural dial using the large 12/3/6 + small-seconds-at-9 layout associated with 6497-based Luminor Marina watches. Branding is intentionally omitted.',
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
  seconds.position.set(-11.35, 0, 2.66);
  hands.add(hour, minute, seconds);
  register(hands, meta(
    'Hour, minute & small-seconds hands', 'Display', 'display',
    'The visible output of the motion works. The small-seconds hand is placed at 9 o’clock in the wristwatch orientation of the 6497 lineage.',
    'reference-derived', { 'Small seconds': '9 o’clock', 'Drive': 'fourth/seconds wheel' }, 15, new THREE.Vector3(0,0,1)
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
    'Cannon pinion & hour wheel', 'Motion works', 'motion',
    'The motion works reduce and distribute the wheel-train output so the central hands indicate minutes and hours.',
    'reference-derived', { 'Components': 'cannon pinion + hour wheel', 'ETA references': '31.080 / 31.046 family' }, 9, new THREE.Vector3(0,0,1)
  ));

  // ---------------------------------------------------------------------------
  // Mainplate and bearings — dimensions anchored to official ETA movement size.
  // ---------------------------------------------------------------------------

  const mainplate = new THREE.Group();
  const plate = disc(MODEL.movementDiameter / 2, 1.05, materials.plate, 160);
  plate.position.z = 0;
  mainplate.add(plate);
  mainplate.add(ring(17.25, .16, materials.brushedSteel, 10, 128));
  register(mainplate, meta(
    'Mainplate', 'Movement structure', 'structure',
    'Structural reference for the movement. Its outer diameter is anchored to ETA’s official 36.60 mm specification; internal cut-outs and holes remain simplified.',
    'official', { 'Movement diameter': '36.60 mm', 'Movement height': '4.50 mm', 'Internal geometry': 'approximate' }, 5.2, new THREE.Vector3(0,0,-1)
  ));

  const jewels = new THREE.Group();
  const jewelPositions = [
    [-7.8, -7.1], [-3.0, -1.4], [2.0, 2.1], [6.9, 1.5], [9.0, -3.5], [1.8, -8.1],
    [-11.0, .2], [6.2, 7.2]
  ];
  for (const [x, y] of jewelPositions) {
    const j = jewel({ radius: .38, height: .22, material: materials.ruby });
    j.position.set(x, y, -.78);
    jewels.add(j);
  }
  register(jewels, meta(
    'Visible jewel bearings', 'Movement structure', 'structure',
    'Synthetic ruby bearing locations are shown to explain pivot support and friction control. The movement has 17 jewels officially; only visually useful bearings are modeled individually in M1.',
    'official', { 'Official jewel count': '17', 'Individually shown': String(jewelPositions.length) }, 6.2, new THREE.Vector3(0,0,-1)
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
  barrel.position.set(6.7, 6.4, -.55);
  register(barrel, meta(
    'Mainspring barrel', 'Power storage', 'power',
    'The crown winds a coiled mainspring in the barrel. Its stored elastic energy is the movement’s power source.',
    'reference-derived', { 'ETA part family': '20.010', 'Energy source': 'coiled mainspring' }, 9.2, new THREE.Vector3(.2,.12,-1)
  ));
  animated.barrel = barrel;

  const winding = new THREE.Group();
  const ratchet = gear({ radius: 4.35, teeth: 44, thickness: .42, material: materials.brushedSteel, hubRadius: 1.0, spokeCount: 5, toothDepth: .34, toothWidth: .18 });
  ratchet.position.set(6.7, 6.4, -1.55);
  winding.add(ratchet);
  const crownWheel = gear({ radius: 3.1, teeth: 34, thickness: .42, material: materials.brushedSteel, hubRadius: .75, spokeCount: 4, toothDepth: .3, toothWidth: .16 });
  crownWheel.position.set(12.2, 4.0, -1.55);
  winding.add(crownWheel);
  const stem = pathTube([[18.0,0,-1.0],[14.8,0,-1.0],[12.5,1.2,-1.0]], .17, materials.brushedSteel, 50);
  winding.add(stem);
  const click = polygonPlate([[9.2,10.0],[10.8,9.2],[11.5,10.0],[10.1,11.0]], .26, materials.blueSteel, { bevelSize: .05, bevelThickness: .04, bevelSegments: 2 });
  click.position.z = -1.68;
  winding.add(click);
  register(winding, meta(
    'Crown wheel, ratchet & click', 'Winding system', 'winding',
    'The winding train transmits crown rotation to the mainspring arbor. The click prevents reverse unwinding through the crown.',
    'reference-derived', { 'Crown wheel family': '31.023', 'Ratchet wheel family': '31.020', 'Click family': '51.120' }, 10.5, new THREE.Vector3(.32,.05,-1)
  ));
  animated.ratchet = ratchet;
  animated.crownWheel = crownWheel;

  // ---------------------------------------------------------------------------
  // Wheel train — deliberately more explicit than the old generic cluster.
  // Positions are reference-derived, not manufacturing coordinates.
  // ---------------------------------------------------------------------------

  const train = new THREE.Group();
  const centerWheel = gear({ radius: 4.25, teeth: 64, thickness: .46, material: materials.brass, hubMaterial: materials.brushedSteel, hubRadius: .75, spokeCount: 5, toothDepth: .32, toothWidth: .16 });
  centerWheel.position.set(0.1, 2.2, -.72);
  train.add(centerWheel);
  const centerPinion = pinion({ radius: .82, teeth: 10, thickness: .8, material: materials.brushedSteel });
  centerPinion.position.set(.1, 2.2, -1.0);
  train.add(centerPinion);

  const thirdWheel = gear({ radius: 3.55, teeth: 60, thickness: .42, material: materials.gilt, hubMaterial: materials.brushedSteel, hubRadius: .62, spokeCount: 5, toothDepth: .28, toothWidth: .14 });
  thirdWheel.position.set(-5.4, -1.2, -.76);
  train.add(thirdWheel);
  const thirdPinion = pinion({ radius: .70, teeth: 10, thickness: .72, material: materials.brushedSteel });
  thirdPinion.position.set(-5.4, -1.2, -1.02);
  train.add(thirdPinion);

  const fourthWheel = gear({ radius: 3.15, teeth: 56, thickness: .40, material: materials.brass, hubMaterial: materials.brushedSteel, hubRadius: .55, spokeCount: 5, toothDepth: .27, toothWidth: .13 });
  fourthWheel.position.set(-11.25, .0, -.72);
  train.add(fourthWheel);
  const fourthPinion = pinion({ radius: .62, teeth: 9, thickness: .68, material: materials.brushedSteel });
  fourthPinion.position.set(-11.25, 0, -1.0);
  train.add(fourthPinion);

  const escapeWheel = gear({ radius: 2.25, teeth: 15, thickness: .34, material: materials.gilt, hubMaterial: materials.brushedSteel, hubRadius: .42, spokeCount: 5, toothDepth: .62, toothWidth: .14 });
  escapeWheel.position.set(-5.4, -7.2, -.7);
  train.add(escapeWheel);

  register(train, meta(
    'Centre, third, fourth & escape wheels', 'Wheel train', 'train',
    'The wheel train carries power from the barrel toward the escapement while establishing the timekeeping ratios. The fourth/seconds wheel aligns with the small-seconds display in this reference orientation.',
    'reference-derived', { 'Centre wheel': '30.015 family', 'Third wheel': '30.025 family', 'Seconds/fourth wheel': '30.027.13 family', 'Escape wheel': '30.040 family' }, 11.5, new THREE.Vector3(-.05,-.08,-1)
  ));
  Object.assign(animated, { centerWheel, thirdWheel, fourthWheel, escapeWheel });

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
  pallet.position.set(-7.2, -10.0, -.45);
  pallet.rotation.z = -.22;
  register(pallet, meta(
    'Pallet fork & stones', 'Swiss lever escapement', 'escapement',
    'The pallet fork alternately locks and releases the escape wheel and passes impulses to the balance. M1 exaggerates clearances so the interaction remains visible.',
    'reference-derived', { 'ETA pallet fork family': '40.010', 'Geometry': 'visibility-biased' }, 13.2, new THREE.Vector3(-.08,-.18,-1)
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
  balance.position.set(-10.1, -9.4, -.22);
  register(balance, meta(
    'Balance wheel & hairspring', 'Oscillator / regulation', 'regulation',
    'The balance and hairspring form the oscillator. ETA specifies 3 Hz / 21,600 alternations per hour for the 6497-2.',
    'official', { 'Frequency': '3 Hz', 'Alternations': '21,600 A/h', 'Lift angle': '44° (ETA technical communication)' }, 15, new THREE.Vector3(-.18,-.14,-1)
  ));
  animated.balance = balance;

  // ---------------------------------------------------------------------------
  // Bridges and screws. Silhouettes are intentionally reference-derived M1.
  // ---------------------------------------------------------------------------

  const bridges = new THREE.Group();
  const barrelBridge = polygonPlate([
    [2.1,10.9],[11.2,10.0],[15.1,6.7],[14.1,1.5],[10.6,.4],[7.4,2.2],[3.1,3.7]
  ], .72, materials.bridge, { bevelSize: .18, bevelThickness: .12, bevelSegments: 3 });
  barrelBridge.position.z = -2.28;
  bridges.add(barrelBridge);

  const trainBridge = polygonPlate([
    [-1.3,5.5],[-6.2,4.7],[-13.7,1.3],[-14.9,-4.0],[-10.0,-5.1],[-5.3,-3.0],[-.5,-.5],[2.1,2.6]
  ], .72, materials.bridge, { bevelSize: .18, bevelThickness: .12, bevelSegments: 3 });
  trainBridge.position.z = -2.3;
  bridges.add(trainBridge);

  const palletBridge = roundedPlate(5.7, 2.6, .7, .65, materials.bridge, { bevelSize: .15, bevelThickness: .1, bevelSegments: 3 });
  palletBridge.position.set(-7.0, -10.2, -2.25);
  palletBridge.rotation.z = -.12;
  bridges.add(palletBridge);

  const balanceCock = polygonPlate([
    [-15.0,-11.4],[-8.3,-13.1],[-5.5,-11.4],[-7.1,-8.0],[-12.2,-6.9],[-15.7,-8.3]
  ], .72, materials.bridge, { bevelSize: .18, bevelThickness: .12, bevelSegments: 3 });
  balanceCock.position.z = -2.32;
  bridges.add(balanceCock);

  const screwPositions = [[6.0,9.1],[12.1,5.0],[-2.8,4.2],[-12.4,-1.2],[-6.4,-9.9],[-12.6,-9.2]];
  for (const [x,y] of screwPositions) {
    const s = screw({ radius: .31, headHeight: .18, material: materials.blueSteel, slotMaterial: materials.darkSteel });
    s.position.set(x,y,-2.72);
    bridges.add(s);
  }

  register(bridges, meta(
    'Barrel bridge, train bridge, pallet bridge & balance cock', 'Movement structure', 'structure',
    'M1 bridge silhouettes are reconstructed from the characteristic 6497 family layout. Exact bridge contours, engraving, striping, screw seats, and machining remain targets for later milestones.',
    'reference-derived', { 'Fidelity': 'M1 silhouette', 'Future': 'reference-derived contour refinement' }, 16.5, new THREE.Vector3(.05,.05,-1)
  ));

  // A few exposed screws on the dial-side plate provide useful hard-light relief.
  const dialSideScrews = new THREE.Group();
  for (const [x,y] of [[12,8],[13,-6],[-12,7],[-13,-7]]) {
    const s = screw({ radius: .29, headHeight: .16, material: materials.blueSteel, slotMaterial: materials.darkSteel });
    s.position.set(x,y,.72);
    dialSideScrews.add(s);
  }
  register(dialSideScrews, meta(
    'Movement screws', 'Movement structure', 'structure',
    'Blued screw heads are used as a visual reference to the decorated 6497/OP XI lineage; their exact locations are partly presentational in M1.',
    'presentation', { 'Purpose': 'surface readability / future placement target' }, 7, new THREE.Vector3(0,0,1)
  ));

  return { watch, layers, parts, pickables, animated, materials };
}
