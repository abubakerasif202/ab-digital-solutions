"use client";

export function trackEnquirySuccess() {
  window.dispatchEvent(new Event("ab:enquiry-success"));
}
