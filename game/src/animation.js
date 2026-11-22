// Solstice Court — Smooth spring card motion, particles, floating combat text, and screen shake.

export function createFxState() {
  return {
    particles: [],
    popups: [],
    cardVisuals: new Map(), // uid -> { x, y, rot, scale, flip }
    shake: 0,
    flash: 0,
    flashColor: '#fcd34d',
    time: 0,
  };
}

export function spawnBurst(fx, x, y, color, count = 20, speed = 220) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const spd = speed * (0.45 + Math.random() * 0.75);
    fx.particles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 35,
      size: 2.5 + Math.random() * 4.5,
      color,
      life: 0.55 + Math.random() * 0.5,
      maxLife: 1.05,
      shape: i % 3 === 0 ? 'diamond' : 'circle',
      gravity: 190,
    });
  }
}

export function spawnVictoryFlourish(fx, width, height) {
  const colors = ['#fcd34d', '#f59e0b', '#38bdf8', '#34d399', '#f472b6'];
  for (let i = 0; i < 65; i += 1) {
    const c = colors[i % colors.length];
    fx.particles.push({
      x: width * (0.15 + Math.random() * 0.7),
      y: height * (0.1 + Math.random() * 0.4),
      vx: (Math.random() - 0.5) * 190,
      vy: -60 - Math.random() * 140,
      size: 4 + Math.random() * 5,
      color: c,
      life: 1.6 + Math.random() * 1.4,
      maxLife: 3.0,
      shape: 'diamond',
      gravity: 110,
    });
  }
}

export function spawnPopup(fx, x, y, text, color = '#ffffff', size = 26) {
  fx.popups.push({
    x,
    y,
    vy: -56,
    text,
    color,
    size,
    life: 1.25,
    maxLife: 1.25,
  });
}

export function triggerImpact(fx, intensity = 7, flashColor = '#f59e0b') {
  fx.shake = Math.max(fx.shake, intensity);
  fx.flash = 0.22;
  fx.flashColor = flashColor;
}

export function stepCardSpring(fx, uid, target, dt, spawnFrom = null) {
  let vis = fx.cardVisuals.get(uid);
  if (!vis) {
    vis = spawnFrom
      ? { x: spawnFrom.x, y: spawnFrom.y, rot: spawnFrom.rot ?? 0, scale: 0.5, flip: 0 }
      : { x: target.x, y: target.y, rot: target.rot, scale: target.scale, flip: 1 };
    fx.cardVisuals.set(uid, vis);
  }
  const factor = 1 - Math.exp(-13 * dt);
  vis.x += (target.x - vis.x) * factor;
  vis.y += (target.y - vis.y) * factor;
  vis.rot += (target.rot - vis.rot) * factor;
  vis.scale += (target.scale - vis.scale) * factor;
  vis.flip += (1 - vis.flip) * Math.min(1, dt * 8);
  return vis;
}

export function updateFx(fx, state, dt) {
  fx.time += dt;
  fx.shake = Math.max(0, fx.shake - dt * 28);
  fx.flash = Math.max(0, fx.flash - dt * 1.1);

  if (state.lastBanner) {
    state.lastBanner.timer -= dt;
    if (state.lastBanner.timer <= 0) state.lastBanner = null;
  }
  if (state.activeSynergyArc) {
    state.activeSynergyArc.timer -= dt;
    if (state.activeSynergyArc.timer <= 0) state.activeSynergyArc = null;
  }

  for (let i = fx.particles.length - 1; i >= 0; i -= 1) {
    const p = fx.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.gravity * dt;
    p.vx *= 0.985;
    p.life -= dt;
    if (p.life <= 0) fx.particles.splice(i, 1);
  }

  for (let i = fx.popups.length - 1; i >= 0; i -= 1) {
    const pop = fx.popups[i];
    pop.y += pop.vy * dt;
    pop.vy *= 0.94;
    pop.life -= dt;
    if (pop.life <= 0) fx.popups.splice(i, 1);
  }
}
