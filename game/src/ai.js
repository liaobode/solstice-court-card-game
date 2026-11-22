// Solstice Court — Opponent intent telegraphing and tactical card selection AI.

import { evaluateSynergy } from './cards.js';

/**
 * Selects which card from the opponent's hand to reveal face-up as their telegraphed intent.
 */
export function selectTelegraphedIntent(state) {
  const { opponent, player, difficulty } = state;
  const affordable = opponent.hand.filter((c) => c.cost <= opponent.maxAether);
  if (affordable.length === 0) return null;

  let bestCard = affordable[0];
  let bestScore = -Infinity;

  for (const card of affordable) {
    let score = card.power * 2;
    if (opponent.life <= 14 && (card.heal > 0 || card.ward > 0)) {
      score += (card.heal + card.ward) * 2.2;
    }
    if (player.life <= 12 && card.damage > 0) {
      score += card.damage * 2.4;
    }
    if (player.ward >= 5 && (card.shatter || card.pierce)) {
      score += 8;
    }
    // Lower difficulty adds some unpredictability
    score += (1 - difficulty.smartWeight) * (state.rng() * 14);
    if (score > bestScore) {
      bestScore = score;
      bestCard = card;
    }
  }
  return bestCard;
}

/**
 * Plans the opponent's full sequence of plays for the turn, starting with the telegraphed card
 * if it is still in hand and affordable.
 */
export function planOpponentTurn(state) {
  const { opponent, player, difficulty } = state;
  const planned = [];
  let remainingAether = opponent.aether;
  const handPool = [...opponent.hand];
  const playedSoFar = [];

  // Always commit to the telegraphed intent card first if still affordable
  if (opponent.intentCard) {
    const idx = handPool.findIndex((c) => c.uid === opponent.intentCard.uid);
    if (idx !== -1 && handPool[idx].cost <= remainingAether) {
      const card = handPool.splice(idx, 1)[0];
      planned.push(card);
      playedSoFar.push(card);
      remainingAether -= card.cost;
      remainingAether += card.aetherGain;
    }
  }

  // Pick follow-up cards that maximize damage, defense, and synergy combos
  while (remainingAether > 0 && handPool.length > 0) {
    const affordable = handPool.filter((c) => c.cost <= remainingAether);
    if (affordable.length === 0) break;

    let bestCard = null;
    let bestValue = -Infinity;

    for (const card of affordable) {
      const synergy = evaluateSynergy(playedSoFar, card);
      let value = card.damage * 1.9 + card.ward * 1.4 + card.heal * 1.6 + card.draw * 1.8 + card.aetherGain * 2.2;
      if (card.pierce && player.ward > 0) value += 4.5;
      if (card.shatter && player.ward >= 4) value += 7.0;
      if (opponent.life <= 12 && (card.heal > 0 || card.ward > 0)) value += 5.5;
      if (player.life <= card.damage) value += 15;
      if (synergy) value += (synergy.damage * 2 + synergy.ward * 1.5 + synergy.heal * 1.8 + 4) * difficulty.smartWeight;
      value += (1 - difficulty.smartWeight) * (state.rng() * 10);

      if (value > bestValue) {
        bestValue = value;
        bestCard = card;
      }
    }

    if (!bestCard) break;
    const removeIdx = handPool.findIndex((c) => c.uid === bestCard.uid);
    handPool.splice(removeIdx, 1);
    planned.push(bestCard);
    playedSoFar.push(bestCard);
    remainingAether -= bestCard.cost;
    remainingAether += bestCard.aetherGain;
  }

  return planned;
}
