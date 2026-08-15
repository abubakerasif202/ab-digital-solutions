/** Shared contact-enquiry types used by the API route and its tests. */

export type ContactPayload = Record<string, unknown>;

/** A validated enquiry, safe to render into an email body. */
export interface ContactEnquiry {
  fullName: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  timeline: string;
  message: string;
}

export type ContactValidation =
  | { ok: true; enquiry: ContactEnquiry }
  /**
   * A honeypot hit. The caller must respond exactly as it would to a success so
   * a bot cannot tell its submission was discarded.
   */
  | { ok: false; reason: "spam" }
  | { ok: false; reason: "invalid"; error: string };
