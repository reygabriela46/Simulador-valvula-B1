"""Servidor web local del simulador. SOLO loopback; sin dependencias externas."""
from __future__ import annotations
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit,unquote
import json
import mimetypes
from dataclasses import asdict
from motor import Condiciones,evaluar_todo,resumen
from diagramas import dibujo
from reporte_stdlib import crear_pdf

ROOT=Path(__file__).resolve().parent
ASSETS=ROOT/'assets'
ALLOWED={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css'}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt,*args):
        print('[B1 local] '+fmt%args)

    def answer(self,data:bytes,content_type='text/plain; charset=utf-8',code=200,filename=None):
        self.send_response(code)
        self.send_header('Content-Type',content_type)
        self.send_header('Content-Length',str(len(data)))
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Cache-Control','no-store')
        if filename:self.send_header('Content-Disposition',f'attachment; filename="{filename}"')
        self.end_headers(); self.wfile.write(data)

    def _json(self,obj,code=200):
        self.answer(json.dumps(obj,ensure_ascii=False,indent=None).encode('utf-8'),'application/json; charset=utf-8',code)

    def do_GET(self):
        path=unquote(urlsplit(self.path).path)
        if path in ALLOWED:
            name=ALLOWED[path]
            p=ASSETS/name
            self.answer(p.read_bytes(),{'index.html':'text/html; charset=utf-8','app.js':'text/javascript; charset=utf-8','style.css':'text/css; charset=utf-8'}[name])
        elif path.startswith('/diagram/'):
            pieza=path[len('/diagram/'):]
            if pieza in ('cuerpo','bonete','espárragos','tuercas'):
                self.answer(dibujo(pieza),'image/svg+xml')
            else:self._json({'error':'Esquema desconocido'},404)
        elif path=='/api/health':self._json({'status':'ok','app':'B1 Material Lab'})
        else:self._json({'error':'No encontrado'},404)

    def do_POST(self):
        path=unquote(urlsplit(self.path).path)
        if path not in ('/api/evaluar','/api/reporte','/api/json'):
            self._json({'error':'Ruta no permitida'},404);return
        try:
            size=int(self.headers.get('Content-Length','0'))
            if size>15000:raise ValueError('Datos exceden tamaño permitido')
            values=json.loads(self.rfile.read(size).decode('utf-8'))
            valid=set(Condiciones.__dataclass_fields__)
            unknown=set(values)-valid
            if unknown:raise ValueError('Campos desconocidos: '+', '.join(sorted(unknown)))
            c=Condiciones(**values)
            c.validar()
            resultados=evaluar_todo(c)
            out={'input':asdict(c),'resumen':resumen(c),'evaluacion':resultados,
                 'politica':'Prioridad heuristica. Ningun candidato queda certificado automaticamente.'}
            if path=='/api/evaluar':self._json(out)
            elif path=='/api/json':
                self.answer(json.dumps(out,ensure_ascii=False,indent=2).encode('utf-8'),'application/json; charset=utf-8',filename='Evaluacion_B1.json')
            else:self.answer(crear_pdf(c),'application/pdf',filename='Informe_tecnico_B1.pdf')
        except (ValueError,TypeError,AssertionError,json.JSONDecodeError) as exc:
            self._json({'error':str(exc)},400)
        except Exception as exc:
            self._json({'error':'Fallo de servidor local: '+str(exc)},500)


def lanzar(puerto=8765):
    server=ThreadingHTTPServer(('127.0.0.1',puerto),Handler)
    print(f'\nSIMULADOR B1 LISTO: http://127.0.0.1:{puerto}\nSin Streamlit, sin pip, sin cuentas.\nCierra con Ctrl+C.\n')
    try:server.serve_forever()
    finally:server.server_close()

if __name__=='__main__':lanzar()
