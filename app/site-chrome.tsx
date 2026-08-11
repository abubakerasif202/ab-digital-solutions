"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { assetBase } from "./site-config";
import { ArrowIcon } from "./icons";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileCtaVisible, setMobileCtaVisible] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !menuOpen || !navRef.current) return;

      const navItems = Array.from(
        navRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const focusableItems = [menuButtonRef.current, ...navItems].filter(
        (item): item is HTMLElement => item !== null,
      );
      const firstItem = focusableItems[0];
      const lastItem = focusableItems.at(-1);

      if (!firstItem || !lastItem) return;
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.classList.toggle("nav-open", menuOpen);
    if (menuOpen) navRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("nav-open");
    };
  }, [menuOpen]);

  useEffect(() => {
    const mobileViewport = window.matchMedia("(max-width: 720px)");
    const conversionAreas = [
      document.getElementById("contact"),
      document.querySelector(".site-footer"),
    ].filter((element): element is Element => element !== null);
    const updateVisibility = () => {
      const eligibleRoute = pathname !== "/privacy";
      const conversionAreaVisible = conversionAreas.some((element) => {
        const rect = element.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight;
      });
      setMobileCtaVisible(
        eligibleRoute
        && mobileViewport.matches
        && window.scrollY > window.innerHeight * 0.72
        && !conversionAreaVisible,
      );
    };
    const observer = new IntersectionObserver(updateVisibility, { threshold: 0.05 });

    conversionAreas.forEach((element) => observer.observe(element));
    window.addEventListener("scroll", updateVisibility, { passive: true });
    mobileViewport.addEventListener("change", updateVisibility);
    updateVisibility();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateVisibility);
      mobileViewport.removeEventListener("change", updateVisibility);
    };
  }, [pathname]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header" id="top">
        <div className="container nav-wrap">
          <Link className="brand" href="/" aria-label="AB Digital Solutions home">
            <Image src={`${assetBase}/ab-logo-mark.png`} alt="" width={500} height={500} priority />
            <span className="brand-name">AB Digital Solutions</span>
          </Link>

          <button
            ref={menuButtonRef}
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav
            ref={navRef}
            id="primary-navigation"
            className={`site-nav${menuOpen ? " is-open" : ""}`}
            aria-label="Primary navigation"
          >
            <Link href="/#services" onClick={closeMenu}>Services</Link>
            <Link href="/#work" onClick={closeMenu}>Work</Link>
            <Link href="/#process" onClick={closeMenu}>Process</Link>
            <Link href="/#about" onClick={closeMenu}>About</Link>
            <Link className="nav-cta" href="/#contact" onClick={closeMenu}>
              Start a project <ArrowIcon />
            </Link>
          </nav>
        </div>
      </header>
      {mobileCtaVisible && !menuOpen ? (
        <Link className="mobile-project-cta" href="/#contact">
          Start a project <ArrowIcon />
        </Link>
      ) : null}
    </>
  );
}
