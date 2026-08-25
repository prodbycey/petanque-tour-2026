import http.server,socketserver,webbrowser,threading,os
PORT=5190
os.chdir(os.path.dirname(os.path.abspath(__file__)))
with socketserver.TCPServer(("127.0.0.1",PORT),http.server.SimpleHTTPRequestHandler) as httpd:
    threading.Timer(.7,lambda:webbrowser.open(f"http://127.0.0.1:{PORT}")).start()
    print(f"Pétanque Tour MATCH CORE V1: http://127.0.0.1:{PORT}")
    httpd.serve_forever()
