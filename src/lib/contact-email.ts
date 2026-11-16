function escapeHtml(str: string): string {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}

export type ContactMeta = {
  lang: string;
  device: string;
  ip: string;
  userAgent: string;
  referer: string;
  receivedAt: string; // ISO date
};

/** Plain-text list of the technical details attached to every contact message. */
export function metaLines(meta: ContactMeta): string[] {
  return [
    `Fecha: ${meta.receivedAt}`,
    `Idioma: ${meta.lang}`,
    `Dispositivo: ${meta.device}`,
    `IP: ${meta.ip}`,
    `Navegador: ${meta.userAgent || "—"}`,
    `Página: ${meta.referer || "—"}`,
  ];
}

export function buildEmailHtml(name: string, email: string, message: string, meta: ContactMeta): string {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  const field = (label: string, valueHtml: string) => `
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

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0;border-top:1px solid #e3e7ef;">
              <tr>
                <td style="padding-top:16px;font-family:${font};font-size:12px;line-height:1.7;color:#5a6478;">
                  ${metaLines(meta).map((line) => escapeHtml(line)).join("<br>")}
                </td>
              </tr>
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

type Lang = "es" | "en";

const CONFIRMATION: Record<Lang, { subject: string; title: string; body: (name: string) => string; copy: string; footer: string }> = {
  es: {
    subject: "Recibimos tu mensaje — PompaSys",
    title: "Recibimos tu mensaje",
    body: (name) => `Hola ${name}, gracias por escribirnos. Revisaremos tu mensaje y te responderemos en menos de 24 horas.`,
    copy: "Tu mensaje",
    footer: "Este es un correo automático. Puedes responder a este mensaje si quieres añadir algo.",
  },
  en: {
    subject: "We got your message — PompaSys",
    title: "We got your message",
    body: (name) => `Hi ${name}, thanks for reaching out. We'll review your message and get back to you within 24 hours.`,
    copy: "Your message",
    footer: "This is an automated email. Reply to it if you want to add anything.",
  },
};

/** Subject, HTML and text for the automatic confirmation sent to the visitor. */
export function buildConfirmation(name: string, message: string, lang: Lang) {
  const t = CONFIRMATION[lang];
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const safeBody = escapeHtml(t.body(name));
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(t.subject)}</title></head>
<body style="margin:0;padding:0;background-color:#f7f9fc;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f9fc;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #e3e7ef;border-radius:16px;overflow:hidden;">
      <tr><td bgcolor="#155eef" style="background-color:#155eef;padding:28px 32px;font-family:${font};font-size:19px;font-weight:800;color:#ffffff;">PompaSys</td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 12px 0;font-family:${font};font-size:22px;color:#101828;">${escapeHtml(t.title)}</h1>
        <p style="margin:0 0 24px 0;font-family:${font};font-size:15px;line-height:1.6;color:#101828;">${safeBody}</p>
        <p style="margin:0 0 6px 0;font-family:${font};font-size:12px;font-weight:700;color:#5a6478;">${escapeHtml(t.copy)}</p>
        <p style="margin:0;padding:14px 16px;background-color:#f7f9fc;border-radius:10px;font-family:${font};font-size:14px;line-height:1.6;color:#344054;">${safeMessage}</p>
      </td></tr>
      <tr><td bgcolor="#f7f9fc" style="background-color:#f7f9fc;border-top:1px solid #e3e7ef;padding:16px 32px;font-family:${font};font-size:12px;color:#5a6478;">${escapeHtml(t.footer)} <a href="https://pompasys.com/${lang}" style="color:#5a6478;">pompasys.com</a></td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = `${t.title}\n\n${t.body(name)}\n\n${t.copy}:\n${message}\n\n${t.footer}`;
  return { subject: t.subject, html, text };
}
