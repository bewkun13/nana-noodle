# Nana Noodles Sushi Bar — website redesign (proposal)

A rebuilt front end for [nananoodlessushibar.com](https://www.nananoodlessushibar.com/), prepared as a
proposal for the restaurant. Static HTML/CSS/JS — no build step, no framework, no server code.

Open `index.html` directly, or serve the folder:

```bash
python -m http.server 5599
```

---

## What changed, and why

### 1. The menu is now on the website

The current site has no menu at all — every visitor who wants to know what is served gets bounced to
the SmileDining ordering site. That is the single biggest drop-off point.

`menu.html` renders all **235 dishes** from `assets/data/menu.json`:

- **Search across everything.** One box, matched against dish name, description and category. Typing
  `lobster` finds all 11 lobster dishes across three different menu sections at once — the ordering
  site cannot do this.
- **Four section tabs** (Lunch · Main Menu · Sushi & Japanese · Combo & Catering) plus a sticky
  category rail that tracks your position as you scroll.
- **Photos** on the 31 dishes the restaurant has shot, laid out so the 204 without photos still read
  cleanly instead of leaving holes.
- **"My list."** Tap `+` on any dish to build a list with running total, saved on the device. From
  the list drawer: *Order online* (hands off to SmileDining), *Copy list*, or *Call to order*.
- Keyboard `/` focuses search. Deep links work: `menu.html#cat-nanan-special-rolls` switches to the
  right tab and scrolls there.

### 2. Live open/closed status

Every page shows whether the kitchen is open **right now**, and if not, when it opens next
("Closed · Opens tomorrow at 11:30 AM"). Computed in the restaurant's own timezone
(`America/New_York`), so it is correct for a visitor anywhere. Hours come from the POS schedule and
live in one place — `HOURS` at the top of `assets/js/site.js`.

### 3. 43 MB of hero images became 1.1 MB

The current site ships three uncompressed PNGs — `H1.png` alone is **17.9 MB** at 7952×5304. They are
now 1920px progressive JPEG with WebP alongside. Everything else is likewise served WebP-first with a
JPEG fallback.

| | before | after |
|---|---|---|
| hero images | 43 MB | 1.1 MB |
| gallery | full-size only | thumbnails + full-size, lazy loaded |

### 4. Built for the phone

Most restaurant traffic is mobile. There is now a fixed bottom bar — **Call · Directions · Menu &
Order** — always one tap away, a real mobile nav, and a lightbox gallery with swipe-sized targets
and keyboard navigation.

### 5. Findable

`Restaurant` structured data (address, phone, hours, menu link) so Google can show hours and the
menu link directly in search results. Proper titles, descriptions, canonical URLs and Open Graph
tags on both pages. The old site had none of this.

---

## About the ordering site

`nananoodlessushibarfl.smiledining.com` is **SmilePOS/SmileDining**, a hosted third-party platform.
Its code cannot be modified from outside — only its content (photos, descriptions, hours) via the
SmilePOS admin panel.

So this proposal takes the practical route: browsing, searching and choosing all happen here, where
we control the experience; SmileDining is used only for the checkout step it owns. The handoff is a
single link, defined once as `ORDER_URL` in `assets/js/menu.js`.

---

## Layout

```
index.html            home — hero, story, favourites, gallery, hours, map
menu.html             the full menu
assets/
  css/style.css       design system, shared chrome
  css/menu.css        menu page
  js/site.js          hours logic, nav, hero slider, lightbox, reveal
  js/menu.js          menu rendering, search, my-list
  data/menu.json      235 dishes — the only file to touch when the menu changes
  img/hero            3 hero photos (from the current site)
  img/gallery         12 gallery photos (from the current site)
  img/food            31 dish photos (from the ordering site)
_source/              raw POS data the menu was built from, kept for reference
```

## Updating the menu

Edit `assets/data/menu.json`. The shape is:

```json
[{ "group": "Lunch",
   "cats": [{ "cat": "Thai Lunch", "note": "", "raw": false,
              "items": [{ "name": "L - Pad Thai", "price": 10.95,
                          "desc": "…", "img": "assets/img/food/l-pad-thai.jpg" }] }] }]
```

A leading `*` in a dish name marks it as containing raw or undercooked items and renders the red
asterisk. `raw: true` on a category is reserved for the same warning at category level. `img` may be
empty. If a `.webp` sits next to the `.jpg`, it is served automatically.

## Photography

All photos are the restaurant's own, taken from the current website and the ordering site, only
resized and recompressed — the look is deliberately continuous with what guests already recognise.

## Notes for handover

- No analytics, tracking or third-party scripts are loaded. Google Fonts is the only external
  request (Lato + Poppins, the same faces the current site uses).
- Prices and hours were captured on 22 August 2026. Verify before going live.
- The map is a plain Google Maps embed — no API key needed.
