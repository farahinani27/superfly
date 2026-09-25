import http.server, urllib.parse, os, json
os.chdir(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        n=int(self.headers.get('Content-Length',0))
        d=urllib.parse.parse_qs(self.rfile.read(n).decode('utf-8','replace'))
        f={k:v[0] for k,v in d.items()}
        print("RECEIVED variant=%s serial_number=%s name=%s" %
              (f.get('variant'), f.get('serial_number'), f.get('name')), flush=True)
        payload=json.dumps({'source':'superfly-warranty','ok':True,'reference':'SF-WR-2026-TEST'})
        body=("<!doctype html><body style='background:#121212'>"
              "<script>try{window.top.postMessage(%s,'*');}catch(e){}</script></body>"%payload).encode()
        self.send_response(200); self.send_header('Content-Type','text/html; charset=utf-8')
        self.send_header('Content-Length',str(len(body))); self.end_headers(); self.wfile.write(body)
    def log_message(self,*a): pass
http.server.HTTPServer(('127.0.0.1',8931),H).serve_forever()
