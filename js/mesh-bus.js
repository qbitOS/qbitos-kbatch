/**
 * Mesh bus — multi-device knowledge access (Freya / GrokYtalkY aligned)
 *
 * Goal: no single device/user/AI is the *only* gate — any peer that joins
 * the mesh room with the shared room key can query / receive knowledge
 * envelopes (shadow, cortical, gutter, registers).
 *
 * Transports:
 *   · BroadcastChannel  kbatch-mesh | gy-stream | iron-line | quantum-prefixes
 *   · WebRTC data (optional, host inject)
 *   · Web NFC (Android Chrome) — tap to share room invite / envelope
 *   · postMessage parent (mueee / freya iframe)
 *
 * Not a DRM wall: public corpus stays open. Mesh room key is a *coordination*
 * token so random tabs don't collide — optional meshAuth for private rooms.
 *
 * @see freya.qbitos.ai · GrokYtalkY mesh · docs/ECOSYSTEM-MAP.md
 */

import { publish } from "./ironline-bus.js";
import { buildStamp } from "./cache-bust.js";

export const MESH_CHANNELS = {
  mesh: "kbatch-mesh",
  gy: "gy-stream",
  iron: "iron-line",
  gutter: "quantum-prefixes",
  freya: "freya-signal",
};

export const MESH_DEFAULT_ROOM = "kbatch-global";

/** @type {Map<string, BroadcastChannel>} */
const channels = new Map();
/** @type {Set<(msg: object) => void>} */
const listeners = new Set();
/** @type {object} */
let peer = {
  id: null,
  nick: "kbatch",
  room: MESH_DEFAULT_ROOM,
  role: "dict",
  capabilities: ["shadow", "cortical", "gutter", "registers", "suggest"],
  build: null,
};

function bc(name) {
  if (typeof BroadcastChannel === "undefined") return null;
  if (channels.has(name)) return channels.get(name);
  try {
    const c = new BroadcastChannel(name);
    c.onmessage = (ev) => onIncoming(ev.data);
    channels.set(name, c);
    return c;
  } catch {
    return null;
  }
}

