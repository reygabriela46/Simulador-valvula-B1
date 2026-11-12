# Simulador B1 — listo para compartir como enlace web

**Empieza aquí:** [`PUBLICAR_EN_RENDER.md`](PUBLICAR_EN_RENDER.md) para conseguir un enlace HTTPS que puedas enviar por WhatsApp. Para ejecutar en tu propio computador, usa `main.py`.

Estructura:
- `main.py`: arranque local (http://127.0.0.1:8765).
- `deploy_render.py`: arranque público usando el puerto `PORT` y dirección `0.0.0.0`.
- `render.yaml`: configuración del despliegue en Render.
- `webapp.py`, `motor.py`, `catalogo.py`, `diagramas.py`, `reporte_stdlib.py`: servidor y simulador técnico.
- `assets/`: interfaz HTML/CSS/JS.
- `tests/`: pruebas unitarias.

El simulador prioriza candidatos de manera **heurística**, no demuestra conformidad API 6A / ISO 15156 de forma automática. Las recomendaciones pendientes requieren certificación y calificación del material real.
