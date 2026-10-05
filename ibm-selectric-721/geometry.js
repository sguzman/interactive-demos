import * as THREE from 'three';
import { CANONICAL, P4, COMPONENTS } from './spec.js';

const deg = THREE.MathUtils.degToRad;
const TYPE_BAND_LATITUDES_P4 = [-0.58, -0.20, 0.20, 0.58];
const TYPE_PRINT_FACING_OFFSET_DEG_P4 = 180;
const TYPE_SLUG_DEPTH_P4_MM = 1.35;
const TYPE_TOP_CAP_RADIUS_P4_MM = 13.4;
const TYPE_TOP_CAP_CENTER_Y_P4_MM = 14.0;

function typeBandNormalTiltRadP4(band) {
  const index = THREE.MathUtils.clamp(Math.round(Number(band) || 0), 0, TYPE_BAND_LATITUDES_P4.length - 1);
  const lat = TYPE_BAND_LATITUDES_P4[index];
  const bodyRadius = CANONICAL.typeElement.structuralRadiusP4Mm;
  const bodyYRadius = bodyRadius * 0.90;
  const y = lat * bodyYRadius;
  const radial = bodyRadius * Math.sqrt(Math.max(0, 1 - (y * y) / (bodyYRadius * bodyYRadius)));
  const normalY = y / (bodyYRadius * bodyYRadius);
  const normalZ = radial / (bodyRadius * bodyRadius);
  return Math.atan2(normalY, normalZ);
}

function typeSlugNormalP4(band, slot) {
  const bandIndex = THREE.MathUtils.clamp(Math.round(Number(band) || 0), 0, TYPE_BAND_LATITUDES_P4.length - 1);
  const slotIndex = ((Math.round(Number(slot) || 0) % CANONICAL.typeElement.positionsPerBand) + CANONICAL.typeElement.positionsPerBand) % CANONICAL.typeElement.positionsPerBand;
  const lat = TYPE_BAND_LATITUDES_P4[bandIndex];
  const bodyRadius = CANONICAL.typeElement.structuralRadiusP4Mm;
  const bodyYRadius = bodyRadius * 0.90;
  const y = lat * bodyYRadius;
  const radial = bodyRadius * Math.sqrt(Math.max(0, 1 - (y * y) / (bodyYRadius * bodyYRadius)));
  const a = slotIndex * Math.PI * 2 / CANONICAL.typeElement.positionsPerBand;
  return new THREE.Vector3(
    Math.sin(a) * radial / (bodyRadius * bodyRadius),
    y / (bodyYRadius * bodyYRadius),
    Math.cos(a) * radial / (bodyRadius * bodyRadius)
  ).normalize();
}

function typeSlugFaceCenterP4(band, slot) {
  const bandIndex = THREE.MathUtils.clamp(Math.round(Number(band) || 0), 0, TYPE_BAND_LATITUDES_P4.length - 1);
  const slotIndex = ((Math.round(Number(slot) || 0) % CANONICAL.typeElement.positionsPerBand) + CANONICAL.typeElement.positionsPerBand) % CANONICAL.typeElement.positionsPerBand;
  const lat = TYPE_BAND_LATITUDES_P4[bandIndex];
  const bodyRadius = CANONICAL.typeElement.structuralRadiusP4Mm;
  const bodyYRadius = bodyRadius * 0.90;
  const y = lat * bodyYRadius;
  const radial = bodyRadius * Math.sqrt(Math.max(0, 1 - (y * y) / (bodyYRadius * bodyYRadius)));
  const a = slotIndex * Math.PI * 2 / CANONICAL.typeElement.positionsPerBand;
  const surface = new THREE.Vector3(Math.sin(a) * radial, y, Math.cos(a) * radial);
  return surface.addScaledVector(typeSlugNormalP4(bandIndex, slotIndex), TYPE_SLUG_DEPTH_P4_MM * 0.5);
}

function material(color, metalness = 0.12, roughness = 0.68) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

function box(w, h, d, mat, name) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function radialToothedWheelGeometryP4(baseRadius, toothDepth, width, teeth) {
  const points = Math.max(6, Math.round(teeth) * 2);
  const vertices = [];
  const indices = [];

  for (const y of [-width / 2, width / 2]) {
    for (let i = 0; i < points; i += 1) {
      const angle = i * Math.PI * 2 / points;
      const radius = baseRadius + (i % 2 ? toothDepth : 0);
      vertices.push(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
    }
  }

  const lowerCenter = vertices.length / 3;
  vertices.push(0, -width / 2, 0);
  const upperCenter = vertices.length / 3;
  vertices.push(0, width / 2, 0);

  for (let i = 0; i < points; i += 1) {
    const next = (i + 1) % points;
    const lower = i;
    const upper = points + i;
    const lowerNext = next;
    const upperNext = points + next;
    indices.push(lowerCenter, lower, lowerNext);
    indices.push(upperCenter, upperNext, upper);
    indices.push(lower, upper, upperNext, lower, upperNext, lowerNext);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData.p4ToothedWheel = {
    presentationTeethP4: teeth,
    baseRadiusMmP4: baseRadius,
    toothDepthMmP4: toothDepth,
    class: 'P4 alternating-radius toothed ratchet wheel; exact ribbon-ratchet tooth count/profile unresolved'
  };
  return geometry;
}

function ratchetToothGeometryP4(axialWidth, radialHeight, tangentialWidth) {
  const hx = axialWidth / 2;
  const hy = radialHeight / 2;
  const hz = tangentialWidth / 2;

  // Asymmetric Y/Z section: broad root and a narrower forward-skewed tip. Exact IBM tooth
  // pressure/flank geometry remains unresolved, so this is an explicit P4 mechanical silhouette.
  const section = [
    [-hy, -hz],
    [-hy,  hz],
    [ hy,  hz * 0.38],
    [ hy, -hz * 0.12]
  ];
  const vertices = [];
  for (const x of [-hx, hx]) {
    section.forEach(([y,z]) => vertices.push(x,y,z));
  }
  const indices = [
    0,2,1, 0,3,2,
    4,5,6, 4,6,7,
    0,1,5, 0,5,4,
    1,2,6, 1,6,5,
    2,3,7, 2,7,6,
    3,0,4, 3,4,7
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData.p4RatchetToothClass = 'asymmetric tapered P4 ratchet tooth; exact production flank/profile unresolved';
  return geometry;
}

function carrierSidePlateGeometryP4(thickness, height, depth) {
  const halfH = height / 2;
  const halfD = depth / 2;
  const shape = new THREE.Shape();

  // Shape x maps to -Z after rotation; the chamfered outline reads as a cast/stamped frame
  // rather than the previous solid cuboid wall.
  shape.moveTo(-halfD + 2.5, -halfH);
  shape.lineTo( halfD - 2.5, -halfH);
  shape.lineTo( halfD, -halfH + 2.5);
  shape.lineTo( halfD,  halfH - 3.5);
  shape.lineTo( halfD - 4.0, halfH);
  shape.lineTo(-halfD + 4.0, halfH);
  shape.lineTo(-halfD, halfH - 3.5);
  shape.lineTo(-halfD, -halfH + 2.5);
  shape.closePath();

  const window = new THREE.Path();
  const windowHalfD = Math.max(5, halfD - 7.0);
  const windowHalfH = Math.max(3, halfH - 5.0);
  window.moveTo(-windowHalfD, -windowHalfH + 1.0);
  window.lineTo(-windowHalfD + 1.5, -windowHalfH);
  window.lineTo( windowHalfD - 1.5, -windowHalfH);
  window.lineTo( windowHalfD, -windowHalfH + 1.0);
  window.lineTo( windowHalfD,  windowHalfH - 1.0);
  window.lineTo( windowHalfD - 1.5, windowHalfH);
  window.lineTo(-windowHalfD + 1.5, windowHalfH);
  window.lineTo(-windowHalfD, windowHalfH - 1.0);
  window.closePath();
  shape.holes.push(window);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.45,
    bevelSize: 0.45,
    bevelSegments: 2,
    curveSegments: 2
  });
  geometry.rotateY(Math.PI / 2);
  geometry.translate(-thickness / 2, 0, 0);
  geometry.computeVertexNormals();
  geometry.userData.p4CarrierPlateClass = 'windowed chamfered P4 carrier side frame; exact cast/stamped section unresolved';
  return geometry;
}

function primarySideframeGeometryP4(thickness, height, depth) {
  const halfH = height / 2;
  const halfD = depth / 2;
  const shape = new THREE.Shape();

  // P4 cast-frame silhouette. The large former cuboid side wall is opened around two
  // explicit bearing webs: one for the lower cycle/operational shaft zone and one for D6.
  shape.moveTo(-halfD + 5, -halfH);
  shape.lineTo( halfD - 5, -halfH);
  shape.lineTo( halfD, -halfH + 5);
  shape.lineTo( halfD,  halfH - 8);
  shape.lineTo( halfD - 8, halfH);
  shape.lineTo(-halfD + 9, halfH);
  shape.lineTo(-halfD, halfH - 8);
  shape.lineTo(-halfD, -halfH + 5);
  shape.closePath();

  const windowRanges = [
    [-74, -60],
    [-26, 8],
    [31, 74]
  ];
  const windowBottom = -45;
  const windowTop = 45;
  const chamfer = 3.0;
  for (const [left, right] of windowRanges) {
    const window = new THREE.Path();
    window.moveTo(left + chamfer, windowBottom);
    window.lineTo(right - chamfer, windowBottom);
    window.lineTo(right, windowBottom + chamfer);
    window.lineTo(right, windowTop - chamfer);
    window.lineTo(right - chamfer, windowTop);
    window.lineTo(left + chamfer, windowTop);
    window.lineTo(left, windowTop - chamfer);
    window.lineTo(left, windowBottom + chamfer);
    window.closePath();
    shape.holes.push(window);
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.65,
    bevelSize: 0.65,
    bevelSegments: 2,
    curveSegments: 2
  });
  geometry.rotateY(Math.PI / 2);
  geometry.translate(-thickness / 2, 0, 0);
  geometry.computeVertexNormals();
  geometry.userData.p4PrimarySideframeClass =
    'three-window chamfered P4 primary sideframe with retained lower-shaft and D6 bearing webs; exact IBM casting apertures/section unresolved';
  geometry.userData.p4WindowCount = windowRanges.length;
  return geometry;
}

function keycapGeometryP4(width, height, depth) {
  const layers = [
    { y: -height / 2, w: width, d: depth },
    { y: height / 2 - 1.8, w: width * 0.94, d: depth * 0.93 },
    { y: height / 2, w: width * 0.84, d: depth * 0.82 }
  ];
  const vertices = [];
  const indices = [];

  layers.forEach(layer => {
    const hw = layer.w / 2;
    const hd = layer.d / 2;
    vertices.push(
      -hw, layer.y, -hd,
       hw, layer.y, -hd,
       hw, layer.y,  hd,
      -hw, layer.y,  hd
    );
  });

  // Bottom and top caps.
  indices.push(0, 1, 2, 0, 2, 3);
  indices.push(8, 10, 9, 8, 11, 10);

  // Tapered side walls and upper bevel.
  for (let layer = 0; layer < 2; layer += 1) {
    const a0 = layer * 4;
    const b0 = (layer + 1) * 4;
    for (let side = 0; side < 4; side += 1) {
      const next = (side + 1) % 4;
      const a = a0 + side;
      const an = a0 + next;
      const b = b0 + side;
      const bn = b0 + next;
      indices.push(a, b, bn, a, bn, an);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData.p4KeycapClass = 'tapered three-stage P4 keycap with beveled top land; exact Selectric keycap tooling unresolved';
  return geometry;
}

function shaft(length, radius, mat, name) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 28), mat);
  mesh.rotation.z = Math.PI / 2;
  mesh.name = name;
  mesh.castShadow = true;
  return mesh;
}

function pulley(radius, width, mat, name) {
  const mesh = shaft(width, radius, mat, name);
  return mesh;
}

function typeSlugGeometryP4(width, height, depth, bevelDepth = 0.30) {
  const shoulderZ = depth / 2 - bevelDepth;
  const layers = [
    { z: -depth / 2, w: width * 0.82, h: height * 0.80 },
    { z: shoulderZ, w: width, h: height },
    { z: depth / 2, w: width * 0.86, h: height * 0.84 }
  ];
  const vertices = [];
  const indices = [];

  layers.forEach(layer => {
    const hw = layer.w / 2;
    const hh = layer.h / 2;
    vertices.push(
      -hw, -hh, layer.z,
       hw, -hh, layer.z,
       hw,  hh, layer.z,
      -hw,  hh, layer.z
    );
  });

  // Back and face caps.
  indices.push(0, 2, 1, 0, 3, 2);
  indices.push(8, 9, 10, 8, 10, 11);

  // Connect back -> shoulder and shoulder -> face as two beveled side bands.
  for (let layer = 0; layer < 2; layer += 1) {
    const a0 = layer * 4;
    const b0 = (layer + 1) * 4;
    for (let side = 0; side < 4; side += 1) {
      const next = (side + 1) % 4;
      const a = a0 + side;
      const an = a0 + next;
      const b = b0 + side;
      const bn = b0 + next;
      indices.push(a, an, bn, a, bn, b);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData.p4SlugSection = {
    widthMmP4: width,
    heightMmP4: height,
    depthMmP4: depth,
    bevelDepthMmP4: bevelDepth,
    class: 'three-stage P4 pedestal/shoulder/face land; exact glyph face and production slug section unresolved'
  };
  return geometry;
}

function wrappedCamDeltaP4(angle, center) {
  let delta = angle - center;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function camRadiusAtP4(baseRadius, lobes, angle) {
  let radius = baseRadius;
  lobes.forEach(lobe => {
    const halfWidth = Math.max(0.08, lobe.halfWidthRad);
    const delta = Math.abs(wrappedCamDeltaP4(angle, lobe.angleRad));
    if (delta >= halfWidth) return;
    const phase = delta / halfWidth;
    const window = Math.cos(phase * Math.PI / 2);
    const contribution = lobe.liftMm * Math.pow(Math.max(0, window), lobe.sharpness ?? 2.4);
    radius = Math.max(radius, baseRadius + contribution);
  });
  return radius;
}

function camProfileP4(width, baseRadius, lobes, mat, name, segments = 72) {
  const vertices = [];
  const indices = [];
  const sideXs = [-width / 2, width / 2];

  sideXs.forEach(x => {
    for (let i = 0; i < segments; i += 1) {
      const angle = i * Math.PI * 2 / segments;
      const radius = camRadiusAtP4(baseRadius, lobes, angle);
      vertices.push(x, Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
  });

  const leftCenter = vertices.length / 3;
  vertices.push(-width / 2, 0, 0);
  const rightCenter = vertices.length / 3;
  vertices.push(width / 2, 0, 0);

  for (let i = 0; i < segments; i += 1) {
    const next = (i + 1) % segments;
    const left = i;
    const leftNext = next;
    const right = segments + i;
    const rightNext = segments + next;

    indices.push(leftCenter, leftNext, left);
    indices.push(rightCenter, right, rightNext);
    indices.push(left, leftNext, rightNext, left, rightNext, right);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.p4CamProfile = {
    baseRadius,
    lobes: lobes.map(lobe => ({
      angleDegP4: THREE.MathUtils.radToDeg(lobe.angleRad),
      liftMmP4: lobe.liftMm,
      halfWidthDegP4: THREE.MathUtils.radToDeg(lobe.halfWidthRad)
    }))
  };
  return mesh;
}

function addPickable(mesh, component, pickables) {
  mesh.userData.component = component;
  pickables.push(mesh);
  return mesh;
}

function makeAssembly(name, explodeVector) {
  const root = new THREE.Group();
  root.name = name;
  root.userData.basePosition = new THREE.Vector3();
  root.userData.explodeVector = explodeVector.clone();
  return root;
}

function setAssemblyExplosion(group, amount) {
  group.position.copy(group.userData.basePosition).addScaledVector(group.userData.explodeVector, amount);
}

function loftPrism(stations, mat, name) {
  const vertices = [];
  const indices = [];
  for (const station of stations) {
    vertices.push(
      -station.halfWidth, station.bottomY, station.z,
       station.halfWidth, station.bottomY, station.z,
       station.halfWidth, station.topY, station.z,
      -station.halfWidth, station.topY, station.z
    );
  }
  const quad = (a,b,c,d) => indices.push(a,b,c, a,c,d);
  for (let i = 0; i < stations.length - 1; i += 1) {
    const a = i * 4, b = (i + 1) * 4;
    quad(a, b, b+1, a+1);
    quad(a+1, b+1, b+2, a+2);
    quad(a+2, b+2, b+3, a+3);
    quad(a+3, b+3, b, a);
  }
  quad(0,1,2,3);
  const e = (stations.length - 1) * 4;
  quad(e+3,e+2,e+1,e);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const loftMat = mat.clone();
  loftMat.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(geometry, loftMat);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function extrudedSideCheek(profile, innerX, outerX, mat, name) {
  const shape = new THREE.Shape();
  profile.forEach((point, index) => {
    const localX = -point.z;
    if (index === 0) shape.moveTo(localX, point.y);
    else shape.lineTo(localX, point.y);
  });
  shape.closePath();
  const thickness = outerX - innerX;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 1.8,
    bevelSize: 1.8,
    bevelSegments: 3,
    curveSegments: 3
  });
  geometry.rotateY(Math.PI / 2);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function dynamicTube(color, radius, name, component, pickables) {
  const mesh = new THREE.Mesh(
    new THREE.BufferGeometry(),
    material(color, 0.05, 0.54)
  );
  mesh.name = name;
  mesh.userData.component = component;
  mesh.castShadow = true;
  pickables.push(mesh);
  return {
    mesh,
    update(points) {
      const old = mesh.geometry;
      mesh.geometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5),
        72,
        radius,
        8,
        false
      );
      old.dispose();
    }
  };
}

function pointCircleTangentYZP4(point, center, radius, side = -1) {
  const dy = point.y - center.y;
  const dz = point.z - center.z;
  const d2 = dy * dy + dz * dz;
  if (d2 <= radius * radius) {
    throw new Error('P4 point-to-pulley tangent requires the point outside the pulley projection');
  }
  const a = radius * radius / d2;
  const b = radius * Math.sqrt(d2 - radius * radius) / d2;
  return new THREE.Vector3(
    center.x,
    center.y + a * dy + side * b * (-dz),
    center.z + a * dz + side * b * dy
  );
}

function externalCircleTangentYZP4(centerA, radiusA, centerB, radiusB, side = -1) {
  const dy = centerB.y - centerA.y;
  const dz = centerB.z - centerA.z;
  const distance = Math.hypot(dy, dz);
  if (distance <= Math.abs(radiusA - radiusB)) {
    throw new Error('P4 pulley projections do not admit the requested external tangent');
  }
  const uy = dy / distance;
  const uz = dz / distance;
  const py = -uz;
  const pz = uy;
  const a = (radiusA - radiusB) / distance;
  const b = Math.sqrt(Math.max(0, 1 - a * a));
  const ny = a * uy + side * b * py;
  const nz = a * uz + side * b * pz;
  return {
    pointA: new THREE.Vector3(
      centerA.x,
      centerA.y + radiusA * ny,
      centerA.z + radiusA * nz
    ),
    pointB: new THREE.Vector3(
      centerB.x,
      centerB.y + radiusB * ny,
      centerB.z + radiusB * nz
    )
  };
}

function minorArcYZP4(center, start, end, radius, segments = 10) {
  const startAngle = Math.atan2(start.z - center.z, start.y - center.y);
  const endAngle = Math.atan2(end.z - center.z, end.y - center.y);
  const delta = wrappedCamDeltaP4(endAngle, startAngle);
  const points = [];
  const sampleCount = Math.max(0, Math.floor(segments));
  for (let i = 1; i <= sampleCount; i += 1) {
    const angle = startAngle + delta * i / sampleCount;
    points.push(new THREE.Vector3(
      center.x,
      center.y + Math.cos(angle) * radius,
      center.z + Math.sin(angle) * radius
    ));
  }
  return {
    points,
    angleRad: Math.abs(delta),
    lengthMm: Math.abs(delta) * radius
  };
}

function tangentOrthogonalityErrorMmP4(center, contact, otherPoint) {
  const radial = new THREE.Vector3(0, contact.y - center.y, contact.z - center.z);
  const direction = otherPoint.clone().sub(contact).normalize();
  return Math.abs(radial.dot(direction));
}

function dynamicFlatTape(color, width, thickness, name, component, pickables) {
  const group = new THREE.Group();
  group.name = name;
  const segments = [];
  const xAxis = new THREE.Vector3(1, 0, 0);
  const tapeMaterial = material(color, 0.32, 0.42);

  return {
    mesh: group,
    widthMmP4: width,
    thicknessMmP4: thickness,
    update(points) {
      const segmentCount = Math.max(0, points.length - 1);
      while (segments.length < segmentCount) {
        const segment = box(1, width, thickness, tapeMaterial, `${name} · flat segment ${segments.length + 1}`);
        addPickable(segment, component, pickables);
        group.add(segment);
        segments.push(segment);
      }
      segments.forEach((segment, index) => {
        segment.visible = index < segmentCount;
        if (!segment.visible) return;
        const a = points[index];
        const b = points[index + 1];
        const delta = new THREE.Vector3().subVectors(b, a);
        const length = delta.length();
        segment.position.copy(a).add(b).multiplyScalar(0.5);
        segment.quaternion.setFromUnitVectors(xAxis, delta.clone().normalize());
        segment.scale.set(length, 1, 1);
      });
    }
  };
}

function openPositiveDriveBeltPathP4(x, motorCenter, motorRadius, cycleCenter, cycleRadius, arcSegments = 24) {
  const dy = cycleCenter.y - motorCenter.y;
  const dz = cycleCenter.z - motorCenter.z;
  const centerDistance = Math.hypot(dy, dz);
  const radiusDifference = cycleRadius - motorRadius;
  if (cycleRadius < motorRadius || centerDistance <= Math.abs(radiusDifference)) {
    throw new Error('P4 positive-drive belt centers/radii do not admit the intended external tangents');
  }

  const uy = dy / centerDistance;
  const uz = dz / centerDistance;
  const py = -uz;
  const pz = uy;
  const a = (motorRadius - cycleRadius) / centerDistance;
  const b = Math.sqrt(Math.max(0, 1 - a * a));

  let nA = { y: a * uy + b * py, z: a * uz + b * pz };
  let nB = { y: a * uy - b * py, z: a * uz - b * pz };
  let thetaA = Math.atan2(nA.z, nA.y);
  let thetaB = Math.atan2(nB.z, nB.y);
  const positiveModulo = angle => ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  let motorWrap = positiveModulo(thetaB - thetaA);

  // Choose A/B so the motor gets the shorter external-contact arc and the larger cycle pulley
  // gets the complementary wrap. This is a P4 geometric solve from the reconstructed pitch circles.
  if (motorWrap > Math.PI) {
    [nA, nB] = [nB, nA];
    [thetaA, thetaB] = [thetaB, thetaA];
    motorWrap = positiveModulo(thetaB - thetaA);
  }
  const thetaBUnwrapped = thetaA + motorWrap;
  const cycleWrap = Math.PI * 2 - motorWrap;

  const pointFromNormal = (center, radius, normal) => new THREE.Vector3(
    x,
    center.y + normal.y * radius,
    center.z + normal.z * radius
  );
  const pointFromAngle = (center, radius, angle) => new THREE.Vector3(
    x,
    center.y + Math.cos(angle) * radius,
    center.z + Math.sin(angle) * radius
  );

  const motorA = pointFromNormal(motorCenter, motorRadius, nA);
  const cycleA = pointFromNormal(cycleCenter, cycleRadius, nA);
  const cycleB = pointFromNormal(cycleCenter, cycleRadius, nB);
  const motorB = pointFromNormal(motorCenter, motorRadius, nB);

  const points = [motorA, cycleA];
  for (let i = 1; i <= arcSegments; i += 1) {
    points.push(pointFromAngle(cycleCenter, cycleRadius, thetaA - cycleWrap * i / arcSegments));
  }
  points.push(motorB);
  for (let i = 1; i < arcSegments; i += 1) {
    points.push(pointFromAngle(motorCenter, motorRadius, thetaBUnwrapped - motorWrap * i / arcSegments));
  }

  const tangentA = cycleA.clone().sub(motorA);
  const tangentB = cycleB.clone().sub(motorB);
  const tangentOrthogonalityErrorMm = Math.max(
    Math.abs(tangentA.y * nA.y + tangentA.z * nA.z),
    Math.abs(tangentB.y * nB.y + tangentB.z * nB.z)
  );
  const straightSpanMm = Math.sqrt(centerDistance * centerDistance - radiusDifference * radiusDifference);
  const centerlineLengthMmP4 =
    2 * straightSpanMm +
    motorRadius * motorWrap +
    cycleRadius * cycleWrap;

  return {
    points,
    centerDistanceMmP4: centerDistance,
    straightSpanMmP4: straightSpanMm,
    motorWrapDegP4: THREE.MathUtils.radToDeg(motorWrap),
    cycleWrapDegP4: THREE.MathUtils.radToDeg(cycleWrap),
    tangentOrthogonalityErrorMm,
    centerlineLengthMmP4
  };
}

function keyLabelTexture(label) {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f0eee5';
  ctx.font = label.length > 4 ? '700 19px ui-sans-serif, sans-serif' : '700 28px ui-sans-serif, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeKeyboard(keysMat, darkMat, pickables) {
  const group = new THREE.Group();
  const keyMeshes = new Map();
  const deck = box(340, 17, 142, darkMat, 'keyboard deck');
  deck.position.set(0, P4.keyboard.y, P4.keyboard.z);
  deck.rotation.x = deg(-7);
  addPickable(deck, COMPONENTS.keyboard, pickables);
  group.add(deck);

  const frontApron = box(346, 25, 42, darkMat, 'keyboard front apron');
  frontApron.position.set(0, 34, 139);
  frontApron.rotation.x = deg(-11);
  addPickable(frontApron, COMPONENTS.shell, pickables);
  group.add(frontApron);

  function addLabeledKey(keyText, x, y, z, width = 18, depth = 17, name = null) {
    const keyGeometry = keycapGeometryP4(width, 8, depth);
    const key = new THREE.Mesh(keyGeometry, keysMat);
    key.name = name || ('key-' + keyText);
    key.castShadow = true;
    key.receiveShadow = true;
    key.position.set(x, y, z);
    key.rotation.x = deg(-8);
    key.userData.component = COMPONENTS.keyboard;
    key.userData.baseY = y;
    key.userData.keycapClass = keyGeometry.userData.p4KeycapClass;
    pickables.push(key);

    const labelMaterial = new THREE.MeshBasicMaterial({
      map: keyLabelTexture(keyText),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const labelPlane = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(12, width - 4), 7.4), labelMaterial);
    labelPlane.rotation.x = -Math.PI / 2;
    labelPlane.position.y = 4.15;
    labelPlane.name = 'key label ' + keyText;
    key.add(labelPlane);
    group.add(key);
    const mapKey = keyText === '' ? 'SPACE' : keyText.toUpperCase();
    if (!keyMeshes.has(mapKey)) keyMeshes.set(mapKey, key);
    return key;
  }

  const rows = [
    ['1','2','3','4','5','6','7','8','9','0','-','='],
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L',';'],
    ['Z','X','C','V','B','N','M',',','.','/']
  ];
  const rowZ = [116, 92, 69, 47];
  rows.forEach((labels, row) => {
    const count = labels.length;
    const spacing = row === 0 ? 22.5 : 24;
    const offset = row === 1 ? 3 : row === 2 ? 9 : 15;
    for (let i = 0; i < count; i += 1) {
      addLabeledKey(
        labels[i],
        (i - (count - 1) / 2) * spacing + offset,
        55 - row * 2.8,
        rowZ[row]
      );
    }
  });

  addLabeledKey('TAB', -145, 49, 92, 24);
  addLabeledKey('CLR', -145, 46, 68, 24);
  addLabeledKey('LOCK', -145, 43, 46, 24);
  addLabeledKey('SHIFT', -145, 40, 24, 28);

  addLabeledKey('BKSP', 145, 49, 92, 28);
  addLabeledKey('RETURN', 145, 46, 65, 32);
  addLabeledKey('SHIFT', 145, 41, 32, 28);

  const spacebar = addLabeledKey('', 0, 39, 23, 112, 18, 'spacebar');
  spacebar.position.x = -2;

  group.keyMeshes = keyMeshes;
  return group;
}

function makeRack(rackMat, toothMat, pickables) {
  const group = new THREE.Group();
  const body = box(P4.rack.length, P4.rack.bodyY, P4.rack.bodyZ, rackMat, 'IBM 1124109 rack body');
  body.position.set(0, P4.rack.y, P4.rack.z);
  addPickable(body, COMPONENTS.rack, pickables);
  group.add(body);

  const topRail = box(P4.rack.length, 2.4, 5.2, rackMat, 'rack upper shoe surface R_top');
  topRail.position.set(0, P4.rack.y + 4.0, P4.rack.z - 1.0);
  addPickable(topRail, COMPONENTS.rack, pickables);
  group.add(topRail);

  const bottomRail = box(P4.rack.length, 2.2, 5.4, rackMat, 'rack lower shoe surface R_bottom / D8');
  bottomRail.position.set(0, P4.rack.y - 4.0, P4.rack.z - 1.0);
  addPickable(bottomRail, COMPONENTS.rack, pickables);
  group.add(bottomRail);

  const toothGeo = new THREE.BoxGeometry(CANONICAL.pitchMm * 0.46, 3.2, 4.2);
  const teeth = new THREE.InstancedMesh(toothGeo, toothMat, CANONICAL.nominalPositions);
  teeth.name = '12P rack teeth';
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, deg(CANONICAL.rack.toothInclinationDeg)));
  const half = (CANONICAL.nominalPositions - 1) / 2;
  for (let i = 0; i < CANONICAL.nominalPositions; i += 1) {
    const p = new THREE.Vector3((i - half) * CANONICAL.pitchMm, P4.rack.y + 4.2, P4.rack.z + 2.2);
    m.compose(p, q, new THREE.Vector3(1, 1, 1));
    teeth.setMatrixAt(i, m);
  }
  teeth.castShadow = true;
  teeth.receiveShadow = true;
  teeth.userData.component = COMPONENTS.rack;
  pickables.push(teeth);
  group.add(teeth);
  return group;
}

function makeTypeElement(ballMat, darkMetal, pickables) {
  const group = new THREE.Group();
  group.name = 'Selectric type element assembly';

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(CANONICAL.typeElement.structuralRadiusP4Mm, 32, 20),
    ballMat
  );
  body.scale.y = 0.90;
  body.name = 'type element structural body';
  addPickable(body, COMPONENTS.typeball, pickables);
  group.add(body);

  const boss = new THREE.Mesh(
    new THREE.CylinderGeometry(
      CANONICAL.typeElement.bossOuterRadiusP4Mm,
      CANONICAL.typeElement.bossOuterRadiusP4Mm,
      CANONICAL.typeElement.bossHeightP4Mm,
      24
    ),
    darkMetal
  );
  // Keep the P4 mounting boss mostly inside the recognizable interchangeable-element cap.
  // Earlier public geometry exposed it as a tall central knob, which did not read like a Selectric element.
  boss.position.y = TYPE_TOP_CAP_CENTER_Y_P4_MM - 2.4;
  boss.name = 'type element mounting boss beneath top cap';
  addPickable(boss, COMPONENTS.typeball, pickables);
  group.add(boss);

  const capProfile = [
    new THREE.Vector2(0, 2.2),
    new THREE.Vector2(8.2, 2.05),
    new THREE.Vector2(11.8, 1.35),
    new THREE.Vector2(TYPE_TOP_CAP_RADIUS_P4_MM, 0.15),
    new THREE.Vector2(13.1, -1.15),
    new THREE.Vector2(0, -1.4)
  ];
  const topCap = new THREE.Mesh(new THREE.LatheGeometry(capProfile, 40), darkMetal);
  topCap.position.y = TYPE_TOP_CAP_CENTER_Y_P4_MM;
  topCap.name = 'P4 interchangeable-element black top cap';
  addPickable(topCap, COMPONENTS.typeball, pickables);
  group.add(topCap);

  const capLatch = box(18.0, 2.2, 5.6, darkMetal, 'P4 type-element release latch');
  capLatch.position.set(-0.6, TYPE_TOP_CAP_CENTER_Y_P4_MM + 2.65, 0.2);
  addPickable(capLatch, COMPONENTS.typeball, pickables);
  group.add(capLatch);

  const capHinge = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, 6.5, 18), darkMetal);
  capHinge.rotation.x = Math.PI / 2;
  capHinge.position.set(8.1, TYPE_TOP_CAP_CENTER_Y_P4_MM + 2.65, 0.2);
  capHinge.name = 'P4 type-element latch hinge';
  addPickable(capHinge, COMPONENTS.typeball, pickables);
  group.add(capHinge);

  const skirt = new THREE.Mesh(
    new THREE.CylinderGeometry(15.2, 16.0, CANONICAL.typeElement.skirtHeightP4Mm, 44, 1, true),
    ballMat
  );
  skirt.position.y = -13.8;
  skirt.name = 'type element detent skirt';
  addPickable(skirt, COMPONENTS.typeball, pickables);
  group.add(skirt);

  const slugDepth = TYPE_SLUG_DEPTH_P4_MM;
  const slugGeo = typeSlugGeometryP4(2.9, 2.6, slugDepth, 0.30);
  const slugMat = ballMat.clone();
  slugMat.metalness = Math.max(slugMat.metalness, 0.68);
  slugMat.roughness = Math.min(slugMat.roughness, 0.24);
  const slugs = new THREE.InstancedMesh(slugGeo, slugMat, CANONICAL.typeElement.characterCount);
  slugs.name = '88 beveled surface-normal type slug cues';
  const matrix = new THREE.Matrix4();
  const rotationMatrix = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const scale = new THREE.Vector3(1,1,1);
  const normal = new THREE.Vector3();
  const tangentX = new THREE.Vector3();
  const tangentY = new THREE.Vector3();
  const surface = new THREE.Vector3();
  const p = new THREE.Vector3();
  let index = 0;
  const bodyRadius = CANONICAL.typeElement.structuralRadiusP4Mm;
  const bodyYRadius = bodyRadius * 0.90;
  for (let band = 0; band < CANONICAL.typeElement.bands; band += 1) {
    const lat = TYPE_BAND_LATITUDES_P4[band];
    const y = lat * bodyYRadius;
    const radial = bodyRadius * Math.sqrt(Math.max(0, 1 - (y * y) / (bodyYRadius * bodyYRadius)));
    for (let slot = 0; slot < CANONICAL.typeElement.positionsPerBand; slot += 1) {
      const a = slot * Math.PI * 2 / CANONICAL.typeElement.positionsPerBand;
      surface.set(Math.sin(a) * radial, y, Math.cos(a) * radial);

      // P4 functional geometry: each slug face is tangent to the ellipsoidal structural
      // body instead of sharing a global orientation. Exact glyph-face sections remain unresolved.
      normal.set(
        surface.x / (bodyRadius * bodyRadius),
        surface.y / (bodyYRadius * bodyYRadius),
        surface.z / (bodyRadius * bodyRadius)
      ).normalize();
      tangentX.set(Math.cos(a), 0, -Math.sin(a)).normalize();
      tangentY.copy(normal).cross(tangentX).normalize();
      rotationMatrix.makeBasis(tangentX, tangentY, normal);
      q.setFromRotationMatrix(rotationMatrix);
      p.copy(surface).addScaledVector(normal, slugDepth * 0.5);
      matrix.compose(p, q, scale);
      slugs.setMatrixAt(index++, matrix);
    }
  }
  slugs.instanceMatrix.needsUpdate = true;
  slugs.userData.component = COMPONENTS.typeball;
  slugs.castShadow = true;
  pickables.push(slugs);
  group.add(slugs);
  group.userData.slugSectionP4 = { ...slugGeo.userData.p4SlugSection };

  return group;
}

