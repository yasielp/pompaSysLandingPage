import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BREVO_URL = process.env.BREVO_API_URL ?? "https://api.brevo.com/v3/smtp/email";
const TIMEOUT_MS = 8000;
const RETRY_DELAYS_MS = [600, 1800]; // 3 attempts in total

type MailPayload = {
  sender: { email: string; name: string };
  to: { email: string; name?: string }[];
  replyTo?: { email: string; name?: string };
  subject: string;
  textContent: string;
  htmlContent: string;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Sends one email through Brevo. Retries timeouts, network errors, 429 and 5xx
 * with a short backoff; a 4xx (bad key, invalid sender...) fails immediately.
 */
export async function sendMail(payload: MailPayload): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, error: "BREVO_API_KEY is not set" };

  let lastError = "unknown error";
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const res = await fetch(BREVO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "api-key": apiKey },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) return { ok: true };

      lastError = `Brevo ${res.status}: ${(await res.text()).slice(0, 300)}`;
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable) return { ok: false, error: lastError };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    if (attempt < RETRY_DELAYS_MS.length) await sleep(RETRY_DELAYS_MS[attempt]);
  }
  return { ok: false, error: lastError };
}

/**
 * Last resort when the email could not be sent: keeps the visitor's message on
 * disk (one JSON per line) so it is never lost. Returns false if even that fails.
 */
export async function saveFailedMessage(record: Record<string, unknown>): Promise<boolean> {
  try {
    const dir = process.env.CONTACT_FAILED_DIR ?? path.join(process.cwd(), "data");
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, "contact-failed.jsonl"), JSON.stringify(record) + "\n", "utf8");
    return true;
  } catch (err) {
    console.error("Could not save failed contact message", err);
    return false;
  }
}
