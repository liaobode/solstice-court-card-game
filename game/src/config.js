// Solstice Court — Design palette, geometry constants, and match rules.

export const GAME_TITLE = 'SOLSTICE COURT';
export const GAME_SUBTITLE = 'Tactical Astral Card Duel';

export const RULES = {
  startingLife: 30,
  maxLife: 30,
  startingAether: 3,
  maxAetherCap: 6,
  handLimit: 5,
  maxRounds: 12,
};

export const DIFFICULTIES = [
  { id: 'apprentice', label: 'Apprentice', subtitle: 'Forgiving Court', bonusAether: 0, smartWeight: 0.45 },
  { id: 'tactician', label: 'Tactician', subtitle: 'Balanced Duel', bonusAether: 0, smartWeight: 0.85 },
  { id: 'grandmaster', label: 'Grandmaster', subtitle: 'Ruthless Strategist', bonusAether: 1, smartWeight: 1.0 },
];

export const SUITS = {
  solar: {
    id: 'solar',
    name: 'Solar',
    color: '#f59e0b',
    dark: '#78350f',
    light: '#fef3c7',
    glow: 'rgba(245, 158, 11, 0.45)',
    role: 'Strike & Burn',
  },
  lunar: {
    id: 'lunar',
    name: 'Lunar',
    color: '#38bdf8',
    dark: '#0c4a6e',
    light: '#e0f2fe',
    glow: 'rgba(56, 189, 248, 0.45)',
    role: 'Ward & Draw',
  },
  verdant: {
    id: 'verdant',
    name: 'Verdant',
    color: '#10b981',
    dark: '#064e3b',
    light: '#d1fae5',
    glow: 'rgba(16, 185, 129, 0.45)',
    role: 'Mend & Surge',
  },
  imperial: {
    id: 'imperial',
    name: 'Imperial',
    color: '#d946ef',
    dark: '#581c87',
    light: '#fae8ff',
    glow: 'rgba(217, 70, 239, 0.45)',
    role: 'Pierce & Disrupt',
  },
};

export const PALETTE = {
  bgDeep: '#061412',
  feltInner: '#113a33',
  feltMid: '#0b2924',
  feltOuter: '#061815',
  woodOuter: '#2c1910',
  woodInner: '#4a2c1d',
  brass: '#d4a656',
  brassBright: '#f6d58b',
  brassMuted: 'rgba(212, 166, 86, 0.28)',
  parchment: '#fbf6ea',
  parchmentEdge: '#e6d8bc',
  ink: '#1c1917',
  inkMuted: '#57534e',
  cardBack: '#152338',
  cardBackAccent: '#d4a656',
  hpRed: '#ef4444',
  hpGreen: '#22c55e',
  wardCyan: '#38bdf8',
  aetherGold: '#fbbf24',
  danger: '#f43f5e',
  victoryGold: '#fcd34d',
  defeatCrimson: '#fb7185',
};

export const CARD_METRICS = {
  width: 146,
  height: 204,
  radius: 13,
  oppWidth: 96,
  oppHeight: 134,
  tableWidth: 122,
  tableHeight: 170,
};
