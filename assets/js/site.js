/* ==========================================================================
   Nana Noodles Sushi Bar - shared site behaviour
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------- config */
  // Service hours as kept in the restaurant POS. 0 = Sunday.
  // Times are minutes from midnight, in the restaurant's own timezone.
  var TZ = "America/New_York";
  var HOURS = [
    { day: 0, label: "Sunday",    spans: [[720, 900], [960, 1260]] },
    { day: 1, label: "Monday",    spans: [[690, 900], [960, 1320]] },
    { day: 2, label: "Tuesday",   spans: [[690, 900], [960, 1320]] },
    { day: 3, label: "Wednesday", spans: [[690, 900], [960, 1320]] },
    { day: 4, label: "Thursday",  spans: [[690, 900], [960, 1320]] },
    { day: 5, label: "Friday",    spans: [[690, 900], [960, 1320]] },
    { day: 6, label: "Saturday",  spans: [[720, 900], [960, 1320]] }
  ];

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------ open status */
  function restaurantNow() {
    // Read "now" as the wall clock in the restaurant's timezone, so the badge
    // is correct for a visitor browsing from anywhere in the world.
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());
    var get = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var hour = parseInt(get("hour"), 10) % 24;
    return { day: days[get("weekday")], mins: hour * 60 + parseInt(get("minute"), 10) };
  }

  function fmt(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    var ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return h + (m ? ":" + (m < 10 ? "0" + m : m) : "") + " " + ap;
  }

  function spanText(day) {
    return day.spans.map(function (s) { return fmt(s[0]) + " - " + fmt(s[1]); }).join("  /  ");
  }

  function status() {
    var now = restaurantNow();
    var today = HOURS[now.day];

    for (var i = 0; i < today.spans.length; i++) {
      var s = today.spans[i];
      if (now.mins >= s[0] && now.mins < s[1]) {
        return { open: true, text: "Open now", detail: "Closes " + fmt(s[1]) };
      }
    }
    // Not open: find the next opening time, scanning today then forward.
    for (var d = 0; d < 8; d++) {
      var day = HOURS[(now.day + d) % 7];
      for (var j = 0; j < day.spans.length; j++) {
        var start = day.spans[j][0];
        if (d > 0 || start > now.mins) {
          var when = d === 0 ? "today" : d === 1 ? "tomorrow" : day.label;
          return { open: false, text: "Closed", detail: "Opens " + when + " at " + fmt(start) };
        }
      }
    }
    return { open: false, text: "Closed", detail: "" };
  }

  function paintStatus() {
    var st = status();
    $$("[data-status]").forEach(function (el) {
      el.classList.toggle("is-closed", !st.open);
      el.innerHTML = '<i class="dot"></i><span>' + st.text +
        (st.detail ? ' <span style="opacity:.7;font-weight:400">&middot; ' + st.detail + "</span>" : "") + "</span>";
    });
  }

  function paintHours() {
    var host = $("[data-hours]");
    if (!host) return;
    var today = restaurantNow().day;
    // Render Monday-first, the way people read a week.
    var order = [1, 2, 3, 4, 5, 6, 0];
    host.innerHTML = order.map(function (d) {
      var h = HOURS[d];
      return '<li class="' + (d === today ? "is-today" : "") + '">' +
             '<span class="d">' + h.label + (d === today ? " &middot; today" : "") + "</span>" +
             '<span class="t">' + spanText(h) + "</span></li>";
    }).join("");
  }

  /* ------------------------------------------------------------------- nav */
  function nav() {
    var bar = $(".nav");
    if (!bar) return;
    var burger = $(".burger", bar);

    var onScroll = function () { bar.classList.toggle("is-stuck", window.scrollY > 20); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (burger) {
      burger.addEventListener("click", function () {
        var open = bar.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", String(open));
      });
      $$(".nav__links a", bar).forEach(function (a) {
        a.addEventListener("click", function () {
          bar.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        });
      });
    }

    // Highlight the section currently in view.
    var links = $$('.nav__links a[href^="#"]');
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) {
      var sec = document.getElementById(a.getAttribute("href").slice(1));
      if (sec) map[sec.id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("is-active"); });
        if (map[e.target.id]) map[e.target.id].classList.add("is-active");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ---------------------------------------------------------------- slider */
  function hero() {
    var slides = $$(".hero__bg figure");
    var dots = $$(".hero__dots button");
    if (slides.length < 2) return;
    var i = 0, timer;

    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("is-on", k === i); });
      dots.forEach(function (d, k) { d.setAttribute("aria-current", String(k === i)); });
    }
    function play() { clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 6500); }

    dots.forEach(function (d, k) {
      d.addEventListener("click", function () { go(k); play(); });
    });
    go(0); play();
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) clearInterval(timer); else play();
    });
  }

  /* -------------------------------------------------------------- lightbox */
  function gallery() {
    var box = $(".lb");
    var triggers = $$(".gal button");
    if (!box || !triggers.length) return;

    var img = $(".lb img", box), count = $(".lb__count", box), at = 0, last = null;
    var srcs = triggers.map(function (b) { return b.dataset.full || $("img", b).src; });

    function show(n) {
      at = (n + srcs.length) % srcs.length;
      img.src = srcs[at];
      img.alt = triggers[at].querySelector("img").alt;
      count.textContent = (at + 1) + " / " + srcs.length;
    }
    function open(n) {
      last = document.activeElement;
      show(n);
      box.classList.add("is-open");
      document.body.style.overflow = "hidden";
      $(".lb__x", box).focus();
    }
    function close() {
      box.classList.remove("is-open");
      document.body.style.overflow = "";
      if (last) last.focus();
    }

    triggers.forEach(function (b, n) { b.addEventListener("click", function () { open(n); }); });
    $(".lb__x", box).addEventListener("click", close);
    $(".lb__nav--prev", box).addEventListener("click", function () { show(at - 1); });
    $(".lb__nav--next", box).addEventListener("click", function () { show(at + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(at - 1);
      if (e.key === "ArrowRight") show(at + 1);
    });
  }

  /* ---------------------------------------------------------------- reveal */
  function reveal() {
    var els = $$(".rv");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, n) {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = Math.min(n * 70, 280) + "ms";
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    els.forEach(function (e) { io.observe(e); });

    // Nothing should ever stay invisible because an observer misfired.
    setTimeout(function () { els.forEach(function (e) { e.classList.add("is-in"); }); }, 2500);
  }

  /* ------------------------------------------------------------------ boot */
  function boot() {
    paintStatus();
    paintHours();
    nav();
    hero();
    gallery();
    reveal();
    $$("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
    setInterval(paintStatus, 60000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.NANA = { status: status, HOURS: HOURS, fmt: fmt };
})();
