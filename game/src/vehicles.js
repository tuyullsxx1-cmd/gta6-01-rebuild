// vehicles.js — the five vehicles, built in detail: lit headlights, glass
// cabins, mirrors, wheels that spin. Plus a simple arcade drive model.
import * as THREE from 'three';
import { clamp } from './util.js';

function box(w, h, d, color, rough = 0.55, metal = 0.35) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal }));
}
function cyl(rt, rb, h, color, seg = 10) {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(rt, rb, h, seg),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.2 }));
}

export function makeCarModel(kind) {
  const g = new THREE.Group();
  g.name = 'car-' + kind;
  const spec = {
    sedan:  { body: 0x2a6fd8, trim: 0x1a4a8a, spoiler: false, long: 4.6 },
    sports: { body: 0xc81e2a, trim: 0x7a0e16, spoiler: true,  long: 4.3 },
    truck:  { body: 0xd8d2c0, trim: 0x8a7a4a, spoiler: false, long: 5.6 },
    taxi:   { body: 0xf5c400, trim: 0x222222, spoiler: false, long: 4.5 },
    police: { body: 0x14181e, trim: 0xffffff, spoiler: false, long: 4.6 },
  }[kind] || { body: 0x888888, trim: 0x333333, spoiler: false, long: 4.5 };
  const L = spec.long, W = 1.9;

  // Body: low wide slab + a sculpted hood/trunk step.
  const body = box(L, 0.62, W, spec.body); body.position.y = 0.55; g.add(body);
  const hood = box(L * 0.32, 0.22, W * 0.94, spec.body); hood.position.set(L * 0.32, 0.9, 0); g.add(hood);
  const trunk = box(L * 0.2, 0.2, W * 0.94, spec.body); trunk.position.set(-L * 0.38, 0.88, 0); g.add(trunk);
  // Glass cabin (dark, glossy) with a roof panel.
  const cabin = box(L * 0.44, 0.5, W * 0.86,
    new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.12, metalness: 0.9 }));
  cabin.position.set(-L * 0.04, 1.12, 0); g.add(cabin);
  const roof = box(L * 0.4, 0.07, W * 0.8, spec.body); roof.position.set(-L * 0.04, 1.4, 0); g.add(roof);
  // Chrome trim, grille, bumpers.
  const grille = box(0.08, 0.2, W * 0.7, 0x222222); grille.position.set(L / 2, 0.55, 0); g.add(grille);
  const bumperF = box(0.14, 0.18, W, 0xcccccc); bumperF.position.set(L / 2 - 0.02, 0.32, 0); g.add(bumperF);
  const bumperR = box(0.14, 0.18, W, 0xcccccc); bumperR.position.set(-L / 2 + 0.02, 0.32, 0); g.add(bumperR);
  // Headlights (emissive) + a visible light cone on the road ahead.
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  for (const s of [-1, 1]) {
    const hl = box(0.06, 0.16, 0.34, 0xfff2b0); hl.material = headMat;
    hl.position.set(L / 2 + 0.01, 0.62, s * 0.6); g.add(hl);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 5, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
    cone.rotation.z = -Math.PI / 2; cone.position.set(L / 2 + 2.6, 0.5, s * 0.6);
    g.add(cone);
    const tl = box(0.06, 0.14, 0.3, 0xc01020);
    tl.material = new THREE.MeshBasicMaterial({ color: 0xd01020 });
    tl.position.set(-L / 2 - 0.01, 0.62, s * 0.6); g.add(tl);
  }
  // Mirrors, door handles, wheels (they spin when driving).
  for (const s of [-1, 1]) {
    const m = box(0.16, 0.1, 0.08, spec.trim); m.position.set(L * 0.18, 1.05, s * (W / 2 + 0.05)); g.add(m);
  }
  const wheels = [];
  for (const [x, z] of [[L * 0.32, W / 2], [L * 0.32, -W / 2], [-L * 0.32, W / 2], [-L * 0.32, -W / 2]]) {
    const w = new THREE.Group();
    const tyre = cyl(0.36, 0.36, 0.26, 0x181818, 14); tyre.rotation.x = Math.PI / 2; w.add(tyre);
    const hub = cyl(0.2, 0.2, 0.28, 0xbbbbbb, 10); hub.rotation.x = Math.PI / 2; w.add(hub);
    w.position.set(x, 0.36, z); g.add(w); wheels.push(w);
  }
  if (spec.spoiler) {
    const sp = box(0.5, 0.06, W * 0.9, 0x181818); sp.position.set(-L / 2 + 0.1, 1.08, 0); g.add(sp);
  }
  if (kind === 'taxi') {
    const sign = box(0.5, 0.16, 0.3, 0x111111); sign.position.set(0, 1.5, 0); g.add(sign);
    const t = box(0.52, 0.1, 0.32, 0xffd700); t.position.set(0, 1.58, 0); g.add(t);
  }
  if (kind === 'police') {
    const bar = box(0.5, 0.1, 0.9, 0x111111); bar.position.set(-L * 0.04, 1.48, 0); g.add(bar);
    const r = box(0.2, 0.12, 0.3, 0xff2020); r.material = new THREE.MeshBasicMaterial({ color: 0xff2020 }); r.position.set(-L * 0.04, 1.55, 0.28); g.add(r);
    const b = box(0.2, 0.12, 0.3, 0x2040ff); b.material = new THREE.MeshBasicMaterial({ color: 0x2040ff }); b.position.set(-L * 0.04, 1.55, -0.28); g.add(b);
  }
  g.userData.wheels = wheels;
  g.userData.kind = kind;
  return g;
}

