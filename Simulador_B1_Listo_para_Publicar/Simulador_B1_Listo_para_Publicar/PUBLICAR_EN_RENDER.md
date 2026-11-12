# Publicar el simulador como una página web

Este proyecto puede ejecutarse localmente (`main.py`) o en un servicio web para compartir un enlace (`deploy_render.py`). **No necesita instalar librerías adicionales**. No publiques las normas originales ni documentación con acceso restringido. El simulador es académico y no certifica materiales.

## A. Enlace permanente con Render (recomendado para compartir)

1. Abre https://github.com y crea una cuenta si no la tienes.
2. Pulsa **New repository**. Nómbralo, por ejemplo, `simulador-valvula-b1`. Puede ser *Private* si prefieres mantener el código restringido (Render debe tener acceso a ese repositorio).
3. Dentro del repositorio, haz clic en **Add file → Upload files** y sube **el contenido descomprimido de esta carpeta**, incluidos `assets/`, `deploy_render.py`, `render.yaml`, `webapp.py`, `motor.py`, etc. No subas solamente el archivo .zip ni la carpeta `.venv`.
4. Abre https://dashboard.render.com y entra con tu cuenta. Pulsa **New → Web Service** y conecta el repositorio de GitHub creado.
5. Configura:
   - **Language / Runtime:** Python
   - **Instance type:** Free, si está disponible para tu cuenta
   - **Build Command:** `python -m compileall -q .`
   - **Start Command:** `python deploy_render.py`
   - **Health Check Path:** `/api/health` (opcional)
6. Pulsa **Deploy Web Service**. Cuando el estado indique que está activo, Render proporciona un enlace HTTPS que termina en `.onrender.com`.
7. Copia ese enlace y envíalo por WhatsApp, correo o cualquier otra aplicación. El destinatario lo abre en Chrome, Edge o en su teléfono; **no necesita PyCharm ni Python**.

### Importante

- El plan gratuito de Render puede dejar inactivo el servidor tras un período sin visitas; al abrir el enlace nuevamente puede tardar en responder.
- La interfaz estará accesible a cualquiera que conozca el enlace. No introduzcas datos confidenciales o credenciales.
- Render ejecuta el servicio en la nube: **tu computador no tiene que permanecer encendido**.
- Este proyecto incluye una API HTTP sin autenticación; úsala como demostración académica. Para un lanzamiento institucional se debe implementar autenticación, medidas contra abuso, límites de concurrencia y revisar dependencias/normas.

## B. Compartir por unas horas, usando tu computador

Si no quieres usar GitHub ni Render todavía, usa un túnel temporal de Cloudflare:

1. Instala `cloudflared` desde https://developers.cloudflare.com/tunnel/downloads/ (Windows).
2. Abre el programa local con `main.py`, confirma que http://127.0.0.1:8765 funciona.
3. Abre una nueva terminal en Windows y ejecuta:
   `cloudflared tunnel --url http://127.0.0.1:8765`
4. Copia el enlace HTTPS de `trycloudflare.com` que aparezca y envíalo.

Este segundo enlace **solo funciona mientras tu simulador local y el proceso de Cloudflare estén activos**. La dirección cambia al reiniciar el túnel. No lo compartas públicamente si no deseas que cualquier poseedor del enlace acceda a la aplicación.

## Comprobación técnica local de despliegue

- En una terminal: `python deploy_render.py` (inicia en el puerto 10000).
- Revisa `http://127.0.0.1:10000/api/health`.
- Para pruebas unitarias: `python -m unittest discover -s tests -v`.
