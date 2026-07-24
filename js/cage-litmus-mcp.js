/**
 * Cage litmus MCP tools — FACT / FICTION / STONE_TRAP
 * Static quiz + headless verify + grade contract (Letter-Grid pipe parity)
 *
 * Tools: kbatch_cage_litmus_quiz | _verify | _grade
 */
import { SCHEMA_VERSION } from "./schema.js";

export const CAGE_LITMUS_MCP_TOOLS = [
  {
    name: "kbatch_cage_litmus_quiz",
    description:
      "Return the full Cage-grade litmus quiz (12 claims) or a filtered slice. Static, no live session required. Source of truth for FACT / FICTION / STONE_TRAP verification.",
    inputSchema: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: { type: "string" },
          description: 'Optional claim ids (e.g. ["q03","q07"]). Omit for full quiz.',
        },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: ["doctrine", "grades", "labels", "items", "agentPrompt", "calibration"],
          },
        },
        answers: {
          type: "boolean",
          default: true,
          description: "If false, strip answer and why (blinded agent trials).",
        },
      },
    },
  },
  {
    name: "kbatch_cage_litmus_verify",
    description:
      "Submit labeled answers and receive per-item results + aggregate score. Hard rule: zero STONE_TRAP catches → fail even if score ≥ 0.5.",
    inputSchema: {
      type: "object",
      properties: {
        answers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              answer: {
                type: "string",
                enum: ["FACT", "FICTION", "STONE_TRAP"],
              },
            },
            required: ["id", "answer"],
          },
        },
        strict: {
          type: "boolean",
          default: true,
          description: "If true, require all 12 ids for a full grade; if false, grade only submitted subset.",
        },
      },
      required: ["answers"],
    },
  },
  {
    name: "kbatch_cage_litmus_grade",
    description:
      "One-shot scoring contract: grade bands, hard rule, optional calibration profiles (oracle, stoneOnly, movieBeliever, grokLive).",
    inputSchema: {
      type: "object",
      properties: {
        profile: {
          type: "string",
          enum: ["bands", "oracle", "stoneOnly", "movieBeliever", "grokLive", "all"],
          default: "bands",
        },
        includeDoctrine: { type: "boolean", default: true },
      },
    },
  },
];

const QUIZ_URL = "/data/declaration/cage-litmus-quiz.json";
const TRIAL_URL = "/data/declaration/cage-litmus-grok-trial.json";
const PAGE_URL = "/labs/declaration-digital-edition/cage-litmus";

let _quizCache = null;
let _trialCache = null;

export async function loadQuiz(fetchImpl) {
  if (_quizCache) return _quizCache;
  const f = fetchImpl || (typeof fetch !== "undefined" ? fetch : null);
  if (!f) throw new Error("no fetch for cage-litmus quiz");
  const r = await f(QUIZ_URL, { cache: "force-cache" });
  if (!r.ok) throw new Error("cage-litmus-quiz HTTP " + r.status);
  _quizCache = await r.json();
  return _quizCache;
}

async function loadTrial(fetchImpl) {
  if (_trialCache) return _trialCache;
  const f = fetchImpl || (typeof fetch !== "undefined" ? fetch : null);
  if (!f) return null;
  try {
    const r = await f(TRIAL_URL, { cache: "force-cache" });
    if (!r.ok) return null;
    _trialCache = await r.json();
    return _trialCache;
  } catch {
    return null;
  }
}

