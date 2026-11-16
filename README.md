# PompaSys Landing Page

Landing de PompaSys hecha con **Next.js 16** (App Router, TypeScript). Se renderiza en el servidor: el idioma sale de la URL (`/es`, `/en`) y la raíz `/` redirige según la cookie del visitor o su `Accept-Language`. El servidor también detecta el tipo de dispositivo (`<html data-device="mobile|desktop">`).

## Estructura

- `src/proxy.ts`: redirige `/` a `/es` o `/en` (cookie `NEXT_LOCALE` primero, luego `Accept-Language`).
- `src/lib/i18n.ts`: idiomas, diccionarios y negociación de idioma. Los textos viven en `src/dictionaries/{es,en}.json`; toda clave nueva va en ambos.
- `src/lib/device.ts`: detección de móvil/escritorio por User-Agent.
- `src/app/[lang]/layout.tsx`: `<html lang>`, fuente Figtree, metadatos y `hreflang`.
- `src/app/[lang]/page.tsx`: todas las secciones (Hero, Servicios, Nosotros, Proceso, Contacto, Footer).
- `src/components/` (todos de cliente):
  - `Header`, `BackToTop`.
  - `ContactForm`: formulario con **Formik** y validación con **Yup**. El error aparece bajo cada campo al salir de él o al enviar, y se corrige en vivo al escribir.
  - `TrafficChart`: gráfica de red simulada (entrada/salida) del hero. Los datos se generan en el navegador, no son mediciones reales.
  - `Terminal`: terminal decorativa de la sección Servicios.
  - `CountUp`: contadores del hero que suben al verse.
  - `ProcessTimeline`: línea de tiempo del proceso que se dibuja al hacer scroll.
  - `ScrollReveal`: fade-in al hacer scroll para todo elemento con `data-reveal`.
  - Todas las animaciones respetan `prefers-reduced-motion`.
- `src/app/api/contact/route.ts`: recibe el formulario, valida (honeypot, límites y Turnstile; ver "Protección contra abuso") y envía el correo. Ver sección "Correo del formulario".
- `src/lib/mailer.ts`: envío por Brevo con timeout, reintentos y respaldo en disco. `src/lib/contact-email.ts`: plantillas de los correos.
- `src/lib/contact-schema.ts`: esquema Yup del formulario, compartido por el navegador y el servidor. Mensajes en `src/dictionaries/*.json` (claves `err_*`).
- `src/lib/rate-limit.ts`, `client-ip.ts`, `turnstile.ts`: límites, IP real y captcha.
- `src/app/globals.css`: estilos y tokens (`:root`).
- `public/assets/`: logo, favicons y textura binaria.
- `scripts/deploy.sh`: compila, copia los estáticos, reinicia el servicio y comprueba que responde.
- `DEPLOY.md`: guía de despliegue en el servidor.

## Desarrollo local

Requiere Node 22+ y pnpm.

```bash
pnpm install
cp .env.example .env.local   # completa BREVO_API_KEY
pnpm dev                     # http://localhost:3000
```

Sin `BREVO_API_KEY` el formulario responde "No se pudo enviar el correo" (todo lo demás funciona).

## Despliegue

La guía completa para el servidor (Proxmox) está en **[DEPLOY.md](DEPLOY.md)**: requisitos, variables de entorno, servicio systemd, nginx, Cloudflare, verificación, cutover desde el Worker, actualizaciones y problemas frecuentes.

Resumen: es un servidor Node (`output: "standalone"`) que escucha en `127.0.0.1:3000` detrás del proxy. Para actualizar, en el servidor:

```bash
sudo -u pompasys ./scripts/deploy.sh
```

## Correo del formulario

Al enviar el formulario, `/api/contact` hace esto:

1. Valida los datos con el mismo esquema Yup del navegador (nombre de al menos dos palabras, correo válido, mensaje de más de 5 caracteres; si algo falla responde 400 con el error de cada campo) y aplica las protecciones de la sección "Protección contra abuso" (campo oculto, límites, Turnstile).
2. Envía a `pompasys@gmail.com` un correo con el mensaje y datos técnicos: fecha, idioma, dispositivo, IP, navegador y página de origen. El `Reply-To` es el visitante, así que basta con responder.
3. Si el envío falla (timeout, error de red, 429 o 5xx), reintenta hasta 3 veces con espera creciente. Un error 4xx (clave o remitente inválidos) no se reintenta.
4. Si todos los intentos fallan, el mensaje se guarda en `contact-failed.jsonl` dentro de `CONTACT_FAILED_DIR` (por defecto `./data`; en producción `/var/lib/pompasys`, que crea systemd con `StateDirectory`). El visitante ve el mensaje de éxito y el error queda en el log.
5. Si el envío fue bien, manda al visitante una confirmación automática en su idioma (`es`/`en`), máximo 2 por hora a la misma dirección. Si la confirmación falla o se omite por el límite, no afecta la respuesta.

