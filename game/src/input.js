// Solstice Court — Mouse hover/click and keyboard controls.

import { CARD_METRICS } from './config.js';
import { computePlayerHandLayout, getUiHitboxes, VIEW_H, VIEW_W } from './render.js';

function pointInRect(px, py, rect) {
  return Boolean(rect && px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h);
}

export function attachInput(canvas, state, handlers) {
  function toVirtual(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / VIEW_W, rect.height / VIEW_H);
    const offsetX = (rect.width - VIEW_W * scale) / 2;
    const offsetY = (rect.height - VIEW_H * scale) / 2;
    return {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    };
  }

  function hitTestHand(vx, vy) {
    if (state.screen !== 'playing' || state.showHelp) return -1;
    const layouts = computePlayerHandLayout(state.player.hand.length, state.hoveredHandIndex);
    // Check right-to-left (topmost overlap)
    for (let i = layouts.length - 1; i >= 0; i -= 1) {
      const c = layouts[i];
      const hw = (CARD_METRICS.width * c.scale) / 2;
      const hh = (CARD_METRICS.height * c.scale) / 2;
      if (vx >= c.x - hw && vx <= c.x + hw && vy >= c.y - hh && vy <= c.y + hh) {
        return i;
      }
    }
    return -1;
  }

  canvas.addEventListener('pointermove', (e) => {
    const { x, y } = toVirtual(e.clientX, e.clientY);
    if (state.screen === 'playing' && !state.showHelp) {
      const idx = hitTestHand(x, y);
      if (idx !== state.hoveredHandIndex) {
        state.hoveredHandIndex = idx;
        if (idx !== -1) handlers.onHoverCard?.(idx);
      }
      const boxes = getUiHitboxes(state);
      const overButton = pointInRect(x, y, boxes.endTurn) || pointInRect(x, y, boxes.helpButton) || pointInRect(x, y, boxes.muteButton);
      canvas.style.cursor = idx !== -1 || overButton ? 'pointer' : 'default';
    } else {
      const boxes = getUiHitboxes(state);
      const clickable =
        pointInRect(x, y, boxes.playButton) ||
        pointInRect(x, y, boxes.rematchButton) ||
        pointInRect(x, y, boxes.titleButton) ||
        (boxes.difficulties && boxes.difficulties.some((d) => pointInRect(x, y, d)));
      canvas.style.cursor = clickable ? 'pointer' : 'default';
    }
  });

  canvas.addEventListener('pointerdown', (e) => {
    const { x, y } = toVirtual(e.clientX, e.clientY);
    if (state.showHelp) {
      state.showHelp = false;
      return;
    }

    const boxes = getUiHitboxes(state);
    if (state.screen === 'title') {
      if (boxes.difficulties) {
        for (const d of boxes.difficulties) {
          if (pointInRect(x, y, d)) {
            state.difficultyIndex = d.index;
            handlers.onSelectDifficulty?.(d.index);
            return;
          }
        }
      }
      if (pointInRect(x, y, boxes.playButton)) {
        handlers.onStartGame?.();
      }
      return;
    }

    if (state.screen === 'victory' || state.screen === 'defeat') {
      if (pointInRect(x, y, boxes.rematchButton)) {
        handlers.onStartGame?.();
      } else if (pointInRect(x, y, boxes.titleButton)) {
        handlers.onReturnTitle?.();
      }
      return;
    }

    if (state.screen === 'playing') {
      if (pointInRect(x, y, boxes.helpButton)) {
        state.showHelp = !state.showHelp;
        return;
      }
      if (pointInRect(x, y, boxes.muteButton)) {
        handlers.onToggleMute?.();
        return;
      }
      if (pointInRect(x, y, boxes.endTurn)) {
        handlers.onEndTurn?.();
        return;
      }
      const idx = hitTestHand(x, y);
      if (idx !== -1) {
        handlers.onPlayCard?.(idx);
      }
    }
  });

  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'm') {
      handlers.onToggleMute?.();
      return;
    }
    if (key === 'h') {
      if (state.screen === 'playing') state.showHelp = !state.showHelp;
      return;
    }
    if (key === 'escape') {
      if (state.showHelp) {
        state.showHelp = false;
      } else if (state.screen === 'victory' || state.screen === 'defeat') {
        handlers.onReturnTitle?.();
      }
      return;
    }

    if (state.screen === 'title') {
      if (key === 'enter' || key === ' ') {
        e.preventDefault();
        handlers.onStartGame?.();
      } else if (key === 'arrowleft') {
        state.difficultyIndex = (state.difficultyIndex + 2) % 3;
      } else if (key === 'arrowright') {
        state.difficultyIndex = (state.difficultyIndex + 1) % 3;
      }
      return;
    }

    if (state.screen === 'victory' || state.screen === 'defeat') {
      if (key === 'r' || key === 'enter' || key === ' ') {
        e.preventDefault();
        handlers.onStartGame?.();
      }
      return;
    }

    if (state.screen === 'playing' && !state.showHelp) {
      if (key >= '1' && key <= '5') {
        handlers.onPlayCard?.(Number(key) - 1);
      } else if (key === ' ' || key === 'enter') {
        e.preventDefault();
        handlers.onEndTurn?.();
      } else if (key === 'r') {
        handlers.onStartGame?.();
      }
    }
  });
}
