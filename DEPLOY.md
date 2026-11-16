# Despliegue en el servidor

Guía paso a paso para publicar la landing de PompaSys en el contenedor de Proxmox. Todos los pasos de esta guía se probaron compilando en modo `standalone` y arrancando el servidor como lo hace systemd.

## Cómo queda armado

```
Visitante → Cloudflare (HTTPS, Turnstile) → proxy del servidor (nginx) → Node en 127.0.0.1:3000
                                                                         └→ Brevo (correos)
```

- La app es un servidor Node (Next.js, `output: "standalone"`). Lee el idioma y el dispositivo de cada petición, así que **no es un sitio estático**: no se puede servir con solo nginx.
- Node escucha únicamente en `127.0.0.1`. El proxy es lo único que recibe tráfico de fuera.
- El formulario se atiende en `/api/contact` de la propia app (ya no hay Worker).

## 1. Antes de empezar

- [ ] Contenedor con **Node 22 o superior**, `git` y `pnpm`:
  ```bash
  corepack enable && corepack prepare pnpm@latest --activate
  node -v && pnpm -v
  ```
- [ ] Salida a internet (descarga de dependencias y de la fuente Figtree al compilar; llamadas a Brevo y a Cloudflare en ejecución).
- [ ] **Brevo:** una API key con permiso *Transactional email: All* y el dominio `pompasys.com` autenticado (SPF, DKIM, DMARC).
- [ ] **Brevo, IP autorizada:** si la cuenta tiene activa la restricción de IPs, añade la **IP pública del servidor** en Brevo > Security > Authorised IPs. Si no, los envíos fallan con un 401 aunque en tu máquina funcionen.
- [ ] **Turnstile:** widget creado en Cloudflare con los dominios `pompasys.com` y `www.pompasys.com`, y sus dos claves a mano.

## 2. Variables de entorno

Se guardan en `/etc/pompasys.env` (fuera del repositorio) y las lee systemd.

| Variable | Obligatoria | Qué hace |
|---|---|---|
| `NODE_ENV` | sí | `production` |
| `PORT` | sí | Puerto interno. Usamos `3000`. |
| `HOSTNAME` | sí | `127.0.0.1` para que solo escuche en local. |
| `BREVO_API_KEY` | sí | Clave de Brevo para enviar los correos. |
| `CONTACT_FAILED_DIR` | recomendada | Carpeta donde se guardan los mensajes que no se pudieron enviar. Usamos `/var/lib/pompasys`. |
| `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` | recomendadas | Captcha. Solo se activa si están **las dos**. |
| `CLIENT_IP_HEADER` | recomendada | `cf-connecting-ip` para confiar solo en la IP que pone Cloudflare. Ver el paso 6: **requiere** que el servidor acepte solo tráfico de Cloudflare. |
| `CONTACT_TO` / `CONTACT_FROM` | no | Destino (`pompasys@gmail.com`) y remitente (`noreply@pompasys.com`). |

Las claves de Turnstile se leen al arrancar el servicio: no hace falta recompilar para cambiarlas.

## 3. Primera instalación

```bash
# Usuario sin acceso a shell para correr la app
sudo useradd --system --create-home --shell /usr/sbin/nologin pompasys

# Código
sudo mkdir -p /opt/pompasys && sudo chown pompasys:pompasys /opt/pompasys
sudo -u pompasys git clone <URL_DEL_REPO> /opt/pompasys
cd /opt/pompasys
```

Archivo de entorno (rellena los valores reales):

```bash
sudo tee /etc/pompasys.env >/dev/null <<'ENV'
NODE_ENV=production
PORT=3000
HOSTNAME=127.0.0.1
BREVO_API_KEY=
CONTACT_FAILED_DIR=/var/lib/pompasys
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
CLIENT_IP_HEADER=cf-connecting-ip
ENV
sudo chown root:root /etc/pompasys.env && sudo chmod 600 /etc/pompasys.env
sudo nano /etc/pompasys.env
```

> **No dejes un `.env` en `/opt/pompasys`.** Next copia ese archivo dentro de `.next/standalone` al compilar, y contendría tus claves. En el servidor los secretos viven solo en `/etc/pompasys.env`. El script de despliegue borra cualquier `.env` que se cuele en el build.

