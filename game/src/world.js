// Sizzle & Sage — world: the whole game state and its rules. No drawing here,
// no input here: step() advances the simulation, and the renderer reads it.
// Every rule the player feels lives in this file: orders, chopping, grilling,
// plating, serving, combos, the day timer and the rush hour.

import {
  CHEF,
  CHOP_SECONDS,
  GRILL_SECONDS,
  BURN_SECONDS,
  DAY_SECONDS,
  RUSH_SECONDS,
  COMBO_WINDOW,
  ORDER_PATIENCE,
  INGREDIENTS,
  RECIPES,
  STATIONS,
  FLOOR,
  menuForLevel,
  spawnInterval,
  stationFront,
  makeRng,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

let nextOrderId = 1;

function newOrder(rng, level, rush) {
  const menu = menuForLevel(level);
  const recipe = menu[Math.floor(rng() * menu.length)];
  const patience = ORDER_PATIENCE + recipe.needs.length * 6;
  return {
    id: nextOrderId,
    recipeId: recipe.id,
    patience,
    patienceMax: patience,
    golden: rush && rng() < 0.3,
    bornAt: 0,
  };
}

export function createWorld(seed = 20261125) {
  return {
    seed,
    rng: makeRng(seed),
    screen: SCREEN_TITLE,
    time: 0,
    dayLeft: DAY_SECONDS,
    level: 1,
    rush: false,
    rushAnnounced: false,
    coins: 0,
    served: 0,
    failed: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    tips: 0,
    chef: { x: 640, y: 520, dx: 0, dy: 0, facing: 1, moving: false, target: null },
    hands: [],
    orders: [],
    spawnTimer: 4,
    board: null,
    boardTimer: 0,
    grill: [null, null],
    plate: [],
    toast: '',
    toastTimer: 0,
    stars: 0,
    flash: 0,
    fridgeIndex: 0,
  };
}

export function resetWorld(world) {
  const fresh = createWorld(world.seed);
  for (const key of Object.keys(fresh)) world[key] = fresh[key];
  world.rng = makeRng(world.seed);
}

function levelForTime(time) {
  if (time < 45) return 1;
  if (time < 85) return 2;
  if (time < 120) return 3;
  return 4;
}

export function say(world, text) {
  world.toast = text;
  world.toastTimer = 2.4;
}

export function nearestStation(world) {
  let best = null;
  let bestDist = 96;
  for (const station of Object.values(STATIONS)) {
    const front = stationFront(station);
    const dist = Math.hypot(world.chef.x - front.x, world.chef.y - front.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = station;
    }
  }
  return best;
}

function stationAt(world, x, y) {
  for (const station of Object.values(STATIONS)) {
    if (x >= station.x - 8 && x <= station.x + station.w + 8 && y >= station.y - 8 && y <= station.y + station.h + 8) {
      return station;
    }
  }
  return null;
}

// What the chef is holding that this station wants, if anything.
function heldFor(world, kind) {
  return world.hands.findIndex((item) => {
    if (kind === 'board') return INGREDIENTS[item.id].prep === 'chop' && item.state === 'raw';
    if (kind === 'grill') return item.id === 'patty' && item.state === 'raw';
    return false;
  });
}

// The plate matches an order when it holds exactly the recipe's items,
// counting duplicates (the Double Stack really needs two grilled patties).
export function plateMatchesOrder(plate, recipe) {
  const pool = plate.slice();
  for (const need of recipe.needs) {
    const index = pool.findIndex((item) => item.id === need.id && item.state === need.state);
    if (index < 0) return false;
    pool.splice(index, 1);
  }
  return pool.length === 0;
}

export function orderForPlate(world) {
  for (const order of world.orders) {
    const recipe = RECIPES.find((r) => r.id === order.recipeId);
    if (recipe && plateMatchesOrder(world.plate, recipe)) return order;
  }
  return null;
}

function servePlate(world) {
  const order = orderForPlate(world);
  if (!order) {
    world.failed += 1;
    world.combo = 0;
    world.flash = 0.4;
    say(world, 'No order wants that plate — check the board!');
    return { served: false, tip: 0 };
  }
  const recipe = RECIPES.find((r) => r.id === order.recipeId);
  const speedBonus = Math.round((order.patience / order.patienceMax) * 8);
  const tip = speedBonus + (order.golden ? recipe.price : 0);
  const comboMult = 1 + Math.min(world.combo, 8) * 0.1;
  const earned = Math.round((recipe.price + tip) * comboMult);
  world.coins += earned;
  world.tips += tip;
  world.served += 1;
  world.combo += 1;
  world.comboTimer = COMBO_WINDOW;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.orders = world.orders.filter((o) => o.id !== order.id);
  world.plate = [];
  world.flash = 0.25;
  say(world, `${recipe.name} served! +$${earned}${tip > 0 ? ` (tip $${tip})` : ''}`);
  return { served: true, tip, earned, recipe };
}

// One interaction with the station the chef stands at. Returns a sound tag
// the main loop plays: 'chop', 'sizzle', 'serve', 'error', 'pickup' or null.
export function interact(world) {
  const station = nearestStation(world);
  if (!station) return null;
  const chef = world.chef;
  if (station.kind === 'fridge') {
    if (world.hands.length >= CHEF.carryMax) {
      say(world, 'Hands full — serve or bin something first.');
      return 'error';
    }
    return 'fridge';
  }
  if (station.kind === 'board') {
    if (world.board) {
      if (world.boardTimer >= CHOP_SECONDS) {
        const done = { id: world.board.id, state: 'chopped' };
        world.board = null;
        world.boardTimer = 0;
        if (world.hands.length < CHEF.carryMax) {
          world.hands.push(done);
          say(world, 'Chopped! Grabbed it.');
        } else {
          say(world, 'Chopped, but hands are full.');
        }
        return 'chopDone';
      }
      return null;
    }
    const index = heldFor(world, 'board');
    if (index < 0) {
      say(world, 'Put a raw tomato, lettuce or onion on the board.');
      return 'error';
    }
    world.board = world.hands.splice(index, 1)[0];
    world.boardTimer = 0;
    return 'pickup';
  }
  if (station.kind === 'grill') {
    const slot = world.grill.findIndex((g) => g === null);
    const held = heldFor(world, 'grill');
    if (held >= 0 && slot >= 0) {
      world.grill[slot] = { id: 'patty', state: 'raw', cook: 0 };
      world.hands.splice(held, 1);
      return 'sizzle';
    }
    const ready = world.grill.findIndex((g) => g && (g.state === 'grilled' || g.state === 'burnt'));
    if (ready >= 0) {
      const item = world.grill[ready];
      world.grill[ready] = null;
      if (item.state === 'burnt') {
        say(world, 'Burnt patty! Bin it, not the plate.');
        world.hands.push(item);
        return 'error';
      }
      if (world.hands.length >= CHEF.carryMax) {
        world.grill[ready] = item;
        say(world, 'Hands full — free a hand first.');
        return 'error';
      }
      world.hands.push(item);
      return 'pickup';
    }
    if (held < 0 && slot < 0) say(world, 'The grill is full — wait for a patty.');
    else if (held < 0) say(world, 'Bring a raw patty to the grill.');
    else say(world, 'No free grill slot.');
    return 'error';
  }
  if (station.kind === 'plates') {
    if (world.hands.length === 0) {
      say(world, 'Nothing in hand — bring an ingredient to the plate.');
      return 'error';
    }
    const item = world.hands[0];
    if (item.state === 'burnt') {
      say(world, 'Burnt food never goes on a plate. Bin it!');
      return 'error';
    }
    if (item.state === 'raw' && INGREDIENTS[item.id].prep !== 'ready') {
      say(world, `${INGREDIENTS[item.id].label} needs prepping first.`);
      return 'error';
    }
    world.plate.push(world.hands.shift());
    return 'pickup';
  }
  if (station.kind === 'serve') {
    if (world.plate.length === 0) {
      say(world, 'The plate is empty — build a dish first.');
      return 'error';
    }
    const result = servePlate(world);
    return result.served ? 'serve' : 'error';
  }
  if (station.kind === 'bin') {
    if (world.hands.length === 0 && world.plate.length > 0) {
      world.plate = [];
      say(world, 'Cleared the plate — start the dish again.');
      return 'pickup';
    }
    if (world.hands.length === 0) {
      say(world, 'Nothing to throw away.');
      return 'error';
    }
    const dropped = world.hands.shift();
    say(world, `Binned the ${preparedLabel(dropped).toLowerCase()}.`);
    return 'pickup';
  }
  return null;
}

// Clicking the fridge's ingredient shelf takes that ingredient directly.
export function takeFromFridge(world, ingredientId) {
  if (world.hands.length >= CHEF.carryMax) {
    say(world, 'Hands full — serve or bin something first.');
    return 'error';
  }
  world.hands.push({ id: ingredientId, state: 'raw' });
  return 'pickup';
}

// Clicking a station walks the chef to it, then interacts on arrival.
export function clickAt(world, x, y) {
  const station = stationAt(world, x, y);
  if (station) {
    if (station.kind === 'fridge') {
      const shelf = fridgeShelfHit(station, x, y);
      if (shelf) {
        const front = stationFront(station);
        world.chef.target = { x: front.x, y: front.y, then: () => takeFromFridge(world, shelf) };
        return 'walk';
      }
    }
    const front = stationFront(station);
    world.chef.target = { x: front.x, y: front.y, then: () => interact(world) };
    return 'walk';
  }
  world.chef.target = { x, y: Math.max(FLOOR.y + 30, Math.min(FLOOR.y + FLOOR.h - 20, y)), then: null };
  return 'walk';
}

// The fridge shows its six ingredients in two rows of three; which one did
// the click land on, if any?
export function fridgeShelfHit(station, x, y) {
  const ids = Object.keys(INGREDIENTS);
  for (let i = 0; i < ids.length; i += 1) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = station.x + 14 + col * 44;
    const by = station.y + 46 + row * 62;
    if (x >= bx && x <= bx + 40 && y >= by && y <= by + 52) return ids[i];
  }
  return null;
}

