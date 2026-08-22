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
- **Tap any dish for the full story.** A dialog opens with the photograph at full size, the whole
  description, and *every choice the kitchen offers* — meat, spice level 0 to 5, rice substitution,
  sauces, extras, with the price of each. That data comes straight from the POS: 53 distinct option
  groups covering 155 of the 235 dishes. Neither the current website nor the ordering page shows any
  of it before you commit to an item.
- Keyboard `/` focuses search, Enter opens the dish under the cursor, Escape closes. Deep links work:
  `menu.html#cat-nanan-special-rolls` switches to the right tab and scrolls there.

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

### 4. Warm ink, not flat black

The first pass was near-black `#0c0d0b` end to end, and a flat black page reads cheap — there is
nothing for light to do. The palette is now a warm espresso ground (`#16130f`) where every dark
surface carries a little red and yellow, closer to lacquer and roasted wood than a switched-off
screen. On top of that:

- Fine **film grain** across the whole page, so large dark areas have a surface.
- Three soft **colour washes** — gold, green, chilli — fixed behind the page, so no two screens are
  the same flat tone.
- **Photographs behind sections.** Our Kitchen, Gallery and Visit each sit on a dish photo under a
  heavy gradient; so does the menu list.
- Cards and panels get a **lacquer edge** — a one-pixel warm highlight along the top.

### 5. Original ornament, no stock photography

Two thirds of the menu — **204 of the 235 dishes** — has no photograph, and the ordering site
leaves those as bare rows. Buying stock food photos would be worse than leaving them empty: a guest
who orders from a picture of someone else's dish and gets something different stops trusting the
whole page.

So the decoration is drawn for this site instead, as SVG:

- **Sixteen line glyphs**, one per menu category — a noodle bowl, nigiri, a maki cross-section, a
  hand roll cone, a sashimi plate, a curry pot, a wok, a bento box, a sushi boat, a drink. Every
  photo-less dish gets the glyph for its category, and the dish dialog shows it large behind a faded
  initial. The whole set is 5 KB, inlined once per page, and recolours with the palette.
- **Seigaiha** — the classic overlapping-wave ground — behind Our Kitchen, Visit, the CTA band and
  the menu list, at 5% opacity so it reads as texture rather than pattern.
- **Asanoha**, the hemp-leaf lattice, layered over it on the Visit section and the menu header.
- A **brush stroke** divider closing the story section.
- A quiet **corner arc** on each story card that widens on hover.

None of it is a raster image, so it costs 5 KB total and stays sharp on any display.

### 6. Motion tied to the scroll

Nothing here is decoration for its own sake — each effect tells you the page is responding to you.

- A thin progress bar across the top, so a long menu page has a sense of depth.
- Parallax on the hero, the CTA band and the menu header: the photo drifts slower than the text
  in front of it.
- Photographs **wipe open** as they scroll into view instead of just appearing.
- Section headlines rise a word at a time.
- Gallery tiles drift at three different rates, so the grid breathes as you scroll past it.
- Hero photos each pan a different way — zoom in, drift left, tilt out — over 26 seconds.
- Cards fade up, in, or scale depending on where they sit, so the page does not all move as a block.

All of it is driven by **one rAF-throttled scroll listener** and IntersectionObserver, so there is
at most one layout pass per frame. Every effect has a timeout fallback, so nothing can be left
invisible if an observer misfires. `prefers-reduced-motion: reduce` turns the whole system off.

### 7. Built for the phone

Most restaurant traffic is mobile. There is now a fixed bottom bar — **Call · Directions · Menu &
Order** — always one tap away, a real mobile nav, and a lightbox gallery with swipe-sized targets
and keyboard navigation.

### 8. Findable

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
  js/site.js          hours logic, nav, hero slider, lightbox, scroll motion
  js/menu.js          menu rendering, search, my-list
  data/menu.json      235 dishes + 53 option groups — the only file to touch
                      when the menu changes
  img/glyphs.svg      16 line glyphs, one per menu category
  img/hero            3 hero photos (from the current site)
  img/gallery         12 gallery photos (from the current site)
  img/food            31 dish photos in three sizes (from the ordering site)
                        name.jpg     480px  menu thumbnails
                        name-md.jpg  760px  cards and gallery tiles
                        name-lg.jpg 1100px  dish dialog, lightbox, backdrops
_source/              raw POS export the menu was built from — gitignored, see security note
```

## Updating the menu

Edit `assets/data/menu.json`. The shape is:

```json
{
  "sets": {
    "a1b2c3d4": { "n": "Meat", "req": true, "multi": false,
                  "c": [{ "n": "Chicken", "p": 1 }, { "n": "Beef", "p": 4 }] }
  },
  "menu": [{ "group": "Lunch",
     "cats": [{ "cat": "Thai Lunch", "note": "", "raw": false,
                "items": [{ "name": "L - Pad Thai", "price": 10.95, "desc": "…",
                            "img": "assets/img/food/l-pad-thai.jpg",
                            "opts": ["a1b2c3d4"] }] }] }]
}
```

`sets` holds every option group once and items reference them by id, which keeps the file at 47 KB
instead of triple that. `req` marks a group the guest must choose from, `multi` one they may pick
several of.

A leading `*` in a dish name marks it as containing raw or undercooked items — it renders the red
asterisk and adds the advisory to the dish dialog. `img` may be empty; the dialog then shows a
typographic plate with the dish's initial instead of an empty box. If a `.webp` sits next to a
`.jpg`, it is served automatically, and `-md`/`-lg` variants are picked up by filename.

## Photography

All photos are the restaurant's own, taken from the current website and the ordering site, only
resized and recompressed — the look is deliberately continuous with what guests already recognise.

The 31 dish photos are pulled at their **source resolution** (1109x1479) rather than the 720px
the ordering site serves, and kept in two sizes: `name.jpg` at 480px for the 74px menu thumbnails,
`name-lg.jpg` at 1100px wherever a photo is shown large.

The 12 original gallery photos are genuinely low resolution — between 574x431 and 1024x768, which
is all that exists. Rather than upscale them into mush, the gallery is now **20 photos**: the 12
originals at sizes where they stay sharp, plus 8 high-resolution dish shots. If the restaurant can
supply the original camera files, dropping them into `assets/img/gallery/` is the single biggest
visual upgrade left on the table.

The same goes for the 204 dishes with no photograph. They look deliberate now rather than unfinished,
but a real photo always beats a glyph — and the restaurant only needs to shoot the dishes people
order most, not all 204.

## Notes for handover

- No analytics, tracking or third-party scripts are loaded. Google Fonts is the only external
  request (Lato + Poppins, the same faces the current site uses).
- Prices and hours were captured on 22 August 2026. Verify before going live.
- The map is a plain Google Maps embed — no API key needed.
- No stock photography anywhere. Every photograph is the restaurant's own; every other graphic is
  SVG drawn for this site. Nothing here needs a licence or an attribution line.
- The phone number is not in the header. It is one tap away in the mobile action bar, and stated
  in full in the Visit section and the footer — a header that stays clean reads better on a phone.

## Security note for the restaurant

The public page source of `nananoodlessushibarfl.smiledining.com` embeds the shop's SmilePOS
configuration, including an email password and payment merchant IDs, in plain text where any
visitor can read it. That is on SmilePOS's side, not something this site can fix, but the owner
should raise it with them. Nothing from that export is committed to this repository.
