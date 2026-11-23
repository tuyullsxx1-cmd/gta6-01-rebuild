// sky.js — the sunset sky, the sea, clouds, distant boats and buoys.
// Everything that makes the horizon feel alive instead of empty.
import * as THREE from 'three';
import { mulberry32, blobTexture } from './util.js';

export function buildSky(scene, rng) {
  const group = new THREE.Group();
  group.name = 'sky';

  // Warm sunset gradient sky dome (big inverted sphere, vertex colours).
  const skyGeo = new THREE.SphereGeometry(900, 24, 16);
  const colors = [];
  const top = new THREE.Color(0x2e4a7a);      // deep blue up high
  const mid = new THREE.Color(0xe8906a);      // orange band
  const low = new THREE.Color(0xffc98a);      // gold at the horizon
  const pos = skyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 900;
    const c = y > 0.25 ? top.clone().lerp(mid, 1 - (y - 0.25) / 0.75)
      : mid.clone().lerp(low, 1 - y / 0.25);
    colors.push(c.r, c.g, c.b);
  }
  skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false });
  const dome = new THREE.Mesh(skyGeo, skyMat);
  group.add(dome);

  // Low sun disc + glow, sitting over the sea to the west.
  const sunTex = blobTexture('rgba(255,240,200,1)', 'rgba(255,150,60,0)');
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, fog: false, depthWrite: false }));
  sun.position.set(-620, 95, -260); sun.scale.set(260, 260, 1);
  group.add(sun);
  const sunCore = new THREE.Mesh(
    new THREE.CircleGeometry(34, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff3cf, fog: false }));
  sunCore.position.set(-620, 95, -260); sunCore.lookAt(0, 95, 0);
  group.add(sunCore);

  // Warm haze: soft fog + a low haze band of translucent sprites near the horizon.
  scene.fog = new THREE.Fog(0xe8a06a, 180, 760);
  const hazeTex = blobTexture('rgba(255,190,140,.55)', 'rgba(255,190,140,0)');
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: hazeTex, fog: false, depthWrite: false, opacity: 0.5 }));
    const a = rng() * Math.PI * 2, r = 520 + rng() * 220;
    s.position.set(Math.cos(a) * r, 26 + rng() * 30, Math.sin(a) * r);
    s.scale.set(320 + rng() * 160, 60 + rng() * 40, 1);
    group.add(s);
  }

  // Clouds: layered soft puffs, warm-lit underneath, drifting slowly.
  const cloudTex = blobTexture('rgba(255,225,200,.92)', 'rgba(255,180,150,0)');
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    const cl = new THREE.Group();
    const puffs = 3 + Math.floor(rng() * 3);
    for (let j = 0; j < puffs; j++) {
      const p = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, fog: false, depthWrite: false, opacity: 0.85 }));
      p.position.set((j - puffs / 2) * 26 + rng() * 10, rng() * 8, rng() * 14);
      p.scale.set(70 + rng() * 60, 26 + rng() * 18, 1);
      cl.add(p);
    }
    const a = rng() * Math.PI * 2, r = 300 + rng() * 420;
    cl.position.set(Math.cos(a) * r, 120 + rng() * 130, Math.sin(a) * r);
    cl.userData.speed = 0.4 + rng() * 0.7;
    clouds.push(cl); group.add(cl);
  }

  // The sea: a big warm plane west of the city + a glitter field that shimmers.
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 900),
    new THREE.MeshStandardMaterial({ color: 0x3a6a88, roughness: 0.4, metalness: 0.45 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(-560, 0.4, 0);
  group.add(sea);
  const glitterTex = blobTexture('rgba(255,230,170,1)', 'rgba(255,230,170,0)');
  const glitter = [];
  for (let i = 0; i < 90; i++) {
    const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glitterTex, depthWrite: false, opacity: 0.35 + rng() * 0.5 }));
    g.position.set(-950 + rng() * 700, 1.2, -420 + rng() * 840);
    const s = 3 + rng() * 9; g.scale.set(s, s * 0.35, 1);
    g.userData.phase = rng() * Math.PI * 2;
    glitter.push(g); group.add(g);
  }

  // Distant boats on the horizon so the water is never empty.
  const boats = [];
  const hullCols = [0xf2ead8, 0xdfe8ee, 0xc8d8e8, 0xf5e6c8];
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(16, 3, 5),
      new THREE.MeshStandardMaterial({ color: hullCols[i % hullCols.length], roughness: 0.6 }));
    hull.position.y = 2; b.add(hull);
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.3, 14, 6),
      new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.8 }));
    mast.position.y = 9; b.add(mast);
    // a full curved sail, not a strip
    const sailGeo = new THREE.PlaneGeometry(10, 12, 8, 6);
    const sp = sailGeo.attributes.position;
    for (let k = 0; k < sp.count; k++) {
      const x = sp.getX(k);
      sp.setZ(k, Math.sin((x / 10 + 0.5) * Math.PI) * 2.4);
    }
    sailGeo.computeVertexNormals();
    const sail = new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({ color: 0xfff6e0, roughness: 0.9, side: THREE.DoubleSide }));
    sail.position.set(5.4, 9, 0); b.add(sail);
    const a = rng() * Math.PI * 2, r = 480 + rng() * 260;
    b.position.set(-560 + Math.cos(a) * r * 0.7, 0, Math.sin(a) * r);
    b.rotation.y = rng() * Math.PI * 2;
    boats.push(b); group.add(b);
  }

  // Buoys: orange floats with a blinking top light, scattered near the marina.
  const buoys = [];
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 2.4, 8),
      new THREE.MeshStandardMaterial({ color: 0xe8641e, roughness: 0.6 }));
    body.position.y = 1.4; b.add(body);
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd27a }));
    lamp.position.y = 3; b.add(lamp);
    b.position.set(-260 - rng() * 320, 0.6, -260 + rng() * 520);
    b.userData.lamp = lamp; b.userData.phase = rng() * Math.PI * 2;
    buoys.push(b); group.add(b);
  }

  scene.add(group);
  return {
    group, clouds, glitter, buoys,
    update(t) {
      for (const c of clouds) { c.position.x += c.userData.speed * 0.016; if (c.position.x > 760) c.position.x = -760; }
      for (const g of glitter) g.material.opacity = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.7 + g.userData.phase));
      for (const b of buoys) b.userData.lamp.material.color.setHex(Math.sin(t * 2 + b.userData.phase) > 0 ? 0xffd27a : 0x8a5a20);
    },
  };
}
