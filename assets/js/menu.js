/* ==========================================================================
   Menu page - render menu.json, search, group tabs, category rail,
   and a local "my list" the guest can carry to checkout or the phone.
   ========================================================================== */
(function () {
  "use strict";

  var ORDER_URL = "https://nananoodlessushibarfl.smiledining.com/";
  var TEL = "+15614506912";
  var STORE = "nana.list.v1";

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var money = function (n) { return "$" + n.toFixed(2); };
  var slug = function (s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };

  var DATA = [];      // menu groups
  var SETS = {};      // deduped option groups, keyed by id
  var INDEX = {};     // item id -> { item, cat, group } for the dialog
  var group = 0;
  var query = "";
  var list = load();

  /* ------------------------------------------------------------- storage */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch (e) { return []; }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(list)); } catch (e) { /* private mode */ }
  }

  /* ---------------------------------------------------------------- data */
  function matches(item, cat) {
    if (!query) return true;
    var hay = (item.name + " " + item.desc + " " + cat).toLowerCase();
    return query.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
  }

  // When searching, look across every group so nothing hides behind a tab.
  function visibleCats() {
    var src = query ? DATA : [DATA[group]];
    var out = [];
    src.forEach(function (g) {
      if (!g) return;
      g.cats.forEach(function (c) {
        var items = c.items.filter(function (it) { return matches(it, c.cat); });
        if (items.length) out.push({ cat: c.cat, note: c.note, raw: c.raw, group: g.group, items: items });
      });
    });
    return out;
  }

  /* -------------------------------------------------------------- render */
  function itemHTML(it, cat) {
    var id = slug(cat + "-" + it.name);
    var qty = qtyOf(id);
    var star = it.name.charAt(0) === "*";
    var name = star ? it.name.slice(1).trim() : it.name.trim();
    INDEX[id] = { it: it, cat: cat, name: name, star: star };

    return '<article class="item' + (it.img ? " has-img" : "") + '" data-open="' + esc(id) + '"' +
      ' tabindex="0" role="button" aria-label="' + esc(name) + ', ' + money(it.price) + ', see details">' +
      (it.img
        ? '<picture class="item__img"><source srcset="' + esc(it.img.replace(/\.jpg$/, ".webp")) + '" type="image/webp">' +
          '<img src="' + esc(it.img) + '" alt="' + esc(name) + '" loading="lazy" decoding="async">' +
          '<span class="item__zoom" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
          'stroke-width="2.4" stroke-linecap="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-8 8M3 21l8-8"/></svg></span>' +
          "</picture>"
        : "<span></span>") +
      '<div class="item__main">' +
        '<h3 class="item__name">' + (star ? '<span class="raw" title="Contains raw or undercooked items">*</span>' : "") +
          esc(name) + "</h3>" +
        (it.desc ? '<p class="item__desc">' + esc(it.desc) + "</p>" : "") +
      "</div>" +
      '<div class="item__side">' +
        '<span class="item__price">' + money(it.price) + "</span>" +
        '<button class="item__add' + (qty ? " is-in" : "") + '" type="button"' +
          ' data-add="' + esc(id) + '" data-name="' + esc(name) + '" data-price="' + it.price + '"' +
          ' aria-label="Add ' + esc(name) + ' to my list">' + (qty ? qty : "+") + "</button>" +
      "</div>" +
    "</article>";
  }

  function render() {
    var cats = visibleCats();
    var body = $("[data-menu]");
    var rail = $("[data-rail]");

    if (!cats.length) {
      body.innerHTML = '<div class="empty"><strong>No dishes match &ldquo;' + esc(query) + '&rdquo;</strong>' +
        "Try a shorter word, or browse the categories above.</div>";
      rail.innerHTML = "";
      return;
    }

    body.innerHTML = cats.map(function (c) {
      var shot = catShot(c);
      return '<section class="cat" id="cat-' + slug(c.cat) + '">' +
        '<div class="cat__head">' +
        (shot ? '<div class="cat__shot" aria-hidden="true">' +
                '<picture><source srcset="' + esc(shot.replace(/\.jpg$/, ".webp")) + '" type="image/webp">' +
                '<img src="' + esc(shot) + '" alt="" loading="lazy"></picture></div>' : "") +
        '<h2>' + esc(c.cat) +
          "<span>" + c.items.length + " item" + (c.items.length === 1 ? "" : "s") +
          (query ? " &middot; " + esc(c.group) : "") + "</span></h2>" +
          (c.note ? '<p class="cat__note">' + esc(c.note) + "</p>" : "") +
        '<div style="clear:both"></div></div>' +
        '<div class="items">' + c.items.map(function (it) { return itemHTML(it, c.cat); }).join("") + "</div>" +
      "</section>";
    }).join("");

    rail.innerHTML = cats.map(function (c) {
      return '<a href="#cat-' + slug(c.cat) + '">' + esc(c.cat) + "</a>";
    }).join("");

    spy();
  }

  /* --------------------------------------------------------- dish dialog */
  // The first photo in a category doubles as that category's thumbnail.
  function catShot(c) {
    for (var i = 0; i < c.items.length; i++) {
      if (c.items[i].img) return c.items[i].img;
    }
    return "";
  }

  function optsHTML(ids) {
    if (!ids || !ids.length) return "";
    var blocks = ids.map(function (id) {
      var o = SETS[id];
      if (!o || !o.c.length) return "";
      return '<div class="opt"><h4>' + esc(o.n) +
        (o.req ? ' <em class="req">choose one</em>' : ' <em>' + (o.multi ? "add any" : "optional") + "</em>") +
        "</h4><ul>" + o.c.map(function (c) {
          return "<li>" + esc(c.n) + (c.p ? " <b>+" + money(c.p) + "</b>" : "") + "</li>";
        }).join("") + "</ul></div>";
    }).join("");
    return blocks ? '<div class="opts">' + blocks + "</div>" : "";
  }

  var dlgLast = null;

  // "L - Fried Rice" is a lunch-menu prefix, not the dish. Mark it with the F.
  function initial(name) {
    return name.replace(/^[A-Z]\s*[-–]\s*/, "").charAt(0).toUpperCase() || name.charAt(0);
  }

  function openDish(id) {
    var rec = INDEX[id];
    if (!rec) return;
    var it = rec.it, dlg = $("[data-dish]");
    var big = it.img ? it.img.replace(/\.jpg$/, "-lg.jpg") : "";

    $("[data-dish-media]").className = "dish-dialog__media" + (big ? "" : " is-blank");
    $("[data-dish-media]").innerHTML = big
      ? '<picture><source srcset="' + esc(big.replace(/\.jpg$/, ".webp")) + '" type="image/webp">' +
        '<img src="' + esc(big) + '" alt="' + esc(rec.name) + '"></picture>'
      : '<span class="dish-dialog__mark">' + esc(initial(rec.name)) + "</span>";

    $("[data-dish-cat]").textContent = rec.cat;
    $("[data-dish-name]").innerHTML =
      (rec.star ? '<span class="raw" title="Contains raw or undercooked items">*</span>' : "") + esc(rec.name);
    $("[data-dish-price]").textContent = money(it.price);
    $("[data-dish-desc]").innerHTML = it.desc ? esc(it.desc) : "";
    $("[data-dish-desc]").style.display = it.desc ? "" : "none";

    var note = $("[data-dish-note]");
    note.textContent = rec.star
      ? "Contains raw or undercooked items. Consuming these may increase your risk of foodborne illness."
      : "";
    note.style.display = rec.star ? "" : "none";

    $("[data-dish-opts]").innerHTML = optsHTML(it.opts);

    var add = $("[data-dish-add]");
    add.dataset.add = id;
    add.dataset.name = rec.name;
    add.dataset.price = it.price;
    add.textContent = qtyOf(id) ? "In my list (" + qtyOf(id) + ") — add another" : "Add to my list";

    dlgLast = document.activeElement;
    dlg.classList.add("is-open");
    document.body.style.overflow = "hidden";
    $(".dish-dialog__x", dlg).focus();
  }

  function closeDish() {
    var dlg = $("[data-dish]");
    if (!dlg.classList.contains("is-open")) return;
    dlg.classList.remove("is-open");
    document.body.style.overflow = "";
    if (dlgLast) dlgLast.focus();
  }

  /* ------------------------------------------------------- category rail */
  var spyIO = null;
  function spy() {
    if (spyIO) spyIO.disconnect();
    if (!("IntersectionObserver" in window)) return;
    var links = $$("[data-rail] a");
    spyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = "#cat-" + e.target.id.replace(/^cat-/, "");
        links.forEach(function (a) {
          var on = a.getAttribute("href") === id;
          a.classList.toggle("is-active", on);
          if (on && a.scrollIntoView) {
            a.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
          }
        });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    $$(".cat").forEach(function (s) { spyIO.observe(s); });
  }

  /* ------------------------------------------------------------- my list */
  function qtyOf(id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].qty;
    return 0;
  }
  function bump(id, name, price, by) {
    var row = null;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) row = list[i];
    if (!row) {
      if (by < 0) return;
      row = { id: id, name: name, price: price, qty: 0 };
      list.push(row);
    }
    row.qty += by;
    if (row.qty <= 0) list = list.filter(function (r) { return r.id !== id; });
    save();
    paintList();
    syncButtons();
  }

  function total() {
    return list.reduce(function (a, r) { return a + r.price * r.qty; }, 0);
  }
  function count() {
    return list.reduce(function (a, r) { return a + r.qty; }, 0);
  }

  function syncButtons() {
    $$("[data-add]").forEach(function (b) {
      var q = qtyOf(b.dataset.add);
      b.textContent = q ? q : "+";
      b.classList.toggle("is-in", !!q);
    });
  }

  function paintList() {
    var n = count();
    var btn = $("[data-listbtn]");
    btn.classList.toggle("is-on", n > 0);
    $("[data-listcount]").textContent = n;

    $("[data-listbody]").innerHTML = list.length
      ? list.map(function (r) {
          return '<div class="lrow">' +
            '<div><div class="lrow__n">' + esc(r.name) + "</div>" +
            '<div class="lrow__p">' + money(r.price) + " each</div></div>" +
            '<div class="lrow__q">' +
              '<button type="button" data-step="-1" data-id="' + esc(r.id) + '" aria-label="Remove one ' + esc(r.name) + '">&minus;</button>' +
              "<b>" + r.qty + "</b>" +
              '<button type="button" data-step="1" data-id="' + esc(r.id) + '" aria-label="Add one ' + esc(r.name) + '">+</button>' +
            "</div></div>";
        }).join("")
      : '<p class="drawer__hint" style="padding:2rem 0">Nothing here yet. Tap <b>+</b> on any dish to start a list.</p>';

    $("[data-listtotal]").textContent = money(total());
  }

  function listText() {
    return "Order from Nana Noodles Sushi Bar:\n" +
      list.map(function (r) { return r.qty + " x " + r.name + "  " + money(r.price * r.qty); }).join("\n") +
      "\nEstimated total: " + money(total()) + " (before tax)";
  }

  /* --------------------------------------------------------------- drawer */
  function drawer(open) {
    var d = $("[data-drawer]");
    d.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) $(".drawer__x", d).focus();
  }

  // Anchor jumps have to clear both the header and the sticky control bar,
  // whose height changes with the viewport.
  function measureBar() {
    var bar = $(".mbar");
    if (bar) document.documentElement.style.setProperty("--bar-h", bar.offsetHeight + "px");
  }

  /* ----------------------------------------------------------------- wire */
  function wire() {
    measureBar();
    window.addEventListener("resize", measureBar);
    if (window.ResizeObserver) new ResizeObserver(measureBar).observe($(".mbar"));
    // Webfonts land after first paint and change the bar's height.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureBar);

    var input = $("[data-search]");
    var clear = $("[data-clear]");
    var t;
    input.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        query = input.value.trim().toLowerCase();
        clear.classList.toggle("is-on", !!query);
        render();
      }, 140);
    });
    clear.addEventListener("click", function () {
      input.value = ""; query = ""; clear.classList.remove("is-on"); render(); input.focus();
    });

    $$("[data-group]").forEach(function (b, i) {
      b.addEventListener("click", function () {
        group = i;
        $$("[data-group]").forEach(function (x, k) { x.setAttribute("aria-selected", String(k === i)); });
        if (query) { query = ""; input.value = ""; clear.classList.remove("is-on"); }
        render();
        window.scrollTo({ top: $(".mbar").offsetTop - 10, behavior: "smooth" });
      });
    });

    document.addEventListener("click", function (e) {
      var add = e.target.closest("[data-add]");
      if (add) {
        e.stopPropagation();
        bump(add.dataset.add, add.dataset.name, parseFloat(add.dataset.price), 1);
        if (add.hasAttribute("data-dish-add")) {
          add.textContent = "In my list (" + qtyOf(add.dataset.add) + ") — add another";
        }
        return;
      }

      if (e.target.closest("[data-dish] .dish-dialog__veil") || e.target.closest("[data-dish-close]")) {
        closeDish(); return;
      }

      var open = e.target.closest("[data-open]");
      if (open) { openDish(open.dataset.open); return; }

      var step = e.target.closest("[data-step]");
      if (step) {
        var row = list.filter(function (r) { return r.id === step.dataset.id; })[0];
        if (row) bump(row.id, row.name, row.price, parseInt(step.dataset.step, 10));
        return;
      }

      if (e.target.closest("[data-listbtn]")) drawer(true);
      if (e.target.closest("[data-close]") || e.target.matches(".drawer__veil")) drawer(false);
    });

    document.addEventListener("keydown", function (e) {
      var card = e.target.closest && e.target.closest("[data-open]");
      if (card && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault(); openDish(card.dataset.open); return;
      }
      if (e.key === "Escape") { closeDish(); drawer(false); }
      // "/" focuses search, the way people expect on a long list.
      if (e.key === "/" && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    });

    $("[data-copy]").addEventListener("click", function () {
      var btn = this;
      var done = function () {
        var was = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = was; }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(listText()).then(done, done);
      else done();
    });

    $("[data-callorder]").href = "tel:" + TEL;
    $$("[data-order]").forEach(function (a) { a.href = ORDER_URL; });
  }

  // A link may arrive as menu.html#cat-nanan-special-rolls, pointing at a
  // category that lives in a tab we are not showing. Switch to its tab first,
  // then scroll — the menu renders after fetch, so the browser cannot do this.
  function openHash() {
    var want = location.hash.replace(/^#cat-/, "");
    if (!want || want === location.hash) return;
    for (var i = 0; i < DATA.length; i++) {
      var hit = DATA[i].cats.some(function (c) { return slug(c.cat) === want; });
      if (!hit) continue;
      if (i !== group) {
        group = i;
        $$("[data-group]").forEach(function (x, k) { x.setAttribute("aria-selected", String(k === i)); });
        render();
      }
      var el = document.getElementById("cat-" + want);
      if (el) setTimeout(function () { el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 0);
      return;
    }
  }

  /* ------------------------------------------------------------------ boot */
  fetch("assets/data/menu.json")
    .then(function (r) { return r.json(); })
    .then(function (json) {
      DATA = json.menu || json;
      SETS = json.sets || {};
      $("[data-tabs]").innerHTML = DATA.map(function (g, i) {
        return '<button type="button" role="tab" data-group aria-selected="' + (i === 0) + '">' +
               esc(g.group) + "</button>";
      }).join("");
      wire();
      render();
      paintList();
      openHash();
      window.addEventListener("hashchange", openHash);
    })
    .catch(function () {
      $("[data-menu]").innerHTML =
        '<div class="empty"><strong>The menu could not load</strong>' +
        'Please <a href="' + ORDER_URL + '" style="color:var(--green)">view it on our ordering site</a> ' +
        'or call <a href="tel:' + TEL + '" style="color:var(--green)">(561) 450-6912</a>.</div>';
    });
})();