Revisar mensajes que no se pudieron enviar:

```bash
sudo cat /var/lib/pompasys/contact-failed.jsonl
journalctl -u pompasys | grep -i "contact email failed"
```

Cada línea es un JSON con nombre, correo, mensaje, datos técnicos y el error. Cuando los reenvíes a mano, vacía el archivo.

Variables opcionales: `CONTACT_TO` (destino), `CONTACT_FROM` (remitente) y `BREVO_API_URL` (solo para pruebas con un servidor simulado).

### Para que los correos no caigan en spam

Esto es configuración del dominio `pompasys.com` (DNS en Cloudflare) y de Brevo, no de la app:

- **Autenticar el dominio en Brevo:** Senders, Domains & Dedicated IPs > Domains > Authenticate. Brevo muestra los registros exactos (DKIM y el código de verificación); cópialos tal cual en el DNS.
- **SPF:** el dominio solo puede tener un registro SPF. Si ya existe uno, añade `include:spf.brevo.com` dentro de ese mismo registro en lugar de crear otro.
- **DMARC:** crea un TXT en `_dmarc` con `v=DMARC1; p=none; rua=mailto:pompasys@gmail.com`. Empieza con `p=none` para observar y endurécelo (`quarantine`) cuando confirmes que todo se autentica bien.
- Comprueba el resultado mandando un correo de prueba a una cuenta de Gmail y abriendo "Mostrar original": SPF, DKIM y DMARC deben decir PASS.

## Protección contra abuso

Capas, de la primera a la última:

| Protección | Qué hace |
|---|---|
| Campo oculto (honeypot) | Los bots que rellenan todo se descartan sin enviar nada. |
| Límite por IP | 5 mensajes en 10 minutos. Al pasarse, esa IP se bloquea un tiempo **aleatorio de 10 a 30 minutos** (se fija al empezar y no se alarga si insiste). Respuesta 429. |
| Turnstile | Captcha invisible de Cloudflare. Si está configurado, el servidor rechaza todo mensaje sin un token válido. |
| Tope global | 30 mensajes por hora en total. Al superarlo, el mensaje se guarda en `contact-failed.jsonl` y **no se envía ningún correo**, para no agotar la cuota de Brevo. El visitante ve éxito; revisa el archivo y el log (`Global limit ... reached`). |
| Confirmación limitada | Máximo 2 confirmaciones por hora a la misma dirección, para que el formulario no sirva para spamear a un tercero. Tu correo interno sí llega siempre. |

Los contadores viven en memoria: reiniciar el servicio los borra. Los valores están en `src/lib/rate-limit.ts` (IP) y en `src/app/api/contact/route.ts` (global y confirmaciones).

### IP real del visitante (Cloudflare)

Por defecto la IP se toma de `CF-Connecting-IP` o `X-Forwarded-For`. Esos headers los puede inventar cualquiera si el servidor es alcanzable sin pasar por Cloudflare, y entonces el límite por IP se salta fácilmente. Para evitarlo, en `/etc/pompasys.env`:

```
CLIENT_IP_HEADER=cf-connecting-ip
```

Con eso solo se confía en ese header. **Es seguro únicamente si el servidor acepta tráfico solo de Cloudflare.** Opciones, de más a menos recomendada:

1. **Cloudflare Tunnel (`cloudflared`):** el contenedor no abre puertos al exterior; todo entra por el túnel.
2. **Firewall que solo permita las IPs de Cloudflare** (lista oficial en https://www.cloudflare.com/ips/). Ejemplo con ufw:
   ```bash
   for ip in $(curl -s https://www.cloudflare.com/ips-v4 https://www.cloudflare.com/ips-v6); do
     sudo ufw allow from "$ip" to any port 443 proto tcp
   done
   sudo ufw deny 443/tcp
   ```
3. Si hay otro proxy (nginx) entre Cloudflare y la app, asegúrate de que pasa `CF-Connecting-IP` sin cambiarlo.

### Turnstile (captcha)

1. En Cloudflare: **Turnstile > Add widget**. Dominios: `pompasys.com` y `www.pompasys.com`. Modo **Managed**.
2. Copia la *site key* y la *secret key* a `/etc/pompasys.env`:
   ```
   TURNSTILE_SITE_KEY=...
   TURNSTILE_SECRET_KEY=...
   ```
3. `sudo systemctl restart pompasys`. No hace falta recompilar: las claves se leen en el servidor al arrancar.

El formulario solo exige Turnstile cuando **las dos** claves están definidas. Si falta alguna, queda desactivado. El widget es invisible; solo aparece si Cloudflare necesita que el visitante interactúe. Si Cloudflare no responde, el mensaje se rechaza (por seguridad).

Para probar en local sin crear nada, Cloudflare ofrece claves de prueba que siempre aprueban:

```
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

## Notas

- Solo tema claro (`color-scheme: light`).
- Convenciones de commit: ver `.claude/skills/commit/SKILL.md`.
