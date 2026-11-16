import { NextResponse } from "next/server";
import { ValidationError } from "yup";
import { buildConfirmation, buildEmailHtml, metaLines, type ContactMeta } from "@/lib/contact-email";
import { createContactSchema, type ContactField } from "@/lib/contact-schema";
import { detectDevice } from "@/lib/device";
import { getDictionary } from "@/lib/i18n";
import { saveFailedMessage, sendMail } from "@/lib/mailer";
import { getClientIp } from "@/lib/client-ip";
import { consume, isRateLimited } from "@/lib/rate-limit";
import { turnstileEnabled, verifyTurnstile } from "@/lib/turnstile";

type Lang = "es" | "en";

const DESTINATION = process.env.CONTACT_TO ?? "pompasys@gmail.com";
const SENDER = process.env.CONTACT_FROM ?? "noreply@pompasys.com";

const HOUR_MS = 60 * 60 * 1000;
const MAX_CONFIRMATIONS_PER_EMAIL_PER_HOUR = 2; // stops the form from mailing a third party over and over
const MAX_MESSAGES_PER_HOUR = 30; // global cap that protects the Brevo daily quota

const fail = (message: string, status: number, code?: string) =>
  NextResponse.json({ success: false, message, code }, { status });

// POST /api/contact
// Validates the contact form (with a honeypot field) and sends the message to the
// PompaSys inbox through Brevo (with retries and an on-disk fallback), then sends the
// visitor an automatic confirmation in their language. Replies go to the visitor via Reply-To.
export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return fail("Solicitud inválida.", 400);
  }

  // Honeypot: real users never fill this hidden field, bots often do.
  if (data.botcheck) return NextResponse.json({ success: true });

  const lang: Lang = data.lang === "en" ? "en" : "es";

  // Same schema as the browser, with messages in the visitor's language.
  let name: string, email: string, message: string;
  try {
    ({ name, email, message } = await createContactSchema(getDictionary(lang)).validate(data, {
      abortEarly: false,
    }));
  } catch (err) {
    if (!(err instanceof ValidationError)) throw err;
    const errors: Partial<Record<ContactField, string>> = {};
    for (const inner of err.inner) {
      const field = inner.path as ContactField;
      if (field && !errors[field]) errors[field] = inner.message;
    }
    return NextResponse.json(
      { success: false, message: "Datos inválidos.", code: "validation", errors },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) return fail("Demasiados mensajes. Intenta más tarde.", 429, "rate_limit");

  // Cloudflare Turnstile (only when configured): rejects bots before anything is sent.
  if (turnstileEnabled() && !(await verifyTurnstile(String(data.turnstileToken ?? ""), ip))) {
    return fail("No se pudo verificar la solicitud.", 400, "captcha");
  }

  const meta: ContactMeta = {
    lang,
    device: detectDevice(request.headers.get("user-agent")),
    ip,
    userAgent: (request.headers.get("user-agent") ?? "").slice(0, 300),
    referer: (request.headers.get("referer") ?? "").slice(0, 300),
    receivedAt: new Date().toISOString(),
  };

  // Keeps line breaks out of the subject line.
  const cleanName = name.replace(/[\r\n]+/g, " ");

  // Global cap: over the limit the message is only kept on disk (no emails are sent),
  // so a flood can't use up the Brevo quota. Saved messages go to contact-failed.jsonl.
  if (!consume("global", "all", MAX_MESSAGES_PER_HOUR, HOUR_MS)) {
    console.error(`Global limit of ${MAX_MESSAGES_PER_HOUR} messages/hour reached; message saved to disk only.`);
    const saved = await saveFailedMessage({ name, email, message, ...meta, error: "global hourly limit reached" });
    if (!saved) return fail("No se pudo enviar el correo.", 502);
    return NextResponse.json({ success: true });
  }

  const result = await sendMail({
    sender: { email: SENDER, name: "PompaSys — Sitio web" },
    to: [{ email: DESTINATION }],
    replyTo: { email, name: cleanName },
    subject: `Nuevo mensaje de ${cleanName} — PompaSys`,
    textContent: [
      "Nuevo mensaje de contacto — PompaSys",
      "",
      `Nombre: ${name}`,
      `Correo: ${email}`,
      "",
      "Mensaje:",
      message,
      "",
      "---",
      ...metaLines(meta),
    ].join("\n"),
    htmlContent: buildEmailHtml(name, email, message, meta),
  });

  if (!result.ok) {
    console.error("Contact email failed after retries:", result.error);
    // Never lose the message: keep it on disk so it can be re-sent by hand.
    const saved = await saveFailedMessage({ name, email, message, ...meta, error: result.error });
    if (!saved) return fail("No se pudo enviar el correo.", 502);
    return NextResponse.json({ success: true });
  }

  // Best-effort confirmation to the visitor; it never affects the response.
  // At most N per hour to the same address, so the form can't be used to spam a third party.
  const emailKey = email.toLowerCase();
  if (!consume("confirmation", emailKey, MAX_CONFIRMATIONS_PER_EMAIL_PER_HOUR, HOUR_MS)) {
    console.warn("Confirmation skipped: hourly limit reached for this address.");
    return NextResponse.json({ success: true });
  }
  const confirmation = buildConfirmation(cleanName, message, lang);
  void sendMail({
    sender: { email: SENDER, name: "PompaSys" },
    to: [{ email, name: cleanName }],
    replyTo: { email: DESTINATION, name: "PompaSys" },
    subject: confirmation.subject,
    textContent: confirmation.text,
    htmlContent: confirmation.html,
  }).then((r) => {
    if (!r.ok) console.error("Confirmation email failed:", r.error);
  });

  return NextResponse.json({ success: true });
}
