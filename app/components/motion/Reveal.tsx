"use client";

import { useEffect, useRef, type Ref, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from "react";

type RevealVariant = "fade-up" | "blur" | "mask" | "line";
type RevealTag = "div" | "p" | "dl" | "h2" | "h3" | "ul" | "span";

interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: RevealTag;
  variant?: RevealVariant;
  /** Stagger offset in ms, applied as a transition delay. */
  delay?: number;
  children?: ReactNode;
}

/**
 * One-shot scroll reveal. Content is fully visible in the server HTML; after
 * hydration, only elements that start below the fold are armed (hidden) and
 * revealed once by an IntersectionObserver, so above-the-fold content never
 * flashes and a failed script never hides anything. Motion lives in
 * motion.css (transform / opacity only) and is disabled for reduced motion.
 */
export function Reveal({ as = "div", variant = "fade-up", delay = 0, className, style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let initialized = false;
    const show = () => {
      initialized = true;
      element.setAttribute("data-reveal-state", "in");
      observer.disconnect();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (!initialized) {
          initialized = true;
          // Observer geometry is supplied asynchronously, without forcing layout of
          // content-visibility sections during hydration. Never hide visible or focused content.
          const bounds = entry.boundingClientRect;
          // Skipped content-visibility descendants report an empty rectangle at zero,
          // not an above-the-fold position. Keep those armed until they intersect.
          const hasBounds = bounds.width > 0 || bounds.height > 0;
          if (entry.isIntersecting || (hasBounds && bounds.top < window.innerHeight * 0.92) || element.contains(document.activeElement)) {
            show();
            return;
          }
          element.setAttribute("data-reveal-state", "armed");
        }
        if (entry.isIntersecting) show();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    observer.observe(element);
    element.addEventListener("focusin", show);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = () => {
      if (motionQuery.matches) show();
    };
    motionQuery.addEventListener("change", handleMotionChange);
    return () => {
      observer.disconnect();
      element.removeEventListener("focusin", show);
      motionQuery.removeEventListener("change", handleMotionChange);
      element.removeAttribute("data-reveal-state");
    };
  }, []);

  const delayStyle = delay ? ({ "--reveal-delay": `${delay}ms`, ...style } as CSSProperties) : style;
  const Tag = as as ElementType<HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> }, RevealTag>;
  return (
    <Tag ref={ref} className={className ? `reveal ${className}` : "reveal"} data-reveal-variant={variant} style={delayStyle} {...rest}>
      {children}
    </Tag>
  );
}
