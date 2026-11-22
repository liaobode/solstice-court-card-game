// Solstice Court — Core duel state machine, turn resolution, counters, and scoring.

import { DIFFICULTIES, RULES, SUITS } from './config.js';
import { createRng, shuffleInPlace } from './random.js';
import { buildDeck, evaluateSynergy } from './cards.js';
import { planOpponentTurn, selectTelegraphedIntent } from './ai.js';

function createFighter(name, rng) {
  return {
    name,
    life: RULES.startingLife,
    maxLife: RULES.maxLife,
    ward: 0,
    aether: RULES.startingAether,
    maxAether: RULES.startingAether,
    deck: buildDeck(rng),
    hand: [],
    discard: [],
    playedThisTurn: [],
    intentCard: null,
    deflectReady: false,
  };
}

export function createMatchState({ seed = Date.now() & 0xffff, difficultyIndex = 1, startOnTitle = true } = {}) {
  const rng = createRng(seed);
  const difficulty = DIFFICULTIES[difficultyIndex] ?? DIFFICULTIES[1];
  const state = {
    screen: startOnTitle ? 'title' : 'playing',
    seed,
    rng,
    difficultyIndex,
    difficulty,
    round: 1,
    phase: 'player', // 'player' | 'opponent' | 'victory' | 'defeat'
    score: 0,
    combosTriggered: 0,
    countersLanded: 0,
    totalDamageDealt: 0,
    bestComboName: 'None',
    showHelp: false,
    muted: false,
    hoveredHandIndex: -1,
    selectedHandIndex: -1,
    lastBanner: null,
    activeSynergyArc: null,
    opponentQueue: [],
    opponentTimer: 0,
    player: createFighter('You', rng),
    opponent: createFighter('Astral Automaton', rng),
    log: [],
    statusText: 'Solstice Court ready.',
  };

  if (!startOnTitle) {
    setupRoundOne(state);
  }
  return state;
}

export function startNewDuel(state, difficultyIndex = state.difficultyIndex, seed = ((state.seed + 137) & 0xffff) || 1) {
  const next = createMatchState({ seed, difficultyIndex, startOnTitle: false });
  Object.assign(state, next);
  return state;
}

export function drawCards(fighter, count, rng) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (fighter.hand.length >= 7) break;
    if (fighter.deck.length === 0) {
      if (fighter.discard.length === 0) break;
      fighter.deck = shuffleInPlace(fighter.discard.splice(0), rng);
    }
    const card = fighter.deck.pop();
    if (card) {
      fighter.hand.push(card);
      drawn.push(card);
    }
  }
  return drawn;
}

export function setupRoundOne(state) {
  drawCards(state.player, RULES.handLimit, state.rng);
  drawCards(state.opponent, RULES.handLimit, state.rng);
  state.opponent.maxAether = Math.min(RULES.maxAetherCap, RULES.startingAether + state.difficulty.bonusAether);
  state.opponent.aether = state.opponent.maxAether;
  state.opponent.intentCard = selectTelegraphedIntent(state);
  state.statusText = `Round 1. Your turn. Aether ${state.player.aether}/${state.player.maxAether}.`;
}

export function canPlayCard(state, handIndex) {
  if (state.screen !== 'playing' || state.phase !== 'player') return false;
  const card = state.player.hand[handIndex];
  return Boolean(card && card.cost <= state.player.aether);
}

function applyDamage(target, amount, { pierce = false, shatter = false } = {}) {
  let shattered = 0;
  if (shatter && target.ward > 0) {
    shattered = target.ward;
    target.ward = 0;
  }
  let blocked = 0;
  let hpDamage = amount;
  if (!pierce && target.ward > 0 && hpDamage > 0) {
    blocked = Math.min(target.ward, hpDamage);
    target.ward -= blocked;
    hpDamage -= blocked;
  }
  target.life = Math.max(0, target.life - hpDamage);
  return { hpDamage, blocked, shattered };
}

