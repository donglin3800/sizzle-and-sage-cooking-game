// Sizzle & Sage — configuration: the kitchen, its ingredients and its recipes.
// Every number that tunes the game lives here, so the world, the renderer and
// the screenshot stager all agree on one kitchen.

export const VIEW = { width: 1280, height: 720 };

export const DAY_SECONDS = 150;
export const RUSH_SECONDS = 30;
export const COMBO_WINDOW = 12;

// The chef walks this fast (pixels per second) and can carry this many items.
export const CHEF = { speed: 300, radius: 22, carryMax: 2 };

// Chopping takes this long per item; a patty grills in this long, then burns.
export const CHOP_SECONDS = 1.6;
export const GRILL_SECONDS = 6;
export const BURN_SECONDS = 6;

// An order waits this long (plus a little per extra ingredient) before it walks out.
export const ORDER_PATIENCE = 52;

// Ingredients: id, label, colour, whether it needs chopping or grilling, and
// the little shape the renderer draws for it on a counter or a plate.
export const INGREDIENTS = {
  bun: { id: 'bun', label: 'Bun', colour: '#e8a94e', prep: 'ready', shape: 'bun' },
  patty: { id: 'patty', label: 'Patty', colour: '#7a4a2b', prep: 'grill', shape: 'patty' },
  cheese: { id: 'cheese', label: 'Cheese', colour: '#f7c948', prep: 'ready', shape: 'cheese' },
  tomato: { id: 'tomato', label: 'Tomato', colour: '#e23b2e', prep: 'chop', shape: 'tomato' },
  lettuce: { id: 'lettuce', label: 'Lettuce', colour: '#58b368', prep: 'chop', shape: 'lettuce' },
  onion: { id: 'onion', label: 'Onion', colour: '#efe3f2', prep: 'chop', shape: 'onion' },
};

// A prepared item is an ingredient id plus its state: raw, chopped or grilled.
export function preparedLabel(item) {
  if (!item) return '';
  if (item.state === 'chopped') return `Chopped ${INGREDIENTS[item.id].label}`;
  if (item.state === 'grilled') return `Grilled ${INGREDIENTS[item.id].label}`;
  if (item.state === 'burnt') return `Burnt ${INGREDIENTS[item.id].label}`;
  return INGREDIENTS[item.id].label;
}

// Recipes: the dish name, the exact prepared items it needs, its base price
// and the colour the order card wears. Order matters on the plate only in
// that every needed item must be present, once each, except where count > 1.
export const RECIPES = [
  {
    id: 'salad',
    name: 'Garden Salad',
    needs: [
      { id: 'tomato', state: 'chopped' },
      { id: 'lettuce', state: 'chopped' },
      { id: 'onion', state: 'chopped' },
    ],
    price: 14,
    colour: '#58b368',
  },
  {
    id: 'burger',
    name: 'Classic Burger',
    needs: [
      { id: 'bun', state: 'raw' },
      { id: 'patty', state: 'grilled' },
      { id: 'lettuce', state: 'chopped' },
    ],
    price: 18,
    colour: '#e8a94e',
  },
  {
    id: 'melt',
    name: 'Cheese Melt',
    needs: [
      { id: 'bun', state: 'raw' },
      { id: 'patty', state: 'grilled' },
      { id: 'cheese', state: 'raw' },
      { id: 'tomato', state: 'chopped' },
    ],
    price: 24,
    colour: '#f7c948',
  },
  {
    id: 'double',
    name: 'Double Stack',
    needs: [
      { id: 'bun', state: 'raw' },
      { id: 'patty', state: 'grilled' },
      { id: 'patty', state: 'grilled' },
      { id: 'cheese', state: 'raw' },
    ],
    price: 28,
    colour: '#b06a2c',
  },
  {
    id: 'sage',
    name: 'Sage Special',
    needs: [
      { id: 'bun', state: 'raw' },
      { id: 'patty', state: 'grilled' },
      { id: 'cheese', state: 'raw' },
      { id: 'lettuce', state: 'chopped' },
      { id: 'tomato', state: 'chopped' },
    ],
    price: 36,
    colour: '#7d5ba6',
  },
];

export function recipeById(id) {
  return RECIPES.find((recipe) => recipe.id === id) || null;
}

// Which recipes may appear at each rush level. Early on only the easy two,
// then the menu opens up as the kitchen gets busier.
export function menuForLevel(level) {
  if (level <= 1) return RECIPES.slice(0, 2);
  if (level === 2) return RECIPES.slice(0, 3);
  if (level === 3) return RECIPES.slice(0, 4);
  return RECIPES;
}

// Seconds between new orders at each level; the rush hour shortens it further.
export function spawnInterval(level, rush) {
  const base = [9, 7.5, 6.5, 5.5, 5][Math.min(level - 1, 4)];
  return rush ? base * 0.62 : base;
}

// Stations: id, label, rectangle on the floor plan and what it does.
// The fridge hands out raw ingredients; the board chops; the grill cooks;
// the plate counter assembles; the window serves; the bin throws food away.
export const STATIONS = {
  fridge: { id: 'fridge', label: 'Fridge', x: 36, y: 196, w: 150, h: 190, kind: 'fridge' },
  board: { id: 'board', label: 'Chopping Board', x: 216, y: 196, w: 190, h: 110, kind: 'board' },
  grill: { id: 'grill', label: 'Grill', x: 436, y: 196, w: 240, h: 110, kind: 'grill' },
  plates: { id: 'plates', label: 'Plating Counter', x: 706, y: 196, w: 240, h: 110, kind: 'plates' },
  serve: { id: 'serve', label: 'Serve Window', x: 976, y: 196, w: 150, h: 190, kind: 'serve' },
  bin: { id: 'bin', label: 'Bin', x: 1150, y: 196, w: 94, h: 110, kind: 'bin' },
};

// Where the chef stands to use each station (just below its counter).
export function stationFront(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h + 34 };
}

// The floor the chef may walk on: everything below the counters, inside the walls.
export const FLOOR = { x: 24, y: 330, w: 1232, h: 366 };

// Deterministic random numbers, so a screenshot staged from a seed is the
// same frame every time. A tiny mulberry32.
export function makeRng(seed) {
  let value = seed >>> 0;
  return function next() {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
