(function () {
  "use strict";

  /* ================= helpers ================= */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var slugify = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var num = function (v, d) { v = Number(v); return isFinite(v) ? v : d; };
  var hashStr = function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  function rngFrom(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ICONS = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>'
  };

  /* Stand-in desk drawn to match the Figma render's proportions, used until a desk animation is uploaded. */
  var PLACEHOLDER_SCENE =
    '<svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
    '<defs><linearGradient id="dk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d8a86"/><stop offset="1" stop-color="#5c5a57"/></linearGradient>' +
    '<linearGradient id="tw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9b7b3"/><stop offset="1" stop-color="#77746f"/></linearGradient>' +
    '<radialGradient id="sc" cx="0.45" cy="0.4" r="0.8"><stop offset="0" stop-color="#1d2a33"/><stop offset="1" stop-color="#07090b"/></radialGradient>' +
    '<radialGradient id="lt" cx="0.5" cy="0.1" r="0.6"><stop offset="0" stop-color="#fff" stop-opacity="0.10"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
    '<ellipse cx="500" cy="700" rx="470" ry="80" fill="url(#lt)"/>' +
    '<polygon points="110,678 890,678 935,722 65,722" fill="url(#dk)"/>' +
    '<rect x="65" y="722" width="870" height="24" fill="#2b2a28"/>' +
    '<rect x="151" y="508" width="68" height="199" fill="url(#tw)"/>' +
    '<rect x="203" y="508" width="16" height="199" fill="#4d4b48"/>' +
    '<rect x="472" y="697" width="343" height="33" fill="#0d0d0d"/>' +
    '<ellipse cx="623" cy="705" rx="17" ry="8" fill="#d8d6d2"/>' +
    '<rect x="286" y="688" width="158" height="22" rx="3" fill="#cfcdc9"/>' +
    '<rect x="286" y="707" width="158" height="6" rx="2" fill="#8b8985"/>' +
    '<rect x="486" y="661" width="28" height="22" fill="#1b1b1b"/>' +
    '<rect x="440" y="680" width="120" height="6" rx="2" fill="#202020"/>' +
    '<rect x="299" y="436" width="403" height="229" fill="#1a1a1a"/>' +
    '<rect x="303" y="440" width="395" height="221" fill="url(#sc)"/>' +
    "</svg>";

  var DEFAULT_COLLAGE = {
    base_size: 0.62, falloff: 0.9, falloff_curve: 1.4, min_scale: 0.28, relevance_weight: 0.75,
    randomness: 0.35, gap: 22, spread: 0.85, float: 1, cursor: 1, hover_scale: 1.06, mobile_scale: 1.5, seed: 7, reshuffle: false
  };
  var DEFAULT_SCENE = {
    animation: "", duration_ms: 2500, screen_image: "", width_desktop: 100, width_mobile: 170,
    monitor_left: 30.3, monitor_top: 44.0, monitor_width: 39.5, monitor_height: 22.1,
    clear_areas: [
      { left: 6.5, top: 66, width: 87, height: 9 },
      { left: 14.5, top: 50, width: 8.5, height: 18 }
    ]
  };
  var PLACEHOLDER_ASPECTS = [16 / 9, 4 / 3, 1, 3 / 4, 4 / 5, 21 / 9, 2 / 3, 3 / 2];

  /* ================= content ================= */
  function load(name) {
    if (window.__CONTENT__ && window.__CONTENT__[name]) return Promise.resolve(window.__CONTENT__[name]);
    return fetch("content/" + name + ".json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("Could not load content/" + name + ".json");
      return r.json();
    });
  }

  Promise.all([load("site"), load("projects"), load("experience")])
    .then(function (d) { start(d[0] || {}, (d[1] && d[1].projects) || [], (d[2] && d[2].entries) || []); })
    .catch(function (e) {
      document.body.insertAdjacentHTML("afterbegin",
        '<p style="padding:8rem 1.5rem 0">The site content could not load. If you opened this file directly, run a local server instead (see README). ' + esc(e.message) + "</p>");
    });

  function start(site, projects, entries) {
    var scene = Object.assign({}, DEFAULT_SCENE, site.scene || {});
    var opts = Object.assign({}, DEFAULT_COLLAGE, site.collage || {});
    var domain = site.domain || "riday.space";

    projects.forEach(function (p) {
      p.slug = p.slug || slugify(p.title);
      p.relevance = clamp(num(p.relevance, 5), 1, 10);
    });

    /* ---------- text, nav, about, contact ---------- */
    document.title = domain;
    $("#nav-logo").textContent = domain;
    $("#foot-domain").textContent = domain;
    $("#foot-year").textContent = "© " + new Date().getFullYear() + " " + (site.name || "");

    var socials = [];
    if (site.instagram) socials.push({ k: "instagram", href: "https://instagram.com/" + encodeURIComponent(String(site.instagram).replace(/^@/, "")), label: "Instagram" });
    if (site.linkedin) socials.push({ k: "linkedin", href: site.linkedin, label: "LinkedIn" });
    if (site.email) socials.push({ k: "mail", href: "mailto:" + site.email, label: "Email" });
    var socialHTML = socials.map(function (s) {
      return '<a href="' + esc(s.href) + '" aria-label="' + s.label + '"' + (s.k === "mail" ? "" : ' rel="noopener" target="_blank"') + ">" + ICONS[s.k] + "</a>";
    }).join("");
    $("#nav-social").innerHTML = socialHTML;
    $("#contact-social").innerHTML = socialHTML;

    var photo = $("#intro-photo");
    if (site.photo) photo.innerHTML = '<img src="' + esc(site.photo) + '" alt="' + esc(site.name || "") + '">';
    else photo.textContent = String(site.name || "R").charAt(0);
    $("#intro-text").textContent = site.intro || "";

    $("#about-lead").textContent = site.about || "";
    $("#ops-intro").textContent = site.operations_intro || "";
    $("#roles").innerHTML = entries.filter(function (e) { return e.group === "design"; }).map(function (e) {
      return "<li><strong>" + esc(e.org) + "</strong><span>" + esc(e.role) + "</span><span>" + esc(e.dates) + "</span></li>";
    }).join("");
    $("#ops-list").innerHTML = entries.filter(function (e) { return e.group === "operations"; }).map(function (e) {
      var meta = [e.place, e.dates, e.tag].filter(Boolean).map(esc).join(", ");
      return '<article class="op"><div><h4>' + esc(e.org) + '</h4><p class="op-role">' + esc(e.role) +
        '</p><p class="op-meta">' + meta + "</p></div><ul>" +
        (e.points || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></article>";
    }).join("");

    var mail = $("#contact-mail");
    mail.href = "mailto:" + (site.email || "");
    mail.textContent = site.email || "";
    $("#contact-meta").textContent = site.location || "";

    /* active nav link */
    var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
    function setActive(id) { navLinks.forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("data-section") === id ? "true" : "false"); }); }
    setActive("work");
    if ("IntersectionObserver" in window) {
      var seen = {};
      var io = new IntersectionObserver(function (list) {
        list.forEach(function (en) { seen[en.target.id] = en.intersectionRatio; });
        var best = "work", bestR = -1;
        ["work", "about", "contact"].forEach(function (id) { if ((seen[id] || 0) > bestR) { bestR = seen[id] || 0; best = id; } });
        setActive(best);
      }, { threshold: [0, 0.15, 0.3, 0.5, 0.7, 1] });
      ["work", "about", "contact"].forEach(function (id) { io.observe(document.getElementById(id)); });
    }

    /* ================= stage: scene + collage ================= */
    var stage = $("#work");
    var intro = $("#intro");
    var sceneEl = $("#scene");
    var sceneArt = $("#scene-art");
    var screenEl = $("#scene-screen");
    var collageEl = $("#collage");
    var sceneAspect = 1;
    var revealed = false;
    var geom = null;
    var tiles = [];

    /* image sizes: real images use their natural aspect ratio, placeholders get a varied one */
    function measure(src) {
      return new Promise(function (res) {
        if (!src) return res(0);
        var im = new Image();
        var done = false;
        var finish = function (v) { if (!done) { done = true; res(v); } };
        im.onload = function () { finish(im.naturalWidth && im.naturalHeight ? im.naturalWidth / im.naturalHeight : 0); };
        im.onerror = function () { finish(0); };
        setTimeout(function () { finish(0); }, 6000);
        im.src = src;
      });
    }

    var items = projects.map(function (p) {
      return { p: p, aspect: PLACEHOLDER_ASPECTS[hashStr(p.title) % PLACEHOLDER_ASPECTS.length], real: false };
    });

    var sceneReady;
    if (scene.animation) {
      sceneArt.innerHTML = '<img alt="" decoding="async">';
      var sImg = sceneArt.firstChild;
      sceneReady = new Promise(function (res) {
        sImg.onload = function () {
          if (sImg.naturalWidth) sceneAspect = sImg.naturalHeight / sImg.naturalWidth;
          res(num(scene.duration_ms, 2500));
        };
        sImg.onerror = function () { res(0); };
      });
      sImg.src = scene.animation;
    } else {
      sceneEl.classList.add("is-placeholder");
      sceneArt.innerHTML = PLACEHOLDER_SCENE;
      sceneReady = Promise.resolve(1100);
    }
    if (scene.screen_image) screenEl.innerHTML = '<img src="' + esc(scene.screen_image) + '" alt="">';

    function computeGeom() {
      var W = stage.clientWidth;
      var H = window.innerHeight;
      var mobile = W < 700;
      var sw = W * num(mobile ? scene.width_mobile : scene.width_desktop, 100) / 100;
      var sh = sw * sceneAspect;
      var ml = num(scene.monitor_left, 30.3) / 100, mt = num(scene.monitor_top, 44) / 100;
      var mw = num(scene.monitor_width, 39.5) / 100, mh = num(scene.monitor_height, 22.1) / 100;
      var mon = { w: sw * mw, h: sh * mh };
      var introBottom = intro.offsetTop + intro.offsetHeight;
      var gapTop = clamp(W * 0.027, 18, 52);
      mon.x = W / 2 - mon.w / 2;
      mon.y = introBottom + gapTop;
      var sx = W / 2 - sw * (ml + mw / 2);
      var sy = mon.y - sh * mt;
      var navH = document.getElementById("nav").offsetHeight;
      var introRect = { x: intro.offsetLeft, y: intro.offsetTop + navH * 0.6, w: intro.offsetWidth, h: introBottom - intro.offsetTop - navH * 0.6 };
      var ph = intro.querySelector(".intro-photo"), tx = intro.querySelector(".intro-text");
      if (ph && tx) {
        var l = Math.min(ph.offsetLeft, tx.offsetLeft), r = Math.max(ph.offsetLeft + ph.offsetWidth, tx.offsetLeft + tx.offsetWidth);
        var t = Math.min(ph.offsetTop, tx.offsetTop), b = Math.max(ph.offsetTop + ph.offsetHeight, tx.offsetTop + tx.offsetHeight);
        introRect = { x: intro.offsetLeft + l, y: intro.offsetTop + t, w: r - l, h: b - t };
      }
      var clear = (Array.isArray(scene.clear_areas) ? scene.clear_areas : []).map(function (c) {
        return { x: sx + sw * num(c.left, 0) / 100, y: sy + sh * num(c.top, 0) / 100, w: sw * num(c.width, 0) / 100, h: sh * num(c.height, 0) / 100 };
      }).filter(function (c) { return c.w > 0 && c.h > 0; });
      return { W: W, H: H, navH: navH, mobile: mobile, mon: mon, scene: { x: sx, y: sy, w: sw, h: sh }, intro: introRect, clear: clear };
    }

    function placeScene(g) {
      sceneEl.style.left = g.scene.x + "px";
      sceneEl.style.top = g.scene.y + "px";
      sceneEl.style.width = g.scene.w + "px";
      sceneEl.style.height = g.scene.h + "px";
      var s = g.scene;
      screenEl.style.left = (g.mon.x - s.x) + "px";
      screenEl.style.top = (g.mon.y - s.y) + "px";
      screenEl.style.width = g.mon.w + "px";
      screenEl.style.height = g.mon.h + "px";
    }

    /* ---------- the collage layout ----------
       Projects are placed most-relevant first. Each one takes the closest free spot to the monitor,
       searching outward along ellipses stretched to the screen shape (wide screens grow sideways,
       tall screens grow up and down). Size = base × relevance × falloff(distance), with jitter. */
    function sizeAt(o, dn) {
      return Math.max(o.min_scale, 1 / (1 + o.falloff * Math.pow(Math.max(dn, 0), o.falloff_curve)));
    }

    function layout(g, o, seed) {
      var rng = rngFrom(seed);
      var W = g.W, mon = g.mon;
      var unit = mon.w;
      var scaleVW = clamp(W / 1920, 0.5, 1.4);
      var gap = Math.max(6, num(o.gap, 22) * scaleVW);
      var margin = Math.max(10, gap * 0.8);
      var cx = mon.x + mon.w / 2, cy = mon.y + mon.h / 2;
      var view = W / Math.max(g.H, 1);
      var spread = num(o.spread, 0.85);
      var ax = 1, ay = 1;
      if (view >= 1) ax = Math.pow(view, spread); else ay = Math.pow(1 / view, spread);
      var R = clamp(num(o.randomness, 0.35), 0, 1);
      var relW = clamp(num(o.relevance_weight, 0.75), 0, 1);
      var top = g.navH + gap;

      var blocked = [
        { x: mon.x, y: mon.y, w: mon.w, h: mon.h },
        g.intro
      ].concat(g.clear || []);

      var order = items.map(function (it, i) {
        return { it: it, key: it.p.relevance + (rng() - 0.5) * R * 6, jit: 1 + (rng() * 2 - 1) * R * 0.28, jx: (rng() - 0.5) * R, jy: (rng() - 0.5) * R, i: i };
      }).sort(function (a, b) { return b.key - a.key; });

      var placed = [];
      function hits(r) {
        if (r.x < margin || r.x + r.w > W - margin || r.y < top) return true;
        var all = blocked.concat(placed);
        for (var k = 0; k < all.length; k++) {
          var b = all[k];
          if (r.x < b.x + b.w + gap && r.x + r.w + gap > b.x && r.y < b.y + b.h + gap && r.y + r.h + gap > b.y) return true;
        }
        return false;
      }

      var out = [];
      var tMax = 6 * Math.max(W, g.H);
      order.forEach(function (o2) {
        var it = o2.it;
        var relN = (it.p.relevance - 1) / 9;
        var relF = (1 - relW) + relW * (0.32 + 0.68 * relN);
        var asp = it.aspect;
        var start = rng() * Math.PI * 2;
        var found = null;
        var t = unit * 0.3;
        while (!found && t < tMax) {
          var dn = t / unit;
          var s = relF * sizeAt(o, dn) * o2.jit;
          var w16 = unit * num(o.base_size, 0.62) * (g.mobile ? num(o.mobile_scale, 1.5) : 1) * s;
          var area = w16 * w16 * 9 / 16;
          var w = Math.sqrt(area * asp), h = Math.sqrt(area / asp);
          var minSide = Math.min(w, h);
          var dt = Math.max(3, minSide * 0.07);
          var circ = 2 * Math.PI * t * Math.max(ax, ay);
          var n = clamp(Math.ceil(circ / Math.max(4, minSide * 0.12)), 16, 240);
          for (var k = 0; k < n && !found; k++) {
            var a = start + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (2 * Math.PI / n);
            var px = cx + Math.cos(a) * t * ax + o2.jx * w * 0.3;
            var py = cy + Math.sin(a) * t * ay + o2.jy * h * 0.3;
            var r = { x: px - w / 2, y: py - h / 2, w: w, h: h };
            if (!hits(r)) found = r;
          }
          t += dt;
        }
        if (found) {
          placed.push(found);
          out.push({ it: it, r: found, d: Math.hypot((found.x + found.w / 2 - cx) / ax, (found.y + found.h / 2 - cy) / ay) });
        }
      });
      var bottom = out.reduce(function (m, e) { return Math.max(m, e.r.y + e.r.h); }, 0);
      return { tiles: out, bottom: bottom, gap: gap, unit: unit };
    }

    function tileHTML(e, idx) {
      var p = e.it.p, r = e.r;
      var blur = clamp(r.w * 0.032, 8, 24);
      var media = p.cover ? '<img src="' + esc(p.cover) + '" alt="" loading="lazy" decoding="async">' : '<span class="tile-label">' + esc(p.title) + "</span>";
      if (p.cover && p.preview) media += '<img class="tile-peek" src="' + esc(p.preview) + '" alt="" loading="lazy" decoding="async" style="position:absolute;inset:0;opacity:0;transition:opacity .35s">';
      var glow = p.cover ? '<span class="tile-glow"><img src="' + esc(p.cover) + '" alt="" loading="lazy" decoding="async"></span>' : '<span class="tile-glow is-blank"></span>';
      return '<li class="tile" data-i="' + idx + '" style="left:' + r.x.toFixed(1) + "px;top:" + r.y.toFixed(1) + "px;width:" + r.w.toFixed(1) + "px;height:" + r.h.toFixed(1) +
        "px;--blur:" + blur.toFixed(1) + "px;--label:" + clamp(r.w * 0.045, 10, 15).toFixed(1) + "px;--hover:" + num(opts.hover_scale, 1.06) + '">' +
        '<div class="tile-pop"><a class="tile-a" href="#/work/' + esc(p.slug) + '" aria-label="' + esc(p.title) + (p.year ? ", " + esc(p.year) : "") + '">' +
        glow + '<span class="tile-media">' + media + "</span></a></div></li>";
    }

    var seed = num(opts.seed, 7);
    if (opts.reshuffle) seed = Math.floor(Math.random() * 1e9);

    function render(animate) {
      geom = computeGeom();
      placeScene(geom);
      var res = layout(geom, opts, seed);
      res.tiles.sort(function (a, b) { return a.d - b.d; });
      collageEl.innerHTML = res.tiles.map(tileHTML).join("");
      var deskBottom = geom.mon.y + geom.mon.h * 1.5;
      stage.style.height = Math.max(window.innerHeight, res.bottom + res.gap * 3, deskBottom) + "px";
      var lis = collageEl.children;
      var stagger = clamp(1500 / Math.max(res.tiles.length, 1), 35, 90);
      var rng = rngFrom(seed + 1);
      tiles = res.tiles.map(function (e, i) {
        var li = lis[i];
        if (animate) li.style.setProperty("--delay", Math.round(i * stagger) + "ms");
        if (revealed) li.classList.add(animate ? "is-in" : "is-static");
        var peek = li.querySelector(".tile-peek");
        if (peek) {
          var a = li.querySelector(".tile-a");
          a.addEventListener("mouseenter", function () { peek.style.opacity = "1"; });
          a.addEventListener("mouseleave", function () { peek.style.opacity = "0"; });
        }
        return {
          el: li, cx: e.r.x + e.r.w / 2, cy: e.r.y + e.r.h / 2, size: Math.sqrt(e.r.w * e.r.h),
          p1: rng() * 6.283, p2: rng() * 6.283, s1: 0.00045 + rng() * 0.00035, s2: 0.0004 + rng() * 0.0003,
          amp: 0.6 + rng() * 0.6, rot: (rng() - 0.5), ox: 0, oy: 0
        };
      });
      return res;
    }

    function reveal() {
      revealed = true;
      sceneEl.classList.add("is-in");
      return sceneReady.then(function (ms) {
        setTimeout(function () {
          screenEl.classList.add("is-in");
          Array.prototype.forEach.call(collageEl.children, function (li) { li.classList.add(reduceMotion ? "is-static" : "is-in"); });
        }, reduceMotion ? 0 : ms);
      });
    }

    /* measure real images, then lay out and play */
    Promise.all(items.map(function (it) {
      return measure(it.p.cover).then(function (a) { if (a) { it.aspect = a; it.real = true; } });
    })).then(function () {
      return sceneReady;
    }).then(function () {
      render(true);
      reveal();
      startLoop();
      if (/[?&]tune\b/.test(location.search)) buildTuner();
    });

    /* re-layout when the window changes shape (not on mobile URL-bar height jitter) */
    var lastW = window.innerWidth, lastAspect = window.innerWidth / window.innerHeight, rt = 0;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        var w = window.innerWidth, asp = w / window.innerHeight;
        if (Math.abs(w - lastW) > 30 || Math.abs(asp - lastAspect) > 0.12) {
          lastW = w; lastAspect = asp;
          render(false);
        }
      }, 180);
    });

    /* ---------- float + cursor ---------- */
    var mouse = { x: 0, y: 0, active: false };
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    }, { passive: true });
    document.addEventListener("pointerleave", function () { mouse.active = false; });
    window.addEventListener("blur", function () { mouse.active = false; });

    var visible = true, running = false;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (list) { visible = list[0].isIntersecting; if (visible) startLoop(); }).observe(stage);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) startLoop(); });

    function startLoop() {
      if (running || reduceMotion) return;
      running = true;
      requestAnimationFrame(frame);
    }

    function frame(now) {
      if (!visible || document.hidden) { running = false; return; }
      var fl = num(opts.float, 1), cu = num(opts.cursor, 1);
      var rect = stage.getBoundingClientRect();
      var mx = mouse.x - rect.left, my = mouse.y - rect.top;
      var reach = geom ? Math.max(200, geom.mon.w * 0.55) : 300;
      for (var i = 0; i < tiles.length; i++) {
        var t = tiles[i];
        var fx = Math.sin(now * t.s1 + t.p1) * 5 * fl * t.amp;
        var fy = Math.cos(now * t.s2 + t.p2) * 6 * fl * t.amp;
        var tx = 0, ty = 0;
        if (mouse.active && cu > 0) {
          var dx = t.cx - mx, dy = t.cy - my;
          var dist = Math.max(Math.hypot(dx, dy), 1);
          var f = Math.exp(-(dist * dist) / (2 * reach * reach));
          var push = cu * 18 * f;
          tx = dx / dist * push - (mx - rect.width / 2) / rect.width * cu * 10;
          ty = dy / dist * push - (my - window.innerHeight / 2) / window.innerHeight * cu * 8;
        }
        t.ox += (tx - t.ox) * 0.07;
        t.oy += (ty - t.oy) * 0.07;
        var rot = Math.sin(now * t.s2 * 0.8 + t.p1) * 0.35 * fl * t.rot;
        t.el.style.transform = "translate3d(" + (fx + t.ox).toFixed(2) + "px," + (fy + t.oy).toFixed(2) + "px,0) rotate(" + rot.toFixed(3) + "deg)";
      }
      requestAnimationFrame(frame);
    }

    /* ---------- tuning panel (?tune) ---------- */
    function buildTuner() {
      var defs = [
        ["base_size", "Base size", 0.2, 1.4, 0.01],
        ["falloff", "Falloff strength", 0, 3, 0.05],
        ["falloff_curve", "Falloff curve", 0.4, 3.5, 0.05],
        ["min_scale", "Smallest size", 0.05, 1, 0.01],
        ["relevance_weight", "Relevance effect", 0, 1, 0.05],
        ["randomness", "Randomness", 0, 1, 0.05],
        ["spread", "Follow screen shape", 0, 1.5, 0.05],
        ["gap", "Gap (px at 1920 wide)", 0, 80, 1],
        ["float", "Float amount", 0, 3, 0.05],
        ["cursor", "Cursor effect", 0, 3, 0.05],
        ["hover_scale", "Hover size", 1, 1.25, 0.01],
        ["mobile_scale", "Phone size boost", 0.5, 3, 0.05]
      ];
      var box = document.createElement("aside");
      box.className = "tune";
      box.setAttribute("aria-label", "Collage tuning");
      box.innerHTML = "<h2>Collage tuning</h2><p>Changes only show on your screen. Copy the values into Site settings, Collage in the admin to keep them.</p>" +
        '<canvas class="tune-curve" width="560" height="180" aria-label="Size against distance from the monitor"></canvas>' +
        defs.map(function (d) {
          return '<label>' + d[1] + '<output data-o="' + d[0] + '"></output><input type="range" data-k="' + d[0] + '" min="' + d[2] + '" max="' + d[3] + '" step="' + d[4] + '"></label>';
        }).join("") +
        '<div class="tune-row"><button type="button" data-a="seed">New layout</button><button type="button" data-a="replay">Replay</button><button type="button" data-a="copy">Copy values</button></div><pre></pre>';
      document.body.appendChild(box);
      var pre = box.querySelector("pre"), cv = box.querySelector("canvas");

      function draw() {
        var c = cv.getContext("2d"), w = cv.width, h = cv.height;
        c.clearRect(0, 0, w, h);
        c.fillStyle = "#0a0a0a"; c.fillRect(0, 0, w, h);
        c.strokeStyle = "#222"; c.lineWidth = 1;
        for (var gx = 0; gx <= 4; gx++) { c.beginPath(); c.moveTo(gx / 4 * w, 0); c.lineTo(gx / 4 * w, h); c.stroke(); }
        c.strokeStyle = "#fff"; c.lineWidth = 3; c.shadowColor = "#fff"; c.shadowBlur = 8;
        c.beginPath();
        for (var x = 0; x <= w; x += 4) {
          var y = h - 10 - sizeAt(opts, x / w * 4) * (h - 20);
          if (x) c.lineTo(x, y); else c.moveTo(x, y);
        }
        c.stroke(); c.shadowBlur = 0;
        c.fillStyle = "#777"; c.font = "20px Inter, sans-serif";
        c.fillText("size", 10, 26); c.fillText("distance from monitor →", w - 260, h - 14);
      }
      function sync() {
        defs.forEach(function (d) {
          var v = num(opts[d[0]], 0);
          box.querySelector('[data-k="' + d[0] + '"]').value = v;
          box.querySelector('[data-o="' + d[0] + '"]').textContent = v;
        });
        var lines = defs.map(function (d) { return d[1] + ": " + num(opts[d[0]], 0); });
        lines.push("Seed: " + seed);
        pre.textContent = lines.join("\n");
        draw();
      }
      var t2 = 0;
      box.addEventListener("input", function (e) {
        var k = e.target.getAttribute("data-k");
        if (!k) return;
        opts[k] = Number(e.target.value);
        sync();
        clearTimeout(t2);
        t2 = setTimeout(function () { render(false); }, 60);
      });
      box.addEventListener("click", function (e) {
        var a = e.target.getAttribute("data-a");
        if (a === "seed") { seed = Math.floor(Math.random() * 100000); render(false); sync(); }
        if (a === "replay") { revealed = false; sceneEl.classList.remove("is-in"); screenEl.classList.remove("is-in"); render(true); requestAnimationFrame(function () { reveal(); }); }
        if (a === "copy" && navigator.clipboard) navigator.clipboard.writeText(pre.textContent).then(function () { e.target.textContent = "Copied"; setTimeout(function () { e.target.textContent = "Copy values"; }, 1400); });
      });
      sync();
    }

    /* ================= project viewer ================= */
    var dlg = $("#viewer");
    var inner = $("#viewer-inner");
    var opener = null;

    function embedURL(u) {
      var m = String(u).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
      if (m) return "https://www.youtube-nocookie.com/embed/" + m[1];
      m = String(u).match(/vimeo\.com\/(?:video\/)?(\d+)/);
      if (m) return "https://player.vimeo.com/video/" + m[1];
      return "";
    }
    function mediaHTML(m, title) {
      var cap = m.caption ? "<figcaption>" + esc(m.caption) + "</figcaption>" : "";
      var t = String(m.type || "").toLowerCase();
      if (t === "video file" && m.file) return '<figure><video src="' + esc(m.file) + '" controls playsinline preload="metadata"></video>' + cap + "</figure>";
      if (t === "video link" && m.url) {
        var e = embedURL(m.url);
        if (e) return '<figure><iframe src="' + esc(e) + '" title="' + esc(title) + ' video" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>' + cap + "</figure>";
        return '<figure><a href="' + esc(m.url) + '">' + esc(m.url) + "</a>" + cap + "</figure>";
      }
      if (m.image) return '<figure><img src="' + esc(m.image) + '" alt="' + esc(m.caption || title) + '" loading="lazy" decoding="async">' + cap + "</figure>";
      return "";
    }
    function byRelevance() {
      return projects.slice().sort(function (a, b) { return b.relevance - a.relevance; });
    }
    function openProject(slug) {
      var list = byRelevance();
      var i = -1;
      list.forEach(function (p, k) { if (p.slug === slug) i = k; });
      if (i < 0) return;
      var p = list[i];
      var prev = list[(i - 1 + list.length) % list.length];
      var next = list[(i + 1) % list.length];
      var meta = [p.category, p.year, p.role, p.tools].filter(Boolean).map(esc).join(" | ");
      var desc = String(p.description || p.summary || "").split(/\n\s*\n/).filter(Boolean).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("");
      var media = (p.media || []).map(function (m) { return mediaHTML(m, p.title); }).join("");
      if (!media && p.cover) media = mediaHTML({ image: p.cover }, p.title);
      inner.innerHTML =
        '<div class="viewer-bar"><span>' + esc(domain) + '</span><button type="button" id="viewer-close">Close</button></div>' +
        '<h2 id="viewer-title">' + esc(p.title) + "</h2>" +
        '<p class="viewer-meta">' + meta + "</p>" +
        (desc ? '<div class="viewer-desc">' + desc + "</div>" : "") +
        (media ? '<div class="viewer-media">' + media + "</div>" : '<p class="viewer-empty">Images and video for this project are coming soon.</p>') +
        '<div class="viewer-nav"><a href="#/work/' + esc(prev.slug) + '">Previous: ' + esc(prev.title) + '</a><a href="#/work/' + esc(next.slug) + '">Next: ' + esc(next.title) + "</a></div>";
      if (!dlg.open) {
        opener = document.activeElement;
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
        document.body.classList.add("is-locked");
      }
      dlg.scrollTop = 0;
      document.title = p.title + " | " + domain;
    }
    function closeViewer() { if (dlg.open) dlg.close(); }
    dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.id === "viewer-close") closeViewer(); });
    dlg.addEventListener("close", function () {
      document.body.classList.remove("is-locked");
      document.title = domain;
      if (/^#\/work\//.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    });
    function route() {
      var m = location.hash.match(/^#\/work\/(.+)$/);
      if (m) openProject(decodeURIComponent(m[1])); else closeViewer();
    }
    window.addEventListener("hashchange", route);
    route();
  }
})();
