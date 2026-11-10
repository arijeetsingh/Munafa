# Munafa: AI profit coach for street vendors

A working prototype of the Product Space Cohort 31 capstone. A vendor speaks a purchase or sale in Hindi, Hinglish or English. Munafa turns it into a bookkeeping entry and shows today's profit, the costliest ingredients, cost per plate and one money-saving tip.

Built with the MERN stack: **MongoDB, Express, React (Vite, installable PWA), Node.js**.

## Run it

Needs Node.js 20 or later. MongoDB is optional, because an embedded database starts automatically.

```bash
npm install
npm run dev
```

Open http://localhost:5173 and click **Demo dukaan kholo**. That opens Ramesh's chaat stall in Lucknow, with three weeks of history.

On the first run the API downloads a MongoDB binary (about 66 MB), then saves data to `server/.data/`. To use your own database, copy `.env.example` to `.env` and set `MONGO_URI`.

| Command | What it does |
| --- | --- |
| `npm run dev` | API on :4000 and web app on :5173, with hot reload |
| `npm run seed` | Wipes the database and reloads the demo data |
| `npm test` | 14 tests: parser, profit maths, and the full API flow |
| `npm run parser:eval` | Parser accuracy on the 100-phrase test set |
| `npm run build && npm start` | Production: one server on :4000 serves the app and the API |

Voice input uses the browser's Web Speech API. It works in Chrome and Edge on `localhost` or HTTPS. In other browsers, type into the box under the mic.

## Demo script (about 3 minutes)

1. **Login.** Click *Demo dukaan kholo*. Point out the language switch (Hinglish, हिन्दी, English).
2. **Home.** The profit card shows a loss of about ₹1,300, because only the morning mandi purchases are logged and there are no sales yet. The tip of the day is the oil price alert: "Tel ka rate area se 16% zyada hai".
3. **Speak.** Tap **Bolo** and say *"aaj 30 plate tikki aur 40 plate pani puri becha"*, or type it.
4. **Confirm.** Two sale cards appear. The amount was worked out from the menu price, so it's highlighted with *check karo*. Tap **Sab save karo**. The profit card turns positive straight away.
5. **Hisaab.** Show the profit, the top three costs and the shareable WhatsApp summary. Enter the cash you counted to see whether the numbers match.
6. **Samjho.** Show the price alerts, the 7-day profit trend, the best and slowest item, and cost per plate (click a dish to see its ingredient breakdown).
7. **Pilot metrics.** The North Star (Weekly Profit-Aware Vendors) and the PRD's targets, computed from the simulated 24-vendor cohort.

To show signup instead, use any 10-digit number starting 6 to 9. In development the one-time code appears on screen.

## Deploy to Vercel

Vercel serves the React build as static files and runs the Express API as one serverless function (`api/index.js`, routed by `vercel.json`). Serverless functions can't run the embedded database, so use **MongoDB Atlas** (the free M0 tier is enough).

