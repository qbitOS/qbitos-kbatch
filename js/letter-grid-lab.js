/**
 * Letter-Grid Lab — full research + casual play + benchmark suite
 *
 * Tabs:
 *   · Play      — timed / open codex / finale / contrails (declaration-letter-grid)
 *   · Research  — pattern flow · word deep sort · letter/word xref · open-reader layers
 *   · Benchmark — multi-run agent · ledger · export · hop/N matrix
 *
 * VER: letter-grid-lab-v1
 */
(function (global) {
  "use strict";

  var VER = "letter-grid-lab-v1";
  var LEDGER_KEY = "kbatch.letterGridLab.ledger";
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

  function letterPath(text) {
    var letters = String(text || "").toLowerCase().replace(/[^a-z]/g, "");
    var path = [];
    var sig = [];
    var dist = 0;
    var prev = null;
    for (var i = 0; i < letters.length; i++) {
      var rc = QWERTY[letters[i]];
      if (!rc) continue;
      path.push({ ch: letters[i], r: rc[0], c: rc[1] });
      sig.push(rc[0] + "," + rc[1]);
      if (prev) {
        dist += Math.hypot(rc[0] - prev[0], rc[1] - prev[1]);
      }
      prev = rc;
    }
    return { letters: letters, path: path, sig: sig.join(";"), len: path.length, dist: +dist.toFixed(2) };
  }

  function extractWordsFromLines(lines) {
    var map = {};
    (lines || []).forEach(function (ln) {
      var text = ln.text || "";
      var re = /[A-Za-z']+/g;
      var m;
      while ((m = re.exec(text))) {
        var w = m[0];
        var key = w.toLowerCase();
        if (!map[key]) {
          map[key] = {
            word: w,
            key: key,
            count: 0,
            lines: {},
            firsts: w[0].toUpperCase(),
            path: letterPath(w),
          };
        }
        map[key].count++;
        map[key].lines[ln.id] = (map[key].lines[ln.id] || 0) + 1;
      }
    });
    return Object.keys(map).map(function (k) {
      return map[k];
    });
  }

  function sortWords(words, mode) {
    var arr = words.slice();
    if (mode === "count") {
      arr.sort(function (a, b) {
        return b.count - a.count || a.key.localeCompare(b.key);
      });
    } else if (mode === "path") {
      arr.sort(function (a, b) {
        return b.path.dist - a.path.dist || b.path.len - a.path.len;
      });
    } else if (mode === "len") {
      arr.sort(function (a, b) {
        return b.key.length - a.key.length || b.count - a.count;
      });
    } else if (mode === "alpha") {
      arr.sort(function (a, b) {
        return a.key.localeCompare(b.key);
      });
    } else if (mode === "first") {
      arr.sort(function (a, b) {
        return a.firsts.localeCompare(b.firsts) || b.count - a.count;
      });
    } else {
      /* deep: composite score */
      arr.sort(function (a, b) {
        var sa = a.count * 2 + a.path.dist + a.key.length * 0.3;
        var sb = b.count * 2 + b.path.dist + b.key.length * 0.3;
        return sb - sa;
      });
    }
    return arr;
  }

  function paintKeyboardFlow(canvas, analysis) {
    if (!canvas) return;
    var W = (canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1) || 320);
    var H = (canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1) || 140);
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, W, H);
    var path = (analysis && analysis.path) || [];
    var heat = {};
    path.forEach(function (p) {
      var k = p.ch;
      heat[k] = (heat[k] || 0) + 1;
    });
    var maxH = 1;
    Object.keys(heat).forEach(function (k) {
      if (heat[k] > maxH) maxH = heat[k];
    });
    var keyW = (W - 20) / 10;
    var keyH = (H - 24) / 3.1;
    var centers = {};
    for (var r = 0; r < ROWS.length; r++) {
      var row = ROWS[r];
      var off = r === 1 ? keyW * 0.35 : r === 2 ? keyW * 0.85 : 0;
      for (var c = 0; c < row.length; c++) {
        var ch = row[c];
        var x = 10 + off + c * keyW;
        var y = 10 + r * keyH;
        var t = (heat[ch] || 0) / maxH;
        ctx.fillStyle =
          t > 0
            ? "rgba(10,132,255," + (0.15 + t * 0.7).toFixed(2) + ")"
            : "#161b22";
        ctx.strokeStyle = "#30363d";
        ctx.lineWidth = 1;
        roundRect(ctx, x, y, keyW - 3, keyH - 4, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = t > 0.4 ? "#fff" : "#8b949e";
        ctx.font = "600 " + Math.max(9, keyW * 0.32) + "px ui-monospace,monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ch.toUpperCase(), x + (keyW - 3) / 2, y + (keyH - 4) / 2);
        centers[ch] = { cx: x + (keyW - 3) / 2, cy: y + (keyH - 4) / 2 };
      }
    }
    if (path.length > 1) {
      ctx.strokeStyle = "rgba(249,115,22,0.9)";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (var i = 0; i < path.length; i++) {
        var pt = centers[path[i].ch];
        if (!pt) continue;
        if (i === 0) ctx.moveTo(pt.cx, pt.cy);
        else ctx.lineTo(pt.cx, pt.cy);
      }
      ctx.stroke();
      path.forEach(function (p, i) {
        var pt2 = centers[p.ch];
        if (!pt2) return;
        ctx.beginPath();
        ctx.fillStyle = i === 0 ? "#30d158" : i === path.length - 1 ? "#ff9f0a" : "#ea580c";
        ctx.arc(pt2.cx, pt2.cy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.fillStyle = "#8b949e";
    ctx.font = "10px ui-monospace,monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      "Pattern flow · dist " +
        ((analysis && analysis.dist) || 0) +
        " · keys " +
        ((analysis && analysis.len) || 0),
      10,
      H - 6
    );
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
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
      '<section class="lgl-card"><h3>Pattern flow</h3>' +
      '<p class="lgl-hint">Keyboard geometry for focus word / letter path (dictionary flow mode)</p>' +
      '<canvas class="lgl-flow-canvas" id="lgl-flow" width="360" height="150"></canvas>' +
      '<div class="lgl-flow-meta" id="lgl-flow-meta">—</div></section>' +
      '<section class="lgl-card"><h3>Word deep sort</h3>' +
      '<div class="lgl-sort-bar" id="lgl-sort-bar"></div>' +
      '<div class="lgl-word-table-wrap"><table class="lgl-word-table" id="lgl-word-table">' +
      "<thead><tr><th>Word</th><th>×</th><th>Path</th><th>Dist</th><th>1st</th><th>Lines</th></tr></thead>" +
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
      '<label>Hop ms <input id="lgl-hop" type="number" min="8" max="500" value="120" /></label>' +
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
    ["deep", "count", "path", "len", "first", "alpha"].forEach(function (m) {
      var b = el("button", m === "deep" ? "on" : "", m);
      b.type = "button";
      b.onclick = function () {
        state.sortMode = m;
        sortBar.querySelectorAll("button").forEach(function (x) {
          x.classList.remove("on");
        });
        b.classList.add("on");
        paintWords();
      };
      sortBar.appendChild(b);
    });

    function refreshResearch() {
      var api = state.gridApi;
      if (!api || !api.state) return;
      var lines = api.state.lines || [];
      if (!state.words.length && lines.length) {
        state.words = extractWordsFromLines(lines);
      }
      paintWords();
      var focus =
        (api.contrailSnapshot && api.contrailSnapshot().letter) ||
        (api.state.contrailFocusLetter) ||
        "T";
      var inp = paneResearch.querySelector("#lgl-xref-letter");
      if (inp && !inp.dataset.touched) inp.value = focus;
      runXref();
      var g =
        api.state.master && api.state.master[api.state.masterPos]
          ? api.state.master[api.state.masterPos]
          : null;
      var sample = g ? sampleWordAround(api.state, g) : "people";
      var path = letterPath(sample);
      paintKeyboardFlow(paneResearch.querySelector("#lgl-flow"), path);
      var meta = paneResearch.querySelector("#lgl-flow-meta");
      if (meta) {
        meta.textContent =
          "focus word «" +
          sample +
          "» · path " +
          path.sig.slice(0, 48) +
          (path.sig.length > 48 ? "…" : "") +
          " · dist " +
          path.dist;
      }
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
      var sorted = sortWords(state.words, state.sortMode).slice(0, 80);
      body.innerHTML = "";
      sorted.forEach(function (w) {
        var tr = document.createElement("tr");
        var lineIds = Object.keys(w.lines).slice(0, 4).join(",");
        tr.innerHTML =
          "<td><button type='button' class='lgl-word-btn'>" +
          escapeHtml(w.word) +
          "</button></td>" +
          "<td class='num'>" +
          w.count +
          "</td>" +
          "<td class='mono'>" +
          w.path.len +
          "</td>" +
          "<td class='num'>" +
          w.path.dist +
          "</td>" +
          "<td>" +
          escapeHtml(w.firsts) +
          "</td>" +
          "<td class='mono'>" +
          escapeHtml(lineIds) +
          "</td>";
        tr.querySelector("button").onclick = function () {
          paintKeyboardFlow(paneResearch.querySelector("#lgl-flow"), w.path);
          var meta = paneResearch.querySelector("#lgl-flow-meta");
          if (meta) {
            meta.textContent =
              "word «" + w.word + "» ×" + w.count + " · dist " + w.path.dist + " · " + w.path.sig;
          }
          if (state.gridApi && state.gridApi.focusLetter) {
            state.gridApi.focusLetter(w.firsts);
          }
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
          paintKeyboardFlow(paneResearch.querySelector("#lgl-flow"), letterPath(h.text || ""));
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
      var hop = Math.max(8, parseInt(paneBench.querySelector("#lgl-hop").value, 10) || 120);
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
    sortWords: sortWords,
  };
})(typeof window !== "undefined" ? window : globalThis);
