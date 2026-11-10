// Seeded area price benchmarks for the MVP (PRD F6: "the MVP uses a seeded
// benchmark table"). Values are illustrative wholesale medians in ₹ per base
// unit; replace them with mandi rates (e.g. Agmarknet) and, later, anonymised
// prices logged by vendors in the same area.

const BASE_PRICES = {
  potato: 30, onion: 32, tomato: 28, oil: 125, curd: 70, chickpeas: 90, papdi: 120,
  puri_shells: 0.8, tamarind: 120, coriander: 80, green_chilli: 60, lemon: 5, ginger: 120,
  garlic: 160, maida: 40, atta: 38, besan: 90, rice: 50, urad_dal: 120, murmura: 80,
  milk: 58, tea_leaves: 400, sugar: 44, paneer: 340, cabbage: 30, carrot: 40, pav: 3.5,
  butter: 520, masala: 300, salt: 22, sev: 160, peanuts: 130, coconut: 35, mosambi: 70,
  orange: 80, pomegranate: 160, banana: 5, apple: 160, ice: 8, lpg: 1750, packaging: 1.2,
  chicken: 220, eggs: 7, mayonnaise: 160,
};

// Area multipliers (rough cost-of-living spread across metros and tier-2 cities).
const AREA_FACTOR = { Lucknow: 0.95, Pune: 1.0, Bengaluru: 1.06, Delhi: 1.02, Mumbai: 1.08 };

// Some items have too few data points in some areas, so alerts stay silent
// there (PRD F6: alert only with 5+ data points).
const SPARSE = { Lucknow: ['tea_leaves', 'mayonnaise'], Pune: ['papdi'], Bengaluru: ['murmura'], Delhi: [], Mumbai: ['tamarind'] };

function round(n) {
  return n < 10 ? Math.round(n * 100) / 100 : Math.round(n);
}

export function buildBenchmarks(units) {
  const rows = [];
  for (const [area, factor] of Object.entries(AREA_FACTOR)) {
    for (const [key, price] of Object.entries(BASE_PRICES)) {
      // Deterministic pseudo-variation so areas differ item by item.
      const wobble = 1 + (((key.length * 7 + area.length * 3) % 9) - 4) / 100;
      const sampleSize = SPARSE[area].includes(key) ? 3 : 6 + ((key.length * 5 + area.length) % 30);
      rows.push({ ingredientKey: key, area, unit: units[key], medianPrice: round(price * factor * wobble), sampleSize, source: 'seed' });
    }
  }
  return rows;
}
