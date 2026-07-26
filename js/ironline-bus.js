/**
 * IronLine bus — L0–L7 telemetry + BroadcastChannel publish.
 * Contract: https://github.com/qbitOS/qbitos-iron-line
 *
 * Channels used by this surface:
 *   iron-line          — pipeline telemetry
 *   kbatch-training    — RSI / shadow metrics for search/history
 *   quantum-loopback   — path → quantum / contrail listeners
 *   hexterm            — optional strip updates
 */

export const IRON_LAYER = {
  id: "L4",
  name: "Notepad / Everything",
  app: "ugrad.kbatch.shadow",
  productSlug: "ugrad-kbatch",
  surface: "shadow-live",
};

const CHANNELS = {
  iron: "iron-line",
  training: "kbatch-training",
  loopback: "quantum-loopback",
  hexterm: "hexterm",
};

/** @type {Map<string, BroadcastChannel>} */
const channels = new Map();

function bc(name) {
  if (typeof BroadcastChannel === "undefined") return null;
  if (channels.has(name)) return channels.get(name);
  try {
    const c = new BroadcastChannel(name);
    channels.set(name, c);
    return c;
  } catch {
    return null;
  }
}

/**
 * Publish a typed event on a channel.
 * @param {string} channel
 * @param {object} payload
 */
export function publish(channel, payload) {
  const c = typeof BroadcastChannel !== "undefined" ? bc(channel) : null;
  const msg = {
    ...payload,
    _iron: {
      layer: IRON_LAYER.id,
      app: IRON_LAYER.app,
      surface: IRON_LAYER.surface,
      ts: Date.now(),
      channel,
    },
  };
  if (c) {
    try {
      c.postMessage(msg);
    } catch {
      /* ignore clone errors */
    }
  }
  // Also stash for debugging / non-BC hosts
  if (typeof window !== "undefined") {
    window.__KBATCH_IRON_LAST__ = msg;
    window.dispatchEvent(new CustomEvent("kbatch-iron", { detail: msg }));
  }
  return msg;
}

/**
 * Publish Shadow Live envelope to all relevant buses.
 * @param {object} live — analyzeShadowLive result or envelope
 * @param {{ qasm?: string, preflight?: object, spatial?: object }} [extra]
 */
export function publishShadowLive(live, extra = {}) {
  if (!live) return null;

  const metrics = live.metrics || {};
  const strip = live.strip?.label || live.strip || "";
  const base = {
    type: "shadow-live",
    text: (live.trimmed || live.text || "").slice(0, 500),
    baseLayout: live.baseLayout,
    pathBase: live.pathBase,
    pathLen: live.pathLen,
    strip,
    metrics: {
      efficiency: metrics.efficiency,
      complexity: metrics.complexity,
      strain: metrics.strain,
      rsiRisk: metrics.rsiRisk,
      homeRowPct: metrics.homeRowPct,
      travelMM: metrics.travelMM,
      fingerBalance: metrics.fingerBalance,
      keys: metrics.keys,
      bpm: metrics.bpm,
    },
    ringSample: (live.ring || [])
      .slice(0, 6)
      .map((r) => ({ id: r.id, name: r.name, shadow: String(r.shadow || "").slice(0, 32) })),
    rankedTop: (live.ranked || []).slice(0, 3).map((r) => ({
      id: r.id,
      name: r.name,
      score: r.score,
    })),
    caption_out: live.caption_out,
    copilot: (live.copilot || []).slice(0, 3),
  };

  publish(CHANNELS.iron, {
    type: "telemetry",
    event: "shadow-live",
    layer: IRON_LAYER.id,
    ...base,
  });

  publish(CHANNELS.training, {
    type: "kbatch-training",
    source: "shadow-live",
    ...base,
  });

  publish(CHANNELS.loopback, {
    type: "quantum-loopback",
    source: "shadow-live",
    pathLen: base.pathLen,
    rsi: metrics.rsiRisk,
    efficiency: metrics.efficiency,
    qasm: extra.qasm ? String(extra.qasm).slice(0, 4000) : undefined,
    preflight: extra.preflight || undefined,
    spatial: extra.spatial || undefined,
  });

  publish(CHANNELS.hexterm, {
    type: "strip",
    source: "shadow-live",
    strip,
    layout: live.baseLayout,
  });

  return base;
}

/**
 * Subscribe to iron-line (for UI status).
 * @param {(msg: object) => void} fn
 * @returns {() => void} unsubscribe
 */
export function onIronLine(fn) {
  const c = bc(CHANNELS.iron);
  if (!c) return () => {};
  const handler = (ev) => fn(ev.data);
  c.addEventListener("message", handler);
  return () => c.removeEventListener("message", handler);
}

export function ironChannels() {
  return { ...CHANNELS, layer: IRON_LAYER };
}
