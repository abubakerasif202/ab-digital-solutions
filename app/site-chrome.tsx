"use client";

import { ABBrandImage } from "./components/brand/ABBrandImage";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowIcon } from "./icons";
import { siteConfig } from "./site-config";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileCtaVisible, setMobileCtaVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  // Keep speculative route assets off the homepage's initial rendering path.
  const prefetchNavigation = (pathname !== "/" && pathname !== "/studio") || menuOpen;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const mobileCtaRef = useRef<HTMLAnchorElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const ctaShown = pathname !== "/" && mobileCtaVisible && !menuOpen;

  useEffect(() => {
    let frameId = 0;
    const onScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        setScrolled(window.scrollY > 24);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

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

    const backgroundRegions = [
      document.querySelector(".skip-link"),
      document.querySelector(".brand"),
      document.querySelector(".header-project-cta"),
      document.getElementById("main-content"),
      document.querySelector(".site-footer"),
    ].filter((element): element is HTMLElement => element !== null);

    document.addEventListener("keydown", onKeyDown);
    document.body.classList.toggle("nav-open", menuOpen);
    backgroundRegions.forEach((region) => {
      region.inert = menuOpen;
    });
    // Wait for the panel to become focusable, including visibility transitions.
    let focusFrame: number | null = null;
    const focusFirstLink = () => {
      const firstLink = navRef.current?.querySelector<HTMLElement>("a");
      if (!firstLink) return;
      if (window.getComputedStyle(firstLink).visibility === "visible") {
        firstLink.focus();
        if (document.activeElement === firstLink) return;
      }
      focusFrame = window.requestAnimationFrame(focusFirstLink);
    };
    if (menuOpen) focusFrame = window.requestAnimationFrame(focusFirstLink);
    return () => {
      if (focusFrame !== null) window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("nav-open");
      backgroundRegions.forEach((region) => {
        region.inert = false;
      });
    };
  }, [menuOpen]);

  // Sticky "Start a project" bar (mobile). Entirely IntersectionObserver-driven, no scroll listeners:
  //  - hidden until the hero (or, on routes without one, the top sentinel) has scrolled out of view
  //  - hidden while the enquiry form, the footer or a [data-conversion-area] is on screen
  //  - hidden whenever a link, button, heading or text block sits in the band the bar occupies
  //  - revealed only after the band has been clear for a beat, so it never flickers over content
  useEffect(() => {
    const mobileViewport = window.matchMedia("(max-width: 720px)");
    const eligibleRoute = pathname !== "/" && pathname !== "/privacy";
    const heroTarget = document.querySelector(".ruby-hero, .cinema-hero") ?? topSentinelRef.current;
    // De-duplicated: #contact may also carry data-conversion-area, and readiness compares counts.
    const conversionAreas = Array.from(new Set([
      document.getElementById("contact"),
      document.querySelector(".site-footer"),
      ...Array.from(document.querySelectorAll("[data-conversion-area]")),
    ].filter((element): element is Element => element !== null)));
    // Queried lazily, once tracking starts: it matches several hundred elements on long pages.
    const BAND_SELECTOR = "#main-content :is(a[href], button, input, select, textarea, summary, h1, h2, h3, h4, p, li, dt, dd, label, figcaption)";
    const BAND_CHUNK = 80;

    const SHOW_DELAY_MS = 240;
    const visibleConversionAreas = new Set<Element>();
    const observedConversionAreas = new Set<Element>();
    const bandOccupants = new Set<Element>();
    let heroObserved = false;
    let heroInView = true;
    let showTimer: number | null = null;
    let rendered = false;
    let tracking = false;
    let heroObserver: IntersectionObserver | null = null;
    let conversionObserver: IntersectionObserver | null = null;
    let bandObserver: IntersectionObserver | null = null;
    let resizeTimer: number | null = null;
    let bandReady = false;
    let bandGeneration = 0;
    let chunkHandle: number | null = null;

    const publish = (visible: boolean) => {
      if (visible === rendered) return;
      rendered = visible;
      setMobileCtaVisible(visible);
    };
    const evaluate = () => {
      if (showTimer !== null) {
        window.clearTimeout(showTimer);
        showTimer = null;
      }
      const clear = eligibleRoute
        && mobileViewport.matches
        && heroObserved
        && !heroInView
        && observedConversionAreas.size === conversionAreas.length
        && visibleConversionAreas.size === 0
        && bandReady
        && bandOccupants.size === 0;
      if (!clear) {
        publish(false);
        return;
      }
      if (rendered) return;
      showTimer = window.setTimeout(() => {
        showTimer = null;
        publish(true);
      }, SHOW_DELAY_MS);
    };

    // The band is the strip of viewport the bar covers: its offset from the bottom, its height and a little clearance.
    const buildBandObserver = () => {
      bandObserver?.disconnect();
      bandOccupants.clear();
      bandReady = false;
      const generation = ++bandGeneration;
      const bar = mobileCtaRef.current;
      const offset = bar ? parseFloat(getComputedStyle(bar).bottom) || 12 : 12;
      const band = (bar?.offsetHeight ?? 54) + offset + 12;
      bandObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) bandOccupants.add(entry.target);
          else bandOccupants.delete(entry.target);
        });
        evaluate();
      }, { rootMargin: `${-Math.max(0, window.innerHeight - band)}px 0px 0px 0px`, threshold: 0 });
      // Observe in small chunks so no single task registers every element.
      const targets = Array.from(document.querySelectorAll(BAND_SELECTOR));
      const observer = bandObserver;
      let index = 0;
      const step = () => {
        chunkHandle = null;
        if (generation !== bandGeneration || !tracking) return;
        const end = Math.min(index + BAND_CHUNK, targets.length);
        for (; index < end; index += 1) observer.observe(targets[index]);
        if (index < targets.length) {
          chunkHandle = window.setTimeout(step, 24);
        } else {
          bandReady = true;
          evaluate();
        }
      };
      step();
    };
    const onResize = () => {
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resizeTimer = null;
        if (tracking) buildBandObserver();
      }, 150);
    };

    const stopTracking = () => {
      if (!tracking) return;
      tracking = false;
      heroObserver?.disconnect();
      conversionObserver?.disconnect();
      bandObserver?.disconnect();
      visibleConversionAreas.clear();
      observedConversionAreas.clear();
      bandOccupants.clear();
      bandReady = false;
      bandGeneration += 1;
      if (chunkHandle !== null) window.clearTimeout(chunkHandle);
      chunkHandle = null;
      heroObserved = false;
      heroInView = true;
      window.removeEventListener("resize", onResize);
      if (showTimer !== null) window.clearTimeout(showTimer);
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      showTimer = null;
      resizeTimer = null;
      publish(false);
    };
    const startTracking = () => {
      if (tracking || !mobileViewport.matches || !eligibleRoute || !heroTarget) return;
      tracking = true;
      heroObserver = new IntersectionObserver(([entry]) => {
        if (!entry) return;
        heroObserved = true;
        heroInView = entry.isIntersecting;
        evaluate();
      }, { threshold: 0 });
      heroObserver.observe(heroTarget);
      conversionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          observedConversionAreas.add(entry.target);
          if (entry.isIntersecting) visibleConversionAreas.add(entry.target);
          else visibleConversionAreas.delete(entry.target);
        });
        evaluate();
      }, { threshold: 0 });
      conversionAreas.forEach((element) => conversionObserver?.observe(element));
      buildBandObserver();
      window.addEventListener("resize", onResize, { passive: true });
    };
    // The bar cannot show until the hero has scrolled past, so none of this is needed for first paint:
    // wait for the page to settle, then start when the main thread is idle.
    const START_DELAY_MS = 2500;
    const hasIdle = typeof window.requestIdleCallback === "function";
    let idleHandle: number | null = null;
    let startTimer: number | null = null;
    const cancelIdle = () => {
      if (startTimer !== null) window.clearTimeout(startTimer);
      startTimer = null;
      if (idleHandle === null) return;
      if (hasIdle) window.cancelIdleCallback(idleHandle);
      else window.clearTimeout(idleHandle);
      idleHandle = null;
    };
    const handleViewportChange = () => {
      cancelIdle();
      if (!mobileViewport.matches) return stopTracking();
      const begin = () => {
        idleHandle = null;
        startTracking();
      };
      startTimer = window.setTimeout(() => {
        startTimer = null;
        idleHandle = hasIdle ? window.requestIdleCallback(begin, { timeout: 1500 }) : window.setTimeout(begin, 0);
      }, START_DELAY_MS);
    };

    mobileViewport.addEventListener("change", handleViewportChange);
    handleViewportChange();

    return () => {
      cancelIdle();
      stopTracking();
      mobileViewport.removeEventListener("change", handleViewportChange);
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") return;
    const sections = ["services", "work", "process", "about", "contact"]
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (sections.length === 0) return;

    const visibleSections = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleSections.add(entry.target.id);
          else visibleSections.delete(entry.target.id);
        });
        setActiveSection(sections.find((section) => visibleSections.has(section.id))?.id ?? null);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => {
      observer.disconnect();
      setActiveSection(null);
    };
  }, [pathname]);

  useEffect(() => {
    // The nav is only a modal panel up to the 960px breakpoint (see globals.css);
    // if the viewport grows past it while open, the scroll lock and inert state
    // must not linger on the desktop layout.
    const mobileNavViewport = window.matchMedia("(max-width: 960px)");
    const closeWhenDesktop = (event: MediaQueryListEvent) => {
      if (!event.matches) setMenuOpen(false);
    };
    mobileNavViewport.addEventListener("change", closeWhenDesktop);
    return () => mobileNavViewport.removeEventListener("change", closeWhenDesktop);
  }, []);

  const handleNavLinkClick = () => {
    if (!menuOpen) return;
    setMenuOpen(false);
    // Focus sat inside the panel that is now hidden; return it to the toggle
    // (same as Escape) instead of dropping it to <body>.
    menuButtonRef.current?.focus();
  };
  // Real pages mark their own nav item as the current page; on the homepage
  // the scroll-spy marks the in-page section being read instead.
  const routeSection = pathname.startsWith("/work") ? "work"
    : pathname.startsWith("/services") ? "services"
    : pathname.startsWith("/studio") ? "studio"
    : pathname.startsWith("/about") ? "about"
    : pathname.startsWith("/contact") ? "contact"
    : null;
  const navLinkClass = (id: string) => (activeSection === id || routeSection === id ? "is-active" : undefined);
  const navLinkCurrent = (id: string) => (routeSection === id ? "page" : activeSection === id ? "location" : undefined);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className={`site-header${scrolled ? " is-scrolled" : ""}`} id="top">
        <div className={`container nav-wrap${pathname === "/" ? " nav-wrap--home" : ""}`}>
          <Link prefetch={prefetchNavigation} className="brand" href="/" aria-label="AB Web Studio home">
            <ABBrandImage decorative eager />
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
            <Link href="/work" prefetch={prefetchNavigation} onClick={handleNavLinkClick} className={navLinkClass("work")} aria-current={navLinkCurrent("work")}>Work</Link>
            {/* Never prefetched: the studio route ships the 3D experience, which other pages should not pay for. */}
            <Link href="/studio" prefetch={false} onClick={handleNavLinkClick} className={navLinkClass("studio")} aria-current={navLinkCurrent("studio")}>Studio</Link>
            <Link href="/services" prefetch={prefetchNavigation} onClick={handleNavLinkClick} className={navLinkClass("services")} aria-current={navLinkCurrent("services")}>Services</Link>
            <Link href="/#process" prefetch={prefetchNavigation} onClick={handleNavLinkClick} className={navLinkClass("process")} aria-current={navLinkCurrent("process")}>Process</Link>
            <Link href="/about" prefetch={prefetchNavigation} onClick={handleNavLinkClick} className={navLinkClass("about")} aria-current={navLinkCurrent("about")}>About</Link>
            <Link href="/contact" prefetch={prefetchNavigation} onClick={handleNavLinkClick} className={navLinkClass("contact")} aria-current={navLinkCurrent("contact")}>Contact</Link>
            <a className="nav-phone" href={`tel:${siteConfig.phoneInternational}`} onClick={handleNavLinkClick}>{siteConfig.phoneDisplay}</a>
          </nav>
          {pathname === "/" && <a className="header-project-cta" href="#contact">Start a project</a>}
        </div>
      </header>
      {/* Marks the top of the page on routes without a hero, so the bar still waits for the first screen to pass. */}
      <div ref={topSentinelRef} className="cta-sentinel" aria-hidden="true" />
      <Link
        ref={mobileCtaRef}
        prefetch={prefetchNavigation}
        className={`mobile-project-cta${ctaShown ? " is-visible" : ""}`}
        href={pathname === "/" ? "#contact" : "/contact"}
        inert={!ctaShown}
        aria-hidden={ctaShown ? undefined : true}
        tabIndex={ctaShown ? undefined : -1}
      >
        Start a project <ArrowIcon />
      </Link>
    </>
  );
}
