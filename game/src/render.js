// Solstice Court — Canvas 2D renderer: astrolabe table, vector cards, HUD, FX, and screens.

import { CARD_METRICS, DIFFICULTIES, GAME_SUBTITLE, GAME_TITLE, PALETTE, RULES, SUITS } from './config.js';
import { createCardInstance, evaluateSynergy } from './cards.js';
import { stepCardSpring } from './animation.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;

const TITLE_SHOWCASE_CARDS = [
  createCardInstance('corona-burst'),
  createCardInstance('tidal-mirror'),
  createCardInstance('canopy-rite'),
  createCardInstance('imperial-gambit'),
];

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

export function drawSuitEmblem(ctx, suitId, cx, cy, size, fillOverride = null) {
  const suit = SUITS[suitId] ?? SUITS.solar;
  const color = fillOverride ?? suit.color;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = suit.dark;
  ctx.lineWidth = Math.max(1.5, size * 0.08);

  if (suitId === 'solar') {
    // 8-point sunburst
    ctx.beginPath();
    const spikes = 8;
    for (let i = 0; i < spikes * 2; i += 1) {
      const r = i % 2 === 0 ? size : size * 0.46;
      const a = (i * Math.PI) / spikes - Math.PI / 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#fffbeb';
    ctx.fill();
  } else if (suitId === 'lunar') {
    // Crescent moon + accent star
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.9, 0.35, Math.PI * 2 - 0.35);
    ctx.arc(size * 0.38, -size * 0.08, size * 0.68, Math.PI * 2 - 0.55, 0.55, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Small 4-point star
    ctx.beginPath();
    const sx = size * 0.44;
    const sy = -size * 0.14;
    const sr = size * 0.24;
    ctx.moveTo(sx, sy - sr);
    ctx.lineTo(sx + sr * 0.35, sy - sr * 0.35);
    ctx.lineTo(sx + sr, sy);
    ctx.lineTo(sx + sr * 0.35, sy + sr * 0.35);
    ctx.lineTo(sx, sy + sr);
    ctx.lineTo(sx - sr * 0.35, sy + sr * 0.35);
    ctx.lineTo(sx - sr, sy);
    ctx.lineTo(sx - sr * 0.35, sy - sr * 0.35);
    ctx.closePath();
    ctx.fillStyle = '#e0f2fe';
    ctx.fill();
  } else if (suitId === 'verdant') {
    // Diamond leaf with vein
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.96);
    ctx.quadraticCurveTo(size * 0.88, -size * 0.2, 0, size * 0.96);
    ctx.quadraticCurveTo(-size * 0.88, -size * 0.2, 0, -size * 0.96);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.65);
    ctx.lineTo(0, size * 0.72);
    ctx.moveTo(0, -size * 0.12);
    ctx.lineTo(size * 0.34, -size * 0.34);
    ctx.moveTo(0, 0.18 * size);
    ctx.lineTo(-size * 0.34, -0.04 * size);
    ctx.strokeStyle = '#d1fae5';
    ctx.lineWidth = Math.max(1.5, size * 0.09);
    ctx.stroke();
  } else {
    // Imperial 3-peak crown
    ctx.beginPath();
    ctx.moveTo(-size * 0.82, size * 0.62);
    ctx.lineTo(-size * 0.92, -size * 0.42);
    ctx.lineTo(-size * 0.35, size * 0.05);
    ctx.lineTo(0, -size * 0.82);
    ctx.lineTo(size * 0.35, size * 0.05);
    ctx.lineTo(size * 0.92, -size * 0.42);
    ctx.lineTo(size * 0.82, size * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fae8ff';
    ctx.fillRect(-size * 0.74, size * 0.34, size * 1.48, size * 0.18);
  }
  ctx.restore();
}