export function normalizeLabel(s) {
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
 * Pure verify (mirrors declaration-cage-litmus.js)
 * @param {object} quiz
 * @param {Array<{id?:string,claim?:string,answer:string}>} responses
 * @param {{ strict?: boolean }} [opts]
 */
export function verifyResponses(quiz, responses, opts = {}) {
  const strict = opts.strict !== false;
  const byId = {};
  (quiz.items || []).forEach((it) => {
    byId[it.id] = it;
  });

  const results = [];
  let correct = 0;
  let pairHits = 0;
  let pairNeed = 0;
  let stoneTrapCaught = 0;
  let fictionCaught = 0;

  const submitted = responses || [];
  if (strict) {
    const missing = (quiz.items || [])
      .map((it) => it.id)
      .filter((id) => !submitted.some((r) => r && r.id === id));
    if (missing.length) {
      return {
        schema: "kbatch-cage-litmus-verify-v1",
        error: "strict_incomplete",
        missing,
        submitted: submitted.length,
        total: (quiz.items || []).length,
        note: "strict=true requires all 12 claim ids",
      };
    }
  }

  submitted.forEach((resp, i) => {
    const item =
      (resp.id && byId[resp.id]) ||
      (quiz.items || []).find((it) => it.claim === resp.claim) ||
      quiz.items[i];
    if (!item) {
      results.push({ ok: false, error: "unknown item", resp });
      return;
    }
    const got = normalizeLabel(resp.answer || resp.label || resp.verdict);
    const exp = normalizeLabel(item.answer);
    const ok = got === exp;
    if (ok) correct++;
    if (item.pairRequired) {
      pairNeed++;
      if (ok) pairHits++;
    }
    if (ok && exp === "STONE_TRAP") stoneTrapCaught++;
    if (ok && exp === "FICTION") fictionCaught++;
    results.push({
      id: item.id,
      ok,
      expected: exp,
      got,
      claim: item.claim,
      why: item.why,
      lane: item.lane,
      pairRequired: !!item.pairRequired,
    });
  });

  const total = (quiz.items || []).length;
  const answered = results.filter((r) => r.expected).length;
  const denom = strict ? total || 1 : answered || total || 1;
  const score = correct / denom;
  const grades = quiz.grades || {};
  let grade = "fail";
  if (score >= (grades.cage && grades.cage.min != null ? grades.cage.min : 0.85)) grade = "cage";
  else if (score >= (grades.dojo && grades.dojo.min != null ? grades.dojo.min : 0.5)) grade = "dojo";

  const traps = (quiz.items || []).filter((it) => it.answer === "STONE_TRAP").length;
  let hardRuleTriggered = false;
  if (traps && stoneTrapCaught === 0 && score >= 0.5) {
    grade = "fail";
    hardRuleTriggered = true;
  }

  return {
    schema: "kbatch-cage-litmus-verify-v1",
    tool: "kbatch_cage_litmus_verify",
    submitted: answered,
    total: denom,
    correct,
    score: +score.toFixed(4),
    grade,
    gradeLabel: (grades[grade] && grades[grade].label) || grade,
    gradeNote: (grades[grade] && grades[grade].note) || "",
    stoneTrapCaught,
    fictionCaught,
    pairHits,
    pairNeed,
    hardRuleTriggered,
    perItem: results,
    note: hardRuleTriggered
      ? "zero STONE_TRAP catches → fail even though score ≥ 0.5"
      : grade === "cage"
        ? "Cage-grade · material pairing + all fiction & stone-traps caught"
        : (grades[grade] && grades[grade].note) || "",
    doctrine: quiz.doctrine || [],
    page: PAGE_URL,
    at: new Date().toISOString(),
  };
}

/** Built-in calibration profiles (answers derived from quiz keys) */
function profileAnswers(quiz, kind) {
  const items = quiz.items || [];
  if (kind === "oracle") {
    return items.map((it) => ({ id: it.id, answer: it.answer }));
  }
  if (kind === "stoneOnly") {
    /* confuses: treats STONE_TRAP as FACT, FICTION as FACT-ish mess */
    return items.map((it) => {
      if (it.answer === "STONE_TRAP") return { id: it.id, answer: "FACT" };
      if (it.answer === "FICTION") return { id: it.id, answer: "FACT" };
      return { id: it.id, answer: it.answer };
    });
  }
  if (kind === "movieBeliever") {
    /* catches some fiction but zero stone traps */
    return items.map((it) => {
      if (it.answer === "STONE_TRAP") return { id: it.id, answer: "FACT" };
      if (it.answer === "FICTION") return { id: it.id, answer: "FICTION" };
      return { id: it.id, answer: it.answer };
    });
  }
  return null;
}

export async function cageLitmusMcpCall(name, args = {}, opts = {}) {
  const fetchImpl = opts.fetch;
  const quiz = await loadQuiz(fetchImpl);

  switch (name) {
    case "kbatch_cage_litmus_quiz": {
      const include = args.include || ["items", "labels", "grades"];
      const wantAnswers = args.answers !== false;
      let items = quiz.items || [];
      if (Array.isArray(args.ids) && args.ids.length) {
        const set = new Set(args.ids.map(String));
        items = items.filter((it) => set.has(it.id));
      }
      if (!wantAnswers) {
        items = items.map((it) => {
          const { answer, why, ...rest } = it;
          return rest;
        });
      }
      const out = {
        schema: quiz.schema || "kbatch-declaration-cage-litmus-v1",
        tool: name,
        title: quiz.title,
        count: items.length,
        total: (quiz.items || []).length,
        blinded: !wantAnswers,
      };
      if (include.includes("labels")) out.labels = quiz.labels;
      if (include.includes("grades")) out.grades = quiz.grades;
      if (include.includes("doctrine")) out.doctrine = quiz.doctrine;
      if (include.includes("items")) out.items = items;
      if (include.includes("agentPrompt")) out.agentPrompt = quiz.agentPrompt;
      if (include.includes("calibration")) {
        const trial = await loadTrial(fetchImpl);
        out.calibration = {
          oracle: { score: 1, grade: "cage" },
          stoneOnly: { score: 0.42, grade: "fail", note: "approx · profile recompute via verify" },
          movieBeliever: {
            score: 0.58,
            grade: "dojo",
            note: "approx · may hard-fail if zero STONE_TRAP",
          },
          grokLive: trial && trial.trial
            ? {
                score: trial.trial.score,
                grade: trial.trial.grade,
                when: (trial.trial.at || "").slice(0, 10),
                correct: trial.trial.correct,
              }
            : { score: 1, grade: "cage", when: "2026-07-24" },
        };
      }
      out.urls = {
        quiz: QUIZ_URL,
        page: PAGE_URL,
        trial: TRIAL_URL,
      };
      return out;
    }

    case "kbatch_cage_litmus_verify": {
      if (!Array.isArray(args.answers)) {
        return { error: "answers array required", tool: name };
      }
      return verifyResponses(quiz, args.answers, { strict: args.strict !== false });
    }

    case "kbatch_cage_litmus_grade": {
      const profile = args.profile || "bands";
      const includeDoctrine = args.includeDoctrine !== false;
      const out = {
        schema: "kbatch-cage-litmus-grade-v1",
        tool: name,
        grades: quiz.grades,
        hardRule:
          "If stoneTrapCaught === 0 and score ≥ 0.5 → grade fail (even if score would be dojo)",
        labels: quiz.labels,
      };
      if (includeDoctrine) out.doctrine = quiz.doctrine;

      const trial = await loadTrial(fetchImpl);
      const calibration = {
        oracle: { score: 1.0, grade: "cage" },
        stoneOnly: null,
        movieBeliever: null,
        grokLive:
          trial && trial.trial
            ? {
                score: trial.trial.score,
                grade: trial.trial.grade,
                when: (trial.trial.at || "").slice(0, 10),
                correct: trial.trial.correct,
                total: trial.trial.total,
                stoneTrapCaught: trial.trial.stoneTrapCaught,
                fictionCaught: trial.trial.fictionCaught,
              }
            : { score: 1.0, grade: "cage", when: "2026-07-24" },
      };

      /* live recompute profiles from quiz keys */
      const stoneRep = verifyResponses(quiz, profileAnswers(quiz, "stoneOnly"), {
        strict: true,
      });
      const movieRep = verifyResponses(quiz, profileAnswers(quiz, "movieBeliever"), {
        strict: true,
      });
      const oracleRep = verifyResponses(quiz, profileAnswers(quiz, "oracle"), {
        strict: true,
      });
      calibration.stoneOnly = {
        score: stoneRep.score,
        grade: stoneRep.grade,
        hardRuleTriggered: stoneRep.hardRuleTriggered,
        stoneTrapCaught: stoneRep.stoneTrapCaught,
      };
      calibration.movieBeliever = {
        score: movieRep.score,
        grade: movieRep.grade,
        hardRuleTriggered: movieRep.hardRuleTriggered,
        stoneTrapCaught: movieRep.stoneTrapCaught,
        fictionCaught: movieRep.fictionCaught,
      };
      calibration.oracle = {
        score: oracleRep.score,
        grade: oracleRep.grade,
        correct: oracleRep.correct,
      };

      if (profile === "bands") {
        /* bands only */
      } else if (profile === "all") {
        out.calibration = calibration;
      } else if (calibration[profile]) {
        out.profile = profile;
        out.result = calibration[profile];
        out.calibration = { [profile]: calibration[profile] };
      } else {
        out.error = "unknown profile: " + profile;
      }

      if (profile === "all" || profile === "bands") {
        out.urls = { quiz: QUIZ_URL, page: PAGE_URL, trial: TRIAL_URL };
      }
      out.schemaVersion = SCHEMA_VERSION;
      return out;
    }

    default:
      return { error: "unknown cage litmus tool: " + name };
  }
}

export function isCageLitmusTool(name) {
  return String(name || "").startsWith("kbatch_cage_litmus_");
}
