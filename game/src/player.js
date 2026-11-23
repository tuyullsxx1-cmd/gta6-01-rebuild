// player.js — Milo on foot and behind the wheel: movement, camera, entering
// and stealing cars, the weapon wheel and shooting. Keyboard + mouse.
import * as THREE from 'three';
import { makeMilo } from './people.js';
import { driveVehicle } from './vehicles.js';
import { clamp } from './util.js';
import { WEAPONS } from './police.js';

export function buildPlayer(scene, startX, startZ) {
  const model = makeMilo();
  model.position.set(startX, 0, startZ);
  scene.add(model);
  const state = {
    x: startX, z: startZ, rot: 0, speed: 0,
    inCar: null, weapon: 0, money: 250, health: 100,
    camYaw: 0, camPitch: 0.32, camDist: 9,
    wheelOpen: false,
  };
  return { model, state };
}

// Third-person camera: smooth follow behind the player or the car.
export function updateCamera(camera, player, dt) {
  const s = player.state;
  const target = s.inCar ? s.inCar.position : player.model.position;
  const yaw = s.camYaw;
  const dist = s.inCar ? 11 : 8;
  const tx = target.x - Math.sin(yaw) * dist;
  const tz = target.z - Math.cos(yaw) * dist;
  const ty = target.y + 4.2 + s.camPitch * 8;
  camera.position.x += (tx - camera.position.x) * Math.min(1, dt * 6);
  camera.position.y += (ty - camera.position.y) * Math.min(1, dt * 6);
  camera.position.z += (tz - camera.position.z) * Math.min(1, dt * 6);
  camera.lookAt(target.x, target.y + 1.6, target.z);
}

export function updatePlayer(player, input, dt, cars, colliders, onEvent) {
  const s = player.state;
  const m = player.model;
  if (s.wheelOpen) return;
  if (s.inCar) {
    const car = s.inCar;
    const v = driveVehicle(car, input, dt, colliders);
    s.speed = v;
    s.x = car.position.x; s.z = car.position.z; s.rot = car.rotation.y;
    m.position.set(car.position.x, 0, car.position.z);
    m.rotation.y = car.rotation.y;
    m.visible = false;
    // headlights on at dusk: already emissive in the model
    return;
  }
  // on foot
  m.visible = true;
  const run = input.shift ? 9 : 5;
  let mx = 0, mz = 0;
  if (input.up) { mx += Math.sin(s.camYaw); mz += Math.cos(s.camYaw); }
  if (input.down) { mx -= Math.sin(s.camYaw); mz -= Math.cos(s.camYaw); }
  if (input.left) { mx -= Math.cos(s.camYaw); mz += Math.sin(s.camYaw); }
  if (input.right) { mx += Math.cos(s.camYaw); mz -= Math.sin(s.camYaw); }
  const len = Math.hypot(mx, mz);
  if (len > 0) {
    mx /= len; mz /= len;
    const nx = s.x + mx * run * dt, nz = s.z + mz * run * dt;
    let blocked = Math.abs(nx) > 255 || Math.abs(nz) > 255;
    if (!blocked) for (const c of colliders) {
      const dx = nx - c.x, dz = nz - c.z;
      if (dx * dx + dz * dz < c.r * c.r) { blocked = true; break; }
    }
    if (!blocked) { s.x = nx; s.z = nz; }
    s.rot = Math.atan2(mx, mz);
    s.speed = run;
    // walk bob + arm swing
    const t = performance.now() / 160;
    m.position.y = Math.abs(Math.sin(t)) * 0.06;
    m.userData.arms[0].rotation.x = Math.sin(t) * 0.6;
    m.userData.arms[1].rotation.x = -Math.sin(t) * 0.6;
  } else {
    s.speed = 0; m.position.y = 0;
    m.userData.arms[0].rotation.x = 0; m.userData.arms[1].rotation.x = 0;
  }
  m.position.x = s.x; m.position.z = s.z; m.rotation.y = s.rot;
}

// E: enter the nearest car (steal it — that is the game) or step out.
export function tryEnterCar(player, cars, onEvent) {
  const s = player.state;
  if (s.inCar) {
    const car = s.inCar;
    s.inCar = null;
    s.x = car.position.x + Math.sin(car.rotation.y + Math.PI / 2) * 2.5;
    s.z = car.position.z + Math.cos(car.rotation.y + Math.PI / 2) * 2.5;
    player.model.position.set(s.x, 0, s.z);
    player.model.visible = true;
    onEvent && onEvent('exit');
    return;
  }
  let best = null, bestD = 4.5;
  for (const car of cars) {
    const d = Math.hypot(car.position.x - s.x, car.position.z - s.z);
    if (d < bestD) { best = car; bestD = d; }
  }
  if (best) {
    s.inCar = best;
    onEvent && onEvent('enter', best);
  }
  return best;
}

export function cycleWeapon(player, dir) {
  const s = player.state;
  s.weapon = (s.weapon + dir + WEAPONS.length) % WEAPONS.length;
  return s.weapon;
}
