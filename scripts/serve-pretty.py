#!/usr/bin/env python3
"""
Local static server with Cloudflare Pages–style pretty URLs.

  /research          → research.html
  /labs/rosetta      → labs/rosetta.html
  /dojo/             → dojo/index.html

Usage:
  python3 scripts/serve-pretty.py --port 8899 --bind 127.0.0.1
"""

from __future__ import annotations

import argparse
import os
import posixpath
import urllib.parse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class PrettyHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **getattr(SimpleHTTPRequestHandler, "extensions_map", {}),
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".json": "application/json",
        ".wasm": "application/wasm",
        ".css": "text/css",
        ".html": "text/html",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
    }

    def end_headers(self) -> None:
        # Lab iteration: avoid sticky stale JS/CSS/HTML/JSON
        path = urllib.parse.urlsplit(self.path).path.lower()
        if path.endswith((".js", ".mjs", ".css", ".html", ".json", ".map")):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def translate_path(self, path: str) -> str:
        """Resolve pretty URLs to on-disk files under the server root."""
        # Drop query/fragment
        path = path.split("?", 1)[0].split("#", 1)[0]
        path = urllib.parse.unquote(path)
        path = posixpath.normpath(path)
        words = [w for w in path.split("/") if w and w not in (".", "..")]

        root = Path(self.directory).resolve()
        self._kbatch_not_found = False
        # Build candidate relative paths
        rel = "/".join(words)
        candidates: list[Path] = []
        if not rel:
            candidates.append(root / "index.html")
        else:
            candidates.append(root.joinpath(*words))
            # pretty: /foo → foo.html
            if not rel.endswith(".html"):
                candidates.append(root.joinpath(*words[:-1], words[-1] + ".html") if len(words) > 1 else root / (words[0] + ".html"))
            # directory index
            candidates.append(root.joinpath(*words) / "index.html")

        for c in candidates:
            try:
                resolved = c.resolve()
                resolved.relative_to(root)  # path escape guard
            except Exception:
                continue
            if resolved.is_file():
                return str(resolved)
            if resolved.is_dir():
                idx = resolved / "index.html"
                if idx.is_file():
                    return str(idx)

        # Real 404 page (not Shadow home) — matches CF Pages 404.html
        nf = root / "404.html"
        if nf.is_file():
            self._kbatch_not_found = True
            return str(nf)
        return str(root.joinpath(*words) if words else root)

    def send_head(self):  # type: ignore[override]
        """Emit 404 status when we substituted 404.html for a missing path."""
        path = self.translate_path(self.path)
        if getattr(self, "_kbatch_not_found", False):
            try:
                f = open(path, "rb")
            except OSError:
                self.send_error(404, "File not found")
                return None
            try:
                fs = os.fstat(f.fileno())
                self.send_response(404)
                self.send_header("Content-type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(fs.st_size))
                self.send_header("X-KBatch-Not-Found", "1")
                self.end_headers()
                return f
            except Exception:
                f.close()
                raise
        return super().send_head()


def main() -> None:
    ap = argparse.ArgumentParser(description="Pretty-URL static server for KBatch")
    ap.add_argument("--port", type=int, default=8899)
    ap.add_argument("--bind", default="127.0.0.1")
    ap.add_argument("--root", default=str(ROOT))
    args = ap.parse_args()
    root = str(Path(args.root).resolve())
    os.chdir(root)
    handler = partial(PrettyHandler, directory=root)
    httpd = ThreadingHTTPServer((args.bind, args.port), handler)
    print(f"KBatch pretty static · http://{args.bind}:{args.port}/")
    print(f"root {root}")
    print("pretty: /research → research.html · /labs/rosetta → labs/rosetta.html")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nbye")
        httpd.server_close()


if __name__ == "__main__":
    main()
