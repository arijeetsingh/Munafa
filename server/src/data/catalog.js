// Reference data: ingredients (with Hindi/Hinglish/English aliases), overhead
// costs, units and recipe templates for common street foods.
//
// `unit` is the base unit prices are compared in: kg, L or pc.

export const INGREDIENTS = {
  potato: { name: 'Potato', hi: 'Aloo', unit: 'kg', aliases: ['aloo', 'aaloo', 'alu', 'potato', 'potatoes', 'आलू'] },
  onion: { name: 'Onion', hi: 'Pyaaz', unit: 'kg', aliases: ['pyaaz', 'pyaz', 'piyaz', 'piyaaz', 'kanda', 'onion', 'onions', 'प्याज', 'प्याज़'] },
  tomato: { name: 'Tomato', hi: 'Tamatar', unit: 'kg', aliases: ['tamatar', 'tamaatar', 'tomato', 'tomatoes', 'टमाटर'] },
  oil: { name: 'Cooking oil', hi: 'Tel', unit: 'L', aliases: ['tel', 'oil', 'refined', 'sarso tel', 'sarson ka tel', 'cooking oil', 'तेल', 'रिफाइंड'] },
  curd: { name: 'Curd', hi: 'Dahi', unit: 'kg', aliases: ['dahi', 'curd', 'yogurt', 'दही'] },
  chickpeas: { name: 'Chickpeas', hi: 'Chana', unit: 'kg', aliases: ['chana', 'chhole', 'chole', 'safed chana', 'chickpea', 'chickpeas', 'चना', 'छोले'] },
  papdi: { name: 'Papdi', hi: 'Papdi', unit: 'kg', aliases: ['papdi', 'papri', 'पापड़ी'] },
  puri_shells: { name: 'Puri shells', hi: 'Golgappe', unit: 'pc', aliases: ['golgappe', 'golgappa', 'gol gappe', 'puchka', 'pani puri ki puri', 'puri', 'puris', 'गोलगप्पे'] },
  tamarind: { name: 'Tamarind', hi: 'Imli', unit: 'kg', aliases: ['imli', 'tamarind', 'इमली'] },
  coriander: { name: 'Coriander', hi: 'Dhaniya', unit: 'kg', aliases: ['dhaniya', 'dhania', 'coriander', 'hara dhaniya', 'धनिया'] },
  green_chilli: { name: 'Green chilli', hi: 'Hari mirch', unit: 'kg', aliases: ['hari mirch', 'mirchi', 'mirch', 'chilli', 'chili', 'green chilli', 'मिर्च', 'हरी मिर्च'] },
  lemon: { name: 'Lemon', hi: 'Nimbu', unit: 'pc', aliases: ['nimbu', 'neembu', 'lemon', 'lemons', 'नींबू'] },
  ginger: { name: 'Ginger', hi: 'Adrak', unit: 'kg', aliases: ['adrak', 'ginger', 'अदरक'] },
  garlic: { name: 'Garlic', hi: 'Lehsun', unit: 'kg', aliases: ['lehsun', 'lahsun', 'garlic', 'लहसुन'] },
  maida: { name: 'Maida', hi: 'Maida', unit: 'kg', aliases: ['maida', 'refined flour', 'मैदा'] },
  atta: { name: 'Wheat flour', hi: 'Atta', unit: 'kg', aliases: ['atta', 'aata', 'gehun', 'wheat flour', 'आटा'] },
  besan: { name: 'Gram flour', hi: 'Besan', unit: 'kg', aliases: ['besan', 'gram flour', 'बेसन'] },
  rice: { name: 'Rice', hi: 'Chawal', unit: 'kg', aliases: ['chawal', 'chaawal', 'rice', 'चावल'] },
  urad_dal: { name: 'Urad dal', hi: 'Urad dal', unit: 'kg', aliases: ['urad', 'urad dal', 'dal', 'daal', 'उड़द', 'दाल'] },
  murmura: { name: 'Puffed rice', hi: 'Murmura', unit: 'kg', aliases: ['murmura', 'murmure', 'kurmura', 'puffed rice', 'मुरमुरा'] },
  milk: { name: 'Milk', hi: 'Doodh', unit: 'L', aliases: ['doodh', 'dudh', 'milk', 'दूध'] },
  tea_leaves: { name: 'Tea leaves', hi: 'Chai patti', unit: 'kg', aliases: ['chai patti', 'chaipatti', 'patti', 'tea leaves', 'tea powder', 'चायपत्ती', 'चाय पत्ती'] },
  sugar: { name: 'Sugar', hi: 'Cheeni', unit: 'kg', aliases: ['cheeni', 'chini', 'shakkar', 'sugar', 'चीनी', 'शक्कर'] },
  paneer: { name: 'Paneer', hi: 'Paneer', unit: 'kg', aliases: ['paneer', 'panir', 'पनीर'] },
  cabbage: { name: 'Cabbage', hi: 'Patta gobhi', unit: 'kg', aliases: ['patta gobhi', 'pattagobhi', 'band gobhi', 'gobhi', 'cabbage', 'पत्ता गोभी'] },
  carrot: { name: 'Carrot', hi: 'Gajar', unit: 'kg', aliases: ['gajar', 'carrot', 'carrots', 'गाजर'] },
  pav: { name: 'Pav', hi: 'Pav', unit: 'pc', aliases: ['pav', 'pao', 'bun', 'buns', 'bread', 'double roti', 'पाव', 'ब्रेड'] },
  butter: { name: 'Butter', hi: 'Makhan', unit: 'kg', aliases: ['butter', 'makhan', 'makkhan', 'amul', 'मक्खन'] },
  masala: { name: 'Spices', hi: 'Masala', unit: 'kg', aliases: ['masala', 'masale', 'chaat masala', 'spices', 'garam masala', 'मसाला'] },
  salt: { name: 'Salt', hi: 'Namak', unit: 'kg', aliases: ['namak', 'salt', 'नमक'] },
  sev: { name: 'Sev', hi: 'Sev', unit: 'kg', aliases: ['sev', 'bhujia', 'namkeen', 'सेव'] },
  peanuts: { name: 'Peanuts', hi: 'Moongphali', unit: 'kg', aliases: ['moongphali', 'mungfali', 'peanut', 'peanuts', 'मूंगफली'] },
  coconut: { name: 'Coconut', hi: 'Nariyal', unit: 'pc', aliases: ['nariyal', 'coconut', 'नारियल'] },
  mosambi: { name: 'Sweet lime', hi: 'Mosambi', unit: 'kg', aliases: ['mosambi', 'mausambi', 'mausami', 'sweet lime', 'मौसमी'] },
  orange: { name: 'Orange', hi: 'Santra', unit: 'kg', aliases: ['santra', 'santara', 'narangi', 'orange', 'oranges', 'संतरा'] },
  pomegranate: { name: 'Pomegranate', hi: 'Anaar', unit: 'kg', aliases: ['anaar', 'anar', 'pomegranate', 'अनार'] },
  banana: { name: 'Banana', hi: 'Kela', unit: 'pc', aliases: ['kela', 'kele', 'banana', 'bananas', 'केला', 'केले'] },
  apple: { name: 'Apple', hi: 'Seb', unit: 'kg', aliases: ['seb', 'saib', 'apple', 'apples', 'सेब'] },
  ice: { name: 'Ice', hi: 'Baraf', unit: 'kg', aliases: ['baraf', 'barf', 'ice', 'बर्फ'] },
  lpg: { name: 'LPG cylinder', hi: 'Gas', unit: 'pc', aliases: ['gas', 'cylinder', 'silendar', 'lpg', 'गैस', 'सिलेंडर'] },
  packaging: { name: 'Packaging', hi: 'Dona-plate', unit: 'pc', aliases: ['dona', 'done', 'pattal', 'paper plate', 'paper cup', 'cups', 'glasses', 'disposable', 'packaging', 'thaili', 'polythene', 'dona plate', 'दोना'] },
  chicken: { name: 'Chicken', hi: 'Chicken', unit: 'kg', aliases: ['chicken', 'murga', 'मुर्गा', 'चिकन'] },
  eggs: { name: 'Eggs', hi: 'Ande', unit: 'pc', aliases: ['anda', 'ande', 'egg', 'eggs', 'अंडा', 'अंडे'] },
  mayonnaise: { name: 'Mayonnaise', hi: 'Mayonnaise', unit: 'kg', aliases: ['mayo', 'mayonnaise', 'मेयो'] },
};