function makePaper(pickables) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const root = new THREE.Group();
  root.name = 'paper sheet + platen-wrap presentation';

  const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.96, metalness: 0, side: THREE.DoubleSide });
  const sheetWidthMmP5 = 260;
  const sheetHeightMmP5 = 112;
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(sheetWidthMmP5, sheetHeightMmP5), mat);
  sheet.name = 'paper output sheet';
  const baseY = 169;
  const stampOriginYPxP5 = 86;
  const stampPixelsPerMmP5 = canvas.height / sheetHeightMmP5;
  let lastStamp = null;
  const wrapRadiusMmP4 = CANONICAL.platen.radiusMm + 0.65;
  const backTangentZP4 = P4.platen.z - wrapRadiusMmP4;
  sheet.position.set(0, baseY, backTangentZP4);
  sheet.userData.component = COMPONENTS.paper;
  pickables.push(sheet);
  root.add(sheet);

  // The source material establishes the platen/paper relationship but not an exact hidden
  // wrap angle for this branch. This P4 surface prevents the visible sheet from reading as a
  // disconnected billboard while keeping the exact contact arc explicitly unresolved.
  const wrapStartAngleP4 = Math.PI;
  const wrapEndAngleP4 = deg(-24);
  const wrapSegments = 28;
  const halfWidth = 130;
  const wrapVertices = [];
  const wrapUvs = [];
  const wrapIndices = [];
  for (let i = 0; i <= wrapSegments; i += 1) {
    const t = i / wrapSegments;
    const angle = THREE.MathUtils.lerp(wrapStartAngleP4, wrapEndAngleP4, t);
    const y = P4.platen.y + Math.sin(angle) * wrapRadiusMmP4;
    const z = P4.platen.z + Math.cos(angle) * wrapRadiusMmP4;
    wrapVertices.push(-halfWidth, y, z, halfWidth, y, z);
    wrapUvs.push(0, 1 - t, 1, 1 - t);
    if (i < wrapSegments) {
      const a = i * 2;
      const b = a + 2;
      wrapIndices.push(a, a + 1, b + 1, a, b + 1, b);
    }
  }
  const wrapGeometry = new THREE.BufferGeometry();
  wrapGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wrapVertices, 3));
  wrapGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(wrapUvs, 2));
  wrapGeometry.setIndex(wrapIndices);
  wrapGeometry.computeVertexNormals();
  const wrapMaterial = new THREE.MeshStandardMaterial({
    color: 0xeee9db,
    roughness: 0.96,
    metalness: 0,
    side: THREE.DoubleSide
  });
  const wrap = new THREE.Mesh(wrapGeometry, wrapMaterial);
  wrap.name = 'P4 paper wrap around platen';
  wrap.userData.component = COMPONENTS.paper;
  wrap.castShadow = false;
  wrap.receiveShadow = true;
  pickables.push(wrap);
  root.add(wrap);

  function setAdvance(mm) {
    // The live output sheet retains the existing visible translation driven by physical
    // paper advance; the P4 contact wrap remains registered to the platen as a topology cue.
    sheet.position.y = baseY + (Number(mm) || 0);
  }

  function clear() {
    ctx.fillStyle = '#eee9db';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#dad2c1';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
    lastStamp = null;
    texture.needsUpdate = true;
  }

  function stamp(character, carrierX, paperAdvanceMm) {
    const usableW = canvas.width - 120;
    const normalized = (carrierX + CANONICAL.writingLineMm / 2) / CANONICAL.writingLineMm;
    const x = 60 + THREE.MathUtils.clamp(normalized, 0, 1) * usableW;
    const liveAdvanceMm = Number(paperAdvanceMm) || 0;
    // Marks are recorded in paper-local coordinates. As the physical sheet advances upward
    // through the machine, the next impact lands farther down the sheet's local texture.
    // The physical/paper-advance input can be P2 platen-derived; this browser texture scale is P5.
    const yUnclamped = stampOriginYPxP5 + liveAdvanceMm * stampPixelsPerMmP5;
    const y = THREE.MathUtils.clamp(yUnclamped, 28, canvas.height - 28);
    ctx.fillStyle = '#1a1b1a';
    ctx.font = 'bold 32px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(character || '•', x, y);
    lastStamp = {
      character: character || '•',
      carrierX,
      paperAdvanceMm: liveAdvanceMm,
      xPx: x,
      yPx: y,
      unclampedYPx: yUnclamped
    };
    texture.needsUpdate = true;
  }

  function stampDiagnostics() {
    return {
      sheetWidthMmP5,
      sheetHeightMmP5,
      originYPxP5: stampOriginYPxP5,
      pixelsPerMmP5: stampPixelsPerMmP5,
      lastStamp: lastStamp ? { ...lastStamp } : null,
      placementClass: 'paper-local y from live sheet advance × P5 canvas scale; no arbitrary logical-line pixel step'
    };
  }

  clear();
  setAdvance(0);
  return {
    mesh: root,
    clear,
    stamp,
    setAdvance,
    wrapRadiusMmP4,
    wrapStartAngleDegP4: THREE.MathUtils.radToDeg(wrapStartAngleP4),
    wrapEndAngleDegP4: THREE.MathUtils.radToDeg(wrapEndAngleP4),
    wrapSpanDegP4: THREE.MathUtils.radToDeg(wrapStartAngleP4 - wrapEndAngleP4),
    stampDiagnostics
  };
}

