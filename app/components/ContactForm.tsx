"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowIcon } from "../icons";
import { siteConfig } from "../site-config";
import { contactBudgets, contactServices } from "../contact-options";
import { trackEnquirySuccess } from "../lib/contact-analytics";

export function ContactForm() {
  const sendingRef = useRef(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formStatus, setFormStatus] = useState("");
  const [formState, setFormState] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (sendingRef.current || !form.reportValidity()) return;
    sendingRef.current = true;
    setFormState("sending");
    setFormStatus("Sending your enquiry…");
    const data = Object.fromEntries(new FormData(form).entries());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error || `We could not send your enquiry. Please email ${siteConfig.email}.`);
      }
      form.reset();
      setFieldErrors({});
      if (!data.company) trackEnquirySuccess();
      setFormState("success");
      setFormStatus("Thanks — your enquiry has been sent. We’ll be in touch shortly.");
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

  return (
    <form className="contact-form" data-state={formState} method="post" action="/api/contact" onSubmit={handleSubmit}
      onInvalidCapture={(event) => {
        const field = event.target;
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
          setFieldErrors((current) => ({ ...current, [field.id]: field.validationMessage }));
        }
      }}
      onInput={(event) => {
        const field = event.target;
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
          setFieldErrors((current) => ({ ...current, [field.id]: "" }));
        }
      }} aria-busy={formState === "sending"}>
      <noscript>
        <style>{`.contact-form .form-grid, .contact-form .form-services, .contact-form button[type="submit"], .contact-form .form-note, .contact-form .form-status { display: none !important; }`}</style>
        <p>
          To discuss your project, email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or call{" "}
          <a href={`tel:${siteConfig.phoneInternational}`}>{siteConfig.phoneDisplay}</a>.
        </p>
      </noscript>
      <div className="form-trap" aria-hidden="true" style={{ display: "none" }}>
        <label htmlFor="company">Company website</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <fieldset className="form-services">
        <legend>What do you need?</legend>
        <div className="form-service-options">
          {contactServices.map((service, index) => (
            <label className="form-service-option" key={service}>
              <input type="radio" name="service" value={service} defaultChecked={index === 0} />
              <span>{service}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form-grid">
        <label htmlFor="full-name">Name <span aria-hidden="true">*</span></label>
        <input id="full-name" aria-invalid={Boolean(fieldErrors["full-name"])} aria-describedby={fieldErrors["full-name"] ? "full-name-error" : undefined} name="fullName" type="text" autoComplete="name" maxLength={160} required aria-required="true" />
        {fieldErrors["full-name"] && <span className="field-error" id="full-name-error">{fieldErrors["full-name"]}</span>}
        <label htmlFor="email">Email <span aria-hidden="true">*</span></label>
        <input id="email" aria-invalid={Boolean(fieldErrors["email"])} aria-describedby={fieldErrors["email"] ? "email-error" : undefined} name="email" type="email" autoComplete="email" maxLength={254} required aria-required="true" />
        {fieldErrors["email"] && <span className="field-error" id="email-error">{fieldErrors["email"]}</span>}
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={50} />
        <label htmlFor="budget">Approx. budget</label>
        <select id="budget" name="budget" defaultValue="">
          <option value="" disabled>Select a range</option>
          {contactBudgets.map((budget) => <option key={budget}>{budget}</option>)}
        </select>
        <label htmlFor="timeline">Ideal timeline</label>
        <select id="timeline" name="timeline" defaultValue="">
          <option value="" disabled>Select timing</option>
          <option>As soon as possible</option>
          <option>Within 1 month</option>
          <option>Within 2–3 months</option>
          <option>Just exploring</option>
        </select>
        <label htmlFor="message">Project details <span aria-hidden="true">*</span></label>
        <textarea id="message" aria-invalid={Boolean(fieldErrors["message"])} aria-describedby={fieldErrors["message"] ? "message-error" : undefined} name="message" rows={5} maxLength={4000} required aria-required="true" />
        {fieldErrors["message"] && <span className="field-error" id="message-error">{fieldErrors["message"]}</span>}
      </div>
      <button className="button button-primary" type="submit" disabled={formState === "sending"}>
        {formState === "sending" ? "Sending…" : "Send project enquiry"} <ArrowIcon />
      </button>
      <p className="form-note">Your details are used only to respond to this enquiry. No mailing lists. No spam.</p>
      <p className={`form-status ${formState}`} role="status" aria-live="polite">
        {(formState === "success" || formState === "error") && (
          <strong className="form-status-label">
            {formState === "success" ? "Enquiry received" : "Enquiry not sent"}
          </strong>
        )}
        {formStatus}
      </p>
    </form>
  );
}