// Costs that are real expenses but not recipe ingredients.
export const OVERHEADS = {
  rent: { name: 'Rent', hi: 'Kiraya', aliases: ['kiraya', 'kiraaya', 'rent', 'dukaan ka bhada', 'dukan ka kiraya', 'jagah ka bhada', 'किराया'] },
  transport: { name: 'Transport', hi: 'Bhaada', aliases: ['auto', 'rickshaw', 'tempo', 'transport', 'bhada', 'bhaada', 'auto ka bhada', 'auto ka kiraya', 'gaadi ka bhada', 'petrol', 'diesel'] },
  wages: { name: 'Wages', hi: 'Mazdoori', aliases: ['mazdoori', 'majdoori', 'salary', 'tankhwah', 'helper', 'wages', 'मजदूरी'] },
  electricity: { name: 'Electricity', hi: 'Bijli', aliases: ['bijli', 'light', 'electricity', 'बिजली'] },
  fees: { name: 'Fees', hi: 'Fees', aliases: ['committee', 'fees', 'fee', 'parchi', 'challan', 'municipal'] },
};

// Spoken unit → canonical unit, and how canonical units convert to base units.
export const UNIT_ALIASES = {
  kg: ['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms', 'किलो'],
  g: ['g', 'gm', 'gms', 'gram', 'grams', 'gramm', 'ग्राम'],
  L: ['l', 'ltr', 'ltrs', 'litre', 'litres', 'liter', 'liters', 'leter', 'लीटर'],
  ml: ['ml', 'millilitre', 'milliliter'],
  pc: ['pc', 'pcs', 'piece', 'pieces', 'nag', 'adad', 'पीस'],
  dozen: ['dozen', 'darjan', 'darjen', 'दर्जन'],
  packet: ['packet', 'packets', 'pkt', 'paket', 'packet', 'पैकेट'],
  plate: ['plate', 'plates', 'pleat', 'प्लेट'],
  cup: ['cup', 'cups', 'kulhad', 'कप'],
  glass: ['glass', 'glasses', 'gilas', 'गिलास'],
  bundle: ['gaddi', 'gaddiyan', 'bundle', 'bundles', 'jhuda', 'गड्डी'],
  crate: ['crate', 'crates', 'peti', 'petiyan', 'पेटी'],
  sack: ['bori', 'boriyan', 'sack', 'bag', 'बोरी'],
  cylinder: ['cylinder', 'silendar'],
};

