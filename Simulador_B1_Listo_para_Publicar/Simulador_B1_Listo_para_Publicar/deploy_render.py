"""Inicio público para Render; servidor académico sin dependencias externas.

No usar para datos confidenciales sin controles de acceso/autenticación.
La aplicación local sigue iniciándose desde main.py, por separado.
"""
import os
from http.server import ThreadingHTTPServer
from webapp import Handler


def main():
    port = int(os.environ.get("PORT", "10000"))
    if not (1 <= port <= 65535):
        raise ValueError("PORT fuera de rango")
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    server.daemon_threads = True
    print(f"B1 listo en 0.0.0.0:{port}", flush=True)
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