function drawTableBackground(ctx, time) {
  // Mahogany outer table border
  ctx.fillStyle = PALETTE.woodOuter;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Felt playing surface
  const pad = 16;
  roundRectPath(ctx, pad, pad, VIEW_W - pad * 2, VIEW_H - pad * 2, 22);
  const grad = ctx.createRadialGradient(VIEW_W * 0.5, VIEW_H * 0.48, 60, VIEW_W * 0.5, VIEW_H * 0.5, VIEW_W * 0.62);
  grad.addColorStop(0, PALETTE.feltInner);
  grad.addColorStop(0.55, PALETTE.feltMid);
  grad.addColorStop(1, PALETTE.feltOuter);
  ctx.fillStyle = grad;
  ctx.fill();

  // Double brass trim around table edge
  ctx.strokeStyle = PALETTE.brass;
  ctx.lineWidth = 3;
  ctx.stroke();
  roundRectPath(ctx, pad + 7, pad + 7, VIEW_W - (pad + 7) * 2, VIEW_H - (pad + 7) * 2, 17);
  ctx.strokeStyle = PALETTE.brassMuted;
  ctx.lineWidth = 1.25;
  ctx.stroke();

  // Subtle engraved golden astrolabe rings in center
  ctx.save();
  ctx.translate(VIEW_W * 0.5, VIEW_H * 0.47);
  ctx.strokeStyle = 'rgba(212, 166, 86, 0.11)';
  ctx.lineWidth = 1.5;
  for (const r of [118, 178, 250]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.rotate(time * 0.03);
  for (let i = 0; i < 24; i += 1) {
    const a = (i * Math.PI * 2) / 24;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 168, Math.sin(a) * 168);
    ctx.lineTo(Math.cos(a) * 188, Math.sin(a) * 188);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCardBack(ctx, x, y, w, h, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;

  roundRectPath(ctx, -w / 2, -h / 2, w, h, 10);
  const bg = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  bg.addColorStop(0, '#1e3352');
  bg.addColorStop(1, '#0e192b');
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = PALETTE.brass;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner filigree diamond
  roundRectPath(ctx, -w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 6);
  ctx.strokeStyle = 'rgba(212, 166, 86, 0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -h * 0.24);
  ctx.lineTo(w * 0.24, 0);
  ctx.lineTo(0, h * 0.24);
  ctx.lineTo(-w * 0.24, 0);
  ctx.closePath();
  ctx.strokeStyle = PALETTE.brassBright;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, w * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.brass;
  ctx.fill();

  ctx.restore();
}

export function drawCardFace(ctx, card, {
  x,
  y,
  w = CARD_METRICS.width,
  h = CARD_METRICS.height,
  rot = 0,
  scale = 1,
  playable = true,
  hovered = false,
  synergy = null,
  hotkey = null,
  intentBadge = null,
} = {}) {
  const suit = SUITS[card.suit] ?? SUITS.solar;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);

  // Drop shadow & hover/synergy aura
  if (hovered) {
    ctx.shadowColor = synergy ? synergy.color : suit.color;
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
  } else if (synergy && playable) {
    ctx.shadowColor = synergy.color;
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 5;
  } else {
    ctx.shadowColor = 'rgba(0,0,0,0.48)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
  }

  // Card parchment body
  roundRectPath(ctx, -w / 2, -h / 2, w, h, CARD_METRICS.radius);
  const bodyGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  bodyGrad.addColorStop(0, '#fffcf5');
  bodyGrad.addColorStop(1, '#efe4cc');
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Colored suit outer border
  ctx.lineWidth = hovered ? 3.5 : 2.6;
  ctx.strokeStyle = playable ? suit.color : '#6b7280';
  ctx.stroke();

  // Top suit banner strip
  ctx.save();
  roundRectPath(ctx, -w / 2 + 4, -h / 2 + 4, w - 8, h * 0.22, 9);
  ctx.fillStyle = suit.dark;
  ctx.fill();
  ctx.restore();

  // Subtle inner frame
  roundRectPath(ctx, -w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 8);
  ctx.strokeStyle = 'rgba(180, 140, 75, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Cost gem (top-left) — high-contrast hexagonal gold crystal
  const gemX = -w / 2 + 22;
  const gemY = -h / 2 + 24;
  const gemR = w * 0.125;
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    const gx = gemX + Math.cos(a) * gemR;
    const gy = gemY + Math.sin(a) * gemR;
    if (i === 0) ctx.moveTo(gx, gy);
    else ctx.lineTo(gx, gy);
  }
  ctx.closePath();
  ctx.fillStyle = playable ? '#fbbf24' : '#9ca3af';
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#1c1917';
  ctx.font = `900 ${Math.round(w * 0.145)}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(card.cost), gemX, gemY + 1);

  // Power badge (top-right) — bold value in suit-colored circle
  const powX = w / 2 - 22;
  const powY = -h / 2 + 24;
  ctx.beginPath();
  ctx.arc(powX, powY, gemR * 0.96, 0, Math.PI * 2);
  ctx.fillStyle = suit.color;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(w * 0.14)}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(String(card.power), powX, powY + 1);

  // Suit name in top banner
  ctx.fillStyle = suit.light;
  ctx.font = `700 ${Math.round(w * 0.085)}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(suit.name.toUpperCase(), 0, -h / 2 + 25);

  // Central medallion + large geometric suit emblem
  const medY = -h * 0.05;
  const medR = w * 0.285;
  ctx.beginPath();
  ctx.arc(0, medY, medR, 0, Math.PI * 2);
  ctx.fillStyle = suit.light;
  ctx.fill();
  ctx.strokeStyle = suit.color;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  drawSuitEmblem(ctx, card.suit, 0, medY, medR * 0.72);

  // Card Title
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `800 ${Math.round(w * 0.108)}px Georgia, serif`;
  ctx.fillText(card.name, 0, h * 0.26);

  // Effect pill bar at bottom
  roundRectPath(ctx, -w / 2 + 10, h * 0.33, w - 20, h * 0.135, 6);
  ctx.fillStyle = 'rgba(28, 25, 23, 0.08)';
  ctx.fill();
  ctx.fillStyle = '#292524';
  ctx.font = `700 ${Math.round(w * 0.085)}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(card.summary, 0, h * 0.398);

  // Dim overlay if unaffordable
  if (!playable) {
    roundRectPath(ctx, -w / 2, -h / 2, w, h, CARD_METRICS.radius);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.38)';
    ctx.fill();
  }

  // Hotkey badge at bottom-right corner
  if (hotkey != null) {
    ctx.beginPath();
    ctx.arc(w / 2 - 14, h / 2 - 14, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillText(String(hotkey), w / 2 - 14, h / 2 - 13.5);
  }

  // Synergy combo floating badge above card
  if (synergy && playable) {
    const bw = w * 0.94;
    const bh = 22;
    roundRectPath(ctx, -bw / 2, -h / 2 - 28, bw, bh, 11);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.strokeStyle = synergy.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = synergy.color;
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.fillText(synergy.shortLabel, 0, -h / 2 - 16.5);
  }

  // Telegraphed intent badge
  if (intentBadge) {
    const bw = w * 0.98;
    const bh = 22;
    roundRectPath(ctx, -bw / 2, -h / 2 - 26, bw, bh, 11);
    ctx.fillStyle = '#7f1d1d';
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = '#fef3c7';
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.fillText(intentBadge, 0, -h / 2 - 14.5);
  }

  ctx.restore();
}

function drawFighterHud(ctx, fighter, x, y, isPlayer) {
  const w = 254;
  const h = 76;
  ctx.save();
  roundRectPath(ctx, x, y, w, h, 14);
  ctx.fillStyle = 'rgba(7, 22, 20, 0.88)';
  ctx.fill();
  ctx.strokeStyle = isPlayer ? PALETTE.brass : 'rgba(244, 63, 94, 0.65)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Name & Life numeric readout
  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(fighter.name, x + 16, y + 22);

  ctx.fillStyle = fighter.life <= 10 ? '#fb7185' : '#fef3c7';
  ctx.font = '900 16px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${fighter.life} / ${fighter.maxLife} HP`, x + w - 16, y + 22);

  // Life Bar
  const barX = x + 16;
  const barY = y + 36;
  const barW = w - 32;
  const barH = 12;
  roundRectPath(ctx, barX, barY, barW, barH, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();

  const ratio = Math.max(0, Math.min(1, fighter.life / fighter.maxLife));
  if (ratio > 0) {
    roundRectPath(ctx, barX, barY, Math.max(10, barW * ratio), barH, 6);
    const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    if (isPlayer) {
      barGrad.addColorStop(0, '#10b981');
      barGrad.addColorStop(1, '#34d399');
    } else {
      barGrad.addColorStop(0, '#dc2626');
      barGrad.addColorStop(1, '#f97316');
    }
    ctx.fillStyle = barGrad;
    ctx.fill();
  }

  // Ward + Aether chips
  ctx.textAlign = 'left';
  ctx.font = '800 12px system-ui, sans-serif';
  ctx.fillStyle = fighter.ward > 0 ? PALETTE.wardCyan : '#94a3b8';
  ctx.fillText(`WARD: ${fighter.ward}`, x + 16, y + 61);

  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.aetherGold;
  ctx.fillText(`AETHER: ${fighter.aether}/${fighter.maxAether}`, x + w - 16, y + 61);

  // Deflect indicator (positioned cleanly above Player HUD, never overlapping hand cards)
  if (isPlayer && fighter.deflectReady) {
    roundRectPath(ctx, x, y - 38, 166, 30, 15);
    ctx.fillStyle = 'rgba(14, 116, 144, 0.94)';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e0f2fe';
    ctx.font = '800 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DEFLECT READY (+3)', x + 83, y - 22.5);
  }

  ctx.restore();
}

