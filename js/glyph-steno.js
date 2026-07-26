/**
 * GrokYtalkY glyph pixels ↔ stenoSTRIP whitespace broadcast
 *
 * Packs a 13×13 (or 25×25) binary/glyph matrix into the 13-space steno alphabet
 * so blank/whitespace capacity can carry glyph frames for mesh / gy-stream /
 * freya peers — same stego rail as blank coins.
 *
 * Matrix vocab (GY): 13 / 25 / 37 / 49 — default 13 (matches STENO_SPACES length).
 *
 * @see js/steno-strip.js · js/pcap-image-bridge.js · js/mesh-bus.js
 */

import {
  STENO_SPACES,
  stenoEncode,
  stenoDecode,
  analyzeStenoSpace,
} from "./steno-strip.js";
import { meshBroadcast } from "./mesh-bus.js";
import { publish } from "./ironline-bus.js";

export const GLYPH_SIZES = [13, 25, 37, 49];
export const DEFAULT_GLYPH_N = 13;

/**
 * Normalize pixel list/matrix to flat 0/1 of length n*n.
 * @param {ArrayLike<number>|number[][]|string} pixels
 * @param {number} n
 */
export function normalizeGlyphPixels(pixels, n = DEFAULT_GLYPH_N) {
  const size = n * n;
  /** @type {number[]} */
  const out = new Array(size).fill(0);
  if (pixels == null) return out;

  if (typeof pixels === "string") {
    // "1010…" or rows joined
    const bits = pixels.replace(/[^01]/g, "");
    for (let i = 0; i < Math.min(size, bits.length); i++) {
      out[i] = bits[i] === "1" ? 1 : 0;
    }
    return out;
  }

  if (Array.isArray(pixels) && Array.isArray(pixels[0])) {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const v = pixels[r]?.[c];
        out[r * n + c] = v ? 1 : 0;
      }
    }
    return out;
  }

  const arr = Array.from(pixels);
  for (let i = 0; i < Math.min(size, arr.length); i++) {
    const v = arr[i];
    out[i] = typeof v === "number" ? (v > 0.5 ? 1 : 0) : v ? 1 : 0;
  }
  return out;
}

/**
 * Pack glyph bits into bytes (MSB first).
 * @param {number[]} bits
 */
export function glyphBitsToBytes(bits) {
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let k = 0; k < 8; k++) {
      if (bits[i + k]) b |= 1 << (7 - k);
    }
    bytes.push(b);
  }
  return new Uint8Array(bytes);
}

/**
 * Unpack bytes to bits (length hint).
 * @param {Uint8Array} bytes
 * @param {number} bitLen
 */
export function bytesToGlyphBits(bytes, bitLen) {
  const out = [];
  for (let i = 0; i < bytes.length && out.length < bitLen; i++) {
    const b = bytes[i];
    for (let k = 0; k < 8 && out.length < bitLen; k++) {
      out.push((b >> (7 - k)) & 1);
    }
  }
  while (out.length < bitLen) out.push(0);
  return out;
}

/**
 * Encode glyph matrix into steno whitespace trailer on carrier text.
 * Payload header: "gyg1" + n(1) + pixel bytes
 *
 * @param {string} carrierText
 * @param {ArrayLike<number>|number[][]|string} pixels
 * @param {{ n?: number }} [opts]
 */
export function encodeGlyphInSteno(carrierText, pixels, opts = {}) {
  const n = opts.n && GLYPH_SIZES.includes(opts.n) ? opts.n : DEFAULT_GLYPH_N;
  const bits = normalizeGlyphPixels(pixels, n);
  const body = glyphBitsToBytes(bits);
  const header = new TextEncoder().encode("gyg1");
  const payload = new Uint8Array(header.length + 1 + body.length);
  payload.set(header, 0);
  payload[header.length] = n;
  payload.set(body, header.length + 1);

  // Prefer string payload path for stenoEncode (base64)
  let b64;
  if (typeof btoa === "function") {
    let s = "";
    for (let i = 0; i < payload.length; i++) s += String.fromCharCode(payload[i]);
    b64 = btoa(s);
  } else {
    b64 = Buffer.from(payload).toString("base64");
  }
  const marker = `§GYG1:${n}:`;
  const encoded = stenoEncode(String(carrierText ?? ""), marker + b64);
  return {
    schema: "kbatch-glyph-steno-v1",
    n,
    bits: bits.length,
    ones: bits.reduce((a, b) => a + b, 0),
    carrier: String(carrierText ?? ""),
    encoded,
    payloadBytes: payload.length,
    stenoSpaces: STENO_SPACES.length,
  };
}

/**
 * Decode glyph matrix from text that may contain steno trailer / GYG1 marker.
 * @param {string} text
 */
