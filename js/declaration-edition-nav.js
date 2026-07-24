/**
 * Declaration digital edition toolbox nav.
 * Shared across edition pages — growth stair + craft tools, not a second site menu.
 *
 * Host: <nav class="dec-version-nav" data-dec-nav data-active="workspace"></nav>
 * Or auto-detects active from path.
 */
(function () {
  "use strict";

  var VER = "declaration-edition-nav-v2";
  var BASE = "/labs/declaration-digital-edition/";

  /** Grouped tools — purpose first, short labels, useful tips */
  var GROUPS = [
    {
      id: "restore",
      label: "Restore",
      note: "Archival surfaces",
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
      id: "litmus",
      label: "Cage games",
      note: "AI tensor stair",
      items: [
        {
          id: "cage-games",
          label: "Games hub",
          href: "cage-games.html",
          tip: "All Cage tensor games · Letter-Grid · litmus · dual-surface · agent hooks",
        },
        {
          id: "letter-grid",
          label: "Letter-Grid",
          href: "letter-grid.html",
          tip: "Full-codex N×N layers · finale path · WebGrid BPS · __letterGridApi",
        },
        {
          id: "cage",
          label: "Cage litmus",
          href: "cage-litmus.html",
          tip: "FACT / FICTION / STONE_TRAP · RAW+STONE · __cageLitmusApi",
        },
        {
          id: "saint-tumble",
          label: "Saint tumble",
          href: "saint-tumble.html",
          tip: "Vals · Human Fly · Boris · two talks → crypto tumble · DAC/Steno/Gutter/Rubik",
        },
        {
          id: "steno-space-grid",
          label: "Steno spaces",
          href: "steno-space-grid.html",
          tip: "Letter-grid of all stenoSTRIP spaces · GrokYtalkY glyph · Rubik QR · video qbit",
        },
      ],
    },
    {
      id: "research",
      label: "Research",
      note: "World + material",
      items: [
        {
          id: "world",
          label: "World",
          href: "world.html",
          tip: "Multilingual plane · theme matrix · lineage gitgraph",
        },
        {
          id: "paleography",
          label: "Paleography",
          href: "paleography-hub.html",
          tip: "Script · ductus · material science notes",
        },
      ],
    },
    {
      id: "craft",
      label: "Craft",
      note: "Path geometry",
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
    if (L === "letter-grid") return "letter-grid";
    if (L === "cage-litmus") return "cage";
    if (L === "saint-tumble") return "saint-tumble";
    if (L === "steno-space-grid") return "steno-space-grid";
    if (L === "cage-games") return "cage-games";
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
          (group.note || group.label) +
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
            '">' +
            it.label +
            "</a>"
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
          : "Pick a tool · Litmus stair before deep archive craft") +
        "</p>"
    );
    html.push("</div>");
    host.innerHTML = html.join("");
    host.classList.add("dec-version-nav--v2");
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