function moveChef(world, dt, input) {
  const chef = world.chef;
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (mx !== 0 || my !== 0) {
    chef.target = null;
    const len = Math.hypot(mx, my);
    chef.x += (mx / len) * CHEF.speed * dt;
    chef.y += (my / len) * CHEF.speed * dt;
    chef.facing = mx === 0 ? chef.facing : Math.sign(mx);
    chef.moving = true;
  } else if (chef.target) {
    const dx = chef.target.x - chef.x;
    const dy = chef.target.y - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
      const then = chef.target.then;
      chef.target = null;
      chef.moving = false;
      if (then) {
        const sound = then();
        if (sound) world.lastSound = sound;
      }
    } else {
      chef.x += (dx / dist) * CHEF.speed * dt;
      chef.y += (dy / dist) * CHEF.speed * dt;
      chef.facing = dx === 0 ? chef.facing : Math.sign(dx);
      chef.moving = true;
    }
  } else {
    chef.moving = false;
  }
  chef.x = Math.max(FLOOR.x + 20, Math.min(FLOOR.x + FLOOR.w - 20, chef.x));
  chef.y = Math.max(FLOOR.y + 24, Math.min(FLOOR.y + FLOOR.h - 16, chef.y));
  // The chef cannot walk through the counters: push them back below them.
  if (chef.y < FLOOR.y + 6) chef.y = FLOOR.y + 6;
}

