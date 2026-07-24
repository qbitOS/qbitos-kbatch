/**
 * Declaration Letter-Grid v2 · full-document layer passes
 * · Master small glyphs in reading order through the entire codex
 * · Layer = square chunk of the master stream (WebGrid grammar)
 * · Finale = wandering path of letters across the board
 *
 * BPS ≈ log2(N²-1) * NTPM/60 · target rgb(10,132,255)
 */
(function (global) {
  "use strict";

  var VER = "declaration-letter-grid-v2-codex";
  var TARGET_RGB = "rgb(10, 132, 255)";
  var ROUND_MS = 0; /* 0 = open codex pass (no timer); timed optional */
  var DEFAULT_N = 12;
  var GLYPH_RAIL = 48;

  function log2(x) {
    return Math.log(x) / Math.LN2;
  }

  function bpsFromNtpm(ntpm, N) {
    var cells = N * N;
    var factor = log2(Math.max(2, cells - 1));
    return Math.max(0, (factor * ntpm) / 60);
  }

  function fetchJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("fetch " + url + " " + r.status);
      return r.json();
    });
  }

  /** Ordered master glyph stream (letters only) through entire document */
  function buildMaster(lines) {
    var master = [];
    var xref = {};
    lines.forEach(function (ln) {
      var text = ln.text || "";
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (!/[A-Za-z]/.test(ch)) continue;
        var gi = master.length;
        var entry = {
          gi: gi,
          lineId: ln.id,
          i: i,
          ch: ch,
          display: ch,
          kind: ln.kind || "body",
          parent: ln.parentEngrossed || ln.id,
        };
        master.push(entry);
        var key = ch.toUpperCase();
        if (!xref[key]) xref[key] = [];
        xref[key].push({ lineId: ln.id, i: i, ch: ch, gi: gi });
      }
    });
    return { master: master, xref: xref };
  }

  /**
   * Layer pass: N×N window starting at master index layerStart.
   * Target is always the sequential master glyph at masterPos (must fall in window).
   */
  function layerWindow(master, layerStart, N) {
    var need = N * N;
    var cells = [];
    for (var k = 0; k < need; k++) {
      var gi = layerStart + k;
      if (gi < master.length) {
        cells.push(Object.assign({}, master[gi], { pad: false }));
      } else {
        cells.push({
          gi: -1,
          lineId: "—",
          i: -1,
          ch: "·",
          display: "·",
          isLetter: false,
          pad: true,
        });
      }
    }
    return cells;
  }

  /** Spiral / wandering path indices on N×N board (center-out spiral, then snake fill) */
  function wanderingPathIndices(N) {
    var path = [];
    var seen = {};
    var x = Math.floor((N - 1) / 2);
    var y = Math.floor((N - 1) / 2);
    var dirs = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
    var di = 0;
    var leg = 1;
    function push(cx, cy) {
      if (cx < 0 || cy < 0 || cx >= N || cy >= N) return false;
      var idx = cy * N + cx;
      if (seen[idx]) return false;
      seen[idx] = true;
      path.push(idx);
      return true;
    }
    push(x, y);
    while (path.length < N * N) {
      for (var rep = 0; rep < 2; rep++) {
        for (var s = 0; s < leg; s++) {
          x += dirs[di][0];
          y += dirs[di][1];
          push(x, y);
          if (path.length >= N * N) return path;
        }
        di = (di + 1) % 4;
      }
      leg++;
    }
    /* residual row-major if spiral incomplete */
    for (var i = 0; i < N * N; i++) if (!seen[i]) path.push(i);
    return path;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function mount(root, opts) {
    opts = opts || {};
    var base = opts.dataBase || "/data/declaration";
    var N = opts.N || DEFAULT_N;

    var state = {
      N: N,
      lines: [],
      lineMap: {},
      master: [],
      xref: {},
      masterPos: 0,
      layerStart: 0,
      mode: "codex", /* codex | finale */
      cells: [],
      targetIdx: -1,
      hits: [],
      events: [],
      peakBps: 0,
      peakNtpm: 0,
      playing: false,
      roundUntil: 0,
      focusLine: null,
      logs: [],
      path: [],
      pathStep: 0,
      layerComplete: 0,
    };

    root.innerHTML = "";
    root.classList.add("dlg-root");

    var shell = el("div", "dlg-shell");
    var hero = el("div", "dlg-hero");
    var htxt = el("div");
    htxt.innerHTML =
      "<h2>Letter-Grid · Full codex layer passes</h2>" +
      "<p>Master <b>small glyphs in order</b> through the entire Declaration. " +
      "Each layer is an N×N square of the stream (WebGrid blue target). " +
      "Clear all layers → <b>finale wandering path</b> of letters. Cross-ref + document gateway stay live.</p>";
    hero.appendChild(htxt);
    var boardMetrics = el("div", "dlg-scoreboard");
    var mBps = metric("0.00", "BPS");
    var mNtpm = metric("0", "NTPM");
    var mProg = metric("0/0", "glyphs");
    var mLayer = metric("0", "layer");
    boardMetrics.appendChild(mBps.wrap);
    boardMetrics.appendChild(mNtpm.wrap);
    boardMetrics.appendChild(mProg.wrap);
    boardMetrics.appendChild(mLayer.wrap);
    hero.appendChild(boardMetrics);
    shell.appendChild(hero);

    /* progress bar */
    var prog = el("div", "dlg-progress");
    prog.innerHTML =
      '<div class="dlg-progress-bar"><i id="dlg-prog-fill"></i></div>' +
      '<div class="dlg-progress-meta" id="dlg-prog-meta">—</div>';
    shell.appendChild(prog);

    /* glyph rail */
    var rail = el("div", "dlg-glyph-rail");
    rail.id = "dlg-glyph-rail";
    shell.appendChild(rail);

    var layout = el("div", "dlg-layout");
    var boardWrap = el("div", "dlg-board-wrap");
    var boardTop = el("div", "dlg-board-top");
    var prompt = el("div", "dlg-prompt");
    prompt.innerHTML = "Load codex…";
    var controls = el("div", "dlg-controls");
    var btnPlay = el("button", "primary", "Start codex pass");
    var btnFinale = el("button", "", "Finale path");
    btnFinale.disabled = true;
    var btnN8 = el("button", "", "8×8");
    var btnN12 = el("button", "on", "12×12");
    var btnN16 = el("button", "", "16×16");
    controls.appendChild(btnPlay);
    controls.appendChild(btnFinale);
    controls.appendChild(btnN8);
    controls.appendChild(btnN12);
    controls.appendChild(btnN16);
    boardTop.appendChild(prompt);
    boardTop.appendChild(controls);
    boardWrap.appendChild(boardTop);

    var boardHost = el("div", "dlg-board-host");
    var board = el("div", "dlg-board");
    var pathSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    pathSvg.setAttribute("class", "dlg-path-svg");
    pathSvg.setAttribute("viewBox", "0 0 100 100");
    pathSvg.setAttribute("preserveAspectRatio", "none");
    boardHost.appendChild(board);
    boardHost.appendChild(pathSvg);
    boardWrap.appendChild(boardHost);

    var layerRail = el("div", "dlg-layer-rail");
    boardWrap.appendChild(layerRail);
    layout.appendChild(boardWrap);

    var side = el("div", "dlg-side");
    var cardX = el("div", "dlg-card");
    cardX.innerHTML = "<h3>Letter cross-ref</h3>";
    var xrefHost = el("div");
    cardX.appendChild(xrefHost);
    side.appendChild(cardX);
    var cardD = el("div", "dlg-card");
    cardD.innerHTML = "<h3>Document gateway</h3>";
    var docHost = el("div", "dlg-doc", "Hit ordered glyphs to walk the codex.");
    cardD.appendChild(docHost);
    var gate = el("div", "dlg-gateway");
    cardD.appendChild(gate);
    side.appendChild(cardD);
    var cardL = el("div", "dlg-card");
    cardL.innerHTML = "<h3>Session log</h3>";
    var logHost = el("div", "dlg-log");
    cardL.appendChild(logHost);
    side.appendChild(cardL);
    layout.appendChild(side);
    shell.appendChild(layout);
    root.appendChild(shell);

    function metric(v, lab) {
      var wrap = el("div", "dlg-metric");
      var b = el("b", "", v);
      var s = el("span", "", lab);
      wrap.appendChild(b);
      wrap.appendChild(s);
      return { wrap: wrap, b: b };
    }

    function slog(msg) {
      state.logs.unshift(new Date().toLocaleTimeString() + " · " + msg);
      if (state.logs.length > 50) state.logs.pop();
      logHost.textContent = state.logs.join("\n");
    }

    function ntpmNow() {
      var t0 = Date.now() - 60000;
      var net = 0;
      state.events.forEach(function (e) {
        if (e.t >= t0) net += e.ok ? 1 : -1;
      });
      return net;
    }

    function refreshScore() {
      var ntpm = ntpmNow();
      var bps = bpsFromNtpm(ntpm, state.N);
      if (bps > state.peakBps) {
        state.peakBps = bps;
        state.peakNtpm = ntpm;
      }
      mBps.b.textContent = bps.toFixed(2);
      mNtpm.b.textContent = String(ntpm);
      mProg.b.textContent = state.masterPos + "/" + state.master.length;
      var layer = Math.floor(state.masterPos / Math.max(1, state.N * state.N));
      var layers = Math.ceil(state.master.length / Math.max(1, state.N * state.N));
      mLayer.b.textContent = Math.min(layer + 1, layers) + "/" + layers;
      var fill = document.getElementById("dlg-prog-fill");
      var meta = document.getElementById("dlg-prog-meta");
      var pct = state.master.length ? (100 * state.masterPos) / state.master.length : 0;
      if (fill) fill.style.width = Math.min(100, pct).toFixed(2) + "%";
      if (meta) {
        meta.textContent =
          state.mode === "finale"
            ? "FINALE · wandering path " + state.pathStep + "/" + state.path.length
            : "Codex " +
              pct.toFixed(1) +
              "% · layer " +
              (layer + 1) +
              "/" +
              layers +
              " · next gi=" +
              state.masterPos;
      }
    }

    function paintGlyphRail() {
      rail.innerHTML = "";
      var start = Math.max(0, state.masterPos - 4);
      var end = Math.min(state.master.length, start + GLYPH_RAIL);
      for (var gi = start; gi < end; gi++) {
        var g = state.master[gi];
        var chip = el("span", "dlg-gchip", g.display);
        if (gi < state.masterPos) chip.classList.add("done");
        if (gi === state.masterPos) chip.classList.add("next");
        chip.title = g.lineId + " · #" + gi;
        rail.appendChild(chip);
      }
    }

    function paintLayerRail() {
      layerRail.innerHTML = "";
      var need = state.N * state.N;
      var layers = Math.ceil(state.master.length / need) || 1;
      for (var L = 0; L < layers; L++) {
        var b = el("button", "", "L" + (L + 1));
        var done = (L + 1) * need <= state.masterPos;
        var cur = L === Math.floor(state.masterPos / need) && state.mode === "codex";
        if (done) b.classList.add("done");
        if (cur) b.classList.add("active");
        b.disabled = !done && !cur && L * need > state.masterPos;
        (function (layerIdx) {
          b.onclick = function () {
            var curLayer = Math.floor(state.masterPos / need);
            /* only visit layers already reached (or current) */
            if (layerIdx > curLayer) return;
            state.layerStart = layerIdx * need;
            dealCodexBoard({ keepLayer: true });
          };
        })(L);
        layerRail.appendChild(b);
      }
    }

    /**
     * Deal N×N window from master stream.
     * opts.keepLayer — preserve state.layerStart (layer-rail peek at past windows).
     */
    function dealCodexBoard(opts) {
      opts = opts || {};
      var need = state.N * state.N;
      if (!opts.keepLayer) {
        state.layerStart = Math.floor(state.masterPos / need) * need;
      }
      if (state.layerStart < 0) state.layerStart = 0;
      state.cells = layerWindow(state.master, state.layerStart, state.N);
      /* target only when next glyph sits inside this layer window */
      if (
        state.masterPos >= state.layerStart &&
        state.masterPos < state.layerStart + need &&
        state.masterPos < state.master.length
      ) {
        state.targetIdx = state.masterPos - state.layerStart;
      } else {
        state.targetIdx = -1;
      }
      paintBoard();
      paintGlyphRail();
      paintLayerRail();
      paintPathSvg(false);
      if (state.masterPos < state.master.length) {
        var g = state.master[state.masterPos];
        var viewLayer = Math.floor(state.layerStart / need) + 1;
        var playLayer = Math.floor(state.masterPos / need) + 1;
        var peek =
          viewLayer !== playLayer
            ? " · viewing L" + viewLayer + " (play L" + playLayer + ")"
            : "";
        prompt.innerHTML =
          "Next glyph <em>" +
          g.display +
          "</em> · " +
          g.lineId +
          " · master #" +
          g.gi +
          " · layer " +
          playLayer +
          peek;
        paintXref(g.ch.toUpperCase());
        openLine(g.lineId, g.ch.toUpperCase());
      } else {
        prompt.innerHTML = "Codex complete · start <b>finale wandering path</b>";
        btnFinale.disabled = false;
        btnFinale.classList.add("primary");
      }
      refreshScore();
    }

    function paintBoard() {
      board.innerHTML = "";
      board.style.gridTemplateColumns = "repeat(" + state.N + ", 1fr)";
      state.cells.forEach(function (c, idx) {
        var cell = el("button", "dlg-cell", c.display || "·");
        cell.type = "button";
        if (c.pad) cell.classList.add("is-pad");
        if (state.mode === "codex") {
          if (c.gi >= 0 && c.gi < state.masterPos) cell.classList.add("is-hit");
          if (idx === state.targetIdx) cell.classList.add("is-target");
        } else if (state.mode === "finale") {
          var pidx = state.path.indexOf(idx);
          if (pidx >= 0 && pidx < state.pathStep) cell.classList.add("is-hit");
          if (pidx === state.pathStep) cell.classList.add("is-target", "is-path-head");
          if (pidx > state.pathStep) cell.classList.add("is-path-future");
        }
        cell.dataset.idx = String(idx);
        cell.onclick = function () {
          onCell(idx);
        };
        board.appendChild(cell);
      });
    }

    function paintPathSvg(show) {
      while (pathSvg.firstChild) pathSvg.removeChild(pathSvg.firstChild);
      if (!show || state.mode !== "finale" || !state.path.length) {
        pathSvg.style.opacity = "0";
        return;
      }
      pathSvg.style.opacity = "1";
      var N = state.N;
      var pts = [];
      for (var i = 0; i <= Math.min(state.pathStep, state.path.length - 1); i++) {
        var idx = state.path[i];
        var cx = (idx % N) + 0.5;
        var cy = Math.floor(idx / N) + 0.5;
        pts.push(((cx / N) * 100).toFixed(2) + "," + ((cy / N) * 100).toFixed(2));
      }
      if (pts.length < 2) return;
      var poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      poly.setAttribute("points", pts.join(" "));
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", "rgba(10,132,255,0.85)");
      poly.setAttribute("stroke-width", "1.2");
      poly.setAttribute("stroke-linecap", "round");
      poly.setAttribute("stroke-linejoin", "round");
      pathSvg.appendChild(poly);
    }

    function paintXref(letter) {
      xrefHost.innerHTML = "";
      var head = el("p");
      head.innerHTML = "Letter <em style='color:#0a84ff;font-style:normal;font-weight:700'>" + letter + "</em>";
      xrefHost.appendChild(head);
      var arr = state.xref[letter] || [];
      var byLine = {};
      arr.forEach(function (e) {
        byLine[e.lineId] = (byLine[e.lineId] || 0) + 1;
      });
      var ul = el("ul", "dlg-xref-list");
      Object.keys(byLine)
        .sort()
        .forEach(function (id) {
          var li = el("li");
          li.innerHTML =
            '<span class="lid">' +
            id +
            '</span><span class="cnt">×' +
            byLine[id] +
            "</span>";
          li.onclick = function () {
            openLine(id, letter);
          };
          ul.appendChild(li);
        });
      xrefHost.appendChild(ul);
      var tot = el("p");
      tot.style.fontSize = "0.72rem";
      tot.style.opacity = "0.75";
      tot.textContent = "document total ×" + arr.length + " · master stream " + state.master.length;
      xrefHost.appendChild(tot);
    }

    function openLine(lineId, letter) {
      state.focusLine = lineId;
      var ln = state.lineMap[lineId];
      if (!ln) {
        docHost.textContent = "Missing " + lineId;
        return;
      }
      var html = "<div><b>" + lineId + "</b> · " + (ln.kind || "") + "</div>";
      var text = ln.text || "";
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (letter && ch.toUpperCase() === letter) html += "<mark>" + escapeHtml(ch) + "</mark>";
        else html += escapeHtml(ch);
      }
      docHost.innerHTML = html;
      gate.innerHTML = "";
      [
        ["index.html", "Archive"],
        ["versions.html", "Layers"],
        ["scribe-glyphs.html", "Glyphs"],
        ["stroke-player.html", "Strokes"],
        ["cage-litmus.html", "Cage litmus"],
      ].forEach(function (pair) {
        var a = el("a", "");
        a.href = pair[0];
        a.textContent = pair[1];
        gate.appendChild(a);
      });
    }

    function escapeHtml(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function onCell(idx) {
      var now = Date.now();
      if (state.mode === "finale") {
        var expect = state.path[state.pathStep];
        var ok = idx === expect;
        state.events.push({ t: now, ok: ok });
        if (ok) {
          state.pathStep++;
          state.hits.push({ t: now, mode: "finale", idx: idx });
          slog("path " + state.pathStep + "/" + state.path.length);
          if (state.pathStep >= state.path.length) {
            slog("FINALE COMPLETE · full wandering path");
            prompt.innerHTML = "<b>Finale complete</b> · entire document path walked";
            try {
              global.dispatchEvent(
                new CustomEvent("kbatch-declaration-finale", {
                  detail: { ver: VER, hits: state.hits.length, master: state.master.length },
                })
              );
            } catch (e) {}
          }
          paintBoard();
          paintPathSvg(true);
        } else {
          slog("path miss");
        }
        refreshScore();
        reportTrial(ok, "finale");
        return;
      }

      /* codex ordered */
      var ok = idx === state.targetIdx && state.masterPos < state.master.length;
      state.events.push({ t: now, ok: ok });
      if (ok) {
        var g = state.master[state.masterPos];
        state.hits.push({ t: now, gi: g.gi, ch: g.ch, lineId: g.lineId });
        state.masterPos++;
        slog("glyph #" + g.gi + " " + g.display + " @ " + g.lineId);
        if (state.masterPos >= state.master.length) {
          slog("CODEX COMPLETE · " + state.master.length + " glyphs · unlock finale");
          btnFinale.disabled = false;
          btnFinale.classList.add("primary");
          prompt.innerHTML = "Codex complete · press <b>Finale path</b>";
          try {
            global.dispatchEvent(
              new CustomEvent("kbatch-declaration-codex-complete", {
                detail: { ver: VER, master: state.master.length },
              })
            );
          } catch (e2) {}
        }
        dealCodexBoard();
      } else {
        slog("miss · need master #" + state.masterPos);
        var nodes = board.querySelectorAll(".dlg-cell");
        if (nodes[idx]) {
          nodes[idx].classList.add("is-miss");
          setTimeout(function () {
            nodes[idx] && nodes[idx].classList.remove("is-miss");
          }, 160);
        }
      }
      refreshScore();
      reportTrial(ok, "codex");
    }

    function reportTrial(ok, mode) {
      var row = {
        kind: "declaration_letter_grid",
        ver: VER,
        t: Date.now(),
        ok: ok,
        mode: mode || state.mode,
        masterPos: state.masterPos,
        masterTotal: state.master.length,
        N: state.N,
        bps: bpsFromNtpm(ntpmNow(), state.N),
        ntpm: ntpmNow(),
        peakBps: state.peakBps,
        pathStep: state.pathStep,
      };
      try {
        var key = "kbatch.declaration.letterGrid.trials";
        var prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.push(row);
        if (prev.length > 400) prev = prev.slice(-400);
        localStorage.setItem(key, JSON.stringify(prev));
      } catch (e) {}
      try {
        fetch("http://127.0.0.1:9880/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        }).catch(function () {});
      } catch (e2) {}
    }

    function startFinale() {
      if (state.masterPos < state.master.length && !opts.forceFinale) {
        slog("finish codex first (" + state.masterPos + "/" + state.master.length + ")");
        return;
      }
      state.mode = "finale";
      state.path = wanderingPathIndices(state.N);
      state.pathStep = 0;
      /* map path cells to sequential master glyphs (wrap) */
      var need = state.N * state.N;
      state.cells = [];
      for (var k = 0; k < need; k++) {
        var gi = k % Math.max(1, state.master.length);
        var g = state.master[gi] || {
          ch: "·",
          display: "·",
          lineId: "—",
          gi: -1,
          pad: true,
        };
        state.cells.push(Object.assign({}, g, { pad: false }));
      }
      /* reorder display by path: cell at path[i] shows master[i] */
      var display = new Array(need);
      for (var i = 0; i < need; i++) {
        var gi2 = i % Math.max(1, state.master.length);
        display[state.path[i]] = Object.assign({}, state.master[gi2], { pathOrder: i });
      }
      state.cells = display;
      prompt.innerHTML = "Finale · follow the <em>wandering path</em> in order (blue head)";
      paintBoard();
      paintPathSvg(true);
      paintGlyphRail();
      slog("FINALE start path len " + state.path.length);
      refreshScore();
    }

    btnPlay.onclick = function () {
      state.mode = "codex";
      state.playing = true;
      if (state.masterPos >= state.master.length) {
        state.masterPos = 0;
        state.hits = [];
        state.events = [];
      }
      dealCodexBoard();
      slog("codex pass · " + state.master.length + " master glyphs");
    };
    btnFinale.onclick = function () {
      startFinale();
    };
    function setN(n, btn) {
      state.N = n;
      [btnN8, btnN12, btnN16].forEach(function (b) {
        b.classList.remove("on");
      });
      btn.classList.add("on");
      if (state.mode === "finale") startFinale();
      else dealCodexBoard();
    }
    btnN8.onclick = function () {
      setN(8, btnN8);
    };
    btnN12.onclick = function () {
      setN(12, btnN12);
    };
    btnN16.onclick = function () {
      setN(16, btnN16);
    };

    /* Prefer dense research lines if present, else full-transcript */
    var urls = [base + "/line-sections/index.json", base + "/full-transcript-lines.json"];

    return fetchJson(urls[0])
      .then(function (idx) {
        if (idx && idx.lines && idx.lines.length) {
          /* load each section file for full text — or use index + parallel */
          var files = idx.lines.map(function (L) {
            return fetchJson("/" + L.file.replace(/^\//, "")).catch(function () {
              return fetchJson(base + "/line-sections/" + L.id + ".json");
            });
          });
          return Promise.all(files).then(function (secs) {
            return secs
              .filter(Boolean)
              .map(function (s) {
                return {
                  id: s.id,
                  kind: s.kind,
                  text: s.text,
                  parentEngrossed: s.parentEngrossed,
                };
              });
          });
        }
        throw new Error("no dense index");
      })
      .catch(function () {
        return fetchJson(base + "/full-transcript-lines.json").then(function (d) {
          return d.lines || [];
        });
      })
      .then(function (lines) {
        state.lines = lines;
        state.lineMap = {};
        lines.forEach(function (ln) {
          state.lineMap[ln.id] = ln;
        });
        var built = buildMaster(lines);
        state.master = built.master;
        state.xref = built.xref;
        state.masterPos = 0;
        dealCodexBoard();
        slog(
          VER +
            " · lines " +
            lines.length +
            " · master glyphs " +
            state.master.length +
            " · layers " +
            Math.ceil(state.master.length / (state.N * state.N))
        );
        return {
          ver: VER,
          state: state,
          startCodex: function () {
            btnPlay.click();
          },
          startFinale: startFinale,
        };
      })
      .catch(function (e) {
        prompt.textContent = "Failed: " + e;
        slog(String(e));
        throw e;
      });
  }

  global.__kbatchDeclarationLetterGrid = {
    ver: VER,
    mount: mount,
    bpsFromNtpm: bpsFromNtpm,
    wanderingPathIndices: wanderingPathIndices,
  };
})(typeof window !== "undefined" ? window : globalThis);
