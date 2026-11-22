// Solstice Court — Deterministic showcase states for reproducible browser screenshots.
// Supports ?shot=table|title|victory|defeat&seed=1

import { createCardInstance } from './cards.js';
import { createMatchState } from './engine.js';
import { spawnBurst, spawnPopup, spawnVictoryFlourish } from './animation.js';
import { VIEW_H, VIEW_W } from './render.js';

export function applyShotIfRequested(fx) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') ?? '1') || 1;
  if (!shot) return null;

  if (shot === 'title') {
    const state = createMatchState({ seed, difficultyIndex: 1, startOnTitle: true });
    fx.time = 1.2;
    return state;
  }

  if (shot === 'table') {
    const state = createMatchState({ seed, difficultyIndex: 1, startOnTitle: false });
    state.round = 4;
    state.score = 385;
    state.combosTriggered = 2;
    state.countersLanded = 1;
    state.bestComboName = 'ECLIPSE CHAIN';

    state.player.life = 24;
    state.player.ward = 6;
    state.player.maxAether = 5;
    state.player.aether = 3;
    state.player.deflectReady = true;
    state.player.playedThisTurn = [
      createCardInstance('flare-arc'),
      createCardInstance('tidal-mirror'),
    ];
    state.player.hand = [
      createCardInstance('sunlance'),
      createCardInstance('canopy-rite'),
      createCardInstance('crown-breaker'),
      createCardInstance('silver-ward'),
      createCardInstance('royal-decree'),
    ];
    state.hoveredHandIndex = 1; // Canopy Rite triggers SOLSTICE CONVERGENCE!

    state.opponent.life = 17;
    state.opponent.ward = 4;
    state.opponent.maxAether = 5;
    state.opponent.aether = 5;
    state.opponent.intentCard = createCardInstance('corona-burst');
    state.opponent.hand = [
      state.opponent.intentCard,
      createCardInstance('silver-ward'),
      createCardInstance('briar-balm'),
      createCardInstance('royal-decree'),
      createCardInstance('sunlance'),
    ];

    state.lastBanner = {
      text: 'ECLIPSE CHAIN',
      subtext: '+4 BONUS DMG  ·  +3 WARD',
      color: '#38bdf8',
      timer: 1.8,
    };
    state.activeSynergyArc = { suit: 'lunar', color: '#38bdf8', timer: 1.4 };

    fx.time = 2.4;
    spawnBurst(fx, VIEW_W * 0.47, VIEW_H * 0.44, '#38bdf8', 22, 160);
    spawnPopup(fx, VIEW_W * 0.47, VIEW_H * 0.36, 'ECLIPSE +4 DMG!', '#fcd34d', 24);
    return state;
  }

  if (shot === 'victory') {
    const state = createMatchState({ seed, difficultyIndex: 1, startOnTitle: false });
    state.round = 6;
    state.screen = 'victory';
    state.phase = 'victory';
    state.score = 1140;
    state.combosTriggered = 4;
    state.countersLanded = 3;
    state.bestComboName = 'SOLSTICE CONVERGENCE';
    state.player.life = 22;
    state.player.ward = 5;
    state.opponent.life = 0;
    state.player.playedThisTurn = [
      createCardInstance('corona-burst'),
      createCardInstance('tidal-mirror'),
      createCardInstance('imperial-gambit'),
    ];
    fx.time = 3.0;
    spawnVictoryFlourish(fx, VIEW_W, VIEW_H);
    return state;
  }

  if (shot === 'defeat') {
    const state = createMatchState({ seed, difficultyIndex: 2, startOnTitle: false });
    state.round = 7;
    state.screen = 'defeat';
    state.phase = 'defeat';
    state.score = 520;
    state.combosTriggered = 2;
    state.countersLanded = 1;
    state.bestComboName = 'SOLAR RESONANCE';
    state.player.life = 0;
    state.opponent.life = 11;
    state.opponent.playedThisTurn = [
      createCardInstance('corona-burst'),
      createCardInstance('royal-decree'),
    ];
    fx.time = 2.0;
    return state;
  }

  return null;
}
