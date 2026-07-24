/**
 * Cage-grade litmus · National Treasure fiction lane (labeled)
 * Verifies agent/human answers against FACT / FICTION / STONE_TRAP keys.
 * Always surfaces RAW + STONE pair doctrine.
 */
(function (global) {
  "use strict";

  var VER = "declaration-cage-litmus-v1";

  function fetchJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  function normalizeLabel(s) {
    s = String(s || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z_]/g, "");
    if (s === "STONETRAP" || s === "STONEONLY" || s === "TRAP") return "STONE_TRAP";
    if (s === "TRUE" || s === "HISTORICAL" || s === "REAL") return "FACT";
    if (s === "FALSE" || s === "MOVIE" || s === "FICTIONAL") return "FICTION";
    return s;
  }

  /**
   * Verify an array of { id?, claim?, answer } against quiz pack.
   * Returns grade: fail | dojo | cage
   */
  function verify(quiz, responses) {
    var byId = {};
    (quiz.items || []).forEach(function (it) {
      byId[it.id] = it;
    });
    var results = [];
    var correct = 0;
    var pairHits = 0;
    var pairNeed = 0;
    var stoneTrapCaught = 0;
    var fictionCaught = 0;

    (responses || []).forEach(function (resp, i) {
      var item =
        (resp.id && byId[resp.id]) ||
        (quiz.items || []).find(function (it) {
          return it.claim === resp.claim;
        }) ||
        quiz.items[i];
      if (!item) {
        results.push({ ok: false, error: "unknown item", resp: resp });
        return;
      }
      var got = normalizeLabel(resp.answer || resp.label || resp.verdict);
      var exp = normalizeLabel(item.answer);
      var ok = got === exp;
      if (ok) correct++;
      if (item.pairRequired) {
        pairNeed++;
        if (ok) pairHits++;
      }
      if (ok && exp === "STONE_TRAP") stoneTrapCaught++;
      if (ok && exp === "FICTION") fictionCaught++;
      results.push({
        id: item.id,
        ok: ok,
        expected: exp,
        got: got,
        claim: item.claim,
        why: item.why,
        lane: item.lane,
        pairRequired: !!item.pairRequired,
      });
    });

    var total = (quiz.items || []).length;
    var answered = results.filter(function (r) {
      return r.expected;
    }).length;
    var denom = answered || total || 1;
    var score = correct / denom;
    var grades = quiz.grades || {};
    var grade = "fail";
    if (score >= (grades.cage && grades.cage.min != null ? grades.cage.min : 0.85)) grade = "cage";
    else if (score >= (grades.dojo && grades.dojo.min != null ? grades.dojo.min : 0.5)) grade = "dojo";

    /* Hard fail: zero stone-trap awareness on required items */
    var traps = (quiz.items || []).filter(function (it) {
      return it.answer === "STONE_TRAP";
    }).length;
    if (traps && stoneTrapCaught === 0 && score >= 0.5) {
      grade = "fail";
    }

    return {
      ver: VER,
      score: score,
      correct: correct,
      total: denom,
      grade: grade,
      gradeLabel: (grades[grade] && grades[grade].label) || grade,
      gradeNote: (grades[grade] && grades[grade].note) || "",
      pairHits: pairHits,
      pairNeed: pairNeed,
      stoneTrapCaught: stoneTrapCaught,
      fictionCaught: fictionCaught,
      results: results,
      doctrine: quiz.doctrine || [],
      t: Date.now(),
    };
  }

  /** Build default agent response template (empty answers for fill) */
  function blankResponses(quiz) {
    return (quiz.items || []).map(function (it) {
      return { id: it.id, claim: it.claim, answer: "" };
    });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function imgUrl(rel) {
    if (!rel) return "";
    if (/^https?:/i.test(rel)) return rel;
    if (rel.indexOf("/labs/") === 0 || rel.indexOf("/data/") === 0) return rel;
    /* symbology paths are relative to edition lab */
    if (rel.indexOf("images/") === 0) return "/labs/declaration-digital-edition/" + rel;
    return rel;
  }

  function mount(root, opts) {
    opts = opts || {};
    var quizUrl = opts.quizUrl || "/data/declaration/cage-litmus-quiz.json";
    var symUrl = opts.symbologyUrl || "/data/declaration/symbology-raw-vs-stone.json";

    root.innerHTML = "";
    var shell = el("div", "cage-shell");
    var title = el("div", "cage-hero");
    title.innerHTML =
      "<h2>Cage-grade litmus · National Treasure lane</h2>" +
      "<p><strong>Fiction labeled.</strong> Pair <em>RAW</em> parchment + <em>STONE</em> engraving. " +
      "If Stone is all you analyze, you lose the raw surface symbology the movie pretends to chase — " +
      "not dojo-grade, not Cage-grade.</p>";
    shell.appendChild(title);

    var pair = el("div", "cage-pair");
    pair.innerHTML =
      '<figure class="cage-pane"><figcaption>RAW · engrossed parchment (NARA)</figcaption>' +
      '<div class="cage-img" id="cage-raw">loading…</div></figure>' +
      '<figure class="cage-pane"><figcaption>STONE · 1823 engraving (NARA)</figcaption>' +
      '<div class="cage-img" id="cage-stone">loading…</div></figure>';
    shell.appendChild(pair);

    var doctrine = el("div", "cage-doctrine");
    shell.appendChild(doctrine);

    var board = el("div", "cage-board");
    shell.appendChild(board);

    var actions = el("div", "cage-actions");
    var btnCheck = el("button", "cage-btn primary", "Verify answers");
    var btnAgent = el("button", "cage-btn", "Copy agent prompt");
    var btnKey = el("button", "cage-btn", "Reveal key (study)");
    var btnReset = el("button", "cage-btn", "Reset");
    actions.appendChild(btnCheck);
    actions.appendChild(btnAgent);
    actions.appendChild(btnKey);
    actions.appendChild(btnReset);
    shell.appendChild(actions);

    var result = el("div", "cage-result");
    shell.appendChild(result);
    root.appendChild(shell);

    var quiz = null;
    var sym = null;
    var selects = {};

    return Promise.all([fetchJson(quizUrl), fetchJson(symUrl)])
      .then(function (pairData) {
        quiz = pairData[0];
        sym = pairData[1];
        paintPair(sym);
        paintDoctrine(quiz, sym);
        paintBoard(quiz);
        return api();
      })
      .catch(function (e) {
        result.textContent = "Load failed: " + e;
        throw e;
      });

    function paintPair(sym) {
      var raw = sym.sources && sym.sources.raw;
      var stone = sym.sources && sym.sources.stone;
      function fill(id, src, label) {
        var host = document.getElementById(id);
        if (!host) return;
        host.innerHTML = "";
        if (!src) {
          host.textContent = label + " missing";
          return;
        }
        var img = document.createElement("img");
        img.src = imgUrl(src.file);
        img.alt = src.label || label;
        img.loading = "lazy";
        img.onerror = function () {
          host.textContent = "Image not available locally · " + (src.label || label);
        };
        host.appendChild(img);
        var cap = el("div", "cage-img-note", src.whatItIs || "");
        host.appendChild(cap);
      }
      fill("cage-raw", raw, "RAW");
      fill("cage-stone", stone, "STONE");
    }

    function paintDoctrine(quiz, sym) {
      doctrine.innerHTML = "";
      var ul = el("ul");
      (quiz.doctrine || []).forEach(function (d) {
        ul.appendChild(el("li", "", d));
      });
      if (sym.nationalTreasure && sym.nationalTreasure.analysisHook) {
        ul.appendChild(el("li", "hook", sym.nationalTreasure.analysisHook));
      }
      doctrine.appendChild(ul);
      var nt = sym.nationalTreasure;
      if (nt) {
        var box = el("div", "cage-nt");
        box.innerHTML =
          "<h3>" +
          (nt.label || "National Treasure") +
          ' <span class="tag fiction">FICTION LANE</span></h3>';
        var f = el("div", "cage-cols");
        var fa = el("div");
        fa.innerHTML = "<h4>Fact</h4>";
        var ulf = el("ul");
        (nt.fact || []).forEach(function (x) {
          ulf.appendChild(el("li", "", x));
        });
        fa.appendChild(ulf);
        var fi = el("div");
        fi.innerHTML = "<h4>Fiction (movie)</h4>";
        var uli = el("ul");
        (nt.fiction || []).forEach(function (x) {
          uli.appendChild(el("li", "", x));
        });
        fi.appendChild(uli);
        f.appendChild(fa);
        f.appendChild(fi);
        box.appendChild(f);
        doctrine.appendChild(box);
      }
    }

    function paintBoard(quiz) {
      board.innerHTML = "";
      selects = {};
      (quiz.items || []).forEach(function (it, idx) {
        var card = el("article", "cage-q");
        var h = el("div", "cage-q-id", it.id + (it.pairRequired ? " · RAW+STONE" : "") + " · " + (it.lane || ""));
        var p = el("p", "cage-q-claim", it.claim);
        var sel = document.createElement("select");
        sel.setAttribute("aria-label", "Answer for " + it.id);
        ["", "FACT", "FICTION", "STONE_TRAP"].forEach(function (v) {
          var o = document.createElement("option");
          o.value = v;
          o.textContent = v || "— choose —";
          sel.appendChild(o);
        });
        selects[it.id] = sel;
        card.appendChild(h);
        card.appendChild(p);
        card.appendChild(sel);
        board.appendChild(card);
      });
    }

    function collect() {
      return (quiz.items || []).map(function (it) {
        return { id: it.id, claim: it.claim, answer: selects[it.id] ? selects[it.id].value : "" };
      });
    }

    function showReport(rep) {
      result.innerHTML = "";
      var grade = el("div", "cage-grade " + rep.grade);
      grade.innerHTML =
        "<b>" +
        rep.gradeLabel.toUpperCase() +
        "</b> · " +
        (rep.score * 100).toFixed(0) +
        "% (" +
        rep.correct +
        "/" +
        rep.total +
        ") · stone-traps caught " +
        rep.stoneTrapCaught +
        " · fiction caught " +
        rep.fictionCaught;
      var note = el("p", "", rep.gradeNote);
      result.appendChild(grade);
      result.appendChild(note);
      var list = el("ul", "cage-report");
      rep.results.forEach(function (r) {
        if (!r.expected) return;
        var li = el("li", r.ok ? "ok" : "bad");
        li.innerHTML =
          "<code>" +
          r.id +
          "</code> " +
          (r.ok ? "✓" : "✗") +
          " got <b>" +
          (r.got || "—") +
          "</b> expected <b>" +
          r.expected +
          "</b><br/><span class='why'>" +
          r.why +
          "</span>";
        list.appendChild(li);
      });
      result.appendChild(list);
      try {
        var key = "kbatch.declaration.cageLitmus.trials";
        var prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.push({
          t: rep.t,
          grade: rep.grade,
          score: rep.score,
          correct: rep.correct,
          total: rep.total,
        });
        if (prev.length > 50) prev = prev.slice(-50);
        localStorage.setItem(key, JSON.stringify(prev));
      } catch (e) {}
      try {
        fetch("http://127.0.0.1:9880/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "cage_litmus", ver: VER, report: rep }),
        }).catch(function () {});
      } catch (e2) {}
    }

    btnCheck.onclick = function () {
      var rep = verify(quiz, collect());
      showReport(rep);
    };
    btnAgent.onclick = function () {
      var payload = {
        system: quiz.agentPrompt,
        items: (quiz.items || []).map(function (it) {
          return { id: it.id, claim: it.claim };
        }),
        responseFormat: [{ id: "q01", answer: "FACT|FICTION|STONE_TRAP", why: "…" }],
      };
      var text = JSON.stringify(payload, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          result.textContent = "Agent prompt JSON copied — paste into Grok / local LLM, then paste answers via verify().";
        });
      } else {
        result.textContent = text;
      }
    };
    btnKey.onclick = function () {
      (quiz.items || []).forEach(function (it) {
        if (selects[it.id]) selects[it.id].value = it.answer;
      });
      result.textContent = "Key filled for study — run Verify to score (honest runs leave answers blank first).";
    };
    btnReset.onclick = function () {
      (quiz.items || []).forEach(function (it) {
        if (selects[it.id]) selects[it.id].value = "";
      });
      result.innerHTML = "";
    };

    function api() {
      return {
        ver: VER,
        quiz: quiz,
        symbology: sym,
        collect: collect,
        verify: function (responses) {
          var rep = verify(quiz, responses || collect());
          showReport(rep);
          return rep;
        },
        verifyRaw: function (responses) {
          return verify(quiz, responses);
        },
        agentPrompt: function () {
          return quiz.agentPrompt;
        },
      };
    }
  }

  global.__kbatchCageLitmus = {
    ver: VER,
    mount: mount,
    verify: verify,
    blankResponses: blankResponses,
    normalizeLabel: normalizeLabel,
  };
})(typeof window !== "undefined" ? window : globalThis);
