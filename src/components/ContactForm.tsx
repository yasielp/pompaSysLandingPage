"use client";

import { useFormik } from "formik";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createContactSchema, type ContactField } from "@/lib/contact-schema";
import type { Dictionary, Locale } from "@/lib/i18n";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type Toast = { kind: "ok" | "error"; title: string; text: string };

const FIELDS: ContactField[] = ["name", "email", "message"];
const MIN_SENDING_MS = 700; // avoids a flash of the loading state on fast responses
const TOAST_MS = 7000;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const ICONS = {
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" strokeLinecap="round" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 7.5l8.5 6 8.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  message: <path d="M4 5h16v11H9l-5 4V5z" strokeLinejoin="round" />,
} as const;

// Input icon shown inside the field, on the left.
function FieldIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg className="field-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

// Contact form built with Formik and validated with the shared Yup schema. Errors show
// under each field once it was touched, a loading overlay covers the form while sending,
// and a toast reports the result.
export function ContactForm({
  dict,
  lang,
  turnstileSiteKey,
}: {
  dict: Dictionary;
  lang: Locale;
  turnstileSiteKey?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const captchaBoxRef = useRef<HTMLDivElement>(null);
  const captchaIdRef = useRef<string | null>(null);
  const captchaTokenRef = useRef("");
  const [validationError, setValidationError] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const schema = useMemo(() => createContactSchema(dict), [dict]);

  const formik = useFormik({
    initialValues: { name: "", email: "", message: "", botcheck: "" },
    validationSchema: schema,
    onSubmit: async (values, { resetForm, setErrors, setTouched }) => {
      if (turnstileSiteKey && !captchaTokenRef.current) {
        setValidationError(dict.form_error_captcha_wait);
        return;
      }

      setValidationError("");
      setToast(null);

      try {
        const [res] = await Promise.all([
          fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...values, lang, turnstileToken: captchaTokenRef.current }),
          }),
          sleep(MIN_SENDING_MS),
        ]);

        if (res.status === 400) {
          const body = await res.clone().json().catch(() => null);
          if (body?.code === "captcha") {
            setToast({ kind: "error", title: dict.form_error_title, text: dict.form_error_captcha });
            return;
          }
          if (body?.code === "validation" && body.errors) {
            // The server rejected something the browser let through: show it under the field.
            setTouched({ name: true, email: true, message: true }, false);
            setErrors(body.errors);
            return;
          }
        }
        if (res.status === 429) {
          setToast({ kind: "error", title: dict.form_error_title, text: dict.form_error_rate });
          return;
        }

        const data = await res.json();
        if (data.success) {
          const firstName = values.name.trim().split(/\s+/)[0];
          resetForm();
          setToast({
            kind: "ok",
            title: dict.form_success_title,
            text: dict.form_success_text.replace("{name}", firstName).replace("{email}", values.email.trim()),
          });
        } else {
          setToast({ kind: "error", title: dict.form_error_title, text: dict.form_error_generic });
        }
      } catch {
        setToast({ kind: "error", title: dict.form_error_title, text: dict.form_error_connection });
      } finally {
        // Turnstile tokens are single-use: ask for a fresh one for the next message.
        if (turnstileSiteKey && captchaIdRef.current !== null) {
          captchaTokenRef.current = "";
          window.turnstile?.reset(captchaIdRef.current);
        }
      }
    },
  });

  const sending = formik.isSubmitting;
  // A field shows its error only after the visitor has left it (or tried to submit).
  const errorOf = (field: ContactField) => (formik.touched[field] ? formik.errors[field] : undefined);

  // The toast closes itself after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  // Cloudflare Turnstile (only when a site key is configured). The widget stays
  // invisible unless Cloudflare needs the visitor to interact.
  useEffect(() => {
    if (!turnstileSiteKey) return;

    const render = () => {
      if (!captchaBoxRef.current || captchaIdRef.current !== null || !window.turnstile) return;
      captchaIdRef.current = window.turnstile.render(captchaBoxRef.current, {
        sitekey: turnstileSiteKey,
        appearance: "interaction-only",
        theme: "light",
        callback: (token: string) => { captchaTokenRef.current = token; },
        "expired-callback": () => { captchaTokenRef.current = ""; },
        "error-callback": () => { captchaTokenRef.current = ""; },
      });
    };

    let script = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
    if (window.turnstile) {
      render();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.dataset.turnstile = "1";
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }

    return () => {
      script?.removeEventListener("load", render);
      if (captchaIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(captchaIdRef.current);
      }
      captchaIdRef.current = null;
      captchaTokenRef.current = "";
    };
  }, [turnstileSiteKey]);

  // Validates everything first so every error shows at once and the first invalid
  // field gets the focus; Formik then runs the actual submit.
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;

    const found = await formik.validateForm();
    await formik.setTouched({ name: true, email: true, message: true }, false);
    const firstInvalid = FIELDS.find((field) => found[field]);
    if (firstInvalid) {
      setValidationError("");
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    await formik.submitForm();
  }

  const fieldProps = (field: ContactField) => ({
    ...formik.getFieldProps(field),
    "aria-invalid": errorOf(field) ? true : undefined,
    "aria-describedby": errorOf(field) ? `${field}-error` : undefined,
  });

  return (
    <>
      <form
        className="contact-form"
        data-reveal
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        aria-busy={sending}
      >
        <input
          type="text"
          className="sr-only"
          tabIndex={-1}
          autoComplete="off"
          {...formik.getFieldProps("botcheck")}
        />
        <fieldset className="form-fields" disabled={sending}>
          <div className="form-row">
            <label htmlFor="name">{dict.form_name_label}</label>
            <div className={`input-wrap${errorOf("name") ? " has-error" : ""}`}>
              <FieldIcon name="user" />
              <input type="text" id="name" autoComplete="name" required {...fieldProps("name")} />
            </div>
            {errorOf("name") && <p className="field-error" id="name-error">{errorOf("name")}</p>}
          </div>
          <div className="form-row">
            <label htmlFor="email">{dict.form_email_label}</label>
            <div className={`input-wrap${errorOf("email") ? " has-error" : ""}`}>
              <FieldIcon name="mail" />
              <input type="email" id="email" autoComplete="email" required {...fieldProps("email")} />
            </div>
            {errorOf("email") && <p className="field-error" id="email-error">{errorOf("email")}</p>}
          </div>
          <div className="form-row">
            <label htmlFor="message">{dict.form_message_label}</label>
            <div className={`input-wrap input-wrap-top${errorOf("message") ? " has-error" : ""}`}>
              <FieldIcon name="message" />
              <textarea id="message" rows={3} required {...fieldProps("message")} />
            </div>
            {errorOf("message") && <p className="field-error" id="message-error">{errorOf("message")}</p>}
          </div>
        </fieldset>

        {turnstileSiteKey && <div ref={captchaBoxRef} className="captcha-box" />}

        {validationError && <p className="form-error" role="alert">{validationError}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
          {sending && <span className="spinner" aria-hidden="true" />}
          {sending ? dict.form_sending_button : dict.form_submit}
        </button>

        {sending && (
          <div className="form-loading" role="status">
            <span className="spinner-lg" aria-hidden="true" />
            <strong>{dict.form_sending_title}</strong>
            <p>{dict.form_sending_note}</p>
          </div>
        )}
      </form>

      {toast && (
        <div className={`toast toast-${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"}>
          <svg className="toast-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {toast.kind === "ok" ? (
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M12 8v5M12 16.5v.01" strokeLinecap="round" />
            )}
          </svg>
          <div className="toast-body">
            <strong>{toast.title}</strong>
            <p>{toast.text}</p>
          </div>
          <button type="button" className="toast-close" aria-label={dict.toast_close} onClick={() => setToast(null)}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