/**
 * Resolves playing a card for either 'player' or 'opponent'.
 * Returns a detailed event record so animation & audio can react with polish.
 */
export function resolveCardPlay(state, side, handIndex) {
  const actor = side === 'player' ? state.player : state.opponent;
  const target = side === 'player' ? state.opponent : state.player;
  const card = actor.hand[handIndex];
  if (!card || card.cost > actor.aether) return null;

  actor.hand.splice(handIndex, 1);
  actor.aether -= card.cost;

  const synergy = evaluateSynergy(actor.playedThisTurn, card);
  actor.playedThisTurn.push(card);

  // Check tactical counter-play against telegraphed opponent intent
  let counterBonus = null;
  if (side === 'player' && state.opponent.intentCard) {
    const intent = state.opponent.intentCard;
    if (card.suit === 'lunar' && card.ward > 0 && intent.damage >= 4 && !actor.deflectReady) {
      actor.deflectReady = true;
      state.countersLanded += 1;
      state.score += 30;
      counterBonus = { label: 'DEFLECT READY', color: '#38bdf8', extraDamage: 0 };
    } else if (card.suit === 'imperial' && (card.shatter || card.pierce) && (target.ward > 0 || intent.ward >= 4)) {
      state.countersLanded += 1;
      state.score += 35;
      counterBonus = { label: 'COUNTER BREAK +2', color: '#e879f9', extraDamage: 2 };
    }
  }

  // Base card effects
  const totalDamage = card.damage + (counterBonus?.extraDamage ?? 0);
  const dmgResult = applyDamage(target, totalDamage, { pierce: card.pierce, shatter: card.shatter });

  if (card.ward > 0) actor.ward += card.ward;
  let healed = 0;
  if (card.heal > 0) {
    const before = actor.life;
    actor.life = Math.min(actor.maxLife, actor.life + card.heal);
    healed = actor.life - before;
  }
  if (card.aetherGain > 0) {
    actor.aether = Math.min(RULES.maxAetherCap + 2, actor.aether + card.aetherGain);
  }
  if (card.draw > 0) {
    drawCards(actor, card.draw, state.rng);
  }

  // Deflect reflection when opponent attacks a deflected player
  let reflected = 0;
  if (side === 'opponent' && totalDamage > 0 && target.deflectReady) {
    target.deflectReady = false;
    reflected = 3;
    actor.life = Math.max(0, actor.life - reflected);
    state.totalDamageDealt += reflected;
    state.score += 25;
  }

  // Synergy combo effects
  let synergyDamage = 0;
  if (synergy) {
    if (synergy.damage > 0) {
      const synRes = applyDamage(target, synergy.damage, { pierce: synergy.pierce });
      synergyDamage = synRes.hpDamage;
    }
    if (synergy.ward > 0) actor.ward += synergy.ward;
    if (synergy.heal > 0) actor.life = Math.min(actor.maxLife, actor.life + synergy.heal);
    if (synergy.draw > 0) drawCards(actor, synergy.draw, state.rng);

    if (side === 'player') {
      state.combosTriggered += 1;
      state.score += synergy.points;
      state.bestComboName = synergy.name;
      state.lastBanner = { text: synergy.name, subtext: synergy.shortLabel, color: synergy.color, timer: 1.8 };
      state.activeSynergyArc = { suit: card.suit, color: synergy.color, timer: 1.4 };
    }
  } else if (counterBonus && side === 'player') {
    state.lastBanner = { text: counterBonus.label, subtext: 'Intent Countered!', color: counterBonus.color, timer: 1.4 };
  }

  if (side === 'player') {
    const dealt = dmgResult.hpDamage + synergyDamage;
    state.totalDamageDealt += dealt;
    state.score += dealt * 8 + dmgResult.shattered * 5 + (card.ward > 0 ? card.ward * 2 : 0) + healed * 3;
  }

  // Clear opponent intent visual once played
  if (side === 'opponent' && actor.intentCard && actor.intentCard.uid === card.uid) {
    actor.intentCard = null;
  }

  const event = {
    side,
    card,
    synergy,
    counterBonus,
    dmgResult,
    synergyDamage,
    healed,
    reflected,
    suitColor: SUITS[card.suit].color,
  };

  state.log.unshift(`${actor.name} played ${card.name}${synergy ? ` (${synergy.name})` : ''}`);
  if (state.log.length > 6) state.log.pop();

  checkMatchOutcome(state);
  return event;
}

