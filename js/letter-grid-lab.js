/**
 * Letter-Grid Lab — full research + casual play + benchmark suite
 *
 * Tabs:
 *   · Play      — timed / open codex / finale / contrails (declaration-letter-grid)
 *   · Research  — sine-wave pattern flow · full word-contrail research run · xref
 *   · Benchmark — multi-run agent · ledger · export · hop/N matrix
 *
 * VER: letter-grid-lab-v2-flow
 */
(function (global) {
  "use strict";

  var VER = "letter-grid-lab-v2-flow";
  var LEDGER_KEY = "kbatch.letterGridLab.ledger";
  var RESEARCH_KEY = "kbatch.letterGridLab.wordResearch";
  var QWERTY = {
    q: [0, 0], w: [0, 1], e: [0, 2], r: [0, 3], t: [0, 4], y: [0, 5], u: [0, 6], i: [0, 7], o: [0, 8], p: [0, 9],
    a: [1, 0], s: [1, 1], d: [1, 2], f: [1, 3], g: [1, 4], h: [1, 5], j: [1, 6], k: [1, 7], l: [1, 8],
    z: [2, 0], x: [2, 1], c: [2, 2], v: [2, 3], b: [2, 4], n: [2, 5], m: [2, 6],
  };
  var ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function loadLedger() {
    try {
      return JSON.parse(localStorage.getItem(LEDGER_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveLedger(rows) {
    try {
      localStorage.setItem(LEDGER_KEY, JSON.stringify(rows.slice(-80)));
    } catch (e) {}
  }


  var ARROW = { n: "↑", s: "↓", e: "→", w: "←", ne: "↗", nw: "↖", se: "↘", sw: "↙", z: "·" };

  function dirArrow(dr, dc) {
    if (dr === 0 && dc === 0) return "z";
    var v = dr < 0 ? "n" : dr > 0 ? "s" : "";
    var h = dc < 0 ? "w" : dc > 0 ? "e" : "";
    return v + h || "z";
  }

  function hopColor(hop) {
    if (hop < 1.2) return { r: 63, g: 185, b: 80 };
    if (hop < 2.5) return { r: 88, g: 166, b: 255 };
    if (hop < 4) return { r: 210, g: 153, b: 34 };
    return { r: 248, g: 81, b: 73 };
  }

  function fingerprint(sig, dist, pattern) {
    var s = sig + "|" + dist.toFixed(2) + "|" + pattern;
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  /** Full keyboard contrail + sine series for pattern-flow */
  function letterPath(text, opts) {
    opts = opts || {};
    var layoutId = opts.layoutId || "qwerty";
    var langId = opts.langId || "en";
    var letters = String(text || "").toLowerCase().replace(/[^a-z]/g, "");
    var path = [];
    var sig = [];
    var dist = 0;
    var trails = [];
    var sine = [];
    var arrows = [];
    var prev = null;
    for (var i = 0; i < letters.length; i++) {
      var rc = QWERTY[letters[i]];
      if (!rc) continue;
      var pt = { ch: letters[i], r: rc[0], c: rc[1], i: path.length };
      path.push(pt);
      sig.push(rc[0] + "," + rc[1]);
      sine.push(+(rc[0] - 1 + (rc[1] - 4.5) * 0.12).toFixed(3));
      if (prev) {
        var hop = Math.hypot(rc[0] - prev.r, rc[1] - prev.c);
        dist += hop;
        var dr = rc[0] - prev.r;
        var dc = rc[1] - prev.c;
        var d = dirArrow(dr, dc);
        arrows.push(ARROW[d] || "·");
        trails.push({
          from: prev.ch,
          to: pt.ch,
          y1: prev.r + (prev.c - 4.5) * 0.08,
          y2: rc[0] + (rc[1] - 4.5) * 0.08,
          dist: hop,
          dr: dr,
          dc: dc,
          dir: d,
          color: hopColor(hop),
        });
      }
      prev = pt;
    }
    var pattern = arrows.join("");
    return {
      schema: "kbatch-word-contrail-v1",
      word: String(text || ""),
      letters: letters,
      path: path,
      sig: sig.join(";"),
      len: path.length,
      dist: +dist.toFixed(3),
      meanHop: path.length > 1 ? +(dist / (path.length - 1)).toFixed(3) : 0,
      trails: trails,
      sine: sine,
      arrows: arrows.join(" "),
      pattern: pattern,
      layoutId: layoutId,
      langId: langId,
      fingerprint: fingerprint(sig.join(";"), dist, pattern),
    };
  }

  function extractWordsFromLines(lines, opts) {
    opts = opts || {};
    var pack = runWordResearch(lines, opts);
    return pack.words;
  }

  function runWordResearch(lines, opts) {
    opts = opts || {};
    var langId = opts.langId || "en";
    var layoutId = opts.layoutId || "qwerty";
    var docId = opts.docId || "declaration";
    var map = {};
    (lines || []).forEach(function (ln) {
      var text = ln.text || "";
      var re = /[A-Za-z']+/g;
      var m;
      while ((m = re.exec(text))) {
        var w = m[0];
        var key = w.toLowerCase();
        if (!map[key]) {
          var trail = letterPath(w, { langId: langId, layoutId: layoutId });
          map[key] = {
            word: w,
            key: key,
            count: 0,
            lines: {},
            firsts: w[0].toUpperCase(),
            path: trail,
            contrail: trail,
            langId: langId,
            layoutId: layoutId,
            docId: docId,
          };
        }
        map[key].count++;
        map[key].lines[ln.id] = (map[key].lines[ln.id] || 0) + 1;
      }
    });
    var words = Object.keys(map).map(function (k) {
      var w = map[k];
      w.lineCount = Object.keys(w.lines).length;
      w.deepScore = +(w.count * 2 + w.path.dist + w.path.len * 0.3 + w.lineCount * 0.5).toFixed(3);
      return w;
    });
    return {
      schema: "kbatch-word-research-v1",
      ver: VER,
      at: new Date().toISOString(),
      docId: docId,
      langId: langId,
      layoutId: layoutId,
      wordCount: words.length,
      words: words,
      claim:
        "Per-word keyboard contrails for cross-calibration against language variants of the same document",
    };
  }

  function sortWords(words, mode, dir) {
    dir = dir === "asc" ? 1 : -1;
    var arr = words.slice();
    var cmp = {
      count: function (a, b) { return a.count - b.count; },
      path: function (a, b) { return a.path.dist - b.path.dist; },
      dist: function (a, b) { return a.path.dist - b.path.dist; },
      len: function (a, b) { return a.key.length - b.key.length; },
      hops: function (a, b) { return a.path.meanHop - b.path.meanHop; },
      alpha: function (a, b) { return a.key.localeCompare(b.key); },
      first: function (a, b) { return a.firsts.localeCompare(b.firsts); },
      deep: function (a, b) { return a.deepScore - b.deepScore; },
      pattern: function (a, b) { return (a.path.pattern || "").localeCompare(b.path.pattern || ""); },
      lines: function (a, b) { return a.lineCount - b.lineCount; },
    };
    var fn = cmp[mode] || cmp.deep;
    arr.sort(function (a, b) {
      var d = fn(a, b) * dir;
      return d !== 0 ? d : a.key.localeCompare(b.key);
    });
    return arr;
  }

  /** Pattern flow = sine-wave keyboard contrail (dictionary renderFlow style) */
  function paintPatternFlow(canvas, analysis, opts) {
    opts = opts || {};
    if (!canvas) return;
    var dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    var cssW = canvas.clientWidth || 360;
    var cssH = canvas.clientHeight || 160;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var w = cssW, h = cssH;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, w, h);
    var trails = (analysis && analysis.trails) || [];
    var path = (analysis && analysis.path) || [];
    var sine = (analysis && analysis.sine) || [];
    ctx.strokeStyle = "rgba(48,54,61,0.9)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, h / 2);
    ctx.lineTo(w - 8, h / 2);
    ctx.stroke();
    if (!trails.length && path.length < 2) {
      ctx.fillStyle = "#484f58";
      ctx.font = "12px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText("Pattern flow — select a word", w / 2, h / 2);
      ctx.textAlign = "left";
      return;
    }
    var amp = (h / 2 - 18) * 0.85;
    var n = Math.max(trails.length, 1);
    var stepX = (w - 24) / n;
    if (sine.length > 1) {
      ctx.beginPath();
      for (var si = 0; si < sine.length; si++) {
        var sx = 12 + si * ((w - 24) / Math.max(1, sine.length - 1));
        var sy = h / 2 - sine[si] * amp * 0.55;
        if (si === 0) ctx.moveTo(sx, sy);
        else {
          var px = 12 + (si - 1) * ((w - 24) / Math.max(1, sine.length - 1));
          var py = h / 2 - sine[si - 1] * amp * 0.55;
          var cpx = (px + sx) / 2;
          ctx.bezierCurveTo(cpx, py, cpx, sy, sx, sy);
        }
      }
      ctx.strokeStyle = "rgba(88,166,255,0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    for (var i = 0; i < trails.length; i++) {
      var t = trails[i];
      var x1 = 12 + i * stepX;
      var x2 = 12 + (i + 1) * stepX;
      var y1 = h / 2 - (t.y1 - 1) * amp * 0.5;
      var y2 = h / 2 - (t.y2 - 1) * amp * 0.5;
      var c = t.color || { r: 63, g: 185, b: 80 };
      ctx.strokeStyle = "rgba(" + c.r + "," + c.g + "," + c.b + ",0.88)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      var cpx2 = (x1 + x2) / 2;
      var bow = Math.min(amp * 0.35, t.dist * 6);
      ctx.bezierCurveTo(cpx2, y1 - bow * 0.3, cpx2, y2 + bow * 0.3, x2, y2);
      ctx.stroke();
      ctx.fillStyle = "rgba(" + c.r + "," + c.g + "," + c.b + ",0.95)";
      ctx.beginPath();
      ctx.arc(x2, y2, 2.6, 0, Math.PI * 2);
      ctx.fill();
      if (!opts.compact) {
        ctx.fillStyle = "#8b949e";
        ctx.font = "9px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText((t.to || "").toUpperCase(), x2, Math.min(h - 14, y2 + 12));
      }
    }
    if (path.length) {
      var p0 = path[0];
      var y0 = h / 2 - (p0.r - 1 + (p0.c - 4.5) * 0.08) * amp * 0.5;
      ctx.fillStyle = "#3fb950";
      ctx.beginPath();
      ctx.arc(12, y0, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#8b949e";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    var label =
      "Pattern flow · " +
      ((analysis && analysis.arrows) || "") +
      " · dist " +
      ((analysis && analysis.dist) || 0) +
      " · " +
      ((analysis && analysis.layoutId) || "qwerty");
    ctx.fillText(String(label).slice(0, 72), 10, h - 6);
  }

  function paintKeyboardFlow(canvas, analysis) {
    paintPatternFlow(canvas, analysis, {});
  }

  function paintSpark(canvas, analysis) {
    if (!canvas || !analysis) return;
    var w = (canvas.width = 72);
    var h = (canvas.height = 22);
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    var trails = analysis.trails || [];
    if (!trails.length) return;
    var mid = h / 2;
    var amp = h * 0.35;
    var step = (w - 4) / Math.max(trails.length, 1);
    ctx.beginPath();
    for (var i = 0; i < trails.length; i++) {
      var t = trails[i];
      var x1 = 2 + i * step;
      var x2 = 2 + (i + 1) * step;
      var y1 = mid - (t.y1 - 1) * amp;
      var y2 = mid - (t.y2 - 1) * amp;
      if (i === 0) ctx.moveTo(x1, y1);
      var cpx = (x1 + x2) / 2;
      ctx.bezierCurveTo(cpx, y1, cpx, y2, x2, y2);
    }
    ctx.strokeStyle = "rgba(88,166,255,0.85)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  function roundRect(ctx, x, y, ww, hh, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + ww, y, x + ww, y + hh, r);
    ctx.arcTo(x + ww, y + hh, x, y + hh, r);
    ctx.arcTo(x, y + hh, x, y, r);
    ctx.arcTo(x, y, x + ww, y, r);
    ctx.closePath();
  }

  function deepXrefLetter(master, xref, letter) {
    letter = String(letter || "A").toUpperCase();
    var arr = xref[letter] || [];
    var byLine = {};
    var wordFirst = 0;
    var sentFirst = 0;
    arr.forEach(function (e) {
      byLine[e.lineId] = byLine[e.lineId] || { total: 0, word: 0, sent: 0 };
      byLine[e.lineId].total++;
      if (e.wordStart) {
        byLine[e.lineId].word++;
        wordFirst++;
      }
      if (e.sentenceStart) {
        byLine[e.lineId].sent++;
        sentFirst++;
      }
    });
    return {
      letter: letter,
      total: arr.length,
      wordFirst: wordFirst,
      sentenceFirst: sentFirst,
      lines: byLine,
      density: master.length ? +(arr.length / master.length).toFixed(4) : 0,
    };
  }

  function mount(root, opts) {
    opts = opts || {};
    root.innerHTML = "";
    root.classList.add("lgl-root");

    var shell = el("div", "lgl-shell");
    var hero = el("div", "lgl-hero");
    hero.innerHTML =
      "<h2>Letter-Grid Lab</h2>" +
      "<p><b>Play</b> casual timed runs · <b>Research</b> pattern flow, word deep-sort, xref · " +
      "<b>Benchmark</b> agent multi-run ledger · full codex research + test tool.</p>";
    shell.appendChild(hero);

    var tabs = el("div", "lgl-tabs");
    var tabPlay = el("button", "on", "Play");
    var tabResearch = el("button", "", "Research");
    var tabBench = el("button", "", "Benchmark");
    tabPlay.type = tabResearch.type = tabBench.type = "button";
    tabs.appendChild(tabPlay);
    tabs.appendChild(tabResearch);
    tabs.appendChild(tabBench);
    shell.appendChild(tabs);

    var panePlay = el("div", "lgl-pane is-on");
    panePlay.id = "lgl-play";
    var playMount = el("div", "lgl-play-mount");
    playMount.id = "dlg-mount";
    panePlay.appendChild(playMount);

    var paneResearch = el("div", "lgl-pane");
    paneResearch.id = "lgl-research";
    paneResearch.innerHTML =
      '<div class="lgl-research-grid">' +
      '<section class="lgl-card lgl-card--wide"><h3>Pattern flow</h3>' +
      '<p class="lgl-hint">Sine-wave keyboard contrail (dictionary pattern-flow) · hop-colored segments · arrow pattern</p>' +
      '<canvas class="lgl-flow-canvas" id="lgl-flow" width="720" height="160"></canvas>' +
      '<div class="lgl-flow-meta" id="lgl-flow-meta">—</div></section>' +
      '<section class="lgl-card lgl-card--wide"><h3>Word deep sort · research run</h3>' +
      '<p class="lgl-hint">Each word has a full contrail · sort columns · export for multilingual calibration</p>' +
      '<div class="lgl-sort-bar" id="lgl-sort-bar"></div>' +
      '<div class="lgl-word-actions">' +
      '<button type="button" id="lgl-research-run" class="primary">Run research</button>' +
      '<button type="button" id="lgl-research-export">Export JSON</button>' +
      '<label class="lgl-lang">lang <input id="lgl-lang" value="en" size="4" /></label>' +
      '<span class="lgl-research-meta" id="lgl-research-meta">—</span></div>' +
      '<div class="lgl-word-table-wrap"><table class="lgl-word-table" id="lgl-word-table">' +
      '<thead><tr>' +
      '<th data-sort="alpha">Word</th><th data-sort="count">×</th><th data-sort="path">Dist</th>' +
      '<th data-sort="hops">Hop̄</th><th data-sort="len">Keys</th><th data-sort="first">1st</th>' +
      '<th data-sort="lines">Lines</th><th data-sort="deep">Deep</th><th data-sort="pattern">Pattern</th><th>Flow</th>' +
      "</tr></thead>" +
      '<tbody id="lgl-word-body"></tbody></table></div></section>' +
      '<section class="lgl-card"><h3>Deep cross-ref</h3>' +
      '<div class="lgl-xref-bar"><label>Letter <input id="lgl-xref-letter" maxlength="1" value="T" /></label>' +
      '<button type="button" id="lgl-xref-go" class="primary">Analyze</button></div>' +
      '<pre class="lgl-xref-out" id="lgl-xref-out">—</pre></section>' +
      '<section class="lgl-card lgl-card--wide"><h3>Open-reader style query</h3>' +
      '<div class="lgl-search-row"><input id="lgl-q" placeholder="word · letter path · punct · ?" />' +
      '<select id="lgl-persona"><option value="any">No slant</option>' +
      '<option value="vals">Vals</option><option value="fly">Human Fly</option>' +
      '<option value="boris">Boris</option><option value="formal">Formal</option></select>' +
      '<button type="button" id="lgl-q-go" class="primary">Search</button></div>' +
      '<div class="lgl-search-hits" id="lgl-search-hits"></div></section>' +
      "</div>";

    var paneBench = el("div", "lgl-pane");
    paneBench.id = "lgl-bench";
    paneBench.innerHTML =
      '<div class="lgl-bench-grid">' +
      '<section class="lgl-card"><h3>Benchmark controls</h3>' +
      '<div class="lgl-bench-form">' +
      '<label>Rounds <input id="lgl-rounds" type="number" min="1" max="10" value="1" /></label>' +
      '<label>Hop ms <input id="lgl-hop" type="number" min="1" max="500" value="120" /></label>' +
      '<span class="lgl-hint">1–12ms = turbo paint · multi-hit frames</span>' +
      '<label>N <select id="lgl-n"><option value="8">8</option><option value="12" selected>12</option><option value="16">16</option></select></label>' +
      '<label>Round s <input id="lgl-round-s" type="number" min="10" max="120" value="70" /></label>' +
      '<label class="lgl-check"><input type="checkbox" id="lgl-contrails" checked /> Contrails on</label>' +
      "</div>" +
      '<div class="lgl-bench-actions">' +
      '<button type="button" class="primary" id="lgl-run">Run agent bench</button>' +
      '<button type="button" id="lgl-export">Export ledger</button>' +
      '<button type="button" id="lgl-clear">Clear ledger</button>' +
      "</div>" +
      '<pre class="lgl-bench-status" id="lgl-bench-status">Ready.</pre></section>' +
      '<section class="lgl-card lgl-card--wide"><h3>Ledger</h3>' +
      '<div class="lgl-ledger-wrap"><table class="lgl-ledger" id="lgl-ledger">' +
      "<thead><tr><th>#</th><th>At</th><th>N</th><th>Hop</th><th>Peak BPS</th><th>NTPM</th><th>Hits</th><th>Miss</th><th>Rate</th><th>S7</th></tr></thead>" +
      '<tbody id="lgl-ledger-body"></tbody></table></div></section>' +
      "</div>";

    shell.appendChild(panePlay);
    shell.appendChild(paneResearch);
    shell.appendChild(paneBench);
    root.appendChild(shell);

    var state = {
      tab: "play",
      gridApi: null,
      words: [],
      sortMode: "deep",
      sortDir: "desc",
      researchPack: null,
      ledger: loadLedger(),
    };

    function showTab(name) {
      state.tab = name;
      tabPlay.classList.toggle("on", name === "play");
      tabResearch.classList.toggle("on", name === "research");
      tabBench.classList.toggle("on", name === "bench");
      panePlay.classList.toggle("is-on", name === "play");
      paneResearch.classList.toggle("is-on", name === "research");
      paneBench.classList.toggle("is-on", name === "bench");
      if (name === "research") refreshResearch();
      if (name === "bench") paintLedger();
    }
    tabPlay.onclick = function () {
      showTab("play");
    };
    tabResearch.onclick = function () {
      showTab("research");
    };
    tabBench.onclick = function () {
      showTab("bench");
    };

    /* —— Research —— */
    var sortBar = paneResearch.querySelector("#lgl-sort-bar");
    ["deep", "count", "path", "hops", "len", "first", "alpha", "pattern", "lines"].forEach(function (m) {
      var b = el("button", m === "deep" ? "on" : "", m);
      b.type = "button";
      b.onclick = function () {
        if (state.sortMode === m) state.sortDir = state.sortDir === "desc" ? "asc" : "desc";
        else {
          state.sortMode = m;
          state.sortDir = m === "alpha" || m === "first" ? "asc" : "desc";
        }
        sortBar.querySelectorAll("button").forEach(function (x) {
          x.classList.remove("on");
        });
        b.classList.add("on");
        paintWords();
      };
      sortBar.appendChild(b);
    });
    /* clickable column headers */
    paneResearch.querySelectorAll("#lgl-word-table thead th[data-sort]").forEach(function (th) {
      th.style.cursor = "pointer";
      th.onclick = function () {
        var m = th.getAttribute("data-sort");
        if (state.sortMode === m) state.sortDir = state.sortDir === "desc" ? "asc" : "desc";
        else {
          state.sortMode = m;
          state.sortDir = m === "alpha" || m === "first" ? "asc" : "desc";
        }
        sortBar.querySelectorAll("button").forEach(function (x) {
          x.classList.toggle("on", x.textContent === m);
        });
        paintWords();
      };
    });
    paneResearch.querySelector("#lgl-research-run").onclick = function () {
      runFullResearch();
    };
    paneResearch.querySelector("#lgl-research-export").onclick = function () {
      exportResearch();
    };

    function runFullResearch() {
      var api = state.gridApi;
      if (!api || !api.state) return;
      var lang = (paneResearch.querySelector("#lgl-lang") || {}).value || "en";
      state.researchPack = runWordResearch(api.state.lines || [], {
        langId: lang,
        layoutId: "qwerty",
        docId: "declaration",
      });
      state.words = state.researchPack.words;
      try {
        localStorage.setItem(
          RESEARCH_KEY,
          JSON.stringify({
            at: state.researchPack.at,
            langId: state.researchPack.langId,
            wordCount: state.researchPack.wordCount,
            fingerprints: state.words.slice(0, 200).map(function (w) {
              return { key: w.key, fp: w.path.fingerprint, dist: w.path.dist, count: w.count };
            }),
          })
        );
      } catch (e) {}
      var meta = paneResearch.querySelector("#lgl-research-meta");
      if (meta) {
        meta.textContent =
          state.researchPack.wordCount +
          " words · lang " +
          state.researchPack.langId +
          " · " +
          state.researchPack.at.slice(0, 19);
      }
      paintWords();
      if (state.words[0]) selectWord(state.words[0]);
    }

    function exportResearch() {
      if (!state.researchPack) runFullResearch();
      var pack = state.researchPack;
      var slim = {
        schema: pack.schema,
        ver: pack.ver,
        at: pack.at,
        docId: pack.docId,
        langId: pack.langId,
        layoutId: pack.layoutId,
        wordCount: pack.wordCount,
        claim: pack.claim,
        words: pack.words.map(function (w) {
          return {
            key: w.key,
            word: w.word,
            count: w.count,
            lineCount: w.lineCount,
            lines: w.lines,
            firsts: w.firsts,
            deepScore: w.deepScore,
            contrail: {
              sig: w.path.sig,
              dist: w.path.dist,
              meanHop: w.path.meanHop,
              len: w.path.len,
              pattern: w.path.pattern,
              arrows: w.path.arrows,
              sine: w.path.sine,
              fingerprint: w.path.fingerprint,
              trails: w.path.trails,
            },
          };
        }),
      };
      var blob = new Blob([JSON.stringify(slim, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "word-research-" + slim.langId + "-" + slim.docId + ".json";
      a.click();
    }

    function selectWord(w) {
      if (!w) return;
      paintPatternFlow(paneResearch.querySelector("#lgl-flow"), w.path || w.contrail);
      var meta = paneResearch.querySelector("#lgl-flow-meta");
      if (meta) {
        meta.textContent =
          "«" +
          w.word +
          "» ×" +
          w.count +
          " · " +
          (w.path.arrows || "") +
          " · dist " +
          w.path.dist +
          " · hop̄ " +
          w.path.meanHop +
          " · fp " +
          w.path.fingerprint;
      }
      if (state.gridApi && state.gridApi.focusLetter) state.gridApi.focusLetter(w.firsts);
    }

    function refreshResearch() {
      var api = state.gridApi;
      if (!api || !api.state) return;
      if (!state.words.length) runFullResearch();
      else paintWords();
      var focus =
        (api.contrailSnapshot && api.contrailSnapshot().letter) ||
        api.state.contrailFocusLetter ||
        "T";
      var inp = paneResearch.querySelector("#lgl-xref-letter");
      if (inp && !inp.dataset.touched) inp.value = focus;
      runXref();
      var g =
        api.state.master && api.state.master[api.state.masterPos]
          ? api.state.master[api.state.masterPos]
          : null;
      var sample = g ? sampleWordAround(api.state, g) : "people";
      var hit = state.words.filter(function (w) {
        return w.key === sample.toLowerCase();
      })[0];
      selectWord(hit || { word: sample, count: 1, firsts: sample[0], path: letterPath(sample) });
    }

    function sampleWordAround(st, g) {
      /* reconstruct word from master around gi */
      var gi = g.gi;
      var chars = [g.ch];
      var i = gi - 1;
      while (i >= 0 && st.master[i] && !st.master[i + 1].wordStart) {
        /* go back to word start */
        i--;
      }
      /* find word start */
      var start = gi;
      while (start > 0 && st.master[start] && !st.master[start].wordStart) start--;
      var w = "";
      for (var j = start; j < st.master.length; j++) {
        var m = st.master[j];
        if (j > start && m.wordStart) break;
        w += m.ch;
        if (j > start + 24) break;
      }
      return w || g.ch;
    }

    function paintWords() {
      var body = paneResearch.querySelector("#lgl-word-body");
      if (!body) return;
      var sorted = sortWords(state.words, state.sortMode, state.sortDir).slice(0, 120);
      body.innerHTML = "";
      sorted.forEach(function (w) {
        var tr = document.createElement("tr");
        var lineIds = Object.keys(w.lines).slice(0, 3).join(",");
        var tdSpark = document.createElement("td");
        var cv = document.createElement("canvas");
        cv.className = "lgl-spark";
        cv.width = 72;
        cv.height = 22;
        tdSpark.appendChild(cv);
        tr.innerHTML =
          "<td><button type='button' class='lgl-word-btn'>" +
          escapeHtml(w.word) +
          "</button></td>" +
          "<td class='num'>" +
          w.count +
          "</td>" +
          "<td class='num'>" +
          w.path.dist +
          "</td>" +
          "<td class='num'>" +
          w.path.meanHop +
          "</td>" +
          "<td class='num'>" +
          w.path.len +
          "</td>" +
          "<td>" +
          escapeHtml(w.firsts) +
          "</td>" +
          "<td class='num'>" +
          (w.lineCount || Object.keys(w.lines).length) +
          "</td>" +
          "<td class='num'>" +
          (w.deepScore != null ? w.deepScore : "—") +
          "</td>" +
          "<td class='mono lgl-pat' title='" +
          escapeHtml(w.path.arrows || "") +
          "'>" +
          escapeHtml((w.path.pattern || "").slice(0, 12)) +
          "</td>";
        tr.appendChild(tdSpark);
        paintSpark(cv, w.path);
        tr.querySelector("button").onclick = function () {
          selectWord(w);
        };
        tr.onclick = function (ev) {
          if (ev.target.tagName === "BUTTON") return;
          selectWord(w);
        };
        body.appendChild(tr);
      });
    }

    function runXref() {
      var api = state.gridApi;
      var out = paneResearch.querySelector("#lgl-xref-out");
      if (!api || !api.state || !out) return;
      var letter = (paneResearch.querySelector("#lgl-xref-letter").value || "A").toUpperCase();
      var deep = deepXrefLetter(api.state.master, api.state.xref, letter);
      var lines = Object.keys(deep.lines)
        .sort()
        .slice(0, 24)
        .map(function (id) {
          var L = deep.lines[id];
          return id + " ×" + L.total + " (word-first " + L.word + ", sent " + L.sent + ")";
        });
      out.textContent =
        "Letter " +
        deep.letter +
        "\ntotal " +
        deep.total +
        " · density " +
        deep.density +
        "\nword-first " +
        deep.wordFirst +
        " · sentence-first " +
        deep.sentenceFirst +
        "\n\n" +
        lines.join("\n");
      if (api.focusLetter) api.focusLetter(letter);
    }

    paneResearch.querySelector("#lgl-xref-letter").addEventListener("input", function () {
      this.dataset.touched = "1";
    });
    paneResearch.querySelector("#lgl-xref-go").onclick = runXref;

    paneResearch.querySelector("#lgl-q-go").onclick = function () {
      var api = state.gridApi;
      var hitsHost = paneResearch.querySelector("#lgl-search-hits");
      if (!api || !api.state) return;
      var q = paneResearch.querySelector("#lgl-q").value;
      var persona = paneResearch.querySelector("#lgl-persona").value;
      var pack = null;
      if (global.__kbatchOpenReaderSearch && global.__kbatchOpenReaderSearch.search) {
        pack = global.__kbatchOpenReaderSearch.search(q, api.state.lines, {
          layers: ["letters", "words", "punct", "intonation", "persona"],
          persona: persona,
          limit: 20,
        });
      } else {
        /* lightweight fallback */
        var low = q.toLowerCase();
        pack = {
          hits: (api.state.lines || [])
            .filter(function (ln) {
              return (ln.text || "").toLowerCase().indexOf(low) >= 0;
            })
            .slice(0, 20)
            .map(function (ln) {
              return { lineId: ln.id, text: ln.text, score: 1, reasons: ["substr"] };
            }),
          hitCount: 0,
        };
        pack.hitCount = pack.hits.length;
      }
      hitsHost.innerHTML = "";
      (pack.hits || []).forEach(function (h) {
        var row = el("div", "lgl-hit");
        row.innerHTML =
          "<b>" +
          escapeHtml(h.lineId) +
          "</b> <span>" +
          (h.score != null ? h.score.toFixed(2) : "") +
          "</span><p>" +
          escapeHtml((h.text || "").slice(0, 140)) +
          "</p>";
        row.onclick = function () {
          if (api.openLine) {
            /* letter-grid openLine is openLine internal; use focus via document gateway */
          }
          paintPatternFlow(paneResearch.querySelector("#lgl-flow"), letterPath(h.text || ""));
        };
        hitsHost.appendChild(row);
      });
    };

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    /* —— Benchmark —— */
    function paintLedger() {
      var body = paneBench.querySelector("#lgl-ledger-body");
      if (!body) return;
      body.innerHTML = "";
      state.ledger
        .slice()
        .reverse()
        .forEach(function (r, i) {
          var tr = document.createElement("tr");
          tr.innerHTML =
            "<td>" +
            (state.ledger.length - i) +
            "</td><td class='mono'>" +
            escapeHtml((r.at || "").slice(0, 19)) +
            "</td><td>" +
            r.N +
            "</td><td>" +
            r.hopMs +
            "</td><td class='num'><b>" +
            Number(r.peakBps).toFixed(2) +
            "</b></td><td class='num'>" +
            r.peakNtpm +
            "</td><td class='num'>" +
            r.hits +
            "</td><td class='num'>" +
            r.misses +
            "</td><td class='num'>" +
            (r.hitRate != null ? r.hitRate + "%" : "—") +
            "</td><td class='num'>" +
            (r.stairS7 != null ? r.stairS7 + "s" : "—") +
            "</td>";
          body.appendChild(tr);
        });
    }

    function status(msg) {
      var elS = paneBench.querySelector("#lgl-bench-status");
      if (elS) elS.textContent = msg;
    }

    paneBench.querySelector("#lgl-run").onclick = function () {
      runBench();
    };
    paneBench.querySelector("#lgl-export").onclick = function () {
      var blob = new Blob([JSON.stringify(state.ledger, null, 2)], {
        type: "application/json",
      });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "letter-grid-lab-ledger.json";
      a.click();
      var md = ledgerMarkdown(state.ledger);
      try {
        if (navigator.clipboard) navigator.clipboard.writeText(md);
      } catch (e) {}
      status("Exported JSON · markdown copied (" + state.ledger.length + " runs)");
    };
    paneBench.querySelector("#lgl-clear").onclick = function () {
      state.ledger = [];
      saveLedger(state.ledger);
      paintLedger();
      status("Ledger cleared");
    };

    function ledgerMarkdown(rows) {
      var lines = [
        "# Letter-Grid Lab ledger",
        "",
        "| # | At | N | Hop | Peak BPS | NTPM | Hits | Miss | Rate |",
        "|---|-----|---|-----|----------|------|------|------|------|",
      ];
      rows.forEach(function (r, i) {
        lines.push(
          "| " +
            (i + 1) +
            " | " +
            (r.at || "").slice(0, 19) +
            " | " +
            r.N +
            " | " +
            r.hopMs +
            " | " +
            Number(r.peakBps).toFixed(2) +
            " | " +
            r.peakNtpm +
            " | " +
            r.hits +
            " | " +
            r.misses +
            " | " +
            (r.hitRate != null ? r.hitRate + "%" : "—") +
            " |"
        );
      });
      return lines.join("\n");
    }

    function runBench() {
      var api = state.gridApi;
      if (!api || !api.agentPlay) {
        status("Grid API not ready");
        return;
      }
      var rounds = Math.max(1, Math.min(10, parseInt(paneBench.querySelector("#lgl-rounds").value, 10) || 1));
      var hop = Math.max(1, parseInt(paneBench.querySelector("#lgl-hop").value, 10) || 120);
      var N = parseInt(paneBench.querySelector("#lgl-n").value, 10) || 12;
      var roundS = Math.max(10, parseInt(paneBench.querySelector("#lgl-round-s").value, 10) || 70);
      var contrailsOn = paneBench.querySelector("#lgl-contrails").checked;
      api.setN(N);
      api.setHop(hop);
      if (api.state) api.state.roundS = roundS;
      if (contrailsOn && api.setContrail) {
        api.setContrail("word", true);
        api.setContrail("sentence", true);
        api.setContrail("same", true);
      }
      status("Running " + rounds + "× " + roundS + "s @ hop " + hop + "ms · N=" + N + "…");
      var i = 0;
      function next() {
        if (i >= rounds) {
          paintLedger();
          status("Done · " + rounds + " run(s) · ledger " + state.ledger.length);
          try {
            global.dispatchEvent(
              new CustomEvent("letter-grid-lab-bench-done", {
                detail: { ledger: state.ledger, rounds: rounds },
              })
            );
          } catch (e) {}
          return;
        }
        i++;
        status("Round " + i + "/" + rounds + "…");
        api.agentPlay({ paceMs: hop }).then(function (rep) {
          var stair = null;
          if (rep.growthStair) {
            var s7 = rep.growthStair.filter(function (u) {
              return u.id === "S7";
            })[0];
            if (s7) stair = s7.tSec;
          }
          var csnap = api.contrailSnapshot ? api.contrailSnapshot() : null;
          var row = {
            at: new Date().toISOString(),
            N: N,
            hopMs: hop,
            roundS: roundS,
            peakBps: rep.peakBps,
            peakNtpm: rep.peakNtpm,
            finalBps: rep.finalBps != null ? rep.finalBps : rep.metrics && rep.metrics.finalBps,
            finalNtpm: rep.finalNtpm != null ? rep.finalNtpm : rep.metrics && rep.metrics.finalNtpm,
            hits: rep.hits != null ? rep.hits : rep.metrics && rep.metrics.hits,
            misses: rep.misses != null ? rep.misses : rep.metrics && rep.metrics.misses,
            hitRate: rep.metrics ? rep.metrics.hitRate : null,
            stairS7: stair,
            contrail: csnap && csnap.counts,
            ver: rep.ver || VER,
          };
          state.ledger.push(row);
          saveLedger(state.ledger);
          /* also append score session ledger */
          try {
            var prev = JSON.parse(
              localStorage.getItem("kbatch.declaration.letterGrid.reports") || "[]"
            );
            prev.push(row);
            localStorage.setItem(
              "kbatch.declaration.letterGrid.reports",
              JSON.stringify(prev.slice(-40))
            );
          } catch (e2) {}
          paintLedger();
          next();
        });
      }
      next();
    }

    /* —— Mount play engine —— */
    var LG = global.__kbatchDeclarationLetterGrid;
    if (!LG || !LG.mount) {
      playMount.innerHTML =
        '<p class="arc-err">declaration-letter-grid.js not loaded</p>';
      return Promise.reject(new Error("no letter-grid engine"));
    }

    return LG.mount(playMount, {
      dataBase: opts.dataBase || "/data/declaration",
      N: opts.N || 12,
      hopMs: opts.hopMs || 120,
      roundS: opts.roundS || 70,
      autoplay: false,
    }).then(function (api) {
      state.gridApi = api;
      try {
        global.__letterGridLabApi = {
          ver: VER,
          grid: api,
          showTab: showTab,
          runBench: runBench,
          ledger: function () {
            return state.ledger.slice();
          },
          refreshResearch: refreshResearch,
          runWordResearch: runFullResearch,
          exportResearch: exportResearch,
        };
        global.__letterGridApi = api;
      } catch (e) {}

      /* live refresh research when round ends */
      try {
        global.addEventListener("kbatch-declaration-round-end", function () {
          state.words = [];
          if (state.tab === "research") refreshResearch();
        });
        global.addEventListener("letter-grid-contrail", function () {
          if (state.tab === "research") refreshResearch();
        });
      } catch (e3) {}

      /* URL tab */
      try {
        var u = new URL(location.href);
        var t = u.searchParams.get("tab");
        if (t === "research" || t === "bench" || t === "play") showTab(t);
        if (u.searchParams.get("bench") === "1") {
          showTab("bench");
          setTimeout(runBench, 300);
        }
      } catch (e4) {}

      paintLedger();
      return global.__letterGridLabApi;
    });
  }

  global.__kbatchLetterGridLab = {
    ver: VER,
    mount: mount,
    letterPath: letterPath,
    extractWordsFromLines: extractWordsFromLines,
    runWordResearch: runWordResearch,
    sortWords: sortWords,
    paintPatternFlow: paintPatternFlow,
  };
})(typeof window !== "undefined" ? window : globalThis);
