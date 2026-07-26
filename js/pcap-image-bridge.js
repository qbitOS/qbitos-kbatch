/**
 * GrokYtalkY pcap / image / watermark bridge
 *
 * Maps KBatch Shadow blank-space payload chunks onto the same shapes GY uses:
 *   · GYST-like stream packets (hexlum / meta)
 *   · Cursor-Grok Forge marks (cgf: provenance watermark)
 *   · Hexlum lattice stamp (4×4 corner fingerprint)
 *   · BroadcastChannel iron-line + gy-stream for packet-stream handoff
 *
 * Does not require GY runtime; produces interoperable envelopes.
 *
 * @see GrokYtalkY forge_mark.go · hexlum_lane.go · stream_codec.go
 */

import { analyzeStenoSpace, stenoEncode } from "./steno-strip.js";

const FORGE_NAME = "Cursor-Grok Forge";
const FORGE_ID_SPACE = "cgf";
const CHANNEL_IRON = "iron-line";
const CHANNEL_GY = "gy-stream";
const CHANNEL_KBATCH = "kbatch-pcap-image";

/**
 * SHA-256 via Web Crypto when available; else FNV-1a fallback.
 * @param {string|Uint8Array} data
 */
async function digestHex(data) {
  const bytes =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(buf)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // FNV-1a 32-bit expanded
  let h = 0x811c9dc5;
  for (const b of bytes) {
    h ^= b;
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0").repeat(4).slice(0, 64);
}

/**
 * Forge-style provenance mark (mirrors NewForgeMark).
 * @param {{ slot?: number, source?: string, content?: string|Uint8Array }} opts
 */
export async function createForgeMark(opts = {}) {
  const slot = Math.max(1, Math.min(6, opts.slot || 1));
  const source = String(opts.source || "kbatch-shadow").slice(0, 48);
  const content =
    typeof opts.content === "string"
      ? new TextEncoder().encode(opts.content)
      : opts.content || new Uint8Array(0);
  const sum = await digestHex(
    new TextEncoder().encode(FORGE_NAME + String.fromCharCode(slot) + source + new TextDecoder().decode(content.slice(0, 64)))
  );
  const id = `${FORGE_ID_SPACE}:${sum.slice(0, 16)}`;
  const contentShort = sum.slice(16, 24);
  return {
    type: "forge-mark",
    forge: FORGE_NAME,
    id,
    slot,
    source,
    content: contentShort,
    v: "kbatch-1",
    t: Date.now(),
  };
}

/**
 * 16-bit fingerprint from mark id (StampHexLum).
 * @param {string} id
 */
export function markBits(id) {
  let h = 0;
  const s = String(id || "");
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h & 0xffff;
}

/**
 * Build N×N hexlum lattice from text path hash + optional stamp.
 * @param {string} text
 * @param {number} [n=13]
 * @param {object} [mark]
 */
export async function buildHexLum(text, n = 13, mark = null) {
  const size = Math.max(4, Math.min(49, n | 0));
  const hash = await digestHex(String(text || ""));
  const lum = new Uint8Array(size * size);
  for (let i = 0; i < lum.length; i++) {
    const hi = parseInt(hash[(i * 2) % hash.length], 16) || 0;
    const lo = parseInt(hash[(i * 2 + 1) % hash.length], 16) || 0;
    lum[i] = ((hi << 4) | lo) & 0xff;
  }
  if (mark) stampHexLum(lum, size, mark);
  return { n: size, lum, b64: btoa(String.fromCharCode(...lum)) };
}

/**
 * In-place corner watermark (GrokYtalkY StampHexLum).
 * @param {Uint8Array} lum
 * @param {number} n
 * @param {object} mark
 */
export function stampHexLum(lum, n, mark) {
  if (n < 8 || lum.length < n * n) return lum;
  const bits = markBits(mark.id);
  for (let i = 0; i < 16; i++) {
    const x = i % 4;
    const y = (i / 4) | 0;
    lum[y * n + x] = bits & (1 << i) ? 200 : 40;
  }
  let slot = mark.slot || 1;
  if (slot < 1) slot = 1;
  if (slot > 6) slot = 6;
  const sv = 30 + slot * 30;
  lum[(n - 1) * n + (n - 1)] = sv;
  lum[(n - 1) * n + (n - 2)] = sv;
  lum[(n - 2) * n + (n - 1)] = FORGE_ID_SPACE.charCodeAt(0); // 'c'
  lum[(n - 2) * n + (n - 2)] = FORGE_ID_SPACE.charCodeAt(2); // 'f'
  return lum;
}

/**
 * Chunk payload into GYST-like stream packets for pcap-style transmission.
 * @param {string|Uint8Array} payload
 * @param {{ chunkBytes?: number, kind?: string, mark?: object, text?: string }} [opts]
 */
export async function chunkToPackets(payload, opts = {}) {
  const chunkBytes = opts.chunkBytes || 64;
  const bytes =
    typeof payload === "string"
      ? new TextEncoder().encode(payload)
      : payload instanceof Uint8Array
        ? payload
        : new TextEncoder().encode(String(payload ?? ""));

  const mark =
    opts.mark ||
    (await createForgeMark({
      slot: opts.slot || 1,
      source: opts.source || "kbatch-shadow",
      content: bytes.slice(0, 32),
    }));

  const packets = [];
  // meta packet first (forge mark)
  packets.push({
    kind: "meta",
    seq: 0,
    timeMS: mark.t,
    width: 0,
    height: 0,
    payloadB64: btoa(unescape(encodeURIComponent(JSON.stringify(mark)))),
    mark: mark.id,
    forge: mark.forge,
  });

  let seq = 1;
  for (let off = 0; off < bytes.length; off += chunkBytes) {
    const slice = bytes.slice(off, off + chunkBytes);
    packets.push({
      kind: opts.kind || "hexlum",
      seq: seq++,
      timeMS: Date.now() + seq,
      width: opts.n || 13,
      height: opts.n || 13,
      payloadB64: btoa(String.fromCharCode(...slice)),
      mark: mark.id,
      offset: off,
      len: slice.length,
    });
  }

  // optional hexlum image frame stamped from full text
  const hex = await buildHexLum(opts.text || String(payload || ""), opts.n || 13, mark);
  packets.push({
    kind: "hexlum",
    seq: seq++,
    timeMS: Date.now(),
    width: hex.n,
    height: hex.n,
    payloadB64: hex.b64,
    mark: mark.id,
    watermarked: true,
  });

  return { mark, packets, bytes: bytes.length, chunks: packets.length };
}

/**
 * Full path: text → blank coins → steno embed → pcap/image packets → bus publish.
 * @param {string} text
 * @param {{ payload?: string, open?: boolean, slot?: number }} [opts]
 */
export async function buildPcapImagePath(text, opts = {}) {
  const raw = String(text ?? "");
  const payload =
    opts.payload != null
      ? String(opts.payload)
      : `kbatch:${raw.slice(0, 80)}`;

  const steno = analyzeStenoSpace(raw, { payload });
  const mark = await createForgeMark({
    slot: opts.slot || 1,
    source: "kbatch-shadow-live",
    content: payload,
  });

  // Prefer steno-encoded carrier when capacity fits
  const carrier =
    steno.allotment.fits && payload
      ? stenoEncode(raw, payload)
      : raw;

  const stream = await chunkToPackets(payload, {
    text: raw,
    mark,
    slot: opts.slot || 1,
    source: "kbatch-shadow",
    n: 13,
  });

  const hex = await buildHexLum(raw, 13, mark);

  const envelope = {
    schema: "kbatch-pcap-image-v1",
    type: "kbatch-pcap-image",
    source: "shadow-live",
    text: raw.slice(0, 500),
    carrier: carrier.slice(0, 800),
    payload: payload.slice(0, 400),
    steno: {
      strip: steno.strip,
      coins: steno.blank.coins,
      allotment: steno.allotment,
      tools: steno.tools.totals,
    },
    mark,
    stream: {
      packets: stream.packets.length,
      bytes: stream.bytes,
      kinds: [...new Set(stream.packets.map((p) => p.kind))],
    },
    packets: stream.packets,
    hexlum: { n: hex.n, b64: hex.b64 },
    gy: {
      // hints for GrokYtalkY /colossus · /forge consumers
      exportHint: ".gyst | .gyhex | .pcap",
      forge: FORGE_NAME,
      lane: "hex",
      room: opts.room || "dojo",
    },
    ts: Date.now(),
  };

  publishPcapImage(envelope);
  return envelope;
}

/**
 * Publish to IronLine + gy-stream + kbatch channel.
 * @param {object} envelope
 */
export function publishPcapImage(envelope) {
  if (typeof window === "undefined") return envelope;
  window.__KBATCH_PCAP_IMAGE__ = envelope;

  const post = (name, msg) => {
    try {
      const bc = new BroadcastChannel(name);
      bc.postMessage(msg);
      bc.close();
    } catch {
      /* */
    }
  };

  post(CHANNEL_KBATCH, envelope);
  post(CHANNEL_IRON, {
    type: "bridge",
    target: "pcap-image",
    layer: "L4",
    app: "kbatch-dictionary",
    payload: envelope,
    ts: Date.now(),
  });
  post(CHANNEL_GY, {
    type: "gyst",
    kind: "meta",
    from: "kbatch-shadow",
    forge: envelope.mark?.forge,
    mark: envelope.mark?.id,
    slot: envelope.mark?.slot,
    source: envelope.mark?.source,
    t: envelope.ts,
    kbatch: true,
    packets: envelope.packets?.length,
  });

  try {
    window.dispatchEvent(
      new CustomEvent("kbatch-pcap-image", { detail: envelope })
    );
  } catch {
    /* */
  }
  return envelope;
}

/**
 * Draw hexlum + watermark onto a canvas (for visual preview).
 * @param {HTMLCanvasElement} canvas
 * @param {object} envelope
 */
export function renderHexLumCanvas(canvas, envelope) {
  if (!canvas || !envelope?.hexlum) return;
  const n = envelope.hexlum.n || 13;
  let lum;
  try {
    const bin = atob(envelope.hexlum.b64);
    lum = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) lum[i] = bin.charCodeAt(i);
  } catch {
    return;
  }
  const scale = Math.max(4, Math.floor(Math.min(canvas.width, canvas.height) / n));
  canvas.width = n * scale;
  canvas.height = n * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const v = lum[y * n + x] || 0;
      // forge cyan tint on watermark corner cells
      const isMark = x < 4 && y < 4;
      ctx.fillStyle = isMark
        ? `rgb(${(v / 4) | 0},${v},${Math.min(255, v + 40)})`
        : `rgb(${v},${v},${v})`;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
}

