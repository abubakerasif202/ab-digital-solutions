"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ABLogo } from "./components/brand/ABLogo";
import { ArrowIcon } from "./icons";
import { siteConfig } from "./site-config";

const links = [
  ["/work", "Work"],
  ["/services", "Services"],
  ["/about", "About"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openedOn, setOpenedOn] = useState(pathname);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // A route change closes the menu without an effect-driven state update.
  const open = menuOpen && openedOn === pathname;
  const toggle = () => {
    setOpenedOn(pathname);
    setMenuOpen(!open);
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !navRef.current) return;
      // Keep keyboard focus inside the open menu: toggle button plus its links.
      const navItems = Array.from(navRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
      const focusable = [menuButtonRef.current, ...navItems].filter((item): item is HTMLElement => item !== null);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    // Leaving the mobile breakpoint must never strand a locked page.
    const desktop = window.matchMedia("(min-width: 861px)");
    const onBreakpoint = () => desktop.matches && setMenuOpen(false);

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [open]);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="site-header" id="top">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="shell site-header-inner">
        <Link className="brand" href="/" aria-label="AB Web Studio home">
          <ABLogo decorative />
          <span className="brand-name">AB Web Studio</span>
        </Link>

        <button
          ref={menuButtonRef}
          className="menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={toggle}
        >
          <span className="menu-button-bars" aria-hidden="true" />
          {open ? "Close" : "Menu"}
        </button>

        <nav ref={navRef} id="site-nav" className="site-nav" aria-label="Primary" data-open={open}>
          <div className="site-nav-links">
            {links.map(([href, label]) => (
              <Link key={href} href={href} aria-current={isCurrent(href) ? "page" : undefined} onClick={() => setMenuOpen(false)}>
                {label}
              </Link>
            ))}
          </div>
          <Link className="button button-primary" href="/contact" onClick={() => setMenuOpen(false)}>
            Start a project <ArrowIcon />
          </Link>
          <p className="site-nav-meta">
            <a href={`tel:${siteConfig.phoneInternational}`}>{siteConfig.phoneDisplay}</a>
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
            <span>{siteConfig.location}</span>
          </p>
        </nav>
      </div>
    </header>
  );
}
