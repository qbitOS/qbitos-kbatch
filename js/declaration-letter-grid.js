/**
 * Declaration Letter-Grid v2 · full-document layer passes
 * · Master small glyphs in reading order through the entire codex
 * · Layer = square chunk of the master stream (WebGrid grammar)
 * · Finale = wandering path of letters across the board
 *
 * WebGrid score system (Neuralink-calibrated):
 *   BPS = max(log2(N²-1) * NTPM/60, 0)
 *   NTPM = net hits in last 60s (+1 hit, −1 miss)
 *   ROUND = 70s countdown · live "MM:SS BPS NTPM · N×N"
 *   peak card: "Your peak score: X BPS (Y NTPM)"
 * target rgb(10,132,255)
 */
(function (global) {
  "use strict";

  var VER = "declaration-letter-grid-v3-webgrid-score";
  var TARGET_RGB = "rgb(10, 132, 255)";
  /** WebGrid default round length (seconds) */
  var ROUND_S = 70;
  var DEFAULT_N = 12;
  var GLYPH_RAIL = 48;
  var BEST_KEY = "kbatch.declaration.letterGrid.best";
  var TRIALS_KEY = "kbatch.declaration.letterGrid.trials";

  function log2(x) {
    return Math.log(x) / Math.LN2;
  }

  function bpsFromNtpm(ntpm, N) {
    var cells = N * N;
    var factor = log2(Math.max(2, cells - 1));
    return Math.max(0, (factor * ntpm) / 60);
  }

  function formatTimer(msLeft) {
    var s = Math.max(0, Math.ceil(msLeft / 1000));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r;
  }

  function loadBest() {
    try {
      var j = JSON.parse(localStorage.getItem(BEST_KEY) || "null");
      if (j && typeof j.peakBps === "number") return j;
    } catch (e) {}
    return { peakBps: 0, peakNtpm: 0, hits: 0, N: 0, t: 0 };
  }

  function saveBest(row) {
    try {
      var prev = loadBest();
      if (!prev.peakBps || row.peakBps > prev.peakBps) {
        localStorage.setItem(BEST_KEY, JSON.stringify(row));
        return row;
      }
    } catch (e) {}
    return loadBest();
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
      phase: "lobby", /* lobby | playing | end */
      cells: [],
      targetIdx: -1,
      hits: [],
      events: [],
      peakBps: 0,
      peakNtpm: 0,
      playing: false,
      roundS: opts.roundS != null ? opts.roundS : ROUND_S,
      roundUntil: 0,
      roundStartedAt: 0,
      focusLine: null,
      logs: [],
      path: [],
      pathStep: 0,
      layerComplete: 0,
      missCount: 0,
      hitCount: 0,
      openCodex: false, /* true = no timer (full document walk) */
      timerHandle: null,
      best: loadBest(),
    };

    root.innerHTML = "";
    root.classList.add("dlg-root");

    var shell = el("div", "dlg-shell");
    var hero = el("div", "dlg-hero");
    var htxt = el("div");
    htxt.innerHTML =
      "<h2>Letter-Grid · Full codex + WebGrid score</h2>" +
      "<p>Master <b>small glyphs in order</b> through the Declaration. " +
      "N×N layer passes · WebGrid blue target · <b>70s timer · BPS / NTPM</b> · " +
      "clear layers → <b>finale wandering path</b>.</p>";
    hero.appendChild(htxt);

    /* WebGrid-style primary scoreboard: TIMER · BPS · NTPM · N×N */
    var boardMetrics = el("div", "dlg-scoreboard dlg-scoreboard--webgrid");
    var mTimer = metric("01:10", "timer");
    mTimer.wrap.classList.add("dlg-metric--timer");
    var mBps = metric("0.00", "BPS");
    var mNtpm = metric("0", "NTPM");
    var mGrid = metric(N + "×" + N, "grid");
    boardMetrics.appendChild(mTimer.wrap);
    boardMetrics.appendChild(mBps.wrap);
    boardMetrics.appendChild(mNtpm.wrap);
    boardMetrics.appendChild(mGrid.wrap);
    hero.appendChild(boardMetrics);

    /* secondary: glyphs · layer · peak · best */
    var boardMetrics2 = el("div", "dlg-scoreboard dlg-scoreboard--sub");
    var mProg = metric("0/0", "glyphs");
    var mLayer = metric("0", "layer");
    var mPeak = metric("0.00", "peak BPS");
    var mBest = metric(
      state.best.peakBps ? state.best.peakBps.toFixed(2) : "—",
      "best BPS"
    );
    boardMetrics2.appendChild(mProg.wrap);
    boardMetrics2.appendChild(mLayer.wrap);
    boardMetrics2.appendChild(mPeak.wrap);
    boardMetrics2.appendChild(mBest.wrap);
    hero.appendChild(boardMetrics2);

    /* Live WebGrid strip: "MM:SS BPS NTPM · N×N" */
    var liveStrip = el("div", "dlg-live-strip");
    liveStrip.id = "dlg-live-strip";
    liveStrip.setAttribute("aria-live", "polite");
    liveStrip.textContent = "01:10  0.00 BPS  0 NTPM  ·  " + N + "×" + N;
    hero.appendChild(liveStrip);
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
    var btnPlay = el("button", "primary", "Play 70s");
    var btnOpen = el("button", "", "Open codex");
    var btnFinale = el("button", "", "Finale path");
    btnFinale.disabled = true;
    var btnN8 = el("button", "", "8×8");
    var btnN12 = el("button", "on", "12×12");
    var btnN16 = el("button", "", "16×16");
    controls.appendChild(btnPlay);
    controls.appendChild(btnOpen);
    controls.appendChild(btnFinale);
    controls.appendChild(btnN8);
    controls.appendChild(btnN12);
    controls.appendChild(btnN16);
    boardTop.appendChild(prompt);
    boardTop.appendChild(controls);
    boardWrap.appendChild(boardTop);

    /* End card (WebGrid peak score) */
    var endCard = el("div", "dlg-end-card");
    endCard.hidden = true;
    endCard.innerHTML =
      '<div class="dlg-end-inner">' +
      "<h3>Round complete</h3>" +
      '<p class="dlg-peak-line" id="dlg-peak-line">Your peak score: 0.00 BPS (0 NTPM)</p>' +
      '<p class="dlg-end-meta" id="dlg-end-meta"></p>' +
      '<div class="dlg-end-actions">' +
      '<button type="button" class="primary" id="dlg-play-again">Play again</button>' +
      '<button type="button" id="dlg-end-open">Open codex</button>' +
      "</div></div>";
    boardWrap.appendChild(endCard);

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

    function msLeft() {
      if (state.openCodex || !state.playing) {
        if (state.phase === "end") return 0;
        return state.roundS * 1000;
      }
      return Math.max(0, state.roundUntil - Date.now());
    }

    function stopTimer() {
      if (state.timerHandle) {
        clearInterval(state.timerHandle);
        state.timerHandle = null;
      }
    }

    function refreshScore() {
      var ntpm = ntpmNow();
      var bps = bpsFromNtpm(ntpm, state.N);
      if (state.playing || state.phase === "end") {
        if (bps > state.peakBps) {
          state.peakBps = bps;
          state.peakNtpm = ntpm;
        }
      }
      var left = msLeft();
      var timerStr = state.openCodex && state.playing ? "OPEN" : formatTimer(left);
      mTimer.b.textContent = timerStr;
      mBps.b.textContent = bps.toFixed(2);
      mNtpm.b.textContent = String(ntpm);
      mGrid.b.textContent = state.N + "×" + state.N;
      mProg.b.textContent = state.masterPos + "/" + state.master.length;
      var layer = Math.floor(state.masterPos / Math.max(1, state.N * state.N));
      var layers = Math.ceil(state.master.length / Math.max(1, state.N * state.N));
      mLayer.b.textContent = Math.min(layer + 1, layers) + "/" + layers;
      mPeak.b.textContent = state.peakBps.toFixed(2);
      mBest.b.textContent = state.best.peakBps ? state.best.peakBps.toFixed(2) : "—";

      /* WebGrid live strip */
      liveStrip.textContent =
        timerStr +
        "  " +
        bps.toFixed(2) +
        " BPS  " +
        ntpm +
        " NTPM  ·  " +
        state.N +
        "×" +
        state.N;
      liveStrip.dataset.phase = state.phase;
      liveStrip.dataset.timer = timerStr;
      liveStrip.dataset.bps = bps.toFixed(2);
      liveStrip.dataset.ntpm = String(ntpm);

      var fill = document.getElementById("dlg-prog-fill");
      var meta = document.getElementById("dlg-prog-meta");
      var pct = state.master.length ? (100 * state.masterPos) / state.master.length : 0;
      if (fill) {
        if (state.playing && !state.openCodex) {
          var tPct = 100 * (1 - left / (state.roundS * 1000));
          fill.style.width = Math.min(100, Math.max(0, tPct)).toFixed(2) + "%";
          fill.classList.add("is-timer");
        } else {
          fill.style.width = Math.min(100, pct).toFixed(2) + "%";
          fill.classList.remove("is-timer");
        }
      }
      if (meta) {
        if (state.phase === "end") {
          meta.textContent =
            "PEAK " +
            state.peakBps.toFixed(2) +
            " BPS (" +
            state.peakNtpm +
            " NTPM) · hits " +
            state.hitCount +
            " · miss " +
            state.missCount;
        } else if (state.mode === "finale") {
          meta.textContent =
            "FINALE · path " + state.pathStep + "/" + state.path.length + " · " + timerStr;
        } else {
          meta.textContent =
            (state.playing ? "PLAYING · " : "LOBBY · ") +
            "codex " +
            pct.toFixed(1) +
            "% · L" +
            (layer + 1) +
            "/" +
            layers +
            " · " +
            timerStr;
        }
      }
      mTimer.wrap.classList.toggle("is-low", left <= 10000 && state.playing && !state.openCodex);
      mTimer.wrap.classList.toggle("is-end", state.phase === "end");
    }

    function showEndCard() {
      endCard.hidden = false;
      boardWrap.classList.add("is-ended");
      var peakLine = endCard.querySelector("#dlg-peak-line");
      var endMeta = endCard.querySelector("#dlg-end-meta");
      if (peakLine) {
        peakLine.textContent =
          "Your peak score: " +
          state.peakBps.toFixed(2) +
          " BPS (" +
          state.peakNtpm +
          " NTPM)";
      }
      if (endMeta) {
        var layers = Math.ceil(state.master.length / Math.max(1, state.N * state.N)) || 1;
        var layer = Math.floor(state.masterPos / Math.max(1, state.N * state.N));
        endMeta.textContent =
          state.N +
          "×" +
          state.N +
          " · hits " +
          state.hitCount +
          " · miss " +
          state.missCount +
          " · glyphs " +
          state.masterPos +
          "/" +
          state.master.length +
          " · layer " +
          Math.min(layer + 1, layers) +
          "/" +
          layers +
          (state.best.peakBps
            ? " · best " + state.best.peakBps.toFixed(2) + " BPS"
            : "");
      }
      btnPlay.textContent = "Play again";
      btnPlay.classList.add("primary");
    }

    function hideEndCard() {
      endCard.hidden = true;
      boardWrap.classList.remove("is-ended");
    }

    function endRound(reason) {
      if (state.phase === "end" && !state.playing) return;
      stopTimer();
      state.playing = false;
      state.phase = "end";
      state.roundUntil = Date.now();
      /* final peak snap */
      var ntpm = ntpmNow();
      var bps = bpsFromNtpm(ntpm, state.N);
      if (bps > state.peakBps) {
        state.peakBps = bps;
        state.peakNtpm = ntpm;
      }
      var bestRow = {
        peakBps: state.peakBps,
        peakNtpm: state.peakNtpm,
        hits: state.hitCount,
        miss: state.missCount,
        masterPos: state.masterPos,
        N: state.N,
        t: Date.now(),
        ver: VER,
        reason: reason || "timer",
      };
      state.best = saveBest(bestRow);
      showEndCard();
      refreshScore();
      slog(
        "ROUND END · peak " +
          state.peakBps.toFixed(2) +
          " BPS (" +
          state.peakNtpm +
          " NTPM) · " +
          (reason || "timer")
      );
      try {
        global.dispatchEvent(
          new CustomEvent("kbatch-declaration-round-end", {
            detail: {
              ver: VER,
              peakBps: state.peakBps,
              peakNtpm: state.peakNtpm,
              hits: state.hitCount,
              miss: state.missCount,
              masterPos: state.masterPos,
              N: state.N,
              reason: reason || "timer",
              best: state.best,
            },
          })
        );
      } catch (e) {}
      reportTrial(true, "round-end");
    }

    function startRound(optsRound) {
      optsRound = optsRound || {};
      stopTimer();
      hideEndCard();
      state.openCodex = !!optsRound.openCodex;
      state.mode = "codex";
      state.phase = "playing";
      state.playing = true;
      state.masterPos = 0;
      state.layerStart = 0;
      state.hits = [];
      state.events = [];
      state.peakBps = 0;
      state.peakNtpm = 0;
      state.hitCount = 0;
      state.missCount = 0;
      state.path = [];
      state.pathStep = 0;
      state.roundStartedAt = Date.now();
      if (state.openCodex) {
        state.roundUntil = 0;
        btnPlay.textContent = "Restart timed 70s";
        btnPlay.classList.remove("primary");
        btnOpen.classList.add("on");
        slog("OPEN CODEX · no timer · " + state.master.length + " glyphs");
      } else {
        state.roundUntil = Date.now() + state.roundS * 1000;
        btnPlay.textContent = "Playing…";
        btnPlay.classList.add("primary");
        btnOpen.classList.remove("on");
        slog("PLAY " + state.roundS + "s · WebGrid score · N=" + state.N);
        state.timerHandle = setInterval(function () {
          refreshScore();
          if (Date.now() >= state.roundUntil) {
            endRound("timer");
          }
        }, 100);
      }
      btnFinale.disabled = true;
      btnFinale.classList.remove("primary");
      dealCodexBoard();
      refreshScore();
      try {
        global.dispatchEvent(
          new CustomEvent("kbatch-declaration-round-start", {
            detail: {
              ver: VER,
              openCodex: state.openCodex,
              roundS: state.roundS,
              N: state.N,
            },
          })
        );
      } catch (e2) {}
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
      if (state.phase === "end") return;
      if (!state.playing && state.phase === "lobby") {
        /* first click starts timed round (WebGrid-like) */
        startRound({ openCodex: false });
      }
      if (!state.playing) return;
      if (!state.openCodex && now >= state.roundUntil) {
        endRound("timer");
        return;
      }

      if (state.mode === "finale") {
        var expect = state.path[state.pathStep];
        var okF = idx === expect;
        state.events.push({ t: now, ok: okF });
        if (okF) {
          state.pathStep++;
          state.hitCount++;
          state.hits.push({ t: now, mode: "finale", idx: idx });
          slog("path " + state.pathStep + "/" + state.path.length);
          if (state.pathStep >= state.path.length) {
            slog("FINALE COMPLETE · full wandering path");
            prompt.innerHTML = "<b>Finale complete</b> · entire document path walked";
            try {
              global.dispatchEvent(
                new CustomEvent("kbatch-declaration-finale", {
                  detail: {
                    ver: VER,
                    hits: state.hits.length,
                    master: state.master.length,
                    peakBps: state.peakBps,
                    peakNtpm: state.peakNtpm,
                  },
                })
              );
            } catch (e) {}
            if (state.openCodex) endRound("finale-complete");
          }
          paintBoard();
          paintPathSvg(true);
        } else {
          state.missCount++;
          slog("path miss");
        }
        refreshScore();
        reportTrial(okF, "finale");
        return;
      }

      /* codex ordered — target must match WebGrid blue cell */
      var ok = idx === state.targetIdx && state.masterPos < state.master.length;
      state.events.push({ t: now, ok: ok });
      if (ok) {
        var g = state.master[state.masterPos];
        state.hits.push({ t: now, gi: g.gi, ch: g.ch, lineId: g.lineId });
        state.masterPos++;
        state.hitCount++;
        slog("glyph #" + g.gi + " " + g.display + " @ " + g.lineId);
        if (state.masterPos >= state.master.length) {
          slog("CODEX COMPLETE · " + state.master.length + " glyphs · unlock finale");
          btnFinale.disabled = false;
          btnFinale.classList.add("primary");
          prompt.innerHTML = "Codex complete · press <b>Finale path</b>";
          try {
            global.dispatchEvent(
              new CustomEvent("kbatch-declaration-codex-complete", {
                detail: { ver: VER, master: state.master.length, peakBps: state.peakBps },
              })
            );
          } catch (e2) {}
        }
        dealCodexBoard();
      } else {
        state.missCount++;
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
        phase: state.phase,
        masterPos: state.masterPos,
        masterTotal: state.master.length,
        N: state.N,
        bps: bpsFromNtpm(ntpmNow(), state.N),
        ntpm: ntpmNow(),
        peakBps: state.peakBps,
        peakNtpm: state.peakNtpm,
        hitCount: state.hitCount,
        missCount: state.missCount,
        pathStep: state.pathStep,
        timer: formatTimer(msLeft()),
        openCodex: state.openCodex,
      };
      try {
        var prev = JSON.parse(localStorage.getItem(TRIALS_KEY) || "[]");
        prev.push(row);
        if (prev.length > 400) prev = prev.slice(-400);
        localStorage.setItem(TRIALS_KEY, JSON.stringify(prev));
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
      startRound({ openCodex: false });
    };
    btnOpen.onclick = function () {
      startRound({ openCodex: true });
    };
    btnFinale.onclick = function () {
      if (!state.playing && state.phase !== "end") {
        startRound({ openCodex: true });
      }
      startFinale();
    };
    endCard.querySelector("#dlg-play-again").onclick = function () {
      startRound({ openCodex: false });
    };
    endCard.querySelector("#dlg-end-open").onclick = function () {
      startRound({ openCodex: true });
    };
    function setN(n, btn) {
      state.N = n;
      [btnN8, btnN12, btnN16].forEach(function (b) {
        b.classList.remove("on");
      });
      btn.classList.add("on");
      mGrid.b.textContent = n + "×" + n;
      if (state.playing && state.mode === "finale") startFinale();
      else if (state.playing) dealCodexBoard();
      else {
        dealCodexBoard();
        refreshScore();
      }
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

    /** Live snapshot (used by API + agent; no forward ref to api object) */
    function snapshotNow() {
      var need = state.N * state.N;
      var layers = Math.ceil(state.master.length / Math.max(1, need)) || 1;
      var layer = Math.floor(state.masterPos / Math.max(1, need));
      var codexDone = state.masterPos >= state.master.length;
      var finaleDone = state.mode === "finale" && state.pathStep >= state.path.length;
      var ntpm = ntpmNow();
      var bps = bpsFromNtpm(ntpm, state.N);
      var timer = formatTimer(msLeft());
      return {
        ver: VER,
        game: "letter-grid",
        mode: state.mode,
        phase: state.phase,
        playing: state.playing,
        openCodex: state.openCodex,
        N: state.N,
        timer: timer,
        live:
          timer +
          "  " +
          bps.toFixed(2) +
          " BPS  " +
          ntpm +
          " NTPM  ·  " +
          state.N +
          "×" +
          state.N,
        masterPos: state.masterPos,
        masterTotal: state.master.length,
        layer: Math.min(layer + 1, layers),
        layers: layers,
        pathStep: state.pathStep,
        pathTotal: state.path.length || need,
        bps: bps,
        ntpm: ntpm,
        peakBps: state.peakBps,
        peakNtpm: state.peakNtpm,
        hitCount: state.hitCount,
        missCount: state.missCount,
        best: state.best,
        peakLine:
          "Your peak score: " +
          state.peakBps.toFixed(2) +
          " BPS (" +
          state.peakNtpm +
          " NTPM)",
        codexDone: codexDone,
        finaleDone: finaleDone,
        grade: finaleDone
          ? "cage"
          : codexDone
            ? "dojo"
            : state.masterPos > 0 || state.phase === "end"
              ? "in-progress"
              : "ready",
        lines: state.lines.length,
      };
    }

    /**
     * Agent play: hit blue targets as fast as paceMs allows until round ends.
     * Returns Promise resolving to peak snapshot (WebGrid-compatible fields).
     */
    function agentPlay(optsA) {
      optsA = optsA || {};
      var paceMs = optsA.paceMs != null ? optsA.paceMs : 45;
      var maxHits = optsA.maxHits != null ? optsA.maxHits : 1e9;
      var open = !!optsA.openCodex;
      startRound({ openCodex: open });
      return new Promise(function (resolve) {
        var n = 0;
        function tick() {
          if (state.phase === "end" || (!state.playing && state.phase !== "playing")) {
            resolve(snapshotNow());
            return;
          }
          if (n >= maxHits) {
            if (!state.openCodex) endRound("agent-max");
            resolve(snapshotNow());
            return;
          }
          var idx = -1;
          if (state.mode === "finale") {
            idx = state.path[state.pathStep];
          } else {
            idx = state.targetIdx;
          }
          if (idx >= 0) {
            onCell(idx);
            n++;
          }
          if (state.phase === "end") {
            resolve(snapshotNow());
            return;
          }
          setTimeout(tick, paceMs);
        }
        setTimeout(tick, 30);
      });
    }

    /**
     * Load full document lines for master stream.
     * Prefer single full-transcript (fast, complete) · fall back to dense L01–L79 sections.
     */
    return fetchJson(base + "/full-transcript-lines.json")
      .then(function (d) {
        if (d && d.lines && d.lines.length) return d.lines;
        throw new Error("empty full-transcript");
      })
      .catch(function () {
        return fetchJson(base + "/line-sections/index.json").then(function (idx) {
          if (!idx || !idx.lines || !idx.lines.length) throw new Error("no dense index");
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
        var api = {
          ver: VER,
          game: "letter-grid",
          state: state,
          ROUND_S: ROUND_S,
          startCodex: function () {
            startRound({ openCodex: true });
          },
          startTimed: function () {
            startRound({ openCodex: false });
          },
          startRound: startRound,
          endRound: endRound,
          startFinale: startFinale,
          agentPlay: agentPlay,
          setN: function (n) {
            n = Number(n) || 12;
            if (n === 8) setN(8, btnN8);
            else if (n === 16) setN(16, btnN16);
            else setN(12, btnN12);
          },
          snapshot: snapshotNow,
          /** Agent-friendly: click board index (0..N²-1) as human would */
          clickCell: function (idx) {
            onCell(Number(idx));
            return snapshotNow();
          },
          trialsKey: TRIALS_KEY,
          bestKey: BEST_KEY,
        };
        try {
          global.__letterGridApi = api;
        } catch (e3) {}

        /* Autotest / agent: ?autotest=1 | ?mg_autoplay=1 | opts.autoplay */
        var wantAuto = !!opts.autoplay;
        try {
          if (/[?&](autotest|mg_autoplay)=1\b/i.test(location.search || "")) wantAuto = true;
        } catch (e4) {}
        if (wantAuto) {
          setTimeout(function () {
            agentPlay({ paceMs: opts.paceMs || 40 }).then(function (snap) {
              slog(
                "AUTO peak " +
                  snap.peakBps.toFixed(2) +
                  " BPS (" +
                  snap.peakNtpm +
                  " NTPM) · " +
                  snap.live
              );
              try {
                global.dispatchEvent(
                  new CustomEvent("kbatch-declaration-agent-done", { detail: snap })
                );
              } catch (e5) {}
            });
          }, 200);
        }

        return api;
      })
      .catch(function (e) {
        prompt.textContent = "Failed: " + e;
        slog(String(e));
        throw e;
      });
  }

  global.__kbatchDeclarationLetterGrid = {
    ver: VER,
    ROUND_S: ROUND_S,
    mount: mount,
    bpsFromNtpm: bpsFromNtpm,
    formatTimer: formatTimer,
    wanderingPathIndices: wanderingPathIndices,
  };
})(typeof window !== "undefined" ? window : globalThis);
