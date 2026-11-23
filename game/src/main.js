// main.js — MARAVILLA boots here: renderer, sunset light, the city, the cars,
// the missions, the loop. ?shot=N stages one of the four screenshots.
import * as THREE from 'three';
import { mulberry32 } from './util.js';
import { buildSky } from './sky.js';
import { buildCity } from './city.js';
import { buildTraffic } from './traffic.js';
import { buildPolice } from './police.js';
import { MISSIONS, missionAt } from './missions.js';
import { buildHud } from './hud.js';
import { buildPlayer, updateCamera, updatePlayer, tryEnterCar, cycleWeapon } from './player.js';
import { makeCarModel, makeYachtModel } from './vehicles.js';
import { makeMilo, makeVera, makePedestrian } from './people.js';
import { stageShot } from './shots.js';
import { saveGame, loadGame } from './save.js';
import { sfx, engineHum, ensureAudio } from './audio.js';

const params = new URLSearchParams(location.search);
const shotNo = parseInt(params.get('shot') || '0', 10);
const rng = mulberry32(20261123);

// ---- renderer
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2e4a7a);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 2000);
camera.position.set(-120, 8, 60);

// ---- sunset light: warm sun higher in the sky so the streets are lit,
// plus a strong sky fill so shadows stay readable, never pitch black
const sun = new THREE.DirectionalLight(0xffb36a, 3.0);
sun.position.set(-260, 170, -80);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -260; sun.shadow.camera.right = 260;
sun.shadow.camera.top = 260; sun.shadow.camera.bottom = -260;
sun.shadow.camera.far = 800; sun.shadow.bias = -0.0004;
scene.add(sun);
const hemi = new THREE.HemisphereLight(0xffd9a0, 0x5a4030, 1.6);
scene.add(hemi);
const amb = new THREE.AmbientLight(0xffe0c0, 0.4);
scene.add(amb);
const bounce = new THREE.DirectionalLight(0xffd2a0, 0.7);
bounce.position.set(200, 60, 120);
scene.add(bounce);

// ---- world
const sky = buildSky(scene, rng);
const city = buildCity(scene, rng);
const traffic = buildTraffic(scene, rng, city.colliders);
const police = buildPolice(scene, rng);
const hud = buildHud();
const player = buildPlayer(scene, -140, 40);

// the five drivable vehicles
const cars = {
  viento: makeCarModel('sedan'),
  comet: makeCarModel('sports'),
  camion: makeCarModel('truck'),
  taxi: makeCarModel('taxi'),
};
cars.viento.position.set(-140, 0, 40); cars.viento.rotation.y = Math.PI;
cars.comet.position.set(40, 0, -44); cars.comet.rotation.y = Math.PI / 2;
cars.camion.position.set(90, 0, -20); cars.camion.rotation.y = Math.PI;
cars.taxi.position.set(-137, 0, -60); cars.taxi.rotation.y = Math.PI;
for (const c of Object.values(cars)) { scene.add(c); city.colliders.push({ x: c.position.x, z: c.position.z, r: 3 }); }
// the boat, moored at the marina
const boat = makeYachtModel(0xf2ead8);
boat.position.set(-236, 0.9, 60); boat.rotation.y = Math.PI / 2;
scene.add(boat);
// a hero yacht kept aside for the marina screenshot (full sail, broadside)
const heroYacht = makeYachtModel(0xffffff);
heroYacht.visible = false;
scene.add(heroYacht);
// Vera, waiting at the beacon (mission 1)
const vera = makeVera();
vera.position.set(-198, 0, -24); vera.rotation.y = Math.PI * 0.8;
scene.add(vera);
const milo = player.model;
// a small cast of pedestrians reserved for screenshot staging
const shotPeds = [];
for (let i = 0; i < 8; i++) {
  const p = makePedestrian(rng);
  p.visible = false; scene.add(p); shotPeds.push(p);
}

const world = {
  scene, camera, renderer, player, hud, police, traffic, city, sky,
  cars, boat, heroYacht, vera, milo, shotPeds, missions: MISSIONS,
};

// ---- game state
const save = loadGame();
const state = {
  mission: save ? save.mission : 0,
  money: save ? save.money : 250,
  weapon: save ? save.weapon : 0,
  started: false,
  paused: false,
};
player.state.money = state.money;
player.state.weapon = state.weapon;
if (save) { player.state.x = save.x; player.state.z = save.z; player.model.position.set(save.x, 0, save.z); }

function currentMission() { return missionAt(state.mission); }
function setMission(i) {
  state.mission = i;
  const m = currentMission();
  hud.setObjective(`Mission ${m.id} — ${m.name}: ${m.objective}`);
  hud.showDialogue(m.who, m.line);
  setTimeout(() => hud.hideDialogue(), 6000);
}
function completeMission() {
  const m = currentMission();
  state.money += m.payout;
  player.state.money = state.money;
  hud.toast(`Mission complete: ${m.name}  +$${m.payout}`);
  sfx.mission();
  setMission(Math.min(state.mission + 1, MISSIONS.length - 1));
}

