/**
 * Declaration Letter-Grid · WebGrid-style square-chunk litmus
 * Neuralink-inspired: BPS ≈ log2(N²-1) * NTPM/60 · target rgb(10,132,255)
 * Document gateway: line unlock stair + letter cross-reference → archive lines
 */
(function (global) {
  "use strict";

  var VER = "declaration-letter-grid-v1";
  var TARGET_RGB = "rgb(10, 132, 255)";
  var ROUND_MS = 70000;
  var DEFAULT_N = 12;

  /** Growth stair · document gateway stages */
  var STAIRS = [
    { id: "S0", label: "Title", lines: ["L01", "L02"], unlockDoc: true },
    { id: "S1", label: "Preamble", lines: ["L03"], unlockDoc: true },
    { id: "S2", label: "Self-evident", lines: ["L04"], unlockDoc: true },
    { id: "S3", label: "Grievances 1–6", lines: ["L05", "L06", "L07", "L08", "L09", "L10"], unlockDoc: true },
    { id: "S4", label: "Grievances 7–15", lines: lineRange(11, 19), unlockDoc: true },
    { id: "S5", label: "Grievances 16–27", lines: lineRange(20, 31), unlockDoc: true },
    { id: "S6", label: "Close · free", lines: lineRange(32, 35), unlockDoc: true },
    { id: "S7", label: "Full codex", lines: lineRange(1, 35), unlockDoc: true },
  ];

  function lineRange(a, b) {
    var out = [];
    for (var i = a; i <= b; i++) out.push("L" + String(i).padStart(2, "0"));
    return out;
  }

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

  function buildLetterStream(lines, allowedIds) {
    var allow = null;
    if (allowedIds && allowedIds.length) {
      allow = {};
      allowedIds.forEach(function (id) {
        allow[id] = true;
      });
    }
    var stream = [];
    var xref = {}; /* letter -> [{lineId, i, ch, word}] */
    lines.forEach(function (ln) {
      if (allow && !allow[ln.id]) return;
      var text = ln.text || "";
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        var isLetter = /[A-Za-z]/.test(ch);
        var entry = {
          lineId: ln.id,
          i: i,
          ch: ch,
          display: ch === " " ? "·" : ch,
          isLetter: isLetter,
          kind: ln.kind || "body",
        };
        stream.push(entry);
        if (isLetter) {
          var key = ch.toUpperCase();
          if (!xref[key]) xref[key] = [];
          xref[key].push({ lineId: ln.id, i: i, ch: ch });
        }
      }
    });
    return { stream: stream, xref: xref };
  }

  function lineTextMap(lines) {
    var m = {};
    lines.forEach(function (ln) {
      m[ln.id] = ln;
    });
    return m;
  }

  function pickTargetLetter(stream, N) {
    var counts = {};
    var letters = [];
    stream.forEach(function (e) {
      if (!e.isLetter) return;
      var k = e.ch.toUpperCase();
      counts[k] = (counts[k] || 0) + 1;
      letters.push(k);
    });
    if (!letters.length) return "E";
    /* Prefer mid-frequency letters for good density */
    var ranked = Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a];
    });
    var mid = ranked.slice(2, Math.min(10, ranked.length));
    if (!mid.length) mid = ranked;
    return mid[Math.floor(Math.random() * mid.length)];
  }

  function chunkFromStream(stream, offset, N) {
    var need = N * N;
    var cells = [];
    var i = offset;
    while (cells.length < need && stream.length) {
      if (i >= stream.length) i = 0;
      cells.push(stream[i]);
      i++;
      if (i === offset && cells.length < need) {
        /* pad if tiny stream */
        while (cells.length < need) {
          cells.push({ lineId: "—", i: -1, ch: "·", display: "·", isLetter: false, pad: true });
        }
        break;
      }
    }
    return { cells: cells, nextOffset: i % Math.max(1, stream.length) };
  }

  function placeTarget(cells, letter) {
    var candidates = [];
    cells.forEach(function (c, idx) {
      if (c.isLetter && c.ch.toUpperCase() === letter) candidates.push(idx);
    });
    if (!candidates.length) {
      /* inject one target into a random non-pad cell */
      var free = [];
      cells.forEach(function (c, idx) {
        if (!c.pad) free.push(idx);
      });
      if (!free.length) return -1;
      var j = free[Math.floor(Math.random() * free.length)];
      cells[j] = {
        lineId: cells[j].lineId || "L01",
        i: cells[j].i || 0,
        ch: letter,
        display: letter,
        isLetter: true,
        injected: true,
      };
      return j;
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
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
      stair: 0,
      unlocked: { S0: true },
      stream: [],
      xref: {},
      offset: 0,
      cells: [],
      targetIdx: -1,
      targetLetter: "E",
      hits: [],
      events: [], /* {t, ok} for NTPM */
      peakBps: 0,
      peakNtpm: 0,
      roundUntil: 0,
      playing: false,
      focusLine: null,
      logs: [],
    };

    root.innerHTML = "";
    root.classList.add("dlg-root");

    var shell = el("div", "dlg-shell");
    var hero = el("div", "dlg-hero");
    var htxt = el("div");
    htxt.innerHTML =
      "<h2>Letter-Grid · Declaration litmus</h2>" +
      "<p>WebGrid-style square chunks of the engrossed Declaration. Hit the " +
      '<span style="color:' +
      TARGET_RGB +
      '">blue</span> letter · cross-ref every line it appears · growth stair unlocks document gateway. Tensor loop for MG / persona scaffold.</p>';
    hero.appendChild(htxt);
    var boardMetrics = el("div", "dlg-scoreboard");
    var mBps = metric("0.00", "BPS");
    var mNtpm = metric("0", "NTPM");
    var mHits = metric("0", "hits");
    var mTimer = metric("1:10", "timer");
    boardMetrics.appendChild(mBps.wrap);
    boardMetrics.appendChild(mNtpm.wrap);
    boardMetrics.appendChild(mHits.wrap);
    boardMetrics.appendChild(mTimer.wrap);
    hero.appendChild(boardMetrics);
    shell.appendChild(hero);

    var layout = el("div", "dlg-layout");
    var boardWrap = el("div", "dlg-board-wrap");
    var boardTop = el("div", "dlg-board-top");
    var prompt = el("div", "dlg-prompt");
    prompt.innerHTML = "Load transcript…";
    var controls = el("div", "dlg-controls");
    var btnPlay = el("button", "", "Play round");
    var btnN12 = el("button", "on", "12×12");
    var btnN8 = el("button", "", "8×8");
    var btnN16 = el("button", "", "16×16");
    controls.appendChild(btnPlay);
    controls.appendChild(btnN8);
    controls.appendChild(btnN12);
    controls.appendChild(btnN16);
    boardTop.appendChild(prompt);
    boardTop.appendChild(controls);
    boardWrap.appendChild(boardTop);
    var board = el("div", "dlg-board");
    boardWrap.appendChild(board);
    var stair = el("div", "dlg-stair");
    boardWrap.appendChild(stair);
    layout.appendChild(boardWrap);

    var side = el("div", "dlg-side");
    var cardX = el("div", "dlg-card");
    cardX.innerHTML = "<h3>Letter cross-ref</h3>";
    var xrefHost = el("div");
    cardX.appendChild(xrefHost);
    side.appendChild(cardX);
    var cardD = el("div", "dlg-card");
    cardD.innerHTML = "<h3>Document gateway</h3>";
    var docHost = el("div", "dlg-doc", "Unlock a stair step or click a cross-ref line.");
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
      if (state.logs.length > 40) state.logs.pop();
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
      mHits.b.textContent = String(state.hits.length);
      if (state.playing) {
        var left = Math.max(0, state.roundUntil - Date.now());
        var sec = Math.ceil(left / 1000);
        var mm = Math.floor(sec / 60);
        var ss = sec % 60;
        mTimer.b.textContent = mm + ":" + String(ss).padStart(2, "0");
      } else {
        mTimer.b.textContent = "—";
      }
    }

    function currentLineIds() {
      return STAIRS[state.stair].lines.slice();
    }

    function rebuildStream() {
      var built = buildLetterStream(state.lines, currentLineIds());
      state.stream = built.stream;
      state.xref = built.xref;
      state.offset = 0;
    }

    function renderStair() {
      stair.innerHTML = "";
      STAIRS.forEach(function (s, idx) {
        var b = el("button", "", s.id + " " + s.label);
        if (state.unlocked[s.id] || idx === 0) b.classList.add("unlocked");
        if (idx === state.stair) b.classList.add("active");
        if (!state.unlocked[s.id] && idx > 0) b.disabled = true;
        b.onclick = function () {
          if (!state.unlocked[s.id] && idx > 0) return;
          state.stair = idx;
          rebuildStream();
          dealBoard(true);
          renderStair();
          slog("stair " + s.id + " · lines " + s.lines.join(","));
        };
        stair.appendChild(b);
      });
    }

    function paintXref(letter) {
      xrefHost.innerHTML = "";
      var head = el("p");
      head.innerHTML = "Target <em style='color:#0a84ff;font-style:normal;font-weight:700'>" + letter + "</em>";
      xrefHost.appendChild(head);
      var arr = state.xref[letter] || [];
      var byLine = {};
      arr.forEach(function (e) {
        byLine[e.lineId] = (byLine[e.lineId] || 0) + 1;
      });
      var ids = Object.keys(byLine).sort();
      var ul = el("ul", "dlg-xref-list");
      ids.forEach(function (id) {
        var li = el("li");
        li.innerHTML =
          '<span class="lid">' +
          id +
          '</span><span class="cnt">×' +
          byLine[id] +
          "</span> " +
          snippet(id, letter);
        li.onclick = function () {
          openLine(id, letter);
        };
        ul.appendChild(li);
      });
      if (!ids.length) {
        xrefHost.appendChild(el("p", "", "No occurrences in this stair window."));
      } else {
        xrefHost.appendChild(ul);
      }
      var total = el("p");
      total.style.marginTop = "6px";
      total.style.opacity = "0.75";
      total.style.fontSize = "0.75rem";
      total.textContent = "window count " + arr.length + " · global letter density used for train bus";
      xrefHost.appendChild(total);
    }

    function snippet(lineId, letter) {
      var ln = state.lineMap[lineId];
      if (!ln) return "";
      var t = ln.text || "";
      var re = new RegExp(letter, "i");
      var m = t.search(re);
      if (m < 0) return t.slice(0, 48);
      var a = Math.max(0, m - 18);
      var b = Math.min(t.length, m + 22);
      return (a > 0 ? "…" : "") + t.slice(a, b) + (b < t.length ? "…" : "");
    }

    function openLine(lineId, letter) {
      state.focusLine = lineId;
      var ln = state.lineMap[lineId];
      if (!ln) {
        docHost.textContent = "Missing " + lineId;
        return;
      }
      var html = "";
      var text = ln.text || "";
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (letter && ch.toUpperCase() === letter) html += "<mark>" + escapeHtml(ch) + "</mark>";
        else html += escapeHtml(ch);
      }
      docHost.innerHTML = "<div><b>" + lineId + "</b> · " + (ln.kind || "") + "</div>" + html;
      gate.innerHTML = "";
      var a1 = el("a", "");
      a1.href = "index.html";
      a1.textContent = "Archive workspace";
      var a2 = el("a", "");
      a2.href = "versions.html";
      a2.textContent = "Line layers";
      var a3 = el("a", "");
      a3.href = "scribe-glyphs.html";
      a3.textContent = "Scribe glyphs";
      var a4 = el("a", "");
      a4.href = "stroke-player.html";
      a4.textContent = "Stroke player";
      var a5 = el("a", "");
      a5.href = "/labs/declaration-digital-edition/";
      a5.textContent = "Edition home";
      /* persona scaffold if served */
      var a6 = el("a", "");
      a6.href = "http://127.0.0.1:8765/persona-tensor-scaffold.html";
      a6.textContent = "MG persona·tensor";
      a6.target = "_blank";
      a6.rel = "noopener";
      var a7 = el("a", "");
      a7.href = "cage-litmus.html";
      a7.textContent = "Cage litmus (RAW+STONE)";
      gate.appendChild(a1);
      gate.appendChild(a7);
      gate.appendChild(a2);
      gate.appendChild(a3);
      gate.appendChild(a4);
      gate.appendChild(a5);
      gate.appendChild(a6);
      try {
        global.dispatchEvent(
          new CustomEvent("kbatch-declaration-line", {
            detail: { lineId: lineId, letter: letter, ver: VER },
          })
        );
      } catch (e) {}
      slog("gateway " + lineId + " · letter " + (letter || "—"));
    }

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    function dealBoard(newLetter) {
      var pack = chunkFromStream(state.stream, state.offset, state.N);
      state.cells = pack.cells;
      state.offset = pack.nextOffset;
      if (newLetter || !state.targetLetter) state.targetLetter = pickTargetLetter(state.stream, state.N);
      state.targetIdx = placeTarget(state.cells, state.targetLetter);
      paintBoard();
      paintXref(state.targetLetter);
      prompt.innerHTML =
        "Find <em>" +
        state.targetLetter +
        "</em> · N=" +
        state.N +
        " · stair " +
        STAIRS[state.stair].id +
        " · blue = target (WebGrid grammar)";
    }

    function paintBoard() {
      board.innerHTML = "";
      board.style.gridTemplateColumns = "repeat(" + state.N + ", 1fr)";
      state.cells.forEach(function (c, idx) {
        var cell = el("button", "dlg-cell", c.display || "·");
        cell.type = "button";
        if (c.pad) cell.classList.add("is-pad");
        if (c.ch === " ") cell.classList.add("is-space");
        if (idx === state.targetIdx) cell.classList.add("is-target");
        cell.dataset.idx = String(idx);
        cell.onclick = function () {
          onCell(idx);
        };
        board.appendChild(cell);
      });
    }

    function onCell(idx) {
      if (!state.playing && opts.requirePlay !== false) {
        /* allow practice clicks too */
      }
      var ok = idx === state.targetIdx;
      var now = Date.now();
      state.events.push({ t: now, ok: ok });
      if (ok) {
        state.hits.push({ t: now, letter: state.targetLetter, lineId: state.cells[idx].lineId });
        openLine(state.cells[idx].lineId, state.targetLetter);
        maybeUnlock();
        slog("hit " + state.targetLetter + " @ " + (state.cells[idx].lineId || "?"));
        /* next target — denser like agent hop */
        state.targetLetter = pickTargetLetter(state.stream, state.N);
        dealBoard(false);
      } else {
        slog("miss cell " + idx);
        var nodes = board.querySelectorAll(".dlg-cell");
        if (nodes[idx]) {
          nodes[idx].classList.add("is-miss");
          setTimeout(function () {
            nodes[idx] && nodes[idx].classList.remove("is-miss");
          }, 180);
        }
      }
      refreshScore();
      try {
        reportTrial(ok);
      } catch (eR) {}
    }

    function maybeUnlock() {
      var need = 8 + state.stair * 4;
      var stairHits = state.hits.filter(function (h) {
        return true;
      }).length;
      if (stairHits >= need && state.stair < STAIRS.length - 1) {
        var next = STAIRS[state.stair + 1];
        if (!state.unlocked[next.id]) {
          state.unlocked[next.id] = true;
          state.stair = state.stair + 1;
          rebuildStream();
          renderStair();
          slog("UNLOCK " + next.id + " · " + next.label + " · document gateway open");
          try {
            global.dispatchEvent(
              new CustomEvent("kbatch-declaration-stair", {
                detail: { stair: next, unlocked: Object.keys(state.unlocked), ver: VER },
              })
            );
          } catch (e) {}
        }
      }
    }

    function reportTrial(ok) {
      var row = {
        kind: "declaration_letter_grid",
        ver: VER,
        t: Date.now(),
        ok: ok,
        letter: state.targetLetter,
        N: state.N,
        stair: STAIRS[state.stair].id,
        bps: bpsFromNtpm(ntpmNow(), state.N),
        ntpm: ntpmNow(),
        peakBps: state.peakBps,
        focusLine: state.focusLine,
      };
      try {
        var key = "kbatch.declaration.letterGrid.trials";
        var prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.push(row);
        if (prev.length > 200) prev = prev.slice(-200);
        localStorage.setItem(key, JSON.stringify(prev));
      } catch (e) {}
      /* optional soak bus */
      try {
        fetch("http://127.0.0.1:9880/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        }).catch(function () {});
      } catch (e2) {}
      try {
        if (global.__mgUgradWebgrid && global.__mgUgradWebgrid.observeCell) {
          /* reuse tensor observe if MG injects */
        }
      } catch (e3) {}
    }

    var tickTimer = null;
    function startRound() {
      state.playing = true;
      state.roundUntil = Date.now() + ROUND_MS;
      state.events = [];
      state.hits = [];
      dealBoard(true);
      slog("round start N=" + state.N + " · " + ROUND_MS / 1000 + "s · peak track BPS");
      if (tickTimer) clearInterval(tickTimer);
      tickTimer = setInterval(function () {
        refreshScore();
        if (Date.now() >= state.roundUntil) {
          state.playing = false;
          clearInterval(tickTimer);
          slog(
            "round end peak " +
              state.peakBps.toFixed(2) +
              " BPS / " +
              state.peakNtpm +
              " NTPM · hits " +
              state.hits.length
          );
          refreshScore();
        }
      }, 200);
      refreshScore();
    }

    btnPlay.onclick = function () {
      startRound();
    };
    function setN(n, btn) {
      state.N = n;
      [btnN8, btnN12, btnN16].forEach(function (b) {
        b.classList.remove("on");
      });
      btn.classList.add("on");
      dealBoard(true);
      refreshScore();
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

    return fetchJson(base + "/full-transcript-lines.json")
      .then(function (data) {
        state.lines = data.lines || [];
        state.lineMap = lineTextMap(state.lines);
        rebuildStream();
        renderStair();
        dealBoard(true);
        refreshScore();
        slog(VER + " · lines " + state.lines.length + " · letters in window " + state.stream.filter(function (e) { return e.isLetter; }).length);
        openLine("L01", state.targetLetter);
        return {
          ver: VER,
          state: state,
          startRound: startRound,
          dealBoard: dealBoard,
        };
      })
      .catch(function (e) {
        prompt.textContent = "Failed to load transcript: " + e;
        slog(String(e));
        throw e;
      });
  }

  global.__kbatchDeclarationLetterGrid = {
    ver: VER,
    mount: mount,
    STAIRS: STAIRS,
    bpsFromNtpm: bpsFromNtpm,
  };
})(typeof window !== "undefined" ? window : globalThis);
