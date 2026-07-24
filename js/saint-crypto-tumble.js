/**
 * Saint · Crypto Tumble Live
 *
 * Saint-movie cypher conversations: take two short dialogues, cast
 * Vals / Human Fly / Boris, then tumble them live through the dictionary stack:
 *   DAC prefixes · StenoStrip blank coins · Quantum Gutter · Rubik 3×3 faces
 *
 * Letter-Grid + Cage litmus stay the growth stair; this is the cipher salon.
 *
 * MG hooks: window.__saintTumbleApi · __mgSaintTumble · events saint-tumble-*
 * VER: saint-crypto-tumble-v1
 */
(function (global) {
  "use strict";

  var VER = "saint-crypto-tumble-v1";

  /** Cast — Saint-style cypher salon */
  var CAST = {
    vals: {
      id: "vals",
      label: "Vals",
      role: "handler",
      blurb: "Control cipher · DAC conductor · prefix orders",
      faceBias: ["U", "B", "R"], /* written · digital · thought */
      prefixBias: ["0:", "+0:", "+n:"],
      color: "#64d2ff",
    },
    fly: {
      id: "fly",
      label: "Human Fly",
      role: "path",
      blurb: "Wall-crawl geometry · letter hop · StenoStrip blanks",
      faceBias: ["F", "L", "D"], /* movement · analog · spoken */
      prefixBias: ["+2:", "+1:", "1:"],
      color: "#30d158",
    },
    boris: {
      id: "boris",
      label: "Boris",
      role: "stone",
      blurb: "RAW / STONE truth · challenges fiction · heavy hand",
      faceBias: ["D", "L", "U"], /* spoken · analog · written */
      prefixBias: ["-1:", "-n:", "-0:"],
      color: "#c9a227",
    },
  };

  var CUBE_FACES = [
    { id: "U", name: "Written", color: "#58a6ff" },
    { id: "D", name: "Spoken", color: "#3fb950" },
    { id: "F", name: "Movement", color: "#d29922" },
    { id: "B", name: "Digital", color: "#a371f7" },
    { id: "L", name: "Analog", color: "#f85149" },
    { id: "R", name: "Thought", color: "#79c0ff" },
  ];

  var GUTTER_SYMS = ["n:", "+1:", "-n:", "+0:", "0:", "-1:", "+n:", "+2:", "-0:", "+3:", "1:"];

  var STENO_SPACES = [
    "\u0020",
    "\u00A0",
    "\u2000",
    "\u2001",
    "\u2002",
    "\u2003",
    "\u2004",
    "\u2005",
    "\u2006",
    "\u2007",
    "\u2008",
    "\u2009",
    "\u200A",
  ];

  var SPEECH_PATTERNS = [
    { cat: "output", re: /^(print|say|speak|utter|echo|tell)\b/i, sym: "+3:" },
    { cat: "condition", re: /^(if|when|unless|whether|should)\b/i, sym: "+n:" },
    { cat: "loop", re: /^(while|again|repeat|once more)\b/i, sym: "+2:" },
    { cat: "return", re: /^(so|therefore|thus|hence|then)\b/i, sym: "-0:" },
    { cat: "import", re: /^(from|via|according|cite|per)\b/i, sym: "-n:" },
    { cat: "function", re: /^(let us|we will|define|call|do)\b/i, sym: "0:" },
    { cat: "comment", re: /^(note:|nb:|#|\/\/|—|well,)/i, sym: "+1:" },
    { cat: "error", re: /^(error|fail|cannot|don't|wrong|never)\b/i, sym: "-1:" },
    { cat: "class", re: /^(the|a|an)\s+\w+\s+(is|are)\b/i, sym: "+0:" },
    { cat: "variable", re: /^\w+\s*(=|is|equals|means)\s+/i, sym: "1:" },
  ];

  /** Seed conversations — short Saint-salon cypher beats */
  var SEEDS = {
    A: [
      "Vals: The plate is not the parchment.",
      "Fly: Then hop the lattice — blue cell only.",
      "Boris: Stone lies if you only read the cut.",
      "Vals: Prefix the order. Leave blanks for the path.",
      "Fly: Nineteen bits a line if the coins hold.",
    ].join("\n"),
    B: [
      "Boris: You want truth? Weigh the iron-gall, not the story.",
      "Vals: Two talks, one tumble. Interleave or lose the key.",
      "Fly: Human Fly doesn't walk doors — only faces of the cube.",
      "Boris: Fiction labels itself. Stone does not.",
      "Vals: When the gutter sings +n: — open the next face.",
    ].join("\n"),
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function parseConversation(raw, defaultSpeaker) {
    var lines = String(raw || "")
      .split(/\r?\n/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    return lines.map(function (line, i) {
      var m = /^([A-Za-z][A-Za-z0-9 _.-]{0,24})\s*:\s*(.+)$/.exec(line);
      if (m) {
        return {
          i: i,
          speakerRaw: m[1].trim(),
          text: m[2].trim(),
          line: line,
        };
      }
      return {
        i: i,
        speakerRaw: defaultSpeaker || "Voice",
        text: line,
        line: line,
      };
    });
  }

  function castSpeaker(name) {
    var k = String(name || "")
      .toLowerCase()
      .replace(/\s+/g, "");
    if (/val/.test(k)) return CAST.vals;
    if (/fly|human/.test(k)) return CAST.fly;
    if (/boris|stone|raw/.test(k)) return CAST.boris;
    return null;
  }

  function assignCast(turns, lane) {
    var order = [CAST.vals, CAST.fly, CAST.boris];
    return turns.map(function (t, i) {
      var c = castSpeaker(t.speakerRaw) || order[(i + (lane === "B" ? 1 : 0)) % 3];
      return Object.assign({}, t, {
        cast: c,
        speaker: c.label,
        lane: lane,
      });
    });
  }

  function classifyPrefix(text, cast) {
    var t = String(text || "").trim();
    for (var i = 0; i < SPEECH_PATTERNS.length; i++) {
      if (SPEECH_PATTERNS[i].re.test(t)) {
        return { sym: SPEECH_PATTERNS[i].sym, cat: SPEECH_PATTERNS[i].cat, source: "speech" };
      }
    }
    /* cast bias when no pattern */
    var bias = (cast && cast.prefixBias) || ["0:"];
    return { sym: bias[0], cat: "cast", source: "cast" };
  }

  function pickFace(turn, step) {
    var bias = (turn.cast && turn.cast.faceBias) || ["U", "F", "B"];
    var id = bias[step % bias.length];
    return CUBE_FACES.find(function (f) {
      return f.id === id;
    }) || CUBE_FACES[step % CUBE_FACES.length];
  }

  /** Steno blank capacity (~log2(13) bits/symbol · 5 slots/line claim) */
  function analyzeSteno(text) {
    var raw = String(text || "");
    var write = 0;
    var blank = 0;
    var spaceClass = 0;
    for (var i = 0; i < raw.length; i++) {
      var ch = raw[i];
      if (STENO_SPACES.indexOf(ch) >= 0) {
        blank++;
        spaceClass++;
      } else if (/\s/.test(ch)) {
        blank++;
      } else {
        write++;
      }
    }
    var bitsPer = Math.log(STENO_SPACES.length) / Math.LN2;
    var slots = 5;
    var coins = Math.floor(bitsPer * Math.min(slots, Math.max(1, Math.floor(blank / 2) || 1)));
    return {
      write: write,
      blank: blank,
      spaceClass: spaceClass,
      bitsPerSymbol: +bitsPer.toFixed(3),
      coins: coins,
      claimBitsLine: Math.floor(bitsPer * slots),
    };
  }

  /** Encode a tiny payload into trailing steno spaces (demo side-channel) */
  function stenoEncodeTail(payload, maxSlots) {
    maxSlots = maxSlots || 5;
    var s = String(payload || "");
    var out = [];
    for (var i = 0; i < Math.min(maxSlots, s.length); i++) {
      var code = s.charCodeAt(i) % STENO_SPACES.length;
      out.push(STENO_SPACES[code]);
    }
    while (out.length < maxSlots) out.push(STENO_SPACES[0]);
    return out.join("");
  }

  /**
   * Tumble two conversations into one live cipher stream.
   * mode: zip | face-rotate | boris-heavy
   */
  function tumble(convA, convB, opts) {
    opts = opts || {};
    var mode = opts.mode || "zip";
    var A = assignCast(parseConversation(convA, "Vals"), "A");
    var B = assignCast(parseConversation(convB, "Boris"), "B");
    var steps = [];
    var max = Math.max(A.length, B.length);
    var order = [];

    if (mode === "boris-heavy") {
      /* B first then A (stone challenges story) */
      for (var i = 0; i < max; i++) {
        if (B[i]) order.push(B[i]);
        if (A[i]) order.push(A[i]);
      }
    } else if (mode === "face-rotate") {
      /* rotate by Rubik face groups */
      var pool = A.concat(B);
      pool.forEach(function (t, i) {
        t._rot = i;
      });
      pool.sort(function (a, b) {
        var fa = pickFace(a, a._rot).id;
        var fb = pickFace(b, b._rot).id;
        return fa.localeCompare(fb) || a._rot - b._rot;
      });
      order = pool;
    } else {
      /* zip A/B — classic two-talk tumble */
      for (var j = 0; j < max; j++) {
        if (A[j]) order.push(A[j]);
        if (B[j]) order.push(B[j]);
      }
    }

    var faceHeat = {};
    CUBE_FACES.forEach(function (f) {
      faceHeat[f.id] = 0;
    });
    var gutterCounts = {};
    var letterStream = [];

    order.forEach(function (t, step) {
      var pref = classifyPrefix(t.text, t.cast);
      var face = pickFace(t, step);
      var steno = analyzeSteno(t.text);
      var tail = stenoEncodeTail(t.cast.id + face.id + pref.sym, 4);
      var dacLine = pref.sym.padEnd(4) + t.text + tail;
      faceHeat[face.id] = (faceHeat[face.id] || 0) + 1 + steno.coins * 0.05;
      gutterCounts[pref.sym] = (gutterCounts[pref.sym] || 0) + 1;

      var letters = t.text.replace(/[^A-Za-z]/g, "");
      for (var k = 0; k < letters.length; k++) letterStream.push(letters[k]);

      steps.push({
        step: step,
        lane: t.lane,
        speaker: t.speaker,
        castId: t.cast.id,
        castColor: t.cast.color,
        role: t.cast.role,
        text: t.text,
        prefix: pref.sym,
        prefixCat: pref.cat,
        face: face.id,
        faceName: face.name,
        faceColor: face.color,
        steno: steno,
        dacLine: dacLine,
        rubikMove: face.id + (step % 2 === 0 ? "" : "'"),
      });
    });

    /* normalize heat 0–1 */
    var maxH = 1;
    Object.keys(faceHeat).forEach(function (k) {
      if (faceHeat[k] > maxH) maxH = faceHeat[k];
    });
    var faces = CUBE_FACES.map(function (f) {
      return {
        id: f.id,
        name: f.name,
        color: f.color,
        heat: +(faceHeat[f.id] / maxH).toFixed(3),
        count: Math.round(faceHeat[f.id]),
      };
    });

    var report = {
      kind: "saint_crypto_tumble",
      ver: VER,
      at: new Date().toISOString(),
      mode: mode,
      title: "Crypto Tumble · " + mode + " · " + steps.length + " beats",
      cast: Object.keys(CAST).map(function (id) {
        return CAST[id];
      }),
      steps: steps,
      faces: faces,
      gutterCounts: gutterCounts,
      gutterSymbols: GUTTER_SYMS,
      letterSeed: letterStream.join("").slice(0, 144),
      letterSeedLen: letterStream.length,
      tape: steps
        .map(function (s) {
          return (
            s.prefix.padEnd(4) +
            "[" +
            s.face +
            "] " +
            s.speaker +
            ": " +
            s.text
          );
        })
        .join("\n"),
      tools: {
        dac: "prefixDAC / qbitCodec line classification",
        stenoStrip: "13-space alphabet · blank coins · side-channel tail",
        quantumGutter: "11-symbol gutter n:+1:…1:",
        rubik3x3: "U D F B L R language cube faces",
        letterGrid: "ordered glyph seed → Letter-Grid codex pass",
      },
      mg: {
        kind: "saint-crypto-tumble",
        steps: steps.length,
        mode: mode,
        faces: faces,
        letterSeedLen: letterStream.length,
      },
    };

    report.markdown = formatMarkdown(report);
    return report;
  }

  function formatMarkdown(r) {
    var lines = [
      "# " + r.title,
      "",
      "**At:** " + r.at,
      "**Mode:** " + r.mode,
      "**Beats:** " + r.steps.length,
      "",
      "## Cast",
      "- **Vals** — handler · DAC / prefixes",
      "- **Human Fly** — path · StenoStrip · letter hop",
      "- **Boris** — stone · RAW truth · litmus weight",
      "",
      "## Rubik faces (heat)",
    ];
    r.faces.forEach(function (f) {
      lines.push(
        "- **" + f.id + "** " + f.name + " · heat " + f.heat + " · n=" + f.count
      );
    });
    lines.push("");
    lines.push("## Live tape (DAC · face · voice)");
    lines.push("```");
    lines.push(r.tape);
    lines.push("```");
    lines.push("");
    lines.push("## Letter-Grid seed (" + r.letterSeedLen + " glyphs, head 144)");
    lines.push("`" + r.letterSeed + "`");
    lines.push("");
    lines.push("## Tool stack");
    Object.keys(r.tools).forEach(function (k) {
      lines.push("- **" + k + ":** " + r.tools[k]);
    });
    lines.push("");
    lines.push("## MG");
    lines.push(
      "game=saint-crypto-tumble · beats " +
        r.steps.length +
        " · seed " +
        r.letterSeedLen +
        " glyphs"
    );
    return lines.join("\n");
  }

  function publishMg(report) {
    try {
      global.__mgSaintTumble = report;
      global.__mgAgentPlayLast = Object.assign({}, report.mg, {
        kind: "saint-crypto-tumble",
        report: report,
        at: report.at,
      });
      if (global.__mgHotPipe) {
        global.__mgHotPipe.saintTumble = report;
      }
      localStorage.setItem(
        "kbatch.saint.tumble.last",
        JSON.stringify({
          at: report.at,
          mode: report.mode,
          steps: report.steps.length,
          letterSeedLen: report.letterSeedLen,
          title: report.title,
        })
      );
    } catch (e) {}
    try {
      global.dispatchEvent(new CustomEvent("saint-tumble-done", { detail: report }));
      global.dispatchEvent(new CustomEvent("mg-saint-tumble", { detail: report }));
    } catch (e2) {}
    try {
      fetch("http://127.0.0.1:9880/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "saint_crypto_tumble", ver: VER, report: report }),
      }).catch(function () {});
    } catch (e3) {}
  }

  function faceNetHtml(faces) {
    var by = {};
    faces.forEach(function (f) {
      by[f.id] = f;
    });
    function cell(id) {
      var f = by[id];
      if (!f) return "";
      return (
        '<div class="sct-face" data-face="' +
        f.id +
        '" style="--heat:' +
        f.heat +
        ";--col:" +
        f.color +
        '"><b>' +
        f.id +
        "</b><span>" +
        f.name +
        "</span><i>" +
        f.heat.toFixed(2) +
        "</i></div>"
      );
    }
    return (
      '<div class="sct-rubik-net" data-mg-rubik-net="1">' +
      '<div class="sct-net-row sct-net-u">' +
      cell("U") +
      "</div>" +
      '<div class="sct-net-row sct-net-mid">' +
      cell("L") +
      cell("F") +
      cell("R") +
      cell("B") +
      "</div>" +
      '<div class="sct-net-row sct-net-d">' +
      cell("D") +
      "</div></div>"
    );
  }

  function mount(root, opts) {
    opts = opts || {};
    root.innerHTML = "";
    root.classList.add("sct-root");

    var shell = el("div", "sct-shell");
    var hero = el("div", "sct-hero");
    hero.innerHTML =
      "<h2>Saint · Crypto Tumble Live</h2>" +
      "<p>Two short conversations · cast <b>Vals</b>, <b>Human Fly</b>, <b>Boris</b> · " +
      "tumble through <b>DAC</b> · <b>StenoStrip</b> · <b>Quantum Gutter</b> · <b>Rubik 3×3</b> · " +
      "seed Letter-Grid. Saint-movie cypher salon, not a black-hat kit.</p>";
    shell.appendChild(hero);

    var castRow = el("div", "sct-cast");
    Object.keys(CAST).forEach(function (id) {
      var c = CAST[id];
      var card = el("div", "sct-cast-card");
      card.style.setProperty("--cast", c.color);
      card.innerHTML =
        "<b>" +
        c.label +
        "</b><span>" +
        c.role +
        "</span><p>" +
        c.blurb +
        "</p>";
      castRow.appendChild(card);
    });
    shell.appendChild(castRow);

    var grid = el("div", "sct-grid");
    var colA = el("div", "sct-col");
    colA.innerHTML = "<h3>Conversation A</h3>";
    var taA = document.createElement("textarea");
    taA.className = "sct-ta";
    taA.rows = 8;
    taA.value = opts.convA != null ? opts.convA : SEEDS.A;
    taA.setAttribute("aria-label", "Conversation A");
    colA.appendChild(taA);

    var colB = el("div", "sct-col");
    colB.innerHTML = "<h3>Conversation B</h3>";
    var taB = document.createElement("textarea");
    taB.className = "sct-ta";
    taB.rows = 8;
    taB.value = opts.convB != null ? opts.convB : SEEDS.B;
    taB.setAttribute("aria-label", "Conversation B");
    colB.appendChild(taB);
    grid.appendChild(colA);
    grid.appendChild(colB);
    shell.appendChild(grid);

    var controls = el("div", "sct-controls");
    var modeSel = document.createElement("select");
    modeSel.className = "sct-select";
    [
      ["zip", "Zip tumble (A↔B)"],
      ["face-rotate", "Face-rotate (Rubik sort)"],
      ["boris-heavy", "Boris-heavy (stone first)"],
    ].forEach(function (pair) {
      var o = document.createElement("option");
      o.value = pair[0];
      o.textContent = pair[1];
      modeSel.appendChild(o);
    });
    var btnGo = el("button", "primary", "Tumble live");
    var btnSeed = el("button", "", "Reset seeds");
    var btnCopy = el("button", "", "Copy report");
    var btnGrid = el("a", "sct-link", "→ Letter-Grid with seed");
    btnGrid.href = "letter-grid.html";
    controls.appendChild(modeSel);
    controls.appendChild(btnGo);
    controls.appendChild(btnSeed);
    controls.appendChild(btnCopy);
    controls.appendChild(btnGrid);
    shell.appendChild(controls);

    var out = el("div", "sct-out");
    var faceHost = el("div", "sct-face-host");
    var tape = el("pre", "sct-tape");
    tape.setAttribute("data-mg-saint-tape", "1");
    var beatList = el("div", "sct-beats");
    var meta = el("p", "sct-meta");
    out.appendChild(faceHost);
    out.appendChild(meta);
    out.appendChild(tape);
    out.appendChild(beatList);
    shell.appendChild(out);
    root.appendChild(shell);

    var lastReport = null;

    function paint(report) {
      lastReport = report;
      faceHost.innerHTML = faceNetHtml(report.faces);
      tape.textContent = report.tape;
      meta.textContent =
        report.title +
        " · seed " +
        report.letterSeedLen +
        " glyphs · gutter " +
        Object.keys(report.gutterCounts).join(" ");
      beatList.innerHTML = "";
      report.steps.forEach(function (s) {
        var row = el("div", "sct-beat");
        row.style.setProperty("--cast", s.castColor);
        row.style.setProperty("--face", s.faceColor);
        var pfx = el("span", "sct-pfx", s.prefix);
        var face = el("span", "sct-face-tag", s.face);
        var who = el("span", "sct-who", s.speaker);
        var txt = el("span", "sct-txt", s.text);
        var st = el("span", "sct-steno", "¢" + s.steno.coins);
        st.title = "steno coins";
        row.appendChild(pfx);
        row.appendChild(face);
        row.appendChild(who);
        row.appendChild(txt);
        row.appendChild(st);
        beatList.appendChild(row);
      });
      try {
        btnGrid.href =
          "letter-grid.html?from=saint&seedChars=" +
          encodeURIComponent(report.letterSeed.slice(0, 48));
      } catch (e) {}
      publishMg(report);
    }

    function run() {
      var report = tumble(taA.value, taB.value, { mode: modeSel.value });
      paint(report);
      return report;
    }

    btnGo.onclick = function () {
      run();
    };
    btnSeed.onclick = function () {
      taA.value = SEEDS.A;
      taB.value = SEEDS.B;
    };
    btnCopy.onclick = function () {
      var rep = lastReport || run();
      var md = rep.markdown || formatMarkdown(rep);
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(md);
        } else {
          window.prompt("Copy report", md);
        }
      } catch (e) {
        window.prompt("Copy report", md);
      }
    };

    var api = {
      ver: VER,
      cast: CAST,
      seeds: SEEDS,
      tumble: tumble,
      run: run,
      report: function () {
        return lastReport;
      },
      markdownReport: function () {
        return (lastReport && lastReport.markdown) || "";
      },
      setConversations: function (a, b) {
        if (a != null) taA.value = a;
        if (b != null) taB.value = b;
      },
      setMode: function (m) {
        modeSel.value = m || "zip";
      },
    };

    try {
      global.__saintTumbleApi = api;
      global.__mgSaintTumbleApi = api;
    } catch (e4) {}

    if (opts.autoplay !== false) {
      setTimeout(run, 40);
    }
    try {
      if (/[?&]autotest=1\b/i.test(location.search || "")) setTimeout(run, 40);
    } catch (e5) {}

    return api;
  }

  global.__kbatchSaintCryptoTumble = {
    ver: VER,
    CAST: CAST,
    SEEDS: SEEDS,
    tumble: tumble,
    mount: mount,
    CUBE_FACES: CUBE_FACES,
    GUTTER_SYMS: GUTTER_SYMS,
  };
})(typeof window !== "undefined" ? window : globalThis);
