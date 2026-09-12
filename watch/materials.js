import * as THREE from 'three';

export function createMaterials() {
  return {
    caseSteel: new THREE.MeshPhysicalMaterial({
      color: 0xc4cbd1,
      metalness: 1,
      roughness: .18,
      clearcoat: .28,
      clearcoatRoughness: .18
    }),
    brushedSteel: new THREE.MeshPhysicalMaterial({
      color: 0xaeb6bd,
      metalness: .96,
      roughness: .34,
      clearcoat: .12
    }),
    darkSteel: new THREE.MeshStandardMaterial({
      color: 0x33383f,
      metalness: .9,
      roughness: .3
    }),
    plate: new THREE.MeshPhysicalMaterial({
      color: 0xb8b7ad,
      metalness: .82,
      roughness: .43,
      clearcoat: .08
    }),
    bridge: new THREE.MeshPhysicalMaterial({
      color: 0xc2bda9,
      metalness: .84,
      roughness: .37,
      clearcoat: .1
    }),
    brass: new THREE.MeshStandardMaterial({
      color: 0xb58a3d,
      metalness: .84,
      roughness: .29
    }),
    gilt: new THREE.MeshPhysicalMaterial({
      color: 0xcaa250,
      metalness: .92,
      roughness: .23,
      clearcoat: .18
    }),
    copper: new THREE.MeshStandardMaterial({
      color: 0xaa6744,
      metalness: .77,
      roughness: .34
    }),
    blueSteel: new THREE.MeshStandardMaterial({
      color: 0x315f8d,
      metalness: .83,
      roughness: .26
    }),
    ruby: new THREE.MeshPhysicalMaterial({
      color: 0xa0163c,
      metalness: .05,
      roughness: .13,
      transmission: .08,
      clearcoat: .75
    }),
    black: new THREE.MeshStandardMaterial({
      color: 0x111419,
      metalness: .18,
      roughness: .56
    }),
    dial: new THREE.MeshStandardMaterial({
      color: 0x111317,
      metalness: .08,
      roughness: .54
    }),
    lume: new THREE.MeshStandardMaterial({
      color: 0xe2e7cd,
      emissive: 0x68715b,
      emissiveIntensity: .12,
      roughness: .62
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xeaf6ff,
      metalness: 0,
      roughness: .035,
      transmission: .97,
      thickness: 1.1,
      ior: 1.46,
      transparent: true,
      opacity: .34
    }),
    leather: new THREE.MeshPhysicalMaterial({
      color: 0x382318,
      metalness: .01,
      roughness: .83,
      clearcoat: .03
    }),
    lightGizmo: new THREE.MeshStandardMaterial({
      color: 0xffe0a0,
      emissive: 0xffba4f,
      emissiveIntensity: 1.8,
      roughness: .15
    })
  };
}
