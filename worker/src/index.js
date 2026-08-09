const ALLOWED_ORIGINS = ["https://pompasys.com", "https://www.pompasys.com"];
const DESTINATION = "pompasys@gmail.com";
const SENDER = "noreply@pompasys.com";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return corsResponse(request);
    if (request.method !== "POST") {
      return jsonResponse(request, { success: false, message: "Método no permitido." }, 405);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return jsonResponse(request, { success: false, message: "Solicitud inválida." }, 400);
    }

    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim();
    const message = String(data.message || "").trim();

    // Honeypot: real users never fill this hidden field, bots often do.
    if (data.botcheck) return jsonResponse(request, { success: true });

    if (!name || !email || !message) {
      return jsonResponse(request, { success: false, message: "Completa todos los campos." }, 400);
    }
    if (!isValidEmail(email)) {
      return jsonResponse(request, { success: false, message: "Correo electrónico inválido." }, 400);
    }
    if (name.length > 200 || email.length > 200 || message.length > 5000) {
      return jsonResponse(request, { success: false, message: "Uno de los campos es demasiado largo." }, 400);
    }

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { email: SENDER, name: "PompaSys — Sitio web" },
        to: [{ email: DESTINATION }],
        replyTo: { email, name },
        subject: `Nuevo mensaje de ${name} — PompaSys`,
        textContent: `Nuevo mensaje de contacto — PompaSys\n\nNombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${message}`,
        htmlContent: buildEmailHtml(name, email, message)
      })
    });

    if (!brevoRes.ok) {
      const brevoError = await brevoRes.text();
      console.error("Brevo error", brevoRes.status, brevoError);
      return jsonResponse(request, { success: false, message: "No se pudo enviar el correo." }, 502);
    }

    return jsonResponse(request, { success: true });
  }
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function buildEmailHtml(name, email, message) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  const field = (label, valueHtml) => `
    <tr>
      <td style="padding:0 0 20px 0;">
        <p style="margin:0 0 6px 0;font-family:${font};font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#5a6478;">${label}</p>
        <p style="margin:0;font-family:${font};font-size:15px;line-height:1.6;color:#101828;">${valueHtml}</p>
      </td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nuevo mensaje — PompaSys</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f9fc;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f9fc;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #e3e7ef;border-radius:16px;overflow:hidden;">

        <tr>
          <td bgcolor="#155eef" style="background-color:#155eef;background-image:linear-gradient(135deg,#155eef,#0b3b8c);padding:28px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:${font};font-size:19px;font-weight:800;color:#ffffff;">PompaSys</td>
              </tr>
              <tr>
                <td style="font-family:${font};font-size:13px;color:#d9e4ff;padding-top:4px;">Nuevo mensaje de contacto desde pompasys.com</td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${field("Nombre", safeName)}
              ${field("Correo electrónico", `<a href="mailto:${safeEmail}" style="color:#155eef;text-decoration:none;">${safeEmail}</a>`)}
              ${field("Mensaje", safeMessage)}
            </table>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:4px;">
              <tr>
                <td bgcolor="#155eef" style="background-color:#155eef;background-image:linear-gradient(135deg,#155eef,#0b3b8c);border-radius:999px;">
                  <a href="mailto:${safeEmail}" style="display:inline-block;padding:12px 24px;font-family:${font};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Responder a ${safeName}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td bgcolor="#f7f9fc" style="background-color:#f7f9fc;border-top:1px solid #e3e7ef;padding:16px 32px;">
            <p style="margin:0;font-family:${font};font-size:12px;color:#5a6478;">Este mensaje fue enviado automáticamente desde el formulario de contacto de <a href="https://pompasys.com" style="color:#5a6478;">pompasys.com</a>.</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin"
  };
}

function corsResponse(request) {
  return new Response(null, { headers: corsHeaders(request) });
}

function jsonResponse(request, obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) }
  });
}
