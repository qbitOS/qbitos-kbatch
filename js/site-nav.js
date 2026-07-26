/**
 * KBatch site chrome — one continuous menu + light/dark theme on every page.
 *
 * Targets: nav.site-nav · nav.docs-nav (creates one if missing)
 * Links are always root-absolute (/learn, /labs/…) so labs/, dojo/, and
 * root pages resolve the same way on CF Pages pretty URLs.
 * Never use relative hrefs (../docs) — crawl ghost paths.
 *
 * Theme key: localStorage kbatch-dict-theme
 * Canonical: extensionless where possible; /dojo/ for DOJO.
 */
(function () {
  "use strict";

  var THEME_KEY = "kbatch-dict-theme";
  var NAV_VER = "site-nav-v12-p0-absolute-canonical";

  /** Canonical order — same labels & destinations everywhere */
  var ITEMS = [
    { id: "dict", label: "Dictionary", path: "/" },
    { id: "learn", label: "Learn", path: "/learn" },
    { id: "lyrics", label: "Lyrics", path: "/lyrics" },
    { id: "staff", label: "Staff", path: "/labs/music-staff" },
    { id: "books", label: "Books", path: "/labs/living-books" },
    // One surface: myth deities + world/history names (tracks via ?track=myth|names)
    {
      id: "myth-names",
      label: "Myth · Names",
      path: "/labs/myth-names",
      title: "Mythology + Names scroll — one page, two tracks",
    },
    { id: "ancestory", label: "AnCEstory", path: "/labs/ancestory" },
    { id: "lang-tree", label: "Lang tree", path: "/labs/lang-tree" },
    { id: "rosetta", label: "Rosetta", path: "/labs/rosetta" },
    {
      id: "declaration",
      label: "Declaration",
      path: "/labs/declaration-digital-edition/",
    },
    { id: "catalog", label: "Catalog", path: "/catalog" },
    { id: "waves", label: "Waves", path: "/labs/waveform-letters" },
    { id: "typing", label: "Typing", path: "/labs/typing" },
    { id: "collab", label: "Collab", path: "/labs/collab" },
    { id: "shadow", label: "/shadow", path: "/shadow" },
    { id: "research", label: "Research", path: "/research" },
    { id: "axes", label: "Axes", path: "/world-ranking" },
    { id: "museum", label: "Museum", path: "/museum" },
    { id: "dojo", label: "DOJO", path: "/dojo/" },
    { id: "forai", label: "For AI", path: "/for-ai" },
    { id: "mesh", label: "Mesh", path: "/mesh/", title: "Sister products (external)" },
    { id: "install", label: "Install", path: "/install" },
    { id: "docs", label: "Docs", path: "/docs" },
  ];

  /** Alias leaves → item id (pretty URLs + legacy redirects) */
  var LEAF_ALIASES = {
    "": "dict",
    index: "dict",
    learn: "learn",
    lyrics: "lyrics",
    "music-staff": "staff",
    staff: "staff",
    "living-books": "books",
    books: "books",
    "myth-names": "myth-names",
    mythology: "myth-names",
    "open-names": "myth-names",
    myth: "myth-names",
    names: "myth-names",
    "names-scroll": "myth-names",
    ancestory: "ancestory",
    lineage: "ancestory",
    "lang-tree": "lang-tree",
    "language-tree": "lang-tree",
    world: "lang-tree",
    rosetta: "rosetta",
    "writing-systems": "rosetta",
    scripts: "rosetta",
    declaration: "declaration",
    "declaration-digital-edition": "declaration",
    catalog: "catalog",
    "waveform-letters": "waves",
    waves: "waves",
    mesh: "mesh",
    "404": "dict",
    typing: "typing",
    collab: "collab",
    shadow: "shadow",
    research: "research",
    "world-ranking": "axes",
    axes: "axes",
    museum: "museum",
    dojo: "dojo",
    "for-ai": "forai",
    forai: "forai",
    install: "install",
    docs: "docs",
  };

  function pathLeaf(pathname) {
    var p = (pathname || "/").replace(/\/+$/, "") || "/";
    var parts = p.split("/").filter(Boolean);
    var last = parts[parts.length - 1] || "";
    return last.replace(/\.html$/i, "").toLowerCase();
  }

  function normalizePath(pathname) {
    var p = (pathname || "/").split("?")[0].split("#")[0];
    p = p.replace(/\.html$/i, "");
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p || "/";
  }

  function activeId() {
    var path = normalizePath(location.pathname || "/");
    var leaf = pathLeaf(path);

    if (LEAF_ALIASES[leaf]) return LEAF_ALIASES[leaf];

    // Path contains match (longest wins)
    var best = null;
    var bestScore = -1;
    for (var i = 0; i < ITEMS.length; i++) {
      var item = ITEMS[i];
      if (item.id === "dict") continue;
      var target = item.path.replace(/\/$/, "");
      if (!target || target === "/") continue;
      if (path === target || path.indexOf(target + "/") === 0 || path.endsWith(target)) {
        if (target.length > bestScore) {
          bestScore = target.length;
          best = item.id;
        }
      }
    }
    if (best) return best;

    if (!leaf || leaf === "index" || path === "/" || path === "") return "dict";
    return "dict";
  }

  function hrefFor(item) {
    // Always site-root absolute so /labs/* and /dojo/* never break.
    // Prefer pretty URLs (CF Pages + local serve-pretty.py). Trailing /
    // marks directory indexes (dojo/, declaration/).
    var p = item.path || "/";
    if (p.charAt(0) !== "/") p = "/" + p;
    return p;
  }

  /* ── Theme ── */

  function resolveTheme() {
    try {
      var t = localStorage.getItem(THEME_KEY);
      if (t === "light" || t === "dark") return t;
    } catch (e) {
      /* */
    }
    try {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches
      ) {
        return "light";
      }
    } catch (e2) {
      /* */
    }
    return "dark";
  }

  function applyTheme(theme) {
    var t = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch (e) {
      /* */
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", t === "light" ? "#f6f5f2" : "#0d1117");
    }
    var btns = document.querySelectorAll(
      ".theme-toggle, #theme-toggle, [data-theme-toggle]"
    );
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      b.setAttribute(
        "aria-label",
        t === "light" ? "Switch to dark mode" : "Switch to light mode"
      );
      b.title = t === "light" ? "Dark mode" : "Light mode";
      b.setAttribute("data-theme-now", t);
    }
    return t;
  }

  function toggleTheme() {
    var cur =
      document.documentElement.getAttribute("data-theme") || resolveTheme();
    applyTheme(cur === "light" ? "dark" : "light");
  }

  function makeToggleBtn() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.id = "theme-toggle";
    btn.setAttribute("data-theme-toggle", "1");
    btn.setAttribute("aria-label", "Toggle theme");
    btn.title = "Toggle theme";
    btn.innerHTML =
      '<span class="theme-icon theme-icon--sun" aria-hidden="true">☀</span>' +
      '<span class="theme-icon theme-icon--moon" aria-hidden="true">☾</span>';
    return btn;
  }

  function ensureThemeToggle() {
    var existing =
      document.getElementById("theme-toggle") ||
      document.querySelector(".theme-toggle");
    if (existing) return existing;

    var brand = document.querySelector(
      ".app-header .brand, .brand-row .brand"
    );
    if (brand) {
      var btn = makeToggleBtn();
      brand.insertBefore(btn, brand.firstChild);
      return btn;
    }

    var docsInner = document.querySelector(".docs-top-inner");
    if (docsInner) {
      var wrap = document.createElement("div");
      wrap.className = "docs-theme-slot";
      var btn2 = makeToggleBtn();
      wrap.appendChild(btn2);
      docsInner.insertBefore(wrap, docsInner.firstChild);
      return btn2;
    }

    if (!document.getElementById("theme-toggle-float")) {
      var float = makeToggleBtn();
      float.id = "theme-toggle-float";
      float.className = "theme-toggle theme-toggle-float";
      document.body.appendChild(float);
      return float;
    }
    return null;
  }

  if (!window.__kbatchThemeClickBound) {
    window.__kbatchThemeClickBound = true;
    document.addEventListener(
      "click",
      function (ev) {
        var t =
          ev.target && ev.target.closest
            ? ev.target.closest(
                ".theme-toggle, #theme-toggle, [data-theme-toggle]"
              )
            : null;
        if (!t) return;
        ev.preventDefault();
        ev.stopPropagation();
        toggleTheme();
      },
      true
    );
  }

  /* ── Nav paint ── */

  function ensureNavHost() {
    var nodes = document.querySelectorAll("nav.site-nav, nav.docs-nav");
    if (nodes.length) return nodes;

    // Create nav shell in known headers
    var brandRow = document.querySelector(
      ".app-header .brand-row, .header-inner .brand-row"
    );
    if (brandRow) {
      var n = document.createElement("nav");
      n.className = "site-nav";
      n.setAttribute("aria-label", "Site");
      // after brand, before export-bar if present
      var exportBar = brandRow.querySelector(".export-bar");
      if (exportBar) brandRow.insertBefore(n, exportBar);
      else brandRow.appendChild(n);
      return document.querySelectorAll("nav.site-nav, nav.docs-nav");
    }

    var docsInner = document.querySelector(".docs-top-inner");
    if (docsInner) {
      var n2 = document.createElement("nav");
      n2.className = "docs-nav site-nav";
      n2.setAttribute("aria-label", "Site");
      docsInner.appendChild(n2);
      return document.querySelectorAll("nav.site-nav, nav.docs-nav");
    }

    return nodes;
  }

  function paintNav(nav) {
    if (!nav) return;
    var act = activeId();
    var html = [];
    for (var i = 0; i < ITEMS.length; i++) {
      var item = ITEMS[i];
      var href = hrefFor(item);
      var on = item.id === act;
      html.push(
        '<a class="nav-link' +
          (on ? " is-active" : "") +
          '" href="' +
          href +
          '"' +
          (item.title ? ' title="' + String(item.title).replace(/"/g, "&quot;") + '"' : "") +
          (on ? ' aria-current="page"' : "") +
          ">" +
          item.label +
          "</a>"
      );
    }
    nav.innerHTML = html.join("");
    nav.setAttribute("data-site-nav", NAV_VER);
    nav.setAttribute("aria-label", "Site");
    // Both class names so app.css + docs-site.css styles apply
    if (!nav.classList.contains("site-nav")) nav.classList.add("site-nav");
    if (nav.classList.contains("docs-nav")) {
      nav.classList.add("site-nav-unified");
    }
  }

  /** Load universal History slide rule (Declaration-class timeline) once per page */
  function ensureHistoryHarness() {
    try {
      if (document.documentElement.hasAttribute("data-no-history-harness")) return;
      if (document.querySelector("script[data-kbatch-history-harness]")) return;
      if (!document.querySelector('link[data-kbatch-hsr], link[href*="history-sliderule"]')) {
        var l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = "/css/history-sliderule.css";
        l.setAttribute("data-kbatch-hsr", "1");
        document.head.appendChild(l);
      }
      var s = document.createElement("script");
      s.type = "module";
      s.src = "/js/history-harness.js";
      s.setAttribute("data-kbatch-history-harness", "1");
      document.head.appendChild(s);
    } catch (e) {
      /* harness optional */
    }
  }

  /** Prefer extensionless canonical (do not rewrite 404). */
  function ensureCanonical() {
    try {
      if (document.querySelector('link[rel="canonical"]')) return;
      var path = location.pathname || "/";
      if (path === "/404.html" || path === "/404") return;
      // strip trailing index.html
      path = path.replace(/\/index\.html$/i, "/");
      // strip .html for top-level and lab pages (keep multi-dot data paths alone)
      if (/\.html$/i.test(path) && path.indexOf("/data/") !== 0) {
        path = path.replace(/\.html$/i, "");
        if (path === "/dojo") path = "/dojo/";
      }
      var link = document.createElement("link");
      link.rel = "canonical";
      link.href = "https://kbatch.ugrad.ai" + (path || "/");
      document.head.appendChild(link);
    } catch (e) {
      /* optional */
    }
  }

  function run() {
    applyTheme(resolveTheme());
    ensureThemeToggle();
    ensureCanonical();
    var nodes = ensureNavHost();
    for (var i = 0; i < nodes.length; i++) paintNav(nodes[i]);
    applyTheme(
      document.documentElement.getAttribute("data-theme") || resolveTheme()
    );
    ensureHistoryHarness();
  }

  try {
    if (!document.documentElement.getAttribute("data-theme")) {
      applyTheme(resolveTheme());
    }
  } catch (e) {
    /* */
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  window.__kbatchSiteNav = {
    ver: NAV_VER,
    ITEMS: ITEMS,
    run: run,
    activeId: activeId,
    applyTheme: applyTheme,
    toggleTheme: toggleTheme,
    resolveTheme: resolveTheme,
    hrefFor: hrefFor,
  };
})();
