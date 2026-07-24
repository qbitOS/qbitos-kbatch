/**
 * Steno-Space Letter-Grid
 *
 * Letter-grid of every whitespace slot stenoSTRIP'd from a document
 * (Declaration full transcript by default). Test harness for:
 *   · GrokYtalkY bust glyph chat (13² / 25² matrices in blank coins)
 *   · video qbit codec frames (glyph sequence over space rail)
 *   · QR-like lattice from Rubik origin-tree for solving + number gen
 *
 * Alphabet: 13 STENO_SPACES · log2(13)≈3.7 bits/symbol · ~19 bits/line claim
 * MG: window.__stenoSpaceGridApi · events steno-space-grid-*
 * VER: steno-space-letter-grid-v1
 */
(function (global) {
  "use strict";

  var VER = "steno-space-letter-grid-v1";
  var DEFAULT_N = 13; /* GY default matches alphabet length */
  var GLYPH_SIZES = [13, 25, 37, 49];

  /** 13 space-class code points (stenoSTRIP alphabet) */
  var STENO_SPACES = [
    "\u0020", // 0 SPACE
    "\u00A0", // 1 NO-BREAK
    "\u2000", // 2 EN QUAD
    "\u2001", // 3 EM QUAD
    "\u2002", // 4 EN SPACE
    "\u2003", // 5 EM SPACE
    "\u2004", // 6 THREE-PER-EM
    "\u2005", // 7 FOUR-PER-EM
    "\u2006", // 8 SIX-PER-EM
    "\u2007", // 9 FIGURE
    "\u2008", // 10 PUNCTUATION
    "\u2009", // 11 THIN
    "\u200A", // 12 HAIR
  ];

  var SPACE_LABELS = [
    "SP",
    "NBSP",
    "ENQ",
    "EMQ",
    "EN",
    "EM",
    "3/EM",
    "4/EM",
    "6/EM",
    "FIG",
    "PUN",
    "THIN",
    "HAIR",
  ];

  var CUBE_FACES = ["U", "D", "F", "B", "L", "R"];

  /** Minimal origin-tree path seeds for QR / number gen (dictionary STEPPING_PATHS subset) */
  var ORIGIN_TREES = [
    { id: "germanic", label: "Germanic", family: "Germanic", color: "#58a6ff" },
    { id: "romance", label: "Romance", family: "Romance", color: "#f778ba" },
    { id: "hellenic", label: "Hellenic", family: "Hellenic", color: "#79c0ff" },
    { id: "slavic", label: "Slavic", family: "Slavic", color: "#a371f7" },
    { id: "semitic", label: "Semitic", family: "Semitic", color: "#3fb950" },
    { id: "sinitic", label: "Sinitic", family: "Sinitic", color: "#f85149" },
    { id: "algic", label: "Algic", family: "Algic", color: "#e3b341" },
    { id: "austronesian", label: "Austronesian", family: "Austronesian", color: "#56d4dd" },
  ];

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

  function spaceIndex(ch) {
    var i = STENO_SPACES.indexOf(ch);
    if (i >= 0) return i;
    if (ch === "\n" || ch === "\r") return -2; /* newline sentinel */
    if (ch === "\t") return -3;
    if (/\s/.test(ch)) return 0; /* map other ws → plain space slot */
    return -1;
  }

  /**
   * Extract every whitespace slot from document text in reading order.
   * Each slot: { si, ch, code, alphabet, label, lineId, docI, isNewline }
   */
  function extractSpaceStream(lines) {
    var stream = [];
    var si = 0;
    lines.forEach(function (ln) {
      var text = ln.text || "";
      var id = ln.id || "—";
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        var idx = spaceIndex(ch);
        if (idx === -1) continue;
        stream.push({
          si: si++,
          ch: ch,
          code: ch.charCodeAt(0),
          alphabet: idx >= 0 ? idx : idx === -2 ? "NL" : "TAB",
          label: idx >= 0 ? SPACE_LABELS[idx] : idx === -2 ? "NL" : "TAB",
          lineId: id,
          docI: i,
          isNewline: idx === -2,
          bits: idx >= 0 ? Math.log(STENO_SPACES.length) / Math.LN2 : 0,
        });
      }
      /* join lines with virtual newline if not already ending with one */
      if (text.length && text[text.length - 1] !== "\n") {
        stream.push({
          si: si++,
          ch: "\n",
          code: 10,
          alphabet: "NL",
          label: "NL",
          lineId: id,
          docI: text.length,
          isNewline: true,
          bits: 0,
          virtual: true,
        });
      }
    });
    return stream;
  }

  /** Build master letter stream (A–Z only) for dual-view with spaces */
  function extractLetterStream(lines) {
    var master = [];
    lines.forEach(function (ln) {
      var text = ln.text || "";
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (/[A-Za-z]/.test(ch)) {
          master.push({ gi: master.length, ch: ch, lineId: ln.id, i: i });
        }
      }
    });
    return master;
  }

  /**
   * Strip document to visible glyphs only (spaces removed).
   * Reconstruct with optional remapped space stream (codec write-back).
   */
  function stripDocument(lines) {
    var visible = [];
    var spaces = extractSpaceStream(lines);
    lines.forEach(function (ln) {
      var t = (ln.text || "").replace(/\s+/g, "");
      if (t) visible.push({ id: ln.id, text: t });
    });
    return { visible: visible, spaces: spaces };
  }

  function layerWindow(stream, start, N) {
    var need = N * N;
    var cells = [];
    for (var k = 0; k < need; k++) {
      var si = start + k;
      if (si < stream.length) {
        cells.push(Object.assign({}, stream[si], { pad: false }));
      } else {
        cells.push({
          si: -1,
          label: "·",
          alphabet: -1,
          pad: true,
          isNewline: false,
        });
      }
    }
    return cells;
  }

  /** Pack 3-bit groups into STENO_SPACES indices 0–7 (encode path) */
  function encodePayloadToAlphabet(payload) {
    var bytes =
      typeof TextEncoder !== "undefined"
        ? new TextEncoder().encode(String(payload || ""))
        : [];
    var bits = "";
    for (var i = 0; i < bytes.length; i++) {
      bits += bytes[i].toString(2).padStart(8, "0");
    }
    while (bits.length % 3) bits += "0";
    var indices = [];
    for (var j = 0; j < bits.length; j += 3) {
      indices.push(parseInt(bits.slice(j, j + 3), 2) % 8);
    }
    return indices;
  }

  /**
   * Write payload into space stream (remap alphabet indices in order).
   * Leaves NL/TAB alone; only remaps alphabet slots 0–12.
   */
  function writePayloadIntoSpaces(stream, payload) {
    var indices = encodePayloadToAlphabet(payload);
    var out = stream.map(function (s) {
      return Object.assign({}, s);
    });
    var p = 0;
    for (var i = 0; i < out.length && p < indices.length; i++) {
      if (typeof out[i].alphabet === "number" && out[i].alphabet >= 0) {
        var idx = indices[p++];
        out[i].alphabet = idx;
        out[i].ch = STENO_SPACES[idx];
        out[i].code = STENO_SPACES[idx].charCodeAt(0);
        out[i].label = SPACE_LABELS[idx];
        out[i].encoded = true;
      }
    }
    return { stream: out, symbolsUsed: p, payloadBits: indices.length * 3 };
  }

  /**
   * GrokYtalkY bust glyph from text → n×n binary matrix.
   * Simple density hash (not ML) for chat frame testing.
   */
  function glyphFromText(text, n) {
    n = n || DEFAULT_N;
    var size = n * n;
    var bits = new Array(size).fill(0);
    var s = String(text || "");
    if (!s) return bits;
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
      var pos = (h >>> 0) % size;
      bits[pos] = 1;
      bits[(pos + s.charCodeAt(i)) % size] ^= 1;
    }
    /* center cross for bust readability */
    var mid = (n / 2) | 0;
    for (var c = 0; c < n; c++) {
      bits[mid * n + c] = 1;
      bits[c * n + mid] = 1;
    }
    return bits;
  }

  /**
   * Rubik origin-tree → QR-like module lattice + number generation.
   * Numbers: path-id hash, face sequence, sticker solve order.
   */
  function rubikOriginQr(tree, opts) {
    opts = opts || {};
    var n = opts.n || DEFAULT_N;
    var size = n * n;
    var modules = new Array(size).fill(0);
    var t = tree || ORIGIN_TREES[0];
    var seed = String(t.id) + "|" + (opts.salt || "") + "|" + n;
    var h = 0x811c9dc5;
    for (var i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    /* finder-ish corners (QR flavor, educational) */
    function paintFinder(r0, c0) {
      for (var r = 0; r < 5 && r0 + r < n; r++) {
        for (var c = 0; c < 5 && c0 + c < n; c++) {
          var on = r === 0 || c === 0 || r === 4 || c === 4 || (r >= 2 && r <= 2 && c >= 2 && c <= 2);
          if (r >= 1 && r <= 3 && c >= 1 && c <= 3) on = r === 2 && c === 2 ? 1 : r === 1 || r === 3 || c === 1 || c === 3 ? 0 : 1;
          if (r === 0 || r === 4 || c === 0 || c === 4) on = 1;
          if (r >= 1 && r <= 3 && c >= 1 && c <= 3) {
            on = !(r === 1 || r === 3 || c === 1 || c === 3) || (r === 2 && c === 2);
            if (r === 1 || r === 3 || c === 1 || c === 3) on = 0;
            else on = 1;
          }
          modules[(r0 + r) * n + (c0 + c)] = on ? 1 : 0;
        }
      }
    }
    if (n >= 7) {
      paintFinder(0, 0);
      paintFinder(0, n - 5);
      paintFinder(n - 5, 0);
    }
    /* data modules from hash + face cycle */
    var faceSeq = [];
    for (var k = 0; k < size; k++) {
      h = Math.imul(h ^ (k + 1), 0x01000193);
      var bit = (h >>> (k % 16)) & 1;
      if (!modules[k]) modules[k] = bit;
      faceSeq.push(CUBE_FACES[k % 6]);
    }
    /* numbers for solving / generation */
    var numbers = {
      treeId: t.id,
      family: t.family,
      n: n,
      seed32: h >>> 0,
      pathNumber: (h ^ t.id.length * 0x9e3779b9) >>> 0,
      faceChecksum: faceSeq.reduce(function (a, f, i) {
        return (a + f.charCodeAt(0) * (i + 1)) >>> 0;
      }, 0),
      modulePopcount: modules.reduce(function (a, b) {
        return a + b;
      }, 0),
      solveKey: ((h >>> 0) % 900719) + 100000,
      qrVersionHint: n <= 13 ? 1 : n <= 25 ? 2 : 3,
    };
    return {
      schema: "kbatch-rubik-origin-qr-v1",
      tree: t,
      n: n,
      modules: modules,
      faceSeq: faceSeq.slice(0, 24),
      numbers: numbers,
      claim:
        "Educational QR-like lattice from Rubik origin tree — not a standards QR encoder",
    };
  }

  /** Video qbit codec: sequence of glyph frames from chat lines */
  function videoQbitFrames(lines, n) {
    n = n || DEFAULT_N;
    return (lines || []).map(function (line, i) {
      var bits = glyphFromText(line, n);
      return {
        frame: i,
        n: n,
        text: line,
        bits: bits,
        pop: bits.reduce(function (a, b) {
          return a + b;
        }, 0),
        qbit:
          "qbit:frame:" +
          i +
          ":n" +
          n +
          ":p" +
          bits.reduce(function (a, b) {
            return a + b;
          }, 0),
      };
    });
  }

  function mount(root, opts) {
    opts = opts || {};
    var base = opts.dataBase || "/data/declaration";
    var N = opts.N || DEFAULT_N;

    var state = {
      N: N,
      lines: [],
      spaces: [],
      letters: [],
      layerStart: 0,
      cells: [],
      mode: "spaces", /* spaces | glyph | qr | dual */
      tree: ORIGIN_TREES[0],
      qr: null,
      glyphBits: null,
      frames: [],
      frameI: 0,
      encoded: null,
      payload: "",
      logs: [],
    };

    root.innerHTML = "";
    root.classList.add("ssg-root");
    var shell = el("div", "ssg-shell");

    var hero = el("div", "ssg-hero");
    hero.innerHTML =
      "<h2>Steno-Space Letter-Grid</h2>" +
      "<p>Every whitespace slot <b>stenoSTRIP</b>'d from the document — " +
      "GrokYtalkY <b>bust glyph chat</b> · <b>video qbit codec</b> frames · " +
      "<b>Rubik origin-tree QR</b> for solving &amp; number generation.</p>";
    shell.appendChild(hero);

    var metrics = el("div", "ssg-metrics");
    var mSlots = metric("0", "space slots");
    var mAlpha = metric("0", "alphabet");
    var mCoins = metric("0", "blank coins");
    var mLayer = metric("0", "layer");
    metrics.appendChild(mSlots.wrap);
    metrics.appendChild(mAlpha.wrap);
    metrics.appendChild(mCoins.wrap);
    metrics.appendChild(mLayer.wrap);
    shell.appendChild(metrics);

    var controls = el("div", "ssg-controls");
    var btnN13 = el("button", "on", "13×13");
    var btnN25 = el("button", "", "25×25");
    var btnSpaces = el("button", "on", "Spaces");
    var btnGlyph = el("button", "", "Glyph bust");
    var btnQr = el("button", "", "Rubik QR");
    var btnDual = el("button", "", "Dual");
    var btnPrev = el("button", "", "◀ layer");
    var btnNext = el("button", "", "layer ▶");
    [btnN13, btnN25, btnSpaces, btnGlyph, btnQr, btnDual, btnPrev, btnNext].forEach(
      function (b) {
        controls.appendChild(b);
      }
    );
    shell.appendChild(controls);

    var chat = el("div", "ssg-chat");
    chat.innerHTML = "<h3>GrokYtalkY bust glyph chat</h3>";
    var ta = document.createElement("textarea");
    ta.className = "ssg-ta";
    ta.rows = 3;
    ta.placeholder = "Type a bust line — encodes into glyph matrix over the space rail…";
    ta.value = "GrokYtalkY bust · qbit codec frame · solve the origin tree";
    var chatBtns = el("div", "ssg-controls");
    var btnBust = el("button", "primary", "Bust glyph → spaces");
    var btnVideo = el("button", "", "Video qbit frames");
    var btnEncode = el("button", "", "Encode payload in spaces");
    chatBtns.appendChild(btnBust);
    chatBtns.appendChild(btnVideo);
    chatBtns.appendChild(btnEncode);
    chat.appendChild(ta);
    chat.appendChild(chatBtns);
    shell.appendChild(chat);

    var treeRow = el("div", "ssg-trees");
    ORIGIN_TREES.forEach(function (t) {
      var b = el("button", "ssg-tree", t.label);
      b.style.setProperty("--col", t.color);
      b.dataset.tree = t.id;
      if (t.id === state.tree.id) b.classList.add("on");
      b.onclick = function () {
        state.tree = t;
        treeRow.querySelectorAll(".ssg-tree").forEach(function (x) {
          x.classList.remove("on");
        });
        b.classList.add("on");
        if (state.mode === "qr") paintBoard();
        refreshQrPanel();
      };
      treeRow.appendChild(b);
    });
    shell.appendChild(treeRow);

    var layout = el("div", "ssg-layout");
    var boardWrap = el("div", "ssg-board-wrap");
    var prompt = el("div", "ssg-prompt", "Load document spaces…");
    boardWrap.appendChild(prompt);
    var board = el("div", "ssg-board");
    boardWrap.appendChild(board);
    layout.appendChild(boardWrap);

    var side = el("div", "ssg-side");
    var qrPanel = el("div", "ssg-card");
    qrPanel.innerHTML = "<h3>Rubik origin QR · numbers</h3>";
    var qrHost = el("div", "ssg-qr-host");
    var numHost = el("pre", "ssg-nums");
    qrPanel.appendChild(qrHost);
    qrPanel.appendChild(numHost);
    side.appendChild(qrPanel);

    var glyphPanel = el("div", "ssg-card");
    glyphPanel.innerHTML = "<h3>Glyph / video frames</h3>";
    var glyphHost = el("div", "ssg-glyph-host");
    var frameMeta = el("div", "ssg-frame-meta");
    glyphPanel.appendChild(glyphHost);
    glyphPanel.appendChild(frameMeta);
    side.appendChild(glyphPanel);

    var logCard = el("div", "ssg-card");
    logCard.innerHTML = "<h3>Session</h3>";
    var logHost = el("div", "ssg-log");
    logCard.appendChild(logHost);
    side.appendChild(logCard);

    var gate = el("div", "ssg-gateway");
    [
      ["letter-grid.html", "Letter-Grid glyphs"],
      ["open-reader.html", "Open reader"],
      ["saint-tumble.html", "Saint tumble"],
      ["cage-games.html", "Games hub"],
      ["/", "Dictionary Rubik"],
    ].forEach(function (p) {
      var a = el("a", "");
      a.href = p[0];
      a.textContent = p[1];
      gate.appendChild(a);
    });
    side.appendChild(gate);

    layout.appendChild(side);
    shell.appendChild(layout);
    root.appendChild(shell);

    function metric(v, lab) {
      var wrap = el("div", "ssg-metric");
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

    function activeStream() {
      if (state.mode === "glyph" && state.glyphBits) {
        /* map glyph bits onto space layer as on/off density cells */
        return state.spaces;
      }
      return state.encoded || state.spaces;
    }

    function refreshScore() {
      var stream = activeStream();
      var alpha = stream.filter(function (s) {
        return typeof s.alphabet === "number" && s.alphabet >= 0;
      }).length;
      var coins = Math.floor(alpha * (Math.log(13) / Math.LN2));
      mSlots.b.textContent = String(stream.length);
      mAlpha.b.textContent = String(alpha);
      mCoins.b.textContent = String(coins);
      var layers = Math.ceil(stream.length / Math.max(1, state.N * state.N)) || 1;
      var layer = Math.floor(state.layerStart / Math.max(1, state.N * state.N));
      mLayer.b.textContent = Math.min(layer + 1, layers) + "/" + layers;
    }

    function paintGlyphMini(bits, n, host) {
      host.innerHTML = "";
      var g = el("div", "ssg-glyph");
      g.style.gridTemplateColumns = "repeat(" + n + ", 1fr)";
      for (var i = 0; i < n * n; i++) {
        var c = el("i", bits[i] ? "on" : "off");
        g.appendChild(c);
      }
      host.appendChild(g);
    }

    function refreshQrPanel() {
      state.qr = rubikOriginQr(state.tree, { n: state.N, salt: String(state.spaces.length) });
      paintGlyphMini(state.qr.modules, state.N, qrHost);
      var num = state.qr.numbers;
      numHost.textContent =
        "tree: " +
        num.treeId +
        "\nfamily: " +
        num.family +
        "\nN: " +
        num.n +
        "\nseed32: " +
        num.seed32 +
        "\npathNumber: " +
        num.pathNumber +
        "\nfaceChecksum: " +
        num.faceChecksum +
        "\nmodulePop: " +
        num.modulePopcount +
        "\nsolveKey: " +
        num.solveKey +
        "\nqrVersionHint: " +
        num.qrVersionHint +
        "\n" +
        state.qr.claim;
    }

    function paintBoard() {
      var stream = activeStream();
      var need = state.N * state.N;
      if (state.layerStart < 0) state.layerStart = 0;
      if (state.layerStart > Math.max(0, stream.length - 1)) {
        state.layerStart = Math.floor(Math.max(0, stream.length - 1) / need) * need;
      }
      state.cells = layerWindow(stream, state.layerStart, state.N);
      board.innerHTML = "";
      board.style.gridTemplateColumns = "repeat(" + state.N + ", 1fr)";
      board.dataset.mode = state.mode;

      if (state.mode === "qr" && state.qr) {
        state.qr.modules.forEach(function (bit, idx) {
          var cell = el("button", "ssg-cell is-qr " + (bit ? "is-on" : "is-off"), bit ? "█" : "·");
          cell.type = "button";
          cell.title = "QR module " + idx + " · face " + (state.qr.faceSeq[idx % 6] || "");
          board.appendChild(cell);
        });
        prompt.textContent =
          "Rubik origin QR · " +
          state.tree.label +
          " · solveKey " +
          state.qr.numbers.solveKey;
        refreshScore();
        return;
      }

      if (state.mode === "glyph" && state.glyphBits) {
        var bits = state.glyphBits;
        var gn = Math.sqrt(bits.length) | 0;
        for (var gi = 0; gi < state.N * state.N; gi++) {
          var on = bits[gi % bits.length];
          var cellG = el(
            "button",
            "ssg-cell is-glyph " + (on ? "is-on" : "is-off"),
            on ? "●" : "○"
          );
          cellG.type = "button";
          cellG.title = "glyph bit " + gi;
          board.appendChild(cellG);
        }
        prompt.textContent = "GrokYtalkY glyph bust · " + gn + "² over " + state.N + "² board";
        refreshScore();
        return;
      }

      state.cells.forEach(function (c) {
        var lab = c.pad ? "·" : c.isNewline ? "↵" : c.label || "SP";
        var cell = el("button", "ssg-cell", lab);
        cell.type = "button";
        if (c.pad) cell.classList.add("is-pad");
        if (c.isNewline) cell.classList.add("is-nl");
        if (c.encoded) cell.classList.add("is-encoded");
        if (typeof c.alphabet === "number" && c.alphabet >= 0) {
          cell.dataset.alpha = String(c.alphabet);
          cell.style.setProperty("--a", String(c.alphabet / 12));
        }
        cell.title = c.pad
          ? "pad"
          : "#" +
            c.si +
            " " +
            c.label +
            " U+" +
            (c.code || 0).toString(16).toUpperCase() +
            " @ " +
            c.lineId;
        cell.onclick = function () {
          if (c.pad) return;
          slog(
            "slot #" +
              c.si +
              " " +
              c.label +
              " · " +
              c.lineId +
              " · α=" +
              c.alphabet
          );
          prompt.textContent =
            "Slot #" +
            c.si +
            " · " +
            c.label +
            " · " +
            c.lineId +
            " · code U+" +
            (c.code || 0).toString(16).toUpperCase();
        };
        board.appendChild(cell);
      });

      var layer = Math.floor(state.layerStart / need) + 1;
      var layers = Math.ceil(stream.length / need) || 1;
      prompt.textContent =
        "Steno spaces · layer " +
        layer +
        "/" +
        layers +
        " · slots " +
        stream.length +
        " · N=" +
        state.N +
        (state.mode === "dual" ? " · dual w/ letter master " + state.letters.length : "");
      refreshScore();
    }

    function setMode(mode, btn) {
      state.mode = mode;
      [btnSpaces, btnGlyph, btnQr, btnDual].forEach(function (b) {
        b.classList.remove("on");
      });
      if (btn) btn.classList.add("on");
      if (mode === "qr") refreshQrPanel();
      paintBoard();
    }

    function setN(n, btn) {
      state.N = n;
      state.layerStart = 0;
      [btnN13, btnN25].forEach(function (b) {
        b.classList.remove("on");
      });
      btn.classList.add("on");
      refreshQrPanel();
      paintBoard();
    }

    btnN13.onclick = function () {
      setN(13, btnN13);
    };
    btnN25.onclick = function () {
      setN(25, btnN25);
    };
    btnSpaces.onclick = function () {
      setMode("spaces", btnSpaces);
    };
    btnGlyph.onclick = function () {
      if (!state.glyphBits) state.glyphBits = glyphFromText(ta.value, state.N);
      setMode("glyph", btnGlyph);
    };
    btnQr.onclick = function () {
      setMode("qr", btnQr);
    };
    btnDual.onclick = function () {
      setMode("dual", btnDual);
    };
    btnPrev.onclick = function () {
      state.layerStart = Math.max(0, state.layerStart - state.N * state.N);
      paintBoard();
    };
    btnNext.onclick = function () {
      var stream = activeStream();
      var next = state.layerStart + state.N * state.N;
      if (next < stream.length) state.layerStart = next;
      paintBoard();
    };

    btnBust.onclick = function () {
      state.glyphBits = glyphFromText(ta.value, state.N);
      state.mode = "glyph";
      [btnSpaces, btnGlyph, btnQr, btnDual].forEach(function (b) {
        b.classList.remove("on");
      });
      btnGlyph.classList.add("on");
      paintGlyphMini(state.glyphBits, state.N, glyphHost);
      frameMeta.textContent = "bust glyph · N=" + state.N + " · chat frame 0";
      paintBoard();
      slog("bust glyph from chat · N=" + state.N);
      publish({ kind: "glyph-bust", n: state.N, text: ta.value });
    };

    btnVideo.onclick = function () {
      var lines = ta.value.split(/\n/).filter(Boolean);
      if (!lines.length) lines = [ta.value || "qbit"];
      state.frames = videoQbitFrames(lines, state.N);
      state.frameI = 0;
      playFrames();
      slog("video qbit · " + state.frames.length + " frames");
    };

    function playFrames() {
      if (!state.frames.length) return;
      var fr = state.frames[state.frameI % state.frames.length];
      state.glyphBits = fr.bits;
      state.mode = "glyph";
      paintGlyphMini(fr.bits, fr.n, glyphHost);
      frameMeta.textContent =
        "frame " +
        fr.frame +
        "/" +
        state.frames.length +
        " · " +
        fr.qbit +
        " · " +
        fr.text.slice(0, 48);
      paintBoard();
      state.frameI++;
      if (state.frameI < state.frames.length) {
        setTimeout(playFrames, 320);
      } else {
        publish({ kind: "video-qbit", frames: state.frames.length, n: state.N });
      }
    }

    btnEncode.onclick = function () {
      state.payload = ta.value || "gyg1";
      var wr = writePayloadIntoSpaces(state.spaces, state.payload);
      state.encoded = wr.stream;
      state.mode = "spaces";
      [btnSpaces, btnGlyph, btnQr, btnDual].forEach(function (b) {
        b.classList.remove("on");
      });
      btnSpaces.classList.add("on");
      paintBoard();
      slog(
        "encoded payload · symbols " +
          wr.symbolsUsed +
          " · bits ~" +
          wr.payloadBits
      );
      publish({
        kind: "space-encode",
        symbolsUsed: wr.symbolsUsed,
        payloadBits: wr.payloadBits,
      });
    };

    function publish(extra) {
      var report = {
        kind: "steno_space_letter_grid",
        ver: VER,
        at: new Date().toISOString(),
        spaceSlots: state.spaces.length,
        letterGlyphs: state.letters.length,
        N: state.N,
        mode: state.mode,
        tree: state.tree,
        qr: state.qr && state.qr.numbers,
        payload: state.payload ? state.payload.slice(0, 120) : "",
        frames: state.frames.length,
        extra: extra || null,
      };
      try {
        global.__mgStenoSpaceGrid = report;
        global.__stenoSpaceGridLast = report;
        if (global.__mgHotPipe) global.__mgHotPipe.stenoSpaceGrid = report;
        localStorage.setItem(
          "kbatch.stenoSpaceGrid.last",
          JSON.stringify({
            at: report.at,
            slots: report.spaceSlots,
            N: report.N,
            solveKey: report.qr && report.qr.solveKey,
          })
        );
      } catch (e) {}
      try {
        global.dispatchEvent(
          new CustomEvent("steno-space-grid-update", { detail: report })
        );
      } catch (e2) {}
      try {
        fetch("http://127.0.0.1:9880/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(report),
        }).catch(function () {});
      } catch (e3) {}
      return report;
    }

    return fetchJson(base + "/full-transcript-lines.json")
      .then(function (d) {
        return d.lines || [];
      })
      .catch(function () {
        return [];
      })
      .then(function (lines) {
        if (!lines.length) throw new Error("no document lines");
        state.lines = lines;
        state.spaces = extractSpaceStream(lines);
        state.letters = extractLetterStream(lines);
        state.layerStart = 0;
        refreshQrPanel();
        paintBoard();
        slog(
          VER +
            " · lines " +
            lines.length +
            " · space slots " +
            state.spaces.length +
            " · letter glyphs " +
            state.letters.length +
            " · N=" +
            state.N
        );
        publish({ kind: "load" });

        var api = {
          ver: VER,
          state: state,
          extractSpaceStream: extractSpaceStream,
          glyphFromText: glyphFromText,
          rubikOriginQr: rubikOriginQr,
          videoQbitFrames: videoQbitFrames,
          writePayloadIntoSpaces: writePayloadIntoSpaces,
          setN: function (n) {
            setN(n, n >= 25 ? btnN25 : btnN13);
          },
          bust: function (text) {
            if (text) ta.value = text;
            btnBust.click();
          },
          snapshot: function () {
            return publish({ kind: "snapshot" });
          },
          report: function () {
            return publish({ kind: "report" });
          },
        };
        try {
          global.__stenoSpaceGridApi = api;
          global.__mgStenoSpaceGridApi = api;
        } catch (e4) {}
        return api;
      })
      .catch(function (e) {
        prompt.textContent = "Failed: " + e;
        slog(String(e));
        throw e;
      });
  }

  global.__kbatchStenoSpaceLetterGrid = {
    ver: VER,
    STENO_SPACES: STENO_SPACES,
    SPACE_LABELS: SPACE_LABELS,
    ORIGIN_TREES: ORIGIN_TREES,
    extractSpaceStream: extractSpaceStream,
    glyphFromText: glyphFromText,
    rubikOriginQr: rubikOriginQr,
    videoQbitFrames: videoQbitFrames,
    mount: mount,
  };
})(typeof window !== "undefined" ? window : globalThis);
