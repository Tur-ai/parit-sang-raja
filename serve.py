#!/usr/bin/env python3
"""Server lokal sederhana (menghindari blokir CORS untuk ES Modules). Jalankan: python3 serve.py  ->  http://localhost:8000"""
import http.server, socketserver, os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.mjs': 'text/javascript', '.webp': 'image/webp', '.ogg': 'audio/ogg'}
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache'); super().end_headers()
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', PORT), H) as s:
    print(f'Parit Sang Raja -> http://localhost:{PORT}'); s.serve_forever()
