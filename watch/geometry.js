import * as THREE from 'three';

export const mm = value => value;

export function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function setShadows(object, enabled = true) {
  object.traverse(child => {
    if (!child.isMesh) return;
    child.castShadow = enabled;
    child.receiveShadow = enabled;
  });
  return object;
}

export function disc(radius, height, material, segments = 96) {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  return shadowed(mesh);
}

export function ring(radius, tube, material, radialSegments = 16, tubularSegments = 128) {
  return shadowed(new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments),
    material
  ));
}

export function box(width, height, depth, material) {
  return shadowed(new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material));
}

export function roundedRectShape(width, height, radius) {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const s = new THREE.Shape();
  s.moveTo(-w + r, -h);
  s.lineTo(w - r, -h);
  s.quadraticCurveTo(w, -h, w, -h + r);
  s.lineTo(w, h - r);
  s.quadraticCurveTo(w, h, w - r, h);
  s.lineTo(-w + r, h);
  s.quadraticCurveTo(-w, h, -w, h - r);
  s.lineTo(-w, -h + r);
  s.quadraticCurveTo(-w, -h, -w + r, -h);
  return s;
}

export function extrudeShape(shape, depth, material, {
  bevel = true,
  bevelSize = 0.16,
  bevelThickness = 0.12,
  bevelSegments = 3
} = {}) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: bevel,
    bevelSize,
    bevelThickness,
    bevelSegments
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return shadowed(new THREE.Mesh(geometry, material));
}

export function roundedPlate(width, height, radius, depth, material, options = {}) {
  return extrudeShape(roundedRectShape(width, height, radius), depth, material, options);
}

export function caseRing({ width, height, cornerRadius, innerRadius, depth, material }) {
  const shape = roundedRectShape(width, height, cornerRadius);
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return extrudeShape(shape, depth, material, {
    bevel: true,
    bevelSize: 0.28,
    bevelThickness: 0.2,
    bevelSegments: 4
  });
}

export function polygonPlate(points, depth, material, options = {}) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();
  return extrudeShape(shape, depth, material, options);
}

export function gear({
  radius,
  teeth,
  thickness,
  material,
  hubMaterial = material,
  hubRadius = Math.max(.48, radius * .16),
  spokeCount = 5,
  spokeWidth = .34,
  rimTube = Math.max(.18, radius * .085),
  toothDepth = Math.max(.28, radius * .14),
  toothWidth = Math.max(.18, radius * .06)
}) {
  const group = new THREE.Group();
  group.userData.geometryType = 'gear';

  group.add(ring(Math.max(.1, radius - rimTube * 1.35), rimTube, material, 10, Math.max(64, teeth * 3)));
  group.add(disc(hubRadius, thickness, hubMaterial, 48));

  const spokeLength = Math.max(.2, radius - hubRadius - rimTube * 2.2);
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const spoke = box(spokeWidth, spokeLength, thickness * .72, material);
    spoke.position.set(
      Math.cos(angle) * (hubRadius + spokeLength / 2),
      Math.sin(angle) * (hubRadius + spokeLength / 2),
      0
    );
    spoke.rotation.z = angle - Math.PI / 2;
    group.add(spoke);
  }

  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2;
    const tooth = box(toothWidth, toothDepth, thickness * .86, material);
    tooth.position.set(
      Math.cos(angle) * (radius + toothDepth * .15),
      Math.sin(angle) * (radius + toothDepth * .15),
      0
    );
    tooth.rotation.z = angle - Math.PI / 2;
    group.add(tooth);
  }

  return group;
}

export function pinion({ radius = .75, teeth = 10, thickness = .8, material }) {
  return gear({
    radius,
    teeth,
    thickness,
    material,
    hubRadius: radius * .36,
    spokeCount: 3,
    spokeWidth: .18,
    rimTube: .09,
    toothDepth: .2,
    toothWidth: .12
  });
}

export function screw({ radius = .24, headHeight = .16, material, slotMaterial }) {
  const group = new THREE.Group();
  const head = disc(radius, headHeight, material, 40);
  group.add(head);
  const slot = box(radius * 1.45, radius * .16, .055, slotMaterial);
  slot.position.z = headHeight * .62;
  group.add(slot);
  return group;
}

export function jewel({ radius = .34, height = .2, material }) {
  const group = new THREE.Group();
  const body = disc(radius, height, material, 48);
  group.add(body);
  const hole = ring(radius * .35, radius * .10, material, 8, 32);
  hole.position.z = height * .56;
  group.add(hole);
  return group;
}

export function coil({ radius = 2.6, turns = 7, wire = .055, material, innerRatio = .16 }) {
  const points = [];
  const steps = Math.max(220, Math.floor(turns * 44));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * Math.PI * 2 * turns;
    const r = radius * (1 - t * (1 - innerRatio));
    points.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return shadowed(new THREE.Mesh(
    new THREE.TubeGeometry(curve, steps * 2, wire, 6, false),
    material
  ));
}

export function pathTube(points, radius, material, tubularSegments = 96) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z = 0]) => new THREE.Vector3(x, y, z)));
  return shadowed(new THREE.Mesh(
    new THREE.TubeGeometry(curve, tubularSegments, radius, 8, false),
    material
  ));
}

export function makeHand({ length, width, depth = .13, tail = 1.1, material, lumeMaterial = null }) {
  const group = new THREE.Group();
  const blade = box(width, length, depth, material);
  blade.position.y = length * .36;
  group.add(blade);

  if (lumeMaterial) {
    const lume = box(width * .42, length * .58, depth * .45, lumeMaterial);
    lume.position.set(0, length * .38, depth * .65);
    group.add(lume);
  }

  const counter = box(width * .72, tail, depth, material);
  counter.position.y = -tail * .45;
  group.add(counter);
  group.add(disc(width * .78, depth * 1.2, material, 36));
  return group;
}
