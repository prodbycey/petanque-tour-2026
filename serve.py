import http.server, socketserver, webbrowser, threading, os
PORT=5192
os.chdir(os.path.dirname(os.path.abspath(__file__)))
class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        super().end_headers()
with socketserver.TCPServer(('127.0.0.1',PORT),Handler) as httpd:
    threading.Timer(.7,lambda:webbrowser.open(f'http://127.0.0.1:{PORT}')).start()
    print(f'Pétanque Tour APP_CAREER_V1 — http://127.0.0.1:{PORT}')
    httpd.serve_forever()