1. **Atlas.** Create a free cluster and a database user. Under *Network Access* allow `0.0.0.0/0`, because Vercel's IP addresses change. Copy the connection string and add a database name, for example `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/munafa`.
2. **Seed Atlas** from your laptop: `MONGO_URI="<connection string>" npm run seed`
3. **Push to GitHub**, then on vercel.com choose *Add New → Project*, import the repo and keep the root directory as `./`. Or run `npx vercel` from the project folder.
4. **Environment variables** (Project → Settings → Environment Variables):

   | Name | Value |
   | --- | --- |
   | `MONGO_URI` | your Atlas connection string |
   | `JWT_SECRET` | a long random string (`openssl rand -hex 32`) |
   | `DEMO_OTP` | `true` to show the demo-stall button and on-screen login codes |
   | `MONGOMS_DISABLE_POSTINSTALL` | `1` (skips a 66 MB download the cloud build doesn't need) |
   | `ANTHROPIC_API_KEY` | optional |

5. **Deploy.** Then open `https://<project>.vercel.app/api/health`; it should return `{"ok":true,…}`.

The demo data is dated relative to the day you seed it. Run step 2 again on the morning of your presentation so "today" has Ramesh's morning purchases. `DEMO_OTP=true` shows login codes on screen, so anyone with the link can sign in. That's fine for a capstone demo but not for real vendors.

## How the PRD maps to the code

| PRD | Where |
| --- | --- |
| F1 Voice/text logging in Hinglish | `client/src/components/Capture.jsx`, `client/src/lib/speech.js` (hi-IN / en-IN) |
| F2 AI parser: item, qty, unit, amount, type | `server/src/services/parser.js` (rules), `server/src/services/llm.js` (Claude, optional) |
| F2 85%+ on a 100-phrase test set | `server/test/phrases.js`, `npm run parser:eval` |
| Confirm card, low-confidence fields highlighted | `client/src/components/ConfirmSheet.jsx` |
| F3 Daily profit card + top 3 costs, updates on save | `server/src/services/insights.js` → `GET /api/dashboard` |
| F3 Works offline, syncs later | `client/src/lib/api.js` (queue with de-duplicating `clientId`), `client/public/sw.js`. The parser also runs on the phone when offline. |
| F4 Closing-time reminder + WhatsApp summary + one tip | `client/src/components/Layout.jsx`, `client/src/pages/Today.jsx` |
| F5 Cost and margin per plate, recipe templates | `server/src/data/catalog.js` (13 dishes), `costPerPlate()` |
| F6 Alert only when 10%+ above the median of 5+ data points | `priceAlerts()`, `server/src/data/benchmarks.js` |
| F7 Weekly insights (best item, trend) | `weekly()`, `trend()`, `client/src/pages/Insights.jsx` |
| Guardrail: profit mismatch with counted cash | Cash check on the Hisaab screen |
| Success metrics + North Star | `GET /api/metrics`, `client/src/pages/Metrics.jsx` |
| UX: 16px+ text, ₹ with Indian digit grouping, icons beside labels, Hindi/Hinglish copy | `client/src/styles.css`, `client/src/lib/format.js`, `client/src/lib/i18n.js` |

**"The LLM parses; code does the maths."** The model only turns speech into a JSON entry, and the vendor confirms every entry before it's saved. Profit, cost per plate, alerts and tips are all computed in plain code in `insights.js`.

## Architecture

```
React PWA (Vite)  ──/api──▶  Express API  ──▶  MongoDB (Mongoose)
  mic, confirm, cards         auth (phone OTP, JWT)     vendors, menuitems, entries,
  offline queue               parse → rules or Claude    benchmarks, dailysummaries
                              insights engine (code)
```

Data model (`server/src/models/index.js`): `Vendor`, `MenuItem` (with recipe), `Entry` (type, item, qty, unit, amount, IST date, source, parser, confidence, edited), `Benchmark` (item, area, median, sample size), `DailySummary` (cash counted, viewed, shared), `Otp`.

### Optional: Claude for parsing

Set `ANTHROPIC_API_KEY` in `.env` and Claude (`claude-opus-5-5` by default; change it with `CLAUDE_MODEL`) parses speech into a strict JSON schema. The request opts into the API's server-side refusal fallback. If the call fails for any reason, the built-in parser takes over, so the app never depends on the API.

## Honest limits of this prototype

- **Stack.** The PRD lists Next.js + Supabase. This build uses MERN as requested. The architecture is otherwise the same.
- **SMS.** OTP codes are shown on screen in development. Sending SMS needs a provider such as MSG91 or Twilio; the hook is in `server/src/routes/auth.js`.
- **Benchmarks** are a seeded, illustrative table (the PRD's MVP choice), not live mandi rates. Replace them with Agmarknet data.
- **Parser accuracy.** 100/100 is on a test set written alongside the parser. Expect lower accuracy on real vendors' speech, so collect real phrases in the pilot and add them to `phrases.js`.
- **Pilot metrics** come from a simulated cohort created by `npm run seed`.
- **Reminders** fire while the app is open (in-app banner plus a browser notification). Push notifications when the app is closed would need a push service.
