#!/usr/bin/env python3
"""Gzip-capable static server: python3 serve.py 8765"""
from __future__ import annotations

import gzip
import io
import mimetypes
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Handler(SimpleHTTPRequestHandler):
    def _file_path(self) -> str | None:
        path = self.translate_path(self.path.split("?", 1)[0].split("#", 1)[0])
        if os.path.isdir(path):
            for index in ("index.html", "index.htm"):
                candidate = os.path.join(path, index)
                if os.path.isfile(candidate):
                    return candidate
            return None
        if os.path.isfile(path):
            return path
        return None

    def _wants_gzip(self, path: str) -> bool:
        if "gzip" not in (self.headers.get("Accept-Encoding") or ""):
            return False
        return not path.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".woff2", ".woff", ".mp4", ".zip"))

    def do_GET(self):  # noqa: N802
        path = self._file_path()
        if path is None:
            self.send_error(404, "File not found")
            return
        try:
            with open(path, "rb") as f:
                data = f.read()
        except OSError:
            self.send_error(404, "File not found")
            return

        ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        use_gzip = self._wants_gzip(path)
        body = data
        if use_gzip:
            buf = io.BytesIO()
            with gzip.GzipFile(fileobj=buf, mode="wb", compresslevel=5) as gz:
                gz.write(data)
            body = buf.getvalue()

        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        if path.endswith((".css", ".js", ".woff2", ".webp", ".jpg", ".jpeg", ".png", ".svg")):
            self.send_header("Cache-Control", "public, max-age=604800")
        elif path.endswith(".html"):
            self.send_header("Cache-Control", "public, max-age=600")
        if use_gzip:
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Vary", "Accept-Encoding")
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    os.chdir(os.path.dirname(os.path.abspath(__file__)) or ".")
    httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Serving gzip-capable static site on http://127.0.0.1:{port}/", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