export const UNIT_TO_BASE = {
  kg: { base: 'kg', factor: 1 },
  g: { base: 'kg', factor: 0.001 },
  L: { base: 'L', factor: 1 },
  ml: { base: 'L', factor: 0.001 },
  pc: { base: 'pc', factor: 1 },
  dozen: { base: 'pc', factor: 12 },
  cylinder: { base: 'pc', factor: 1 },
};

export function toBase(qty, unit) {
  const conv = UNIT_TO_BASE[unit];
  if (!conv || qty == null) return null;
  return { qty: qty * conv.factor, unit: conv.base };
}

// Recipe templates: quantities are per serving, in base units.
// Selling prices are typical defaults; vendors change them at onboarding.
export const MENU_TEMPLATES = [
  {
    key: 'pani_puri', name: 'Pani puri', serving: '6 pcs', price: 30, businessTypes: ['chaat'],
    aliases: ['pani puri', 'panipuri', 'golgappa plate', 'gol gappe plate', 'puchka plate', 'पानी पुरी'],
    recipe: [['puri_shells', 6], ['potato', 0.04], ['chickpeas', 0.01], ['tamarind', 0.005], ['coriander', 0.003], ['green_chilli', 0.002], ['masala', 0.002], ['packaging', 1]],
  },
  {
    key: 'aloo_tikki_chaat', name: 'Aloo tikki chaat', serving: '2 tikki', price: 40, businessTypes: ['chaat'],
    aliases: ['aloo tikki', 'tikki chaat', 'tikki', 'aloo tikki chaat', 'आलू टिक्की'],
    recipe: [['potato', 0.12], ['oil', 0.02], ['curd', 0.04], ['chickpeas', 0.02], ['tamarind', 0.005], ['coriander', 0.003], ['masala', 0.003], ['packaging', 1]],
  },
  {
    key: 'papdi_chaat', name: 'Papdi chaat', serving: '1 plate', price: 40, businessTypes: ['chaat'],
    aliases: ['papdi chaat', 'papri chaat', 'पापड़ी चाट'],
    recipe: [['papdi', 0.04], ['potato', 0.05], ['curd', 0.06], ['chickpeas', 0.02], ['tamarind', 0.006], ['sev', 0.01], ['masala', 0.002], ['packaging', 1]],
  },
  {
    key: 'samosa', name: 'Samosa', serving: '1 pc', price: 15, businessTypes: ['chaat', 'tea'],
    aliases: ['samosa', 'samose', 'samosas', 'समोसा', 'समोसे'],
    recipe: [['maida', 0.03], ['potato', 0.05], ['oil', 0.015], ['masala', 0.002], ['packaging', 0.5]],
  },
  {
    key: 'bhel_puri', name: 'Bhel puri', serving: '1 plate', price: 35, businessTypes: ['chaat'],
    aliases: ['bhel', 'bhel puri', 'bhelpuri', 'भेल'],
    recipe: [['murmura', 0.04], ['sev', 0.015], ['onion', 0.02], ['tomato', 0.02], ['potato', 0.03], ['tamarind', 0.005], ['coriander', 0.002], ['packaging', 1]],
  },
  {
    key: 'veg_momos', name: 'Veg momos', serving: '8 pcs', price: 60, businessTypes: ['momos'],
    aliases: ['momo', 'momos', 'veg momos', 'veg momo', 'मोमोज'],
    recipe: [['maida', 0.08], ['cabbage', 0.06], ['carrot', 0.02], ['onion', 0.02], ['oil', 0.005], ['garlic', 0.003], ['ginger', 0.003], ['masala', 0.002], ['packaging', 1]],
  },
  {
    key: 'paneer_momos', name: 'Paneer momos', serving: '8 pcs', price: 80, businessTypes: ['momos'],
    aliases: ['paneer momo', 'paneer momos', 'पनीर मोमोज'],
    recipe: [['maida', 0.08], ['paneer', 0.05], ['onion', 0.02], ['oil', 0.005], ['garlic', 0.003], ['ginger', 0.003], ['masala', 0.002], ['packaging', 1]],
  },
  {
    key: 'masala_chai', name: 'Masala chai', serving: '1 cup', price: 12, businessTypes: ['tea'],
    aliases: ['chai', 'cha', 'masala chai', 'cutting', 'tea', 'चाय'],
    recipe: [['milk', 0.08], ['tea_leaves', 0.003], ['sugar', 0.012], ['ginger', 0.002], ['packaging', 1]],
  },
  {
    key: 'masala_dosa', name: 'Masala dosa', serving: '1 pc', price: 60, businessTypes: ['dosa'],
    aliases: ['dosa', 'dosai', 'masala dosa', 'डोसा'],
    recipe: [['rice', 0.06], ['urad_dal', 0.02], ['potato', 0.08], ['onion', 0.02], ['oil', 0.015], ['coconut', 0.1], ['masala', 0.002], ['packaging', 1]],
  },
  {
    key: 'vada_pav', name: 'Vada pav', serving: '1 pc', price: 20, businessTypes: ['chaat', 'snacks'],
    aliases: ['vada pav', 'vadapav', 'wada pav', 'वड़ा पाव'],
    recipe: [['pav', 1], ['potato', 0.07], ['besan', 0.025], ['oil', 0.02], ['garlic', 0.002], ['green_chilli', 0.002], ['packaging', 0.5]],
  },
  {
    key: 'pav_bhaji', name: 'Pav bhaji', serving: '1 plate', price: 70, businessTypes: ['snacks'],
    aliases: ['pav bhaji', 'pavbhaji', 'bhaji', 'पाव भाजी'],
    recipe: [['pav', 2], ['potato', 0.1], ['tomato', 0.06], ['onion', 0.03], ['butter', 0.015], ['masala', 0.005], ['lemon', 0.25], ['packaging', 1]],
  },
  {
    key: 'mosambi_juice', name: 'Mosambi juice', serving: '1 glass', price: 40, businessTypes: ['juice'],
    aliases: ['mosambi juice', 'mausambi juice', 'juice', 'jus', 'मौसमी जूस'],
    recipe: [['mosambi', 0.5], ['sugar', 0.01], ['ice', 0.1], ['packaging', 1]],
  },
  {
    key: 'orange_juice', name: 'Orange juice', serving: '1 glass', price: 50, businessTypes: ['juice'],
    aliases: ['orange juice', 'santra juice', 'संतरा जूस'],
    recipe: [['orange', 0.55], ['sugar', 0.01], ['ice', 0.1], ['packaging', 1]],
  },
];

export const BUSINESS_TYPES = [
  { key: 'chaat', name: 'Chaat stall' },
  { key: 'momos', name: 'Momo cart' },
  { key: 'tea', name: 'Tea stall' },
  { key: 'dosa', name: 'Dosa / South Indian' },
  { key: 'snacks', name: 'Snacks (vada pav, pav bhaji)' },
  { key: 'juice', name: 'Juice counter' },
];

export const AREAS = ['Lucknow', 'Pune', 'Bengaluru', 'Delhi', 'Mumbai'];

export function templateByKey(key) {
  return MENU_TEMPLATES.find((t) => t.key === key);
}

export function ingredientName(key, lang = 'hinglish') {
  const ing = INGREDIENTS[key] || OVERHEADS[key];
  if (!ing) return key;
  return lang === 'en' ? ing.name : ing.hi;
}
