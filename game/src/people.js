// people.js — the characters. Milo (yellow jacket), Vera (red dress), police
// officers (dark blue + cap) and a crowd of pedestrians in varied clothes.
// Built from simple shapes so they read clearly even at thumbnail size.
import * as THREE from 'three';

function mat(color, rough = 0.85) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05 });
}
function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

export function makePerson(opts = {}) {
  const {
    jacket = 0x888888, pants = 0x2a2a3a, skin = 0xd8a878,
    hair = 0x2a1a10, dress = false, cap = false, hat = false,
  } = opts;
  const g = new THREE.Group();
  g.name = 'person';
  const legMat = mat(pants), jacketMat = mat(jacket), skinMat = mat(skin, 0.7);
  if (dress) {
    // a dress: flared cone skirt + bodice, so Vera reads as a silhouette
    const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.1, 10), mat(jacket));
    skirt.position.y = 0.55; g.add(skirt);
    const bodice = box(0.5, 0.5, 0.32, jacketMat); bodice.position.y = 1.25; g.add(bodice);
  } else {
    for (const s of [-1, 1]) {
      const leg = box(0.2, 0.85, 0.22, legMat); leg.position.set(s * 0.13, 0.42, 0); g.add(leg);
    }
    const torso = box(0.55, 0.65, 0.32, jacketMat); torso.position.y = 1.18; g.add(torso);
  }
  // arms
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = box(0.16, 0.62, 0.18, dress ? skinMat : jacketMat);
    arm.position.set(s * 0.36, 1.2, 0); g.add(arm); arms.push(arm);
  }
  // head + hair
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 12), skinMat);
  head.position.y = 1.72; g.add(head);
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(hair, 0.95));
  hairM.position.y = 1.76; g.add(hairM);
  if (cap) {
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.08, 12), mat(0x1a2a4a, 0.7));
    capTop.position.y = 1.9; g.add(capTop);
    const brim = box(0.3, 0.04, 0.22, mat(0x1a2a4a, 0.7)); brim.position.set(0, 1.86, 0.22); g.add(brim);
  }
  if (hat) {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 12), mat(0x8a6a3a, 0.9));
    brim.position.y = 1.88; g.add(brim);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.22, 12), mat(0x8a6a3a, 0.9));
    top.position.y = 1.98; g.add(top);
  }
  g.userData.arms = arms;
  return g;
}

export function makeMilo() {
  const m = makePerson({ jacket: 0xe8b820, pants: 0x2a2a3a, skin: 0xd8a878, hair: 0x1a120a });
  m.name = 'milo';
  return m;
}
export function makeVera() {
  const v = makePerson({ jacket: 0xc01030, skin: 0xe8b890, hair: 0x1a0a08, dress: true });
  v.name = 'vera';
  return v;
}
export function makeOfficer() {
  const o = makePerson({ jacket: 0x1a2a4a, pants: 0x1a2a4a, skin: 0xc89868, hair: 0x111111, cap: true });
  o.name = 'officer';
  return o;
}
// A crowd of pedestrians in varied clothes, for streets and the plaza.
export function makePedestrian(rng) {
  const jackets = [0x4a7a9a, 0x9a5a3a, 0x5a8a4a, 0x8a4a6a, 0xd8d0c0, 0x3a4a6a, 0xc08030, 0x6a6a8a];
  const skins = [0xd8a878, 0xc89868, 0xa87850, 0xe8b890];
  const p = makePerson({
    jacket: jackets[Math.floor(rng() * jackets.length)],
    pants: [0x2a2a3a, 0x3a2a1a, 0x4a4a4a][Math.floor(rng() * 3)],
    skin: skins[Math.floor(rng() * skins.length)],
    hair: [0x1a120a, 0x3a2a1a, 0x6a6a6a, 0x8a4a20][Math.floor(rng() * 4)],
    hat: rng() < 0.25,
  });
  p.name = 'pedestrian';
  return p;
}