/**
 * Compact HTML for Shadow Live tool panel.
 * @param {object} envelope
 */
export function pcapImageHtml(envelope) {
  if (!envelope) {
    return `<p class="writer-muted">Run Shadow Live to mint forge mark · hexlum · packet chunks from blank coins.</p>`;
  }
  const m = envelope.mark || {};
  const s = envelope.steno || {};
  const coins = s.coins || {};
  return `<div class="pcap-image-panel">
    <div class="coin-strip">${esc(s.strip || "")}</div>
    <div class="pcap-meta">
      <span class="pill high">forge ${esc(m.id || "—")}</span>
      <span class="pill mid">slot ${m.slot ?? "—"}</span>
      <span class="pill mid">${envelope.stream?.packets ?? 0} pkts</span>
      <span class="pill mid">${envelope.stream?.bytes ?? 0}B</span>
      <span class="pill mid">hexlum ${envelope.hexlum?.n || 13}²</span>
    </div>
    <p class="pcap-allot"><span class="sense-k">Coins</span> write ${coins.spentWriting ?? 0} · blank ${coins.allotable ?? 0} · free ${s.allotment?.remainingCoins ?? "—"}</p>
    <p class="pcap-hint">GYST path · ${esc((envelope.stream?.kinds || []).join(" · "))} · export ${esc(envelope.gy?.exportHint || ".pcap")}</p>
    <canvas id="pcap-hexlum-canvas" class="pcap-hexlum-canvas" width="208" height="208" aria-label="Hexlum watermark preview"></canvas>
  </div>`;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