export function computePlayerHandLayout(count, hoveredIndex) {
  const layouts = [];
  if (count === 0) return layouts;
  const spacing = Math.min(144, 680 / Math.max(1, count));
  const startX = VIEW_W * 0.56 - ((count - 1) * spacing) / 2;
  const baseY = VIEW_H - 114;

  for (let i = 0; i < count; i += 1) {
    const norm = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
    const isHover = i === hoveredIndex;
    layouts.push({
      x: startX + i * spacing,
      y: baseY + Math.abs(norm) * 14 - (isHover ? 34 : 0),
      rot: isHover ? 0 : norm * 0.065,
      scale: isHover ? 1.09 : 1.0,
    });
  }
  return layouts;
}

export function getUiHitboxes(state) {
  const boxes = {};
  if (state.screen === 'title') {
    boxes.playButton = { x: VIEW_W / 2 - 135, y: 540, w: 270, h: 62 };
    boxes.difficulties = DIFFICULTIES.map((_, idx) => ({
      x: VIEW_W / 2 - 270 + idx * 185,
      y: 448,
      w: 170,
      h: 64,
      index: idx,
    }));
  } else {
    boxes.endTurn = { x: VIEW_W - 224, y: VIEW_H * 0.45, w: 176, h: 58 };
    boxes.helpButton = { x: VIEW_W - 224, y: 34, w: 92, h: 34 };
    boxes.muteButton = { x: VIEW_W - 122, y: 34, w: 74, h: 34 };
    if (state.screen === 'victory' || state.screen === 'defeat') {
      boxes.rematchButton = { x: VIEW_W / 2 - 190, y: 506, w: 180, h: 54 };
      boxes.titleButton = { x: VIEW_W / 2 + 10, y: 506, w: 180, h: 54 };
    }
  }
  return boxes;
}

