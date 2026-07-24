/**
 * Declaration digital edition toolbox nav.
 * Site-native chrome — same language as .site-nav / .nav-link.
 *
 * Host: <nav class="dec-version-nav" data-dec-nav data-active="workspace"></nav>
 * Or auto-detects active from path.
 */
(function () {
  "use strict";

  var VER = "declaration-edition-nav-v4-site";
  var BASE = "/labs/declaration-digital-edition/";

  /**
   * Groups match the rest of the site (muted group labs + chip links):
   *  RESTORE · CAGE GAMES · RESEARCH · CRAFT
   */
  var GROUPS = [
    {
      id: "restore",
      label: "Restore",
      note: "Archive workspace · multi-layer codex",
      items: [
        {
          id: "workspace",
          label: "Workspace",
          href: "index.html",
          tip: "RAW + STONE multi-layer codex flip · archive core",
        },
        {
          id: "layers",
          label: "Layers",
          href: "versions.html",
          tip: "All image layers · parchment · stone · contrast",
        },
      ],
    },
    {
      id: "cage-games",
      label: "Cage games",
      note: "WebGrid-style tensor games · hard-fail litmus",
      items: [
        {
          id: "cage-games",
          label: "Games hub",
          href: "cage-games.html",
          tip: "All Cage tensor games · stair · agent hooks · persona L5",
        },
        {
          id: "letter-grid",
          label: "Letter-Grid",
          href: "letter-grid.html",
          tip: "Full-codex N×N layers · finale path · WebGrid BPS · __letterGridApi",
        },
        {
          id: "letter-grid-lab",
          label: "Grid Lab",
          href: "letter-grid-lab.html",
          tip: "Full research + casual play + multi-run benchmark ledger",
        },
        {
          id: "cage",
          label: "Cage litmus",
          href: "cage-litmus.html",
          tip: "FACT / FICTION / STONE_TRAP · RAW+STONE · __cageLitmusApi",
        },
      ],
    },
    {
      id: "research",
      label: "Research",
      note: "World · paleography · open reader",
      items: [
        {
          id: "open-reader",
          label: "Open reader",
          href: "open-reader.html",
          tip: "Letter paths · words · punct · intonation · persona slant",
        },
        {
          id: "world",
          label: "World",
          href: "world.html",
          tip: "Multilingual · theme matrix · lineage gitgraph",
        },
        {
          id: "paleography",
          label: "Paleography",
          href: "paleography-hub.html",
          tip: "Script · ductus · material notes",
        },
      ],
    },
    {
      id: "craft",
      label: "Craft",
      note: "Stroke · path · glyph tools",
      items: [
        {
          id: "strokes",
          label: "Strokes",
          href: "stroke-player.html",
          tip: "Per-line stroke paths · playback",
        },
        {
          id: "path",
          label: "Path",
          href: "keyboard.html",
          tip: "Keyboard path metrics · layout strain",
        },
        {
          id: "glyphs",
          label: "Glyphs",
          href: "scribe-glyphs.html",
          tip: "Scribe glyph grid · engrossed hand",
        },
      ],
    },
  ];

  function leaf() {
    var p = (location.pathname || "").replace(/\/+$/, "");
    var last = p.split("/").pop() || "";
    return last.replace(/\.html$/i, "").toLowerCase() || "index";
  }

  function activeId(host) {
    var fromAttr = host && host.getAttribute("data-active");
    if (fromAttr) return fromAttr;
    var L = leaf();
    if (L === "index" || L === "declaration-digital-edition" || L === "") return "workspace";
    if (L === "letter-grid" || L === "letter-grid-agent") return "letter-grid";
    if (L === "letter-grid-lab") return "letter-grid-lab";
    if (L === "cage-litmus") return "cage";
    if (L === "saint-tumble") return "cage-games";
    if (L === "steno-space-grid") return "cage-games";
    if (L === "cage-games") return "cage-games";
    if (L === "open-reader") return "open-reader";
    if (L === "world") return "world";
    if (L === "paleography-hub") return "paleography";
    if (L === "versions") return "layers";
    if (L === "stroke-player") return "strokes";
    if (L === "keyboard") return "path";
    if (L === "scribe-glyphs") return "glyphs";
    return L;
  }

  function hrefFor(item) {
    // Keep relative links so pretty URLs under /labs/declaration-digital-edition/ work
    return item.href;
  }

  function findItem(id) {
    for (var g = 0; g < GROUPS.length; g++) {
      for (var i = 0; i < GROUPS[g].items.length; i++) {
        if (GROUPS[g].items[i].id === id) return GROUPS[g].items[i];
      }
    }
    return null;
  }

  function paint(host) {
    if (!host) return;
    var act = activeId(host);
    var cur = findItem(act);
    var html = [];
    html.push('<div class="dec-nav-inner">');
    html.push(
      '<div class="dec-nav-brand">' +
        '<span class="dec-nav-kicker">Declaration edition</span>' +
        '<strong class="dec-nav-title">Toolbox</strong>' +
        '<span class="dec-nav-stair">Restore · Cage games · Research · Craft</span>' +
        "</div>"
    );
    html.push('<div class="dec-nav-groups" role="list">');
    for (var g = 0; g < GROUPS.length; g++) {
      var group = GROUPS[g];
      html.push(
        '<div class="dec-nav-group" role="listitem" data-group="' +
          group.id +
          '">' +
          '<span class="dec-nav-group-lab" title="' +
          String(group.note || group.label).replace(/"/g, "&quot;") +
          '">' +
          group.label +
          "</span>" +
          '<div class="dec-nav-links" role="navigation" aria-label="' +
          group.label +
          '">'
      );
      for (var i = 0; i < group.items.length; i++) {
        var it = group.items[i];
        var on = it.id === act;
        html.push(
          '<a class="dec-nav-link' +
            (on ? " is-active" : "") +
            '" href="' +
            hrefFor(it) +
            '"' +
            (on ? ' aria-current="page"' : "") +
            ' title="' +
            String(it.tip || it.label).replace(/"/g, "&quot;") +
            '"><span class="dec-nav-link-txt">' +
            it.label +
            "</span></a>"
        );
      }
      html.push("</div></div>");
    }
    html.push("</div>"); // groups
    html.push(
      '<p class="dec-nav-hint" id="dec-nav-hint">' +
        (cur
          ? "<strong>" +
            cur.label +
            "</strong> · " +
            (cur.tip || "")
          : "Restore workspace · Cage games · Research · Craft") +
        "</p>"
    );
    html.push("</div>");
    host.innerHTML = html.join("");
    host.classList.add("dec-version-nav--v2", "dec-version-nav--v3", "dec-version-nav--v4");
    host.setAttribute("data-dec-nav-ver", VER);
    host.setAttribute("aria-label", "Declaration edition toolbox");
  }

  /** Place toolbox under site header, *above* History so tools stay useful when rail is open */
  function placeHost(host) {
    if (!host) return;
    var header = document.querySelector(".app-header, header.app-header");
    var harness = document.getElementById("kbatch-history-harness");
    if (!header || !header.parentNode) return;
    // Order: header → toolbox → history → main
    if (host.previousElementSibling !== header) {
      header.parentNode.insertBefore(host, header.nextSibling);
    }
    if (harness && harness.parentNode && host.nextElementSibling !== harness) {
      host.parentNode.insertBefore(harness, host.nextSibling);
    }
  }

  function ensureHost() {
    var existing = document.querySelector("nav.dec-version-nav, nav[data-dec-nav]");
    if (existing) {
      placeHost(existing);
      return existing;
    }
    var nav = document.createElement("nav");
    nav.className = "dec-version-nav";
    nav.setAttribute("data-dec-nav", "1");
    var header = document.querySelector(".app-header, header.app-header");
    if (header && header.parentNode) {
      header.parentNode.insertBefore(nav, header.nextSibling);
    } else {
      document.body.insertBefore(nav, document.body.firstChild);
    }
    placeHost(nav);
    return nav;
  }

  function run() {
    if (!/declaration-digital-edition/i.test(location.pathname || "")) {
      // Only auto-paint on edition pages (or when host present)
      var only = document.querySelector("nav.dec-version-nav, nav[data-dec-nav]");
      if (!only) return;
      paint(only);
      placeHost(only);
      return;
    }
    var host = ensureHost();
    paint(host);
    placeHost(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  // History harness injects after header — reassert toolbox between header and history
  [50, 200, 600].forEach(function (ms) {
    setTimeout(function () {
      var host = document.querySelector("nav.dec-version-nav");
      if (host) placeHost(host);
    }, ms);
  });

  window.__kbatchDeclarationEditionNav = {
    ver: VER,
    GROUPS: GROUPS,
    paint: paint,
    run: run,
  };
})();
