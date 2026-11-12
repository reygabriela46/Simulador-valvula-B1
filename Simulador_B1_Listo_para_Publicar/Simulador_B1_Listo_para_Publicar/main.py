"""ENTRADA DEL SIMULADOR. Funciona con Python 3 sin instalar librerías."""
import webbrowser
import threading
from webapp import lanzar


def main():
    import time
    # El navegador se inicia de forma local; si no abre usar http://127.0.0.1:8765
    def abrir():
        time.sleep(0.7)
        webbrowser.open('http://127.0.0.1:8765')
    threading.Thread(target=abrir,daemon=True).start()
    try:lanzar(8765)
    except OSError as exc:
        print('No se pudo abrir el puerto 8765. Quizá ya está funcionando otra copia del programa.')
        print('Prueba http://127.0.0.1:8765. Detalle:',exc)

if __name__=='__main__':main()