Primera compilación y arranque:

```bash
cd /opt/pompasys
sudo -u pompasys ./scripts/deploy.sh --no-restart
```

### Servicio systemd

`/etc/systemd/system/pompasys.service`:

```ini
[Unit]
Description=PompaSys landing (Next.js)
After=network.target

[Service]
Type=simple
User=pompasys
StateDirectory=pompasys
WorkingDirectory=/opt/pompasys/.next/standalone
EnvironmentFile=/etc/pompasys.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
ProtectSystem=full
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now pompasys
sudo systemctl status pompasys --no-pager
```

- `StateDirectory=pompasys` crea `/var/lib/pompasys` con los permisos correctos para guardar los mensajes fallidos.
- Si `node` no está en `/usr/bin/node`, usa la ruta que devuelva `which node`.
- Para que el script pueda reiniciar el servicio sin contraseña, añade con `sudo visudo -f /etc/sudoers.d/pompasys`:
  ```
  pompasys ALL=(root) NOPASSWD: /usr/bin/systemctl restart pompasys
  ```

## 4. Proxy inverso (nginx)

Apunta al puerto interno y conserva los headers de la petición:

```nginx
server {
    server_name pompasys.com www.pompasys.com;
    # listen 443 ssl; ... (tu configuración TLS actual)

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # CF-Connecting-IP, Accept-Language, Cookie y User-Agent pasan tal cual: no los quites.
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Si usas otro proxy (Caddy, Nginx Proxy Manager, Cloudflare Tunnel), basta con que apunte a `http://127.0.0.1:3000` y no elimine esos headers.

## 5. Cloudflare

- **SSL/TLS:** modo *Full (strict)* si el servidor tiene certificado válido.
- **Caché:** no caches el HTML. Las rutas `/`, `/es` y `/en` cambian según el idioma, la cookie y el dispositivo del visitante. Los archivos de `/_next/static/*` y `/assets/*` sí se pueden cachear.
- **Rutas del Worker:** elimina `pompasys.com/api/contact` y `www.pompasys.com/api/contact` (ver "Cutover" más abajo).

## 6. Que el servidor acepte solo tráfico de Cloudflare

Con `CLIENT_IP_HEADER=cf-connecting-ip` la app confía en ese header para el límite por IP. Es seguro **solo** si nadie puede llegar al servidor sin pasar por Cloudflare; si no, cualquiera puede inventar su IP. Elige una opción:

