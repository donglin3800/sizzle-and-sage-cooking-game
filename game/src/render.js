// Sizzle & Sage — render: every pixel of the kitchen, drawn on one canvas
// with plain shapes. Warm wood, cream tiles and food you can read at a
// glance: the order board, the counters, the chef and the plate in progress.

import { VIEW, INGREDIENTS, RECIPES, STATIONS, FLOOR, CHOP_SECONDS, GRILL_SECONDS, BURN_SECONDS, RUSH_SECONDS } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER, nearestStation, orderForPlate } from './world.js';

const CREAM = '#f6ead2';
const WOOD = '#8a5a33';
const WOOD_DARK = '#6e4525';
const TILE_A = '#e9d9b8';
const TILE_B = '#dfc79e';
const INK = '#2e2118';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, colour, align = 'left', weight = '700') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function fmtTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// One ingredient, drawn as a little food shape, at (x, y) with radius r.
export function drawIngredient(ctx, item, x, y, r) {
  const base = INGREDIENTS[item.id];
  ctx.save();
  ctx.translate(x, y);
  if (item.state === 'burnt') {
    ctx.fillStyle = '#1d1d1d';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#666';
    ctx.font = `700 ${r}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✕', 0, 1);
    ctx.restore();
    return;
  }
  if (base.shape === 'bun') {
    ctx.fillStyle = '#d98f2b';
    ctx.beginPath();
    ctx.ellipse(0, 2, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2c078';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.28, r * 0.92, r * 0.6, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [sx, sy] of [[-0.4, -0.5], [0.1, -0.62], [0.5, -0.42]]) {
      ctx.beginPath();
      ctx.ellipse(sx * r, sy * r, r * 0.14, r * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (base.shape === 'patty') {
    ctx.fillStyle = item.state === 'grilled' ? '#5d3418' : '#8a5a3b';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = item.state === 'grilled' ? '#7a4a2b' : '#a06a45';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.18, r * 0.8, r * 0.4, 0, Math.PI, 0);
    ctx.fill();
    if (item.state === 'grilled') {
      ctx.strokeStyle = '#3d2210';
      ctx.lineWidth = 2;
      for (const gx of [-0.4, 0, 0.4]) {
        ctx.beginPath();
        ctx.moveTo(gx * r, -r * 0.45);
        ctx.lineTo(gx * r, r * 0.35);
        ctx.stroke();
      }
    }
  } else if (base.shape === 'cheese') {
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6);
    ctx.lineTo(r, r * 0.6);
    ctx.lineTo(r, -r * 0.2);
    ctx.lineTo(0, -r * 0.7);
    ctx.lineTo(-r, -r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e0a92e';
    for (const [hx, hy] of [[-0.4, 0.1], [0.3, 0.25], [0, -0.25]]) {
      ctx.beginPath();
      ctx.arc(hx * r, hy * r, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (base.shape === 'tomato') {
    ctx.fillStyle = '#e23b2e';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f28b82';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.3, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d8b4f';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.85);
    ctx.lineTo(-r * 0.3, -r * 0.45);
    ctx.lineTo(r * 0.3, -r * 0.45);
    ctx.closePath();
    ctx.fill();
  } else if (base.shape === 'lettuce') {
    ctx.fillStyle = '#58b368';
    for (const [lx, ly, lr] of [[-0.4, 0.1, 0.6], [0.35, 0.15, 0.65], [0, -0.35, 0.6]]) {
      ctx.beginPath();
      ctx.arc(lx * r, ly * r, lr * r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#2f7a3e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7);
    ctx.quadraticCurveTo(0, 0, 0, r * 0.6);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#efe3f2';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9a8d6';
    ctx.lineWidth = 2.5;
    for (const rr of [0.65, 0.4]) {
      ctx.beginPath();
      ctx.arc(0, 0, rr * r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (item.state === 'chopped') {
    ctx.strokeStyle = 'rgba(46,33,24,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.5);
    ctx.lineTo(r * 0.5, r * 0.5);
    ctx.moveTo(r * 0.5, -r * 0.5);
    ctx.lineTo(-r * 0.5, r * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCounter(ctx, station, highlight) {
  const { x, y, w, h } = station;
  ctx.fillStyle = highlight ? '#c98a3d' : WOOD;
  roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 12);
  ctx.fill();
  ctx.fillStyle = station.kind === 'grill' ? '#3a3a3f' : station.kind === 'fridge' ? '#bcd6de' : '#f3e3c2';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = INK;
  text(ctx, station.label, x + w / 2, y + 16, 13, INK, 'center');
}

function drawFridge(ctx, world, station, highlight) {
  drawCounter(ctx, station, highlight);
  const ids = Object.keys(INGREDIENTS);
  for (let i = 0; i < ids.length; i += 1) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = station.x + 14 + col * 44;
    const by = station.y + 46 + row * 62;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, bx, by, 40, 52, 6);
    ctx.fill();
    ctx.strokeStyle = '#9db8c0';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawIngredient(ctx, { id: ids[i], state: 'raw' }, bx + 20, by + 18, 13);
    text(ctx, `${i + 1}`, bx + 20, by + 42, 10, '#5a6b72', 'center');
  }
  text(ctx, 'click or press 1–6', station.x + station.w / 2, station.y + station.h - 12, 10, '#5a6b72', 'center', '600');
}

function drawBoard(ctx, world, station, highlight) {
  drawCounter(ctx, station, highlight);
  ctx.fillStyle = '#d9a066';
  roundRect(ctx, station.x + 20, station.y + 30, station.w - 40, 56, 8);
  ctx.fill();
  ctx.strokeStyle = '#a4713a';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (world.board) {
    drawIngredient(ctx, world.board, station.x + station.w / 2, station.y + 54, 17);
    const progress = Math.min(1, world.boardTimer / CHOP_SECONDS);
    ctx.fillStyle = '#2e2118';
    roundRect(ctx, station.x + 30, station.y + station.h - 26, station.w - 60, 10, 5);
    ctx.fill();
    ctx.fillStyle = progress >= 1 ? '#58b368' : '#f7c948';
    roundRect(ctx, station.x + 30, station.y + station.h - 26, (station.w - 60) * progress, 10, 5);
    ctx.fill();
    text(ctx, progress >= 1 ? 'CHOPPED — press E to grab' : 'chopping… stand here', station.x + station.w / 2, station.y + station.h - 10, 10, INK, 'center', '600');
  } else {
    text(ctx, 'drop a veg here, press E', station.x + station.w / 2, station.y + 58, 12, '#8a6a45', 'center', '600');
  }
}

function drawGrill(ctx, world, station, highlight) {
  drawCounter(ctx, station, highlight);
  for (let slot = 0; slot < 2; slot += 1) {
    const gx = station.x + 22 + slot * 106;
    const gy = station.y + 30;
    ctx.fillStyle = '#222226';
    roundRect(ctx, gx, gy, 96, 58, 8);
    ctx.fill();
    ctx.strokeStyle = '#55555c';
    ctx.lineWidth = 2;
    for (let line = 1; line < 5; line += 1) {
      ctx.beginPath();
      ctx.moveTo(gx + 8, gy + line * 10);
      ctx.lineTo(gx + 88, gy + line * 10);
      ctx.stroke();
    }
    const item = world.grill[slot];
    if (item) {
      drawIngredient(ctx, item, gx + 48, gy + 29, 20);
      const total = GRILL_SECONDS + BURN_SECONDS;
      const progress = Math.min(1, item.cook / total);
      const barColour = item.state === 'burnt' ? '#e23b2e' : item.state === 'grilled' ? '#58b368' : '#f7c948';
      ctx.fillStyle = '#111';
      roundRect(ctx, gx + 8, gy + 64, 80, 8, 4);
      ctx.fill();
      ctx.fillStyle = barColour;
      roundRect(ctx, gx + 8, gy + 64, 80 * progress, 8, 4);
      ctx.fill();
      if (item.state === 'grilled' || item.state === 'burnt') {
        ctx.strokeStyle = item.state === 'grilled' ? '#58b368' : '#e23b2e';
        ctx.lineWidth = 3;
        roundRect(ctx, gx - 2, gy - 2, 100, 62, 9);
        ctx.stroke();
      }
    }
  }
}

function drawPlates(ctx, world, station, highlight) {
  drawCounter(ctx, station, highlight);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(station.x + station.w / 2, station.y + 62, 78, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cbb98f';
  ctx.lineWidth = 2;
  ctx.stroke();
  const match = orderForPlate(world);
  world.plate.forEach((item, i) => {
    const px = station.x + 52 + i * 34;
    drawIngredient(ctx, item, px, station.y + 62 - (world.plate.length - 1 - i) * 2, 15);
  });
  if (world.plate.length === 0) {
    text(ctx, 'build the dish here', station.x + station.w / 2, station.y + 62, 12, '#8a6a45', 'center', '600');
  } else if (match) {
    text(ctx, '✓ matches an order — serve it!', station.x + station.w / 2, station.y + station.h - 12, 12, '#2f7a3e', 'center');
  } else {
    text(ctx, `${world.plate.length} item${world.plate.length > 1 ? 's' : ''} on the plate`, station.x + station.w / 2, station.y + station.h - 12, 11, INK, 'center', '600');
  }
}

function drawServe(ctx, world, station, highlight) {
  drawCounter(ctx, station, highlight);
  ctx.fillStyle = '#7d5ba6';
  roundRect(ctx, station.x + 12, station.y + 30, station.w - 24, 62, 8);
  ctx.fill();
  ctx.fillStyle = '#f6ead2';
  text(ctx, 'SERVE', station.x + station.w / 2, station.y + 52, 20, '#f6ead2', 'center');
  text(ctx, 'press E with a full plate', station.x + station.w / 2, station.y + 76, 10, '#e8d9f2', 'center', '600');
  const match = orderForPlate(world);
  if (match && world.plate.length > 0) {
    ctx.fillStyle = '#58b368';
    roundRect(ctx, station.x + 18, station.y + 100, station.w - 36, 34, 8);
    ctx.fill();
    text(ctx, 'READY TO SERVE', station.x + station.w / 2, station.y + 117, 13, '#ffffff', 'center');
  }
  text(ctx, `served: ${world.served}`, station.x + station.w / 2, station.y + station.h - 12, 11, INK, 'center', '600');
}

function drawBin(ctx, world, station, highlight) {
  drawCounter(ctx, station, highlight);
  ctx.fillStyle = '#5b6770';
  roundRect(ctx, station.x + 22, station.y + 32, station.w - 44, 56, 8);
  ctx.fill();
  ctx.fillStyle = '#39424a';
  roundRect(ctx, station.x + 22, station.y + 32, station.w - 44, 12, 8);
  ctx.fill();
  text(ctx, 'BIN', station.x + station.w / 2, station.y + 62, 14, '#ffffff', 'center');
}

function drawChef(ctx, world) {
  const chef = world.chef;
  const bob = chef.moving ? Math.sin(world.time * 14) * 3 : 0;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob * 0.3);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white chef coat with a sage-green apron.
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -17, -8, 34, 30, 10);
  ctx.fill();
  ctx.strokeStyle = '#d8cbb2';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#7d9b6a';
  roundRect(ctx, -12, 2, 24, 20, 6);
  ctx.fill();
  // Head and tall chef hat.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -18, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -14, -44, 28, 20, 8);
  ctx.fill();
  ctx.fillStyle = '#f6ead2';
  roundRect(ctx, -14, -28, 28, 6, 3);
  ctx.fill();
  // Eyes look the way the chef faces.
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(chef.facing * 3 - 4, -18, 1.8, 0, Math.PI * 2);
  ctx.arc(chef.facing * 3 + 5, -18, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Hands: what the chef carries, floating above the head.
  world.hands.forEach((item, i) => {
    const hx = (i - (world.hands.length - 1) / 2) * 30;
    drawIngredient(ctx, item, hx, -56, 13);
  });
  ctx.restore();
}

function drawOrderCard(ctx, order, x, y, w, h) {
  const recipe = RECIPES.find((r) => r.id === order.recipeId);
  const frac = Math.max(0, order.patience / order.patienceMax);
  const urgent = frac < 0.35;
  ctx.fillStyle = order.golden ? '#fff3c4' : '#ffffff';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#e23b2e' : recipe.colour;
  ctx.lineWidth = urgent ? 3 : 2;
  ctx.stroke();
  if (order.golden) text(ctx, '★ GOLDEN ×2', x + w - 8, y + 14, 10, '#b8860b', 'right');
  text(ctx, recipe.name, x + 10, y + 16, 14, INK);
  text(ctx, `$${recipe.price}`, x + w - 10, y + 36, 13, '#8a5a33', 'right');
  recipe.needs.forEach((need, i) => {
    drawIngredient(ctx, need, x + 22 + i * 32, y + 52, 12);
  });
  ctx.fillStyle = '#e8ddc8';
  roundRect(ctx, x + 10, y + h - 16, w - 20, 8, 4);
  ctx.fill();
  ctx.fillStyle = urgent ? '#e23b2e' : frac < 0.6 ? '#f7c948' : '#58b368';
  roundRect(ctx, x + 10, y + h - 16, (w - 20) * frac, 8, 4);
  ctx.fill();
}

function drawHud(ctx, world) {
  ctx.fillStyle = '#2e2118';
  ctx.fillRect(0, 0, VIEW.width, 84);
  ctx.fillStyle = '#c98a3d';
  ctx.fillRect(0, 84, VIEW.width, 4);
  text(ctx, 'SIZZLE & SAGE', 24, 30, 26, '#f6ead2', 'left');
  text(ctx, 'a lunch-rush kitchen', 24, 58, 12, '#d9b98a', 'left', '600');
  const rush = world.dayLeft <= RUSH_SECONDS;
  text(ctx, rush ? '⏱ RUSH!' : '⏱ DAY', 470, 26, 13, rush ? '#ff8a7a' : '#d9b98a', 'left', '600');
  text(ctx, fmtTime(world.dayLeft), 470, 56, 26, rush ? '#ff6b5e' : '#ffffff', 'left');
  text(ctx, 'COINS', 620, 26, 13, '#d9b98a', 'left', '600');
  text(ctx, `$${world.coins}`, 620, 56, 26, '#f7c948', 'left');
  text(ctx, 'COMBO', 780, 26, 13, '#d9b98a', 'left', '600');
  text(ctx, world.combo > 1 ? `×${(1 + Math.min(world.combo, 8) * 0.1).toFixed(1)}  (${world.combo})` : '—', 780, 56, 22, world.combo > 1 ? '#ff9d5c' : '#ffffff', 'left');
  text(ctx, `LEVEL ${world.level}`, 940, 26, 13, '#d9b98a', 'left', '600');
  text(ctx, `served ${world.served} · lost ${world.failed}`, 940, 56, 14, '#ffffff', 'left', '600');
  text(ctx, 'WASD · E · click · M mute · P pause', 1180, 30, 11, '#9b8468', 'right', '600');
}

function drawOrders(ctx, world) {
  text(ctx, 'ORDER BOARD', 36, 104, 14, INK, 'left');
  if (world.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch crowd is coming…', 160, 104, 14, '#8a6a45', 'left', '600');
    return;
  }
  world.orders.forEach((order, i) => {
    drawOrderCard(ctx, order, 36 + i * 306, 116, 292, 76);
  });
}

function drawKitchen(ctx, world) {
  // Tiled floor.
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 16; col += 1) {
      ctx.fillStyle = (row + col) % 2 === 0 ? TILE_A : TILE_B;
      ctx.fillRect(FLOOR.x + col * 77, FLOOR.y + row * 61, 77, 61);
    }
  }
  ctx.strokeStyle = 'rgba(46,33,24,0.08)';
  ctx.lineWidth = 1;
  for (let row = 0; row <= 6; row += 1) {
    ctx.beginPath();
    ctx.moveTo(FLOOR.x, FLOOR.y + row * 61);
    ctx.lineTo(FLOOR.x + FLOOR.w, FLOOR.y + row * 61);
    ctx.stroke();
  }
  // Back wall with a window and a hanging pan rail.
  ctx.fillStyle = '#f3e3c2';
  ctx.fillRect(0, 88, VIEW.width, 108);
  ctx.fillStyle = '#bcd6de';
  roundRect(ctx, 560, 100, 160, 72, 8);
  ctx.fill();
  ctx.strokeStyle = '#8a5a33';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(640, 100);
  ctx.lineTo(640, 172);
  ctx.moveTo(560, 136);
  ctx.lineTo(720, 136);
  ctx.stroke();
  // The window looks out over the street; the order board hangs below it.
  const near = world.screen === SCREEN_PLAY ? nearestStation(world) : null;
  drawFridge(ctx, world, STATIONS.fridge, near === STATIONS.fridge);
  drawBoard(ctx, world, STATIONS.board, near === STATIONS.board);
  drawGrill(ctx, world, STATIONS.grill, near === STATIONS.grill);
  drawPlates(ctx, world, STATIONS.plates, near === STATIONS.plates);
  drawServe(ctx, world, STATIONS.serve, near === STATIONS.serve);
  drawBin(ctx, world, STATIONS.bin, near === STATIONS.bin);
  drawChef(ctx, world);
  // Toast message above the floor.
  if (world.toastTimer > 0 && world.toast) {
    ctx.fillStyle = 'rgba(46,33,24,0.85)';
    const w = Math.min(720, 24 + world.toast.length * 8.4);
    roundRect(ctx, (VIEW.width - w) / 2, 640, w, 36, 18);
    ctx.fill();
    text(ctx, world.toast, VIEW.width / 2, 659, 15, '#ffffff', 'center', '600');
  }
  if (world.flash > 0) {
    ctx.fillStyle = `rgba(247,201,72,${world.flash * 0.5})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
}

function drawTitle(ctx, world) {
  drawKitchen(ctx, world);
  ctx.fillStyle = 'rgba(46,33,24,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = CREAM;
  roundRect(ctx, 290, 150, 700, 400, 20);
  ctx.fill();
  ctx.strokeStyle = '#c98a3d';
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'SIZZLE & SAGE', 640, 210, 52, '#8a5a33', 'center');
  text(ctx, 'A LUNCH-RUSH KITCHEN', 640, 252, 18, '#b06a2c', 'center', '600');
  text(ctx, 'Orders land on the board. Grab ingredients from the fridge,', 640, 300, 16, INK, 'center', '600');
  text(ctx, 'chop the veg, grill the patties, build the plate — and serve', 640, 326, 16, INK, 'center', '600');
  text(ctx, 'before the customer walks out. Fast serves earn tips and combos.', 640, 352, 16, INK, 'center', '600');
  text(ctx, 'WASD / arrows — walk      E / Space — use a station', 640, 396, 15, '#5a4632', 'center', '600');
  text(ctx, 'Click a station to walk there · 1–6 grab from the fridge', 640, 420, 15, '#5a4632', 'center', '600');
  ctx.fillStyle = '#8a5a33';
  roundRect(ctx, 490, 452, 300, 52, 12);
  ctx.fill();
  text(ctx, '▶  PRESS ENTER TO COOK', 640, 479, 18, '#ffffff', 'center');
  text(ctx, '5 recipes · 150-second day · golden tickets in the rush hour', 640, 534, 12, '#8a6a45', 'center', '600');
}

