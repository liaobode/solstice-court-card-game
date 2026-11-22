// Solstice Court — Main canvas bootstrap, fixed-step loop, and event wiring.

import { createMatchState, endPlayerTurn, resolveCardPlay, startNewDuel, stepOpponentTurn } from './engine.js';
import { createFxState, spawnBurst, spawnPopup, spawnVictoryFlourish, triggerImpact, updateFx } from './animation.js';
import { playCardSlide, playCardSnap, playComboChime, playDefeatChord, playShieldClang, playVictoryFanfare, setMuted } from './audio.js';
import { renderFrame, VIEW_H, VIEW_W } from './render.js';
import { attachInput } from './input.js';
import { applyShotIfRequested } from './shots.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const ctx = canvas.getContext('2d');

const fx = createFxState();
const shotState = applyShotIfRequested(fx);
const state = shotState ?? createMatchState({ startOnTitle: true });

function announceStatus() {
  if (statusEl && state.statusText) {
    statusEl.textContent = state.statusText;
  }
}

function handlePlayEvent(event) {
  if (!event || !event.card) return;
  playCardSnap(event.card.suit);

  const isPlayer = event.side === 'player';
  const targetX = isPlayer ? 170 : 170;
  const targetY = isPlayer ? 70 : VIEW_H - 72;

  if (event.dmgResult.hpDamage > 0) {
    triggerImpact(fx, event.dmgResult.hpDamage >= 7 ? 9 : 5, event.suitColor);
    spawnBurst(fx, targetX, targetY, event.suitColor, 18, 210);
    spawnPopup(fx, targetX, targetY, `-${event.dmgResult.hpDamage} HP`, '#fb7185', 28);
  } else if (event.dmgResult.blocked > 0) {
    playShieldClang();
    spawnPopup(fx, targetX, targetY, `BLOCKED ${event.dmgResult.blocked}`, '#38bdf8', 22);
  }

  if (event.dmgResult.shattered > 0) {
    spawnPopup(fx, targetX + 70, targetY + 20, `WARD SHATTERED!`, '#e879f9', 22);
  }

  if (event.card.ward > 0) {
    playShieldClang();
    const selfY = isPlayer ? VIEW_H - 72 : 70;
    spawnPopup(fx, 180, selfY - 20, `+${event.card.ward} WARD`, '#38bdf8', 22);
  }

  if (event.healed > 0) {
    const selfY = isPlayer ? VIEW_H - 72 : 70;
    spawnPopup(fx, 240, selfY - 24, `+${event.healed} HP`, '#34d399', 22);
  }

  if (event.reflected > 0) {
    spawnPopup(fx, 190, 86, `DEFLECT -${event.reflected}`, '#38bdf8', 24);
  }

  if (event.synergy) {
    playComboChime();
    spawnBurst(fx, VIEW_W * 0.47, VIEW_H * 0.44, event.synergy.color, 26, 240);
  }

  if (state.screen === 'victory') {
    playVictoryFanfare();
    spawnVictoryFlourish(fx, VIEW_W, VIEW_H);
  } else if (state.screen === 'defeat') {
    playDefeatChord();
  }

  announceStatus();
}

attachInput(canvas, state, {
  onHoverCard() {
    playCardSlide();
  },
  onSelectDifficulty() {
    playCardSlide();
  },
  onStartGame() {
    fx.cardVisuals.clear();
    fx.particles.length = 0;
    fx.popups.length = 0;
    startNewDuel(state, state.difficultyIndex);
    playCardSlide();
    announceStatus();
  },
  onReturnTitle() {
    state.screen = 'title';
    state.showHelp = false;
    playCardSlide();
  },
  onToggleMute() {
    state.muted = !state.muted;
    setMuted(state.muted);
  },
  onPlayCard(idx) {
    const event = resolveCardPlay(state, 'player', idx);
    handlePlayEvent(event);
  },
  onEndTurn() {
    if (endPlayerTurn(state)) {
      playCardSlide();
      announceStatus();
    }
  },
});

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || window.innerWidth || VIEW_W;
  const h = canvas.clientHeight || window.innerHeight || VIEW_H;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const scale = Math.min(w / VIEW_W, h / VIEW_H);
  const offsetX = (w - VIEW_W * scale) / 2;
  const offsetY = (h - VIEW_H * scale) / 2;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
  if (shotState) {
    renderFrame(ctx, state, fx, 10);
  }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// If in deterministic screenshot mode, render settled frames after layout completes
if (shotState) {
  renderFrame(ctx, state, fx, 10);
  announceStatus();
  requestAnimationFrame(() => {
    resizeCanvas();
    renderFrame(ctx, state, fx, 10);
  });
} else {
  let lastTs = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
    lastTs = now;
    const oppEvent = stepOpponentTurn(state, dt);
    if (oppEvent && oppEvent.card) {
      handlePlayEvent(oppEvent);
    } else if (oppEvent && oppEvent.type === 'round-start') {
      playCardSlide();
      announceStatus();
    }
    updateFx(fx, state, dt);
    renderFrame(ctx, state, fx, dt);
    requestAnimationFrame(loop);
  }
  announceStatus();
  requestAnimationFrame(loop);
}