1. **Cloudflare Tunnel (`cloudflared`)**, la más simple: el contenedor no abre ningún puerto al exterior.
2. **Firewall con las IPs de Cloudflare** (lista oficial en https://www.cloudflare.com/ips/):
   ```bash
   for ip in $(curl -s https://www.cloudflare.com/ips-v4 https://www.cloudflare.com/ips-v6); do
     sudo ufw allow from "$ip" to any port 443 proto tcp
   done
   sudo ufw deny 443/tcp
   ```
3. Si no puedes hacer ninguna de las dos, **deja `CLIENT_IP_HEADER` sin definir**. La app usará `X-Forwarded-For`, que el proxy sobrescribe.

## 7. Verificación

Desde el propio servidor:

```bash
curl -I http://127.0.0.1:3000/es                                   # 200
curl -sI -H "Accept-Language: en" http://127.0.0.1:3000/ | grep -i location   # → /en
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/assets/logo-mark.svg   # 200
journalctl -u pompasys -n 20 --no-pager                            # sin errores
```

Desde internet:

- [ ] `https://pompasys.com/` redirige a `/es` o `/en` según el idioma del navegador.
- [ ] La página carga **con estilos** (si se ve sin diseño, faltó copiar `.next/static`; ver Problemas).
- [ ] El switch ES/EN cambia de idioma y se acuerda al volver a `/`.
- [ ] Enviar el formulario: sale el overlay, aparece el toast y llegan **dos correos** (el mensaje a `pompasys@gmail.com` y la confirmación al visitante).
- [ ] Enviar el formulario vacío muestra los errores bajo cada campo.
- [ ] En Gmail, "Mostrar original" del correo recibido: SPF, DKIM y DMARC en PASS.

## 8. Actualizar a una nueva versión

```bash
cd /opt/pompasys
sudo -u pompasys ./scripts/deploy.sh
```

El script hace `git pull`, instala dependencias, compila, copia los archivos estáticos al build, borra cualquier `.env` que haya quedado dentro, reinicia el servicio y comprueba que responde.

**Volver a una versión anterior:**

```bash
cd /opt/pompasys
sudo -u pompasys git log --oneline -10          # elige el commit bueno
sudo -u pompasys git checkout <commit>
sudo -u pompasys ./scripts/deploy.sh --no-pull
```

Para volver a la última versión: `git checkout main` y `./scripts/deploy.sh`.

## 9. Cutover desde el Worker de Cloudflare

Hasta ahora el formulario lo atendía un Worker enlazado a `pompasys.com/api/contact`. Orden recomendado para el cambio:

1. Despliega la app y confirma el paso 7 contra el servidor.
2. En Cloudflare, **elimina las rutas del Worker** (Workers & Pages > pompasys-contact > Settings > Domains & Routes). Si siguen activas, Cloudflare intercepta `/api/contact` antes de que llegue a la app.
3. Prueba el formulario real desde `https://pompasys.com`.
4. Cuando todo funcione unos días, borra el Worker `pompasys-contact` en Cloudflare junto con su secreto `BREVO_API_KEY` antiguo. El código del Worker ya no está en el repositorio (se eliminó; sigue en el historial de git si hiciera falta).

## 10. Operación diaria

| Tarea | Comando |
|---|---|
| Logs en vivo | `journalctl -u pompasys -f` |
| Reiniciar | `sudo systemctl restart pompasys` |
| Estado | `sudo systemctl status pompasys` |
| Ver mensajes que no se pudieron enviar | `sudo cat /var/lib/pompasys/contact-failed.jsonl` |
| Errores de envío | `journalctl -u pompasys \| grep -i "contact email failed"` |
| Tope global alcanzado | `journalctl -u pompasys \| grep -i "global limit"` |

Cada línea de `contact-failed.jsonl` es un JSON con nombre, correo, mensaje, datos técnicos y el motivo. Cuando reenvíes esos mensajes a mano, vacía el archivo.

Los contadores de límites (por IP, por correo y global) viven en memoria: reiniciar el servicio los borra.

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| La página carga **sin estilos** o sin imágenes | El modo standalone no incluye `public` ni `.next/static`. Ejecuta `./scripts/deploy.sh` (los copia) o hazlo a mano: `cp -r public .next/standalone/public && cp -r .next/static .next/standalone/.next/static`. |
| `Address already in use` al arrancar | Otro proceso usa el puerto 3000: `sudo lsof -iTCP:3000 -sTCP:LISTEN`. Detenlo o cambia `PORT` en `/etc/pompasys.env`. |
| El formulario dice que se envió pero no llega el correo | Mira `journalctl -u pompasys`. Un `Brevo 401 ... unrecognised IP` significa que falta autorizar la IP del servidor en Brevo. El mensaje no se pierde: queda en `contact-failed.jsonl`. |
| `Brevo 401` / `Key not found` | La clave es incorrecta o no tiene permiso *Transactional email: All*. |
| Los correos caen en spam | Faltan o fallan SPF, DKIM o DMARC del dominio. Ver "Para que los correos no caigan en spam" en el [README](README.md). |
| El formulario muestra "No pudimos verificar que eres una persona" | Turnstile: comprueba que las dos claves son correctas y que el dominio está en la lista del widget (error `110200` en la consola del navegador = dominio no permitido). |
| Todos los visitantes aparecen con la misma IP, o el límite se activa con poca gente | El proxy no está pasando la IP real. Revisa los headers del paso 4 y `CLIENT_IP_HEADER`. |
| Todos reciben el idioma equivocado | El proxy o Cloudflare está cacheando el HTML. Revisa el paso 5. |
| `429` al probar el formulario | Es el límite por IP (5 mensajes en 10 minutos, luego un bloqueo aleatorio de 10 a 30 minutos). Reinicia el servicio para limpiar los contadores. |