function drawButton(ctx, rect, label, { primary = false, disabled = false, sublabel = null, accent = PALETTE.brass } = {}) {
  ctx.save();
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  if (disabled) {
    ctx.fillStyle = 'rgba(51, 65, 85, 0.7)';
  } else if (primary) {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, '#f59e0b');
    g.addColorStop(1, '#b45309');
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = 'rgba(15, 36, 32, 0.9)';
  }
  ctx.fill();
  ctx.strokeStyle = disabled ? '#64748b' : accent;
  ctx.lineWidth = primary ? 2.6 : 1.8;
  ctx.stroke();

  ctx.fillStyle = disabled ? '#94a3b8' : primary ? '#1c1917' : '#fef3c7';
  ctx.font = `900 ${sublabel ? 16 : 17}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 - (sublabel ? 7 : 0));

  if (sublabel) {
    ctx.fillStyle = primary ? '#451a03' : '#cbd5e1';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillText(sublabel, rect.x + rect.w / 2, rect.y + rect.h / 2 + 12);
  }
  ctx.restore();
}

function drawTitleScreen(ctx, state, fx) {
  drawTableBackground(ctx, fx.time);

  // Subtle radial spotlight behind hero cards
  const spot = ctx.createRadialGradient(VIEW_W / 2, 260, 20, VIEW_W / 2, 260, 420);
  spot.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
  spot.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // 4 Hero Showcase Cards fanned in an arc
  const cardSpread = 148;
  const centerX = VIEW_W / 2;
  TITLE_SHOWCASE_CARDS.forEach((card, i) => {
    const offset = i - 1.5;
    const bob = Math.sin(fx.time * 1.8 + i * 0.9) * 5;
    drawCardFace(ctx, card, {
      x: centerX + offset * cardSpread,
      y: 252 + Math.abs(offset) * 16 + bob,
      w: 138,
      h: 192,
      rot: offset * 0.11,
      playable: true,
    });
  });

  // Title plaque
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.brassBright;
  ctx.font = '900 58px Georgia, serif';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 16;
  ctx.fillText(GAME_TITLE, VIEW_W / 2, 86);
  ctx.shadowColor = 'transparent';

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.fillText(`${GAME_SUBTITLE.toUpperCase()}  ·  READ INTENTS  ·  CHAIN SYNERGIES`, VIEW_W / 2, 130);

  // Four-suit legend pills
  const suitIds = ['solar', 'lunar', 'verdant', 'imperial'];
  const pillW = 216;
  const startPillX = VIEW_W / 2 - (suitIds.length * pillW + 3 * 14) / 2;
  suitIds.forEach((id, i) => {
    const s = SUITS[id];
    const px = startPillX + i * (pillW + 14);
    const py = 382;
    roundRectPath(ctx, px, py, pillW, 44, 22);
    ctx.fillStyle = 'rgba(7, 22, 20, 0.86)';
    ctx.fill();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    drawSuitEmblem(ctx, id, px + 24, py + 22, 13);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.fillText(s.name, px + 44, py + 15);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillText(s.role, px + 44, py + 31);
  });

  // Difficulty selector buttons
  const boxes = getUiHitboxes(state);
  boxes.difficulties.forEach((rect) => {
    const diff = DIFFICULTIES[rect.index];
    const selected = state.difficultyIndex === rect.index;
    drawButton(ctx, rect, diff.label, {
      primary: false,
      sublabel: diff.subtitle,
      accent: selected ? '#fcd34d' : 'rgba(212, 166, 86, 0.35)',
    });
    if (selected) {
      ctx.save();
      roundRectPath(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 14);
      ctx.strokeStyle = '#fcd34d';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }
  });

  // Main Play CTA
  drawButton(ctx, boxes.playButton, 'PLAY DUEL', {
    primary: true,
    sublabel: 'Click or press ENTER',
    accent: '#fef3c7',
  });

  // Footer controls hint
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Keys 1–5 Play Card  ·  Space End Turn  ·  H Rules & Combos  ·  M Sound', VIEW_W / 2, 650);
}

function drawPlayingBoard(ctx, state, fx, dt) {
  drawTableBackground(ctx, fx.time);

  const boxes = getUiHitboxes(state);

  // Opponent HUD (top-left)
  drawFighterHud(ctx, state.opponent, 42, 32, false);

  // Top-right Match Info & Score plaque
  roundRectPath(ctx, VIEW_W - 224, 78, 176, 70, 12);
  ctx.fillStyle = 'rgba(7, 22, 20, 0.88)';
  ctx.fill();
  ctx.strokeStyle = PALETTE.brass;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText(`ROUND ${state.round} / ${RULES.maxRounds}`, VIEW_W - 136, 98);
  ctx.fillStyle = PALETTE.brassBright;
  ctx.font = '900 22px system-ui, sans-serif';
  ctx.fillText(`SCORE ${state.score}`, VIEW_W - 136, 126);

  drawButton(ctx, boxes.helpButton, 'H RULES', { accent: PALETTE.brassMuted });
  drawButton(ctx, boxes.muteButton, state.muted ? 'MUTE' : 'SFX', { accent: PALETTE.brassMuted });

  // Opponent hidden hand (fanned card backs at top center)
  const hiddenOppCards = state.opponent.hand.filter((c) => !state.opponent.intentCard || c.uid !== state.opponent.intentCard.uid);
  const oppCount = hiddenOppCards.length;
  const oppSpacing = 62;
  const oppStartX = VIEW_W * 0.44 - ((oppCount - 1) * oppSpacing) / 2;
  for (let i = 0; i < oppCount; i += 1) {
    const norm = oppCount <= 1 ? 0 : (i / (oppCount - 1)) * 2 - 1;
    drawCardBack(ctx, oppStartX + i * oppSpacing, 92 - Math.abs(norm) * 8, CARD_METRICS.oppWidth, CARD_METRICS.oppHeight, -norm * 0.08);
  }

  // Telegraphed Opponent Intent Card (face-up right of opponent's hand!)
  if (state.opponent.intentCard) {
    const intentX = VIEW_W * 0.67;
    const intentY = 124;
    const pulse = 1 + Math.sin(fx.time * 4) * 0.018;
    drawCardFace(ctx, state.opponent.intentCard, {
      x: intentX,
      y: intentY,
      w: 118,
      h: 164,
      scale: pulse,
      playable: true,
      intentBadge: 'NEXT INTENT',
    });

    // Tactical counter hint under telegraphed intent
    if (state.opponent.intentCard.damage >= 4 && !state.player.deflectReady) {
      roundRectPath(ctx, intentX - 88, intentY + 92, 176, 22, 11);
      ctx.fillStyle = 'rgba(14, 116, 144, 0.88)';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = '#e0f2fe';
      ctx.font = '800 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LUNAR WARD → DEFLECT', intentX, intentY + 103.5);
    }
  }

  // Left Draw Deck & Discard Stack
  const deckX = 110;
  const deckY = VIEW_H * 0.49;
  drawCardBack(ctx, deckX - 3, deckY - 3, 96, 134, -0.02);
  drawCardBack(ctx, deckX, deckY, 96, 134, 0.01);
  roundRectPath(ctx, deckX - 42, deckY + 74, 84, 24, 12);
  ctx.fillStyle = 'rgba(7, 22, 20, 0.9)';
  ctx.fill();
  ctx.strokeStyle = PALETTE.brass;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = '#fef3c7';
  ctx.font = '800 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`DECK: ${state.player.deck.length}`, deckX, deckY + 86.5);

  // Center Table: Played Cards This Turn (Player & Opponent)
  const played = state.player.playedThisTurn;
  if (played.length > 0) {
    const sp = 132;
    const sx = VIEW_W * 0.47 - ((played.length - 1) * sp) / 2;
    const py = VIEW_H * 0.45;

    // Glowing synergy arc connecting played cards
    if (played.length >= 2) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sx, py);
      ctx.quadraticCurveTo(VIEW_W * 0.47, py - 58, sx + (played.length - 1) * sp, py);
      ctx.strokeStyle = state.activeSynergyArc ? state.activeSynergyArc.color : 'rgba(252, 211, 77, 0.65)';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#fcd34d';
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.restore();
    }

    played.forEach((card, i) => {
      const target = { x: sx + i * sp, y: py, rot: (i - (played.length - 1) / 2) * 0.04, scale: 1 };
      const vis = stepCardSpring(fx, card.uid, target, dt);
      drawCardFace(ctx, card, {
        x: vis.x,
        y: vis.y,
        w: CARD_METRICS.tableWidth,
        h: CARD_METRICS.tableHeight,
        rot: vis.rot,
        scale: vis.scale,
        playable: true,
      });
    });
  } else if (state.opponent.playedThisTurn.length > 0) {
    const oppPlayed = state.opponent.playedThisTurn;
    const sp = 132;
    const sx = VIEW_W * 0.47 - ((oppPlayed.length - 1) * sp) / 2;
    oppPlayed.forEach((card, i) => {
      drawCardFace(ctx, card, {
        x: sx + i * sp,
        y: VIEW_H * 0.41,
        w: CARD_METRICS.tableWidth,
        h: CARD_METRICS.tableHeight,
        playable: true,
      });
    });
  } else {
    // Helpful subtle center prompt on empty table
    ctx.fillStyle = 'rgba(254, 243, 199, 0.35)';
    ctx.font = '700 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Play cards to build a Harmonic Pair, Eclipse, or Solstice Combo', VIEW_W * 0.47, VIEW_H * 0.46);
  }

  // Right-side Aether Crystals & End Turn button
  const endDisabled = state.phase !== 'player';
  drawButton(ctx, boxes.endTurn, state.phase === 'player' ? 'END TURN' : 'OPPONENT...', {
    primary: state.phase === 'player',
    disabled: endDisabled,
    sublabel: state.phase === 'player' ? 'Space / Enter' : 'Resolving',
    accent: '#fef3c7',
  });

  // Visual Aether Crystals above End Turn button
  const crystalBaseX = VIEW_W - 216;
  const crystalY = VIEW_H * 0.45 - 32;
  ctx.fillStyle = '#fef3c7';
  ctx.font = '800 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`AETHER  ${state.player.aether} / ${state.player.maxAether}`, VIEW_W - 136, crystalY - 26);
  for (let i = 0; i < state.player.maxAether; i += 1) {
    const cx = crystalBaseX + i * 28 + 14;
    const filled = i < state.player.aether;
    ctx.beginPath();
    ctx.moveTo(cx, crystalY - 12);
    ctx.lineTo(cx + 10, crystalY);
    ctx.lineTo(cx, crystalY + 12);
    ctx.lineTo(cx - 10, crystalY);
    ctx.closePath();
    ctx.fillStyle = filled ? '#fbbf24' : 'rgba(255,255,255,0.12)';
    ctx.fill();
    ctx.strokeStyle = filled ? '#fef3c7' : '#475569';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // Player HUD (bottom-left)
  drawFighterHud(ctx, state.player, 42, VIEW_H - 108, true);

  // Player Fanned Hand
  const layouts = computePlayerHandLayout(state.player.hand.length, state.hoveredHandIndex);
  // Draw non-hovered cards first, hovered card last so it sits cleanly on top
  const order = state.player.hand.map((_, i) => i).sort((a, b) => (a === state.hoveredHandIndex ? 1 : b === state.hoveredHandIndex ? -1 : a - b));
  for (const idx of order) {
    const card = state.player.hand[idx];
    const target = layouts[idx];
    const vis = stepCardSpring(fx, card.uid, target, dt, { x: deckX, y: deckY, rot: -0.25 });
    const playable = state.phase === 'player' && card.cost <= state.player.aether;
    const synergy = evaluateSynergy(state.player.playedThisTurn, card);
    drawCardFace(ctx, card, {
      x: vis.x,
      y: vis.y,
      w: CARD_METRICS.width,
      h: CARD_METRICS.height,
      rot: vis.rot,
      scale: vis.scale,
      playable,
      hovered: idx === state.hoveredHandIndex,
      synergy,
      hotkey: idx < 5 ? idx + 1 : null,
    });
  }

  // Combo / Counter Banner
  if (state.lastBanner) {
    const b = state.lastBanner;
    const bw = 360;
    const bh = 54;
    const bx = VIEW_W * 0.47 - bw / 2;
    const by = VIEW_H * 0.27;
    ctx.save();
    roundRectPath(ctx, bx, by, bw, bh, 27);
    ctx.fillStyle = 'rgba(9, 17, 24, 0.92)';
    ctx.fill();
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = b.color;
    ctx.font = '900 18px Georgia, serif';
    ctx.fillText(b.text, bx + bw / 2, by + 20);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.fillText(b.subtext, bx + bw / 2, by + 39);
    ctx.restore();
  }

  // Rules Overlay if toggled
  if (state.showHelp) {
    drawHelpOverlay(ctx);
  }
}

function drawHelpOverlay(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(4, 12, 11, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const w = 680;
  const h = 420;
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  roundRectPath(ctx, x, y, w, h, 18);
  ctx.fillStyle = '#0d2622';
  ctx.fill();
  ctx.strokeStyle = PALETTE.brass;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.brassBright;
  ctx.font = '900 28px Georgia, serif';
  ctx.fillText('SOLSTICE COURT — SYNERGIES & COUNTERS', VIEW_W / 2, y + 46);

  const lines = [
    '• HARMONIC PAIR (2 of Same Suit): Solar +3 dmg · Lunar +4 Ward · Verdant +3 Heal & Draw · Imperial +3 Pierce',
    '• ECLIPSE CHAIN (Solar + Lunar in one turn): +4 Bonus Damage & +3 Ward',
    '• SOLSTICE CONVERGENCE (3 Distinct Suits in one turn): +5 Damage, +2 Heal, Draw 1',
    '• DEFLECT COUNTER: Play a Lunar Ward card when Opponent telegraphs 4+ dmg → reflects 3 dmg!',
    '• COUNTER BREAK: Play an Imperial Pierce/Shatter card against Opponent Ward → +2 bonus Pierce!',
    '• Controls: Click cards or press 1–5 to play · Space/Enter to End Turn · H to close',
  ];

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f1f5f9';
  ctx.font = '600 15px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, x + 36, y + 105 + i * 44);
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillText('Click anywhere or press H / Esc to return to the duel', VIEW_W / 2, y + h - 32);
  ctx.restore();
}

function drawOutcomeOverlay(ctx, state) {
  const isWin = state.screen === 'victory';
  const accent = isWin ? PALETTE.victoryGold : PALETTE.defeatCrimson;

  ctx.save();
  ctx.fillStyle = isWin ? 'rgba(6, 20, 18, 0.72)' : 'rgba(24, 6, 12, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const w = 540;
  const h = 420;
  const x = (VIEW_W - w) / 2;
  const y = 160;
  roundRectPath(ctx, x, y, w, h, 22);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, isWin ? '#11332c' : '#2d1118');
  g.addColorStop(1, isWin ? '#081b18' : '#18090d');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3.2;
  ctx.stroke();

  // Emblem
  drawSuitEmblem(ctx, isWin ? 'solar' : 'imperial', VIEW_W / 2, y + 60, 32, accent);

  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = '900 48px Georgia, serif';
  ctx.fillText(isWin ? 'VICTORY' : 'DEFEAT', VIEW_W / 2, y + 130);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.fillText(
    isWin
      ? `Astral Automaton vanquished in Round ${state.round}!`
      : `Overwhelmed by the Court in Round ${state.round}.`,
    VIEW_W / 2,
    y + 168,
  );

  // Stats grid
  const stats = [
    ['FINAL SCORE', String(state.score)],
    ['LIFE REMAINING', `${state.player.life} / ${state.player.maxLife}`],
    ['COMBOS TRIGGERED', String(state.combosTriggered)],
    ['INTENTS COUNTERED', String(state.countersLanded)],
    ['BEST SYNERGY', state.bestComboName],
  ];

  stats.forEach(([label, value], i) => {
    const sy = y + 214 + i * 28;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillText(label, x + 64, sy);
    ctx.textAlign = 'right';
    ctx.fillStyle = i === 0 ? accent : '#f8fafc';
    ctx.font = '800 15px system-ui, sans-serif';
    ctx.fillText(value, x + w - 64, sy);
  });

  const boxes = getUiHitboxes(state);
  drawButton(ctx, boxes.rematchButton, isWin ? 'PLAY AGAIN' : 'REMATCH', {
    primary: true,
    sublabel: 'Press R',
    accent: '#fef3c7',
  });
  drawButton(ctx, boxes.titleButton, 'TITLE SCREEN', {
    primary: false,
    sublabel: 'Press Esc',
    accent: PALETTE.brass,
  });

  ctx.restore();
}

function drawParticlesAndPopups(ctx, fx) {
  for (const p of fx.particles) {
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y);
    if (p.shape === 'diamond') {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  for (const pop of fx.popups) {
    const alpha = Math.max(0, Math.min(1, pop.life / pop.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `900 ${pop.size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.strokeText(pop.text, pop.x, pop.y);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, pop.x, pop.y);
    ctx.restore();
  }
}

export function renderFrame(ctx, state, fx, dt) {
  ctx.save();
  if (fx.shake > 0.2) {
    const ox = (Math.random() - 0.5) * fx.shake * 2;
    const oy = (Math.random() - 0.5) * fx.shake * 2;
    ctx.translate(ox, oy);
  }

  if (state.screen === 'title') {
    drawTitleScreen(ctx, state, fx);
  } else {
    drawPlayingBoard(ctx, state, fx, dt);
    if (state.screen === 'victory' || state.screen === 'defeat') {
      drawOutcomeOverlay(ctx, state);
    }
  }

  drawParticlesAndPopups(ctx, fx);

  if (fx.flash > 0.01) {
    ctx.save();
    ctx.globalAlpha = fx.flash * 0.4;
    ctx.fillStyle = fx.flashColor;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.restore();
  }

  ctx.restore();
}
