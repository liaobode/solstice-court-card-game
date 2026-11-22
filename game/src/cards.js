// Solstice Court — Card catalog, deck construction, and synergy combo rules.

import { shuffleInPlace } from './random.js';

export const CARD_DEFINITIONS = [
  // SOLAR — Direct Strikes & Burn
  {
    id: 'sunlance',
    name: 'Sunlance',
    suit: 'solar',
    cost: 1,
    power: 4,
    damage: 4,
    ward: 0,
    heal: 0,
    draw: 0,
    aetherGain: 0,
    pierce: false,
    shatter: false,
    summary: 'Deal 4 dmg',
  },
  {
    id: 'flare-arc',
    name: 'Flare Arc',
    suit: 'solar',
    cost: 2,
    power: 7,
    damage: 7,
    ward: 0,
    heal: 0,
    draw: 0,
    aetherGain: 0,
    pierce: false,
    shatter: false,
    summary: 'Deal 7 dmg',
  },
  {
    id: 'corona-burst',
    name: 'Corona Burst',
    suit: 'solar',
    cost: 3,
    power: 10,
    damage: 10,
    ward: 0,
    heal: 0,
    draw: 0,
    aetherGain: 0,
    pierce: false,
    shatter: false,
    summary: 'Deal 10 dmg',
  },
  {
    id: 'ember-feint',
    name: 'Ember Feint',
    suit: 'solar',
    cost: 1,
    power: 3,
    damage: 3,
    ward: 0,
    heal: 0,
    draw: 1,
    aetherGain: 0,
    pierce: false,
    shatter: false,
    summary: '3 dmg · Draw 1',
  },

  // LUNAR — Ward, Deflect & Draw
  {
    id: 'silver-ward',
    name: 'Silver Ward',
    suit: 'lunar',
    cost: 1,
    power: 5,
    damage: 0,
    ward: 5,
    heal: 0,
    draw: 0,
    aetherGain: 0,
    pierce: false,
    shatter: false,
    summary: '+5 Ward',
  },
  {
    id: 'tidal-mirror',
    name: 'Tidal Mirror',
    suit: 'lunar',
    cost: 2,
    power: 7,
    damage: 2,
    ward: 6,
    heal: 0,
    draw: 0,
    aetherGain: 0,
    pierce: false,
    shatter: false,
    summary: '+6 Ward · 2 dmg',
  },
  {
    id: 'crescent-veil',
    name: 'Crescent Veil',
    suit: 'lunar',
    cost: 2,
    power: 6,
    damage: 0,
    ward: 5,
    heal: 0,
    draw: 1,
    aetherGain: 0,
    pierce: false,
    shatter: false,
    summary: '+5 Ward · Draw 1',
  },
  {
    id: 'starlight-gaze',
    name: 'Starlight Gaze',
    suit: 'lunar',
    cost: 1,
    power: 3,
    damage: 0,
    ward: 2,
    heal: 0,
    draw: 2,
    aetherGain: 0,
    pierce: false,
    shatter: false,
    summary: '+2 Ward · Draw 2',
  },

  // VERDANT — Healing & Aether Surge
  {
    id: 'briar-balm',
    name: 'Briar Balm',
    suit: 'verdant',
    cost: 1,
    power: 4,
    damage: 0,
    ward: 0,
    heal: 4,
    draw: 0,
    aetherGain: 0,
    pierce: false,
    shatter: false,
    summary: 'Heal 4 Life',
  },
  {
    id: 'aether-bloom',
    name: 'Aether Bloom',
    suit: 'verdant',
    cost: 1,
    power: 3,
    damage: 0,
    ward: 2,
    heal: 2,
    draw: 0,
    aetherGain: 2,
    pierce: false,
    shatter: false,
    summary: '+2 Aether · +2 Ward',
  },
  {
    id: 'thorn-lash',
    name: 'Thorn Lash',
    suit: 'verdant',
    cost: 2,
    power: 6,
    damage: 4,
    ward: 0,
    heal: 3,
    draw: 0,
    aetherGain: 0,
    pierce: false,
    shatter: false,
    summary: '4 dmg · Heal 3',
  },
  {
    id: 'canopy-rite',
    name: 'Canopy Rite',
    suit: 'verdant',
    cost: 3,
    power: 8,
    damage: 0,
    ward: 4,
    heal: 6,
    draw: 1,
    aetherGain: 0,
    pierce: false,
    shatter: false,
    summary: 'Heal 6 · +4 Ward',
  },

  // IMPERIAL — Pierce & Ward Shatter
  {
    id: 'royal-decree',
    name: 'Royal Decree',
    suit: 'imperial',
    cost: 2,
    power: 5,
    damage: 5,
    ward: 0,
    heal: 0,
    draw: 0,
    aetherGain: 0,
    pierce: true,
    shatter: false,
    summary: '5 Pierce dmg',
  },
  {
    id: 'crown-breaker',
    name: 'Crown Breaker',
    suit: 'imperial',
    cost: 2,
    power: 6,
    damage: 4,
    ward: 0,
    heal: 0,
    draw: 0,
    aetherGain: 0,
    pierce: false,
    shatter: true,
    summary: 'Shatter Ward · 4 dmg',
  },
  {
    id: 'sovereign-tax',
    name: 'Sovereign Tax',
    suit: 'imperial',
    cost: 1,
    power: 3,
    damage: 3,
    ward: 0,
    heal: 0,
    draw: 0,
    aetherGain: 1,
    pierce: true,
    shatter: false,
    summary: '3 Pierce · +1 Aether',
  },
  {
    id: 'imperial-gambit',
    name: 'Imperial Gambit',
    suit: 'imperial',
    cost: 3,
    power: 8,
    damage: 6,
    ward: 3,
    heal: 0,
    draw: 1,
    aetherGain: 0,
    pierce: true,
    shatter: false,
    summary: '6 Pierce · +3 Ward',
  },
];

