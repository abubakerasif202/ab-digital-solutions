"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { assetBase } from "./site-config";

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.classList.toggle("nav-open", menuOpen);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("nav-open");
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header" id="top">
        <div className="container nav-wrap">
          <a className="brand" href="/" aria-label="AB Digital Solutions home">
            <Image src={`${assetBase}/ab-logo-mark.png`} alt="" width={500} height={500} priority />
            <span className="brand-name">AB Digital Solutions</span>
          </a>

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
            id="primary-navigation"
            className={`site-nav${menuOpen ? " is-open" : ""}`}
            aria-label="Primary navigation"
          >
            <a href="/#services" onClick={closeMenu}>Services</a>
            <a href="/#work" onClick={closeMenu}>Work</a>
            <a href="/#process" onClick={closeMenu}>Process</a>
            <a href="/#about" onClick={closeMenu}>About</a>
            <a className="nav-cta" href="/#contact" onClick={closeMenu}>
              Start a project <ArrowIcon />
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}
