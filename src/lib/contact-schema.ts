import { object, string } from "yup";
import type { Dictionary } from "@/lib/i18n";

export type ContactField = "name" | "email" | "message";

/**
 * Validation rules for the contact form. The same schema runs in the browser
 * (errors under each field) and on the server (so the rules can't be bypassed).
 * Messages come from the dictionary of the visitor's language.
 */
export function createContactSchema(dict: Dictionary) {
  return object({
    name: string()
      .trim()
      .required(dict.err_name_required)
      // At least two words (first name and last name).
      .test("two-words", dict.err_name_min, (value) => (value ?? "").split(/\s+/).filter(Boolean).length >= 2)
      .max(200, dict.err_name_max),
    email: string()
      .trim()
      .required(dict.err_email_required)
      .email(dict.err_email_invalid)
      .max(200, dict.err_email_max),
    message: string()
      .trim()
      .required(dict.err_message_required)
      .min(6, dict.err_message_min) // more than 5 characters
      .max(5000, dict.err_message_max),
  });
}