let nextUid = 1;

export function createCardInstance(defId) {
  const def = CARD_DEFINITIONS.find((c) => c.id === defId) ?? CARD_DEFINITIONS[0];
  return {
    ...def,
    uid: `card-${nextUid++}`,
  };
}

export function buildDeck(rng) {
  // 24-card balanced deck: 2 copies of core 1-2 cost cards, 1 copy of 3-cost finishers
  const recipe = [
    'sunlance', 'sunlance', 'flare-arc', 'flare-arc', 'corona-burst', 'ember-feint',
    'silver-ward', 'silver-ward', 'tidal-mirror', 'tidal-mirror', 'crescent-veil', 'starlight-gaze',
    'briar-balm', 'briar-balm', 'aether-bloom', 'aether-bloom', 'thorn-lash', 'canopy-rite',
    'royal-decree', 'royal-decree', 'crown-breaker', 'crown-breaker', 'sovereign-tax', 'imperial-gambit',
  ];
  const deck = recipe.map((id) => createCardInstance(id));
  return shuffleInPlace(deck, rng);
}

/**
 * Evaluates whether playing `nextCard` after `playedThisTurn` triggers a synergy combo.
 * Returns null or a combo descriptor with bonus stats and label.
 */
export function evaluateSynergy(playedThisTurn, nextCard) {
  if (!playedThisTurn || playedThisTurn.length === 0) return null;

  const suitsPlayed = new Set(playedThisTurn.map((c) => c.suit));
  const newSuitCount = suitsPlayed.has(nextCard.suit) ? suitsPlayed.size : suitsPlayed.size + 1;

  // Royal Convergence: 3 distinct suits in one turn
  if (!suitsPlayed.has(nextCard.suit) && newSuitCount === 3) {
    return {
      id: 'solstice',
      name: 'SOLSTICE CONVERGENCE',
      shortLabel: 'SOLSTICE +5 DMG',
      color: '#fcd34d',
      damage: 5,
      ward: 0,
      heal: 2,
      draw: 1,
      pierce: false,
      points: 60,
    };
  }

  // Eclipse Chain: Solar + Lunar played together
  if (
    (nextCard.suit === 'solar' && suitsPlayed.has('lunar') && !suitsPlayed.has('solar')) ||
    (nextCard.suit === 'lunar' && suitsPlayed.has('solar') && !suitsPlayed.has('lunar'))
  ) {
    return {
      id: 'eclipse',
      name: 'ECLIPSE CHAIN',
      shortLabel: 'ECLIPSE +4/+3',
      color: '#38bdf8',
      damage: 4,
      ward: 3,
      heal: 0,
      draw: 0,
      pierce: false,
      points: 45,
    };
  }

  // Harmonic Pair: second card of the same suit in one turn
  const sameSuitCount = playedThisTurn.filter((c) => c.suit === nextCard.suit).length;
  if (sameSuitCount === 1) {
    if (nextCard.suit === 'solar') {
      return {
        id: 'pair-solar',
        name: 'SOLAR RESONANCE',
        shortLabel: 'PAIR +3 DMG',
        color: '#f59e0b',
        damage: 3,
        ward: 0,
        heal: 0,
        draw: 0,
        pierce: false,
        points: 35,
      };
    }
    if (nextCard.suit === 'lunar') {
      return {
        id: 'pair-lunar',
        name: 'LUNAR RESONANCE',
        shortLabel: 'PAIR +4 WARD',
        color: '#38bdf8',
        damage: 0,
        ward: 4,
        heal: 0,
        draw: 0,
        pierce: false,
        points: 35,
      };
    }
    if (nextCard.suit === 'verdant') {
      return {
        id: 'pair-verdant',
        name: 'VERDANT RESONANCE',
        shortLabel: 'PAIR +3 HEAL',
        color: '#10b981',
        damage: 0,
        ward: 0,
        heal: 3,
        draw: 1,
        pierce: false,
        points: 35,
      };
    }
    if (nextCard.suit === 'imperial') {
      return {
        id: 'pair-imperial',
        name: 'IMPERIAL RESONANCE',
        shortLabel: 'PAIR +3 PIERCE',
        color: '#d946ef',
        damage: 3,
        ward: 0,
        heal: 0,
        draw: 0,
        pierce: true,
        points: 35,
      };
    }
  }

  return null;
}
