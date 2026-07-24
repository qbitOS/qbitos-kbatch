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

  var VER = "declaration-letter-grid-v8-pipe";
  var TARGET_RGB = "rgb(10, 132, 255)";
  /** WebGrid default round length (seconds) */
  var ROUND_S = 70;
  var DEFAULT_N = 12;
  var DEFAULT_HOP_MS = 120; /* human play default — always readable */
  var MIN_HOP_MS = 1; /* agent / turbo floor */
  var GLYPH_RAIL = 48;
  /**
   * Contrail layers — hairline, edition-native (not neon glow).
   * Human play first: board glyphs stay legible; trails are quiet guides.
   */
  var CONTRAIL_MODES = [
    { id: "word", label: "Word firsts", color: "rgba(63,185,80,0.45)", width: 0.55 },
    { id: "sentence", label: "Sentence", color: "rgba(210,153,34,0.4)", width: 0.7 },
    { id: "same", label: "Same letter", color: "rgba(88,166,255,0.42)", width: 0.55 },
  ];
  var SPEED_PRESETS = [
    { id: "human", label: "120ms", ms: 120 },
    { id: "fast", label: "60ms", ms: 60 },
    { id: "rapid", label: "30ms", ms: 30 },
    { id: "turbo", label: "12ms", ms: 12 },
    { id: "max", label: "max", ms: 1 },
  ];
  var BEST_KEY = "kbatch.declaration.letterGrid.best";
  var TRIALS_KEY = "kbatch.declaration.letterGrid.trials";
  var LAST_REPORT_KEY = "kbatch.declaration.letterGrid.lastReport";
  var REPORT_KEY = "kbatch.declaration.letterGrid.reports";

  function log2(x) {
    return Math.log(x) / Math.LN2;
  }

  function bpsFactor(N) {
    return log2(Math.max(2, N * N - 1));
  }

  function bpsFromNtpm(ntpm, N) {
    return Math.max(0, (bpsFactor(N) * ntpm) / 60);
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

  /**
   * Growth stair S0–S7 — hit-count unlocks (MG timed-first / sudoku report style).
   * After S7 the rest of the round hammers the full document stream.
   * Also stores landmark glyph index for document cross-ref.
   */
  function buildGrowthStair(master) {
    /* Classic timed-first milestones (hits cumulative) */
    var stages = [
      { id: "S0", label: "Title", hitsNeed: 1 },
      { id: "S1", label: "Preamble", hitsNeed: 8 },
      { id: "S2", label: "Self-evident", hitsNeed: 12 },
      { id: "S3", label: "Grievances 1–6", hitsNeed: 16 },
      { id: "S4", label: "Grievances 7–15", hitsNeed: 20 },
      { id: "S5", label: "Grievances 16–27", hitsNeed: 24 },
      { id: "S6", label: "Close", hitsNeed: 28 },
      { id: "S7", label: "Full codex", hitsNeed: 32 },
    ];
    /* Attach document landmark gi for each band (for xref / narrative) */
    var landmarks = {
      S0: -1,
      S1: -1,
      S2: -1,
      S3: -1,
      S4: -1,
      S5: -1,
      S6: -1,
      S7: master.length,
    };
    var griev = [];
    for (var i = 0; i < master.length; i++) {
      var g = master[i];
      var kind = g.kind || "";
      var lid = g.lineId || "";
      if (landmarks.S0 < 0 && (kind === "title" || lid === "L01")) landmarks.S0 = i;
      if (landmarks.S1 < 0 && (kind === "subtitle" || lid === "L02" || lid === "L03"))
        landmarks.S1 = i;
      if (landmarks.S2 < 0 && kind === "body" && lid >= "L07" && lid <= "L17")
        landmarks.S2 = i;
      if (kind === "grievance") {
        if (!griev.length || griev[griev.length - 1].lineId !== lid)
          griev.push({ lineId: lid, gi: i });
      }
      if (landmarks.S6 < 0 && (kind === "closing" || kind === "signature"))
        landmarks.S6 = i;
    }
    if (landmarks.S0 < 0) landmarks.S0 = 0;
    if (landmarks.S1 < 0) landmarks.S1 = landmarks.S0;
    if (landmarks.S2 < 0) landmarks.S2 = landmarks.S1;
    if (griev.length) {
      landmarks.S3 = griev[0].gi;
      landmarks.S4 = griev[Math.min(6, griev.length - 1)].gi;
      landmarks.S5 = griev[Math.min(15, griev.length - 1)].gi;
    } else {
      landmarks.S3 = landmarks.S2;
      landmarks.S4 = landmarks.S2;
      landmarks.S5 = landmarks.S2;
    }
    if (landmarks.S6 < 0) landmarks.S6 = Math.floor(master.length * 0.9);
    stages.forEach(function (st) {
      st.gi = landmarks[st.id] != null ? landmarks[st.id] : 0;
    });
    return stages;
  }

  function hitRatePct(hits, misses) {
    var t = hits + misses;
    if (!t) return 0;
    return (100 * hits) / t;
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
    var prevWasLetter = false;
    var sentenceArmed = true; /* first letter of doc is sentence start */
    lines.forEach(function (ln) {
      var text = ln.text || "";
      /* new line often continues sentence; arm if previous ended with .!? or empty */
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (/[.!?]/.test(ch)) {
          sentenceArmed = true;
          prevWasLetter = false;
          continue;
        }
        if (!/[A-Za-z]/.test(ch)) {
          if (/\s/.test(ch) || /[,;:—–\-]/.test(ch)) prevWasLetter = false;
          continue;
        }
        var gi = master.length;
        var wordStart = !prevWasLetter;
        var sentenceStart = sentenceArmed;
        if (sentenceStart) sentenceArmed = false;
        prevWasLetter = true;
        var entry = {
          gi: gi,
          lineId: ln.id,
          i: i,
          ch: ch,
          display: ch,
          kind: ln.kind || "body",
          parent: ln.parentEngrossed || ln.id,
          wordStart: wordStart,
          sentenceStart: sentenceStart,
          letterKey: ch.toUpperCase(),
        };
        master.push(entry);
        var key = entry.letterKey;
        if (!xref[key]) xref[key] = [];
        xref[key].push({
          lineId: ln.id,
          i: i,
          ch: ch,
          gi: gi,
          wordStart: wordStart,
          sentenceStart: sentenceStart,
        });
      }
      /* soft sentence arm at end of title-like short lines */
      if ((ln.kind === "title" || ln.kind === "subtitle") && text.length) {
        sentenceArmed = true;
        prevWasLetter = false;
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
      hopMs: opts.hopMs != null ? opts.hopMs : DEFAULT_HOP_MS,
      stair: [],
      stairUnlocks: [], /* { id, label, tMs, hits, gi } */
      finalBps: 0,
      finalNtpm: 0,
      lastReport: null,
      agentMode: false,
      /* human-readable defaults: word trail on, sentence on, same-letter off (opt-in) */
      contrail: {
        word: true,
        sentence: true,
        same: false,
      },
      contrailFocusLetter: null, /* override; else target glyph letter */
      contrailPts: { word: [], sentence: [], same: [] },
      cellNodes: null, /* reused DOM buttons for high-speed updates */
      boardKey: "", /* N|layerStart|mode cache key */
      contrailRaf: 0,
      glyphRaf: 0,
      highSpeed: false, /* hop ≤ 40ms: skip heavy paint */
      lastContrailPub: 0,
      /* Grok / Dojo / Colossus pipe */
      dojoMode: false, /* no timer · step glyph-by-glyph */
      layerClears: [], /* { layer, at, masterPos, bps, ntpm, hits } */
      pipeLog: [], /* compact agent events for Colossus */
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
    /* speed presets for casual + agent */
    var speedHost = el("span", "dlg-speed-presets");
    SPEED_PRESETS.forEach(function (sp) {
      var b = el("button", sp.ms === DEFAULT_HOP_MS ? "on dlg-speed" : "dlg-speed", sp.label);
      b.type = "button";
      b.dataset.hop = String(sp.ms);
      b.title = "Hop " + sp.ms + "ms";
      b.onclick = function () {
        state.hopMs = sp.ms;
        state.highSpeed = sp.ms <= 40;
        boardHost.classList.toggle("is-turbo", state.highSpeed);
        speedHost.querySelectorAll("button").forEach(function (x) {
          x.classList.remove("on");
        });
        b.classList.add("on");
        slog("speed hop " + sp.ms + "ms" + (state.highSpeed ? " · turbo paint" : ""));
      };
      speedHost.appendChild(b);
    });
    controls.appendChild(speedHost);
    boardTop.appendChild(prompt);
    boardTop.appendChild(controls);
    boardWrap.appendChild(boardTop);

    /* Contrail layer toggles — word firsts → sentence jumps → same letter */
    var contrailBar = el("div", "dlg-contrail-bar");
    contrailBar.setAttribute("role", "group");
    contrailBar.setAttribute("aria-label", "Contrail layers");
    var contrailBtns = {};
    CONTRAIL_MODES.forEach(function (m) {
      var on = !!state.contrail[m.id];
      var b = el("button", "dlg-contrail-chip" + (on ? " on" : ""), m.label);
      b.type = "button";
      b.dataset.contrail = m.id;
      b.title =
        m.id === "word"
          ? "Quiet hairline through first letter of each word (readable)"
          : m.id === "sentence"
            ? "Faint dashed links between sentence starts"
            : "Opt-in: link cells matching focus letter (can clutter — off by default)";
      b.onclick = function () {
        state.contrail[m.id] = !state.contrail[m.id];
        b.classList.toggle("on", state.contrail[m.id]);
        scheduleContrails();
        paintBoard(false);
      };
      contrailBtns[m.id] = b;
      contrailBar.appendChild(b);
    });
    var contrailMeta = el(
      "span",
      "dlg-contrail-meta",
      "hairlines · human play · same letter opt-in"
    );
    contrailBar.appendChild(contrailMeta);
    boardWrap.appendChild(contrailBar);

    /* End card: WebGrid peak + score table + growth stair (MG-ready report) */
    var endCard = el("div", "dlg-end-card");
    endCard.hidden = true;
    endCard.innerHTML =
      '<div class="dlg-end-inner dlg-end-inner--report">' +
      '<h3 id="dlg-score-title">Score</h3>' +
      '<p class="dlg-peak-line" id="dlg-peak-line">Your peak score: 0.00 BPS (0 NTPM)</p>' +
      '<div class="dlg-score-table-wrap" id="dlg-score-table-wrap"></div>' +
      '<p class="dlg-bps-note" id="dlg-bps-note"></p>' +
      '<h4 class="dlg-stair-heading">Growth stair</h4>' +
      '<div class="dlg-stair-table-wrap" id="dlg-stair-table-wrap"></div>' +
      '<p class="dlg-end-meta" id="dlg-end-meta"></p>' +
      '<div class="dlg-end-actions">' +
      '<button type="button" class="primary" id="dlg-play-again">Play again</button>' +
      '<button type="button" id="dlg-end-open">Open codex</button>' +
      '<button type="button" id="dlg-copy-report" title="Copy markdown report">Copy report</button>' +
      "</div></div>";
    boardWrap.appendChild(endCard);

    /* Side-panel live report (always available for MG scrape) */
    var cardReport = el("div", "dlg-card dlg-card--report");
    cardReport.innerHTML = "<h3>Score report</h3>";
    var reportHost = el("div", "dlg-report-host");
    reportHost.id = "dlg-report-host";
    reportHost.innerHTML =
      '<p class="dlg-report-placeholder">Play a 70s round to fill the score table.</p>';
    cardReport.appendChild(reportHost);
    /* insert report card at top of side after layout built — appended later */

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
    side.appendChild(cardReport);
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

    function noteStairProgress() {
      if (!state.stair.length || !state.roundStartedAt) return;
      var tMs = Date.now() - state.roundStartedAt;
      var unlocked = {};
      state.stairUnlocks.forEach(function (u) {
        unlocked[u.id] = true;
      });
      for (var i = 0; i < state.stair.length; i++) {
        var st = state.stair[i];
        if (unlocked[st.id]) continue;
        var need = st.hitsNeed != null ? st.hitsNeed : i + 1;
        if (state.hitCount < need) continue;
        state.stairUnlocks.push({
          id: st.id,
          label: st.label,
          tMs: tMs,
          hits: state.hitCount,
          gi: st.gi,
          hitsNeed: need,
        });
        slog(
          "STAIR " +
            st.id +
            " " +
            st.label +
            " · +" +
            (tMs / 1000).toFixed(1) +
            "s · hits " +
            state.hitCount
        );
      }
    }

    function buildScoreReport(reason) {
      var ntpm = ntpmNow();
      var bps = bpsFromNtpm(ntpm, state.N);
      var hits = state.hitCount;
      var misses = state.missCount;
      var rate = hitRatePct(hits, misses);
      var elapsedMs = state.roundStartedAt
        ? Math.max(0, (state.phase === "end" ? state.roundUntil || Date.now() : Date.now()) - state.roundStartedAt)
        : 0;
      if (state.phase === "end" && !state.openCodex) {
        elapsedMs = Math.min(elapsedMs, state.roundS * 1000);
      }
      var factor = bpsFactor(state.N);
      var factor30 = bpsFactor(30);
      var hop = state.hopMs;
      var title =
        "Score (" +
        state.roundS +
        "s · " +
        state.N +
        "×" +
        state.N +
        " · hop ~" +
        hop +
        "ms)";
      var stairRows = state.stairUnlocks.map(function (u) {
        return {
          id: u.id,
          label: u.label,
          tSec: +(u.tMs / 1000).toFixed(1),
          tLabel: "+" + (u.tMs / 1000).toFixed(1) + "s",
          hits: u.hits,
          unlock: u.id + " " + u.label,
        };
      });
      var report = {
        kind: "letter_grid_score",
        game: "letter-grid",
        ver: VER,
        title: title,
        at: new Date().toISOString(),
        reason: reason || "timer",
        durationS: +(elapsedMs / 1000).toFixed(1),
        roundS: state.roundS,
        N: state.N,
        grid: state.N + "×" + state.N,
        hopMs: hop,
        agent: !!state.agentMode,
        /* table metrics (sudoku / MG style) */
        metrics: {
          hits: hits,
          misses: misses,
          hitRate: +rate.toFixed(1),
          hitRateLabel: rate.toFixed(1) + "%",
          peakBps: +state.peakBps.toFixed(2),
          peakNtpm: state.peakNtpm,
          finalBps: +bps.toFixed(2),
          finalNtpm: ntpm,
        },
        hits: hits,
        misses: misses,
        hitRate: +rate.toFixed(1),
        peakBps: +state.peakBps.toFixed(2),
        peakNtpm: state.peakNtpm,
        finalBps: +bps.toFixed(2),
        finalNtpm: ntpm,
        peakLine:
          "Your peak score: " +
          state.peakBps.toFixed(2) +
          " BPS (" +
          state.peakNtpm +
          " NTPM)",
        live:
          formatTimer(msLeft()) +
          "  " +
          bps.toFixed(2) +
          " BPS  " +
          ntpm +
          " NTPM  ·  " +
          state.N +
          "×" +
          state.N,
        bpsNote:
          "BPS is lower than WebGrid 30×30 by design: factor ≈ log₂(" +
          (state.N * state.N - 1) +
          ") ≈ " +
          factor.toFixed(2) +
          " vs ~" +
          factor30.toFixed(2) +
          " on 30×30.",
        factor: +factor.toFixed(4),
        factor30: +factor30.toFixed(4),
        growthStair: stairRows,
        unlocked: stairRows.map(function (r) {
          return r.id;
        }),
        masterPos: state.masterPos,
        masterTotal: state.master.length,
        layer: Math.floor(state.masterPos / Math.max(1, state.N * state.N)) + 1,
        layers: Math.ceil(state.master.length / Math.max(1, state.N * state.N)) || 1,
        best: state.best,
        /* MG activity-leaderboard / agent_end shape */
        mg: {
          kind: "letter-grid",
          peak: { bps: state.peakBps, ntpm: state.peakNtpm },
          bestBps: state.peakBps,
          bestNtpm: state.peakNtpm,
          final: { bps: bps, ntpm: ntpm },
          clicks: hits + misses,
          hitsGuess: hits,
          missGuess: misses,
          N: state.N,
          grid: state.N + "x" + state.N,
          timer: formatTimer(msLeft()),
          hopMs: hop,
          durationS: +(elapsedMs / 1000).toFixed(1),
        },
      };
      report.markdown = formatReportMarkdown(report);
      report.tableHtml = formatScoreTableHtml(report);
      report.stairHtml = formatStairTableHtml(report);
      return report;
    }

    function formatScoreTableHtml(r) {
      var m = r.metrics;
      var rows = [
        ["Hits", m.hits],
        ["Misses", m.misses],
        ["Hit rate", m.hitRateLabel],
        ["Peak BPS", m.peakBps.toFixed(2)],
        ["Peak NTPM", m.peakNtpm],
        ["Final BPS", m.finalBps.toFixed(2)],
        ["Final NTPM", m.finalNtpm],
      ];
      var html =
        '<table class="dlg-score-table" data-mg-score-table="1"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>';
      rows.forEach(function (row) {
        var hi = row[0].indexOf("Peak BPS") === 0 ? ' class="is-peak"' : "";
        html +=
          "<tr" +
          hi +
          "><td>" +
          row[0] +
          '</td><td class="num">' +
          row[1] +
          "</td></tr>";
      });
      html += "</tbody></table>";
      return html;
    }

    function formatStairTableHtml(r) {
      if (!r.growthStair || !r.growthStair.length) {
        return '<p class="dlg-report-placeholder">No stair unlocks this round.</p>';
      }
      var html =
        '<table class="dlg-stair-table" data-mg-stair-table="1"><thead><tr><th>Time</th><th>Unlock</th></tr></thead><tbody>';
      r.growthStair.forEach(function (u) {
        html +=
          "<tr><td class=\"num\">" +
          u.tLabel +
          "</td><td><b>" +
          u.id +
          "</b> " +
          u.label +
          "</td></tr>";
      });
      html += "</tbody></table>";
      return html;
    }

    function formatReportMarkdown(r) {
      var m = r.metrics;
      var lines = [
        "# Letter-Grid " + r.title,
        "",
        "**At:** " + r.at,
        "**Duration:** " + r.durationS + "s (target " + r.roundS + "s)",
        "**N:** " + r.grid + " · hop " + r.hopMs + "ms" + (r.agent ? " · agent" : ""),
        "",
        "## Score",
        "| Metric | Value |",
        "|--------|------:|",
        "| Hits | " + m.hits + " |",
        "| Misses | " + m.misses + " |",
        "| Hit rate | " + m.hitRateLabel + " |",
        "| **Peak BPS** | **" + m.peakBps.toFixed(2) + "** |",
        "| Peak NTPM | " + m.peakNtpm + " |",
        "| Final BPS | " + m.finalBps.toFixed(2) + " |",
        "| Final NTPM | " + m.finalNtpm + " |",
        "",
        r.bpsNote,
        "",
        "## Growth stair (what happened)",
        "",
      ];
      if (r.growthStair && r.growthStair.length) {
        var full = r.growthStair.filter(function (u) {
          return u.id === "S7";
        })[0];
        if (full) {
          lines.push("Full codex unlocked in ~" + full.tSec + "s:");
          lines.push("");
        }
        lines.push("| Time | Unlock |");
        lines.push("|------|--------|");
        r.growthStair.forEach(function (u) {
          lines.push("| " + u.tLabel + " | " + u.id + " " + u.label + " |");
        });
      } else {
        lines.push("_No stair unlocks recorded._");
      }
      lines.push("");
      lines.push("## Unlocked");
      lines.push((r.unlocked && r.unlocked.length ? r.unlocked : ["—"]).join(", "));
      lines.push("");
      lines.push("## Live");
      lines.push(r.live);
      lines.push("");
      lines.push("## MG");
      lines.push(
        "game=letter-grid · peak " +
          m.peakBps.toFixed(2) +
          " BPS / " +
          m.peakNtpm +
          " NTPM · " +
          r.grid +
          " · hop ~" +
          r.hopMs +
          "ms"
      );
      return lines.join("\n");
    }

    function paintReport(report) {
      if (!report) return;
      var titleEl = endCard.querySelector("#dlg-score-title");
      var peakLine = endCard.querySelector("#dlg-peak-line");
      var endMeta = endCard.querySelector("#dlg-end-meta");
      var scoreWrap = endCard.querySelector("#dlg-score-table-wrap");
      var stairWrap = endCard.querySelector("#dlg-stair-table-wrap");
      var bpsNote = endCard.querySelector("#dlg-bps-note");
      if (titleEl) titleEl.textContent = report.title;
      if (peakLine) peakLine.textContent = report.peakLine;
      if (scoreWrap) scoreWrap.innerHTML = report.tableHtml;
      if (stairWrap) stairWrap.innerHTML = report.stairHtml;
      if (bpsNote) bpsNote.textContent = report.bpsNote;
      if (endMeta) {
        endMeta.textContent =
          report.grid +
          " · glyphs " +
          report.masterPos +
          "/" +
          report.masterTotal +
          " · layer " +
          report.layer +
          "/" +
          report.layers +
          " · " +
          report.durationS +
          "s" +
          (report.best && report.best.peakBps
            ? " · best " + report.best.peakBps.toFixed(2) + " BPS"
            : "");
      }
      reportHost.innerHTML =
        "<div class=\"dlg-report-title\">" +
        report.title +
        "</div>" +
        report.tableHtml +
        '<p class="dlg-bps-note">' +
        report.bpsNote +
        "</p>" +
        '<h4 class="dlg-stair-heading">Growth stair</h4>' +
        report.stairHtml;
      reportHost.dataset.peakBps = String(report.peakBps);
      reportHost.dataset.peakNtpm = String(report.peakNtpm);
      reportHost.dataset.hits = String(report.hits);
      reportHost.dataset.live = report.live;
    }

    function publishMgReport(report) {
      if (!report) return;
      state.lastReport = report;
      try {
        localStorage.setItem(LAST_REPORT_KEY, JSON.stringify(report));
        var prev = JSON.parse(localStorage.getItem(REPORT_KEY) || "[]");
        prev.push({
          at: report.at,
          peakBps: report.peakBps,
          peakNtpm: report.peakNtpm,
          hits: report.hits,
          N: report.N,
          hopMs: report.hopMs,
        });
        if (prev.length > 40) prev = prev.slice(-40);
        localStorage.setItem(REPORT_KEY, JSON.stringify(prev));
      } catch (e) {}
      /* Memory Glass activity-leaderboard scrape surface */
      try {
        global.__mgAgentPlayLast = Object.assign({}, report.mg, {
          kind: "letter-grid",
          report: report,
          peak: report.mg.peak,
          at: report.at,
        });
        global.__mgLetterGridLast = report;
        global.__mgLetterGridReport = report;
        if (global.__mgHotPipe) {
          global.__mgHotPipe.letterGrid = report;
          global.__mgHotPipe.letterGridLast = report;
        }
      } catch (e2) {}
      try {
        global.dispatchEvent(
          new CustomEvent("kbatch-declaration-score-report", { detail: report })
        );
        global.dispatchEvent(
          new CustomEvent("mg-letter-grid-score", { detail: report })
        );
      } catch (e3) {}
      try {
        fetch("http://127.0.0.1:9880/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "letter_grid_score_report",
            ver: VER,
            report: report,
          }),
        }).catch(function () {});
      } catch (e4) {}
    }

    function showEndCard(report) {
      endCard.hidden = false;
      boardWrap.classList.add("is-ended");
      if (report) paintReport(report);
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
      var endAt = Date.now();
      if (!state.openCodex && state.roundStartedAt) {
        state.roundUntil = Math.min(endAt, state.roundStartedAt + state.roundS * 1000);
      } else {
        state.roundUntil = endAt;
      }
      /* final peak snap */
      var ntpm = ntpmNow();
      var bps = bpsFromNtpm(ntpm, state.N);
      if (bps > state.peakBps) {
        state.peakBps = bps;
        state.peakNtpm = ntpm;
      }
      state.finalBps = bps;
      state.finalNtpm = ntpm;
      noteStairProgress();
      /* S7 if codex finished during timed window */
      if (state.masterPos >= state.master.length) noteStairProgress();
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
      var report = buildScoreReport(reason || "timer");
      publishMgReport(report);
      showEndCard(report);
      refreshScore();
      slog(
        "ROUND END · peak " +
          state.peakBps.toFixed(2) +
          " BPS (" +
          state.peakNtpm +
          " NTPM) · hit " +
          report.metrics.hitRateLabel +
          " · " +
          (reason || "timer")
      );
      try {
        global.dispatchEvent(
          new CustomEvent("kbatch-declaration-round-end", {
            detail: report,
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
      state.agentMode = !!optsRound.agent;
      if (optsRound.hopMs != null) state.hopMs = optsRound.hopMs;
      state.mode = "codex";
      state.phase = "playing";
      state.playing = true;
      state.masterPos = 0;
      state.layerStart = 0;
      state.hits = [];
      state.events = [];
      state.peakBps = 0;
      state.peakNtpm = 0;
      state.finalBps = 0;
      state.finalNtpm = 0;
      state.hitCount = 0;
      state.missCount = 0;
      state.path = [];
      state.pathStep = 0;
      state.stairUnlocks = [];
      state.lastReport = null;
      state.layerClears = [];
      state.pipeLog = [];
      state.dojoMode = !!optsRound.dojo || !!optsRound.openCodex;
      state.roundStartedAt = Date.now();
      if (state.openCodex) {
        state.roundUntil = 0;
        btnPlay.textContent = "Restart timed 70s";
        btnPlay.classList.remove("primary");
        btnOpen.classList.add("on");
        slog(
          (state.dojoMode ? "DOJO · " : "OPEN CODEX · ") +
            "no timer · " +
            state.master.length +
            " glyphs"
        );
      } else {
        state.roundUntil = Date.now() + state.roundS * 1000;
        btnPlay.textContent = "Playing…";
        btnPlay.classList.add("primary");
        btnOpen.classList.remove("on");
        slog(
          "PLAY " +
            state.roundS +
            "s · " +
            state.N +
            "×" +
            state.N +
            " · hop ~" +
            state.hopMs +
            "ms"
        );
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
      noteStairProgress();
      refreshScore();
      try {
        global.dispatchEvent(
          new CustomEvent("kbatch-declaration-round-start", {
            detail: {
              ver: VER,
              openCodex: state.openCodex,
              roundS: state.roundS,
              N: state.N,
              hopMs: state.hopMs,
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
      paintBoard(!!opts.forceFull);
      scheduleGlyphRail();
      if (!state.highSpeed || opts.forceFull) paintLayerRail();
      scheduleContrails();
      if (state.masterPos < state.master.length) {
        var g = state.master[state.masterPos];
        var viewLayer = Math.floor(state.layerStart / need) + 1;
        var playLayer = Math.floor(state.masterPos / need) + 1;
        var peek =
          viewLayer !== playLayer
            ? " · viewing L" + viewLayer + " (play L" + playLayer + ")"
            : "";
        if (!state.highSpeed || state.masterPos % 4 === 0 || opts.forceFull) {
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
        } else {
          /* turbo: minimal prompt update */
          var em = prompt.querySelector("em");
          if (em) em.textContent = g.display;
          else
            prompt.innerHTML =
              "Next <em>" + g.display + "</em> · #" + g.gi + " · L" + playLayer;
        }
        state.contrailFocusLetter = g.letterKey || g.ch.toUpperCase();
        if (!state.highSpeed || opts.forceFull) {
          paintXref(g.ch.toUpperCase());
          openLine(g.lineId, g.ch.toUpperCase());
        }
      } else {
        prompt.innerHTML = "Codex complete · start <b>finale wandering path</b>";
        btnFinale.disabled = false;
        btnFinale.classList.add("primary");
      }
      refreshScore();
    }

    function scheduleContrails() {
      if (state.contrailRaf) return;
      var delay = state.highSpeed ? 2 : 0;
      state.contrailRaf = requestAnimationFrame(function () {
        state.contrailRaf = 0;
        paintContrails();
      });
      if (delay && !state.highSpeed) {
        /* no-op; rAF is enough */
      }
    }

    function scheduleGlyphRail() {
      if (state.highSpeed) {
        if (state.glyphRaf) return;
        state.glyphRaf = requestAnimationFrame(function () {
          state.glyphRaf = 0;
          if (state.masterPos % 3 === 0) paintGlyphRail();
        });
        return;
      }
      paintGlyphRail();
    }

    function focusLetter() {
      if (state.contrailFocusLetter) return state.contrailFocusLetter;
      if (state.masterPos < state.master.length) {
        var g = state.master[state.masterPos];
        return (g.letterKey || g.ch || "").toUpperCase();
      }
      return "A";
    }

    /**
     * Collect board indices for contrail layers within current N×N window.
     * Returns { word:[idx], sentence:[idx], same:[idx] } in reading order.
     */
    function contrailIndicesOnBoard() {
      var N = state.N;
      var out = { word: [], sentence: [], same: [] };
      var letter = focusLetter();
      state.cells.forEach(function (c, idx) {
        if (c.pad || c.gi < 0) return;
        if (c.wordStart) out.word.push(idx);
        if (c.sentenceStart) out.sentence.push(idx);
        if (
          letter &&
          (c.letterKey || (c.ch && c.ch.toUpperCase())) === letter
        ) {
          out.same.push(idx);
        }
      });
      return out;
    }

    function idxToSvgPt(idx, N) {
      var cx = (idx % N) + 0.5;
      var cy = Math.floor(idx / N) + 0.5;
      return {
        x: (cx / N) * 100,
        y: (cy / N) * 100,
        idx: idx,
        nx: cx / N,
        ny: cy / N,
      };
    }

    /**
     * Classy hairline trail — edition style (muted strokes, no neon/glow).
     * Board glyphs stay primary; trails are secondary guides for human play.
     */
    function appendHairline(pts, color, width, cls, dashed) {
      if (!pts || pts.length < 2) return null;
      var poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      poly.setAttribute(
        "points",
        pts
          .map(function (p) {
            return p.x.toFixed(2) + "," + p.y.toFixed(2);
          })
          .join(" ")
      );
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", color);
      poly.setAttribute("stroke-width", String(width));
      poly.setAttribute("stroke-linecap", "round");
      poly.setAttribute("stroke-linejoin", "round");
      poly.setAttribute("class", cls || "dlg-contrail-line");
      if (dashed) poly.setAttribute("stroke-dasharray", "1.8 2.2");
      pathSvg.appendChild(poly);
      /* single quiet endpoints only — no bead noise */
      [pts[0], pts[pts.length - 1]].forEach(function (p, i) {
        var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", p.x.toFixed(2));
        c.setAttribute("cy", p.y.toFixed(2));
        c.setAttribute("r", i === 0 ? "0.85" : "0.7");
        c.setAttribute("fill", color);
        c.setAttribute("class", "dlg-contrail-dot");
        pathSvg.appendChild(c);
      });
      return poly;
    }

    /**
     * Contrails (human-readable):
     *  word — hairline through word-initial glyphs
     *  sentence — faint dashed sentence-start links
     *  same — opt-in same-letter links (off by default)
     */
    function paintContrails() {
      while (pathSvg.firstChild) pathSvg.removeChild(pathSvg.firstChild);
      var N = state.N;
      var indices = contrailIndicesOnBoard();
      var any =
        (state.contrail.word && indices.word.length > 1) ||
        (state.contrail.sentence && indices.sentence.length > 1) ||
        (state.contrail.same && indices.same.length > 1) ||
        (state.mode === "finale" && state.path.length > 1);

      if (!any && state.mode !== "finale") {
        pathSvg.style.opacity = "0";
        state.contrailPts = { word: [], sentence: [], same: [] };
        if (contrailMeta) {
          contrailMeta.textContent =
            "guides · " +
            focusLetter() +
            " · W" +
            indices.word.length +
            " S" +
            indices.sentence.length +
            (state.contrail.same ? " =on" : " =off");
        }
        return;
      }
      /* keep trails quiet so board stays readable */
      pathSvg.style.opacity = "0.72";
      pathSvg.classList.add("dlg-path-svg--classy");

      var ptsWord = indices.word.map(function (i) {
        return idxToSvgPt(i, N);
      });
      var ptsSent = indices.sentence.map(function (i) {
        return idxToSvgPt(i, N);
      });
      var ptsSame = indices.same.map(function (i) {
        return idxToSvgPt(i, N);
      });
      state.contrailPts = { word: ptsWord, sentence: ptsSent, same: ptsSame };

      if (state.contrail.word) {
        appendHairline(ptsWord, "rgba(63,185,80,0.4)", 0.55, "dlg-contrail-word", false);
      }
      if (state.contrail.sentence) {
        appendHairline(ptsSent, "rgba(210,153,34,0.38)", 0.65, "dlg-contrail-sentence", true);
      }
      if (state.contrail.same) {
        appendHairline(ptsSame, "rgba(88,166,255,0.38)", 0.55, "dlg-contrail-same", false);
      }

      if (state.mode === "finale" && state.path.length) {
        var fpts = [];
        for (var i = 0; i <= Math.min(state.pathStep, state.path.length - 1); i++) {
          fpts.push(idxToSvgPt(state.path[i], N));
        }
        appendHairline(fpts, "rgba(10,132,255,0.55)", 0.85, "dlg-contrail-finale", false);
      }

      if (contrailMeta) {
        contrailMeta.textContent =
          "guides · " +
          focusLetter() +
          " · W" +
          ptsWord.length +
          " · S" +
          ptsSent.length +
          (state.contrail.same ? " · =" + ptsSame.length : "");
      }

      var now = Date.now();
      if (!state.highSpeed || now - state.lastContrailPub > 100) {
        state.lastContrailPub = now;
        publishContrailToMg(ptsWord, ptsSent, ptsSame);
      }
    }

    function publishContrailToMg(word, sent, same) {
      var path = [];
      /* prefer word firsts as primary stroke; sentence as jumps; same as recognition */
      function pushPts(arr, kind) {
        (arr || []).forEach(function (p) {
          path.push({
            x: p.nx,
            y: p.ny,
            nx: p.nx,
            ny: p.ny,
            kind: kind,
            idx: p.idx,
            letter: focusLetter(),
          });
        });
      }
      if (state.contrail.word) pushPts(word, "word");
      if (state.contrail.sentence) pushPts(sent, "sentence");
      if (state.contrail.same) pushPts(same, "same");
      try {
        if (!global.__mgContrail) global.__mgContrail = {};
        var C = global.__mgContrail;
        C.path = path;
        C.stats = C.stats || {};
        C.stats.lastPhrase =
          "lg:" +
          focusLetter() +
          ":W" +
          (word || []).length +
          ":S" +
          (sent || []).length +
          ":=" +
          (same || []).length;
        C.stats.strokes = (C.stats.strokes || 0) + 1;
        C.letterGrid = {
          ver: VER,
          letter: focusLetter(),
          word: (word || []).length,
          sentence: (sent || []).length,
          same: (same || []).length,
          N: state.N,
          layerStart: state.layerStart,
          masterPos: state.masterPos,
        };
        if (typeof C.ingestPath === "function") C.ingestPath(path);
      } catch (e) {}
      try {
        global.dispatchEvent(
          new CustomEvent("letter-grid-contrail", {
            detail: {
              letter: focusLetter(),
              word: word,
              sentence: sent,
              same: same,
              N: state.N,
            },
          })
        );
      } catch (e2) {}
    }

    function paintBoard(forceFull) {
      var key = state.N + "|" + state.layerStart + "|" + state.mode + "|" + state.cells.length;
      var reuse =
        !forceFull &&
        state.cellNodes &&
        state.cellNodes.length === state.cells.length &&
        state.boardKey === key;
      board.style.gridTemplateColumns = "repeat(" + state.N + ", 1fr)";
      boardHost.classList.toggle("is-turbo", state.highSpeed);
      var letter = focusLetter();

      if (!reuse) {
        board.innerHTML = "";
        state.cellNodes = [];
        state.boardKey = key;
        state.cells.forEach(function (c, idx) {
          var cell = el("button", "dlg-cell", c.display || "·");
          cell.type = "button";
          cell.dataset.idx = String(idx);
          if (c.gi >= 0) cell.dataset.gi = String(c.gi);
          if (c.letterKey) cell.dataset.letter = c.letterKey;
          cell.onclick = function () {
            if (c.letterKey && !c.pad) state.contrailFocusLetter = c.letterKey;
            onCell(idx);
          };
          board.appendChild(cell);
          state.cellNodes.push(cell);
        });
      }

      /* incremental class/state update (fast path for high speed) */
      state.cells.forEach(function (c, idx) {
        var cell = state.cellNodes[idx];
        if (!cell) return;
        if (!reuse) cell.textContent = c.display || "·";
        cell.className = "dlg-cell";
        if (c.pad) cell.classList.add("is-pad");
        /* quiet marks — never wash out glyph readability */
        if (c.wordStart && state.contrail.word) cell.classList.add("is-word-start");
        if (c.sentenceStart && state.contrail.sentence) cell.classList.add("is-sentence-start");
        if (
          state.contrail.same &&
          !c.pad &&
          letter &&
          (c.letterKey || (c.ch && String(c.ch).toUpperCase())) === letter
        ) {
          cell.classList.add("is-same-letter");
        }
        if (state.mode === "codex") {
          if (c.gi >= 0 && c.gi < state.masterPos) cell.classList.add("is-hit");
          if (idx === state.targetIdx) cell.classList.add("is-target");
        } else if (state.mode === "finale") {
          var pidx = state.path.indexOf(idx);
          if (pidx >= 0 && pidx < state.pathStep) cell.classList.add("is-hit");
          if (pidx === state.pathStep) cell.classList.add("is-target", "is-path-head");
          if (pidx > state.pathStep) cell.classList.add("is-path-future");
        }
      });
      scheduleContrails();
    }

    function paintPathSvg(show) {
      /* finale-only helper kept for startFinale; contrails own the SVG now */
      if (show && state.mode === "finale") paintContrails();
      else if (!show && state.mode !== "finale") paintContrails();
    }

    function paintXref(letter) {
      letter = String(letter || focusLetter()).toUpperCase();
      state.contrailFocusLetter = letter;
      xrefHost.innerHTML = "";
      var head = el("p");
      head.innerHTML =
        "Letter <em style='color:#0a84ff;font-style:normal;font-weight:700'>" +
        letter +
        "</em> · same-letter trail";
      xrefHost.appendChild(head);
      var arr = state.xref[letter] || [];
      var wordFirsts = arr.filter(function (e) {
        return e.wordStart;
      }).length;
      var sentFirsts = arr.filter(function (e) {
        return e.sentenceStart;
      }).length;
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
            state.contrailFocusLetter = letter;
            paintContrails();
            paintBoard();
          };
          ul.appendChild(li);
        });
      xrefHost.appendChild(ul);
      var tot = el("p");
      tot.style.fontSize = "0.72rem";
      tot.style.opacity = "0.75";
      tot.textContent =
        "document ×" +
        arr.length +
        " · word-first ×" +
        wordFirsts +
        " · sentence-first ×" +
        sentFirsts +
        " · master " +
        state.master.length;
      xrefHost.appendChild(tot);
      paintContrails();
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
        var needCells = state.N * state.N;
        var layerBefore = Math.floor(state.masterPos / Math.max(1, needCells));
        state.hits.push({ t: now, gi: g.gi, ch: g.ch, lineId: g.lineId });
        state.masterPos++;
        state.hitCount++;
        noteStairProgress();
        /* layer clear → Colossus pipe log */
        var layerAfter = Math.floor(state.masterPos / Math.max(1, needCells));
        if (layerAfter > layerBefore || state.masterPos >= state.master.length) {
          var ntpmL = ntpmNow();
          var bpsL = bpsFromNtpm(ntpmL, state.N);
          var clearRow = {
            layer: layerBefore + 1,
            at: new Date().toISOString(),
            masterPos: state.masterPos,
            bps: +bpsL.toFixed(2),
            ntpm: ntpmL,
            hits: state.hitCount,
            complete: state.masterPos >= state.master.length,
          };
          state.layerClears.push(clearRow);
          state.pipeLog.push({ kind: "layer-clear", t: now, row: clearRow });
          try {
            global.dispatchEvent(
              new CustomEvent("letter-grid-layer-clear", { detail: clearRow })
            );
          } catch (eL) {}
        }
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
    endCard.querySelector("#dlg-copy-report").onclick = function () {
      var rep = state.lastReport || buildScoreReport("copy");
      var md = rep.markdown || formatReportMarkdown(rep);
      function ok() {
        slog("report copied · " + rep.title);
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(md).then(ok).catch(function () {
            window.prompt("Copy score report:", md);
          });
        } else {
          window.prompt("Copy score report:", md);
        }
      } catch (e) {
        window.prompt("Copy score report:", md);
      }
    };
    function setN(n, btn) {
      state.N = n;
      state.cellNodes = null;
      state.boardKey = "";
      [btnN8, btnN12, btnN16].forEach(function (b) {
        b.classList.remove("on");
      });
      btn.classList.add("on");
      mGrid.b.textContent = n + "×" + n;
      if (state.playing && state.mode === "finale") startFinale();
      else if (state.playing) dealCodexBoard({ forceFull: true });
      else {
        dealCodexBoard({ forceFull: true });
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
      var rate = hitRatePct(state.hitCount, state.missCount);
      var snap = {
        ver: VER,
        game: "letter-grid",
        mode: state.mode,
        phase: state.phase,
        playing: state.playing,
        openCodex: state.openCodex,
        N: state.N,
        hopMs: state.hopMs,
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
        finalBps: state.phase === "end" ? state.finalBps : bps,
        finalNtpm: state.phase === "end" ? state.finalNtpm : ntpm,
        hitCount: state.hitCount,
        missCount: state.missCount,
        hitRate: +rate.toFixed(1),
        best: state.best,
        stairUnlocks: state.stairUnlocks.slice(),
        report: state.lastReport,
        peakLine:
          "Your peak score: " +
          state.peakBps.toFixed(2) +
          " BPS (" +
          state.peakNtpm +
          " NTPM)",
        codexDone: codexDone,
        finaleDone: finaleDone,
        dojoMode: !!state.dojoMode,
        grade: finaleDone
          ? "cage"
          : codexDone
            ? "dojo"
            : state.masterPos > 0 || state.phase === "end"
              ? "in-progress"
              : "ready",
        lines: state.lines.length,
        layerClears: state.layerClears.length,
        next: nextGlyphPreview(),
        targetIdx: state.mode === "finale" ? state.path[state.pathStep] : state.targetIdx,
      };
      return snap;
    }

    /** Next master glyph (or finale cell) without advancing */
    function nextGlyphPreview() {
      if (state.mode === "finale") {
        return {
          mode: "finale",
          pathStep: state.pathStep,
          pathTotal: state.path.length,
          cell: state.path[state.pathStep],
          ch: null,
          gi: null,
        };
      }
      var g = state.master[state.masterPos];
      if (!g) return null;
      return {
        mode: "codex",
        gi: g.gi,
        ch: g.ch,
        display: g.display,
        lineId: g.lineId,
        kind: g.kind,
        letterKey: g.letterKey,
        wordStart: !!g.wordStart,
        sentenceStart: !!g.sentenceStart,
        cell: state.targetIdx,
      };
    }

    function getState() {
      return snapshotNow();
    }

    /** Enter Dojo mode: no 70s timer, step-friendly open codex */
    function setDojoMode(on) {
      state.dojoMode = on !== false;
      if (state.dojoMode) {
        if (!state.playing || state.phase === "end" || state.phase === "lobby") {
          startRound({ openCodex: true, agent: true, dojo: true });
        } else {
          state.openCodex = true;
          state.roundUntil = 0;
          stopTimer();
          btnOpen.classList.add("on");
          slog("DOJO on · timer off · step with nextGlyph()");
        }
      } else {
        state.dojoMode = false;
      }
      return getState();
    }

    /**
     * Advance one correct glyph (or finale cell). Primary Dojo / agent step.
     * Auto-enters Dojo if idle.
     */
    function nextGlyph(optsG) {
      optsG = optsG || {};
      if (!state.playing || state.phase === "lobby" || state.phase === "end") {
        setDojoMode(true);
      }
      var beforePos = state.masterPos;
      var beforePath = state.pathStep;
      var preview = nextGlyphPreview();
      var idx =
        state.mode === "finale"
          ? state.path[state.pathStep]
          : state.targetIdx;
      if (idx == null || idx < 0) {
        return {
          ok: false,
          reason: state.masterPos >= state.master.length ? "codex-done" : "no-target",
          glyph: preview,
          state: getState(),
        };
      }
      onCell(idx);
      var ok =
        state.mode === "finale"
          ? state.pathStep > beforePath
          : state.masterPos > beforePos;
      var row = {
        ok: ok,
        glyph: preview,
        cell: idx,
        state: getState(),
      };
      state.pipeLog.push({
        kind: "nextGlyph",
        t: Date.now(),
        ok: ok,
        gi: preview && preview.gi,
        ch: preview && preview.ch,
      });
      try {
        global.dispatchEvent(new CustomEvent("letter-grid-next-glyph", { detail: row }));
      } catch (eN) {}
      return row;
    }

    /**
     * One-shot round for agents.
     * playRound({ size:12, speed:60, timed:true }) → agentPlay 70s
     * playRound({ dojo:true }) → open codex, no autoplay
     * playRound({ agent:true, maxHits:100 }) → paced agent walk
     */
    function playRound(optsP) {
      optsP = optsP || {};
      var size = optsP.size != null ? optsP.size : optsP.N != null ? optsP.N : state.N;
      var speed =
        optsP.speed != null
          ? optsP.speed
          : optsP.hopMs != null
            ? optsP.hopMs
            : optsP.paceMs != null
              ? optsP.paceMs
              : state.hopMs;
      if (size === 8) setN(8, btnN8);
      else if (size === 16) setN(16, btnN16);
      else setN(12, btnN12);
      state.hopMs = Math.max(MIN_HOP_MS, Number(speed) || DEFAULT_HOP_MS);
      state.highSpeed = state.hopMs <= 40;
      boardHost.classList.toggle("is-turbo", state.highSpeed);
      if (optsP.roundS != null) state.roundS = Math.max(5, Number(optsP.roundS) || ROUND_S);

      var wantDojo = !!(optsP.dojo || optsP.openCodex || optsP.timed === false);
      var wantAgent = optsP.agent !== false && !optsP.stepOnly && !wantDojo;
      if (optsP.agent === true) wantAgent = true;
      if (optsP.stepOnly) wantAgent = false;

      if (wantDojo && !wantAgent) {
        setDojoMode(true);
        return Promise.resolve({
          kind: "letter_grid_play_round",
          mode: "dojo",
          state: getState(),
        });
      }

      return agentPlay({
        paceMs: state.hopMs,
        openCodex: wantDojo,
        maxHits: optsP.maxHits,
      }).then(function (rep) {
        return {
          kind: "letter_grid_play_round",
          mode: wantDojo ? "open-agent" : "timed-agent",
          report: rep,
          state: getState(),
          colossus: exportColossus({ includeGlyphs: false }),
        };
      });
    }

    /**
     * Single Colossus-friendly export: layer + glyph sequence + score + clears.
     * opts.includeGlyphs (default true) · opts.compact (default true) · opts.hitLimit
     */
    function exportColossus(optsC) {
      optsC = optsC || {};
      var includeGlyphs = optsC.includeGlyphs !== false;
      var compact = optsC.compact !== false;
      var hitLimit = optsC.hitLimit != null ? optsC.hitLimit : 2000;
      var need = state.N * state.N;
      var layers = Math.ceil(state.master.length / Math.max(1, need)) || 1;
      var layer = Math.min(Math.floor(state.masterPos / Math.max(1, need)) + 1, layers);
      var glyphs = null;
      if (includeGlyphs) {
        glyphs = state.master.map(function (g) {
          if (compact) {
            /* [gi, ch, lineId, kind, wordStart, sentenceStart] */
            return [
              g.gi,
              g.ch,
              g.lineId,
              g.kind || "body",
              g.wordStart ? 1 : 0,
              g.sentenceStart ? 1 : 0,
            ];
          }
          return {
            gi: g.gi,
            ch: g.ch,
            lineId: g.lineId,
            kind: g.kind,
            letterKey: g.letterKey,
            wordStart: !!g.wordStart,
            sentenceStart: !!g.sentenceStart,
          };
        });
      }
      var pack = {
        schema: "kbatch-letter-grid-colossus-v1",
        kind: "letter_grid_colossus",
        ver: VER,
        at: new Date().toISOString(),
        game: "letter-grid",
        docId: "declaration",
        N: state.N,
        hopMs: state.hopMs,
        dojoMode: !!state.dojoMode,
        openCodex: !!state.openCodex,
        mode: state.mode,
        phase: state.phase,
        master: {
          total: state.master.length,
          pos: state.masterPos,
          remaining: Math.max(0, state.master.length - state.masterPos),
          glyphSchema: compact
            ? ["gi", "ch", "lineId", "kind", "wordStart", "sentenceStart"]
            : null,
          glyphs: glyphs,
        },
        layer: {
          current: layer,
          total: layers,
          cells: need,
          clears: state.layerClears.slice(),
        },
        stair: state.stairUnlocks.slice(),
        score: getState(),
        sequence: state.hits.slice(-hitLimit),
        pipeLog: state.pipeLog.slice(-500),
        report: state.lastReport,
        contrail: {
          layers: Object.assign({}, state.contrail),
          counts: {
            word: (state.contrailPts.word || []).length,
            sentence: (state.contrailPts.sentence || []).length,
            same: (state.contrailPts.same || []).length,
          },
        },
        urls: {
          play: "/labs/declaration-digital-edition/letter-grid.html",
          lab: "/labs/declaration-digital-edition/letter-grid-lab.html",
          pipe: "/labs/declaration-digital-edition/letter-grid-pipe.html",
          masterJson: "/data/declaration/master-glyphs.json",
        },
      };
      try {
        global.__mgLetterGridColossus = pack;
        global.dispatchEvent(
          new CustomEvent("letter-grid-colossus-export", { detail: pack })
        );
      } catch (eC) {}
      return pack;
    }

    /** Master glyph list only (for kbatch_colossus / letter_atom pull) */
    function masterGlyphs(optsM) {
      optsM = optsM || {};
      var compact = optsM.compact !== false;
      return {
        schema: "kbatch-letter-grid-master-v1",
        ver: VER,
        at: new Date().toISOString(),
        total: state.master.length,
        glyphSchema: compact
          ? ["gi", "ch", "lineId", "kind", "wordStart", "sentenceStart"]
          : null,
        glyphs: state.master.map(function (g) {
          if (compact) {
            return [
              g.gi,
              g.ch,
              g.lineId,
              g.kind || "body",
              g.wordStart ? 1 : 0,
              g.sentenceStart ? 1 : 0,
            ];
          }
          return g;
        }),
      };
    }

    /** Document line → glyph ranges (L01 title, etc.) — Colossus layerMap */
    function documentLineMap() {
      var map = {};
      for (var i = 0; i < state.master.length; i++) {
        var g = state.master[i];
        var id = g.lineId || "—";
        if (!map[id]) {
          map[id] = {
            label: g.kind || "body",
            range: [g.gi, g.gi],
            count: 0,
          };
        }
        map[id].range[1] = g.gi;
        map[id].count++;
      }
      return map;
    }

    /** N×N grid layer → master index range */
    function gridLayerMap() {
      var need = state.N * state.N;
      var total = Math.ceil(state.master.length / Math.max(1, need)) || 1;
      var map = {};
      for (var L = 1; L <= total; L++) {
        var start = (L - 1) * need;
        var end = Math.min(state.master.length - 1, start + need - 1);
        map[String(L)] = {
          layer: L,
          range: [start, end],
          cells: need,
          complete: state.masterPos > end,
        };
      }
      return map;
    }

    /**
     * Jump to grid layer 1..layers (sets masterPos to layer start).
     * Enters dojo if idle.
     */
    function jumpToLayer(layerNum) {
      var need = state.N * state.N;
      var layers = Math.ceil(state.master.length / Math.max(1, need)) || 1;
      var L = Math.max(1, Math.min(layers, Number(layerNum) || 1));
      if (!state.playing || state.phase === "lobby" || state.phase === "end") {
        setDojoMode(true);
      }
      state.mode = "codex";
      state.masterPos = (L - 1) * need;
      if (state.masterPos >= state.master.length) {
        state.masterPos = Math.max(0, state.master.length - 1);
      }
      state.layerStart = Math.floor(state.masterPos / need) * need;
      dealCodexBoard({ forceFull: true });
      refreshScore();
      state.pipeLog.push({ kind: "jump-layer", t: Date.now(), layer: L });
      return {
        ok: true,
        action: "jump",
        layer: L,
        layers: layers,
        masterPos: state.masterPos,
        state: mcpStateShape(),
      };
    }

    /** Skip remaining cells in current grid layer → start of next */
    function skipLayer() {
      var need = state.N * state.N;
      var layers = Math.ceil(state.master.length / Math.max(1, need)) || 1;
      var cur = Math.floor(state.masterPos / Math.max(1, need)) + 1;
      if (cur >= layers) {
        return {
          ok: false,
          reason: "last-layer",
          layer: cur,
          state: mcpStateShape(),
        };
      }
      return jumpToLayer(cur + 1);
    }

    /** Draft MCP kbatch_lettergrid_state return shape */
    function mcpStateShape(include) {
      include = include || [];
      var s = getState();
      var out = {
        tool: "kbatch_lettergrid_state",
        ver: VER,
        timer: s.timer,
        bps: +Number(s.bps).toFixed(2),
        ntpm: s.ntpm,
        grid: s.N + "×" + s.N,
        N: s.N,
        glyphs: { done: s.masterPos, total: s.masterTotal },
        layer: { current: s.layer, total: s.layers },
        nextGlyph: s.next && s.next.ch != null ? s.next.ch : null,
        next: s.next,
        masterIndex: s.masterPos,
        peakBps: +Number(s.peakBps).toFixed(2),
        peakNtpm: s.peakNtpm,
        mode: s.phase === "lobby" ? "lobby" : s.dojoMode ? "dojo" : s.mode,
        phase: s.phase,
        playing: s.playing,
        openCodex: s.openCodex,
        dojoMode: s.dojoMode,
        hitCount: s.hitCount,
        missCount: s.missCount,
        hitRate: s.hitRate,
        hopMs: s.hopMs,
      };
      if (include.indexOf("score") >= 0 || include.indexOf("session") >= 0) {
        out.score = {
          peakBps: out.peakBps,
          peakNtpm: out.peakNtpm,
          hits: s.hitCount,
          misses: s.missCount,
          best: s.best,
          report: s.report,
        };
      }
      if (include.indexOf("layers") >= 0) {
        out.gridLayerMap = gridLayerMap();
        out.layerClears = state.layerClears.slice();
      }
      if (include.indexOf("glyphs") >= 0) {
        out.masterSample = state.master.slice(0, 32).map(function (g) {
          return g.ch;
        });
      }
      if (include.indexOf("crossref") >= 0) {
        out.crossref = letterFreqXref();
      }
      if (include.indexOf("session") >= 0) {
        out.session = {
          stairUnlocks: state.stairUnlocks.slice(),
          pipeLogTail: state.pipeLog.slice(-40),
          layerClears: state.layerClears.slice(),
        };
      }
      return out;
    }

    function letterFreqXref() {
      var xr = {};
      Object.keys(state.xref || {}).forEach(function (k) {
        var arr = state.xref[k] || [];
        var byLine = {};
        for (var i = 0; i < arr.length; i++) {
          var lid = arr[i].lineId;
          byLine[lid] = (byLine[lid] || 0) + 1;
        }
        xr[k] = byLine;
      });
      return xr;
    }

    /**
     * Training pack: glyph sequence + layer boundaries + BPS targets.
     * format: json | jsonl-rows | jax-vectors
     */
    function exportTraining(optsT) {
      optsT = optsT || {};
      var format = optsT.format || "json";
      var need = state.N * state.N;
      var layers = Math.ceil(state.master.length / Math.max(1, need)) || 1;
      var boundaries = [];
      for (var L = 1; L <= layers; L++) {
        boundaries.push({
          layer: L,
          start: (L - 1) * need,
          end: Math.min(state.master.length, L * need),
        });
      }
      var seq = state.master.map(function (g) {
        return g.ch;
      });
      var factor = bpsFactor(state.N);
      var pack = {
        schema: "kbatch-letter-grid-training-v1",
        tool: "kbatch_lettergrid_export_training",
        ver: VER,
        at: new Date().toISOString(),
        document: "declaration-of-independence",
        N: state.N,
        masterGlyphs: state.master.length,
        layers: layers,
        sequence: seq,
        layerBoundaries: boundaries,
        documentLineMap: documentLineMap(),
        bps: {
          factor: +factor.toFixed(4),
          note: "BPS = factor * NTPM/60 · factor = log2(N²-1)",
          targets: {
            humanPace: { hopMs: 120, note: "MG default" },
            agentFast: { hopMs: 60 },
            turbo: { hopMs: 12 },
          },
        },
        compactGlyphs: state.master.map(function (g) {
          return [g.gi, g.ch, g.lineId, g.kind || "body"];
        }),
      };
      if (format === "jsonl") {
        return {
          format: "jsonl",
          lines: state.master.map(function (g) {
            return JSON.stringify({
              gi: g.gi,
              ch: g.ch,
              lineId: g.lineId,
              kind: g.kind,
              layer: Math.floor(g.gi / need) + 1,
            });
          }),
          meta: {
            schema: pack.schema,
            masterGlyphs: pack.masterGlyphs,
            layers: pack.layers,
          },
        };
      }
      if (format === "jax") {
        /* numeric features: gi, charCode, layer, wordStart, sentenceStart, kindId */
        var kindIds = {
          title: 0,
          subtitle: 1,
          body: 2,
          grievance: 3,
          closing: 4,
          signature: 5,
        };
        var vectors = state.master.map(function (g) {
          return [
            g.gi,
            g.ch.charCodeAt(0),
            Math.floor(g.gi / need) + 1,
            g.wordStart ? 1 : 0,
            g.sentenceStart ? 1 : 0,
            kindIds[g.kind] != null ? kindIds[g.kind] : 2,
          ];
        });
        return {
          format: "jax",
          schema: pack.schema,
          columns: ["gi", "charCode", "layer", "wordStart", "sentenceStart", "kindId"],
          shape: [vectors.length, 6],
          vectors: vectors,
          bps: pack.bps,
        };
      }
      return pack;
    }

    /** Draft-shaped Colossus snapshot */
    function exportColossusDraft(optsD) {
      optsD = optsD || {};
      var depth = optsD.depth || "full";
      var include = optsD.include || ["glyphs", "layers", "scores", "crossref", "session"];
      var light = depth === "light";
      var training = depth === "training";
      var base = {
        document: "declaration-of-independence",
        version: VER,
        schema: "kbatch-letter-grid-colossus-v1",
        masterGlyphs: state.master.length,
        layers: Math.ceil(state.master.length / Math.max(1, state.N * state.N)) || 1,
        state: mcpStateShape(["score"]),
        paleography: {
          scribe: "Timothy Matlack",
          ink: "iron-gall",
          substrate: "parchment",
          notes:
            "NARA engrossed transcript glyphs · letter-grid master stream is orthographic order, not stroke path.",
          rights: "public-domain transcript",
        },
      };
      if (!light && include.indexOf("glyphs") >= 0) {
        base.glyphs = state.master.map(function (g) {
          return g.ch;
        });
      }
      if (!light && (include.indexOf("layers") >= 0 || true)) {
        base.layerMap = documentLineMap();
        base.gridLayerMap = gridLayerMap();
      }
      if (!light && include.indexOf("scores") >= 0) {
        base.scoreHistory = (function () {
          try {
            return JSON.parse(localStorage.getItem(REPORT_KEY) || "[]");
          } catch (e) {
            return [];
          }
        })();
        base.layerClears = state.layerClears.slice();
        base.stair = state.stairUnlocks.slice();
      }
      if (!light && include.indexOf("crossref") >= 0) {
        base.crossref = letterFreqXref();
      }
      if (!light && include.indexOf("session") >= 0) {
        base.session = {
          pipeLog: state.pipeLog.slice(-100),
          hits: state.hits.slice(-200),
        };
      }
      if (include.indexOf("paleography") >= 0 || !light) {
        /* already attached */
      }
      if (training) {
        base.training = exportTraining({ format: "json" });
      }
      try {
        global.__mgLetterGridColossus = base;
        global.dispatchEvent(
          new CustomEvent("letter-grid-colossus-export", { detail: base })
        );
      } catch (e) {}
      return base;
    }

    /**
     * Agent play: hit blue targets as fast as paceMs allows until round ends.
     * Default hop ~120ms (MG human-pace report). Returns score report.
     */
    function agentPlay(optsA) {
      optsA = optsA || {};
      var paceMs = optsA.paceMs != null ? optsA.paceMs : state.hopMs || DEFAULT_HOP_MS;
      paceMs = Math.max(MIN_HOP_MS, Number(paceMs) || DEFAULT_HOP_MS);
      var maxHits = optsA.maxHits != null ? optsA.maxHits : 1e9;
      var open = !!optsA.openCodex;
      state.hopMs = paceMs;
      state.highSpeed = paceMs <= 40;
      boardHost.classList.toggle("is-turbo", state.highSpeed);
      startRound({
        openCodex: open,
        agent: true,
        hopMs: paceMs,
      });
      return new Promise(function (resolve) {
        var n = 0;
        var last = 0;
        function done() {
          state.highSpeed = state.hopMs <= 40;
          resolve(state.lastReport || buildScoreReport("agent"));
        }
        function tick(ts) {
          if (state.phase === "end" || (!state.playing && state.phase !== "playing")) {
            done();
            return;
          }
          if (n >= maxHits) {
            if (!state.openCodex) endRound("agent-max");
            done();
            return;
          }
          /* pace gate for high-speed: batch by time budget */
          if (paceMs > 0 && last && ts - last < paceMs - 0.5) {
            requestAnimationFrame(tick);
            return;
          }
          last = ts || performance.now();
          var budget = paceMs <= 4 ? 12 : paceMs <= 16 ? 4 : 1; /* multi-hit per frame at max */
          var k = 0;
          while (k < budget && n < maxHits && state.playing && state.phase === "playing") {
            var idx = -1;
            if (state.mode === "finale") {
              idx = state.path[state.pathStep];
            } else {
              idx = state.targetIdx;
            }
            if (idx < 0) break;
            onCell(idx);
            n++;
            k++;
            if (state.phase === "end") break;
          }
          if (state.phase === "end") {
            done();
            return;
          }
          if (paceMs <= 0) {
            requestAnimationFrame(tick);
          } else if (paceMs <= 8) {
            requestAnimationFrame(tick);
          } else {
            setTimeout(function () {
              requestAnimationFrame(tick);
            }, 0);
          }
        }
        requestAnimationFrame(function () {
          setTimeout(function () {
            requestAnimationFrame(tick);
          }, 16);
        });
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
        state.stair = buildGrowthStair(state.master);
        state.masterPos = 0;
        dealCodexBoard();
        slog(
          VER +
            " · lines " +
            lines.length +
            " · master glyphs " +
            state.master.length +
            " · layers " +
            Math.ceil(state.master.length / (state.N * state.N)) +
            " · stair S0–S7"
        );
        var api = {
          ver: VER,
          game: "letter-grid",
          state: state,
          ROUND_S: ROUND_S,
          DEFAULT_HOP_MS: DEFAULT_HOP_MS,
          startCodex: function () {
            startRound({ openCodex: true, dojo: true });
          },
          startTimed: function (hop) {
            startRound({
              openCodex: false,
              hopMs: hop != null ? hop : state.hopMs,
            });
          },
          startRound: startRound,
          endRound: endRound,
          startFinale: startFinale,
          agentPlay: agentPlay,
          /* —— Grok / Dojo / Colossus pipe (clean one-shot surface) —— */
          getState: getState,
          nextGlyph: nextGlyph,
          playRound: playRound,
          exportColossus: exportColossus,
          exportColossusDraft: exportColossusDraft,
          setDojoMode: setDojoMode,
          masterGlyphs: masterGlyphs,
          jumpToLayer: jumpToLayer,
          skipLayer: skipLayer,
          mcpState: mcpStateShape,
          exportTraining: exportTraining,
          documentLineMap: documentLineMap,
          gridLayerMap: gridLayerMap,
          setContrail: function (layer, on) {
            if (state.contrail[layer] == null) return state.contrail;
            state.contrail[layer] = !!on;
            if (contrailBtns[layer]) {
              contrailBtns[layer].classList.toggle("on", state.contrail[layer]);
            }
            paintContrails();
            paintBoard();
            return state.contrail;
          },
          focusLetter: function (ch) {
            if (ch) state.contrailFocusLetter = String(ch).toUpperCase();
            paintXref(state.contrailFocusLetter);
            paintBoard();
            return focusLetter();
          },
          contrailSnapshot: function () {
            return {
              letter: focusLetter(),
              layers: Object.assign({}, state.contrail),
              counts: {
                word: (state.contrailPts.word || []).length,
                sentence: (state.contrailPts.sentence || []).length,
                same: (state.contrailPts.same || []).length,
              },
              pts: state.contrailPts,
            };
          },
          report: function () {
            return state.lastReport || buildScoreReport(state.phase === "end" ? "snapshot" : "live");
          },
          scoreReport: function () {
            return api.report();
          },
          markdownReport: function () {
            var r = api.report();
            return r.markdown || formatReportMarkdown(r);
          },
          setN: function (n) {
            n = Number(n) || 12;
            if (n === 8) setN(8, btnN8);
            else if (n === 16) setN(16, btnN16);
            else setN(12, btnN12);
          },
          setHop: function (ms) {
            state.hopMs = Math.max(MIN_HOP_MS, Number(ms) || DEFAULT_HOP_MS);
            state.highSpeed = state.hopMs <= 40;
            boardHost.classList.toggle("is-turbo", state.highSpeed);
            return state.hopMs;
          },
          snapshot: snapshotNow,
          /** Agent-friendly: click board index (0..N²-1) as human would */
          clickCell: function (idx) {
            onCell(Number(idx));
            return snapshotNow();
          },
          trialsKey: TRIALS_KEY,
          bestKey: BEST_KEY,
          lastReportKey: LAST_REPORT_KEY,
        };
        try {
          global.__letterGridApi = api;
          global.__mgLetterGridApi = api;
          /* alias surface: letterGrid.* as recommended for pipe docs */
          global.letterGrid = api;
        } catch (e3) {}

        /* Autotest / agent: ?autotest=1 | ?mg_autoplay=1 | opts.autoplay
           hop from ?hop=120 (default 120ms for MG human-pace report) */
        var wantAuto = !!opts.autoplay;
        var hopQ = opts.paceMs || opts.hopMs || state.hopMs;
        try {
          if (/[?&](autotest|mg_autoplay)=1\b/i.test(location.search || "")) wantAuto = true;
          var hm = /[?&]hop=(\d+)/i.exec(location.search || "");
          if (hm) hopQ = parseInt(hm[1], 10);
          var pm = /[?&]pace=(\d+)/i.exec(location.search || "");
          if (pm) hopQ = parseInt(pm[1], 10);
        } catch (e4) {}
        if (wantAuto) {
          setTimeout(function () {
            agentPlay({ paceMs: hopQ || DEFAULT_HOP_MS }).then(function (rep) {
              slog(
                "AUTO " +
                  (rep.title || "") +
                  " · peak " +
                  rep.peakBps +
                  " BPS · hit " +
                  (rep.metrics && rep.metrics.hitRateLabel)
              );
              try {
                global.dispatchEvent(
                  new CustomEvent("kbatch-declaration-agent-done", { detail: rep })
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
    DEFAULT_HOP_MS: DEFAULT_HOP_MS,
    MIN_HOP_MS: MIN_HOP_MS,
    SPEED_PRESETS: SPEED_PRESETS,
    mount: mount,
    bpsFromNtpm: bpsFromNtpm,
    bpsFactor: bpsFactor,
    formatTimer: formatTimer,
    buildGrowthStair: buildGrowthStair,
    wanderingPathIndices: wanderingPathIndices,
    buildMaster: buildMaster,
    /** Pipe schema ids for MCP / Colossus */
    COLOSSUS_SCHEMA: "kbatch-letter-grid-colossus-v1",
    MASTER_SCHEMA: "kbatch-letter-grid-master-v1",
  };
})(typeof window !== "undefined" ? window : globalThis);
