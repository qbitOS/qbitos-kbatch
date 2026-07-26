/**
 * GlueLam consumer — optional single-source modules (never fork classifiers).
 *
 * Tries, in order:
 *   1. window globals already injected by host PWA
 *   2. meta[name=kbatch-gluelam-base] + known filenames
 *   3. relative vendor/ paths
 *   4. graceful stubs (dictionary keeps working offline)
 *
 * Upstream: quantum-prefixes.js · qbit-dac.js · qbit-steno.js · qbit-preflight.js
 * @see docs/ECOSYSTEM-MAP.md · https://github.com/qbitOS/qbitos-gluelam
 */

const MODULE_FILES = {
  prefixes: "quantum-prefixes.js",
  dac: "qbit-dac.js",
  steno: "qbit-steno.js",
  preflight: "qbit-preflight.js",
};

/** @type {{ loaded: boolean, stubs: boolean, modules: Record<string, object|null>, base: string|null }} */
let state = {
  loaded: false,
  stubs: true,
  modules: { prefixes: null, dac: null, steno: null, preflight: null },
  base: null,
  error: null,
};

function gluelamBase() {
  if (typeof document === "undefined") return null;
  const meta = document.querySelector('meta[name="kbatch-gluelam-base"]');
  if (meta?.content) return meta.content.replace(/\/?$/, "/");
  // Common monorepo / mueee locations when served as sibling
  return null;
}

function hasReal(mod) {
  return mod && !mod.stub && typeof mod === "object";
}

/**
 * Attach stubs so callers never null-crash.
 */
function installStubs() {
  if (typeof window === "undefined") return;
  window.QuantumPrefixes =
    window.QuantumPrefixes ||
    {
      stub: true,
      classifyLine: () => ({ prefix: "0", category: "body" }),
      prefixMetadata: () => ({ symbols: 11, languages: 0 }),
      toQuantumCircuit: () => "// stub — load quantum-prefixes.js for real circuits\n",
      broadcastState: () => {},
      onStateChange: () => () => {},
    };
  window.QbitDAC = window.QbitDAC || { stub: true, encode: (t) => ({ text: t, tracks: [] }) };
  // Prefer kbatch steno-strip module (loaded as ES module) over empty stub
  window.QbitSteno =
    window.QbitSteno && !window.QbitSteno.stub
      ? window.QbitSteno
      : window.QbitSteno || {
          stub: true,
          encode: (t) => t,
          decode: (t) => t,
          strip: (t) => t,
        };
  window.QbitPreflight =
    window.QbitPreflight ||
    {
      stub: true,
      preflight: (qasm, target) => ({
        verdict: "WARN",
        scorePct: 50,
        checks: [{ name: "stub", pass: true, detail: "preflight stub — load qbit-preflight.js" }],
        backendFamily: target || "local",
        note: "GlueLam preflight not loaded",
      }),
    };
}

/**
 * Attempt to load one script URL once.
 * @param {string} url
 */
function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("no document"));
      return;
    }
    const existing = document.querySelector(`script[data-gluelam="${url}"]`);
    if (existing) {
      resolve(url);
      return;
    }
    const s = document.createElement("script");
    s.src = url;
    s.async = true;
    s.dataset.gluelam = url;
    s.onload = () => resolve(url);
    s.onerror = () => reject(new Error(`fail ${url}`));
    document.head.appendChild(s);
  });
}

/**
 * Snapshot globals into state.modules.
 */
function captureGlobals() {
  if (typeof window === "undefined") {
    state.modules = {
      prefixes: null,
      dac: null,
      steno: null,
      preflight: null,
    };
    state.stubs = true;
    return;
  }
  state.modules = {
    prefixes: window.QuantumPrefixes || null,
    dac: window.QbitDAC || null,
    steno: window.QbitSteno || null,
    preflight: window.QbitPreflight || null,
  };
  state.stubs = !(
    hasReal(state.modules.prefixes) ||
    hasReal(state.modules.dac) ||
    hasReal(state.modules.steno) ||
    hasReal(state.modules.preflight)
  );
}

/**
 * Load GlueLam modules if available. Safe to call multiple times.
 * @param {{ base?: string, force?: boolean }} [opts]
 */
export async function ensureGluelam(opts = {}) {
  if (state.loaded && !opts.force) return getGluelamStatus();

  installStubs();
  captureGlobals();

  // Already real?
  if (!state.stubs && !opts.force) {
    state.loaded = true;
    return getGluelamStatus();
  }

  const bases = [
    opts.base,
    "./vendor/gluelam/", // local quantum gutter + DAC/steno first (offline / low latency)
    gluelamBase(),
    "../mueee/",
    "https://mueee.qbitos.ai/",
  ].filter(Boolean);

  for (const base of bases) {
    const root = base.replace(/\/?$/, "/");
    try {
      // Load prefixes first (DAC/steno often depend on it)
      await loadScript(root + MODULE_FILES.prefixes);
      await Promise.allSettled([
        loadScript(root + MODULE_FILES.dac),
        loadScript(root + MODULE_FILES.steno),
        loadScript(root + MODULE_FILES.preflight),
      ]);
      captureGlobals();
      if (!state.stubs) {
        state.base = root;
        state.loaded = true;
        state.error = null;
        return getGluelamStatus();
      }
    } catch (e) {
      state.error = String(e?.message || e);
    }
  }

  // Stay on stubs — dictionary still works
  installStubs();
  captureGlobals();
  state.loaded = true;
  state.base = null;
  return getGluelamStatus();
}

export function getGluelamStatus() {
  captureGlobals();
  return {
    loaded: state.loaded,
    stubs: state.stubs,
    base: state.base,
    error: state.error,
    has: {
      prefixes: hasReal(state.modules.prefixes),
      dac: hasReal(state.modules.dac),
      steno: hasReal(state.modules.steno),
      preflight: hasReal(state.modules.preflight),
    },
    modules: state.modules,
  };
}

/**
 * Classify text lines via shared prefixes when real; else empty.
 * @param {string} text
 */
export function classifyWithPrefixes(text) {
  const QP =
    typeof window !== "undefined" ? window.QuantumPrefixes : null;
  if (!QP || QP.stub) {
    return {
      stub: true,
      lines: String(text || "")
        .split("\n")
        .filter(Boolean)
        .map((line, i) => ({ i, line: line.slice(0, 120), prefix: "0", category: "body" })),
    };
  }
  const lines = String(text || "").split("\n");
  return {
    stub: false,
    lines: lines.map((line, i) => {
      try {
        const c =
          typeof QP.classifyLine === "function"
            ? QP.classifyLine(line, "text")
            : { prefix: "0", category: "body" };
        return { i, line: line.slice(0, 120), ...c };
      } catch {
        return { i, line: line.slice(0, 120), prefix: "0", category: "body" };
      }
    }),
  };
}

/**
 * Run preflight on QASM when available.
 * @param {string} qasm
 * @param {string} [target]
 * @param {object} [opts]
 */
export function runPreflight(qasm, target = "local-simulator", opts = {}) {
  const PF = window.QbitPreflight;
  if (PF && typeof PF.preflight === "function") {
    return { ...PF.preflight(qasm, target, opts), stub: !!PF.stub };
  }
  return {
    stub: true,
    verdict: "WARN",
    scorePct: 50,
    checks: [{ name: "no-preflight", pass: true, detail: "stub" }],
  };
}
