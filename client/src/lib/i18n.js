// UI copy in three languages. Hinglish is the default (PRD: "simple
// Hindi/Hinglish"). Each entry: [hinglish, hindi, english].

const D = {
  // navigation
  nav_home: ['Aaj', 'आज', 'Today'],
  nav_hisaab: ['Hisaab', 'हिसाब', 'Profit'],
  nav_insights: ['Samjho', 'समझो', 'Insights'],
  nav_khata: ['Khata', 'खाता', 'Entries'],
  nav_settings: ['Settings', 'सेटिंग', 'Settings'],
  nav_metrics: ['Pilot metrics', 'पायलट मेट्रिक्स', 'Pilot metrics'],

  // home
  greet: ['Namaste, {name}', 'नमस्ते, {name}', 'Hello, {name}'],
  todays_profit: ['Aaj ka munafa', 'आज का मुनाफ़ा', "Today's profit"],
  sales: ['Bikri', 'बिक्री', 'Sales'],
  expenses: ['Kharcha', 'खर्चा', 'Costs'],
  profit: ['Munafa', 'मुनाफ़ा', 'Profit'],
  loss: ['Nuksaan', 'नुकसान', 'Loss'],
  sales_pending: ['Bikri abhi baaki hai', 'बिक्री अभी बाकी है', 'Sales not logged yet'],
  mic_idle: ['Bolo', 'बोलो', 'Speak'],
  mic_listening: ['Sun raha hoon…', 'सुन रहा हूँ…', 'Listening…'],
  mic_hint: ['Dabaao aur bolo, jaise "teen kilo pyaaz 90 rupaye"', 'दबाओ और बोलो, जैसे "तीन किलो प्याज़ 90 रुपये"', 'Tap and say, e.g. "3 kg onions 90 rupees"'],
  mic_unsupported: ['Is browser mein mic nahi chalta. Neeche likh dijiye.', 'इस ब्राउज़र में माइक नहीं चलता। नीचे लिख दीजिए।', "Voice isn't supported in this browser. Type below instead."],
  mic_denied: ['Mic ki permission chahiye. Browser settings mein allow karein.', 'माइक की अनुमति चाहिए। ब्राउज़र सेटिंग में अनुमति दें।', 'Microphone permission is needed. Allow it in browser settings.'],
  mic_nothing: ['Kuch sunai nahi diya. Phir se bolo.', 'कुछ सुनाई नहीं दिया। फिर से बोलिए।', "Didn't catch that. Try again."],
  type_instead: ['Ya likho…', 'या लिखो…', 'Or type…'],
  type_placeholder: ['5 kilo aloo 150, 2 litre tel 280', '5 किलो आलू 150, 2 लीटर तेल 280', '5 kg potatoes 150, 2 L oil 280'],
  try_saying: ['Aise bolo', 'ऐसे बोलो', 'Try saying'],
  recent: ['Aaj ki entries', 'आज की एंट्री', "Today's entries"],
  see_all: ['Sab dekho', 'सब देखो', 'See all'],
  no_entries: ['Abhi koi entry nahi. Mic dabaao aur pehli kharidari bolo.', 'अभी कोई एंट्री नहीं। माइक दबाओ और पहली खरीदारी बोलो।', 'No entries yet. Tap the mic and say your first purchase.'],
  tip_of_day: ['Aaj ki salah', 'आज की सलाह', "Today's tip"],
  streak: ['{n} din lagataar', '{n} दिन लगातार', '{n}-day streak'],
  vs_yesterday: ['kal se', 'कल से', 'vs yesterday'],
  top_costs: ['Sabse bade kharche', 'सबसे बड़े खर्चे', 'Top costs'],
  reminder_banner: ['Dukaan band karne ka samay. Aaj ki bikri bolo aur hisaab dekho.', 'दुकान बंद करने का समय। आज की बिक्री बोलिए और हिसाब देखिए।', "Closing time. Log today's sales and see your profit."],
  log_sales: ['Bikri bolo', 'बिक्री बोलो', 'Log sales'],

  // confirm sheet
  confirm_title: ['Sahi hai?', 'सही है?', 'Is this right?'],
  confirm_sub: ['Check karke save karo. Peela nishaan = dhyaan se dekho.', 'जाँच कर सेव करें। पीला निशान = ध्यान से देखें।', 'Check and save. Highlighted fields need a look.'],
  you_said: ['Aapne kaha', 'आपने कहा', 'You said'],
  expense: ['Kharcha', 'खर्चा', 'Expense'],
  sale: ['Bikri', 'बिक्री', 'Sale'],
  item: ['Cheez', 'चीज़', 'Item'],
  quantity: ['Maatra', 'मात्रा', 'Quantity'],
  unit: ['Unit', 'इकाई', 'Unit'],
  amount: ['Rakam (₹)', 'रकम (₹)', 'Amount (₹)'],
  check: ['check karo', 'जाँचें', 'check'],
  save: ['Save', 'सेव', 'Save'],
  save_all: ['Sab save karo', 'सब सेव करो', 'Save all'],
  edit: ['Badlo', 'बदलो', 'Edit'],
  done: ['Ho gaya', 'हो गया', 'Done'],
  remove: ['Hatao', 'हटाओ', 'Remove'],
  cancel: ['Rehne do', 'रहने दो', 'Cancel'],
  delete: ['Delete', 'मिटाओ', 'Delete'],
  parsed_by_ai: ['AI ne samjha', 'AI ने समझा', 'Read by AI'],
  parsed_by_rules: ['Munafa ne samjha', 'मुनाफ़ा ने समझा', 'Read by Munafa'],
  nothing_found: ['Isme rakam ya maatra nahi mili. Jaise bolo: "2 litre tel 280".', 'इसमें रकम या मात्रा नहीं मिली। जैसे बोलिए: "2 लीटर तेल 280"।', 'No amount or quantity found. Try: "2 L oil 280".'],
  amount_required: ['Rakam daalo', 'रकम डालें', 'Enter an amount'],
  saved_n: ['{n} entry save hui', '{n} एंट्री सेव हुई', '{n} saved'],
  saved_offline: ['Internet nahi hai. Entry phone par save hai, baad mein sync hogi.', 'इंटरनेट नहीं है। एंट्री फ़ोन पर सेव है, बाद में सिंक होगी।', 'Offline. Saved on this phone; will sync later.'],
  synced_n: ['{n} offline entry sync ho gayi', '{n} ऑफ़लाइन एंट्री सिंक हो गईं', '{n} offline entries synced'],
  pending_sync: ['{n} sync baaki', '{n} सिंक बाकी', '{n} waiting to sync'],
  offline: ['Offline', 'ऑफ़लाइन', 'Offline'],
  add_line: ['Ek aur jodo', 'एक और जोड़ो', 'Add another'],
  other: ['Aur kuch', 'और कुछ', 'Other'],

  // today / hisaab
  hisaab_title: ['Aaj ka hisaab', 'आज का हिसाब', "Today's account"],
  share_whatsapp: ['WhatsApp par bhejo', 'WhatsApp पर भेजो', 'Share on WhatsApp'],
  copy: ['Copy', 'कॉपी', 'Copy'],
  copied: ['Copy ho gaya', 'कॉपी हो गया', 'Copied'],
  read_aloud: ['Sunao', 'सुनाओ', 'Read aloud'],
  cash_check: ['Galla milao', 'गल्ला मिलाओ', 'Cash check'],
  cash_check_sub: ['Aaj galle mein kitna aaya (cash + UPI)? Boli hui bikri se milate hain.', 'आज गल्ले में कितना आया (नकद + UPI)? बोली हुई बिक्री से मिलाते हैं।', 'How much came in today (cash + UPI)? We match it against logged sales.'],
  cash_counted: ['Aaj ki kamai, gin kar', 'आज की कमाई, गिनकर', 'Collected today'],
  cash_match: ['Hisaab mil gaya. Aapke number sahi hain.', 'हिसाब मिल गया। आपके नंबर सही हैं।', 'It matches. Your numbers are right.'],
  cash_gap_more: ['Galle mein {gap} zyada hai. Koi bikri bolna bhool gaye?', 'गल्ले में {gap} ज़्यादा है। कोई बिक्री बोलना भूल गए?', '{gap} more than logged sales. Missed a sale?'],
  cash_gap_less: ['Galle mein {gap} kam hai. Udhaar diya, ya koi bikri do baar boli?', 'गल्ले में {gap} कम है। उधार दिया, या कोई बिक्री दो बार बोली?', '{gap} less than logged sales. Credit given, or a sale logged twice?'],
  cash_note: ['Subah ka khulla paisa alag rakh kar ginein.', 'सुबह के खुले पैसे अलग रखकर गिनें।', "Leave out the morning's change float when counting."],
  check_btn: ['Milao', 'मिलाओ', 'Check'],
  no_data_day: ['Is din koi entry nahi.', 'इस दिन कोई एंट्री नहीं।', 'Nothing logged on this day.'],
  summary_line_profit: ['Aaj ka munafa', 'आज का मुनाफ़ा', "Today's profit"],
  all_entries: ['Saari entries', 'सारी एंट्री', 'All entries'],
  of_costs: ['kharche ka', 'खर्चे का', 'of costs'],

  // insights
  insights_title: ['Samjho apna dhanda', 'समझो अपना धंधा', 'Understand your business'],
  price_alerts: ['Rate alert', 'रेट अलर्ट', 'Price alerts'],
  price_alerts_sub: ['Jab aap {area} ke median se 10%+ zyada dete ho', 'जब आप {area} के मीडियन से 10%+ ज़्यादा देते हैं', 'When you pay 10%+ above the {area} median'],
  no_alerts: ['Sab rate theek hain. Koi cheez area se 10% se zyada mehengi nahi.', 'सब रेट ठीक हैं। कोई चीज़ इलाके से 10% से ज़्यादा महँगी नहीं।', 'All good: nothing is 10%+ above the area rate.'],
  you_paid: ['Aapne diya', 'आपने दिया', 'You paid'],
  area_median: ['Area median', 'इलाके का मीडियन', 'Area median'],
  higher: ['zyada', 'ज़्यादा', 'higher'],
  monthly_saving: ['Lagbhag {amt}/mahina bach sakta hai', 'लगभग {amt}/महीना बच सकता है', 'About {amt}/month to save'],
  based_on: ['{n} data points', '{n} डेटा पॉइंट', '{n} data points'],
  trend_title: ['Pichhle 7 din ka munafa', 'पिछले 7 दिन का मुनाफ़ा', 'Profit, last 7 days'],
  week_profit: ['Is hafte', 'इस हफ़्ते', 'This week'],
  prev_week: ['pichhle hafte', 'पिछले हफ़्ते', 'last week'],
  best_item: ['Sabse zyada bikne wala', 'सबसे ज़्यादा बिकने वाला', 'Best seller'],
  worst_item: ['Sabse kam', 'सबसे कम', 'Slowest'],
  plates_title: ['Har plate ki laagat', 'हर प्लेट की लागत', 'Cost per plate'],
  plates_sub: ['Aapke aakhri rate se. Jahan rate nahi bola, wahan area ka rate.', 'आपके आख़िरी रेट से। जहाँ रेट नहीं बोला, वहाँ इलाके का रेट।', 'From your latest prices; area rates where you have none.'],
  price: ['Daam', 'दाम', 'Price'],
  cost: ['Laagat', 'लागत', 'Cost'],
  margin: ['Margin', 'मार्जिन', 'Margin'],
  ingredient: ['Saamaan', 'सामान', 'Ingredient'],
  per_plate: ['per plate', 'प्रति प्लेट', 'per plate'],
  src_yours: ['aapka rate', 'आपका रेट', 'your price'],
  src_area: ['area rate', 'इलाके का रेट', 'area rate'],
  prices_title: ['Aapke rate vs area', 'आपके रेट बनाम इलाका', 'Your prices vs area'],
  not_enough_data: ['data kam', 'डेटा कम', 'too few data'],
  no_menu_sales: ['Item-wise bikri bolne par yahan dikhega.', 'आइटम के हिसाब से बिक्री बोलने पर यहाँ दिखेगा।', 'Log sales by item to see this.'],

  // entries
  khata_title: ['Khata', 'खाता', 'Entries'],
  last_days: ['Pichhle {n} din', 'पिछले {n} दिन', 'Last {n} days'],
  edited: ['badla gaya', 'बदला गया', 'edited'],
  delete_confirm: ['Pakka hatana hai?', 'पक्का हटाना है?', 'Delete this entry?'],
  deleted: ['Entry hata di', 'एंट्री हटा दी', 'Entry deleted'],
  updated: ['Entry badal di', 'एंट्री बदल दी', 'Entry updated'],

  // settings
  settings_title: ['Settings', 'सेटिंग', 'Settings'],
  profile: ['Dukaan', 'दुकान', 'Stall'],
  your_name: ['Aapka naam', 'आपका नाम', 'Your name'],
  language: ['Bhasha', 'भाषा', 'Language'],
  business_type: ['Dhanda', 'धंधा', 'Business'],
  area: ['Shehar', 'शहर', 'City'],
  closing_time: ['Dukaan band karne ka samay', 'दुकान बंद करने का समय', 'Closing time'],
  reminders: ['Closing par yaad dilao', 'बंद करते समय याद दिलाओ', 'Remind me at closing'],
  enable_notifications: ['Notification on karo', 'नोटिफ़िकेशन चालू करें', 'Turn on notifications'],
  notifications_on: ['Notifications on hain', 'नोटिफ़िकेशन चालू हैं', 'Notifications are on'],
  menu: ['Menu', 'मेन्यू', 'Menu'],
  menu_sub: ['Daam badlo ya naya item jodo. Laagat apne aap update hoti hai.', 'दाम बदलो या नया आइटम जोड़ो। लागत अपने आप अपडेट होती है।', 'Change prices or add items. Costs update automatically.'],
  add_item: ['Item jodo', 'आइटम जोड़ो', 'Add item'],
  saved: ['Save ho gaya', 'सेव हो गया', 'Saved'],
  logout: ['Log out', 'लॉग आउट', 'Log out'],
  parser_mode: ['Samajhne ka tareeka', 'समझने का तरीका', 'Parser'],
  parser_llm: ['Claude AI + rules', 'Claude AI + नियम', 'Claude AI + rules fallback'],
  parser_rules: ['Built-in Hinglish rules (offline-ready)', 'बिल्ट-इन हिंग्लिश नियम', 'Built-in Hinglish rules'],

  // login / onboarding
  tagline: ['Aaj ka munafa, ek vaakya mein.', 'आज का मुनाफ़ा, एक वाक्य में।', 'Your daily profit, in one spoken sentence.'],
  login_title: ['Apne phone number se shuru karo', 'अपने फ़ोन नंबर से शुरू करें', 'Start with your phone number'],
  phone: ['Mobile number', 'मोबाइल नंबर', 'Mobile number'],
  send_code: ['Code bhejo', 'कोड भेजो', 'Send code'],
  enter_code: ['{phone} par aaya 6-digit code', '{phone} पर आया 6 अंकों का कोड', '6-digit code sent to {phone}'],
  verify: ['Aage badho', 'आगे बढ़ो', 'Continue'],
  change_number: ['Number badlo', 'नंबर बदलो', 'Change number'],
  demo_code: ['Demo code: {code}', 'डेमो कोड: {code}', 'Demo code: {code}'],
  try_demo: ['Demo dukaan kholo (Ramesh, Lucknow)', 'डेमो दुकान खोलो (रमेश, लखनऊ)', 'Open the demo stall (Ramesh, Lucknow)'],
  or: ['ya', 'या', 'or'],
  ob_step: ['Step {n} / 4', 'चरण {n} / 4', 'Step {n} of 4'],
  ob_lang_title: ['Kis bhasha mein baat karein?', 'किस भाषा में बात करें?', 'Which language?'],
  ob_business_title: ['Aapka dhanda', 'आपका धंधा', 'Your business'],
  ob_menu_title: ['Aap kya bechte ho?', 'आप क्या बेचते हो?', 'What do you sell?'],
  ob_menu_sub: ['Items chuno aur apna daam daalo. Recipe hum bhar dete hain.', 'आइटम चुनो और अपना दाम डालो। रेसिपी हम भर देते हैं।', 'Pick items and set your price. We fill in a typical recipe.'],
  ob_time_title: ['Dukaan kab band hoti hai?', 'दुकान कब बंद होती है?', 'When do you close?'],
  ob_time_sub: ['Is samay hum yaad dilayenge: aaj ki bikri bolo aur munafa dekho.', 'इस समय हम याद दिलाएँगे: आज की बिक्री बोलो और मुनाफ़ा देखो।', "We'll remind you then to log sales and see your profit."],
  next: ['Aage', 'आगे', 'Next'],
  back: ['Peeche', 'पीछे', 'Back'],
  finish: ['Shuru karo', 'शुरू करो', 'Start'],
  pick_one: ['Kam se kam ek item chuno', 'कम से कम एक आइटम चुनें', 'Pick at least one item'],
  serving: ['serving', 'सर्विंग', 'serving'],

  // metrics
  metrics_title: ['Pilot metrics', 'पायलट मेट्रिक्स', 'Pilot metrics'],
  metrics_sub: ['PRD ke success metrics, database ke sab vendors par. Demo mein cohort simulated hai.', 'PRD के सफलता मेट्रिक्स, डेटाबेस के सभी वेंडर पर। डेमो में कोहॉर्ट सिम्युलेटेड है।', "The PRD's success metrics across every vendor in the database. The demo cohort is simulated."],
  north_star: ['North Star', 'नॉर्थ स्टार', 'North Star'],
  wpav_def: ['Hafte mein 4+ din bikri aur kharcha bolne wale, jinhone profit card dekha', 'हफ़्ते में 4+ दिन बिक्री और खर्चा बोलने वाले, जिन्होंने प्रॉफ़िट कार्ड देखा', 'Vendors logging sales and costs on 4+ days this week who viewed their profit card'],
  of_vendors: ['{n} vendors mein se', '{n} वेंडर में से', 'of {n} vendors'],
  target: ['Target', 'लक्ष्य', 'Target'],
  on_track: ['On track', 'सही राह पर', 'On track'],
  below: ['Peeche', 'पीछे', 'Below target'],

  // generic
  loading: ['Load ho raha hai…', 'लोड हो रहा है…', 'Loading…'],
  retry: ['Phir se', 'फिर से', 'Retry'],
  error_generic: ['Kuch gadbad hui. Phir se koshish karo.', 'कुछ गड़बड़ हुई। फिर से कोशिश करें।', 'Something went wrong. Try again.'],
  today: ['Aaj', 'आज', 'Today'],
  all: ['Sab', 'सब', 'All'],
  yesterday: ['Kal', 'कल', 'Yesterday'],
};

const IDX = { hinglish: 0, hi: 1, en: 2 };

export function translate(lang, key, vars) {
  const row = D[key];
  let s = row ? row[IDX[lang] ?? 0] : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

export const LANGUAGES = [
  { key: 'hinglish', label: 'Hinglish', sample: 'Aaj ka munafa' },
  { key: 'hi', label: 'हिन्दी', sample: 'आज का मुनाफ़ा' },
  { key: 'en', label: 'English', sample: "Today's profit" },
];

// Speech recognition language per UI language.
export const speechLang = (lang) => (lang === 'en' ? 'en-IN' : 'hi-IN');

// Display name for an item key, with the Hindi name where it's familiar.
export function itemLabel(entry, lang, catalog) {
  if (!catalog || lang === 'en') return entry.item;
  const ing = catalog.ingredients?.find((i) => i.key === entry.itemKey);
  if (ing) return ing.hi;
  if (entry.itemKey === 'total_sales') return translate(lang, 'sales');
  return entry.item;
}
