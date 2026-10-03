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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (element.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    element.setAttribute("data-reveal-state", "armed");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        element.setAttribute("data-reveal-state", "in");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const delayStyle = delay ? ({ "--reveal-delay": `${delay}ms`, ...style } as CSSProperties) : style;
  const Tag = as as ElementType<HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> }>;
  return (
    <Tag ref={ref} className={className ? `reveal ${className}` : "reveal"} data-reveal-variant={variant} style={delayStyle} {...rest}>
      {children}
    </Tag>
  );
}
