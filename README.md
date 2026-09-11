# Stocked Beauty

Inventory, service-cost, and reorder tracking for independent beauty professionals.
This is a standalone export of the Claude artifact — a Vite + React app you can
run locally, build, and deploy anywhere.

## Run it locally

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`) in your browser.
Resize the window narrow, or open it on your phone, to see the mobile layout
with the bottom nav bar.

## Build for production

```bash
npm run build
```

This outputs a static site to `dist/`. You can preview the production build
locally with:

```bash
npm run preview
```

## Deploy

`dist/` is a plain static site (HTML/CSS/JS) — no server required. Two easy
options:

### Vercel
1. Push this folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Framework preset: **Vite**. Leave build settings as default (`npm run build`, output `dist`).
4. Deploy — you'll get a live `https://your-app.vercel.app` URL.

### Netlify
1. Push this folder to a GitHub repo (or drag-and-drop the `dist/` folder after
   running `npm run build` at [app.netlify.com/drop](https://app.netlify.com/drop)
   for an instant deploy with no git setup).
2. If connecting a repo: build command `npm run build`, publish directory `dist`.

Either way, once deployed you'll have a real URL you can open on any phone's
browser, share with testers, or add to a Home Screen.

## Testing on an iPhone

Once deployed (or while running `npm run dev` on the same Wi-Fi network as
your phone, using your computer's local IP instead of `localhost`), open the
URL in Safari on the iPhone. Tap **Share → Add to Home Screen** to give it an
app icon and launch it full-screen like a native app.

## Data storage — read this before you rely on it

This export swaps Claude's built-in `window.storage` for a small shim at
`src/lib/storage.js` that uses the browser's `localStorage`. That means:

- Data is saved **per browser, per device**. Nothing syncs across phone,
  laptop, etc.
- Clearing browser data / private browsing will wipe it.
- It's genuinely fine for trying the app out or demoing it, but **not**
  durable enough for a real business to depend on.

When you're ready for real usage, swap out `src/lib/storage.js` for a real
backend — the function signatures (`get`, `set`, `delete`, `list`) are exactly
what you'd wire up to something like Supabase, Firebase, or your own API.
Nothing else in `App.jsx` needs to change as long as the new implementation
keeps the same `async get(key)`, `set(key, value)`, `delete(key)`, `list(prefix)`
shape. Supabase (Postgres + Auth) maps closely to the data model already
described in the product spec (inventory_items, services, service_logs, etc.)
and is a natural next step for real accounts, multi-device sync, and auth.

## Project structure

```
├── index.html          Entry HTML
├── src/
│   ├── main.jsx         React root / mount point
│   ├── App.jsx           The entire application (all views, components, demo data)
│   ├── index.css         Minimal global reset
│   └── lib/
│       └── storage.js     localStorage persistence shim (see above)
├── package.json
└── vite.config.js
```

Everything else — onboarding, inventory, services, reorder, insights, demo
data — lives in `App.jsx` exactly as it did in the Claude artifact.
