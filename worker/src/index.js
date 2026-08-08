const ALLOWED_ORIGIN = "https://pompasys.com";
const DESTINATION = "pompasys@gmail.com";
const SENDER = "noreply@pompasys.com";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return corsResponse();
    if (request.method !== "POST") {
      return jsonResponse({ success: false, message: "Método no permitido." }, 405);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return jsonResponse({ success: false, message: "Solicitud inválida." }, 400);
    }

    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim();
    const message = String(data.message || "").trim();

    // Honeypot: real users never fill this hidden field, bots often do.
    if (data.botcheck) return jsonResponse({ success: true });

    if (!name || !email || !message) {
      return jsonResponse({ success: false, message: "Completa todos los campos." }, 400);
    }
    if (!isValidEmail(email)) {
      return jsonResponse({ success: false, message: "Correo electrónico inválido." }, 400);
    }
    if (name.length > 200 || email.length > 200 || message.length > 5000) {
      return jsonResponse({ success: false, message: "Uno de los campos es demasiado largo." }, 400);
    }

    try {
      await env.EMAIL.send({
        to: DESTINATION,
        from: { email: SENDER, name: "PompaSys — Sitio web" },
        replyTo: { email, name },
        subject: `Nuevo mensaje de ${name} — PompaSys`,
        text: `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${message}`,
        html:
          `<p><strong>Nombre:</strong> ${escapeHtml(name)}</p>` +
          `<p><strong>Correo:</strong> ${escapeHtml(email)}</p>` +
          `<p><strong>Mensaje:</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`
      });
    } catch (err) {
      return jsonResponse({ success: false, message: "No se pudo enviar el correo." }, 500);
    }

    return jsonResponse({ success: true });
  }
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function corsResponse() {
  return new Response(null, { headers: corsHeaders() });
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
}