export function createSelectricModel() {
  const root = new THREE.Group();
  root.name = 'IBM Selectric 721 — constructive public reconstruction';

  const pickables = [];
  const assemblies = [];
  const state = {
    explosion: 0,
    carrierX: 0,
    leftMarginInsetColumns: 0,
    rightMarginInsetColumns: 0,
    leftMarginX: -CANONICAL.writingLineMm / 2,
    rightMarginX: CANONICAL.writingLineMm / 2,
    tiltBand: 0,
    rotateUnit: 0,
    shiftHemisphere: 0,
    shiftAngleDeg: 0,
    ribbonLift: 0,
    ribbonLiftCommand: 0,
    ribbonLiftFollowerP5: 0,
    ribbonPrintMode: 'middle',
    ribbonLoadState: false,
    ribbonFeedSuppressedCount: 0,
    printApproach: 0,
    printCamFollowerLiftP5: 0,
    platenIndex: 0,
    paperAdvanceMm: 0,
    manualPaperAlignmentMmP5: 0,
    feedRollPhaseRad: 0,
    bailRollPhaseRad: 0,
    lineSpacingTeeth: 1,
    cyclePhase: 0,
    keyboardCode: 0,
    cordPhase: 0,
    serviceCoverOpen: 0,
    inspectionCutaway: 'none',
    selectorInputs: { T1: 0, T2: 0, R1: 0, R2: 0, R2A: 0, fiveUnit: 0 },
    selectionNormalized: { qTilt: 0, q1: 0, q2: 0, qSigned: 0 },
    ribbonFeedStep: 0,
    ribbonFeedApproxRatchetTeeth: 0,
    ribbonFeedCamFollowerP5: 0,
    ribbonFeedStrokeP5: 0,
    ribbonFeedDirection: 1,
    ribbonFeedStrokeInDirection: 0,
    ribbonSpoolFillP5: [0.86, 0.14],
    ribbonReverseCount: 0,
    ribbonReversePhase: 0,
    ribbonReverseState: 'feeding',
    ribbonReverseThresholdStepsP5: 12,
    motorPhase: 0,
    keyboardPressCharacter: null,
    keyboardPress: 0,
    operationalCamAction: 'rest',
    operationalCamPhase: 0,
    operationalFollowerLiftP5: { spaceBackspace: 0, returnIndex: 0, shift: 0 },
    backspaceLinkage: 0,
    tensionArmAngleDeg: 0,
    escapementCordWrapAnglesDegP4: [0, 0],
    escapementCordTangentErrorMmP4: 0,
    returnCordWrapAnglesDegP4: [0, 0],
    returnCordTangentErrorMmP4: 0,
    carrierReturnDrivePhase: 0,
    tabGovernorPhase: 0,
    tabStopIndices: [],
    tiltDetent: 0,
    rotateDetent: 0,
    detentFollowerLiftP5: 0,
    feedRollsEngaged: true,
    platenVariableEngaged: false,
    manualPlatenAngle: 0,
    copyControlSetting: 0,
    copyControlOffsetZ: 0,
    paperBailEngaged: true,
    paperBailRollerPositionsP5: { left: 0.4, right: 0.4 }
  };

  const shellMat = material(0xb8b4a8, 0.03, 0.76);
  const shellDark = material(0x4e514f, 0.12, 0.72);
  const keyMat = material(0x252826, 0.03, 0.72);
  const metal = material(0x9fa7aa, 0.66, 0.34);
  const darkMetal = material(0x363c40, 0.72, 0.31);
  const rackMat = material(0x686f72, 0.63, 0.38);
  const rubber = material(0x252726, 0.04, 0.88);
  const ballMat = material(0xb8c0c3, 0.58, 0.28);
  const ribbonMat = material(0x171716, 0.01, 0.82);
  const shoeMat = material(0xd5d0bd, 0.02, 0.78);

  const shellAssembly = makeAssembly('outer shell / cover assembly', new THREE.Vector3(0, 150, -135));
  assemblies.push(shellAssembly);
  root.add(shellAssembly);

  // Keep the broad machine base out of the lifted outer-cover assembly. Exploding the old
  // combined group carried the full base upward behind the cover and visually swallowed the
  // platen/carrier layers. The base now separates downward while the outer shell lifts away.
  const baseShellAssembly = makeAssembly('base shell assembly', new THREE.Vector3(0, -90, -10));
  assemblies.push(baseShellAssembly);
  root.add(baseShellAssembly);

  const base = box(370, 20, 330, shellMat, 'base shell');
  base.position.set(0, 13, 0);
  addPickable(base, COMPONENTS.shell, pickables);
  baseShellAssembly.add(base);

  const cheekProfile = [
    { z: 162, y: 22 },
    { z: 162, y: 42 },
    { z: 150, y: 50 },
    { z: 128, y: 56 },
    { z: 103, y: 66 },
    { z: 76, y: 78 },
    { z: 52, y: 91 },
    { z: 32, y: 106 },
    { z: 15, y: 119 },
    { z: -16, y: 135 },
    { z: -55, y: 147 },
    { z: -102, y: 148 },
    { z: -143, y: 132 },
    { z: -163, y: 102 },
    { z: -166, y: 22 }
  ];
  const shellCheekInnerXP4 = 156;
  const shellCheekOuterXP4 = 182;
  const shellCheekBevelInsetP4 = 1.8;
  const serviceCoverSideClearanceP4 = 2.7;
  const serviceCoverMaxHalfWidthP4 =
    shellCheekInnerXP4 - shellCheekBevelInsetP4 - serviceCoverSideClearanceP4;

  const rightCheek = extrudedSideCheek(
    cheekProfile,
    shellCheekInnerXP4,
    shellCheekOuterXP4,
    shellMat,
    'right rounded shell cheek'
  );
  rightCheek.position.x = shellCheekInnerXP4;
  addPickable(rightCheek, COMPONENTS.shell, pickables);
  shellAssembly.add(rightCheek);
  const leftCheek = extrudedSideCheek(
    cheekProfile,
    shellCheekInnerXP4,
    shellCheekOuterXP4,
    shellMat,
    'left rounded shell cheek'
  );
  leftCheek.position.x = -shellCheekOuterXP4;
  addPickable(leftCheek, COMPONENTS.shell, pickables);
  shellAssembly.add(leftCheek);

  const serviceCoverPivot = new THREE.Group();
  serviceCoverPivot.name = 'top service cover hinge presentation';
  serviceCoverPivot.position.set(0, 122, -142);
  shellAssembly.add(serviceCoverPivot);

  // Keep the hinged hood fully inside the beveled inner faces of the fixed side cheeks.
  // The earlier reconstruction extended the hood into the cheek solids by up to ~14 mm,
  // producing visible z-fighting/bleeding when closed. This is a P4 assembly-clearance repair.
  const serviceCoverStationsP4 = [
    { z: 38, halfWidth: 149.0, bottomY: 70, topY: 85 },
    { z: 18, halfWidth: 150.0, bottomY: 73, topY: 92 },
    { z: -8, halfWidth: 151.0, bottomY: 78, topY: 106 },
    { z: -34, halfWidth: 151.5, bottomY: 84, topY: 129 },
    { z: -58, halfWidth: serviceCoverMaxHalfWidthP4, bottomY: 93, topY: 144 },
    { z: -72, halfWidth: 151.0, bottomY: 104, topY: 149 }
  ];
  const frontFascia = loftPrism(serviceCoverStationsP4, shellMat, 'service cover hood');
  frontFascia.position.set(0, -122, 142);
  addPickable(frontFascia, COMPONENTS.shell, pickables);
  serviceCoverPivot.add(frontFascia);

  const rearBridge = box(308, 13, 13, shellMat, 'service-cover rear bridge');
  rearBridge.position.set(0, 12, 65);
  addPickable(rearBridge, COMPONENTS.shell, pickables);
  serviceCoverPivot.add(rearBridge);

  const badgeMat = material(0x233b55, 0.28, 0.42);
  const badge = box(30, 8, 2, badgeMat, 'IBM badge');
  badge.position.set(0, -18, 154);
  badge.rotation.x = deg(-31);
  addPickable(badge, COMPONENTS.shell, pickables);
  serviceCoverPivot.add(badge);

  const rearCowl = box(330, 72, 72, shellMat, 'rear cowl');
  rearCowl.position.set(0, 83, -118);
  rearCowl.rotation.x = deg(-6);
  addPickable(rearCowl, COMPONENTS.shell, pickables);
  shellAssembly.add(rearCowl);

  const rearLip = box(334, 18, 52, shellMat, 'platen rear shell lip');
  rearLip.position.set(0, 115, -128);
  rearLip.rotation.x = deg(-10);
  addPickable(rearLip, COMPONENTS.shell, pickables);
  shellAssembly.add(rearLip);

  const ruler = box(268, 6, 5, metal, '12-CPI writing-position rule');
  ruler.position.set(0, 82, 30);
  addPickable(ruler, COMPONENTS.horizontalMotion, pickables);
  shellAssembly.add(ruler);

  const tickGeometry = new THREE.BoxGeometry(0.42, 4.2, 1.0);
  const tickMaterial = material(0x252a2b, 0.15, 0.5);
  const ticks = new THREE.InstancedMesh(tickGeometry, tickMaterial, CANONICAL.nominalPositions);
  ticks.name = 'writing-position rule ticks';
  const tickMatrix = new THREE.Matrix4();
  for (let i = 0; i < CANONICAL.nominalPositions; i += 1) {
    const x = (i - (CANONICAL.nominalPositions - 1) / 2) * CANONICAL.pitchMm;
    const tickScale = new THREE.Vector3(1, i % 10 === 0 ? 1.55 : i % 5 === 0 ? 1.25 : 0.85, 1);
    tickMatrix.compose(new THREE.Vector3(x, 84, 27.2), new THREE.Quaternion(), tickScale);
    ticks.setMatrixAt(i, tickMatrix);
  }
  ticks.userData.component = COMPONENTS.horizontalMotion;
  pickables.push(ticks);
  shellAssembly.add(ticks);

  const keyboardAssembly = makeAssembly('keyboard assembly', new THREE.Vector3(0, -46, 155));
  assemblies.push(keyboardAssembly);
  const keyboardSurface = makeKeyboard(keyMat, shellDark, pickables);
  keyboardAssembly.add(keyboardSurface);
  root.add(keyboardAssembly);
  const keyMeshes = keyboardSurface.keyMeshes;

  const selectorBailMaterials = [];
  const selectorBails = [];
  const keyboardMechanismAssembly = makeAssembly('keyboard code mechanism', new THREE.Vector3(0, -78, 62));
  assemblies.push(keyboardMechanismAssembly);
  root.add(keyboardMechanismAssembly);

  const keyleverGeometry = new THREE.BoxGeometry(3.0, 2.4, 82);
  const keylevers = new THREE.InstancedMesh(keyleverGeometry, darkMetal, 51);
  keylevers.name = 'repeated keylevers';
  const leverMatrix = new THREE.Matrix4();
  const leverQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(deg(-8), 0, 0));
  const leverScale = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < 51; i += 1) {
    const row = Math.floor(i / 11);
    const col = i % 11;
    const x = (col - 5) * 24 + (row % 2 ? 7 : 0);
    const p = new THREE.Vector3(x, 31 - row * 1.2, 54 - row * 16);
    leverMatrix.compose(p, leverQuat, leverScale);
    keylevers.setMatrixAt(i, leverMatrix);
  }
  keylevers.castShadow = true;
  keylevers.userData.component = COMPONENTS.keyboardMechanism;
  pickables.push(keylevers);
  keyboardMechanismAssembly.add(keylevers);

  const interposerGeometry = new THREE.BoxGeometry(3.2, 2.2, 54);
  const interposers = new THREE.InstancedMesh(interposerGeometry, metal, 51);
  interposers.name = 'character interposers';
  for (let i = 0; i < 51; i += 1) {
    const row = Math.floor(i / 11);
    const col = i % 11;
    const x = (col - 5) * 24 + (row % 2 ? 7 : 0);
    leverMatrix.compose(new THREE.Vector3(x, 27 - row * 0.8, 6 - row * 10), new THREE.Quaternion(), leverScale);
    interposers.setMatrixAt(i, leverMatrix);
  }
  interposers.castShadow = true;
  interposers.userData.component = COMPONENTS.keyboardMechanism;
  pickables.push(interposers);
  keyboardMechanismAssembly.add(interposers);

  for (let channel = 0; channel < 6; channel += 1) {
    const bailMat = material(0x7d8486, 0.58, 0.35);
    selectorBailMaterials.push(bailMat);
    const bail = box(286, 2.5, 4.2, bailMat, 'selector bail C' + (channel + 1));
    bail.position.set(0, 28 + channel * 4.0, -6 - channel * 5.0);
    bail.userData.baseY = bail.position.y;
    bail.userData.baseZ = bail.position.z;
    addPickable(bail, COMPONENTS.keyboardMechanism, pickables);
    keyboardMechanismAssembly.add(bail);
    selectorBails.push(bail);
  }

  const filterShaftRotor = new THREE.Group();
  filterShaftRotor.position.set(0, 32, 18);
  filterShaftRotor.name = 'filter shaft rotational frame';
  keyboardMechanismAssembly.add(filterShaftRotor);
  const filterShaft = shaft(294, 3.4, darkMetal, 'filter shaft');
  addPickable(filterShaft, COMPONENTS.keyboardMechanism, pickables);
  filterShaftRotor.add(filterShaft);
  const filterBlade = box(18, 3, 8, metal, 'filter-shaft pickup blade cue');
  filterBlade.position.set(0, 6, 0);
  addPickable(filterBlade, COMPONENTS.keyboardMechanism, pickables);
  filterShaftRotor.add(filterBlade);

  const latchBail = box(286, 4.5, 9, metal, 'selector latch bail');
  latchBail.position.set(0, 45, -42);
  addPickable(latchBail, COMPONENTS.keyboardMechanism, pickables);
  keyboardMechanismAssembly.add(latchBail);

  const frameAssembly = makeAssembly('primary frame', new THREE.Vector3(0, -24, -92));
  assemblies.push(frameAssembly);
  root.add(frameAssembly);

  const primarySideframes = [];
  const lowerShaftBearingBosses = [];
  for (const x of [-P4.sideframeX, P4.sideframeX]) {
    const sideGeometry = primarySideframeGeometryP4(10, 118, 174);
    const side = new THREE.Mesh(sideGeometry, darkMetal);
    side.name = x < 0 ? 'windowed left primary sideframe' : 'windowed right primary sideframe';
    side.castShadow = true;
    side.receiveShadow = true;
    side.position.set(x, 76, -28);
    addPickable(side, COMPONENTS.printShaft, pickables);
    frameAssembly.add(side);
    primarySideframes.push(side);

    const plate = box(4.5, 31, 35, metal, x < 0 ? 'IBM 1135590 LH bearing plate' : 'IBM 1135591 RH bearing plate');
    plate.position.set(x + (x < 0 ? 5.6 : -5.6), P4.printShaft.y, P4.printShaft.z);
    addPickable(plate, COMPONENTS.bearing, pickables);
    frameAssembly.add(plate);

    const bearing = new THREE.Mesh(
      new THREE.SphereGeometry(CANONICAL.printShaft.bearingOuterSphereMm / 2, 24, 14),
      darkMetal
    );
    bearing.scale.x = CANONICAL.printShaft.bearingLengthMm / CANONICAL.printShaft.bearingOuterSphereMm;
    bearing.position.set(x, P4.printShaft.y, P4.printShaft.z);
    bearing.name = 'IBM 1164740 spherical bearing';
    addPickable(bearing, COMPONENTS.bearing, pickables);
    frameAssembly.add(bearing);

    for (const [y, z, radius, name] of [
      [P4.cycleShaft.y, P4.cycleShaft.z, P4.cycleShaft.radius + 2.8, 'cycle-shaft sideframe bearing boss P4 cue'],
      [P4.operationalShaft.y, P4.operationalShaft.z, P4.operationalShaft.radius + 2.7, 'operational-shaft sideframe bearing boss P4 cue']
    ]) {
      const boss = pulley(radius, 7.5, metal, (x < 0 ? 'left ' : 'right ') + name);
      boss.position.set(x, y, z);
      addPickable(boss, COMPONENTS.drive, pickables);
      frameAssembly.add(boss);
      lowerShaftBearingBosses.push(boss);
    }
  }

  const printShaftRotor = new THREE.Group();
  printShaftRotor.name = 'D6 print-shaft rotational frame';
  printShaftRotor.position.set(0, P4.printShaft.y, P4.printShaft.z);
  frameAssembly.add(printShaftRotor);

  const printShaft = shaft(P4.printShaft.length, P4.printShaft.visibleRadius, metal, 'IBM 1164736 print shaft / D6');
  addPickable(printShaft, COMPONENTS.printShaft, pickables);
  printShaftRotor.add(printShaft);

  const currentGear = shaft(13, 14, darkMetal, 'IBM 1164739 current print-shaft gear envelope');
  currentGear.position.x = P4.sideframeX - 16;
  addPickable(currentGear, COMPONENTS.d6CurrentSet, pickables);
  printShaftRotor.add(currentGear);

  const cClip = new THREE.Mesh(
    new THREE.TorusGeometry(P4.printShaft.visibleRadius + 1.3, 0.9, 8, 28, Math.PI * 1.72),
    metal
  );
  cClip.rotation.y = Math.PI / 2;
  cClip.position.x = -P4.sideframeX + 14;
  cClip.name = 'item-51 C-clip presentation · IBM 1175220 US / 6520762 WT';
  addPickable(cClip, COMPONENTS.d6CurrentSet, pickables);
  printShaftRotor.add(cClip);

  const shaftPhaseMarker = box(8, 2, 2, darkMetal, 'P5 D6 phase marker');
  shaftPhaseMarker.position.set(0, P4.printShaft.visibleRadius + 1.6, 0);
  addPickable(shaftPhaseMarker, COMPONENTS.printShaft, pickables);
  printShaftRotor.add(shaftPhaseMarker);

  frameAssembly.add(makeRack(rackMat, darkMetal, pickables));

  const driveAssembly = makeAssembly('drive assembly', new THREE.Vector3(-108, -34, 38));
  assemblies.push(driveAssembly);
  root.add(driveAssembly);

  const cycleRotor = new THREE.Group();
  cycleRotor.position.set(0, P4.cycleShaft.y, P4.cycleShaft.z);
  driveAssembly.add(cycleRotor);
  const cycle = shaft(P4.cycleShaft.length, P4.cycleShaft.radius, metal, 'cycle shaft');
  addPickable(cycle, COMPONENTS.drive, pickables);
  cycleRotor.add(cycle);

  // The three visible cycle-shaft cam stations were previously flattened cylinders. Give them
  // smooth P4 radial envelopes so the powerframe reads mechanically, while keeping their exact
  // IBM functions/profiles explicitly unresolved rather than inventing service-manual identities.
  const cycleCamDefsP4 = [
    {
      x: -94,
      width: 8,
      baseRadius: 8.9,
      lobes: [{ angleRad: deg(-92), liftMm: 2.9, halfWidthRad: deg(52), sharpness: 2.55 }],
      name: 'left cycle-shaft cam · smooth P4 envelope'
    },
    {
      x: 12,
      width: 8,
      baseRadius: 9.3,
      lobes: [{ angleRad: deg(-28), liftMm: 3.2, halfWidthRad: deg(46), sharpness: 2.7 }],
      name: 'center cycle-shaft cam · smooth P4 envelope'
    },
    {
      x: 97,
      width: 8,
      baseRadius: 8.7,
      lobes: [{ angleRad: deg(38), liftMm: 2.6, halfWidthRad: deg(56), sharpness: 2.45 }],
      name: 'right cycle-shaft cam · smooth P4 envelope'
    }
  ];
  const cycleCamProfilesP4 = cycleCamDefsP4.map(def => {
    const cam = camProfileP4(
      def.width,
      def.baseRadius,
      def.lobes,
      darkMetal,
      def.name
    );
    cam.position.x = def.x;
    addPickable(cam, COMPONENTS.drive, pickables);
    cycleRotor.add(cam);
    return cam;
  });

  const operationalRotor = new THREE.Group();
  operationalRotor.name = 'continuously rotating operational shaft frame';
  operationalRotor.position.set(0, P4.operationalShaft.y, P4.operationalShaft.z);
  driveAssembly.add(operationalRotor);
  const operational = shaft(P4.operationalShaft.length, P4.operationalShaft.radius, darkMetal, 'operational shaft');
  addPickable(operational, COMPONENTS.drive, pickables);
  operationalRotor.add(operational);
  const operationalPhaseMarker = box(10, 2.4, 2.4, metal, 'operational shaft phase marker');
  operationalPhaseMarker.position.set(-110, P4.operationalShaft.radius + 2, 0);
  addPickable(operationalPhaseMarker, COMPONENTS.drive, pickables);
  operationalRotor.add(operationalPhaseMarker);

  const operationalCamFrame = new THREE.Group();
  operationalCamFrame.name = 'clutched operational service cams';
  operationalCamFrame.position.set(0, P4.operationalShaft.y, P4.operationalShaft.z);
  driveAssembly.add(operationalCamFrame);

  // Smooth P4 operational-cam envelopes replace the earlier round hubs with box lobes.
  // Lobe count and service-rotation class are preserved; exact IBM production profiles remain unresolved.
  const doubleServiceCam = new THREE.Group();
  doubleServiceCam.position.x = -44;
  doubleServiceCam.name = 'space/backspace double-lobed 180-degree service cam';
  operationalCamFrame.add(doubleServiceCam);
  const doubleServiceCamBaseRadiusP4 = 8.6;
  const doubleServiceCamLobesP4 = [
    { angleRad: -Math.PI / 2, liftMm: 2.8, halfWidthRad: deg(42), sharpness: 2.7 },
    { angleRad: Math.PI / 2, liftMm: 2.8, halfWidthRad: deg(42), sharpness: 2.7 }
  ];
  const doubleServiceCamProfile = camProfileP4(
    8,
    doubleServiceCamBaseRadiusP4,
    doubleServiceCamLobesP4,
    darkMetal,
    'space/backspace service cam · smooth double-lobed P4 profile'
  );
  addPickable(doubleServiceCamProfile, COMPONENTS.drive, pickables);
  doubleServiceCam.add(doubleServiceCamProfile);

  const returnIndexCam = new THREE.Group();
  returnIndexCam.position.x = 22;
  returnIndexCam.name = 'carrier-return/index single-lobed 360-degree service cam';
  operationalCamFrame.add(returnIndexCam);
  const returnIndexCamBaseRadiusP4 = 9.2;
  const returnIndexCamLobesP4 = [
    { angleRad: -Math.PI, liftMm: 3.3, halfWidthRad: deg(54), sharpness: 2.6 }
  ];
  const returnIndexCamProfile = camProfileP4(
    9,
    returnIndexCamBaseRadiusP4,
    returnIndexCamLobesP4,
    darkMetal,
    'carrier-return/index service cam · smooth single-lobed P4 profile'
  );
  addPickable(returnIndexCamProfile, COMPONENTS.drive, pickables);
  returnIndexCam.add(returnIndexCamProfile);

  const shiftCam = new THREE.Group();
  shiftCam.position.x = 84;
  shiftCam.name = 'dedicated shift 180-degree cam';
  operationalCamFrame.add(shiftCam);
  const shiftCamBaseRadiusP4 = 7.9;
  const shiftCamLobesP4 = [
    { angleRad: -Math.PI / 2, liftMm: 2.7, halfWidthRad: deg(50), sharpness: 2.6 }
  ];
  const shiftCamProfile = camProfileP4(
    8,
    shiftCamBaseRadiusP4,
    shiftCamLobesP4,
    darkMetal,
    'shift service cam · smooth single-lobed P4 profile'
  );
  addPickable(shiftCamProfile, COMPONENTS.drive, pickables);
  shiftCam.add(shiftCamProfile);

  function makeOperationalFollower(x, name) {
    const follower = new THREE.Group();
    follower.name = name;
    follower.position.set(x, P4.operationalShaft.y + 30, P4.operationalShaft.z);
    driveAssembly.add(follower);

    const pivotPin = pulley(3.8, 7, metal, name + ' pivot');
    addPickable(pivotPin, COMPONENTS.drive, pickables);
    follower.add(pivotPin);

    const arm = box(4.5, 28, 3.6, metal, name + ' lever');
    arm.position.set(0, -11, 0);
    addPickable(arm, COMPONENTS.drive, pickables);
    follower.add(arm);

    const roller = pulley(4.2, 6, darkMetal, name + ' roller');
    roller.position.set(0, -24, 0);
    addPickable(roller, COMPONENTS.drive, pickables);
    follower.add(roller);

    return follower;
  }

  const spaceBackspaceFollower = makeOperationalFollower(
    -44,
    'space/backspace operational cam follower'
  );
  const returnIndexFollower = makeOperationalFollower(
    22,
    'carrier-return/index operational cam follower'
  );
  const shiftFollower = makeOperationalFollower(
    84,
    'shift operational cam follower'
  );

  function followerLiftFromCamContactP4(baseRadius, lobes, rotationRad) {
    // Followers sit above the cam centers in the public reconstruction, so world +Y maps to
    // local angle -rotation. Normalize the sampled radial rise against the tallest P4 lobe.
    const localContactAngle = -rotationRad;
    const maxLift = Math.max(...lobes.map(lobe => lobe.liftMm), 1e-9);
    const rise = camRadiusAtP4(baseRadius, lobes, localContactAngle) - baseRadius;
    return THREE.MathUtils.clamp(rise / maxLift, 0, 1);
  }

  function applyOperationalFollowerLift(follower, liftP5) {
    follower.rotation.x = deg(-12 * THREE.MathUtils.clamp(liftP5, 0, 1));
  }

  // P4 motor embodiment: keep the sourced/working shaft center but replace the single
  // featureless cylinder with a barrel, endbells, vent bands, through-shaft and mounting feet.
  // These sections are presentation geometry; exact IBM motor housing dimensions remain unresolved.
  const motor = new THREE.Group();
  motor.name = 'motor assembly · P4 barrel/endbell reconstruction';
  motor.position.set(P4.motor.x, P4.motor.y, P4.motor.z);
  driveAssembly.add(motor);

  const motorBarrelLengthP4 = 52;
  const motorBarrelRadiusP4 = 24;
  const motorEndbellLengthP4 = 6;
  const motorEndbellRadiusP4 = 25.2;

  const motorBarrel = shaft(motorBarrelLengthP4, motorBarrelRadiusP4, darkMetal, 'motor barrel');
  addPickable(motorBarrel, COMPONENTS.drive, pickables);
  motor.add(motorBarrel);

  const motorEndbells = [];
  for (const sign of [-1, 1]) {
    const endbell = shaft(
      motorEndbellLengthP4,
      motorEndbellRadiusP4,
      metal,
      sign < 0 ? 'motor drive-end bell' : 'motor rear end bell'
    );
    endbell.position.x = sign * (motorBarrelLengthP4 / 2 + motorEndbellLengthP4 / 2 - 1.2);
    addPickable(endbell, COMPONENTS.drive, pickables);
    motor.add(endbell);
    motorEndbells.push(endbell);
  }

  const motorVentBands = [];
  for (const x of [-13, 0, 13]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(24.2, 0.72, 8, 40), metal);
    band.rotation.y = Math.PI / 2;
    band.position.x = x;
    band.name = 'motor circumferential vent/rib cue';
    addPickable(band, COMPONENTS.drive, pickables);
    motor.add(band);
    motorVentBands.push(band);
  }

  const motorShaft = shaft(16, 3.2, metal, 'motor through-shaft / pulley journal');
  motorShaft.position.x = -29;
  addPickable(motorShaft, COMPONENTS.drive, pickables);
  motor.add(motorShaft);

  const motorFeet = [];
  for (const x of [-15, 15]) {
    const foot = box(12, 5, 19, darkMetal, 'motor mounting foot P4 cue');
    foot.position.set(x, -25.5, 0);
    addPickable(foot, COMPONENTS.drive, pickables);
    motor.add(foot);
    motorFeet.push(foot);
  }

  const motorPitchRadiusP4 = 7.0;
  const cyclePitchRadiusP4 = motorPitchRadiusP4 * CANONICAL.drive.positiveBeltReduction;

  const motorDriveRotor = new THREE.Group();
  motorDriveRotor.name = 'motor positive-drive pulley rotor';
  motorDriveRotor.position.set(-145, 39, 42);
  driveAssembly.add(motorDriveRotor);

  const drivePulley = pulley(motorPitchRadiusP4, 10, darkMetal, '8-tooth motor positive-drive pulley');
  addPickable(drivePulley, COMPONENTS.drive, pickables);
  motorDriveRotor.add(drivePulley);

  const motorToothGeo = new THREE.BoxGeometry(10.8, 2.1, 3.2);
  const motorTeeth = new THREE.InstancedMesh(motorToothGeo, metal, CANONICAL.drive.motorPulleyTeeth);
  motorTeeth.name = '8 motor-pulley tooth cues';
  const driveToothMatrix = new THREE.Matrix4();
  const driveToothQuat = new THREE.Quaternion();
  const driveToothScale = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < CANONICAL.drive.motorPulleyTeeth; i += 1) {
    const a = i * Math.PI * 2 / CANONICAL.drive.motorPulleyTeeth;
    driveToothQuat.setFromEuler(new THREE.Euler(a, 0, 0));
    driveToothMatrix.compose(
      new THREE.Vector3(0, Math.cos(a) * motorPitchRadiusP4, Math.sin(a) * motorPitchRadiusP4),
      driveToothQuat,
      driveToothScale
    );
    motorTeeth.setMatrixAt(i, driveToothMatrix);
  }
  motorTeeth.userData.component = COMPONENTS.drive;
  motorTeeth.castShadow = true;
  pickables.push(motorTeeth);
  motorDriveRotor.add(motorTeeth);

  const cycleDriveRotor = new THREE.Group();
  cycleDriveRotor.name = 'continuously rotating cycle-clutch pulley hub';
  cycleDriveRotor.position.set(-145, P4.cycleShaft.y, P4.cycleShaft.z);
  driveAssembly.add(cycleDriveRotor);

  const cyclePulley = pulley(cyclePitchRadiusP4, 11, darkMetal, 'derived 29-tooth cycle-clutch pulley');
  addPickable(cyclePulley, COMPONENTS.drive, pickables);
  cycleDriveRotor.add(cyclePulley);

  const cycleToothGeo = new THREE.BoxGeometry(11.8, 2.0, 3.0);
  const cycleTeeth = new THREE.InstancedMesh(cycleToothGeo, metal, CANONICAL.drive.cycleClutchPulleyTeethDerived);
  cycleTeeth.name = '29 cycle-clutch-pulley tooth cues';
  const cycleToothMatrix = new THREE.Matrix4();
  const cycleToothQuat = new THREE.Quaternion();
  for (let i = 0; i < CANONICAL.drive.cycleClutchPulleyTeethDerived; i += 1) {
    const a = i * Math.PI * 2 / CANONICAL.drive.cycleClutchPulleyTeethDerived;
    cycleToothQuat.setFromEuler(new THREE.Euler(a, 0, 0));
    cycleToothMatrix.compose(
      new THREE.Vector3(0, Math.cos(a) * cyclePitchRadiusP4, Math.sin(a) * cyclePitchRadiusP4),
      cycleToothQuat,
      driveToothScale
    );
    cycleTeeth.setMatrixAt(i, cycleToothMatrix);
  }
  cycleTeeth.userData.component = COMPONENTS.drive;
  cycleTeeth.castShadow = true;
  pickables.push(cycleTeeth);
  cycleDriveRotor.add(cycleTeeth);

  const driveBeltPathP4 = openPositiveDriveBeltPathP4(
    -145,
    { y: 39, z: 42 },
    motorPitchRadiusP4,
    { y: P4.cycleShaft.y, z: P4.cycleShaft.z },
    cyclePitchRadiusP4
  );
  const driveBeltCurveP4 = new THREE.CatmullRomCurve3(
    driveBeltPathP4.points,
    true,
    'centripetal',
    0.5
  );
  const driveBelt = new THREE.Mesh(
    new THREE.TubeGeometry(driveBeltCurveP4, 120, 2.2, 8, true),
    material(0x222221, 0.05, 0.54)
  );
  driveBelt.name = 'P4 positive-drive belt on solved external tangents';
  addPickable(driveBelt, COMPONENTS.drive, pickables);
  driveAssembly.add(driveBelt);

  const driveBeltMarkerCountP5 = 4;
  const driveBeltMarkerPhaseP5 = [];
  const driveBeltMarkers = [];
  const driveBeltTravelFractionPerMotorRevP4 =
    (Math.PI * 2 * motorPitchRadiusP4) / driveBeltPathP4.centerlineLengthMmP4;
  for (let i = 0; i < driveBeltMarkerCountP5; i += 1) {
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 14, 10),
      material(0xb9b4a7, 0.08, 0.46)
    );
    marker.name = 'P5 positive-drive belt motion marker ' + (i + 1);
    marker.userData.component = COMPONENTS.drive;
    marker.castShadow = true;
    pickables.push(marker);
    driveAssembly.add(marker);
    driveBeltMarkers.push(marker);
    driveBeltMarkerPhaseP5.push(i / driveBeltMarkerCountP5);
  }

  function updateDriveBeltMarkers() {
    driveBeltMarkers.forEach((marker, index) => {
      const u = (
        driveBeltMarkerPhaseP5[index] +
        state.motorPhase * driveBeltTravelFractionPerMotorRevP4
      ) % 1;
      marker.position.copy(driveBeltCurveP4.getPointAt(u));
      marker.userData.beltPhaseP5 = u;
    });
  }

  const horizontalAssembly = makeAssembly('writing-line racks and cords', new THREE.Vector3(104, 8, -62));
  assemblies.push(horizontalAssembly);
  root.add(horizontalAssembly);

  const marginRack = box(P4.writingLineRacks.length, 4, 5, rackMat, 'IBM 1164743 margin rack');
  marginRack.position.set(0, P4.writingLineRacks.marginY, P4.writingLineRacks.marginZ);
  addPickable(marginRack, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(marginRack);

  const marginLimit = CANONICAL.writingLineMm / 2;
  const marginStops = {};
  for (const [side, x, name] of [
    ['left', -marginLimit, 'left physical margin stop / carrier-return terminator'],
    ['right', marginLimit, 'right physical margin stop / line-lock interface']
  ]) {
    const stop = box(8, 15, 10, darkMetal, name);
    stop.position.set(x, P4.writingLineRacks.marginY + 8, P4.writingLineRacks.marginZ);
    addPickable(stop, COMPONENTS.horizontalMotion, pickables);
    horizontalAssembly.add(stop);
    marginStops[side] = stop;
  }

  const tabRack = box(P4.writingLineRacks.length, 4, 5, darkMetal, 'IBM 1164102/6519354 7X1 tab rack family');
  tabRack.position.set(0, P4.writingLineRacks.tabY, P4.writingLineRacks.tabZ);
  addPickable(tabRack, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(tabRack);

  const tabStopBar = box(P4.writingLineRacks.length, 3.5, 4, metal, 'IBM 1124073 tab stop bar');
  tabStopBar.position.set(0, P4.writingLineRacks.tabY - 5, P4.writingLineRacks.tabZ + 1);
  addPickable(tabStopBar, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(tabStopBar);

  const tabStopMarkers = [];
  for (let stop = 0; stop < CANONICAL.nominalPositions; stop += 1) {
    const tabStop = box(2.2, 9, 7, metal, 'presentation tab stop');
    tabStop.position.set(
      -CANONICAL.writingLineMm / 2 + stop * CANONICAL.pitchMm,
      P4.writingLineRacks.tabY + 5,
      P4.writingLineRacks.tabZ
    );
    tabStop.visible = false;
    addPickable(tabStop, COMPONENTS.horizontalMotion, pickables);
    horizontalAssembly.add(tabStop);
    tabStopMarkers.push(tabStop);
  }

  const escapementShaft = shaft(270, 3.8, darkMetal, 'escapement / cord-drum shaft');
  escapementShaft.position.set(0, P4.cordSystem.shaftY, P4.cordSystem.shaftZ);
  addPickable(escapementShaft, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(escapementShaft);

  const mainspringCage = pulley(18, 15, darkMetal, 'mainspring cage presentation');
  mainspringCage.position.set(104, P4.cordSystem.shaftY, P4.cordSystem.shaftZ);
  addPickable(mainspringCage, COMPONENTS.mainspringCordSystem, pickables);
  horizontalAssembly.add(mainspringCage);

  const mainspringPoints = [];
  for (let i = 0; i <= 72; i += 1) {
    const a = i / 72 * Math.PI * 4.8;
    const r = 2.4 + i / 72 * 12.0;
    mainspringPoints.push(new THREE.Vector3(104, P4.cordSystem.shaftY + Math.cos(a) * r, P4.cordSystem.shaftZ + Math.sin(a) * r));
  }
  const mainspringSpiral = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mainspringPoints), 96, 0.7, 6, false),
    material(0xb8b0a0, 0.72, 0.34)
  );
  mainspringSpiral.name = 'P4 flat spiral mainspring cue';
  addPickable(mainspringSpiral, COMPONENTS.mainspringCordSystem, pickables);
  horizontalAssembly.add(mainspringSpiral);

  const tensionArm = new THREE.Group();
  tensionArm.name = 'right-side cord tension arm';
  tensionArm.position.set(P4.cordSystem.rightPulleyX, P4.cordSystem.shaftY, P4.cordSystem.shaftZ);
  horizontalAssembly.add(tensionArm);
  const tensionArmBar = box(5, 5, 42, metal, 'pivoting tension-arm link');
  tensionArmBar.position.set(0, 8, -15);
  tensionArmBar.rotation.x = deg(-24);
  addPickable(tensionArmBar, COMPONENTS.mainspringCordSystem, pickables);
  tensionArm.add(tensionArmBar);
  const tensionPulley = pulley(7.5, 6, darkMetal, 'tension-arm pulley');
  tensionPulley.position.set(0, 20, -20);
  addPickable(tensionPulley, COMPONENTS.mainspringCordSystem, pickables);
  tensionArm.add(tensionPulley);

  for (const xOffset of [-3, 3]) {
    const springPoints = [];
    for (let i = 0; i <= 32; i += 1) {
      const a = i / 32 * Math.PI * 3.5;
      const r = 1.5 + i / 32 * 5.5;
      springPoints.push(new THREE.Vector3(
        P4.cordSystem.rightPulleyX + xOffset,
        P4.cordSystem.shaftY + Math.cos(a) * r,
        P4.cordSystem.shaftZ + Math.sin(a) * r
      ));
    }
    const tensionSpring = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springPoints), 42, 0.42, 5, false),
      metal
    );
    tensionSpring.name = 'tension-arm spiral spring';
    addPickable(tensionSpring, COMPONENTS.mainspringCordSystem, pickables);
    horizontalAssembly.add(tensionSpring);
  }

  const escapementDrum = pulley(P4.cordSystem.drumRadius, 18, metal, 'escapement / tab cord drum');
  escapementDrum.position.set(72, P4.cordSystem.shaftY, P4.cordSystem.shaftZ);
  addPickable(escapementDrum, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(escapementDrum);

  const returnDrum = pulley(P4.cordSystem.drumRadius, 18, darkMetal, 'carrier-return cord drum');
  returnDrum.position.set(-22, P4.cordSystem.shaftY, P4.cordSystem.shaftZ);
  addPickable(returnDrum, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(returnDrum);

  const returnDriveGroup = new THREE.Group();
  returnDriveGroup.name = 'sustained carrier-return drive';
  returnDriveGroup.position.set(-62, P4.cordSystem.shaftY, P4.cordSystem.shaftZ + 2);
  horizontalAssembly.add(returnDriveGroup);

  const returnSpringClutch = pulley(12, 14, metal, 'carrier-return wrap/spring clutch cue');
  addPickable(returnSpringClutch, COMPONENTS.returnTabDrive, pickables);
  returnDriveGroup.add(returnSpringClutch);

  const returnPinion = pulley(6.5, 8, darkMetal, 'carrier-return pinion');
  returnPinion.position.set(18, 0, 0);
  addPickable(returnPinion, COMPONENTS.returnTabDrive, pickables);
  returnDriveGroup.add(returnPinion);

  const bevelGear = new THREE.Mesh(new THREE.CylinderGeometry(10, 6, 7, 24), metal);
  bevelGear.rotation.z = Math.PI / 2;
  bevelGear.position.set(30, 0, -1);
  bevelGear.name = 'carrier-return bevel-drive cue';
  addPickable(bevelGear, COMPONENTS.returnTabDrive, pickables);
  returnDriveGroup.add(bevelGear);

  const tabGovernorGroup = new THREE.Group();
  tabGovernorGroup.name = 'tab operational-shaft governor';
  tabGovernorGroup.position.set(52, P4.cordSystem.shaftY - 10, P4.cordSystem.shaftZ + 28);
  horizontalAssembly.add(tabGovernorGroup);

  const governorPinion = pulley(7, 7, darkMetal, 'tab governor pinion');
  addPickable(governorPinion, COMPONENTS.returnTabDrive, pickables);
  tabGovernorGroup.add(governorPinion);

  const governorClutch = pulley(11, 8, metal, 'tab governor spring-clutch cue');
  governorClutch.position.set(16, 0, 0);
  addPickable(governorClutch, COMPONENTS.returnTabDrive, pickables);
  tabGovernorGroup.add(governorClutch);

  const governorArm = box(4, 24, 4, metal, 'tab governor arm cue');
  governorArm.position.set(22, 8, 0);
  governorArm.rotation.z = deg(-25);
  addPickable(governorArm, COMPONENTS.returnTabDrive, pickables);
  tabGovernorGroup.add(governorArm);

  for (const [x, z, name] of [
    [P4.cordSystem.leftPulleyX, -36, 'left return pulley 1'],
    [P4.cordSystem.leftPulleyX, -58, 'left return pulley 2'],
    [P4.cordSystem.rightPulleyX - 18, -36, 'right escapement guide pulley']
  ]) {
    const guidePulley = pulley(7, 5.5, metal, name);
    guidePulley.position.set(x, 60, z);
    addPickable(guidePulley, COMPONENTS.horizontalMotion, pickables);
    horizontalAssembly.add(guidePulley);
  }

  const escapementCord = dynamicTube(0xd1b88c, 1.05, 'escapement / tab cord', COMPONENTS.horizontalMotion, pickables);
  const returnCord = dynamicTube(0xb8b2a4, 1.05, 'carrier-return cord', COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(escapementCord.mesh, returnCord.mesh);

  const escapementCordDrumPointP4 = new THREE.Vector3(
    72,
    P4.cordSystem.shaftY,
    P4.cordSystem.shaftZ - 9
  );
  const escapementCordGuidePointP4 = new THREE.Vector3(P4.cordSystem.rightPulleyX - 18, 60, -36);
  const tensionArmPulleyLocalP4 = new THREE.Vector3(0, 20, -20);
  const cordHalfTravelP4 = CANONICAL.writingLineMm / 2;

  function tensionArmPulleyPointP4(angleRad) {
    const localY = tensionArmPulleyLocalP4.y;
    const localZ = tensionArmPulleyLocalP4.z;
    return new THREE.Vector3(
      P4.cordSystem.rightPulleyX,
      P4.cordSystem.shaftY + localY * Math.cos(angleRad) - localZ * Math.sin(angleRad),
      P4.cordSystem.shaftZ + localY * Math.sin(angleRad) + localZ * Math.cos(angleRad)
    );
  }

  function escapementCordCarrierPointP4(carrierX) {
    return new THREE.Vector3(carrierX + 24, 82, -48);
  }

  const escapementGuideRadiusP4 = 7;
  const tensionPulleyRadiusP4 = 7.5;
  const escapementTangentSideP4 = -1;
  const returnPulleyRadiusP4 = 7;
  const returnCordDrumPointP4 = new THREE.Vector3(
    -22,
    P4.cordSystem.shaftY,
    P4.cordSystem.shaftZ - 9
  );
  const returnPulley1CenterP4 = new THREE.Vector3(P4.cordSystem.leftPulleyX, 60, -36);
  const returnPulley2CenterP4 = new THREE.Vector3(P4.cordSystem.leftPulleyX, 60, -58);

  function escapementCordMetricsP4(carrierX, armAngleRad) {
    const tensionCenter = tensionArmPulleyPointP4(armAngleRad);
    const carrierPoint = escapementCordCarrierPointP4(carrierX);
    const guideIn = pointCircleTangentYZP4(
      escapementCordDrumPointP4,
      escapementCordGuidePointP4,
      escapementGuideRadiusP4,
      escapementTangentSideP4
    );
    const guideToTension = externalCircleTangentYZP4(
      escapementCordGuidePointP4,
      escapementGuideRadiusP4,
      tensionCenter,
      tensionPulleyRadiusP4,
      escapementTangentSideP4
    );
    const tensionOut = pointCircleTangentYZP4(
      carrierPoint,
      tensionCenter,
      tensionPulleyRadiusP4,
      escapementTangentSideP4
    );
    // The length solver runs thousands of evaluations during initialization and carrier motion.
    // Skip arc point allocation here; only the final visible path samples the wrap curves.
    const guideArc = minorArcYZP4(
      escapementCordGuidePointP4,
      guideIn,
      guideToTension.pointA,
      escapementGuideRadiusP4,
      0
    );
    const tensionArc = minorArcYZP4(
      tensionCenter,
      guideToTension.pointB,
      tensionOut,
      tensionPulleyRadiusP4,
      0
    );
    const lengthMm =
      escapementCordDrumPointP4.distanceTo(guideIn) +
      guideArc.lengthMm +
      guideToTension.pointA.distanceTo(guideToTension.pointB) +
      tensionArc.lengthMm +
      tensionOut.distanceTo(carrierPoint);
    const tangentError = Math.max(
      tangentOrthogonalityErrorMmP4(
        escapementCordGuidePointP4,
        guideIn,
        escapementCordDrumPointP4
      ),
      tangentOrthogonalityErrorMmP4(
        escapementCordGuidePointP4,
        guideToTension.pointA,
        guideToTension.pointB
      ),
      tangentOrthogonalityErrorMmP4(
        tensionCenter,
        guideToTension.pointB,
        guideToTension.pointA
      ),
      tangentOrthogonalityErrorMmP4(
        tensionCenter,
        tensionOut,
        carrierPoint
      )
    );
    return {
      tensionCenter,
      carrierPoint,
      guideIn,
      guideOut: guideToTension.pointA,
      tensionIn: guideToTension.pointB,
      tensionOut,
      guideArc,
      tensionArc,
      lengthMm,
      tangentOrthogonalityErrorMmP4: tangentError
    };
  }

  function escapementCordPathPointsP4(carrierX, armAngleRad) {
    const metrics = escapementCordMetricsP4(carrierX, armAngleRad);
    const guideArcPoints = minorArcYZP4(
      escapementCordGuidePointP4,
      metrics.guideIn,
      metrics.guideOut,
      escapementGuideRadiusP4,
      10
    ).points;
    const tensionArcPoints = minorArcYZP4(
      metrics.tensionCenter,
      metrics.tensionIn,
      metrics.tensionOut,
      tensionPulleyRadiusP4,
      10
    ).points;
    return {
      metrics,
      points: [
        escapementCordDrumPointP4.clone(),
        metrics.guideIn.clone(),
        ...guideArcPoints,
        metrics.tensionIn.clone(),
        ...tensionArcPoints,
        metrics.carrierPoint.clone()
      ]
    };
  }

  function returnCordPathP4(carrierX) {
    const carrierPoint = new THREE.Vector3(carrierX - 24, 78, -45);
    const pulley1In = pointCircleTangentYZP4(
      returnCordDrumPointP4,
      returnPulley1CenterP4,
      returnPulleyRadiusP4,
      -1
    );
    const betweenPulleys = externalCircleTangentYZP4(
      returnPulley1CenterP4,
      returnPulleyRadiusP4,
      returnPulley2CenterP4,
      returnPulleyRadiusP4,
      1
    );
    const pulley2Out = pointCircleTangentYZP4(
      carrierPoint,
      returnPulley2CenterP4,
      returnPulleyRadiusP4,
      -1
    );
    const pulley1Arc = minorArcYZP4(
      returnPulley1CenterP4,
      pulley1In,
      betweenPulleys.pointA,
      returnPulleyRadiusP4
    );
    const pulley2Arc = minorArcYZP4(
      returnPulley2CenterP4,
      betweenPulleys.pointB,
      pulley2Out,
      returnPulleyRadiusP4
    );
    const tangentError = Math.max(
      tangentOrthogonalityErrorMmP4(returnPulley1CenterP4, pulley1In, returnCordDrumPointP4),
      tangentOrthogonalityErrorMmP4(returnPulley1CenterP4, betweenPulleys.pointA, betweenPulleys.pointB),
      tangentOrthogonalityErrorMmP4(returnPulley2CenterP4, betweenPulleys.pointB, betweenPulleys.pointA),
      tangentOrthogonalityErrorMmP4(returnPulley2CenterP4, pulley2Out, carrierPoint)
    );
    return {
      points: [
        returnCordDrumPointP4.clone(),
        pulley1In.clone(),
        ...pulley1Arc.points.map(point => point.clone()),
        betweenPulleys.pointB.clone(),
        ...pulley2Arc.points.map(point => point.clone()),
        carrierPoint.clone()
      ],
      wrapAnglesDegP4: [
        THREE.MathUtils.radToDeg(pulley1Arc.angleRad),
        THREE.MathUtils.radToDeg(pulley2Arc.angleRad)
      ],
      tangentOrthogonalityErrorMmP4: tangentError
    };
  }

  function escapementCordFreeSpanMmP4(carrierX, armAngleRad) {
    return escapementCordMetricsP4(carrierX, armAngleRad).lengthMm;
  }

  const escapementCordReferenceSpanMmP4 = escapementCordFreeSpanMmP4(0, 0);
  const escapementCordLeftSpanDeltaMmP4 =
    escapementCordFreeSpanMmP4(-cordHalfTravelP4, 0) - escapementCordReferenceSpanMmP4;
  const escapementCordRightSpanDeltaMmP4 =
    escapementCordFreeSpanMmP4(cordHalfTravelP4, 0) - escapementCordReferenceSpanMmP4;
  // P4 effective payout balances the two end-of-line residuals before the spring arm absorbs
  // the remaining geometric nonlinearity. It is a constructive cord/drum coupling, not an OEM ratio.
  const escapementCordDrumPayoutRatioP4 =
    (escapementCordLeftSpanDeltaMmP4 - escapementCordRightSpanDeltaMmP4) /
    (2 * cordHalfTravelP4);

  function compensatedEscapementCordErrorMmP4(carrierX, armAngleRad) {
    return (
      escapementCordFreeSpanMmP4(carrierX, armAngleRad) +
      carrierX * escapementCordDrumPayoutRatioP4 -
      escapementCordReferenceSpanMmP4
    );
  }

  function solveTensionArmAngleRadP4(carrierX) {
    const minAngle = deg(-25);
    const maxAngle = deg(10);
    const samples = 140;
    const roots = [];
    let previousAngle = minAngle;
    let previousError = compensatedEscapementCordErrorMmP4(carrierX, previousAngle);
    for (let i = 1; i <= samples; i += 1) {
      const angle = THREE.MathUtils.lerp(minAngle, maxAngle, i / samples);
      const error = compensatedEscapementCordErrorMmP4(carrierX, angle);
      if (previousError === 0 || error === 0 || previousError * error < 0) {
        let lo = previousAngle;
        let hi = angle;
        let loError = previousError;
        for (let iteration = 0; iteration < 32; iteration += 1) {
          const mid = (lo + hi) / 2;
          const midError = compensatedEscapementCordErrorMmP4(carrierX, mid);
          if (loError === 0 || loError * midError <= 0) {
            hi = mid;
          } else {
            lo = mid;
            loError = midError;
          }
        }
        roots.push((lo + hi) / 2);
      }
      previousAngle = angle;
      previousError = error;
    }
    if (roots.length) {
      return roots.reduce((best, candidate) =>
        Math.abs(candidate) < Math.abs(best) ? candidate : best
      );
    }

    let bestAngle = 0;
    let bestError = Math.abs(compensatedEscapementCordErrorMmP4(carrierX, bestAngle));
    for (let i = 0; i <= samples; i += 1) {
      const angle = THREE.MathUtils.lerp(minAngle, maxAngle, i / samples);
      const error = Math.abs(compensatedEscapementCordErrorMmP4(carrierX, angle));
      if (error < bestError) {
        bestAngle = angle;
        bestError = error;
      }
    }
    return bestAngle;
  }

  const tensionArmSweepSamplesP4 = Array.from({ length: 33 }, (_, index) => {
    const carrierX = THREE.MathUtils.lerp(-cordHalfTravelP4, cordHalfTravelP4, index / 32);
    return THREE.MathUtils.radToDeg(solveTensionArmAngleRadP4(carrierX));
  });
  const tensionArmSweepRangeDegP4 = [
    Math.min(...tensionArmSweepSamplesP4),
    Math.max(...tensionArmSweepSamplesP4)
  ];

  function updateCordGeometry(carrierX) {
    const armAngle = solveTensionArmAngleRadP4(carrierX);
    state.tensionArmAngleDeg = THREE.MathUtils.radToDeg(armAngle);
    tensionArm.rotation.x = armAngle;

    const escapementPath = escapementCordPathPointsP4(carrierX, armAngle);
    const returnPath = returnCordPathP4(carrierX);
    escapementCord.update(escapementPath.points);
    returnCord.update(returnPath.points);

    state.escapementCordWrapAnglesDegP4 = [
      THREE.MathUtils.radToDeg(escapementPath.metrics.guideArc.angleRad),
      THREE.MathUtils.radToDeg(escapementPath.metrics.tensionArc.angleRad)
    ];
    state.escapementCordTangentErrorMmP4 =
      escapementPath.metrics.tangentOrthogonalityErrorMmP4;
    state.returnCordWrapAnglesDegP4 = [...returnPath.wrapAnglesDegP4];
    state.returnCordTangentErrorMmP4 = returnPath.tangentOrthogonalityErrorMmP4;

    const travel = carrierX + CANONICAL.writingLineMm / 2;
    state.cordPhase = travel * escapementCordDrumPayoutRatioP4 / Math.max(P4.cordSystem.drumRadius, 1);
    escapementDrum.rotation.x = state.cordPhase;
    returnDrum.rotation.x = -state.cordPhase;
  }

  const platenAssembly = makeAssembly('platen / paper assembly', new THREE.Vector3(0, 112, -126));
  assemblies.push(platenAssembly);
  root.add(platenAssembly);

  const paperFeedCarriage = new THREE.Group();
  paperFeedCarriage.name = 'copy-control moving platen / paper-feed carriage';
  platenAssembly.add(paperFeedCarriage);

  const platen = shaft(P4.platen.length, CANONICAL.platen.radiusMm, rubber, 'platen');
  platen.position.set(0, P4.platen.y, P4.platen.z);
  addPickable(platen, COMPONENTS.platen, pickables);
  paperFeedCarriage.add(platen);

  const platenKnobPivots = [];
  const platenKnobGripRibCountP4 = 12;
  const platenKnobGripRibs = [];
  for (const x of [-159, 159]) {
    const pivot = new THREE.Group();
    pivot.name = x < 0 ? 'left platen knob phase pivot' : 'right platen knob phase pivot';
    pivot.position.set(x, P4.platen.y, P4.platen.z);

    const knob = shaft(28, 12.8, shellDark, x < 0 ? 'left platen knob core' : 'right platen knob core');
    addPickable(knob, COMPONENTS.platen, pickables);
    pivot.add(knob);

    const outerCap = shaft(3.4, 13.7, shellDark, x < 0 ? 'left platen knob outer cap' : 'right platen knob outer cap');
    outerCap.position.x = x < 0 ? -14.8 : 14.8;
    addPickable(outerCap, COMPONENTS.platen, pickables);
    pivot.add(outerCap);

    for (let ribIndex = 0; ribIndex < platenKnobGripRibCountP4; ribIndex += 1) {
      const angle = ribIndex * Math.PI * 2 / platenKnobGripRibCountP4;
      const rib = box(22, 1.25, 2.15, shellDark, (x < 0 ? 'left' : 'right') + ' platen knob grip rib');
      rib.position.set(0, Math.cos(angle) * 13.35, Math.sin(angle) * 13.35);
      rib.rotation.x = angle;
      addPickable(rib, COMPONENTS.platen, pickables);
      pivot.add(rib);
      platenKnobGripRibs.push(rib);
    }

    const phaseCue = box(8.5, 1.2, 1.8, metal, x < 0 ? 'left platen phase cue' : 'right platen phase cue');
    phaseCue.position.set(0, 14.25, 0);
    addPickable(phaseCue, COMPONENTS.platen, pickables);
    pivot.add(phaseCue);

    paperFeedCarriage.add(pivot);
    platenKnobPivots.push(pivot);
  }

  function setPlatenPhysicalAngle(angle) {
    const a = Number(angle) || 0;
    platen.rotation.x = a;
    platenKnobPivots.forEach(pivot => {
      pivot.rotation.x = a;
    });
  }

  const paper = makePaper(pickables);
  paperFeedCarriage.add(paper.mesh);

  const ratchetGroup = new THREE.Group();
  ratchetGroup.name = '27-tooth platen ratchet group';
  ratchetGroup.position.set(P4.platen.length / 2 - 8, P4.platen.y, P4.platen.z);
  paperFeedCarriage.add(ratchetGroup);

  const ratchetHub = shaft(6.5, CANONICAL.platen.ratchetDiameterMm / 2 - 2.1, darkMetal, 'platen ratchet hub');
  addPickable(ratchetHub, COMPONENTS.platenRatchet, pickables);
  ratchetGroup.add(ratchetHub);

  const ratchetToothGeo = ratchetToothGeometryP4(5.6, 4.0, 2.8);
  const ratchetTeeth = new THREE.InstancedMesh(
    ratchetToothGeo,
    metal,
    CANONICAL.platen.representativeRatchetTeeth
  );
  ratchetTeeth.name = '27 representative ratchet teeth';
  const ratchetMatrix = new THREE.Matrix4();
  const ratchetQuat = new THREE.Quaternion();
  const ratchetScale = new THREE.Vector3(1, 1, 1);
  const ratchetR = CANONICAL.platen.ratchetDiameterMm / 2 - 0.8;
  for (let i = 0; i < CANONICAL.platen.representativeRatchetTeeth; i += 1) {
    const a = i * Math.PI * 2 / CANONICAL.platen.representativeRatchetTeeth;
    ratchetQuat.setFromEuler(new THREE.Euler(a, 0, 0));
    ratchetMatrix.compose(
      new THREE.Vector3(0, Math.cos(a) * ratchetR, Math.sin(a) * ratchetR),
      ratchetQuat,
      ratchetScale
    );
    ratchetTeeth.setMatrixAt(i, ratchetMatrix);
  }
  ratchetTeeth.userData.component = COMPONENTS.platenRatchet;
  ratchetTeeth.castShadow = true;
  pickables.push(ratchetTeeth);
  ratchetGroup.add(ratchetTeeth);

  const feedRollXs = [-90, -30, 30, 90];
  const frontFeedRollers = [];
  const rearFeedRollers = [];
  const rearFeedShaft = shaft(242, 2.4, metal, 'rear feed-roll shaft');
  rearFeedShaft.position.set(0, P4.platen.y - 17, P4.platen.z - 12);
  addPickable(rearFeedShaft, COMPONENTS.paperFeed, pickables);
  paperFeedCarriage.add(rearFeedShaft);

  const frontFeedShaft = shaft(242, 2.4, metal, 'front feed-roll shaft');
  frontFeedShaft.position.set(0, P4.platen.y - 18, P4.platen.z + 18);
  addPickable(frontFeedShaft, COMPONENTS.paperFeed, pickables);
  paperFeedCarriage.add(frontFeedShaft);

  function makeFeedRollerPivot(x, y, z, name) {
    const pivot = new THREE.Group();
    pivot.name = name + ' rotational pivot';
    pivot.position.set(x, y, z);
    pivot.userData.baseY = y;
    pivot.userData.baseZ = z;

    const roller = pulley(6.2, 15, rubber, name);
    addPickable(roller, COMPONENTS.paperFeed, pickables);
    pivot.add(roller);

    const phaseCue = box(7.5, 1.1, 1.7, metal, name + ' phase cue');
    phaseCue.position.set(0, 6.15, 0);
    addPickable(phaseCue, COMPONENTS.paperFeed, pickables);
    pivot.add(phaseCue);

    paperFeedCarriage.add(pivot);
    return pivot;
  }

  for (const x of feedRollXs) {
    rearFeedRollers.push(
      makeFeedRollerPivot(x, P4.platen.y - 11, P4.platen.z - 12, 'rear molded rubber feed roller')
    );
    frontFeedRollers.push(
      makeFeedRollerPivot(x, P4.platen.y - 12, P4.platen.z + 16, 'front molded rubber feed roller')
    );
  }

  const paperDeflector = box(238, 2.2, 42, shellDark, 'paper deflector beneath platen');
  paperDeflector.position.set(0, P4.platen.y - 23, P4.platen.z + 1);
  paperDeflector.rotation.x = deg(-5);
  addPickable(paperDeflector, COMPONENTS.paperFeed, pickables);
  paperFeedCarriage.add(paperDeflector);

  const paperBailPivot = new THREE.Group();
  paperBailPivot.name = 'two-stable-state paper bail';
  paperBailPivot.position.set(0, P4.platen.y + 27, P4.platen.z + 4);
  paperFeedCarriage.add(paperBailPivot);

  const bailBar = shaft(266, 2.8, metal, 'paper bail shaft');
  addPickable(bailBar, COMPONENTS.paperFeed, pickables);
  paperBailPivot.add(bailBar);

  const paperBailRollers = {};
  for (const [side, x] of [['left', -74], ['right', 74]]) {
    const pivot = new THREE.Group();
    pivot.name = side + ' paper bail roller rotational pivot';
    pivot.position.set(x, -3, -3);

    const roller = pulley(5.5, 12, rubber, side + ' laterally adjustable paper bail roller');
    addPickable(roller, COMPONENTS.paperFeed, pickables);
    pivot.add(roller);

    const phaseCue = box(6.7, 1.0, 1.5, metal, side + ' paper bail roller phase cue');
    phaseCue.position.set(0, 5.45, 0);
    addPickable(phaseCue, COMPONENTS.paperFeed, pickables);
    pivot.add(phaseCue);

    paperBailPivot.add(pivot);
    paperBailRollers[side] = pivot;
  }

  for (const sign of [-1, 1]) {
    const endLever = box(5, 23, 5, metal, sign < 0 ? 'left paper-bail end lever' : 'right paper-bail end lever');
    endLever.position.set(sign * 128, -8, 2);
    endLever.rotation.x = deg(-16);
    addPickable(endLever, COMPONENTS.paperFeed, pickables);
    paperBailPivot.add(endLever);

    const toggleSpring = new THREE.Mesh(
      new THREE.TorusGeometry(5, 0.7, 6, 18, Math.PI * 1.25),
      metal
    );
    toggleSpring.rotation.y = Math.PI / 2;
    toggleSpring.position.set(sign * 128, -18, 7);
    toggleSpring.name = sign < 0 ? 'left paper-bail hairpin toggle spring cue' : 'right paper-bail hairpin toggle spring cue';
    addPickable(toggleSpring, COMPONENTS.paperFeed, pickables);
    paperBailPivot.add(toggleSpring);
  }

  const indexPawl = box(5, 20, 4, darkMetal, 'platen index pawl');
  indexPawl.position.set(P4.platen.length / 2 - 20, P4.platen.y - 2, P4.platen.z + 15);
  indexPawl.rotation.x = deg(-22);
  indexPawl.userData.baseRotationX = indexPawl.rotation.x;
  addPickable(indexPawl, COMPONENTS.platenRatchet, pickables);
  paperFeedCarriage.add(indexPawl);

  const detentRoller = pulley(4.5, 5, metal, 'platen detent roller');
  detentRoller.position.set(P4.platen.length / 2 - 20, P4.platen.y + 13, P4.platen.z + 8);
  addPickable(detentRoller, COMPONENTS.platenRatchet, pickables);
  paperFeedCarriage.add(detentRoller);

  const lineSpacingSelectorPivot = new THREE.Group();
  lineSpacingSelectorPivot.name = 'single-double line-spacing selector pivot';
  lineSpacingSelectorPivot.position.set(P4.platen.length / 2 - 43, P4.platen.y + 17, P4.platen.z + 22);
  paperFeedCarriage.add(lineSpacingSelectorPivot);

  const lineSpacingSelectorArm = box(5, 28, 5, metal, 'line-spacing selector arm');
  lineSpacingSelectorArm.position.set(0, 12, 0);
  addPickable(lineSpacingSelectorArm, COMPONENTS.paperFeed, pickables);
  lineSpacingSelectorPivot.add(lineSpacingSelectorArm);

  const lineSpacingSelectorKnob = box(14, 7, 11, shellDark, 'line-spacing selector knob');
  lineSpacingSelectorKnob.position.set(0, 27, 1);
  addPickable(lineSpacingSelectorKnob, COMPONENTS.paperFeed, pickables);
  lineSpacingSelectorPivot.add(lineSpacingSelectorKnob);

  const lineSpacingSelectorLink = box(4, 18, 4, darkMetal, 'line-spacing selector pawl-stop link cue');
  lineSpacingSelectorLink.position.set(-7, 2, -4);
  lineSpacingSelectorLink.rotation.x = deg(-18);
  addPickable(lineSpacingSelectorLink, COMPONENTS.platenRatchet, pickables);
  lineSpacingSelectorPivot.add(lineSpacingSelectorLink);

  const variableRelease = box(18, 7, 9, metal, 'platen variable-release coupling');
  variableRelease.position.set(-P4.platen.length / 2 + 17, P4.platen.y, P4.platen.z);
  addPickable(variableRelease, COMPONENTS.paperFeed, pickables);
  paperFeedCarriage.add(variableRelease);

  const feedRollActuatingShaft = shaft(276, 2.6, darkMetal, 'feed-roll actuating shaft / common release coordinate');
  feedRollActuatingShaft.position.set(0, P4.platen.y - 29, P4.platen.z + 8);
  addPickable(feedRollActuatingShaft, COMPONENTS.paperFeed, pickables);
  paperFeedCarriage.add(feedRollActuatingShaft);

  const frontReleaseArms = [];
  const rearReleaseArms = [];
  for (const x of [-105, 105]) {
    const frontArm = box(5, 25, 5, metal, 'front feed-roll release arm cue');
    frontArm.position.set(x, P4.platen.y - 19, P4.platen.z + 13);
    frontArm.userData.baseRotationX = deg(-8);
    frontArm.rotation.x = frontArm.userData.baseRotationX;
    addPickable(frontArm, COMPONENTS.paperFeed, pickables);
    paperFeedCarriage.add(frontArm);
    frontReleaseArms.push(frontArm);

    const rearArm = box(5, 24, 5, metal, 'rear feed-roll arm coupled by shoulder-screw cue');
    rearArm.position.set(x, P4.platen.y - 18, P4.platen.z - 11);
    rearArm.userData.baseRotationX = deg(8);
    rearArm.rotation.x = rearArm.userData.baseRotationX;
    addPickable(rearArm, COMPONENTS.paperFeed, pickables);
    paperFeedCarriage.add(rearArm);
    rearReleaseArms.push(rearArm);

    const coupling = box(4, 4, 25, darkMetal, 'front/rear feed-arm shoulder-screw coupling cue');
    coupling.position.set(x, P4.platen.y - 24, P4.platen.z + 1);
    addPickable(coupling, COMPONENTS.paperFeed, pickables);
    paperFeedCarriage.add(coupling);
  }

  const paperReleasePivot = new THREE.Group();
  paperReleasePivot.name = 'right-end paper-release lever';
  paperReleasePivot.position.set(P4.platen.length / 2 + 7, P4.platen.y - 8, P4.platen.z + 15);
  paperFeedCarriage.add(paperReleasePivot);
  const paperReleaseLever = box(7, 33, 7, shellDark, 'paper-release lever');
  paperReleaseLever.position.set(0, 15, 0);
  addPickable(paperReleaseLever, COMPONENTS.paperFeed, pickables);
  paperReleasePivot.add(paperReleaseLever);

  const copyControlRotor = new THREE.Group();
  copyControlRotor.name = 'copy-control shaft + eccentric rotor';
  copyControlRotor.position.set(0, P4.platen.y - 31, P4.platen.z - 20);
  platenAssembly.add(copyControlRotor);

  const copyControlShaft = shaft(326, 2.8, darkMetal, 'copy-control shaft');
  addPickable(copyControlShaft, COMPONENTS.paperFeed, pickables);
  copyControlRotor.add(copyControlShaft);

  const copyControlEccentrics = [];
  const copyControlLeverPivot = new THREE.Group();
  copyControlLeverPivot.name = 'left copy-control lever / five-position detent';
  copyControlLeverPivot.position.set(-P4.platen.length / 2 - 11, P4.platen.y - 18, P4.platen.z - 20);
  platenAssembly.add(copyControlLeverPivot);
  const copyControlLever = box(7, 31, 7, shellDark, 'copy-control lever');
  copyControlLever.position.set(0, 14, 0);
  addPickable(copyControlLever, COMPONENTS.paperFeed, pickables);
  copyControlLeverPivot.add(copyControlLever);

  const copyControlDetentPlate = new THREE.Group();
  copyControlDetentPlate.name = 'five-position copy-control detent presentation';
  copyControlDetentPlate.position.copy(copyControlLeverPivot.position);
  platenAssembly.add(copyControlDetentPlate);
  const copyControlDetentMarkers = [];
  for (let setting = 0; setting < 5; setting += 1) {
    const angle = deg(-setting * 8);
    const radiusP5 = 35;
    const marker = box(4.2, 5.4, 2.2, metal, 'copy-control detent marker ' + (setting + 1));
    marker.position.set(7.5, Math.cos(angle) * radiusP5, Math.sin(angle) * radiusP5);
    marker.rotation.x = angle;
    addPickable(marker, COMPONENTS.paperFeed, pickables);
    copyControlDetentPlate.add(marker);
    copyControlDetentMarkers.push(marker);
  }

  for (const x of [-P4.platen.length / 2 - 3, P4.platen.length / 2 + 3]) {
    const eccentric = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 5, 24), metal);
    eccentric.rotation.z = Math.PI / 2;
    eccentric.position.set(x, 0, 0);
    eccentric.name = 'copy-control eccentric collar cue';
    addPickable(eccentric, COMPONENTS.paperFeed, pickables);
    copyControlRotor.add(eccentric);
    copyControlEccentrics.push(eccentric);
  }

  const selectionAssembly = makeAssembly('selection transmission', new THREE.Vector3(98, -40, 42));
  assemblies.push(selectionAssembly);
  root.add(selectionAssembly);

  const selectionTapeP4 = Object.freeze({
    widthMm: 3.2,
    thicknessMm: 0.55,
    tilt: Object.freeze({
      sideX: 143,
      sideGuideY: 91,
      sideGuideZ: -42,
      sideGuideRadius: 5.2,
      carrierHalfSpan: 22,
      carrierGuideY: 91,
      carrierGuideZ: -42,
      carrierGuideRadius: 5.2,
      tangentZ: -47.2,
      actuatorY: 59,
      actuatorZ: -31
    }),
    rotate: Object.freeze({
      sideX: 133,
      sideGuideY: 88,
      sideGuideZ: -46,
      sideGuideRadius: 4.8,
      carrierHalfSpan: 13,
      carrierGuideY: 88,
      carrierGuideZ: -46,
      carrierGuideRadius: 4.8,
      tangentZ: -50.8,
      actuatorY: 60,
      actuatorZ: -29
    })
  });

  for (const side of [-1, 1]) {
    const tiltActuator = pulley(9.5, 6, metal, side < 0 ? 'left tilt selection pulley' : 'right tilt selection pulley');
    tiltActuator.position.set(side * selectionTapeP4.tilt.sideX, selectionTapeP4.tilt.actuatorY, selectionTapeP4.tilt.actuatorZ);
    addPickable(tiltActuator, COMPONENTS.selection, pickables);
    selectionAssembly.add(tiltActuator);

    const rotateActuator = pulley(8.5, 5.5, darkMetal, side < 0 ? 'left rotate selection pulley' : 'right rotate selection pulley');
    rotateActuator.position.set(side * selectionTapeP4.rotate.sideX, selectionTapeP4.rotate.actuatorY, selectionTapeP4.rotate.actuatorZ);
    addPickable(rotateActuator, COMPONENTS.selection, pickables);
    selectionAssembly.add(rotateActuator);

    const tiltGuide = pulley(selectionTapeP4.tilt.sideGuideRadius, 4.4, metal, side < 0 ? 'left P4 tilt tape guide sheave' : 'right P4 tilt tape guide sheave');
    tiltGuide.position.set(side * selectionTapeP4.tilt.sideX, selectionTapeP4.tilt.sideGuideY, selectionTapeP4.tilt.sideGuideZ);
    addPickable(tiltGuide, COMPONENTS.selection, pickables);
    selectionAssembly.add(tiltGuide);

    const rotateGuide = pulley(selectionTapeP4.rotate.sideGuideRadius, 4.0, darkMetal, side < 0 ? 'left P4 rotate tape guide sheave' : 'right P4 rotate tape guide sheave');
    rotateGuide.position.set(side * selectionTapeP4.rotate.sideX, selectionTapeP4.rotate.sideGuideY, selectionTapeP4.rotate.sideGuideZ);
    addPickable(rotateGuide, COMPONENTS.selection, pickables);
    selectionAssembly.add(rotateGuide);
  }

  const tiltTape = dynamicFlatTape(
    0xb06c38,
    selectionTapeP4.widthMm,
    selectionTapeP4.thicknessMm,
    'IBM 1164314 7X1 gearless tilt tape · P4 flat-strip route',
    COMPONENTS.selection,
    pickables
  );
  const rotateTape = dynamicFlatTape(
    0x647f9b,
    selectionTapeP4.widthMm,
    selectionTapeP4.thicknessMm,
    'IBM 1134811 7X1 rotate tape · P4 flat-strip route',
    COMPONENTS.selection,
    pickables
  );
  selectionAssembly.add(tiltTape.mesh, rotateTape.mesh);

  const selectorLatchNames = ['T1', 'T2', 'R1', 'R2', 'R2A'];
  const selectorLatches = {};
  selectorLatchNames.forEach((name, index) => {
    const latch = box(8, 28, 4.2, metal, name + ' selector latch');
    latch.position.set(-60 + index * 30, 54, -24);
    latch.userData.baseY = latch.position.y;
    addPickable(latch, COMPONENTS.selection, pickables);
    selectionAssembly.add(latch);
    selectorLatches[name] = latch;
  });

  const fiveUnitBail = box(54, 5, 9, darkMetal, 'five-unit bail');
  fiveUnitBail.position.set(58, 45, -31);
  fiveUnitBail.userData.baseY = fiveUnitBail.position.y;
  addPickable(fiveUnitBail, COMPONENTS.selection, pickables);
  selectionAssembly.add(fiveUnitBail);

  const tiltDifferential = new THREE.Group();
  tiltDifferential.position.set(-76, 68, -35);
  selectionAssembly.add(tiltDifferential);
  const tiltLeverSpan = 60;
  const tiltArmA = box(tiltLeverSpan, 4, 6, metal, 'tilt differential lever · normalized span 3');
  addPickable(tiltArmA, COMPONENTS.selection, pickables);
  tiltDifferential.add(tiltArmA);
  const tiltT2Input = box(4, 28, 5, darkMetal, 'T2 input at normalized x=0');
  tiltT2Input.position.set(-tiltLeverSpan / 2, 14, 0);
  tiltT2Input.userData.baseY = tiltT2Input.position.y;
  addPickable(tiltT2Input, COMPONENTS.selection, pickables);
  tiltDifferential.add(tiltT2Input);
  const tiltT1Input = box(4, 28, 5, darkMetal, 'T1 input at normalized x=3');
  tiltT1Input.position.set(tiltLeverSpan / 2, 14, 0);
  tiltT1Input.userData.baseY = tiltT1Input.position.y;
  addPickable(tiltT1Input, COMPONENTS.selection, pickables);
  tiltDifferential.add(tiltT1Input);
  const tiltLink = box(4, 36, 5, darkMetal, 'tilt output link at normalized x=1');
  tiltLink.position.set(-tiltLeverSpan / 6, 16, 0);
  tiltLink.userData.baseY = tiltLink.position.y;
  addPickable(tiltLink, COMPONENTS.selection, pickables);
  tiltDifferential.add(tiltLink);

  const rotateFirst = new THREE.Group();
  rotateFirst.position.set(12, 56, -34);
  selectionAssembly.add(rotateFirst);
  const rotateFirstSpan = 54;
  const rotateFirstLever = box(rotateFirstSpan, 4, 6, metal, 'rotate first lever · normalized span 3');
  addPickable(rotateFirstLever, COMPONENTS.selection, pickables);
  rotateFirst.add(rotateFirstLever);
  const rotateFirstLink = box(4, 28, 5, darkMetal, 'rotate q1 link at normalized x=2');
  rotateFirstLink.position.set(rotateFirstSpan / 6, 14, 0);
  rotateFirstLink.userData.baseY = rotateFirstLink.position.y;
  addPickable(rotateFirstLink, COMPONENTS.selection, pickables);
  rotateFirst.add(rotateFirstLink);

  const rotateSecond = new THREE.Group();
  rotateSecond.position.set(68, 68, -38);
  selectionAssembly.add(rotateSecond);
  const rotateSecondSpan = 58;
  const rotateSecondLever = box(rotateSecondSpan, 4, 6, metal, 'rotate second lever · normalized span 5');
  addPickable(rotateSecondLever, COMPONENTS.selection, pickables);
  rotateSecond.add(rotateSecondLever);
  const rotateSecondLink = box(4, 30, 5, darkMetal, 'rotate q2 link at normalized x=3');
  rotateSecondLink.position.set(rotateSecondSpan * 0.1, 15, 0);
  rotateSecondLink.userData.baseY = rotateSecondLink.position.y;
  addPickable(rotateSecondLink, COMPONENTS.selection, pickables);
  rotateSecond.add(rotateSecondLink);

  const rotateBalance = new THREE.Group();
  rotateBalance.position.set(108, 77, -42);
  selectionAssembly.add(rotateBalance);
  const rotateArm = box(54, 4, 6, metal, 'rotate signed balance lever · normalized span 2');
  addPickable(rotateArm, COMPONENTS.selection, pickables);
  rotateBalance.add(rotateArm);
  const rotateBellcrank = box(5, 34, 5, darkMetal, 'rotate balance midpoint output');
  rotateBellcrank.position.set(0, 15, 0);
  rotateBellcrank.userData.baseY = rotateBellcrank.position.y;
  addPickable(rotateBellcrank, COMPONENTS.selection, pickables);
  rotateBalance.add(rotateBellcrank);

  function rotatePositiveInputs(units) {
    const u = Math.max(0, Math.min(5, Math.trunc(units)));
    if (u === 0) return { R1: 0, R2: 0, R2A: 0 };
    if (u === 1) return { R1: 1, R2: 0, R2A: 0 };
    if (u === 2) return { R1: 0, R2: 1, R2A: 0 };
    if (u === 3) return { R1: 1, R2: 1, R2A: 0 };
    if (u === 4) return { R1: 0, R2: 1, R2A: 1 };
    return { R1: 1, R2: 1, R2A: 1 };
  }

  function updateSelectionDrive(tiltBand, rotateUnit) {
    const T1 = tiltBand & 1 ? 1 : 0;
    const T2 = tiltBand & 2 ? 1 : 0;
    const fiveUnit = rotateUnit < 0 ? 1 : 0;
    const compensation = fiveUnit ? rotateUnit + 5 : rotateUnit;
    const positive = rotatePositiveInputs(compensation);
    state.selectorInputs = { T1, T2, ...positive, fiveUnit };

    const qTilt = (T1 + 2 * T2) / 3;
    const q1 = (positive.R1 + 2 * positive.R2) / 3;
    const q2 = (3 * q1 + 2 * positive.R2A) / 5;
    const qSigned = q2 - fiveUnit;
    state.selectionNormalized = { qTilt, q1, q2, qSigned };

    selectorLatches.T1.position.y = selectorLatches.T1.userData.baseY - T1 * 7;
    selectorLatches.T2.position.y = selectorLatches.T2.userData.baseY - T2 * 7;
    selectorLatches.R1.position.y = selectorLatches.R1.userData.baseY - positive.R1 * 7;
    selectorLatches.R2.position.y = selectorLatches.R2.userData.baseY - positive.R2 * 7;
    selectorLatches.R2A.position.y = selectorLatches.R2A.userData.baseY - positive.R2A * 7;
    fiveUnitBail.position.y = fiveUnitBail.userData.baseY - fiveUnit * 8;

    tiltT1Input.position.y = tiltT1Input.userData.baseY - T1 * 8;
    tiltT2Input.position.y = tiltT2Input.userData.baseY - T2 * 8;
    tiltLink.position.y = tiltLink.userData.baseY - qTilt * 12;
    rotateFirstLink.position.y = rotateFirstLink.userData.baseY - q1 * 10;
    rotateSecondLink.position.y = rotateSecondLink.userData.baseY - q2 * 10;
    rotateBellcrank.position.y = rotateBellcrank.userData.baseY - qSigned * 10;
  }

  const carrierAssembly = makeAssembly('carrier assembly', new THREE.Vector3(-92, 102, -8));
  assemblies.push(carrierAssembly);
  root.add(carrierAssembly);

  const carrierMotion = new THREE.Group();
  carrierMotion.name = 'carrier mechanical transform';
  carrierAssembly.add(carrierMotion);

  const writingPositionIndicator = box(
    3.5,
    8,
    4,
    material(0xa64032, 0.1, 0.52),
    'carrier-parented writing-position indicator'
  );
  writingPositionIndicator.position.set(0, 85, 25.5);
  addPickable(writingPositionIndicator, COMPONENTS.horizontalMotion, pickables);
  carrierMotion.add(writingPositionIndicator);

  const carrierHalfW = P4.carrier.width / 2;
  const carrierHalfD = P4.carrier.depth / 2;
  const carrierSidePlates = [];
  for (const sign of [-1, 1]) {
    const sidePlateGeometry = carrierSidePlateGeometryP4(6.5, P4.carrier.height, P4.carrier.depth);
    const sidePlate = new THREE.Mesh(sidePlateGeometry, darkMetal);
    sidePlate.name = sign < 0 ? 'windowed carrier left side frame' : 'windowed carrier right side frame';
    sidePlate.castShadow = true;
    sidePlate.receiveShadow = true;
    sidePlate.position.set(sign * (carrierHalfW - 3.25), P4.carrier.y, P4.carrier.z);
    addPickable(sidePlate, COMPONENTS.carrier, pickables);
    carrierMotion.add(sidePlate);
    carrierSidePlates.push(sidePlate);
  }
  const carrierFrontBridge = box(P4.carrier.width - 10, 6, 7, darkMetal, 'carrier front bridge');
  carrierFrontBridge.position.set(0, P4.carrier.y + 4, P4.carrier.z + carrierHalfD - 3.5);
  addPickable(carrierFrontBridge, COMPONENTS.carrier, pickables);
  carrierMotion.add(carrierFrontBridge);

  const carrierRearBridge = box(P4.carrier.width - 10, 6, 7, darkMetal, 'carrier rear bridge');
  carrierRearBridge.position.set(0, P4.carrier.y + 4, P4.carrier.z - carrierHalfD + 3.5);
  addPickable(carrierRearBridge, COMPONENTS.carrier, pickables);
  carrierMotion.add(carrierRearBridge);

  const carrierLowerBridge = box(P4.carrier.width - 10, 5, P4.carrier.depth - 12, metal, 'carrier lower crossmember');
  carrierLowerBridge.position.set(0, P4.carrier.y - P4.carrier.height / 2 + 2.5, P4.carrier.z);
  addPickable(carrierLowerBridge, COMPONENTS.carrier, pickables);
  carrierMotion.add(carrierLowerBridge);

  const carrierTopBrace = box(P4.carrier.width - 18, 3.5, 8, metal, 'carrier top brace');
  carrierTopBrace.position.set(0, P4.carrier.y + P4.carrier.height / 2 - 2, P4.carrier.z + 2);
  addPickable(carrierTopBrace, COMPONENTS.carrier, pickables);
  carrierMotion.add(carrierTopBrace);

  const ribbonAssembly = new THREE.Group();
  ribbonAssembly.name = 'carrier-parented new-style fabric ribbon assembly';
  carrierMotion.add(ribbonAssembly);
  const ribbonSpools = [];
  const ribbonRatchets = [];
  const reverseTriggers = [];
  const ribbonPawlTargetXP5 = 30;
  const ribbonFillMinP5 = 0.14;
  const ribbonFillMaxP5 = 0.86;
  const ribbonFillStepP5 = (ribbonFillMaxP5 - ribbonFillMinP5) / state.ribbonReverseThresholdStepsP5;
  for (const x of [-P4.ribbon.spoolCenterX, P4.ribbon.spoolCenterX]) {
    const spool = new THREE.Group();
    spool.position.set(x, 93, -49);
    spool.name = x < 0 ? 'left fabric-ribbon spool assembly' : 'right fabric-ribbon spool assembly';
    spool.userData.component = COMPONENTS.ribbon;
    spool.userData.ribbonPackRadiusP4 = P4.ribbon.spoolRadiusP4 * 0.86;
    spool.userData.radiusScaleP5 = 1;
    ribbonAssembly.add(spool);
    ribbonSpools.push(spool);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.4, 10, 28), darkMetal);
    hub.name = x < 0 ? 'left ribbon spool hub' : 'right ribbon spool hub';
    addPickable(hub, COMPONENTS.ribbon, pickables);
    spool.add(hub);

    for (const y of [-4.4, 4.4]) {
      const flange = new THREE.Mesh(
        new THREE.CylinderGeometry(P4.ribbon.spoolRadiusP4, P4.ribbon.spoolRadiusP4, 1.2, 40),
        darkMetal
      );
      flange.position.y = y;
      flange.name = (x < 0 ? 'left' : 'right') + (y < 0 ? ' lower' : ' upper') + ' ribbon spool flange';
      addPickable(flange, COMPONENTS.ribbon, pickables);
      spool.add(flange);
    }

    const ribbonPack = new THREE.Mesh(
      new THREE.CylinderGeometry(spool.userData.ribbonPackRadiusP4, spool.userData.ribbonPackRadiusP4, 7.2, 40),
      ribbonMat
    );
    ribbonPack.name = x < 0 ? 'left wound fabric ribbon pack' : 'right wound fabric ribbon pack';
    addPickable(ribbonPack, COMPONENTS.ribbon, pickables);
    spool.add(ribbonPack);
    spool.userData.ribbonPack = ribbonPack;

    const phaseMarker = box(7.5, 0.8, 1.6, metal, x < 0 ? 'left spool rotation marker' : 'right spool rotation marker');
    phaseMarker.position.set(10.5, 5.3, 0);
    addPickable(phaseMarker, COMPONENTS.ribbon, pickables);
    spool.add(phaseMarker);

    const ratchetGeometry = radialToothedWheelGeometryP4(8.4, 1.6, 3.5, 20);
    const ratchet = new THREE.Mesh(ratchetGeometry, darkMetal);
    ratchet.position.set(x, 88, -49);
    ratchet.name = x < 0 ? 'left P4 toothed ribbon feed ratchet' : 'right P4 toothed ribbon feed ratchet';
    ratchet.castShadow = true;
    ratchet.receiveShadow = true;
    addPickable(ratchet, COMPONENTS.ribbon, pickables);
    ribbonAssembly.add(ratchet);
    ribbonRatchets.push(ratchet);

    const reverseTrigger = box(3, 9, 5, metal, x < 0 ? 'left reverse-trigger bellcrank cue' : 'right reverse-trigger bellcrank cue');
    reverseTrigger.position.set(x, 84, -39);
    reverseTrigger.rotation.z = deg(x < 0 ? -18 : 18);
    reverseTrigger.userData.baseRotationZ = reverseTrigger.rotation.z;
    addPickable(reverseTrigger, COMPONENTS.ribbon, pickables);
    ribbonAssembly.add(reverseTrigger);
    reverseTriggers.push(reverseTrigger);

    const brakeSpring = box(10, 1.2, 3, metal, x < 0 ? 'left spool retainer/brake spring cue' : 'right spool retainer/brake spring cue');
    brakeSpring.position.set(x, 99, -43);
    addPickable(brakeSpring, COMPONENTS.ribbon, pickables);
    ribbonAssembly.add(brakeSpring);
  }

  const feedPlate = box(74, 3.5, 10, metal, 'feed-and-reverse plate · slide plus reverse pivot');
  feedPlate.position.set(0, 83, -45);
  addPickable(feedPlate, COMPONENTS.ribbon, pickables);
  ribbonAssembly.add(feedPlate);

  const feedPawl = box(5, 18, 3, darkMetal, 'ribbon feed pawl');
  feedPawl.position.set(0, 87, -42);
  feedPawl.rotation.z = deg(12);
  addPickable(feedPawl, COMPONENTS.ribbon, pickables);
  ribbonAssembly.add(feedPawl);

  const detentLever = box(68, 3, 5, darkMetal, 'ratchet detent/check lever');
  detentLever.position.set(0, 79, -48);
  addPickable(detentLever, COMPONENTS.ribbon, pickables);
  ribbonAssembly.add(detentLever);

  const leftGuide = new THREE.Vector3(-18, P4.ribbon.yRest, P4.ribbon.z);
  const rightGuide = new THREE.Vector3(18, P4.ribbon.yRest, P4.ribbon.z);
  const ribbonLiftGuides = [];
  for (const x of [-18, 18]) {
    const sideName = x < 0 ? 'left' : 'right';
    const guide = new THREE.Group();
    guide.name = sideName + ' forked ribbon vibrator guide';
    guide.position.set(x, P4.ribbon.yRest - 3, P4.ribbon.z + 1);
    guide.userData.ribbonYOffsetP4 = -3;
    guide.userData.prongCount = 2;
    guide.userData.constructionClass = 'P4 forked vibrator guide with slim stem and front/rear ribbon-slot prongs';
    ribbonAssembly.add(guide);
    ribbonLiftGuides.push(guide);

    const stem = box(2.2, 14.0, 2.2, metal, sideName + ' ribbon-guide stem');
    stem.position.set(0, -5.0, 0);
    addPickable(stem, COMPONENTS.ribbon, pickables);
    guide.add(stem);

    for (const z of [-1.9, 1.9]) {
      const prong = box(2.2, 6.4, 1.25, metal, sideName + ' ribbon-guide slot prong');
      prong.position.set(0, 3.1, z);
      addPickable(prong, COMPONENTS.ribbon, pickables);
      guide.add(prong);
    }

    const crown = box(2.2, 1.2, 5.0, darkMetal, sideName + ' ribbon-guide crown');
    crown.position.set(0, 6.8, 0);
    addPickable(crown, COMPONENTS.ribbon, pickables);
    guide.add(crown);
  }

  const ribbonGuideBridge = box(42, 2.2, 4.5, darkMetal, 'ribbon lift guide bridge cue');
  ribbonGuideBridge.position.set(0, P4.ribbon.yRest - 12, P4.ribbon.z + 3);
  ribbonGuideBridge.userData.ribbonYOffsetP4 = -12;
  addPickable(ribbonGuideBridge, COMPONENTS.ribbon, pickables);
  ribbonAssembly.add(ribbonGuideBridge);

  function makeRibbonSegment(name) {
    const segment = box(1, P4.ribbon.widthMm, 1.0, ribbonMat, name);
    addPickable(segment, COMPONENTS.ribbon, pickables);
    ribbonAssembly.add(segment);
    return segment;
  }

  const ribbonLeftSegment = makeRibbonSegment('fabric ribbon · left spool to lift guide');
  const ribbonCenterSegment = makeRibbonSegment('fabric ribbon · print-point span');
  const ribbonRightSegment = makeRibbonSegment('fabric ribbon · lift guide to right spool');
  const ribbonXAxis = new THREE.Vector3(1, 0, 0);

  function updateRibbonSegment(mesh, a, b) {
    const delta = new THREE.Vector3().subVectors(b, a);
    const length = delta.length();
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(ribbonXAxis, delta.clone().normalize());
    mesh.scale.set(length, 1, 1);
  }

  function ribbonRollRadiusScaleP5(fill) {
    return THREE.MathUtils.lerp(0.52, 1.04, THREE.MathUtils.clamp(fill, 0, 1));
  }

  function updateRibbonSpoolFillVisuals() {
    ribbonSpools.forEach((spool, index) => {
      const radiusScale = ribbonRollRadiusScaleP5(state.ribbonSpoolFillP5[index]);
      spool.userData.radiusScaleP5 = radiusScale;
      spool.userData.ribbonPack.scale.set(radiusScale, 1, radiusScale);
    });
  }

  function updateRibbonPath(lift) {
    const liftY = THREE.MathUtils.lerp(P4.ribbon.yRest, P4.ribbon.yLift, lift);
    leftGuide.y = liftY;
    rightGuide.y = liftY;
    ribbonLiftGuides.forEach(guide => {
      guide.position.y = liftY + guide.userData.ribbonYOffsetP4;
    });
    ribbonGuideBridge.position.y = liftY + ribbonGuideBridge.userData.ribbonYOffsetP4;
    const leftRadius = ribbonSpools[0].userData.ribbonPackRadiusP4 * ribbonSpools[0].userData.radiusScaleP5;
    const rightRadius = ribbonSpools[1].userData.ribbonPackRadiusP4 * ribbonSpools[1].userData.radiusScaleP5;
    updateRibbonSegment(
      ribbonLeftSegment,
      new THREE.Vector3(-P4.ribbon.spoolCenterX + leftRadius * 0.82, 94, -50),
      leftGuide
    );
    updateRibbonSegment(ribbonCenterSegment, leftGuide, rightGuide);
    updateRibbonSegment(
      ribbonRightSegment,
      rightGuide,
      new THREE.Vector3(P4.ribbon.spoolCenterX - rightRadius * 0.82, 94, -50)
    );
  }

  const printSleeveRotor = new THREE.Group();
  printSleeveRotor.position.set(0, P4.printShaft.y, P4.printShaft.z);
  carrierMotion.add(printSleeveRotor);
  const sleeve = shaft(P4.carrierLocal.sleeveLength, P4.carrierLocal.sleeveRadius, metal, 'IBM 1141628 print sleeve');
  addPickable(sleeve, COMPONENTS.sleeve, pickables);
  printSleeveRotor.add(sleeve);

  // P4 smooth cam profiles replace the earlier round collars plus box-shaped lobe cues.
  // The sourced identities/order are preserved; these radial envelopes remain reconstruction,
  // not claims about exact IBM production cam sections.
  const ribbonLiftCam = camProfileP4(
    5.5,
    8.6,
    [{ angleRad: deg(180), liftMm: 2.2, halfWidthRad: deg(54), sharpness: 2.5 }],
    darkMetal,
    'ribbon-lift cam · smooth P4 profile'
  );
  ribbonLiftCam.position.x = -19;
  addPickable(ribbonLiftCam, COMPONENTS.ribbon, pickables);
  printSleeveRotor.add(ribbonLiftCam);

  const combinedFeedDetentCam = camProfileP4(
    7.0,
    9.0,
    [
      { angleRad: deg(180), liftMm: 2.7, halfWidthRad: deg(48), sharpness: 2.6 },
      { angleRad: deg(212), liftMm: 2.1, halfWidthRad: deg(36), sharpness: 2.8 }
    ],
    darkMetal,
    'IBM 1164240 combined ribbon-feed/detent cam · smooth P4 profile'
  );
  combinedFeedDetentCam.position.x = -4;
  addPickable(combinedFeedDetentCam, COMPONENTS.sleeve, pickables);
  printSleeveRotor.add(combinedFeedDetentCam);

  const printRestoringCam = camProfileP4(
    8.5,
    9.6,
    [
      { angleRad: deg(180), liftMm: 3.4, halfWidthRad: deg(50), sharpness: 2.7 },
      { angleRad: deg(328), liftMm: 2.8, halfWidthRad: deg(44), sharpness: 2.5 }
    ],
    darkMetal,
    'IBM 1124174 double print/restoring cam · smooth P4 profile'
  );
  printRestoringCam.position.x = 14;
  addPickable(printRestoringCam, COMPONENTS.sleeve, pickables);
  printSleeveRotor.add(printRestoringCam);

  for (const x of [-P4.carrierLocal.bearingX, P4.carrierLocal.bearingX]) {
    const localBearing = pulley(10.5, 7, shoeMat, x < 0 ? 'left carrier sleeve bearing' : 'right carrier sleeve bearing');
    localBearing.position.set(x, P4.printShaft.y, P4.printShaft.z);
    addPickable(localBearing, COMPONENTS.sleeve, pickables);
    carrierMotion.add(localBearing);
  }

  const bracket = box(68, 5.5, 26, metal, 'carrier-parented escapement bracket');
  bracket.position.set(0, P4.carrierLocal.escapementBracketY, P4.carrierLocal.escapementBracketZ);
  addPickable(bracket, COMPONENTS.escapementBracket, pickables);
  carrierMotion.add(bracket);

  const backspaceRack = box(48, 4, 6, rackMat, 'IBM 1124568 / 6519139 7X1 12P backspace rack family');
  backspaceRack.position.set(0, P4.rack.y - 12, P4.rack.z + 10);
  backspaceRack.userData.baseX = backspaceRack.position.x;
  addPickable(backspaceRack, COMPONENTS.backspaceLinkage, pickables);
  carrierMotion.add(backspaceRack);

  const backspaceTeeth = new THREE.InstancedMesh(
    new THREE.BoxGeometry(CANONICAL.pitchMm * 0.42, 3.0, 3.4),
    darkMetal,
    20
  );
  backspaceTeeth.name = '12P backspace rack tooth cues';
  const backspaceToothMatrix = new THREE.Matrix4();
  for (let i = 0; i < 20; i += 1) {
    backspaceToothMatrix.makeTranslation((i - 9.5) * CANONICAL.pitchMm, P4.rack.y - 9.6, P4.rack.z + 12.5);
    backspaceTeeth.setMatrixAt(i, backspaceToothMatrix);
  }
  backspaceTeeth.userData.component = COMPONENTS.backspaceLinkage;
  backspaceTeeth.castShadow = true;
  pickables.push(backspaceTeeth);
  carrierMotion.add(backspaceTeeth);

  const backspaceBellcrank = new THREE.Group();
  backspaceBellcrank.name = 'backspace bellcrank / intermediate lever presentation';
  backspaceBellcrank.position.set(-18, P4.rack.y - 2, P4.rack.z + 18);
  carrierMotion.add(backspaceBellcrank);
  const backspaceArmA = box(31, 4, 5, metal, 'backspace bellcrank arm');
  backspaceArmA.position.x = 12;
  addPickable(backspaceArmA, COMPONENTS.backspaceLinkage, pickables);
  backspaceBellcrank.add(backspaceArmA);
  const backspaceArmB = box(4, 24, 5, darkMetal, 'backspace intermediate lever');
  backspaceArmB.position.set(0, -9, 0);
  addPickable(backspaceArmB, COMPONENTS.backspaceLinkage, pickables);
  backspaceBellcrank.add(backspaceArmB);

  const pawl = box(10, 11, 3.5, darkMetal, 'escapement pawl');
  pawl.position.set(-25, P4.rack.y + 4.7, P4.rack.z + 4.5);
  pawl.rotation.z = deg(-14);
  addPickable(pawl, COMPONENTS.escapementBracket, pickables);
  carrierMotion.add(pawl);

  const supportPlate = box(34, 26, 3.5, metal, 'Level-2 rear support plate');
  supportPlate.position.set(0, P4.carrierLocal.supportPlateY, P4.carrierLocal.supportPlateZ);
  addPickable(supportPlate, COMPONENTS.rearSupport, pickables);
  carrierMotion.add(supportPlate);

  const upperShoe = box(18, 3.2, 7, shoeMat, 'IBM 1141770 upper shoe');
  upperShoe.position.set(0, P4.rack.y + 5.7, P4.rack.z - 1);
  addPickable(upperShoe, COMPONENTS.rearSupport, pickables);
  carrierMotion.add(upperShoe);

  const lowerShoe = box(18, 3.2, 7, shoeMat, 'IBM 1147260 lower shoe assembly');
  lowerShoe.position.set(0, P4.rack.y - 5.7, P4.rack.z - 1);
  addPickable(lowerShoe, COMPONENTS.rearSupport, pickables);
  carrierMotion.add(lowerShoe);

  const spring = box(4, 18, 1.5, darkMetal, 'IBM 1141985 rear support leaf spring');
  spring.position.set(12, 87, -68.5);
  spring.rotation.z = deg(18);
  addPickable(spring, COMPONENTS.rearSupport, pickables);
  carrierMotion.add(spring);

  const rocker = new THREE.Group();
  rocker.name = 'type-element rocker';
  rocker.position.set(0, P4.printRocker.pivotY, P4.printRocker.pivotZ);
  carrierMotion.add(rocker);

  const typeLocalY = P4.typeball.y - P4.printRocker.pivotY;
  const typeLocalZ = P4.typeball.zRest - P4.printRocker.pivotZ;

  const neck = shaft(Math.hypot(typeLocalY, typeLocalZ) * 0.78, 3.6, metal, 'type-element rocker arm');
  neck.rotation.z = 0;
  neck.rotation.x = Math.atan2(-typeLocalZ, typeLocalY);
  neck.position.set(0, typeLocalY * 0.48, typeLocalZ * 0.48);
  addPickable(neck, COMPONENTS.typeball, pickables);
  rocker.add(neck);

  const typeElement = makeTypeElement(ballMat, darkMetal, pickables);
  typeElement.position.set(0, typeLocalY, typeLocalZ);
  rocker.add(typeElement);

  const tiltRing = new THREE.Mesh(
    new THREE.TorusGeometry(18.3, 1.8, 8, 36),
    metal
  );
  tiltRing.rotation.x = Math.PI / 2;
  tiltRing.position.set(0, typeLocalY - 9.2, typeLocalZ + 0.5);
  tiltRing.name = 'tilt ring with four detent-notch cues';
  addPickable(tiltRing, COMPONENTS.fineAlignment, pickables);
  rocker.add(tiltRing);

  for (let band = 0; band < 4; band += 1) {
    const notch = box(4.5, 2.0, 2.5, darkMetal, 'tilt-ring detent notch cue band ' + band);
    const a = band * Math.PI / 2;
    notch.position.set(
      Math.sin(a) * 18.2,
      typeLocalY - 9.2,
      typeLocalZ + Math.cos(a) * 18.2
    );
    notch.rotation.y = a;
    addPickable(notch, COMPONENTS.fineAlignment, pickables);
    rocker.add(notch);
  }

  const skirtNotchCue = box(4.2, 3.8, 2.0, metal, 'type-element skirt rotate-detent notch cue');
  skirtNotchCue.position.set(0, -13.8, CANONICAL.typeElement.structuralRadiusP4Mm - 0.6);
  addPickable(skirtNotchCue, COMPONENTS.fineAlignment, pickables);
  typeElement.add(skirtNotchCue);

  const tiltDetentPivot = new THREE.Group();
  tiltDetentPivot.name = 'tilt detent pivot';
  tiltDetentPivot.position.set(-23, P4.typeball.y - 11, P4.typeball.zRest + 17);
  carrierMotion.add(tiltDetentPivot);
  const tiltDetentArm = box(5, 30, 5, metal, 'tilt detent arm');
  tiltDetentArm.position.set(0, 12, -5);
  tiltDetentArm.rotation.x = deg(-14);
  addPickable(tiltDetentArm, COMPONENTS.fineAlignment, pickables);
  tiltDetentPivot.add(tiltDetentArm);
  const tiltDetentTip = box(5.5, 5.5, 8, darkMetal, 'tilt detent V-tip cue');
  tiltDetentTip.position.set(0, 27, -11);
  addPickable(tiltDetentTip, COMPONENTS.fineAlignment, pickables);
  tiltDetentPivot.add(tiltDetentTip);

  const rotateDetentPivot = new THREE.Group();
  rotateDetentPivot.name = 'rotate detent pivot';
  rotateDetentPivot.position.set(23, P4.typeball.y - 14, P4.typeball.zRest + 15);
  carrierMotion.add(rotateDetentPivot);
  const rotateDetentArm = box(5, 28, 5, metal, 'rotate detent arm');
  rotateDetentArm.position.set(0, 11, -5);
  rotateDetentArm.rotation.x = deg(-12);
  addPickable(rotateDetentArm, COMPONENTS.fineAlignment, pickables);
  rotateDetentPivot.add(rotateDetentArm);
  const rotateDetentTip = box(5.2, 5.2, 8, darkMetal, 'rotate detent skirt-contact cue');
  rotateDetentTip.position.set(0, 25, -10);
  addPickable(rotateDetentTip, COMPONENTS.fineAlignment, pickables);
  rotateDetentPivot.add(rotateDetentTip);

  const detentFollower = new THREE.Group();
  detentFollower.name = '1164240 detent follower assembly';
  detentFollower.position.set(-4, P4.printShaft.y + 15.0, P4.printShaft.z);
  carrierMotion.add(detentFollower);

  const detentFollowerRoller = pulley(3.2, 5.5, darkMetal, '1164240 detent follower roller P4 cue');
  addPickable(detentFollowerRoller, COMPONENTS.fineAlignment, pickables);
  detentFollower.add(detentFollowerRoller);

  const detentFollowerYoke = box(20, 4.5, 5.0, metal, 'detent follower cross-yoke');
  detentFollowerYoke.position.set(4, 5.2, 0);
  addPickable(detentFollowerYoke, COMPONENTS.fineAlignment, pickables);
  detentFollower.add(detentFollowerYoke);

  const detentFollowerStem = box(4.2, 13.0, 4.2, metal, 'detent follower stem');
  detentFollowerStem.position.set(0, 7.5, 0);
  addPickable(detentFollowerStem, COMPONENTS.fineAlignment, pickables);
  detentFollower.add(detentFollowerStem);

  const detentFollowerBaseYP4 = detentFollower.position.y;

  const ribbonFeedFollower = new THREE.Group();
  ribbonFeedFollower.name = '1164240 ribbon-feed follower assembly';
  ribbonFeedFollower.position.set(-4, P4.printShaft.y + 9.5, P4.printShaft.z + 12.5);
  carrierMotion.add(ribbonFeedFollower);

  const ribbonFeedFollowerRoller = pulley(3.0, 5.0, darkMetal, '1164240 ribbon-feed follower roller P4 cue');
  addPickable(ribbonFeedFollowerRoller, COMPONENTS.ribbon, pickables);
  ribbonFeedFollower.add(ribbonFeedFollowerRoller);

  const ribbonFeedFollowerStem = box(4.0, 14.0, 4.0, metal, '1164240 ribbon-feed follower stem');
  ribbonFeedFollowerStem.position.set(0, 6.5, 2.5);
  ribbonFeedFollowerStem.rotation.x = deg(-18);
  addPickable(ribbonFeedFollowerStem, COMPONENTS.ribbon, pickables);
  ribbonFeedFollower.add(ribbonFeedFollowerStem);

  const ribbonFeedBellcrank = new THREE.Group();
  ribbonFeedBellcrank.name = 'ribbon-feed follower bellcrank P4';
  ribbonFeedBellcrank.position.set(-4, P4.printShaft.y + 23, P4.printShaft.z + 9);
  carrierMotion.add(ribbonFeedBellcrank);

  const ribbonFeedBellcrankA = box(4.0, 18.0, 4.0, metal, 'ribbon-feed bellcrank follower arm');
  ribbonFeedBellcrankA.position.set(0, -6.5, 0);
  addPickable(ribbonFeedBellcrankA, COMPONENTS.ribbon, pickables);
  ribbonFeedBellcrank.add(ribbonFeedBellcrankA);

  const ribbonFeedBellcrankB = box(23.0, 4.0, 4.0, darkMetal, 'ribbon-feed bellcrank pawl arm');
  ribbonFeedBellcrankB.position.set(9.5, 0, 0);
  addPickable(ribbonFeedBellcrankB, COMPONENTS.ribbon, pickables);
  ribbonFeedBellcrank.add(ribbonFeedBellcrankB);

  const ribbonFeedFollowerBaseP4 = ribbonFeedFollower.position.clone();

  const ribbonLiftFollower = new THREE.Group();
  ribbonLiftFollower.name = 'ribbon-lift cam follower assembly';
  ribbonLiftFollower.position.set(-19, P4.printShaft.y + 13.7, P4.printShaft.z);
  carrierMotion.add(ribbonLiftFollower);

  const ribbonLiftFollowerRoller = pulley(3.0, 5.0, darkMetal, 'ribbon-lift follower roller P4 cue');
  addPickable(ribbonLiftFollowerRoller, COMPONENTS.ribbon, pickables);
  ribbonLiftFollower.add(ribbonLiftFollowerRoller);

  const ribbonLiftFollowerStem = box(4.0, 13.0, 4.0, metal, 'ribbon-lift follower stem');
  ribbonLiftFollowerStem.position.set(0, 7.5, 0);
  addPickable(ribbonLiftFollowerStem, COMPONENTS.ribbon, pickables);
  ribbonLiftFollower.add(ribbonLiftFollowerStem);

  const ribbonLiftBellcrank = new THREE.Group();
  ribbonLiftBellcrank.name = 'ribbon-lift follower bellcrank P4';
  ribbonLiftBellcrank.position.set(-19, P4.printShaft.y + 26, P4.printShaft.z - 7);
  carrierMotion.add(ribbonLiftBellcrank);

  const ribbonLiftBellcrankA = box(4.0, 20.0, 4.0, metal, 'ribbon-lift bellcrank follower arm');
  ribbonLiftBellcrankA.position.set(0, -7, 0);
  addPickable(ribbonLiftBellcrankA, COMPONENTS.ribbon, pickables);
  ribbonLiftBellcrank.add(ribbonLiftBellcrankA);

  const ribbonLiftBellcrankB = box(18.0, 4.0, 4.0, darkMetal, 'ribbon-lift bellcrank vibrator arm');
  ribbonLiftBellcrankB.position.set(7, 0, 0);
  addPickable(ribbonLiftBellcrankB, COMPONENTS.ribbon, pickables);
  ribbonLiftBellcrank.add(ribbonLiftBellcrankB);

  const ribbonLiftFollowerBaseYP4 = ribbonLiftFollower.position.y;

  const printCamFollower = new THREE.Group();
  printCamFollower.name = '1124174 print/restoring cam follower assembly';
  printCamFollower.position.set(14, P4.printShaft.y + 16.2, P4.printShaft.z);
  carrierMotion.add(printCamFollower);

  const printCamFollowerRoller = pulley(3.1, 6.2, darkMetal, '1124174 print cam follower roller P4 cue');
  addPickable(printCamFollowerRoller, COMPONENTS.typeball, pickables);
  printCamFollower.add(printCamFollowerRoller);

  const printCamFollowerStem = box(4.2, 15.0, 4.2, metal, '1124174 follower stem');
  printCamFollowerStem.position.set(0, 8.6, 0);
  addPickable(printCamFollowerStem, COMPONENTS.typeball, pickables);
  printCamFollower.add(printCamFollowerStem);

  const printFollowerBellcrank = new THREE.Group();
  printFollowerBellcrank.name = 'print-rocker follower bellcrank P4';
  printFollowerBellcrank.position.set(14, P4.printShaft.y + 30, P4.printShaft.z - 8);
  carrierMotion.add(printFollowerBellcrank);

  const printFollowerBellcrankA = box(4.2, 22.0, 4.2, metal, 'print follower bellcrank cam arm');
  printFollowerBellcrankA.position.set(0, -8, 0);
  addPickable(printFollowerBellcrankA, COMPONENTS.typeball, pickables);
  printFollowerBellcrank.add(printFollowerBellcrankA);

  const printFollowerBellcrankB = box(22.0, 4.2, 4.2, darkMetal, 'print follower bellcrank rocker arm');
  printFollowerBellcrankB.position.set(-9, 0, 0);
  addPickable(printFollowerBellcrankB, COMPONENTS.typeball, pickables);
  printFollowerBellcrank.add(printFollowerBellcrankB);

  const printCamFollowerBaseYP4 = printCamFollower.position.y;

  const carrierTapeGuides = [];
  for (const side of [-1, 1]) {
    const tiltGuide = pulley(
      selectionTapeP4.tilt.carrierGuideRadius,
      4.4,
      metal,
      side < 0 ? 'left carrier P4 tilt tape guide' : 'right carrier P4 tilt tape guide'
    );
    tiltGuide.position.set(
      side * selectionTapeP4.tilt.carrierHalfSpan,
      selectionTapeP4.tilt.carrierGuideY,
      selectionTapeP4.tilt.carrierGuideZ
    );
    addPickable(tiltGuide, COMPONENTS.selection, pickables);
    carrierMotion.add(tiltGuide);
    carrierTapeGuides.push(tiltGuide);

    const rotateGuide = pulley(
      selectionTapeP4.rotate.carrierGuideRadius,
      4.0,
      darkMetal,
      side < 0 ? 'left carrier P4 rotate tape guide' : 'right carrier P4 rotate tape guide'
    );
    rotateGuide.position.set(
      side * selectionTapeP4.rotate.carrierHalfSpan,
      selectionTapeP4.rotate.carrierGuideY,
      selectionTapeP4.rotate.carrierGuideZ
    );
    addPickable(rotateGuide, COMPONENTS.selection, pickables);
    carrierMotion.add(rotateGuide);
    carrierTapeGuides.push(rotateGuide);
  }

  function selectionTapePointsAt(x) {
    const qTilt = state.selectionNormalized.qTilt;
    const qSigned = state.selectionNormalized.qSigned;
    const shiftOffset = state.shiftAngleDeg / 180 * 8;

    const tilt = [
      new THREE.Vector3(-selectionTapeP4.tilt.sideX, selectionTapeP4.tilt.actuatorY - qTilt * 9, selectionTapeP4.tilt.actuatorZ),
      new THREE.Vector3(-selectionTapeP4.tilt.sideX, selectionTapeP4.tilt.sideGuideY, selectionTapeP4.tilt.tangentZ),
      new THREE.Vector3(x - selectionTapeP4.tilt.carrierHalfSpan, selectionTapeP4.tilt.carrierGuideY, selectionTapeP4.tilt.tangentZ),
      new THREE.Vector3(x + selectionTapeP4.tilt.carrierHalfSpan, selectionTapeP4.tilt.carrierGuideY, selectionTapeP4.tilt.tangentZ),
      new THREE.Vector3(selectionTapeP4.tilt.sideX, selectionTapeP4.tilt.sideGuideY, selectionTapeP4.tilt.tangentZ),
      new THREE.Vector3(selectionTapeP4.tilt.sideX, selectionTapeP4.tilt.actuatorY, selectionTapeP4.tilt.actuatorZ)
    ];

    const rotate = [
      new THREE.Vector3(-selectionTapeP4.rotate.sideX, selectionTapeP4.rotate.actuatorY - qSigned * 9, selectionTapeP4.rotate.actuatorZ),
      new THREE.Vector3(-selectionTapeP4.rotate.sideX, selectionTapeP4.rotate.sideGuideY, selectionTapeP4.rotate.tangentZ),
      new THREE.Vector3(x - selectionTapeP4.rotate.carrierHalfSpan, selectionTapeP4.rotate.carrierGuideY, selectionTapeP4.rotate.tangentZ),
      new THREE.Vector3(x + selectionTapeP4.rotate.carrierHalfSpan, selectionTapeP4.rotate.carrierGuideY, selectionTapeP4.rotate.tangentZ),
      new THREE.Vector3(selectionTapeP4.rotate.sideX, selectionTapeP4.rotate.sideGuideY, selectionTapeP4.rotate.tangentZ),
      new THREE.Vector3(selectionTapeP4.rotate.sideX, selectionTapeP4.rotate.actuatorY + shiftOffset, selectionTapeP4.rotate.actuatorZ)
    ];
    return { tilt, rotate };
  }

  function polylineLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i += 1) length += points[i].distanceTo(points[i - 1]);
    return length;
  }

  function selectionTapeInvariantError() {
    const xs = [-CANONICAL.writingLineMm / 2, 0, CANONICAL.writingLineMm / 2];
    const tiltLengths = xs.map(x => polylineLength(selectionTapePointsAt(x).tilt));
    const rotateLengths = xs.map(x => polylineLength(selectionTapePointsAt(x).rotate));
    return {
      tiltMm: Math.max(...tiltLengths) - Math.min(...tiltLengths),
      rotateMm: Math.max(...rotateLengths) - Math.min(...rotateLengths)
    };
  }

  function updateSelectionTapes() {
    const points = selectionTapePointsAt(state.carrierX);
    tiltTape.update(points.tilt);
    rotateTape.update(points.rotate);
  }

  function setKeyboardCode(code) {
    state.keyboardCode = Math.max(0, Math.min(63, Math.trunc(code) || 0));
    selectorBailMaterials.forEach((mat, index) => {
      const active = Boolean(state.keyboardCode & (1 << index));
      mat.emissive.setHex(active ? 0x2d1b08 : 0x000000);
      mat.emissiveIntensity = active ? 0.45 : 1;
      const bail = selectorBails[index];
      bail.position.y = bail.userData.baseY - (active ? 4.5 : 0);
      bail.position.z = bail.userData.baseZ + (active ? 3.0 : 0);
    });
  }

  function normalizeKeyCharacter(character) {
    if (character === null || character === undefined) return null;
    if (character === ' ') return 'SPACE';
    if (character === '\n' || character === '\r') return 'RETURN';
    return String(character).toUpperCase();
  }

  function setKeyPress(character, value) {
    state.keyboardPressCharacter = normalizeKeyCharacter(character);
    state.keyboardPress = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    keyMeshes.forEach(key => {
      key.position.y = key.userData.baseY;
    });
    const activeKey = state.keyboardPressCharacter ? keyMeshes.get(state.keyboardPressCharacter) : null;
    if (activeKey) activeKey.position.y = activeKey.userData.baseY - state.keyboardPress * 4.2;
  }

  function setCarrierReturnDrive(value) {
    state.carrierReturnDrivePhase = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    returnSpringClutch.rotation.x = state.carrierReturnDrivePhase * Math.PI * 4;
    returnPinion.rotation.x = state.carrierReturnDrivePhase * Math.PI * 8;
    bevelGear.rotation.x = state.carrierReturnDrivePhase * Math.PI * 6;
  }

  function setTabGovernor(value) {
    state.tabGovernorPhase = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    tabGovernorGroup.rotation.x = state.tabGovernorPhase * Math.PI * 4;
  }

  function setTabStops(indices = []) {
    const normalized = [...new Set(
      (Array.isArray(indices) ? indices : [])
        .map(value => Math.round(Number(value)))
        .filter(value => Number.isFinite(value) && value > 0 && value < CANONICAL.nominalPositions)
    )].sort((a, b) => a - b);
    state.tabStopIndices = normalized;
    const active = new Set(normalized);
    tabStopMarkers.forEach((marker, index) => {
      marker.visible = active.has(index);
    });
  }

  function setTabStopAt(index, enabled = true) {
    const nextIndex = Math.round(Number(index));
    if (!Number.isFinite(nextIndex) || nextIndex <= 0 || nextIndex >= CANONICAL.nominalPositions) return false;
    const next = new Set(state.tabStopIndices);
    if (enabled) next.add(nextIndex);
    else next.delete(nextIndex);
    setTabStops([...next]);
    return true;
  }

  function setBackspaceLinkage(value) {
    state.backspaceLinkage = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    const pulse = Math.sin(state.backspaceLinkage * Math.PI);
    backspaceRack.position.x = backspaceRack.userData.baseX - pulse * 5.5;
    backspaceBellcrank.rotation.z = deg(-22 * pulse);
  }

  function setMarginInsets(leftColumns = 0, rightColumns = 0) {
    const maxCombinedInset = CANONICAL.nominalPositions - 1;
    const left = Math.max(0, Math.min(maxCombinedInset, Math.round(Number(leftColumns) || 0)));
    const requestedRight = Math.max(0, Math.min(maxCombinedInset, Math.round(Number(rightColumns) || 0)));
    const right = Math.min(requestedRight, maxCombinedInset - left);
    state.leftMarginInsetColumns = left;
    state.rightMarginInsetColumns = right;
    state.leftMarginX = -marginLimit + left * CANONICAL.pitchMm;
    state.rightMarginX = marginLimit - right * CANONICAL.pitchMm;
    marginStops.left.position.x = state.leftMarginX;
    marginStops.right.position.x = state.rightMarginX;
  }

  function setCarrierX(x) {
    state.carrierX = THREE.MathUtils.clamp(x, -CANONICAL.writingLineMm / 2, CANONICAL.writingLineMm / 2);
    carrierMotion.position.x = state.carrierX;
    updateSelectionTapes();
    updateCordGeometry(state.carrierX);
  }

  function applyTypeElementOrientation() {
    updateSelectionDrive(state.tiltBand, state.rotateUnit);
    const rotateSlotStepDegP4 = 360 / CANONICAL.typeElement.positionsPerBand;
    typeElement.rotation.x = -typeBandNormalTiltRadP4(state.tiltBand);
    // 22 structural positions around each band = 11 base rotate coordinates plus the
    // independent 180° shift hemisphere. The public key-to-slot assignment remains P5,
    // but the visible ball now lands on the same structural lattice as its 88 slug cues.
    typeElement.rotation.y = deg(
      TYPE_PRINT_FACING_OFFSET_DEG_P4 -
      state.rotateUnit * rotateSlotStepDegP4 +
      state.shiftAngleDeg
    );
  }

  function setTypeball(tiltBand, rotateUnit, shiftHemisphere = state.shiftHemisphere) {
    state.tiltBand = THREE.MathUtils.clamp(tiltBand, 0, 3);
    state.rotateUnit = THREE.MathUtils.clamp(rotateUnit, -5, 5);
    state.shiftHemisphere = shiftHemisphere ? 1 : 0;
    state.shiftAngleDeg = state.shiftHemisphere * 180;
    applyTypeElementOrientation();
    updateSelectionTapes();
  }

  function setShiftTransition(fromHemisphere, toHemisphere, progress) {
    const from = fromHemisphere ? 1 : 0;
    const to = toHemisphere ? 1 : 0;
    const t = THREE.MathUtils.clamp(Number(progress) || 0, 0, 1);
    state.shiftAngleDeg = THREE.MathUtils.lerp(from * 180, to * 180, t);
    if (t >= 1) state.shiftHemisphere = to;
    applyTypeElementOrientation();
    updateSelectionTapes();
  }

  function ribbonLiftScaleForMode(mode = state.ribbonPrintMode) {
    if (mode === 'stencil') return 0;
    if (mode === 'low') return 0.62;
    if (mode === 'high') return 1;
    return 0.82;
  }

  function setRibbonMode(mode) {
    const allowed = ['stencil', 'low', 'middle', 'high'];
    const next = allowed.includes(mode) ? mode : 'middle';
    state.ribbonPrintMode = next;
    setRibbonLift(state.ribbonLiftCommand);
    applyRibbonFeedSelection();
    return next;
  }

  function setRibbonLoadState(active) {
    state.ribbonLoadState = Boolean(active);
    setRibbonLift(state.ribbonLiftCommand);
    return state.ribbonLoadState;
  }

  function setRibbonLift(value) {
    state.ribbonLiftCommand = THREE.MathUtils.clamp(value, 0, 1);
    state.ribbonLiftFollowerP5 = state.ribbonLiftCommand;

    // Threading/load is deliberately a separate service pose above the highest print lift.
    // Its amplitude is P5 because the OEM geometry source establishes ordering, not height.
    state.ribbonLift = state.ribbonLoadState
      ? 1.24
      : state.ribbonLiftCommand * ribbonLiftScaleForMode();

    // P4 follower/bellcrank geometry with P5 throw. This is the visible causal bridge from the
    // rotating sleeve cam to the carrier-local vibrator; exact IBM lever lengths remain unresolved.
    ribbonLiftFollower.position.y = ribbonLiftFollowerBaseYP4 + state.ribbonLiftFollowerP5 * 4.4;
    ribbonLiftBellcrank.rotation.x = deg(-18 * state.ribbonLiftFollowerP5);
    updateRibbonPath(state.ribbonLift);
  }

  function ribbonLiftFromSleevePhaseP5(phase) {
    const t = THREE.MathUtils.clamp(Number(phase) || 0, 0, 1);
    if (t < 0.43) return 0;
    if (t < 0.54) return THREE.MathUtils.clamp((t - 0.43) / 0.11, 0, 1);
    if (t < 0.66) return 1;
    if (t < 0.91) return THREE.MathUtils.clamp(1 - (t - 0.66) / 0.25, 0, 1);
    return 0;
  }

  function applyRibbonFeedSelection(direction = state.ribbonFeedDirection) {
    if (state.ribbonPrintMode === 'stencil') {
      feedPawl.position.x = 0;
      detentLever.position.x = 0;
      return;
    }
    const d = direction >= 0 ? 1 : -1;
    feedPawl.position.x = d * ribbonPawlTargetXP5;
    detentLever.position.x = d * 2.5;
  }

  function applyRibbonFeedCamStrokeP5(value) {
    const stroke = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    state.ribbonFeedCamFollowerP5 = stroke;
    state.ribbonFeedStrokeP5 = stroke;

    // P4 follower/bellcrank geometry, with a P5 throw envelope. The combined 1164240 cam is
    // the single visible source of both the detent action and the ribbon-feed stroke.
    ribbonFeedFollower.position.set(
      ribbonFeedFollowerBaseP4.x,
      ribbonFeedFollowerBaseP4.y + stroke * 3.2,
      ribbonFeedFollowerBaseP4.z + stroke * 3.2
    );
    ribbonFeedBellcrank.rotation.x = deg(-17 * stroke);
    feedPlate.position.z = -45 + stroke * 2.5;
    feedPawl.rotation.z = deg(12 + stroke * 8);
  }

  function ribbonFeedStrokeFromSleevePhaseP5(phase) {
    const t = THREE.MathUtils.clamp(Number(phase) || 0, 0, 1);
    const feedCommitPhaseP5 = 0.43 + 0.11 * 0.35;
    const feedRestorePhaseP5 = 0.60;
    if (t < 0.43) return 0;
    if (t < feedCommitPhaseP5) {
      return THREE.MathUtils.clamp((t - 0.43) / (feedCommitPhaseP5 - 0.43), 0, 1);
    }
    if (t < feedRestorePhaseP5) {
      return THREE.MathUtils.clamp((feedRestorePhaseP5 - t) / (feedRestorePhaseP5 - feedCommitPhaseP5), 0, 1);
    }
    return 0;
  }

  function setRibbonReversePhase(value) {
    if (state.ribbonReverseState !== 'reversing') {
      state.ribbonReversePhase = 0;
      reverseTriggers.forEach(trigger => {
        trigger.rotation.z = trigger.userData.baseRotationZ;
      });
      feedPlate.position.x = 0;
      feedPlate.rotation.y = 0;
      applyRibbonFeedSelection();
      return false;
    }

    const t = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    const eased = t * t * (3 - 2 * t);
    const directionBefore = state.ribbonFeedDirection;
    const supplyTriggerIndex = directionBefore > 0 ? 0 : 1;
    state.ribbonReversePhase = t;

    reverseTriggers.forEach((trigger, index) => {
      const active = index === supplyTriggerIndex ? eased : 0;
      const outward = index === 0 ? -1 : 1;
      trigger.rotation.z = trigger.userData.baseRotationZ + deg(outward * 34 * active);
    });

    // P5 amplitudes embody the OEM sequence: one plate side is restricted, the other
    // continues forward, the plate pivots sideways, and the pawl transfers ratchets.
    feedPlate.position.x = directionBefore * 5.5 * eased;
    feedPlate.rotation.y = deg(-directionBefore * 9 * eased);
    feedPawl.position.x = THREE.MathUtils.lerp(
      directionBefore * ribbonPawlTargetXP5,
      -directionBefore * ribbonPawlTargetXP5,
      eased
    );
    detentLever.position.x = THREE.MathUtils.lerp(directionBefore * 2.5, -directionBefore * 2.5, eased);

    if (t < 1) return false;

    state.ribbonFeedDirection = -directionBefore;
    state.ribbonFeedStrokeInDirection = 0;
    state.ribbonReverseCount += 1;
    state.ribbonReverseState = 'feeding';
    state.ribbonReversePhase = 0;
    reverseTriggers.forEach(trigger => {
      trigger.rotation.z = trigger.userData.baseRotationZ;
    });
    feedPlate.position.x = 0;
    feedPlate.rotation.y = 0;
    applyRibbonFeedSelection();
    return true;
  }

  function feedRibbon() {
    if (state.ribbonPrintMode === 'stencil') {
      state.ribbonFeedSuppressedCount += 1;
      return false;
    }
    state.ribbonFeedStep += 1;
    state.ribbonFeedApproxRatchetTeeth += 2.5;
    state.ribbonFeedStrokeInDirection += 1;
    if (state.ribbonFeedDirection > 0) {
      state.ribbonSpoolFillP5[0] = Math.max(ribbonFillMinP5, state.ribbonSpoolFillP5[0] - ribbonFillStepP5);
      state.ribbonSpoolFillP5[1] = Math.min(ribbonFillMaxP5, state.ribbonSpoolFillP5[1] + ribbonFillStepP5);
    } else {
      state.ribbonSpoolFillP5[0] = Math.min(ribbonFillMaxP5, state.ribbonSpoolFillP5[0] + ribbonFillStepP5);
      state.ribbonSpoolFillP5[1] = Math.max(ribbonFillMinP5, state.ribbonSpoolFillP5[1] - ribbonFillStepP5);
    }
    updateRibbonSpoolFillVisuals();
    updateRibbonPath(state.ribbonLift);
    const presentationStep = 0.17 * state.ribbonFeedDirection;
    ribbonSpools[0].rotation.y -= presentationStep;
    ribbonSpools[1].rotation.y += presentationStep;
    ribbonRatchets[0].rotation.y -= presentationStep * 1.8;
    ribbonRatchets[1].rotation.y += presentationStep * 1.8;
    // Pawl/plate stroke is driven continuously from the 1164240 sleeve-cam phase. This commit
    // only advances the ratchet/spools and records transport state.
    applyRibbonFeedSelection();

    if (
      state.ribbonReverseState === 'feeding' &&
      state.ribbonFeedStrokeInDirection >= state.ribbonReverseThresholdStepsP5
    ) {
      state.ribbonReverseState = 'reversing';
      state.ribbonReversePhase = 0;
    }
    return true;
  }

  function primeRibbonAutoReverse() {
    if (state.ribbonReverseState !== 'feeding') return false;
    state.ribbonFeedStrokeInDirection = Math.max(0, state.ribbonReverseThresholdStepsP5 - 1);
    if (state.ribbonFeedDirection > 0) {
      state.ribbonSpoolFillP5 = [ribbonFillMinP5 + ribbonFillStepP5, ribbonFillMaxP5 - ribbonFillStepP5];
    } else {
      state.ribbonSpoolFillP5 = [ribbonFillMaxP5 - ribbonFillStepP5, ribbonFillMinP5 + ribbonFillStepP5];
    }
    updateRibbonSpoolFillVisuals();
    updateRibbonPath(state.ribbonLift);
    return true;
  }

  function resetRibbonTransport() {
    state.ribbonFeedStep = 0;
    state.ribbonFeedApproxRatchetTeeth = 0;
    state.ribbonFeedCamFollowerP5 = 0;
    state.ribbonFeedStrokeP5 = 0;
    state.ribbonFeedDirection = 1;
    state.ribbonFeedStrokeInDirection = 0;
    state.ribbonSpoolFillP5 = [ribbonFillMaxP5, ribbonFillMinP5];
    state.ribbonReverseCount = 0;
    state.ribbonReversePhase = 0;
    state.ribbonReverseState = 'feeding';
    state.ribbonFeedSuppressedCount = 0;
    ribbonSpools.forEach(spool => { spool.rotation.y = 0; });
    ribbonRatchets.forEach(ratchet => { ratchet.rotation.y = 0; });
    feedPlate.position.x = 0;
    feedPlate.rotation.y = 0;
    applyRibbonFeedCamStrokeP5(0);
    reverseTriggers.forEach(trigger => {
      trigger.rotation.z = trigger.userData.baseRotationZ;
    });
    updateRibbonSpoolFillVisuals();
    updateRibbonPath(state.ribbonLift);
    applyRibbonFeedSelection();
  }

  function applyFineAlignment(tiltValue, rotateValue, followerLiftValue) {
    state.tiltDetent = THREE.MathUtils.clamp(Number(tiltValue) || 0, 0, 1);
    state.rotateDetent = THREE.MathUtils.clamp(Number(rotateValue) || 0, 0, 1);
    state.detentFollowerLiftP5 = THREE.MathUtils.clamp(Number(followerLiftValue) || 0, 0, 1);

    // P5 motion amplitudes only. Source-backed requirement is ordering/contact role, not these angles.
    // The shared follower rises with the reconstructed 1164240 cam envelope. Tilt takes up first;
    // rotate follows through explicit lost motion instead of the two detents having separate drivers.
    tiltDetentPivot.rotation.x = deg(24 * state.tiltDetent);
    rotateDetentPivot.rotation.x = deg(26 * state.rotateDetent);
    detentFollower.position.y = detentFollowerBaseYP4 + state.detentFollowerLiftP5 * 5;
  }

  function setFineAlignment(tiltValue, rotateValue = tiltValue) {
    const tilt = THREE.MathUtils.clamp(Number(tiltValue) || 0, 0, 1);
    const rotate = THREE.MathUtils.clamp(Number(rotateValue) || 0, 0, 1);
    applyFineAlignment(tilt, rotate, Math.max(tilt, rotate));
  }

  function fineAlignmentFromSleevePhaseP5(phase) {
    const t = THREE.MathUtils.clamp(Number(phase) || 0, 0, 1);
    if (t < 0.43) return { driver: 0, tilt: 0, rotate: 0 };
    if (t < 0.54) {
      const driver = THREE.MathUtils.clamp((t - 0.43) / 0.11, 0, 1);
      return {
        driver,
        tilt: THREE.MathUtils.clamp(driver / 0.58, 0, 1),
        rotate: THREE.MathUtils.clamp((driver - 0.20) / 0.62, 0, 1)
      };
    }
    if (t < 0.66) return { driver: 1, tilt: 1, rotate: 1 };
    if (t < 0.91) {
      const driver = THREE.MathUtils.clamp(1 - (t - 0.66) / 0.25, 0, 1);
      return {
        driver,
        tilt: THREE.MathUtils.clamp((driver - 0.34) / 0.66, 0, 1),
        rotate: THREE.MathUtils.clamp((driver - 0.46) / 0.54, 0, 1)
      };
    }
    return { driver: 0, tilt: 0, rotate: 0 };
  }

  function setPrintApproach(value) {
    state.printApproach = THREE.MathUtils.clamp(value, 0, 1);
    state.printCamFollowerLiftP5 = state.printApproach;
    const poweredBoundary = 0.90;
    let angleDeg;
    if (state.printApproach <= poweredBoundary) {
      angleDeg = THREE.MathUtils.lerp(
        0,
        P4.printRocker.poweredEndpointAngleDeg,
        state.printApproach / poweredBoundary
      );
    } else {
      angleDeg = THREE.MathUtils.lerp(
        P4.printRocker.poweredEndpointAngleDeg,
        P4.printRocker.impactAngleDeg,
        (state.printApproach - poweredBoundary) / (1 - poweredBoundary)
      );
    }

    // P4 follower/bellcrank geometry carries the 1124174 cam output to the rocker. The cam
    // envelope is P5 while the service-clearance endpoints remain independently constrained.
    printCamFollower.position.y = printCamFollowerBaseYP4 + state.printCamFollowerLiftP5 * 5.2;
    printFollowerBellcrank.rotation.x = deg(-21 * state.printCamFollowerLiftP5);
    rocker.rotation.x = deg(angleDeg);
  }

  function printApproachFromSleevePhaseP5(phase) {
    const t = THREE.MathUtils.clamp(Number(phase) || 0, 0, 1);
    if (t < 0.43) return 0;
    if (t < 0.54) {
      const driver = THREE.MathUtils.clamp((t - 0.43) / 0.11, 0, 1);
      return driver * 0.55;
    }
    if (t < 0.66) {
      const driver = THREE.MathUtils.clamp((t - 0.54) / 0.12, 0, 1);
      return 0.55 + driver * 0.45;
    }
    if (t < 0.91) return THREE.MathUtils.clamp(1 - (t - 0.66) / 0.25, 0, 1);
    return 0;
  }

  function applyFeedRollRotation() {
    rearFeedRollers.forEach(roller => { roller.rotation.x = state.feedRollPhaseRad; });
    frontFeedRollers.forEach(roller => { roller.rotation.x = -state.feedRollPhaseRad; });
  }

  function advanceFeedRollersFromPaper(deltaPaperMm) {
    // Roller radius is reconstructed P4. Accumulation matters because a released sheet can be
    // manually repositioned without turning the disengaged feed rolls.
    state.feedRollPhaseRad += (Number(deltaPaperMm) || 0) / 6.2;
    applyFeedRollRotation();
  }

  function advanceBailRollersFromPaper(deltaPaperMm) {
    if (!state.paperBailEngaged) return;
    // Bail-roller radius is reconstructed P4. Accumulate only while the bail is actually against
    // the sheet so releasing/re-engaging it does not teleport its visible phase.
    state.bailRollPhaseRad -= (Number(deltaPaperMm) || 0) / 5.5;
    Object.values(paperBailRollers).forEach(roller => {
      roller.rotation.x = state.bailRollPhaseRad;
    });
  }

  function setPaperRelease(released) {
    state.feedRollsEngaged = !Boolean(released);
    const release = state.feedRollsEngaged ? 0 : 1;
    rearFeedRollers.forEach(roller => {
      roller.position.y = roller.userData.baseY - release * 4.5;
      roller.position.z = roller.userData.baseZ - release * 4.0;
    });
    frontFeedRollers.forEach(roller => {
      roller.position.y = roller.userData.baseY - release * 4.5;
      roller.position.z = roller.userData.baseZ + release * 4.0;
    });
    frontReleaseArms.forEach(arm => {
      arm.rotation.x = arm.userData.baseRotationX + deg(18 * release);
    });
    rearReleaseArms.forEach(arm => {
      arm.rotation.x = arm.userData.baseRotationX - deg(16 * release);
    });
    feedRollActuatingShaft.rotation.x = deg(24 * release);
    paperReleasePivot.rotation.x = deg(-32 * release);
  }

  function setPaperBail(engaged) {
    state.paperBailEngaged = Boolean(engaged);
    paperBailPivot.rotation.x = state.paperBailEngaged ? 0 : deg(31);
  }

  function repositionPaperManually(deltaMm) {
    if (state.feedRollsEngaged) return false;
    const delta = Number(deltaMm) || 0;
    if (!delta) return false;
    state.paperAdvanceMm += delta;
    state.manualPaperAlignmentMmP5 += delta;
    paper.setAdvance(state.paperAdvanceMm);
    // The released feed rolls remain stationary. Bail rollers are separate passive contacts and
    // follow sheet motion only when the bail itself is against the platen.
    advanceBailRollersFromPaper(delta);
    return true;
  }

  function setPaperBailRollerPosition(side, value) {
    if (side !== 'left' && side !== 'right') return false;
    const normalized = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    state.paperBailRollerPositionsP5[side] = normalized;
    // The sources establish independent lateral adjustability, not exact travel limits.
    // Keep each roller on its own half of the bail bar with explicitly P5 endpoints.
    const magnitude = THREE.MathUtils.lerp(110, 20, normalized);
    paperBailRollers[side].position.x = side === 'left' ? -magnitude : magnitude;
    return true;
  }

  function setCopyControl(setting) {
    const next = Math.max(0, Math.min(4, Math.round(Number(setting) || 0)));
    state.copyControlSetting = next;
    // Only the discrete topology and rearward direction are sourced. These display offsets are P5.
    state.copyControlOffsetZ = next === 0 ? 0 : -next * 2.2;
    paperFeedCarriage.position.z = state.copyControlOffsetZ;
    copyControlLeverPivot.rotation.x = deg(-next * 8);
    copyControlRotor.rotation.x = deg(next * 12);
    copyControlDetentMarkers.forEach((marker, index) => {
      const scale = index === next ? 1.35 : 1;
      marker.scale.set(scale, scale, scale);
    });
  }

  function setPlatenVariable(engaged) {
    state.platenVariableEngaged = Boolean(engaged);
  }

  function rotatePlatenManually(delta) {
    if (!state.platenVariableEngaged) return false;
    const rotation = Number(delta) || 0;
    state.manualPlatenAngle += rotation;
    setPlatenPhysicalAngle(state.platenIndex + state.manualPlatenAngle);
    if (state.feedRollsEngaged) {
      const deltaPaperMm = rotation * CANONICAL.platen.radiusMm;
      state.paperAdvanceMm += deltaPaperMm;
      paper.setAdvance(state.paperAdvanceMm);
      advanceFeedRollersFromPaper(deltaPaperMm);
      advanceBailRollersFromPaper(deltaPaperMm);
    }
    return true;
  }

  function resetPlatenVariableOffset() {
    state.manualPlatenAngle = 0;
    setPlatenPhysicalAngle(state.platenIndex);
  }

  function setLineSpacingMode(value) {
    state.lineSpacingTeeth = Number(value) === 2 ? 2 : 1;
    // Source material establishes a selector that switches one-vs-two ratchet-tooth indexing.
    // Exact external lever coordinates/travel remain unresolved, so only the mode distinction is causal;
    // this visible selector angle is explicitly P5.
    lineSpacingSelectorPivot.rotation.z = deg(state.lineSpacingTeeth === 2 ? 13 : -13);
    lineSpacingSelectorLink.position.y = state.lineSpacingTeeth === 2 ? 4.5 : 2;
    return state.lineSpacingTeeth;
  }

  function setIndexPawlPhase(value) {
    const t = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    const strokeScaleP5 = state.lineSpacingTeeth === 2 ? 1.24 : 1;
    indexPawl.rotation.x = indexPawl.userData.baseRotationX + deg(28 * strokeScaleP5 * Math.sin(t * Math.PI));
  }

  function setPlatenIndex(value) {
    const next = Number(value) || 0;
    const delta = next - state.platenIndex;
    state.platenIndex = next;
    setPlatenPhysicalAngle(next + state.manualPlatenAngle);
    ratchetGroup.rotation.x = next;
    if (state.feedRollsEngaged) {
      const deltaPaperMm = delta * CANONICAL.platen.radiusMm;
      state.paperAdvanceMm += deltaPaperMm;
      paper.setAdvance(state.paperAdvanceMm);
      advanceFeedRollersFromPaper(deltaPaperMm);
      advanceBailRollersFromPaper(deltaPaperMm);
    }
  }

  function setMotorPhase(value) {
    state.motorPhase = ((Number(value) || 0) % 1 + 1) % 1;
    operationalRotor.rotation.x = state.motorPhase * Math.PI * 2;
    motorDriveRotor.rotation.x = state.motorPhase * Math.PI * 2;
    cycleDriveRotor.rotation.x = state.motorPhase * Math.PI * 2 / CANONICAL.drive.positiveBeltReduction;
    updateDriveBeltMarkers();
  }

  function setOperationalCam(action, phase = 0) {
    state.operationalCamAction = action || 'rest';
    state.operationalCamPhase = THREE.MathUtils.clamp(Number(phase) || 0, 0, 1);
    doubleServiceCam.rotation.x = 0;
    returnIndexCam.rotation.x = 0;
    shiftCam.rotation.x = 0;
    state.operationalFollowerLiftP5.spaceBackspace = 0;
    state.operationalFollowerLiftP5.returnIndex = 0;
    state.operationalFollowerLiftP5.shift = 0;

    if (action === 'space' || action === 'backspace') {
      doubleServiceCam.rotation.x = state.operationalCamPhase * Math.PI;
      state.operationalFollowerLiftP5.spaceBackspace = followerLiftFromCamContactP4(
        doubleServiceCamBaseRadiusP4,
        doubleServiceCamLobesP4,
        doubleServiceCam.rotation.x
      );
    } else if (action === 'carrier-return' || action === 'index') {
      returnIndexCam.rotation.x = state.operationalCamPhase * Math.PI * 2;
      state.operationalFollowerLiftP5.returnIndex = followerLiftFromCamContactP4(
        returnIndexCamBaseRadiusP4,
        returnIndexCamLobesP4,
        returnIndexCam.rotation.x
      );
    } else if (action === 'shift') {
      shiftCam.rotation.x = state.operationalCamPhase * Math.PI;
      state.operationalFollowerLiftP5.shift = followerLiftFromCamContactP4(
        shiftCamBaseRadiusP4,
        shiftCamLobesP4,
        shiftCam.rotation.x
      );
    }

    applyOperationalFollowerLift(
      spaceBackspaceFollower,
      state.operationalFollowerLiftP5.spaceBackspace
    );
    applyOperationalFollowerLift(
      returnIndexFollower,
      state.operationalFollowerLiftP5.returnIndex
    );
    applyOperationalFollowerLift(
      shiftFollower,
      state.operationalFollowerLiftP5.shift
    );

    // The backspace rack and index pawl are follower outputs, not independent animation tracks.
    // Shift and carrier return deliberately remain separate downstream mechanisms: shift is
    // over-center, while carrier return latches a sustained drive after its finite cam trigger.
    setBackspaceLinkage(action === 'backspace' ? state.operationalCamPhase : 0);
    setIndexPawlPhase(action === 'index' ? state.operationalCamPhase : 0);
  }

  function setCyclePhase(value) {
    state.cyclePhase = THREE.MathUtils.clamp(value, 0, 1);
    cycleRotor.rotation.x = state.cyclePhase * Math.PI;
    filterShaftRotor.rotation.x = state.cyclePhase * Math.PI;
    printShaftRotor.rotation.x = state.cyclePhase * Math.PI * 2;
    printSleeveRotor.rotation.x = state.cyclePhase * Math.PI * 2;

    // Fine alignment is now a downstream output of the rotating print sleeve / 1164240 cam.
    // Timing remains explicit P5 because exact IBM event angles are not yet sourced.
    const fineAlignment = fineAlignmentFromSleevePhaseP5(state.cyclePhase);
    applyFineAlignment(fineAlignment.tilt, fineAlignment.rotate, fineAlignment.driver);
    applyRibbonFeedCamStrokeP5(ribbonFeedStrokeFromSleevePhaseP5(state.cyclePhase));
    setRibbonLift(ribbonLiftFromSleevePhaseP5(state.cyclePhase));
    setPrintApproach(printApproachFromSleevePhaseP5(state.cyclePhase));
  }

  function setServiceCover(value) {
    state.serviceCoverOpen = THREE.MathUtils.clamp(value, 0, 1);
    serviceCoverPivot.rotation.x = deg(-52) * state.serviceCoverOpen;
  }

  function setInspectionCutaway(mode = 'none') {
    state.inspectionCutaway = mode === 'powerframe' ? 'powerframe' : 'none';
    const isolatePowerframe = state.inspectionCutaway === 'powerframe';
    shellAssembly.visible = !isolatePowerframe;
    baseShellAssembly.visible = !isolatePowerframe;
    keyboardAssembly.visible = !isolatePowerframe;
  }

  function setExplosion(value) {
    state.explosion = THREE.MathUtils.clamp(value, 0, 1);
    assemblies.forEach(group => setAssemblyExplosion(group, state.explosion));
  }

  function stampCharacter(character) {
    // Stencil mode deliberately moves the ribbon out of the print point. The mechanical
    // impact still occurs, but an ordinary paper output texture should not receive an ink mark.
    if (state.ribbonPrintMode === 'stencil') return false;
    paper.stamp(character, state.carrierX, state.paperAdvanceMm);
    return true;
  }

  function clearPaper() {
    state.paperAdvanceMm = 0;
    state.manualPaperAlignmentMmP5 = 0;
    state.feedRollPhaseRad = 0;
    state.bailRollPhaseRad = 0;
    paper.setAdvance(0);
    applyFeedRollRotation();
    Object.values(paperBailRollers).forEach(roller => {
      roller.rotation.x = 0;
    });
    paper.clear();
  }

  function geometryDiagnostics() {
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    bounds.getSize(size);
    const indicatorWorld = new THREE.Vector3();
    writingPositionIndicator.getWorldPosition(indicatorWorld);
    const selectedStructuralSlotP4 = (
      (state.rotateUnit + state.shiftHemisphere * 11) % CANONICAL.typeElement.positionsPerBand +
      CANONICAL.typeElement.positionsPerBand
    ) % CANONICAL.typeElement.positionsPerBand;
    const selectedSlugWorldNormalP4 = typeSlugNormalP4(state.tiltBand, selectedStructuralSlotP4)
      .applyEuler(typeElement.rotation)
      .normalize();
    const selectedSlugFaceWorldP4 = typeElement.localToWorld(
      typeSlugFaceCenterP4(state.tiltBand, selectedStructuralSlotP4)
    );
    const platenCenterWorldP4 = new THREE.Vector3();
    platen.getWorldPosition(platenCenterWorldP4);
    const platenFrontSurfaceZP4 = platenCenterWorldP4.z + CANONICAL.platen.radiusMm;
    const selectedSlugPlatenClearanceAlongZMmP4 = selectedSlugFaceWorldP4.z - platenFrontSurfaceZP4;
    const printFacingTargetP4 = new THREE.Vector3(0, 0, -1);
    const selectedSlugAlignmentDotP4 = THREE.MathUtils.clamp(
      selectedSlugWorldNormalP4.dot(printFacingTargetP4),
      -1,
      1
    );
    const selectedSlugAlignmentErrorDegP4 = THREE.MathUtils.radToDeg(Math.acos(selectedSlugAlignmentDotP4));
    return {
      revision: 'selectric-integrated-public-build',
      finite: [size.x, size.y, size.z].every(Number.isFinite),
      bounds: { width: size.x, height: size.y, depth: size.z },
      carrierX: state.carrierX,
      writingPositionIndicator: {
        carrierParented: writingPositionIndicator.parent === carrierMotion,
        worldX: indicatorWorld.x,
        localX: writingPositionIndicator.position.x,
        role: 'carrier position pointer over the fixed writing-position rule'
      },
      pitchMm: CANONICAL.pitchMm,
      writingLineMm: CANONICAL.writingLineMm,
      explosion: state.explosion,
      explosionTopology: {
        outerShellSeparateFromBase: true,
        outerShellVectorP5: {
          x: shellAssembly.userData.explodeVector.x,
          y: shellAssembly.userData.explodeVector.y,
          z: shellAssembly.userData.explodeVector.z
        },
        baseShellVectorP5: {
          x: baseShellAssembly.userData.explodeVector.x,
          y: baseShellAssembly.userData.explodeVector.y,
          z: baseShellAssembly.userData.explodeVector.z
        },
        separationClass: 'P5 inspection explosion: outer shell lifts up/rear while broad base drops away so neither is used as a moving mechanical state'
      },
      serviceCoverOpen: state.serviceCoverOpen,
      inspectionCutaway: {
        mode: state.inspectionCutaway,
        shellVisible: shellAssembly.visible,
        baseShellVisible: baseShellAssembly.visible,
        keyboardVisible: keyboardAssembly.visible,
        powerframeIsolationClass: 'P5 inspection-only outer-shell + base-shell + keyboard occluder removal; mechanical geometry and assembly coordinates unchanged'
      },
      explosionClass: 'P5 assembly-separation presentation; not service motion',
      pickableCount: pickables.length,
      supportTopology: 'D6 front + Level-2 upper/lower rack shoes',
      primarySideframeCount: primarySideframes.length,
      primarySideframeWindowCountEach: primarySideframes[0].geometry.userData.p4WindowCount,
      primarySideframeClass: primarySideframes[0].geometry.userData.p4PrimarySideframeClass,
      primarySideframesWindowed: true,
      lowerShaftBearingBossCountP4: lowerShaftBearingBosses.length,
      lowerShaftBearingBossClass: 'P4 sideframe-local cycle/operational shaft bearing bosses aligned to the reconstructed shaft axes; exact IBM bearing parts/sections unresolved',
      carrierEmbodiment: 'open P4 frame with windowed chamfered side plates and crossmembers; not a solid presentation block',
      carrierSidePlateCount: carrierSidePlates.length,
      carrierSidePlateClass: carrierSidePlates[0].geometry.userData.p4CarrierPlateClass,
      carrierSidePlateWindowed: true,
      shellTopology: 'extruded rounded side-cheek profile + clearance-nested hinged hood ending ahead of platen',
      serviceCoverFitP4: {
        cheekInnerXP4: shellCheekInnerXP4,
        cheekBevelInsetP4: shellCheekBevelInsetP4,
        hoodMaxHalfWidthP4: Math.max(...serviceCoverStationsP4.map(station => station.halfWidth)),
        sideClearanceMmP4:
          shellCheekInnerXP4 -
          shellCheekBevelInsetP4 -
          Math.max(...serviceCoverStationsP4.map(station => station.halfWidth)),
        overlapRepairClass: 'P4 hood-to-cheek clearance repair; closed hood no longer occupies the fixed cheek bevel volume, exact industrial-design seam width unresolved'
      },
      keyboardActuation: {
        character: state.keyboardPressCharacter,
        depression: state.keyboardPress,
        keycapClass: keyMeshes.values().next().value?.userData.keycapClass ?? 'unresolved',
        travelClass: 'P5 presentation preserving keypress-before-code-sampling order'
      },
      keyboardCodeChannels: 6,
      keyboardCode: state.keyboardCode,
      selectorInputs: { ...state.selectorInputs },
      selectionNormalized: { ...state.selectionNormalized },
      typeElement: {
        characterCount: CANONICAL.typeElement.characterCount,
        bands: CANONICAL.typeElement.bands,
        positionsPerBand: CANONICAL.typeElement.positionsPerBand,
        overallNominalDiameterMm: CANONICAL.typeElement.overallNominalDiameterMm,
        structuralRadiusP4Mm: CANONICAL.typeElement.structuralRadiusP4Mm,
        topCapRadiusP4Mm: TYPE_TOP_CAP_RADIUS_P4_MM,
        topCapCenterYP4Mm: TYPE_TOP_CAP_CENTER_Y_P4_MM,
        topCapAndLatchPresentation: true,
        slugFinishClass: 'chrome-like raised structural cues continuous with the element shell rather than black checkerboard blocks',
        slugSectionClass: typeElement.userData.slugSectionP4.class,
        slugSectionP4: { ...typeElement.userData.slugSectionP4 },
        slugOrientation: 'P4 surface-normal tangent frames on structural ellipsoid',
        rotateSlotStepDegP4: 360 / CANONICAL.typeElement.positionsPerBand,
        bandLatitudesP4: [...TYPE_BAND_LATITUDES_P4],
        bandTiltAnglesDegP4: TYPE_BAND_LATITUDES_P4.map((_, band) => -THREE.MathUtils.radToDeg(typeBandNormalTiltRadP4(band))),
        orientationDegP4: {
          tilt: THREE.MathUtils.radToDeg(typeElement.rotation.x),
          rotate: THREE.MathUtils.radToDeg(typeElement.rotation.y)
        },
        selectedStructuralSlotP4,
        selectedSlugAlignmentErrorDegP4,
        selectedSlugFacingVectorP4: {
          x: selectedSlugWorldNormalP4.x,
          y: selectedSlugWorldNormalP4.y,
          z: selectedSlugWorldNormalP4.z
        },
        selectedSlugFaceWorldP4: {
          x: selectedSlugFaceWorldP4.x,
          y: selectedSlugFaceWorldP4.y,
          z: selectedSlugFaceWorldP4.z
        },
        printFacingOffsetDegP4: TYPE_PRINT_FACING_OFFSET_DEG_P4,
        printFacingTarget: '-Z toward platen in the public reconstruction coordinate frame',
        selectionOrientationClass: 'P4 structural lattice alignment and print-facing anchor; exact keyboard/typeball glyph assignment remains P5',
        glyphFaceGeometry: 'unresolved; repeated structural slug cues only'
      },
      selectionDifferential: {
        tiltEquation: 'qTilt=(T1+2*T2)/3',
        rotateQ1Equation: 'q1=(R1+2*R2)/3',
        rotateQ2Equation: 'q2=(3*q1+2*R2A)/5',
        signedEquation: 'qSigned=q2-fiveUnit',
        rotateUnitsEquation: 'rotateUnits=5*qSigned',
        tapeCarrierInvariantErrorMm: selectionTapeInvariantError(),
        tapePresentation: {
          crossSection: 'P4 flat strip rather than round cord',
          widthMmP4: selectionTapeP4.widthMm,
          thicknessMmP4: selectionTapeP4.thicknessMm,
          stationaryGuidePulleys: 4,
          carrierGuidePulleys: carrierTapeGuides.length,
          tiltSideGuideX: selectionTapeP4.tilt.sideX,
          rotateSideGuideX: selectionTapeP4.rotate.sideX,
          tiltCarrierHalfSpan: selectionTapeP4.tilt.carrierHalfSpan,
          rotateCarrierHalfSpan: selectionTapeP4.rotate.carrierHalfSpan,
          tangentLaneOffsetsApplied: true,
          geometryClass: 'P4 explicit non-intersecting guide lanes; source-backed tape identities and differential ratios preserved, exact production sheave coordinates unresolved'
        }
      },
      cordPhase: state.cordPhase,
      writingLineRacks: ['1124109 escapement', '1164743 margin', '1164102/6519354 tab'],
      returnTabDrive: {
        carrierReturnFiniteTriggerThenSustained: true,
        carrierReturnSpringClutch: true,
        carrierReturnDrivePhase: state.carrierReturnDrivePhase,
        tabPropulsion: 'mainspring',
        tabGovernorReference: 'operational-shaft',
        tabGovernorPropulsion: false,
        tabGovernorPhase: state.tabGovernorPhase,
        tabStopsProgrammable: true,
        tabStopIndices: [...state.tabStopIndices],
        defaultTabStopClass: 'P5 every-eight-column startup presentation; runtime set/clear is live',
        exactSetClearLinkage: 'unresolved'
      },
      cordSystem: {
        commonEscapementShaft: true,
        opposedDrumWinding: true,
        mainspringSuppliesRightwardCarrierEnergy: true,
        rightTensionArmSpiralSprings: 2,
        tensionArmAngleDeg: state.tensionArmAngleDeg,
        tensionArmSweepRangeDegP4: [...tensionArmSweepRangeDegP4],
        effectiveDrumPayoutRatioP4: escapementCordDrumPayoutRatioP4,
        freeSpanMmP4: escapementCordFreeSpanMmP4(state.carrierX, tensionArm.rotation.x),
        referenceSpanMmP4: escapementCordReferenceSpanMmP4,
        compensatedLengthErrorMmP4: compensatedEscapementCordErrorMmP4(
          state.carrierX,
          tensionArm.rotation.x
        ),
        pulleyContactRoutingP4: true,
        escapementWrapAnglesDegP4: [...state.escapementCordWrapAnglesDegP4],
        returnWrapAnglesDegP4: [...state.returnCordWrapAnglesDegP4],
        escapementTangentOrthogonalityErrorMmP4: state.escapementCordTangentErrorMmP4,
        returnTangentOrthogonalityErrorMmP4: state.returnCordTangentErrorMmP4,
        cordPathClass: 'P4 tangent-to-rim routing with sampled minor wrap arcs around the visible guide/tension pulleys; exact IBM groove lanes, wrap direction and cord diameter remain unresolved',
        tensionModelClass: 'P4 solved spring-arm compensation keeps the tangent-routed escapement-cord free span consistent with reconstructed drum payout across carrier travel; exact IBM arm pivots, groove lanes and cord diameter remain unresolved'
      },
      marginStops: {
        leftPhysical: true,
        rightPhysical: true,
        adjustableOnWritingLine: true,
        leftTerminatesCarrierReturn: true,
        rightLineLockInterface: true,
        leftInsetColumns: state.leftMarginInsetColumns,
        rightInsetColumns: state.rightMarginInsetColumns,
        leftX: state.leftMarginX,
        rightX: state.rightMarginX,
        pitchMm: CANONICAL.pitchMm,
        positioningClass: 'runtime-adjustable stops on the source-backed 12-CPI writing lattice; release-actuator detail unresolved'
      },
      backspace: {
        mechanism: 'dedicated-powered-reverse-linkage',
        rackFamily: ['1124568', '6519139'],
        activePitch: '12P',
        displacementMm: -CANONICAL.pitchMm,
        serialExactPart: 'unresolved',
        linkagePhase: state.backspaceLinkage
      },
      d6CurrentSet: {
        shaft: '1164736',
        bearings: '1164740',
        gear: '1164739',
        item51Clip: '1175220 US / 6520762 WT',
        clipMarketFrozen: false
      },
      platenRatchet: {
        outerDiameterMm: CANONICAL.platen.ratchetDiameterMm,
        teeth: CANONICAL.platen.representativeRatchetTeeth,
        toothProfile: 'P4',
        toothGeometryClass: ratchetToothGeo.userData.p4RatchetToothClass,
        toothGeometryAsymmetric: true,
        paperAdvancePerRatchetToothMm: Math.PI * 2 * CANONICAL.platen.radiusMm / CANONICAL.platen.representativeRatchetTeeth,
        paperAdvanceDerivation: 'P2 arc length from source-backed platen radius divided by representative 27T ratchet',
        lineSpacingModes: ['single', 'double'],
        singleIndexTeeth: 1,
        doubleIndexTeeth: 2,
        activeIndexTeeth: state.lineSpacingTeeth,
        selectorEmbodied: true,
        selectorAngleDegP5: state.lineSpacingTeeth === 2 ? 13 : -13,
        selectorTravelClass: 'P5 visible selector travel; one-vs-two-tooth function source-backed, exact external coordinates unresolved',
        indexPawlStrokeClass: 'P5 presentation amplitude; one-vs-two-tooth function source-backed'
      },
      paperFeed: {
        frontRollers: 4,
        rearRollers: 4,
        bailRollers: 2,
        bailStableStates: ['against-platen', 'released'],
        bailEngaged: state.paperBailEngaged,
        bailToggle: 'hairpin-spring two-stable-state',
        bailRollerAdjustment: {
          independentlyAdjustable: true,
          leftNormalizedP5: state.paperBailRollerPositionsP5.left,
          rightNormalizedP5: state.paperBailRollerPositionsP5.right,
          leftX: paperBailRollers.left.position.x,
          rightX: paperBailRollers.right.position.x,
          travelClass: 'P5 lateral presentation range; source-backed adjustability, exact travel unresolved',
          rollPhaseRad: state.bailRollPhaseRad,
          rollRadiusMmP4: 5.5,
          rollCoupling: 'passive paper-contact rotation while bail is against platen; P4 radius, exact roller section unresolved'
        },
        frontRearReleaseCoupled: true,
        feedRollsEngaged: state.feedRollsEngaged,
        releaseLatchedStateRepresented: true,
        releaseTravel: 'P5 presentation; exact metric travel unresolved',
        manualPaperAlignmentMmP5: state.manualPaperAlignmentMmP5,
        manualPaperAlignmentAvailable: !state.feedRollsEngaged,
        manualPaperAlignmentClass: 'P5 public alignment increment while feed rolls are released; exact operator handling/travel is unresolved',
        copyControl: {
          positions: 5,
          setting: state.copyControlSetting,
          normalForwardSetting: 0,
          offsetZ: state.copyControlOffsetZ,
          offsetClass: 'P5 presentation; exact five offsets unresolved',
          detentMarkerCount: copyControlDetentMarkers.length,
          activeDetentSetting: state.copyControlSetting,
          detentPresentationClass: 'P5 visible five-position marker arc; source-backed discrete count, exact lever angles/marker geometry unresolved',
          shaftRotorAngleDegP5: THREE.MathUtils.radToDeg(copyControlRotor.rotation.x),
          eccentricCollars: copyControlEccentrics.length,
          eccentricCollarsRotateWithShaft: copyControlEccentrics.every(eccentric => eccentric.parent === copyControlRotor),
          movesPlatenAndEntirePaperFeedCarriage: true,
          movesCarrierTypehead: false
        },
        platenVariableEngaged: state.platenVariableEngaged,
        platenRatchetCoupled: !state.platenVariableEngaged,
        manualPlatenAngle: state.manualPlatenAngle,
        platenPhysicalAngleRad: state.platenIndex + state.manualPlatenAngle,
        platenPhaseCueAngleRad: platenKnobPivots[0].rotation.x,
        platenPhaseCueCount: platenKnobPivots.length,
        platenKnobConstructionClass: 'P4 reduced core + outer cap + repeated radial grip ribs; exact IBM knob tooling/knurl section unresolved',
        platenKnobGripRibsPerKnobP4: platenKnobGripRibCountP4,
        platenKnobGripRibTotal: platenKnobGripRibs.length,
        platenPhaseCueClass: 'P5 visible rotational cue; follows physical platen while ratchet may decouple',
        variableOffsetPersistsWhenRecoupled: true,
        paperAdvanceMm: state.paperAdvanceMm,
        paperAdvanceClass: 'P2 platen arc length while feed rolls are engaged',
        paperPath: {
          outputSheetTextured: true,
          platenWrapRepresented: true,
          wrapRadiusMmP4: paper.wrapRadiusMmP4,
          wrapStartAngleDegP4: paper.wrapStartAngleDegP4,
          wrapEndAngleDegP4: paper.wrapEndAngleDegP4,
          wrapSpanDegP4: paper.wrapSpanDegP4,
          wrapClass: 'P4 platen-contact presentation; exact hidden wrap/contact arc unresolved',
          stampLayout: paper.stampDiagnostics(),
          inkSuppressedInStencil: state.ribbonPrintMode === 'stencil',
          inkRecordCoupling: 'low/middle/high fabric-ribbon states record ink on the paper texture; stencil preserves impact but suppresses the ink record'
        },
        feedRollPhaseRad: state.feedRollPhaseRad,
        feedRollRotationClass: 'P4 accumulated contact rotation from coupled paper travel only; released manual sheet alignment does not rotate feed rolls; exact roller radius unresolved',
        exactCenters: 'unresolved-P4'
      },
      ribbon: {
        parent: 'carrier',
        mediaWidthMm: P4.ribbon.widthMm,
        printMode: state.ribbonPrintMode,
        printModes: ['stencil', 'low', 'middle', 'high'],
        loadState: state.ribbonLoadState,
        loadStateDistinctFromHighPrintLift: true,
        loadLiftNormalizedP5: 1.24,
        liftGuideCount: ribbonLiftGuides.length,
        liftGuidesFollowRibbon: true,
        liftGuideProngsPerGuide: ribbonLiftGuides[0].userData.prongCount,
        liftGuideConstructionClass: ribbonLiftGuides[0].userData.constructionClass,
        ribbonCenterY: leftGuide.y,
        liftGuideCenterY: ribbonLiftGuides[0].position.y,
        liftGuideRibbonOffsetMmP4: ribbonLiftGuides[0].userData.ribbonYOffsetP4,
        guideBridgeCenterY: ribbonGuideBridge.position.y,
        guideBridgeRibbonOffsetMmP4: ribbonGuideBridge.userData.ribbonYOffsetP4,
        liftGuideMotionClass: 'P4 carrier-local forked guide/vibrator topology following the live ribbon lift; exact guide sections and service-pose overtravel unresolved',
        liftDriver: 'print-sleeve ribbon-lift cam',
        liftCamLobeP4: true,
        liftFollowerEmbodied: true,
        liftFollowerP5: state.ribbonLiftFollowerP5,
        liftBellcrankEmbodied: true,
        liftCausalChain: ['print-sleeve-rotation', 'ribbon-lift-cam', 'roller-follower', 'bellcrank', 'vibrator-guides', 'ribbon'],
        liftDriveClass: 'P5 cam-envelope timing driven from the print-sleeve phase; P4 follower/bellcrank geometry, exact OEM cam profile and lever lengths unresolved',
        loadLiftClass: 'P5 threading pose above high print lift; service override distinct from print-sleeve cam lift, exact OEM load height unresolved',
        liftCommand: state.ribbonLiftCommand,
        actualLiftNormalizedP5: state.ribbonLift,
        liftHeightClass: 'P5 relative display heights; exact OEM lift heights unresolved',
        stencilRibbonAtPrintPoint: state.ribbonPrintMode !== 'stencil',
        stencilFeedSuppressed: state.ribbonPrintMode === 'stencil',
        stencilPawlCentered: state.ribbonPrintMode === 'stencil' ? Math.abs(feedPawl.position.x) < 1e-9 : null,
        stencilDetentCentered: state.ribbonPrintMode === 'stencil' ? Math.abs(detentLever.position.x) < 1e-9 : null,
        feedSuppressedCount: state.ribbonFeedSuppressedCount,
        feedStepCount: state.ribbonFeedStep,
        feedDriver: 'IBM 1164240 combined ribbon-feed/detent cam on rotating print sleeve',
        feedFollowerEmbodied: true,
        feedFollowerP5: state.ribbonFeedCamFollowerP5,
        feedStrokeP5: state.ribbonFeedStrokeP5,
        feedBellcrankEmbodied: true,
        feedCausalChain: ['print-sleeve-rotation', '1164240-feed-lobe', 'roller-follower', 'bellcrank', 'feed-plate/pawl', 'ratchet'],
        feedStrokeClass: 'P5 cam-envelope stroke through P4 follower/bellcrank geometry; transport commit occurs at reconstructed peak stroke, exact OEM event angle and follower throw unresolved',
        approximateRatchetTeethAdvanced: state.ribbonFeedApproxRatchetTeeth,
        nominalRatchetTeethPerCharacter: 2.5,
        nominalRatchetTeethQualifier: 'approximately',
        feedDirection: state.ribbonFeedDirection,
        feedStrokeInDirection: state.ribbonFeedStrokeInDirection,
        ratchetWheelCount: ribbonRatchets.length,
        ratchetPresentationTeethP4: ribbonRatchets[0].geometry.userData.p4ToothedWheel.presentationTeethP4,
        ratchetGeometryClass: ribbonRatchets[0].geometry.userData.p4ToothedWheel.class,
        spoolFillP5: [...state.ribbonSpoolFillP5],
        spoolRadiusScaleP5: ribbonSpools.map(spool => spool.userData.radiusScaleP5),
        spoolConstructionClass: 'P4 fixed hub/flanges plus independently scaling wound-ribbon pack; phase marker exposes spool rotation',
        spoolFlangesFixedWhileRibbonPackChanges: true,
        spoolRibbonPackBaseRadiusMmP4: ribbonSpools[0].userData.ribbonPackRadiusP4,
        spoolFillClass: 'P5 compressed supply/take-up wound-pack radius presentation inside fixed P4 spool flanges; direction and reversal topology source-grounded, physical ribbon length unresolved',
        reverseState: state.ribbonReverseState,
        reversePhase: state.ribbonReversePhase,
        reverseCount: state.ribbonReverseCount,
        reverseThresholdStepsP5: state.ribbonReverseThresholdStepsP5,
        reverseThresholdClass: 'P5 compressed demonstration capacity; not physical ribbon length',
        path: ['left-spool', 'left-guide', 'print-point', 'right-guide', 'right-spool'],
        reverseTopology: 'lost supply-core loop -> reverse trigger -> plate pivot -> pawl/check transfer -> opposite ratchet',
        reverseIsAnimatedSequence: true,
        exactLinearFeedMm: 'unresolved'
      },
      sleeveCamOrder: ['ribbon-lift', '1164240-feed-detent', '1124174-print-restoring'],
      sleeveCamProfiles: {
        presentationClass: 'smooth P4 radial envelopes replacing round collars plus box lobe cues; sourced identities/order preserved, exact IBM sections unresolved',
        ribbonLift: ribbonLiftCam.userData.p4CamProfile,
        combinedFeedDetent1164240: combinedFeedDetentCam.userData.p4CamProfile,
        printRestoring1124174: printRestoringCam.userData.p4CamProfile
      },
      primaryDrive: {
        motorPulleyTeeth: CANONICAL.drive.motorPulleyTeeth,
        cycleClutchPulleyTeeth: CANONICAL.drive.cycleClutchPulleyTeethDerived,
        reduction: CANONICAL.drive.positiveBeltReduction,
        pitchRadiusRatio: cyclePitchRadiusP4 / motorPitchRadiusP4,
        cycleClutchPulleyHubContinuous: true,
        cycleShaftEventGated: true,
        beltPathPointCount: driveBeltPathP4.points.length,
        beltCenterDistanceMmP4: driveBeltPathP4.centerDistanceMmP4,
        beltStraightSpanMmP4: driveBeltPathP4.straightSpanMmP4,
        beltMotorWrapDegP4: driveBeltPathP4.motorWrapDegP4,
        beltCycleWrapDegP4: driveBeltPathP4.cycleWrapDegP4,
        beltCenterlineLengthMmP4: driveBeltPathP4.centerlineLengthMmP4,
        beltTangentOrthogonalityErrorMm: driveBeltPathP4.tangentOrthogonalityErrorMm,
        beltMotionMarkerCountP5: driveBeltMarkers.length,
        beltMotionMarkerPhaseP5: driveBeltMarkers.map(marker => marker.userData.beltPhaseP5),
        beltTravelFractionPerMotorRevP4: driveBeltTravelFractionPerMotorRevP4,
        beltMotionClass: 'P5 visible markers advected along the P4 belt path by motor pitch-circle travel; marker spacing/shape are presentation only',
        beltPathClass: 'P4 external-tangent solve from reconstructed pitch radii/axis centers; positive-drive tooth count ratio source-backed, exact belt pitch and absolute pulley diameters unresolved',
        beltPitchAndAbsolutePulleyDiameters: 'unresolved'
      },
      powerPresentation: {
        operationalShaftContinuousWhenPowered: true,
        serviceCamsStationaryUntilSelected: true,
        motorPhase: state.motorPhase,
        motorConstructionClass: 'P4 barrel + twin endbells + three vent/rib bands + visible through-shaft + two mounting feet; exact IBM motor housing sections unresolved',
        motorEndbellCount: motorEndbells.length,
        motorVentBandCount: motorVentBands.length,
        motorMountingFootCount: motorFeet.length,
        motorThroughShaftVisible: true,
        selectedServiceCam: state.operationalCamAction,
        selectedServiceCamPhase: state.operationalCamPhase,
        speedClass: 'P5 slowed presentation'
      },
      operationalCams: {
        spaceBackspaceDegreesPerOperation: 180,
        carrierReturnIndexDegreesPerOperation: 360,
        shiftDegreesPerTransition: 180,
        tabUsesPoweredCam: false,
        shiftInterlocksCharacterCycle: true,
        followersEmbodied: true,
        profilePresentationClass: 'smooth P4 radial service-cam envelopes; lobe count/operation class preserved, exact IBM profiles unresolved',
        profileLobeCounts: {
          spaceBackspace: doubleServiceCamProfile.userData.p4CamProfile.lobes.length,
          carrierReturnIndex: returnIndexCamProfile.userData.p4CamProfile.lobes.length,
          shift: shiftCamProfile.userData.p4CamProfile.lobes.length
        },
        profileBaseRadiiMmP4: {
          spaceBackspace: doubleServiceCamProfile.userData.p4CamProfile.baseRadius,
          carrierReturnIndex: returnIndexCamProfile.userData.p4CamProfile.baseRadius,
          shift: shiftCamProfile.userData.p4CamProfile.baseRadius
        },
        followerLiftP5: { ...state.operationalFollowerLiftP5 },
        followerLiftDriverClass: 'P4 fixed-roller contact sample of the rotating smooth cam radius; normalized throw remains P5 because exact OEM follower leverage is unresolved',
        selectedFollower:
          state.operationalCamAction === 'space' || state.operationalCamAction === 'backspace'
            ? 'space/backspace'
            : state.operationalCamAction === 'carrier-return' || state.operationalCamAction === 'index'
              ? 'carrier-return/index'
              : state.operationalCamAction === 'shift'
                ? 'shift'
                : 'none',
        followerTravelClass: 'P5 follower throw driven directly from the selected service-cam phase; service-cam degrees/topology are source-grounded, exact IBM cam profiles and roller-contact radii remain unresolved'
      },
      shaftTiming: {
        cycleShaftDegPerCharacter: 180,
        filterShaftDegPerCharacter: 180,
        printShaftDegPerCharacter: 360,
        printSleeveDegPerCharacter: 360,
        cycleCamStationCount: cycleCamProfilesP4.length,
        cycleCamProfilesP4: cycleCamProfilesP4.map((cam, index) => ({
          station: index + 1,
          baseRadiusMmP4: cam.userData.p4CamProfile.baseRadius,
          lobeCountP4: cam.userData.p4CamProfile.lobes.length,
          lobeAngleDegP4: cam.userData.p4CamProfile.lobes[0].angleDegP4
        })),
        cycleCamPresentationClass: 'three smooth P4 radial envelopes replacing flattened cylinders; station count preserved, exact IBM cam identities/functions/profiles unresolved'
      },
      shift: {
        hemisphere: state.shiftHemisphere,
        angleDeg: state.shiftAngleDeg,
        transitionCamDeg: 180
      },
      fineAlignment: {
        coarseSelectionSeparate: true,
        tiltDetent: state.tiltDetent,
        rotateDetent: state.rotateDetent,
        tiltSeatsBeforeRotateInPresentation: true,
        fullySeatedBeforeImpact: true,
        releasedBeforeFullSelectionRestore: true,
        driver: 'IBM 1164240 combined ribbon-feed/detent cam on the rotating print sleeve',
        printSleevePhaseP5: state.cyclePhase,
        detentFollowerEmbodied: true,
        detentFollowerLiftP5: state.detentFollowerLiftP5,
        detentCamLobesP4: 2,
        sharedFollowerWithRotateLostMotion: true,
        tiltTakeupThresholdP5: 0,
        rotateTakeupThresholdP5: 0.20,
        causalChain: ['print-sleeve-rotation', '1164240-cam', 'roller-follower', 'tilt-takeup', 'rotate-lost-motion', 'detents'],
        exactPivotsAndTimingDegrees: 'unresolved',
        animationPhaseClass: 'P5 event-angle envelope driven from the print-sleeve phase; source-backed topology/order, not OEM timing degrees'
      },
      printRocker: {
        motion: 'revolute',
        driver: 'IBM 1124174 double print/restoring cam on rotating print sleeve',
        camLobesP4: 2,
        followerEmbodied: true,
        followerLiftP5: state.printCamFollowerLiftP5,
        bellcrankEmbodied: true,
        causalChain: ['print-sleeve-rotation', '1124174-print-restoring-cam', 'roller-follower', 'bellcrank', 'print-rocker', 'type-element'],
        driveClass: 'P5 cam-envelope timing through P4 follower/bellcrank geometry; exact OEM cam profile and lever lengths unresolved',
        restClearanceMm: P4.printRocker.derivedRestClearanceMm,
        poweredEndpointClearanceMm: P4.printRocker.derivedPoweredEndpointClearanceMm,
        poweredEndpointAngleDeg: P4.printRocker.poweredEndpointAngleDeg,
        impactAngleDeg: P4.printRocker.impactAngleDeg,
        currentAngleDeg: THREE.MathUtils.radToDeg(rocker.rotation.x),
        platenFrontSurfaceZP4,
        selectedSlugPlatenClearanceAlongZMmP4,
        liveClearanceClass: 'P4 geometry check from selected slug face center to platen front surface along print-facing Z; small negative value at free-flight impact may represent paper/ribbon compression, not hidden-part interpenetration',
        freeFlightRepresented: true
      },
      provenance: CANONICAL.provenance
    };
  }

  setKeyboardCode(0);
  setKeyPress(null, 0);
  setBackspaceLinkage(0);
  setCarrierReturnDrive(0);
  setTabGovernor(0);
  setTabStops(Array.from({ length: Math.floor((CANONICAL.nominalPositions - 1) / 8) }, (_, index) => (index + 1) * 8));
  setMarginInsets(0, 0);
  setCarrierX(state.carrierX);
  setTypeball(0, 0, 0);
  setRibbonLoadState(false);
  setRibbonMode('middle');
  setRibbonLift(0);
  resetRibbonTransport();
  setFineAlignment(0, 0);
  setPaperRelease(false);
  setPaperBail(true);
  setPaperBailRollerPosition('left', 0.4);
  setPaperBailRollerPosition('right', 0.4);
  setCopyControl(0);
  setPlatenVariable(false);
  setPrintApproach(0);
  setLineSpacingMode(1);
  setMotorPhase(0);
  setOperationalCam(null, 0);
  setCyclePhase(0);
  setServiceCover(0);
  setInspectionCutaway('none');
  setExplosion(0);

  return {
    root,
    pickables,
    state,
    setKeyboardCode,
    setKeyPress,
    setBackspaceLinkage,
    setCarrierReturnDrive,
    setTabGovernor,
    setTabStops,
    setTabStopAt,
    setMarginInsets,
    setCarrierX,
    setShiftTransition,
    setTypeball,
    setRibbonMode,
    setRibbonLoadState,
    setRibbonLift,
    feedRibbon,
    setRibbonReversePhase,
    primeRibbonAutoReverse,
    resetRibbonTransport,
    setFineAlignment,
    setPaperRelease,
    setPaperBail,
    repositionPaperManually,
    setPaperBailRollerPosition,
    setCopyControl,
    setPlatenVariable,
    rotatePlatenManually,
    resetPlatenVariableOffset,
    setPrintApproach,
    setLineSpacingMode,
    setIndexPawlPhase,
    setPlatenIndex,
    setMotorPhase,
    setOperationalCam,
    setCyclePhase,
    setServiceCover,
    setInspectionCutaway,
    setExplosion,
    stampCharacter,
    clearPaper,
    geometryDiagnostics
  };
}