function drawOver(ctx, world) {
  drawKitchen(ctx, world);
  ctx.fillStyle = 'rgba(46,33,24,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = CREAM;
  roundRect(ctx, 340, 140, 600, 400, 20);
  ctx.fill();
  ctx.strokeStyle = '#c98a3d';
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'DAY COMPLETE!', 640, 196, 40, '#8a5a33', 'center');
  const stars = '★'.repeat(world.stars) + '☆'.repeat(3 - world.stars);
  text(ctx, stars, 640, 248, 36, '#e0a92e', 'center');
  text(ctx, `Coins earned: $${world.coins}   (tips $${world.tips})`, 640, 300, 18, INK, 'center', '600');
  text(ctx, `Dishes served: ${world.served} · Orders lost: ${world.failed} · Best combo: ${world.bestCombo}`, 640, 334, 16, INK, 'center', '600');
  const verdict = world.stars === 3 ? 'Head-chef material. The lunch crowd will be back.'
    : world.stars === 2 ? 'A solid service — the grill barely kept up.'
    : world.stars === 1 ? 'The kitchen survived. Barely.'
    : 'The crowd walked out hungry. One more day?';
  text(ctx, verdict, 640, 368, 15, '#5a4632', 'center', '600');
  ctx.fillStyle = '#8a5a33';
  roundRect(ctx, 490, 412, 300, 52, 12);
  ctx.fill();
  text(ctx, '↻  ENTER — COOK AGAIN', 640, 439, 18, '#ffffff', 'center');
  text(ctx, 'Esc — back to the title screen', 640, 500, 13, '#8a6a45', 'center', '600');
}

export function draw(ctx, world, paused) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  if (world.screen === SCREEN_TITLE) {
    drawTitle(ctx, world);
    return;
  }
  if (world.screen === SCREEN_OVER) {
    drawOver(ctx, world);
    return;
  }
  drawHud(ctx, world);
  drawKitchen(ctx, world);
  drawOrders(ctx, world);
  if (paused) {
    ctx.fillStyle = 'rgba(46,33,24,0.55)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, 'PAUSED', 640, 340, 48, '#ffffff', 'center');
    text(ctx, 'P to resume · Esc to quit to the title screen', 640, 396, 16, '#f6ead2', 'center', '600');
  }
}
