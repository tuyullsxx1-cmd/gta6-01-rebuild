// city.js — Maravilla itself: six districts, the marina docks, Downtown Plaza,
// the Grand Maravilla casino, the stadium and the El Faro lighthouse.
// Every facade is varied (colour, height, lit windows) so no two blocks match.
import * as THREE from 'three';
import { mulberry32, facadeTexture, signTexture, checkerTexture, roadTexture, clamp } from './util.js';
import { makeCarModel, makeYachtModel } from './vehicles.js';

function mat(color, rough = 0.8, metal = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}
function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

export function buildCity(scene, rng) {
  const group = new THREE.Group();
  group.name = 'city';
  const colliders = [];
  const animated = { fountain: null, beam: null, beamLight: null };

  // ---- ground: warm city earth, a sand beach by the water, grass on the hills
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(560, 560),
    new THREE.MeshStandardMaterial({ color: 0xb89a6a, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 0);
  group.add(ground);
  const beach = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 560),
    new THREE.MeshStandardMaterial({ color: 0xe0c090, roughness: 1 }));
  beach.rotation.x = -Math.PI / 2; beach.position.set(-235, 0.05, 0);
  group.add(beach);
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 220),
    new THREE.MeshStandardMaterial({ color: 0x6a8a4a, roughness: 1 }));
  grass.rotation.x = -Math.PI / 2; grass.position.set(200, 0.06, -140);
  group.add(grass);

  // ---- roads (dark asphalt strips with centre lines + pale sidewalks)
  const roadTex = roadTexture();
  function road(x, z, w, len, horizontal) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(len, w), new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.95 }));
    r.rotation.x = -Math.PI / 2;
    if (horizontal) r.rotation.z = Math.PI / 2;
    r.position.set(x, 0.08, z); group.add(r);
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(len, w + 7), new THREE.MeshStandardMaterial({ color: 0xb8a888, roughness: 1 }));
    sw.rotation.x = -Math.PI / 2; if (horizontal) sw.rotation.z = Math.PI / 2;
    sw.position.set(x, 0.04, z); group.add(sw);
  }
  road(-140, 0, 14, 480, false);   // Paseo del Mar (waterfront boulevard)
  road(60, 0, 12, 400, true);      // Avenida Centro
  road(60, 120, 10, 400, true);    // Calle Sol
  road(40, -40, 10, 360, false);   // Calle Faro
  road(60, -140, 10, 400, true);   // Calle Norte
  road(190, 0, 10, 300, false);    // Miramar drive

  // ---- buildings: varied facades, heights and lit windows, per district
  const palettes = {
    centro: ['#c8a078', '#b89068', '#d8b088', '#a88058', '#c09870'],
    paseo: ['#e8c8a0', '#d8b088', '#f0d0a8', '#c8a888'],
    miramar: ['#e8d8b8', '#d8c8a8', '#f0e0c0', '#c8b898'],
    norte: ['#b8a088', '#a89078', '#c0a888'],
  };
  function building(x, z, w, d, h, palette, seed) {
    const base = palette[Math.floor(rng() * palette.length)];
    const tex = facadeTexture(base, 0.45, seed);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(Math.max(1, Math.round(w / 11)), Math.max(1, Math.round(h / 13)));
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
    m.position.set(x, h / 2, z);
    m.castShadow = true; m.receiveShadow = true;
    group.add(m);
    // roof furniture: water tank, AC boxes, a parapet
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.2, 8), mat(0x7a6a55));
    tank.position.set(x - w / 4, h + 1.1, z); group.add(tank);
    const ac = box(1.6, 0.8, 1.2, mat(0x9a9a9a)); ac.position.set(x + w / 4, h + 0.4, z + d / 4); group.add(ac);
    const parapet = box(w + 0.3, 0.5, d + 0.3, mat(0x8a7a68)); parapet.position.set(x, h + 0.25, z); group.add(parapet);
    colliders.push({ x, z, r: Math.max(w, d) * 0.62 });
    return m;
  }
  // Centro blocks (tall, dense)
  const centroSpots = [
    [-100, -60, 22, 20, 26], [-70, -60, 18, 20, 34], [-100, 60, 20, 18, 22], [-70, 60, 22, 18, 30],
    [-20, -60, 20, 22, 38], [10, -60, 18, 20, 28], [-20, 60, 24, 20, 32], [10, 60, 20, 20, 24],
    [80, -60, 18, 20, 30], [110, -60, 20, 18, 22], [80, 60, 20, 20, 36], [110, 60, 18, 18, 26],
    [-100, -100, 20, 16, 20], [80, -100, 22, 16, 28], [-20, 100, 20, 16, 22], [110, 100, 18, 16, 24],
  ];
  centroSpots.forEach((s, i) => building(s[0], s[1], s[2], s[3], s[4], palettes.centro, 100 + i * 7));
  // Paseo del Mar beachfront (mid, warm, balconies)
  const paseoSpots = [
    [-120, -180, 16, 18, 16], [-120, -100, 18, 18, 20], [-120, -40, 16, 18, 14], [-120, 40, 18, 18, 18],
    [-120, 100, 16, 18, 16], [-120, 180, 18, 18, 20], [-120, 220, 16, 18, 14],
  ];
  paseoSpots.forEach((s, i) => building(s[0], s[1], s[2], s[3], s[4], palettes.paseo, 300 + i * 11));
  // Miramar hillside homes (low, pale, terraced)
  const miramarSpots = [
    [170, -180, 16, 14, 9], [200, -180, 14, 14, 11], [230, -180, 16, 14, 8],
    [170, -120, 14, 14, 10], [200, -120, 16, 14, 9], [230, -120, 14, 14, 12],
    [170, -60, 16, 14, 8], [200, -60, 14, 14, 10], [230, -60, 16, 14, 9],
  ];
  miramarSpots.forEach((s, i) => building(s[0], s[1], s[2], s[3], s[4], palettes.miramar, 500 + i * 13));
  // Norte row
  [[-60, -170, 18, 16, 18], [-20, -170, 20, 16, 22], [20, -170, 18, 16, 16], [80, -170, 20, 16, 20]]
    .forEach((s, i) => building(s[0], s[1], s[2], s[3], s[4], palettes.norte, 700 + i * 9));

  // ---- Marina: detailed docks (planks, posts, ropes, cleats), moored yachts, beacon
  const marina = new THREE.Group(); marina.name = 'marina';
  const wood = mat(0x8a6a45, 0.9);
  const woodDark = mat(0x6a4a30, 0.9);
  for (let d = 0; d < 3; d++) {
    const z0 = -70 + d * 70;
    // dock deck: individual planks so the wood reads
    for (let p = 0; p < 26; p++) {
      const plank = box(2.2, 0.25, 1.7, p % 2 ? wood : woodDark);
      plank.position.set(-210 - p * 1.9, 1.1, z0);
      marina.add(plank);
    }
    // posts + ropes along the dock edge + cleats
    for (let p = 0; p < 7; p++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 2.6, 8), woodDark);
      post.position.set(-212 - p * 8, 1.9, z0 + 1.4); marina.add(post);
      const cleat = box(0.9, 0.25, 0.3, mat(0x333333, 0.5, 0.7));
      cleat.position.set(-212 - p * 8, 1.3, z0 - 0.8); marina.add(cleat);
      if (p < 6) {
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 8.4, 6), mat(0xd8c8a0, 1));
        rope.rotation.z = Math.PI / 2; rope.rotation.y = 0.25;
        rope.position.set(-216 - p * 8, 2.6, z0 + 1.4); marina.add(rope);
      }
    }
    // a moored yacht with a full curved sail at each dock
    const yacht = makeYachtModel(d === 0 ? 0xf2ead8 : d === 1 ? 0xdfe8ee : 0xf5e6c8);
    yacht.position.set(-228, 0.9, z0 + 12); yacht.rotation.y = Math.PI / 2 + (rng() - 0.5) * 0.3;
    marina.add(yacht);
    // mooring buoys beside the dock
    for (let b = 0; b < 3; b++) {
      const buoy = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2, 8), mat(0xe8641e, 0.6));
      buoy.position.set(-250 - rng() * 20, 1.2, z0 + 18 + b * 8); marina.add(buoy);
    }
  }
  // the beacon: mission 1 meeting point, a small lit tower on the quay
  const beacon = new THREE.Group(); beacon.name = 'beacon';
  const bBase = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4, 7, 12), mat(0xd8c8b0, 0.8));
  bBase.position.y = 3.5; beacon.add(bBase);
  const bTop = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.4, 12), mat(0x2a4a6a, 0.6));
  bTop.position.y = 8; beacon.add(bTop);
  const bLamp = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffe9a0 }));
  bLamp.position.y = 9.6; beacon.add(bLamp);
  const bLight = new THREE.PointLight(0xffd27a, 60, 40); bLight.position.y = 9.6; beacon.add(bLight);
  beacon.position.set(-196, 0, -20);
  marina.add(beacon);
  colliders.push({ x: -196, z: -20, r: 5 });
  group.add(marina);

  // ---- Downtown Plaza: terracotta checker, fountain, planters, benches, palms
  const plaza = new THREE.Group(); plaza.name = 'plaza';
  const plazaFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 60),
    new THREE.MeshStandardMaterial({ map: checkerTexture('#b06040', '#d89068'), roughness: 0.9 }));
  plazaFloor.material.map.repeat.set(6, 5); plazaFloor.material.map.wrapS = plazaFloor.material.map.wrapT = THREE.RepeatWrapping;
  plazaFloor.rotation.x = -Math.PI / 2; plazaFloor.position.set(40, 0.12, -60);
  plaza.add(plazaFloor);
  // fountain: basin + animated water + spray
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.6, 1.6, 20), mat(0xd8c8b0, 0.7));
  basin.position.set(40, 0.9, -60); plaza.add(basin);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.4, 0.3, 20),
    new THREE.MeshStandardMaterial({ color: 0x3a7a9a, roughness: 0.15, metalness: 0.6 }));
  water.position.set(40, 1.7, -60); plaza.add(water);
  animated.fountain = water;
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 4.5, 10), mat(0xe8dcc0, 0.6));
  pillar.position.set(40, 3.6, -60); plaza.add(pillar);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffd27a, roughness: 0.3, metalness: 0.7, emissive: 0xffc060, emissiveIntensity: 0.4 }));
  orb.position.set(40, 6.4, -60); plaza.add(orb);
  // planters + benches + palms around the plaza
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const px = 40 + Math.cos(a) * 26, pz = -60 + Math.sin(a) * 22;
    const planter = box(3, 1.1, 3, mat(0x8a5a40, 0.9)); planter.position.set(px, 0.7, pz); plaza.add(planter);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), mat(0x4a7a3a, 1));
    bush.position.set(px, 1.9, pz); bush.scale.y = 0.75; plaza.add(bush);
  }
  for (let i = 0; i < 4; i++) {
    const bench = box(4, 0.5, 1.2, woodDark); bench.position.set(18 + i * 15, 0.5, -38); plaza.add(bench);
  }
  group.add(plaza);

  // ---- Grand Maravilla casino: blue glass tower, gold fins, big readable sign, lit atrium
  const casino = new THREE.Group(); casino.name = 'casino';
  const cBase = box(46, 16, 26, mat(0x2a2a3a, 0.7)); cBase.position.set(40, 8, -108); casino.add(cBase);
  const glassTex = facadeTexture('#1a3a5a', 0.85, 999);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(26, 44, 20),
    new THREE.MeshStandardMaterial({ map: glassTex, roughness: 0.25, metalness: 0.6 }));
  tower.position.set(40, 22, -112); tower.castShadow = true; casino.add(tower);
  // gold fins up the tower
  for (let i = 0; i < 5; i++) {
    const fin = box(0.5, 46, 1.2, new THREE.MeshStandardMaterial({ color: 0xd8a820, roughness: 0.3, metalness: 0.85 }));
    fin.position.set(27 + i * 6.5, 23, -101.5); casino.add(fin);
  }
  // the sign — big, gold on dark, fully readable
  const signTex = signTexture('GRAND MARAVILLA', '#1a1020', '#ffd27a', 'CASINO  •  HOTEL  •  MARAVILLA');
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(40, 10),
    new THREE.MeshBasicMaterial({ map: signTex }));
  sign.position.set(40, 13, -94.8); casino.add(sign);
  // lit atrium: warm glowing glass entrance
  const atrium = new THREE.Mesh(new THREE.BoxGeometry(20, 9, 6),
    new THREE.MeshStandardMaterial({ color: 0xffe0a0, roughness: 0.2, metalness: 0.2, emissive: 0xffc060, emissiveIntensity: 0.9 }));
  atrium.position.set(40, 4.5, -93); casino.add(atrium);
  // entrance canopy + red carpet + valet
  const canopy = box(16, 0.8, 8, mat(0x7a1020, 0.6)); canopy.position.set(40, 6.5, -90); casino.add(canopy);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4, 12), mat(0x9a1020, 0.9));
  carpet.rotation.x = -Math.PI / 2; carpet.position.set(40, 0.14, -88); casino.add(carpet);
  colliders.push({ x: 40, z: -108, r: 26 });
  group.add(casino);

  // ---- Estadio Sol: open bowl + floodlights + green pitch
  const stadium = new THREE.Group(); stadium.name = 'stadium';
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(26, 30, 12, 20, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.8, side: THREE.DoubleSide }));
  bowl.position.set(180, 6, 170); stadium.add(bowl);
  const pitch = new THREE.Mesh(new THREE.CircleGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x3a7a3a, roughness: 1 }));
  pitch.rotation.x = -Math.PI / 2; pitch.position.set(180, 0.15, 170); stadium.add(pitch);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 22, 8), mat(0x666666, 0.6));
    pole.position.set(180 + Math.cos(a) * 30, 11, 170 + Math.sin(a) * 30); stadium.add(pole);
    const lamp = box(4, 2, 1, mat(0x222222, 0.5));
    lamp.position.set(180 + Math.cos(a) * 30, 22.5, 170 + Math.sin(a) * 30); stadium.add(lamp);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), new THREE.MeshBasicMaterial({ color: 0xfff2c0 }));
    glow.position.set(180 + Math.cos(a) * 30, 22.5, 170 + Math.sin(a) * 30 - 0.6); stadium.add(glow);
  }
  colliders.push({ x: 180, z: 170, r: 30 });
  group.add(stadium);

  // ---- El Faro lighthouse: red-white stripes + a rotating beam
  const faro = new THREE.Group(); faro.name = 'faro';
  for (let i = 0; i < 5; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(3.4 - i * 0.35, 3.8 - i * 0.35, 6, 12),
      mat(i % 2 ? 0xc02020 : 0xf0ead8, 0.7));
    seg.position.set(-225, 3 + i * 6, -215); faro.add(seg);
  }
  const faroTop = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 3, 12), mat(0x222222, 0.6));
  faroTop.position.set(-225, 33, -215); faro.add(faroTop);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(6, 70, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
  beam.rotation.z = Math.PI / 2; beam.position.set(-190, 34, -215); faro.add(beam);
  animated.beam = beam;
  const beamLight = new THREE.PointLight(0xffe9a0, 80, 60); beamLight.position.set(-225, 34, -215); faro.add(beamLight);
  animated.beamLight = beamLight;
  // rocks at the point
  for (let i = 0; i < 9; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2 + rng() * 3, 0), mat(0x6a625a, 1));
    rock.position.set(-245 + rng() * 45, 0.8, -235 + rng() * 45);
    rock.rotation.set(rng() * 3, rng() * 3, rng() * 3); faro.add(rock);
  }
  colliders.push({ x: -225, z: -215, r: 6 });
  group.add(faro);

  // ---- streetlights along the main roads (pole + arm + warm lamp + light pool)
  function streetlight(x, z) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 7, 8), mat(0x3a3a3a, 0.5, 0.6));
    pole.position.set(x, 3.5, z); group.add(pole);
    const arm = box(2.2, 0.15, 0.15, mat(0x3a3a3a, 0.5, 0.6)); arm.position.set(x + 1, 7, z); group.add(arm);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe9a0 }));
    lamp.position.set(x + 2, 6.9, z); group.add(lamp);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(4, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.14, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(x + 2, 0.16, z); group.add(pool);
  }
  for (let z = -220; z <= 220; z += 44) { streetlight(-132, z); streetlight(52, z); }
  for (let x = -120; x <= 240; x += 48) { streetlight(x, 8); streetlight(x, 112); }

  // ---- parked cars along the curbs (dressed: varied colours, some with lights on)
  const parked = [
    ['sedan', -128, -80, 0.2], ['taxi', -128, -20, 0.2], ['sports', -128, 60, 0.2],
    ['sedan', -128, 140, 0.2], ['truck', 52, -80, 1.7], ['sedan', 52, 40, 1.7],
    ['taxi', 52, 130, 1.7], ['sports', -52, 8, 0], ['sedan', 20, 8, 0],
  ];
  for (const [kind, x, z, ry] of parked) {
    const car = makeCarModel(kind);
    car.position.set(x, 0, z); car.rotation.y = ry;
    group.add(car);
    colliders.push({ x, z, r: 3 });
  }

  // ---- palm trees: trunk + a crown of fronds, along the boulevard and plaza
  function palm(x, z) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 7, 7), mat(0x7a5a38, 1));
    trunk.position.set(x, 3.5, z); trunk.rotation.z = (rng() - 0.5) * 0.16; group.add(trunk);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const frond = box(4.5, 0.12, 1.1, mat(0x3a7a2a, 1));
      frond.position.set(x + Math.cos(a) * 2, 7.2, z + Math.sin(a) * 2);
      frond.rotation.y = -a; frond.rotation.z = 0.5;
      group.add(frond);
    }
  }
  for (let z = -200; z <= 220; z += 42) { palm(-128, z); palm(28, z); }
  for (const [x, z] of [[18, -38], [62, -38], [18, -82], [62, -82]]) palm(x, z);

  scene.add(group);
  return {
    group, colliders,
    update(t) {
      if (animated.fountain) animated.fountain.rotation.y = t * 0.4;
      if (animated.beam) animated.beam.rotation.y = t * 0.5;
    },
  };
}
