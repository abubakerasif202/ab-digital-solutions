"use client";

import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowIcon } from "../icons";
import { siteConfig } from "../site-config";
import { contactBudgets, contactServices } from "../contact-options";
import { trackEnquirySuccess } from "../lib/contact-analytics";

type FormState = "idle" | "sending" | "success" | "error";

interface ContactFormProps {
  /** Heading level for the form title, so it nests under its section heading. */
  titleAs?: "h2" | "h3";
}

const SERVICES_ERROR_ID = "services-error";

export function ContactForm({ titleAs: Title = "h3" }: ContactFormProps) {
  const titleId = useId();
  const sendingRef = useRef(false);
  // One identifier per submission attempt, reused when the visitor retries after a
  // failure so the server can deduplicate; replaced only after a confirmed send.
  const submissionIdRef = useRef<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formStatus, setFormStatus] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");

  const clearError = (key: string) => setFieldErrors((current) => (current[key] ? { ...current, [key]: "" } : current));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (sendingRef.current) return;
    const formData = new FormData(form);
    const services = formData.getAll("service").map(String);
    if (services.length === 0) {
      setFieldErrors((current) => ({ ...current, services: "Choose at least one service." }));
    }
    if (!form.reportValidity()) return;
    if (services.length === 0) {
      form.querySelector<HTMLInputElement>('input[name="service"]')?.focus();
      return;
    }

    sendingRef.current = true;
    setFormState("sending");
    setFormStatus("Sending your enquiry…");
    // Checkbox choices travel as one `services` array, not repeated `service` keys.
    const fields = Object.fromEntries([...formData.entries()].filter(([key]) => key !== "service"));
    submissionIdRef.current ??= crypto.randomUUID();
    const payload = { ...fields, services, submissionId: submissionIdRef.current };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok || !result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
        const error = result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error : `We could not confirm delivery. Please email ${siteConfig.email} before resending.`;
        throw new Error(error);
      }
      form.reset();
      submissionIdRef.current = null;
      setFieldErrors({});
      if (!fields.company) trackEnquirySuccess();
      setFormState("success");
      setFormStatus("Thanks — your enquiry has been sent. We’ll come back with a practical next step shortly.");
    } catch (error) {
      setFormState("error");
      setFormStatus(controller.signal.aborted
        ? `We could not confirm delivery. Please email ${siteConfig.email} before resending.`
        : error instanceof Error ? error.message : `Please email ${siteConfig.email}.`);
    } finally {
      clearTimeout(timeout);
      sendingRef.current = false;
    }
  };

  const describedBy = (id: string, help?: string) =>
    [help, fieldErrors[id] ? `${id}-error` : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <form className="contact-form enquiry-form" data-state={formState} method="post" action="/api/contact" onSubmit={handleSubmit}
      aria-labelledby={titleId}
      onInvalidCapture={(event) => {
        const field = event.target;
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
          setFieldErrors((current) => ({ ...current, [field.id]: field.validationMessage }));
        }
      }}
      onInput={(event) => {
        const field = event.target;
        if (field instanceof HTMLInputElement && field.name === "service") clearError("services");
        else if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) clearError(field.id);
      }} aria-busy={formState === "sending"}>
      <noscript>
        <style>{`.contact-form .form-grid, .contact-form .form-chips, .contact-form .form-field, .contact-form .form-actions, .contact-form .form-note, .contact-form .form-status, .contact-form .enquiry-form-required { display: none !important; }`}</style>
        <p>
          To discuss your project, email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or call{" "}
          <a href={`tel:${siteConfig.phoneInternational}`}>{siteConfig.phoneDisplay}</a>.
        </p>
      </noscript>
      {/* Honeypot: hidden from people and assistive tech. Never reuse its name for a real field. */}
      <div className="form-trap" aria-hidden="true" style={{ display: "none" }}>
        <label htmlFor="company">Company website</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="enquiry-form-head">
        <Title id={titleId} className="enquiry-form-title">Project enquiry</Title>
        <p className="enquiry-form-required"><span aria-hidden="true">*</span> Required</p>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="full-name">Name <span className="form-req" aria-hidden="true">*</span></label>
          <input id="full-name" name="fullName" type="text" autoComplete="name" maxLength={160} required aria-required="true"
            placeholder="Your name" aria-invalid={Boolean(fieldErrors["full-name"])} aria-describedby={describedBy("full-name")} />
          {fieldErrors["full-name"] && <span className="field-error" id="full-name-error">{fieldErrors["full-name"]}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="email">Email <span className="form-req" aria-hidden="true">*</span></label>
          <input id="email" name="email" type="email" autoComplete="email" maxLength={254} required aria-required="true"
            placeholder="you@business.com.au" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={describedBy("email")} />
          {fieldErrors.email && <span className="field-error" id="email-error">{fieldErrors.email}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="phone">Phone <span className="form-optional">(optional)</span></label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={50} placeholder="04xx xxx xxx" />
        </div>
        <div className="form-field">
          <label htmlFor="business">Business <span className="form-optional">(optional)</span></label>
          <input id="business" name="business" type="text" autoComplete="organization" maxLength={160} placeholder="Business or website" />
        </div>
      </div>

      <fieldset className="form-chips form-services" aria-describedby={fieldErrors.services ? SERVICES_ERROR_ID : undefined}>
        <legend>What do you need? <span className="form-req" aria-hidden="true">*</span><span className="sr-only"> (choose at least one)</span></legend>
        <div className="form-chip-row">
          {contactServices.map((service, index) => (
            <label className="form-chip" key={service}>
              <input type="checkbox" name="service" value={service} defaultChecked={index === 0} />
              <span>{service}</span>
            </label>
          ))}
        </div>
        {fieldErrors.services && <span className="field-error" id={SERVICES_ERROR_ID} role="alert">{fieldErrors.services}</span>}
      </fieldset>

      <fieldset className="form-chips form-budget">
        <legend>Budget <span className="form-optional">(optional)</span></legend>
        <div className="form-chip-row">
          {contactBudgets.map((budget) => (
            <label className="form-chip form-chip--mono" key={budget}>
              <input type="radio" name="budget" value={budget} />
              <span>{budget}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-field">
        <label htmlFor="message">Tell us about your project <span className="form-req" aria-hidden="true">*</span></label>
        <textarea id="message" name="message" rows={5} maxLength={4000} required aria-required="true"
          placeholder="What you are building, who it is for and what success looks like."
          aria-invalid={Boolean(fieldErrors.message)} aria-describedby={describedBy("message", "message-help")} />
        <p className="form-help" id="message-help">A few sentences is plenty. We reply with a practical next step.</p>
        {fieldErrors.message && <span className="field-error" id="message-error">{fieldErrors.message}</span>}
      </div>

      <div className="form-actions">
        <button className="button button-primary" type="submit" disabled={formState === "sending"}>
          {formState === "sending" ? "Sending…" : "Send project enquiry"} <ArrowIcon direction="right" />
        </button>
        <a className="form-call" href={`tel:${siteConfig.phoneInternational}`}>Or call {siteConfig.phoneDisplay}</a>
      </div>
      <p className="form-note">Your details are used only to respond to this enquiry. No mailing lists. No spam.</p>
      <p className={`form-status ${formState}`} role="status" aria-live="polite">
        {(formState === "success" || formState === "error") && (
          <strong className="form-status-label">
            {formState === "success" ? "Enquiry received" : "Please check your enquiry"}
          </strong>
        )}
        {formStatus}
      </p>
    </form>
  );
}