export function endPlayerTurn(state) {
  if (state.screen !== 'playing' || state.phase !== 'player') return false;
  state.phase = 'opponent';
  state.hoveredHandIndex = -1;
  state.selectedHandIndex = -1;
  state.opponent.playedThisTurn = [];
  state.opponentQueue = planOpponentTurn(state);
  state.opponentTimer = 0.55;
  state.statusText = 'Opponent turn resolving.';
  return true;
}

export function stepOpponentTurn(state, dt) {
  if (state.screen !== 'playing' || state.phase !== 'opponent') return null;
  state.opponentTimer -= dt;
  if (state.opponentTimer > 0) return null;

  if (state.opponentQueue.length > 0) {
    const nextCard = state.opponentQueue.shift();
    const idx = state.opponent.hand.findIndex((c) => c.uid === nextCard.uid);
    state.opponentTimer = 0.72;
    if (idx !== -1) {
      return resolveCardPlay(state, 'opponent', idx);
    }
  }

  // Opponent finished: advance to next round
  advanceNextRound(state);
  return { type: 'round-start', round: state.round };
}

function advanceNextRound(state) {
  if (state.phase === 'victory' || state.phase === 'defeat') return;

  // Move played cards to discard piles
  state.player.discard.push(...state.player.playedThisTurn.splice(0));
  state.opponent.discard.push(...state.opponent.playedThisTurn.splice(0));

  state.round += 1;
  if (state.round > RULES.maxRounds) {
    if (state.player.life >= state.opponent.life) {
      finishMatch(state, 'victory');
    } else {
      finishMatch(state, 'defeat');
    }
    return;
  }

  const nextMaxAether = Math.min(RULES.maxAetherCap, RULES.startingAether + state.round - 1);
  state.player.maxAether = nextMaxAether;
  state.player.aether = nextMaxAether;
  state.player.ward = Math.floor(state.player.ward * 0.5);
  state.player.deflectReady = false;

  state.opponent.maxAether = Math.min(RULES.maxAetherCap, nextMaxAether + state.difficulty.bonusAether);
  state.opponent.aether = state.opponent.maxAether;
  state.opponent.ward = Math.floor(state.opponent.ward * 0.5);

  const playerNeed = Math.max(1, RULES.handLimit - state.player.hand.length);
  const oppNeed = Math.max(1, RULES.handLimit - state.opponent.hand.length);
  drawCards(state.player, Math.min(2, playerNeed), state.rng);
  drawCards(state.opponent, Math.min(2, oppNeed), state.rng);

  state.opponent.intentCard = selectTelegraphedIntent(state);
  state.phase = 'player';
  state.statusText = `Round ${state.round}. Your turn. Aether ${state.player.aether}/${state.player.maxAether}.`;
}

export function checkMatchOutcome(state) {
  if (state.opponent.life <= 0) {
    finishMatch(state, 'victory');
  } else if (state.player.life <= 0) {
    finishMatch(state, 'defeat');
  }
}

function finishMatch(state, outcome) {
  state.phase = outcome;
  state.screen = outcome;
  if (outcome === 'victory') {
    state.score += state.player.life * 15 + Math.max(0, (RULES.maxRounds - state.round) * 20);
    state.statusText = `Victory! Final score ${state.score}.`;
  } else {
    state.statusText = `Defeat on round ${state.round}. Final score ${state.score}.`;
  }
}