// A moored yacht: curved hull, cabin, mast and a full billowing sail.
export function makeYachtModel(hullColor = 0xf2ead8, sailColor = 0xfff6e0) {
  const g = new THREE.Group();
  g.name = 'yacht';
  const hull = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 0.6, 9, 10, 1),
    new THREE.MeshStandardMaterial({ color: hullColor, roughness: 0.45, metalness: 0.3 }));
  hull.rotation.z = Math.PI / 2; hull.rotation.y = Math.PI / 2;
  hull.scale.set(1, 1, 0.55); hull.position.y = 1.1; g.add(hull);
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(9.2, 0.3, 2.3),
    new THREE.MeshStandardMaterial({ color: 0x2a6fd8, roughness: 0.5 }));
  stripe.position.y = 1.5; g.add(stripe);
  const cabin = box(3.4, 1.3, 1.9, 0xf8f4ea); cabin.position.set(-0.6, 2.2, 0); g.add(cabin);
  const cabinWin = box(3.0, 0.5, 1.94, 0x1a2a3a); cabinWin.position.set(-0.6, 2.3, 0); g.add(cabinWin);
  const mast = cyl(0.09, 0.12, 11, 0x6a5138, 8); mast.position.set(1.2, 7, 0); g.add(mast);
  // Full curved sail: a plane bent into a belly so it reads as a sail, not a strip.
  const sailGeo = new THREE.PlaneGeometry(5.4, 8.6, 10, 8);
  const sp = sailGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i), y = sp.getY(i);
    sp.setZ(i, Math.sin((x / 5.4 + 0.5) * Math.PI) * 1.9 + Math.sin((y / 8.6 + 0.5) * Math.PI) * 0.5);
  }
  sailGeo.computeVertexNormals();
  const sail = new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({ color: sailColor, roughness: 0.9, side: THREE.DoubleSide }));
  sail.position.set(4.1, 6.4, 0); g.add(sail);
  const jibGeo = new THREE.PlaneGeometry(3.2, 6.4, 6, 6);
  const jp = jibGeo.attributes.position;
  for (let i = 0; i < jp.count; i++) jp.setZ(i, Math.sin((jp.getX(i) / 3.2 + 0.5) * Math.PI) * 1.1);
  jibGeo.computeVertexNormals();
  const jib = new THREE.Mesh(jibGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide }));
  jib.position.set(-1.6, 5.2, 0); jib.rotation.y = 0.5; g.add(jib);
  return g;
}

// Simple arcade driving: accelerate, steer, brake, handbrake. Returns speed.
export function driveVehicle(car, input, dt, colliders) {
  const u = car.userData;
  u.speed = u.speed || 0;
  const accel = input.up ? 14 : input.down ? -10 : 0;
  u.speed += accel * dt;
  if (!input.up && !input.down) u.speed *= Math.pow(0.4, dt); // coast
  if (input.handbrake) u.speed *= Math.pow(0.05, dt);
  u.speed = clamp(u.speed, -9, 26);
  const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  const turn = steer * clamp(Math.abs(u.speed) / 8, 0, 1) * 1.9 * dt * Math.sign(u.speed || 1);
  car.rotation.y += turn;
  const nx = car.position.x + Math.sin(car.rotation.y) * u.speed * dt;
  const nz = car.position.z + Math.cos(car.rotation.y) * u.speed * dt;
  // soft collision: stop at building circles / city edge
  let blocked = Math.abs(nx) > 255 || Math.abs(nz) > 255;
  if (!blocked && colliders) {
    for (const c of colliders) {
      const dx = nx - c.x, dz = nz - c.z;
      if (dx * dx + dz * dz < c.r * c.r) { blocked = true; break; }
    }
  }
  if (!blocked) { car.position.x = nx; car.position.z = nz; }
  else u.speed *= 0.4;
  for (const w of (u.wheels || [])) w.rotation.z -= u.speed * dt * 2.4;
  return u.speed;
}