export function decodeGlyphFromSteno(text) {
  const raw = String(text ?? "");
  // stenoDecode returns { text, payload, found } (or a string from live GlueLam)
  let decoded = "";
  try {
    const out = stenoDecode(raw);
    if (typeof out === "string") decoded = out;
    else if (out && typeof out === "object") {
      decoded = String(out.payload || out.text || "");
    }
  } catch {
    decoded = "";
  }
  const hay = decoded + "\n" + raw;
  const m = hay.match(/§GYG1:(\d+):([A-Za-z0-9+/=]+)/);
  if (!m) {
    return {
      ok: false,
      error: "no GYG1 glyph payload",
      hint: "Encode with encodeGlyphInSteno first; payload lives in trailing steno spaces.",
      decodedPreview: decoded.slice(0, 80),
    };
  }
  const n = parseInt(m[1], 10) || DEFAULT_GLYPH_N;
  let bytes;
  try {
    if (typeof atob === "function") {
      const bin = atob(m[2]);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } else {
      bytes = new Uint8Array(Buffer.from(m[2], "base64"));
    }
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
  // optional raw gyg1 header inside b64
  let offset = 0;
  const magic = String.fromCharCode(...bytes.slice(0, 4));
  if (magic === "gyg1") {
    offset = 5; // skip magic + n
  }
  const body = bytes.slice(offset);
  const bits = bytesToGlyphBits(body, n * n);
  const rows = [];
  for (let r = 0; r < n; r++) {
    rows.push(bits.slice(r * n, (r + 1) * n));
  }
  return {
    ok: true,
    schema: "kbatch-glyph-steno-v1",
    n,
    bits,
    rows,
    ones: bits.reduce((a, b) => a + b, 0),
  };
}

/**
 * Build a demo / from-text glyph (hash density pattern) for previews.
 * @param {string} text
 * @param {number} [n]
 */
export function glyphFromText(text, n = DEFAULT_GLYPH_N) {
  const bits = [];
  const s = String(text || "kbatch");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = 0; i < n * n; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    bits.push((h >>> (i % 16)) & 1);
  }
  // keep center denser for legibility
  const mid = Math.floor(n / 2);
  for (let r = mid - 1; r <= mid + 1; r++) {
    for (let c = mid - 1; c <= mid + 1; c++) {
      if (r >= 0 && c >= 0 && r < n && c < n) bits[r * n + c] = 1;
    }
  }
  return bits;
}

/**
 * HTML mini preview of glyph grid.
 * @param {number[]} bits
 * @param {number} n
 */
export function glyphGridHtml(bits, n = DEFAULT_GLYPH_N) {
  const cells = bits
    .map(
      (b, i) =>
        `<i class="gy-px ${b ? "is-on" : ""}" data-i="${i}"></i>`
    )
    .join("");
  return `<div class="gy-glyph-grid" style="--n:${n}" role="img" aria-label="${n}×${n} glyph">${cells}</div>`;
}

/**
 * Encode + publish glyph over mesh / gy-stream / iron-line for broadcast.
 * @param {string} carrierText
 * @param {ArrayLike<number>|number[][]|string|null} pixels
 * @param {{ n?: number, room?: string, open?: boolean }} [opts]
 */
export function broadcastGlyphSteno(carrierText, pixels = null, opts = {}) {
  const n = opts.n || DEFAULT_GLYPH_N;
  const px = pixels || glyphFromText(carrierText, n);
  const pack = encodeGlyphInSteno(carrierText, px, { n });
  const space = analyzeStenoSpace(pack.encoded, {
    payload: `glyph${n}x${n}`,
  });

  const envelope = {
    type: "glyph-steno",
    schema: "kbatch-glyph-steno-broadcast-v1",
    n,
    ones: pack.ones,
    bits: pack.bits,
    encoded: pack.encoded,
    carrier: pack.carrier.slice(0, 200),
    strip: space.strip,
    coins: space.blank?.coins || space.coins,
    ts: Date.now(),
  };

  // Mesh + GY + freya channels
  try {
    meshBroadcast({
      type: "glyph-steno",
      kind: "gy-glyph",
      room: opts.room,
      knowledge: envelope,
      text: pack.carrier.slice(0, 80),
      n,
    });
  } catch {
    /* */
  }
  try {
    publish("gy-stream", envelope);
    publish("iron-line", { type: "glyph-steno", n, ones: pack.ones });
  } catch {
    /* */
  }
  if (typeof window !== "undefined") {
    window.__KBATCH_GLYPH_STENO__ = envelope;
    window.dispatchEvent(
      new CustomEvent("kbatch-glyph-steno", { detail: envelope })
    );
  }
  return { pack, space, envelope };
}
