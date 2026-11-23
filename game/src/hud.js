// hud.js — everything on screen that is not the 3D world: the minimap, wanted
// stars, money, weapon, objective, dialogue, the judge tagline and the
// weapon wheel. All DOM, updated once a frame from the game state.
import { WEAPONS } from './police.js';

const $ = (id) => document.getElementById(id);

export function buildHud() {
  const el = {
    tagline: $('tagline'), minimap: $('minimap'), wanted: $('wanted'),
    money: $('money'), weapon: $('weapon'), objective: $('objective'),
    dialogue: $('dialogue'), speed: $('speed'), wheel: $('wheel'),
    toast: $('toast'), start: $('start'), startBtn: $('startBtn'),
  };
  const mm = el.minimap.getContext('2d');
  let toastTimer = 0;

  function drawMinimap(player, cars, policeCars, mission, beacon) {
    const W = 176, S = W / 560; // city is 560 across
    mm.fillStyle = 'rgba(12,20,28,.9)'; mm.fillRect(0, 0, W, W);
    // sea (west) + beach
    mm.fillStyle = '#2a5a78'; mm.fillRect(0, 0, 26, W);
    mm.fillStyle = '#e0c090'; mm.fillRect(26, 0, 8, W);
    // roads
    mm.fillStyle = '#3a3a3a';
    mm.fillRect(46, 0, 5, W);            // Paseo del Mar
    mm.fillRect(0, 88, W, 5);            // Avenida Centro
    mm.fillRect(0, 148, W, 4);           // Calle Sol
    mm.fillRect(96, 0, 4, W);            // Calle Faro
    // districts
    mm.fillStyle = 'rgba(200,160,120,.35)';
    mm.fillRect(60, 60, 70, 60);         // Centro
    mm.fillStyle = 'rgba(60,120,60,.4)';
    mm.fillRect(150, 20, 26, 26);        // stadium
    mm.fillStyle = 'rgba(255,210,122,.5)';
    mm.fillRect(30, 78, 14, 12);         // plaza
    // mission marker (gold diamond, pulsing)
    if (mission) {
      const mx = (mission.x + 280) * S, my = (mission.z + 280) * S;
      const p = 1 + 0.25 * Math.sin(performance.now() / 200);
      mm.fillStyle = '#ffd27a';
      mm.save(); mm.translate(mx, my); mm.rotate(Math.PI / 4); mm.scale(p, p);
      mm.fillRect(-5, -5, 10, 10); mm.restore();
    }
    // beacon
    mm.fillStyle = '#ff9040';
    mm.beginPath(); mm.arc((beacon.x + 280) * S, (beacon.z + 280) * S, 4, 0, 7); mm.fill();
    // police (blue/red dots)
    for (const c of policeCars) if (c.visible) {
      mm.fillStyle = '#4080ff';
      mm.beginPath(); mm.arc((c.position.x + 280) * S, (c.position.z + 280) * S, 3, 0, 7); mm.fill();
    }
    // traffic (grey dots)
    mm.fillStyle = 'rgba(255,255,255,.55)';
    for (const c of cars) {
      mm.fillRect((c.position.x + 280) * S - 1, (c.position.z + 280) * S - 1, 2, 2);
    }
    // player (white arrow)
    const px = (player.x + 280) * S, py = (player.z + 280) * S;
    mm.save(); mm.translate(px, py); mm.rotate(-player.rot);
    mm.fillStyle = '#fff'; mm.beginPath();
    mm.moveTo(0, -7); mm.lineTo(5, 6); mm.lineTo(-5, 6); mm.closePath(); mm.fill();
    mm.restore();
    // north + border
    mm.fillStyle = '#fff'; mm.font = 'bold 11px Georgia'; mm.fillText('N', 4, 12);
  }

  return {
    el,
    setWanted(n) {
      let s = '';
      for (let i = 0; i < 5; i++) s += `<span class="${i < n ? '' : 'off'}">★</span>`;
      el.wanted.innerHTML = s;
    },
    setMoney(n) { el.money.textContent = '$' + n.toLocaleString('en-US'); },
    setWeapon(i) { el.weapon.textContent = WEAPONS[i] || WEAPONS[0]; },
    setObjective(t) { el.objective.textContent = t; },
    setSpeed(kmh, inCar) {
      el.speed.innerHTML = inCar ? `${Math.round(Math.abs(kmh))} <small>km/h</small>` : '';
    },
    showDialogue(who, line) {
      el.dialogue.style.display = 'block';
      el.dialogue.innerHTML = `<span class="who">${who}:</span> ${line}`;
    },
    hideDialogue() { el.dialogue.style.display = 'none'; },
    toast(text, ms = 2600) {
      el.toast.textContent = text; el.toast.style.display = 'block';
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { el.toast.style.display = 'none'; }, ms);
    },
    showWheel(selected) {
      el.wheel.style.display = 'block';
      el.wheel.innerHTML = WEAPONS.map((w, i) => {
        const a = (i / WEAPONS.length) * Math.PI * 2 - Math.PI / 2;
        const x = 130 + Math.cos(a) * 88, y = 130 + Math.sin(a) * 88;
        return `<div style="left:${x}px;top:${y}px;transform:translate(-50%,-50%);color:${i === selected ? '#ffd27a' : '#fff'};font-weight:${i === selected ? 'bold' : 'normal'}">${w}</div>`;
      }).join('');
    },
    hideWheel() { el.wheel.style.display = 'none'; },
    hideStart() { el.start.style.display = 'none'; },
    showStart() { el.start.style.display = 'flex'; },
    drawMinimap,
  };
}