export function step(world, dt, input) {
  if (world.screen !== SCREEN_PLAY) return;
  world.time += dt;
  world.dayLeft = Math.max(0, DAY_SECONDS - world.time);
  world.level = levelForTime(world.time);
  if (!world.rush && world.dayLeft <= RUSH_SECONDS) {
    world.rush = true;
    world.rushAnnounced = true;
    say(world, 'RUSH HOUR! Orders are coming fast — golden tickets pay double!');
    world.lastSound = 'rush';
  }
  if (world.dayLeft <= 0) {
    world.screen = SCREEN_OVER;
    world.stars = world.coins >= 320 ? 3 : world.coins >= 200 ? 2 : world.coins >= 100 ? 1 : 0;
    return;
  }
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }
  if (world.toastTimer > 0) world.toastTimer -= dt;
  if (world.flash > 0) world.flash -= dt;

  // Chopping progresses while the chef stands at the board.
  if (world.board && world.boardTimer < CHOP_SECONDS) {
    const station = nearestStation(world);
    if (station && station.kind === 'board') {
      world.boardTimer += dt;
      if (Math.floor(world.boardTimer * 4) !== Math.floor((world.boardTimer - dt) * 4)) {
        world.lastSound = 'chopTick';
      }
      if (world.boardTimer >= CHOP_SECONDS) world.lastSound = 'chopDone';
    }
  }

  // Patties cook, then burn. A burnt patty stays until it is binned.
  for (const slot of world.grill) {
    if (!slot) continue;
    slot.cook += dt;
    if (slot.state === 'raw' && slot.cook >= GRILL_SECONDS) {
      slot.state = 'grilled';
      world.lastSound = 'grillReady';
    } else if (slot.state === 'grilled' && slot.cook >= GRILL_SECONDS + BURN_SECONDS) {
      slot.state = 'burnt';
      say(world, 'A patty burnt on the grill!');
      world.lastSound = 'error';
    }
  }

  // Orders lose patience; one that hits zero walks out and breaks the combo.
  for (const order of world.orders) {
    order.patience -= dt;
  }
  const lost = world.orders.filter((o) => o.patience <= 0);
  if (lost.length > 0) {
    world.orders = world.orders.filter((o) => o.patience > 0);
    world.failed += lost.length;
    world.combo = 0;
    say(world, `${lost.length} order${lost.length > 1 ? 's' : ''} walked out!`);
    world.lastSound = 'error';
  }

  // New orders arrive on a timer, up to four on the board at once.
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0 && world.orders.length < 4) {
    const order = newOrder(world.rng, world.level, world.rush);
    order.bornAt = world.time;
    world.orders.push(order);
    world.spawnTimer = spawnInterval(world.level, world.rush) * (0.85 + world.rng() * 0.3);
    world.lastSound = 'order';
  } else if (world.spawnTimer <= 0) {
    world.spawnTimer = 2;
  }

  moveChef(world, dt, input);
}