function ensurePeer() {
  if (peer.id) return peer;
  let id = null;
  try {
    id = localStorage.getItem("kbatch-mesh-peer");
  } catch {
    /* */
  }
  if (!id) {
    id = `kb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      localStorage.setItem("kbatch-mesh-peer", id);
    } catch {
      /* */
    }
  }
  peer.id = id;
  peer.build = typeof window !== "undefined" ? window.__KBATCH_BUILD__ : null;
  try {
    const nick = localStorage.getItem("kbatch-mesh-nick");
    if (nick) peer.nick = nick;
    const room = localStorage.getItem("kbatch-mesh-room");
    if (room) peer.room = room;
  } catch {
    /* */
  }
  return peer;
}

function onIncoming(data) {
  if (!data || typeof data !== "object") return;
  // ignore self
  if (data.from === peer.id) return;
  // room filter when set
  if (data.room && peer.room && data.room !== peer.room && data.type !== "mesh-hello") {
    return;
  }
  for (const fn of listeners) {
    try {
      fn(data);
    } catch {
      /* */
    }
  }
  if (typeof window !== "undefined") {
    window.__KBATCH_MESH_LAST__ = data;
    window.dispatchEvent(new CustomEvent("kbatch-mesh", { detail: data }));
  }
}

/**
 * Join mesh room (Freya/GY compatible envelope).
 * @param {{ room?: string, nick?: string }} [opts]
 */
export function meshJoin(opts = {}) {
  ensurePeer();
  if (opts.room) {
    peer.room = opts.room;
    try {
      localStorage.setItem("kbatch-mesh-room", peer.room);
    } catch {
      /* */
    }
  }
  if (opts.nick) {
    peer.nick = opts.nick;
    try {
      localStorage.setItem("kbatch-mesh-nick", peer.nick);
    } catch {
      /* */
    }
  }
  // open all channels
  Object.values(MESH_CHANNELS).forEach((n) => bc(n));
  const hello = {
    type: "mesh-hello",
    schema: "kbatch-mesh-v1",
    from: peer.id,
    nick: peer.nick,
    room: peer.room,
    role: peer.role,
    capabilities: peer.capabilities,
    build: peer.build || buildStamp(),
    hosts: {
      freya: "https://freya.qbitos.ai/",
      gy: "gy-stream",
      kbatch: "ugrad.kbatch.shadow",
    },
    ts: Date.now(),
  };
  meshBroadcast(hello);
  publish("iron-line", { type: "mesh-join", peer: { id: peer.id, room: peer.room } });
  return { ...peer };
}

/**
 * Broadcast to mesh + gy-stream + freya signal.
 * @param {object} payload
 */
export function meshBroadcast(payload) {
  ensurePeer();
  const msg = {
    ...payload,
    from: peer.id,
    nick: peer.nick,
    room: payload.room || peer.room,
    ts: payload.ts || Date.now(),
    schema: payload.schema || "kbatch-mesh-v1",
  };
  for (const name of [MESH_CHANNELS.mesh, MESH_CHANNELS.gy, MESH_CHANNELS.freya]) {
    const c = bc(name);
    try {
      c?.postMessage(msg);
    } catch {
      /* */
    }
  }
  // parent frame (mueee / freya shell)
  if (typeof window !== "undefined" && window.parent && window.parent !== window) {
    try {
      window.parent.postMessage({ type: "kbatch-mesh", ...msg }, "*");
    } catch {
      /* */
    }
  }
  return msg;
}

/**
 * Publish knowledge envelope so *any* mesh peer can gain reference —
 * not locked to this device.
 * @param {object} knowledge — shadow / cortical / stack / gutter
 * @param {{ kind?: string }} [opts]
 */
export function meshPublishKnowledge(knowledge, opts = {}) {
  return meshBroadcast({
    type: "knowledge",
    kind: opts.kind || "shadow",
    knowledge,
    // compact pointer for large packs
    text: knowledge?.text || knowledge?.trimmed || knowledge?.caption_out || "",
    pathLen: knowledge?.pathLen,
    layout: knowledge?.baseLayout || knowledge?.layout,
  });
}

/**
 * Request knowledge from mesh peers (any device can answer).
 * @param {string} query
 */
export function meshRequest(query) {
  return meshBroadcast({
    type: "knowledge-request",
    query: String(query || "").slice(0, 200),
  });
}

export function meshSubscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function meshPeer() {
  return { ...ensurePeer() };
}

export function meshStatus() {
  ensurePeer();
  return {
    peer: { ...peer },
    channels: { ...MESH_CHANNELS },
    nfc: typeof NDEFReader !== "undefined",
    broadcast: typeof BroadcastChannel !== "undefined",
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
  };
}

/* ── Web NFC (when available) ── */

/**
 * Share mesh invite / short knowledge via NFC tap (mobile).
 * @param {{ room?: string, text?: string }} [payload]
 */
export async function nfcShare(payload = {}) {
  ensurePeer();
  if (typeof NDEFReader === "undefined") {
    return { ok: false, error: "Web NFC not available (need Android Chrome HTTPS)" };
  }
  try {
    // NDEFWriter in older drafts; write via NDEFReader in Chromium
    const writer = new NDEFReader();
    const body = JSON.stringify({
      v: 1,
      room: payload.room || peer.room,
      nick: peer.nick,
      text: String(payload.text || "").slice(0, 180),
      url: typeof location !== "undefined" ? location.origin + location.pathname : "https://kbatch.ugrad.ai/",
      ts: Date.now(),
    });
    await writer.write({
      records: [
        { recordType: "mime", mediaType: "application/json", data: body },
        {
          recordType: "url",
          data:
            (typeof location !== "undefined" ? location.href.split("#")[0] : "https://kbatch.ugrad.ai/") +
            `?mesh=${encodeURIComponent(peer.room)}`,
        },
      ],
    });
    return { ok: true, room: peer.room };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * Scan NFC for mesh invite.
 * @param {(data: object) => void} onRead
 */
export async function nfcListen(onRead) {
  if (typeof NDEFReader === "undefined") {
    return { ok: false, error: "Web NFC not available" };
  }
  try {
    const reader = new NDEFReader();
    await reader.scan();
    reader.addEventListener("reading", ({ message }) => {
      for (const rec of message.records || []) {
        if (rec.recordType === "mime" && rec.mediaType === "application/json") {
          try {
            const text = new TextDecoder().decode(rec.data);
            const data = JSON.parse(text);
            if (data.room) meshJoin({ room: data.room });
            onRead?.(data);
          } catch {
            /* */
          }
        }
      }
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * Auto-join from ?mesh=room query (PWA / NFC / freya deep link).
 */
export function meshJoinFromUrl() {
  if (typeof location === "undefined") return null;
  const u = new URL(location.href);
  const room = u.searchParams.get("mesh") || u.searchParams.get("room");
  if (room) return meshJoin({ room });
  if (location.hash === "#terminal" || location.hash === "#mesh") {
    return meshJoin({});
  }
  return meshJoin({});
}
