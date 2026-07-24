/**
 * Open Reader Search — mueee.qbitos.ai style layered query
 *
 * Progressive lenses (same spirit as μ'search open-reader):
 *   1. Letter paths  — keyboard geometry path for letter runs
 *   2. Words         — token hits in document lines
 *   3. Punctuation   — punct glyphs & patterns
 *   4. Intonation    — prosody / cadence contours
 *   5. Persona slant — cast / register bias re-rank + annotate
 *
 * Default corpus: Declaration full-transcript. Works on any lines[].
 * MG: window.__openReaderApi · events open-reader-*
 * VER: open-reader-search-v1
 */
(function (global) {
  "use strict";

  var VER = "open-reader-search-v1";
  var LAYERS = [
    { id: "letters", label: "Letter paths", tip: "Letter runs + keyboard geometry path" },
    { id: "words", label: "Words", tip: "Token hits in document lines" },
    { id: "punct", label: "Punctuation", tip: "Punct glyphs · clause marks · quotes" },
    { id: "intonation", label: "Intonation", tip: "Prosody contour · cadence · syllables" },
    { id: "persona", label: "Persona slant", tip: "Vals / Fly / Boris · register lean" },
  ];

  /** QWERTY row/col for letter-path geometry (mueee / shadow-search spirit) */
  var QWERTY = {
    q: [0, 0],
    w: [0, 1],
    e: [0, 2],
    r: [0, 3],
    t: [0, 4],
    y: [0, 5],
    u: [0, 6],
    i: [0, 7],
    o: [0, 8],
    p: [0, 9],
    a: [1, 0],
    s: [1, 1],
    d: [1, 2],
    f: [1, 3],
    g: [1, 4],
    h: [1, 5],
    j: [1, 6],
    k: [1, 7],
    l: [1, 8],
    z: [2, 0],
    x: [2, 1],
    c: [2, 2],
    v: [2, 3],
    b: [2, 4],
    n: [2, 5],
    m: [2, 6],
  };

  var PERSONAS = [
    {
      id: "any",
      label: "Any (no slant)",
      formality: "any",
      tone: "neutral",
      boost: [],
      damp: [],
    },
    {
      id: "vals",
      label: "Vals · handler",
      formality: "precise",
      tone: "control",
      boost: ["order", "prefix", "plate", "key", "cipher", "path", "lattice", "blue"],
      damp: ["story", "fiction", "myth"],
      color: "#64d2ff",
    },
    {
      id: "fly",
      label: "Human Fly · path",
      formality: "slang",
      tone: "motion",
      boost: ["hop", "path", "wall", "climb", "face", "cube", "grid", "bits", "coin"],
      damp: ["stone", "weight"],
      color: "#30d158",
    },
    {
      id: "boris",
      label: "Boris · stone",
      formality: "formal",
      tone: "heavy",
      boost: ["truth", "stone", "raw", "iron", "gall", "fact", "weigh", "material"],
      damp: ["story", "tale", "fiction", "pretend"],
      color: "#c9a227",
    },
    {
      id: "engineer",
      label: "Engineer / ops",
      formality: "shorthand",
      tone: "precise",
      boost: ["system", "layer", "encode", "codec", "grid", "path", "bit", "frame"],
      damp: [],
      color: "#a371f7",
    },
    {
      id: "formal",
      label: "Formal bridge",
      formality: "formal",
      tone: "respectful",
      boost: ["therefore", "whereas", "people", "rights", "law", "government"],
      damp: ["gonna", "yeah", "lol"],
      color: "#79c0ff",
    },
  ];

  var CONTOURS = { rise: "ˤ", fall: "˥", level: "˩", dip: "˨˧" };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function fetchJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("fetch " + url + " " + r.status);
      return r.json();
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function letterPath(text) {
    var letters = String(text || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    var path = [];
    var sig = [];
    for (var i = 0; i < letters.length; i++) {
      var ch = letters[i];
      var rc = QWERTY[ch];
      if (!rc) continue;
      path.push({ ch: ch, r: rc[0], c: rc[1] });
      sig.push(rc[0] + "," + rc[1]);
    }
    return {
      letters: letters,
      path: path,
      sig: sig.join(";"),
      len: path.length,
    };
  }

  function pathSimilarity(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    var aa = a.split(";");
    var bb = b.split(";");
    var n = Math.min(aa.length, bb.length);
    if (!n) return 0;
    var same = 0;
    for (var i = 0; i < n; i++) if (aa[i] === bb[i]) same++;
    var setB = {};
    bb.forEach(function (x) {
      setB[x] = true;
    });
    var shared = 0;
    aa.forEach(function (x) {
      if (setB[x]) shared++;
    });
    var order = same / Math.max(aa.length, bb.length);
    var bag = shared / Math.max(aa.length, bb.length);
    return order * 0.65 + bag * 0.35;
  }

  function countSyllables(word) {
    var w = String(word || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    if (w.length <= 2) return 1;
    var count = 0;
    var prev = false;
    var vowels = { a: 1, e: 1, i: 1, o: 1, u: 1 };
    for (var i = 0; i < w.length; i++) {
      var isV = !!vowels[w[i]];
      if (isV && !prev) count++;
      prev = isV;
    }
    if (w.endsWith("e") && count > 1) count--;
    return Math.max(1, count);
  }

  function toIntonation(text) {
    var words = String(text || "")
      .split(/\s+/)
      .filter(function (w) {
        return w.length > 0;
      });
    var contours = words.map(function (w, i) {
      var sylls = countSyllables(w);
      var isQuestion = /\?$/.test(w) || (i === words.length - 1 && /\?\s*$/.test(text));
      var isExclaim = /!$/.test(w);
      var isEnd = i === words.length - 1;
      var contour = "level";
      if (isQuestion) contour = "rise";
      else if (isExclaim) contour = "fall";
      else if (isEnd) contour = "fall";
      else if (sylls >= 3) contour = "dip";
      return {
        word: w,
        contour: contour,
        symbol: CONTOURS[contour],
        syllables: sylls,
      };
    });
    var last = contours.length ? contours[contours.length - 1].contour : "level";
    return {
      contours: contours,
      pattern: contours
        .map(function (c) {
          return c.symbol;
        })
        .join(" "),
      totalSyllables: contours.reduce(function (s, c) {
        return s + c.syllables;
      }, 0),
      cadence: last === "fall" ? "authentic" : last === "rise" ? "half" : "plagal",
    };
  }

  function extractPunct(text) {
    var raw = String(text || "");
    var marks = [];
    for (var i = 0; i < raw.length; i++) {
      var ch = raw[i];
      if (/[A-Za-z0-9\s]/.test(ch)) continue;
      marks.push({ ch: ch, i: i, code: ch.charCodeAt(0) });
    }
    var classes = {
      stop: /[.!?…]/.test(raw),
      clause: /[,;:]/.test(raw),
      quote: /["'“”‘’]/.test(raw),
      paren: /[()[\]{}]/.test(raw),
      dash: /[-–—]/.test(raw),
    };
    return { marks: marks, classes: classes, count: marks.length };
  }

  function extractWords(text) {
    return (String(text || "").match(/[A-Za-z']+/g) || []).map(function (w) {
      return w.toLowerCase();
    });
  }

  function personaScore(text, persona) {
    if (!persona || persona.id === "any") return { score: 0, hits: [], dampHits: [] };
    var low = String(text || "").toLowerCase();
    var hits = [];
    var dampHits = [];
    var score = 0;
    (persona.boost || []).forEach(function (w) {
      if (low.indexOf(w) >= 0) {
        hits.push(w);
        score += 1.2;
      }
    });
    (persona.damp || []).forEach(function (w) {
      if (low.indexOf(w) >= 0) {
        dampHits.push(w);
        score -= 0.8;
      }
    });
    return { score: score, hits: hits, dampHits: dampHits };
  }

  /**
   * Layered search over document lines.
   * @param {string} query
   * @param {Array<{id,text,kind?}>} lines
   * @param {{ layers?: string[], persona?: string, limit?: number }} opts
   */
  function search(query, lines, opts) {
    opts = opts || {};
    var q = String(query || "").trim();
    var layers = opts.layers && opts.layers.length ? opts.layers : LAYERS.map(function (L) {
      return L.id;
    });
    var layerSet = {};
    layers.forEach(function (id) {
      layerSet[id] = true;
    });
    var persona =
      PERSONAS.find(function (p) {
        return p.id === (opts.persona || "any");
      }) || PERSONAS[0];
    var limit = opts.limit || 40;

    var qPath = letterPath(q);
    var qWords = extractWords(q);
    var qLetters = q.replace(/[^A-Za-z]/g, "").toLowerCase();
    var qPunct = extractPunct(q);
    var qIsPunctOnly = q.length > 0 && !/[A-Za-z0-9]/.test(q);

    var hits = [];

    (lines || []).forEach(function (ln) {
      var text = ln.text || "";
      var low = text.toLowerCase();
      var score = 0;
      var reasons = [];
      var layerHits = {};

      /* 1 · Letters / letter paths */
      if (layerSet.letters && qLetters.length) {
        var lp = letterPath(text);
        var sim = pathSimilarity(qPath.sig, lp.sig);
        var substr = low.replace(/[^a-z]/g, "").indexOf(qLetters) >= 0;
        if (substr) {
          score += 3 + Math.min(2, qLetters.length * 0.15);
          reasons.push("letter-run");
          layerHits.letters = { match: "run", q: qLetters };
        }
        if (sim >= 0.45 && qPath.len >= 2) {
          score += sim * 2.5;
          reasons.push("path~" + sim.toFixed(2));
          layerHits.letters = layerHits.letters || {};
          layerHits.letters.pathSim = +sim.toFixed(3);
          layerHits.letters.sig = lp.sig.slice(0, 80);
        }
        /* single letter frequency */
        if (qLetters.length === 1) {
          var re = new RegExp(qLetters, "gi");
          var m = text.match(re);
          if (m && m.length) {
            score += Math.min(2, m.length * 0.25);
            layerHits.letters = { match: "count", count: m.length, ch: qLetters };
            reasons.push("×" + m.length);
          }
        }
      }

      /* 2 · Words */
      if (layerSet.words && qWords.length) {
        var lineWords = extractWords(text);
        var bag = {};
        lineWords.forEach(function (w) {
          bag[w] = (bag[w] || 0) + 1;
        });
        var matched = [];
        qWords.forEach(function (w) {
          if (bag[w]) {
            matched.push(w);
            score += 2.2 + Math.min(1, bag[w] * 0.2);
          } else if (low.indexOf(w) >= 0) {
            matched.push(w + "~");
            score += 1.2;
          }
        });
        if (matched.length) {
          reasons.push("words:" + matched.join(","));
          layerHits.words = { matched: matched, coverage: matched.length / qWords.length };
        }
      }

      /* 3 · Punctuation */
      if (layerSet.punct) {
        var punct = extractPunct(text);
        if (qIsPunctOnly) {
          var want = q.replace(/\s/g, "");
          var hasAll = true;
          for (var pi = 0; pi < want.length; pi++) {
            if (text.indexOf(want[pi]) < 0) hasAll = false;
          }
          if (hasAll && want.length) {
            score += 4;
            reasons.push("punct-exact");
            layerHits.punct = { query: want, marks: punct.count };
          }
        } else if (qPunct.count && punct.count) {
          var sharedP = 0;
          qPunct.marks.forEach(function (pm) {
            if (text.indexOf(pm.ch) >= 0) sharedP++;
          });
          if (sharedP) {
            score += sharedP * 0.6;
            layerHits.punct = { shared: sharedP, classes: punct.classes, count: punct.count };
            reasons.push("punct×" + sharedP);
          }
        } else if (!q && punct.count) {
          /* empty query + punct layer = surface lines rich in punct */
          score += Math.min(1.5, punct.count * 0.08);
          layerHits.punct = { count: punct.count, classes: punct.classes };
        }
      }

      /* 4 · Intonation */
      if (layerSet.intonation) {
        var inton = toIntonation(text);
        layerHits.intonation = {
          pattern: inton.pattern,
          cadence: inton.cadence,
          syllables: inton.totalSyllables,
        };
        if (q.indexOf("?") >= 0 && inton.cadence === "half") {
          score += 1.5;
          reasons.push("rise-cadence");
        }
        if (q.indexOf("!") >= 0 && /fall|authentic/.test(inton.cadence)) {
          score += 1.2;
          reasons.push("fall-cadence");
        }
        /* soft boost if query words share contour density */
        if (qWords.length && inton.totalSyllables) {
          score += Math.min(0.8, inton.totalSyllables * 0.02);
        }
      }

      /* 5 · Persona slant */
      if (layerSet.persona && persona.id !== "any") {
        var ps = personaScore(text, persona);
        score += ps.score;
        if (ps.hits.length || ps.dampHits.length) {
          layerHits.persona = {
            id: persona.id,
            label: persona.label,
            boost: ps.hits,
            damp: ps.dampHits,
            delta: +ps.score.toFixed(2),
          };
          if (ps.hits.length) reasons.push("slant+" + ps.hits.join("|"));
          if (ps.dampHits.length) reasons.push("slant-" + ps.dampHits.join("|"));
        }
      }

      /* free-text fallback when no specialized layer fired hard */
      if (q && score < 0.5 && low.indexOf(q.toLowerCase()) >= 0) {
        score += 1.5;
        reasons.push("substr");
      }

      if (score > 0.35 || (layerSet.intonation && !q && text.length > 20)) {
        hits.push({
          lineId: ln.id,
          kind: ln.kind || "",
          text: text,
          score: +score.toFixed(3),
          reasons: reasons,
          layers: layerHits,
          path: letterPath(text),
          punct: extractPunct(text),
          intonation: toIntonation(text),
          parent: ln.parentEngrossed || ln.id,
        });
      }
    });

    hits.sort(function (a, b) {
      return b.score - a.score;
    });
    hits = hits.slice(0, limit);

    return {
      schema: "kbatch-open-reader-search-v1",
      ver: VER,
      query: q,
      layers: layers,
      persona: persona,
      hitCount: hits.length,
      hits: hits,
      qPath: qPath,
      at: new Date().toISOString(),
    };
  }

  function highlightHtml(text, query) {
    var t = escapeHtml(text);
    var q = String(query || "").trim();
    if (!q || q.length < 1) return t;
    try {
      var parts = q.match(/[A-Za-z']+|[^\sA-Za-z]+/g) || [q];
      parts.forEach(function (p) {
        if (!p || p.length < 1) return;
        var re = new RegExp("(" + p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
        t = t.replace(re, "<mark>$1</mark>");
      });
    } catch (e) {}
    return t;
  }

  function mount(root, opts) {
    opts = opts || {};
    var base = opts.dataBase || "/data/declaration";
    root.innerHTML = "";
    root.classList.add("ors-root");

    var state = {
      lines: [],
      lineMap: {},
      layers: LAYERS.map(function (L) {
        return L.id;
      }),
      persona: "any",
      last: null,
      openId: null,
    };

    var shell = el("div", "ors-shell");
    var hero = el("div", "ors-hero");
    hero.innerHTML =
      "<h2>Open Reader Search</h2>" +
      "<p>μ'search-style lenses on the codex: <b>letter paths</b> → <b>words</b> → " +
      "<b>punctuation</b> → <b>intonation</b> → <b>persona slant</b> · open hit in reader.</p>";
    shell.appendChild(hero);

    /* layer chips */
    var layerBar = el("div", "ors-layers");
    layerBar.setAttribute("role", "group");
    layerBar.setAttribute("aria-label", "Search layers");
    LAYERS.forEach(function (L) {
      var b = el("button", "ors-chip on", L.label);
      b.type = "button";
      b.dataset.layer = L.id;
      b.title = L.tip;
      b.onclick = function () {
        var on = b.classList.toggle("on");
        if (on) {
          if (state.layers.indexOf(L.id) < 0) state.layers.push(L.id);
        } else {
          state.layers = state.layers.filter(function (x) {
            return x !== L.id;
          });
        }
        if (!state.layers.length) {
          state.layers = [L.id];
          b.classList.add("on");
        }
        runSearch();
      };
      layerBar.appendChild(b);
    });
    shell.appendChild(layerBar);

    /* persona slant */
    var slantRow = el("div", "ors-slant-row");
    slantRow.appendChild(el("span", "ors-slant-lab", "Persona slant"));
    var slantSel = document.createElement("select");
    slantSel.className = "ors-select";
    slantSel.setAttribute("aria-label", "Persona slant");
    PERSONAS.forEach(function (p) {
      var o = document.createElement("option");
      o.value = p.id;
      o.textContent = p.label;
      slantSel.appendChild(o);
    });
    slantSel.onchange = function () {
      state.persona = slantSel.value;
      runSearch();
    };
    slantRow.appendChild(slantSel);
    shell.appendChild(slantRow);

    /* prompt */
    var promptRow = el("div", "ors-prompt-row");
    var input = document.createElement("textarea");
    input.className = "ors-input";
    input.rows = 2;
    input.placeholder =
      "Letter path, word, punct (? ! —), or cadence… Enter to search · like mueee open reader";
    input.setAttribute("aria-label", "Search query");
    var btnGo = el("button", "primary", "Search");
    var btnClear = el("button", "", "Clear");
    promptRow.appendChild(input);
    promptRow.appendChild(btnGo);
    promptRow.appendChild(btnClear);
    shell.appendChild(promptRow);

    var meta = el("div", "ors-meta", "Load codex…");
    shell.appendChild(meta);

    var layout = el("div", "ors-layout");
    var results = el("div", "ors-results");
    results.setAttribute("role", "list");
    var reader = el("div", "ors-reader");
    reader.innerHTML =
      '<div class="ors-reader-head"><b id="ors-reader-title">Reader</b>' +
      '<span id="ors-reader-src" class="ors-reader-src"></span></div>' +
      '<div class="ors-reader-tabs">' +
      '<button type="button" class="on" data-tab="content">Content</button>' +
      '<button type="button" data-tab="analysis">Analysis</button>' +
      '<button type="button" data-tab="path">Letter path</button>' +
      '<button type="button" data-tab="intonation">Intonation</button>' +
      "</div>" +
      '<div class="ors-reader-body" id="ors-reader-body">' +
      '<p class="ors-dim">Search, then open a hit in the reader.</p></div>';
    layout.appendChild(results);
    layout.appendChild(reader);
    shell.appendChild(layout);

    var gate = el("div", "ors-gateway");
    [
      ["letter-grid.html", "Letter-Grid"],
      ["steno-space-grid.html", "Steno spaces"],
      ["saint-tumble.html", "Saint tumble"],
      ["https://mueee.qbitos.ai/search.html", "mueee search ↗"],
    ].forEach(function (p) {
      var a = el("a", "");
      a.href = p[0];
      a.textContent = p[1];
      if (/^http/.test(p[0])) {
        a.target = "_blank";
        a.rel = "noopener";
      }
      gate.appendChild(a);
    });
    shell.appendChild(gate);
    root.appendChild(shell);

    var readerTab = "content";
    var readerHit = null;

    reader.querySelectorAll(".ors-reader-tabs button").forEach(function (b) {
      b.onclick = function () {
        reader.querySelectorAll(".ors-reader-tabs button").forEach(function (x) {
          x.classList.remove("on");
        });
        b.classList.add("on");
        readerTab = b.getAttribute("data-tab");
        paintReader();
      };
    });

    function paintReader() {
      var title = reader.querySelector("#ors-reader-title");
      var src = reader.querySelector("#ors-reader-src");
      var body = reader.querySelector("#ors-reader-body");
      if (!readerHit) {
        if (title) title.textContent = "Reader";
        if (src) src.textContent = "";
        if (body)
          body.innerHTML = '<p class="ors-dim">Search, then open a hit in the reader.</p>';
        return;
      }
      var h = readerHit;
      if (title) title.textContent = h.lineId + (h.kind ? " · " + h.kind : "");
      if (src) src.textContent = "score " + h.score + " · " + (h.reasons || []).join(" · ");
      if (!body) return;
      if (readerTab === "content") {
        body.innerHTML =
          '<div class="ors-doc">' +
          highlightHtml(h.text, state.last && state.last.query) +
          "</div>" +
          '<div class="ors-reader-actions">' +
          '<a class="ors-btn" href="letter-grid.html">Letter-Grid</a>' +
          '<a class="ors-btn" href="steno-space-grid.html">Steno spaces</a>' +
          "</div>";
      } else if (readerTab === "analysis") {
        var layers = h.layers || {};
        body.innerHTML =
          '<ul class="ors-analysis">' +
          "<li><b>Score</b> " +
          h.score +
          "</li>" +
          "<li><b>Reasons</b> " +
          escapeHtml((h.reasons || []).join(", ") || "—") +
          "</li>" +
          "<li><b>Punct</b> " +
          (h.punct ? h.punct.count + " marks" : "—") +
          "</li>" +
          "<li><b>Words layer</b> " +
          escapeHtml(JSON.stringify(layers.words || {})) +
          "</li>" +
          "<li><b>Persona</b> " +
          escapeHtml(JSON.stringify(layers.persona || {})) +
          "</li>" +
          "</ul>";
      } else if (readerTab === "path") {
        var p = h.path || letterPath(h.text);
        body.innerHTML =
          '<p class="ors-path-sig"><b>Path sig</b> <code>' +
          escapeHtml(p.sig || "—") +
          "</code></p>" +
          '<p class="ors-path-letters">' +
          escapeHtml(p.letters || "") +
          "</p>" +
          '<div class="ors-path-dots">' +
          (p.path || [])
            .map(function (pt) {
              return (
                '<span class="ors-dot" title="' +
                pt.ch +
                " r" +
                pt.r +
                "c" +
                pt.c +
                '" style="--r:' +
                pt.r +
                ";--c:" +
                pt.c +
                '">' +
                escapeHtml(pt.ch) +
                "</span>"
              );
            })
            .join("") +
          "</div>";
      } else if (readerTab === "intonation") {
        var it = h.intonation || toIntonation(h.text);
        body.innerHTML =
          '<p class="ors-inton-pattern">' +
          escapeHtml(it.pattern) +
          "</p>" +
          "<p>Cadence <b>" +
          escapeHtml(it.cadence) +
          "</b> · syllables <b>" +
          it.totalSyllables +
          "</b></p>" +
          '<ul class="ors-inton-list">' +
          (it.contours || [])
            .map(function (c) {
              return (
                "<li><span class=\"sym\">" +
                escapeHtml(c.symbol) +
                "</span> " +
                escapeHtml(c.word) +
                " <i>" +
                c.contour +
                " · " +
                c.syllables +
                "syll</i></li>"
              );
            })
            .join("") +
          "</ul>";
      }
    }

    function openHit(hit) {
      readerHit = hit;
      state.openId = hit.lineId;
      paintReader();
      results.querySelectorAll(".ors-hit").forEach(function (n) {
        n.classList.toggle("is-open", n.dataset.lineId === hit.lineId);
      });
      try {
        global.dispatchEvent(
          new CustomEvent("open-reader-open", { detail: hit })
        );
      } catch (e) {}
    }

    function paintResults(pack) {
      results.innerHTML = "";
      if (!pack || !pack.hits.length) {
        results.innerHTML =
          '<p class="ors-dim">No hits · try another layer combo or shorter query.</p>';
        return;
      }
      pack.hits.forEach(function (h, idx) {
        var card = el("article", "ors-hit");
        card.setAttribute("role", "listitem");
        card.dataset.lineId = h.lineId;
        if (state.openId === h.lineId) card.classList.add("is-open");

        var head = el("div", "ors-hit-head");
        var lead = el("button", "ors-hit-lead");
        lead.type = "button";
        lead.innerHTML =
          '<span class="ors-hit-id">' +
          escapeHtml(h.lineId) +
          '</span><span class="ors-hit-score">' +
          h.score.toFixed(2) +
          "</span>" +
          '<span class="ors-hit-snip">' +
          highlightHtml(h.text.slice(0, 160), pack.query) +
          (h.text.length > 160 ? "…" : "") +
          "</span>";
        lead.onclick = function () {
          openHit(h);
        };
        head.appendChild(lead);
        card.appendChild(head);

        var body = el("div", "ors-hit-body");
        var chips = el("div", "ors-hit-chips");
        Object.keys(h.layers || {}).forEach(function (lk) {
          var chip = el("span", "ors-layer-tag", lk);
          chips.appendChild(chip);
        });
        if (h.intonation && h.intonation.pattern) {
          var ic = el("span", "ors-inton-chip", h.intonation.pattern);
          chips.appendChild(ic);
        }
        body.appendChild(chips);
        if (h.reasons && h.reasons.length) {
          body.appendChild(
            el("div", "ors-hit-reasons", h.reasons.slice(0, 6).join(" · "))
          );
        }
        var openBtn = el("button", "ors-open-reader", "Open in reader");
        openBtn.type = "button";
        openBtn.onclick = function (e) {
          e.stopPropagation();
          openHit(h);
        };
        body.appendChild(openBtn);
        card.appendChild(body);
        results.appendChild(card);

        /* first hit auto-preview */
        if (idx === 0 && !readerHit) openHit(h);
      });
    }

    function runSearch() {
      var q = input.value;
      var pack = search(q, state.lines, {
        layers: state.layers.slice(),
        persona: state.persona,
        limit: 48,
      });
      state.last = pack;
      meta.textContent =
        (q ? "“" + q.slice(0, 40) + (q.length > 40 ? "…" : "") + "” · " : "browse · ") +
        pack.hitCount +
        " hits · layers " +
        pack.layers.join("+") +
        (pack.persona && pack.persona.id !== "any"
          ? " · slant " + pack.persona.label
          : "");
      paintResults(pack);
      try {
        global.__openReaderLast = pack;
        global.dispatchEvent(
          new CustomEvent("open-reader-search", { detail: pack })
        );
      } catch (e) {}
      try {
        fetch("http://127.0.0.1:9880/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "open_reader_search",
            ver: VER,
            query: pack.query,
            hits: pack.hitCount,
            layers: pack.layers,
            persona: pack.persona && pack.persona.id,
          }),
        }).catch(function () {});
      } catch (e2) {}
      return pack;
    }

    btnGo.onclick = function () {
      runSearch();
    };
    btnClear.onclick = function () {
      input.value = "";
      readerHit = null;
      state.openId = null;
      paintReader();
      runSearch();
    };
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        runSearch();
      }
    });

    return fetchJson(base + "/full-transcript-lines.json")
      .then(function (d) {
        return d.lines || [];
      })
      .then(function (lines) {
        state.lines = lines;
        state.lineMap = {};
        lines.forEach(function (ln) {
          state.lineMap[ln.id] = ln;
        });
        meta.textContent =
          VER + " · " + lines.length + " lines · layers " + state.layers.join("+");
        /* seed query from URL */
        try {
          var u = new URL(location.href);
          var q0 = u.searchParams.get("q") || u.searchParams.get("query");
          if (q0) input.value = q0;
          var p0 = u.searchParams.get("persona") || u.searchParams.get("slant");
          if (p0) {
            state.persona = p0;
            slantSel.value = p0;
          }
          var L0 = u.searchParams.get("layers");
          if (L0) {
            state.layers = L0.split(",").filter(Boolean);
            layerBar.querySelectorAll(".ors-chip").forEach(function (b) {
              b.classList.toggle(
                "on",
                state.layers.indexOf(b.dataset.layer) >= 0
              );
            });
          }
        } catch (e3) {}
        runSearch();

        var api = {
          ver: VER,
          LAYERS: LAYERS,
          PERSONAS: PERSONAS,
          search: function (q, o) {
            return search(q, state.lines, o || { layers: state.layers, persona: state.persona });
          },
          run: runSearch,
          openLine: function (id) {
            var hit =
              (state.last &&
                state.last.hits.find(function (h) {
                  return h.lineId === id;
                })) ||
              null;
            if (!hit && state.lineMap[id]) {
              hit = {
                lineId: id,
                text: state.lineMap[id].text,
                score: 0,
                reasons: ["direct"],
                layers: {},
                path: letterPath(state.lineMap[id].text),
                punct: extractPunct(state.lineMap[id].text),
                intonation: toIntonation(state.lineMap[id].text),
              };
            }
            if (hit) openHit(hit);
            return hit;
          },
          letterPath: letterPath,
          toIntonation: toIntonation,
          last: function () {
            return state.last;
          },
        };
        try {
          global.__openReaderApi = api;
          global.__mgOpenReaderApi = api;
        } catch (e4) {}
        return api;
      })
      .catch(function (e) {
        meta.textContent = "Failed: " + e;
        throw e;
      });
  }

  global.__kbatchOpenReaderSearch = {
    ver: VER,
    LAYERS: LAYERS,
    PERSONAS: PERSONAS,
    search: search,
    letterPath: letterPath,
    toIntonation: toIntonation,
    extractPunct: extractPunct,
    pathSimilarity: pathSimilarity,
    mount: mount,
  };
})(typeof window !== "undefined" ? window : globalThis);