// ---- input
const input = { up: false, down: false, left: false, right: false, shift: false, handbrake: false };
const keyMap = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', ShiftLeft: 'shift', ShiftRight: 'shift', Space: 'handbrake' };
addEventListener('keydown', (e) => {
  if (keyMap[e.code] !== undefined) { input[keyMap[e.code]] = true; e.preventDefault(); }
  if (e.code === 'KeyE') {
    const got = tryEnterCar(player, [...Object.values(cars), ...traffic.cars], (ev) => {
      if (ev === 'enter') { police.state.addHeat(8); hud.toast('Car stolen — the cops noticed'); sfx.pickup(); }
    });
    if (got && !player.state.inCar) hud.toast('No car close enough');
  }
  if (e.code === 'KeyF') {
    player.state.wheelOpen = !player.state.wheelOpen;
    if (player.state.wheelOpen) hud.showWheel(player.state.weapon);
    else { hud.hideWheel(); hud.setWeapon(player.state.weapon); }
  }
  if (player.state.wheelOpen && (e.code === 'KeyQ' || e.code === 'Tab')) {
    player.state.weapon = cycleWeapon(player, 1); hud.showWheel(player.state.weapon); e.preventDefault();
  }
  if (e.code === 'KeyM') setMission(state.mission);
  if (e.code === 'KeyP') { state.paused = !state.paused; hud.toast(state.paused ? 'Paused' : 'Resumed'); }
  if (e.code === 'F5') { e.preventDefault(); if (saveGame({ mission: state.mission, money: state.money, weapon: player.state.weapon, x: player.state.x, z: player.state.z, rot: player.state.rot, wanted: police.state.wanted })) hud.toast('Game saved'); }
});
addEventListener('keyup', (e) => { if (keyMap[e.code] !== undefined) input[keyMap[e.code]] = false; });
let dragging = false, lx = 0, ly = 0;
canvas.addEventListener('mousedown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; ensureAudio(); });
addEventListener('mouseup', () => { dragging = false; });
addEventListener('mousemove', (e) => {
  if (!dragging) return;
  player.state.camYaw -= (e.clientX - lx) * 0.005;
  player.state.camPitch = Math.max(-0.1, Math.min(0.8, player.state.camPitch + (e.clientY - ly) * 0.003));
  lx = e.clientX; ly = e.clientY;
});
canvas.addEventListener('click', () => {
  if (shotNo || !state.started || player.state.wheelOpen) return;
  ensureAudio(); sfx.shoot();
  police.state.addHeat(6);
});
hud.el.startBtn.addEventListener('click', () => {
  ensureAudio(); sfx.start();
  hud.hideStart();
  state.started = true;
  setMission(state.mission);
});

// ---- the loop
const clock = new THREE.Clock();
let frames = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  if (state.paused) { renderer.render(scene, camera); return; }
  sky.update(t);
  city.update(t);
  traffic.update(dt, t);
  const p = player.state;
  const pos = new THREE.Vector3(p.x, 0, p.z);
  police.state.update(dt, pos, !!p.inCar, Math.abs(p.speed));
  if (state.started && !shotNo) {
    updatePlayer(player, input, dt, [...Object.values(cars), ...traffic.cars], city.colliders);
    updateCamera(camera, player, dt);
    // mission marker: reach it to complete the mission
    const m = currentMission();
    if (Math.hypot(p.x - m.x, p.z - m.z) < 9) completeMission();
    engineHum(p.inCar ? Math.min(1, Math.abs(p.speed) / 26) : 0);
    hud.setWanted(police.state.wanted);
    hud.setMoney(state.money);
    hud.setWeapon(p.weapon);
    hud.setSpeed(p.inCar ? p.speed * 3.6 : 0, !!p.inCar);
    hud.drawMinimap({ x: p.x, z: p.z, rot: p.rot }, traffic.cars, police.cars, m, { x: -196, z: -20 });
    // Vera follows the mission: she waits at the beacon for mission 1
    vera.position.set(-198, 0, -24);
  }
  renderer.render(scene, camera);
  frames++;
  if (frames === 3) window.__ready = true;
}

// ---- screenshot mode: stage the shot, then sit still for the capture
if (shotNo >= 1 && shotNo <= 4) {
  state.started = true;
  hud.hideStart();
  stageShot(shotNo, world);
  // keep rendering so the frame stays alive for the capture
  (function still() { requestAnimationFrame(still); renderer.render(scene, camera); })();
  window.__ready = true;
} else {
  setMission(state.mission);
  hud.setWanted(0); hud.setMoney(state.money); hud.setWeapon(state.weapon);
  loop();
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
