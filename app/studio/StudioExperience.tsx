"use client";

import { StudioArrow } from "./StudioArrow";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Component, useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { areaLabels, areaOrder, initialStudioState, studioReducer, type Area } from "./studio-state";
import type { StudioProject, StudioService } from "./studio-data";
import styles from "./studio.module.css";

const StudioScene = dynamic(() => import("./scene/StudioScene"), { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function StudioExperience({ projects, services }: { projects: StudioProject[]; services: StudioService[] }) {
  const [state, dispatch] = useReducer(studioReducer, initialStudioState);
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [policy, setPolicy] = useState("");
  const [projectIndex, setProjectIndex] = useState(0);
  const [serviceIndex, setServiceIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const areaButtons = useRef<Partial<Record<Area, HTMLButtonElement | null>>>({});
  const enterButton = useRef<HTMLButtonElement>(null);
  const skipButton = useRef<HTMLButtonElement>(null);
  const panelWasOpen = useRef(false);
  const active = state.mode === "loading" || state.mode === "intro" || state.mode === "explore";
  const onFailure = useCallback(() => dispatch({ type: "fail" }), []);
  const onReady = useCallback(() => { setSceneReady(true); dispatch({ type: "ready" }); }, []);
  const onSelect = useCallback((area: Area) => { setSheetExpanded(true); dispatch({ type: "select", area }); }, []);
  const onManual = useCallback(() => dispatch({ type: "manual" }), []);

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean; effectiveType?: string } }).connection;
    const update = () => {
      const reason = motion.matches ? "Reduced motion is enabled. Explore the still studio and all its content below." : connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "") ? "Your connection prefers a lighter experience. Explore the still studio and all its content below." : "";
      setPolicy(reason);
      if (reason) dispatch({ type: "static" });
    };
    update();
    motion.addEventListener("change", update);
    connection?.addEventListener("change", update);
    return () => { motion.removeEventListener("change", update); connection?.removeEventListener("change", update); };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && !document.hidden), { threshold: 0.05 });
    if (stage.current) observer.observe(stage.current);
    const visibility = () => setVisible(!document.hidden && !!stage.current && stage.current.getBoundingClientRect().bottom > 0 && stage.current.getBoundingClientRect().top < innerHeight);
    document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  useEffect(() => {
    if (!active || sceneReady) return;
    const timeout = setTimeout(onFailure, 20000);
    return () => clearTimeout(timeout);
  }, [active, sceneReady, onFailure]);

  useEffect(() => {
    if (!state.tour || !visible) return;
    const timer = setTimeout(() => dispatch({ type: "advance" }), 6500);
    return () => clearTimeout(timer);
  }, [state.tour, state.area, state.shot, visible]);

  useEffect(() => {
    if (state.panel) {
      stage.current?.scrollIntoView({ block: "start", behavior: "instant" });
      heading.current?.focus({ preventScroll: true });
    }
    else if (panelWasOpen.current) areaButtons.current[state.area]?.focus({ preventScroll: true });
    panelWasOpen.current = state.panel;
  }, [state.panel, state.area]);

  useEffect(() => {
    if (state.mode === "loading") {
      stage.current?.scrollIntoView({ block: "start", behavior: "instant" });
      skipButton.current?.focus({ preventScroll: true });
    }
    else if (state.mode === "explore" && !state.panel && document.activeElement === document.body) areaButtons.current[state.area]?.focus({ preventScroll: true });
  }, [state.mode, state.panel, state.area]);

  const enter = async () => {
    if (state.mode === "failed") {
      try {
        const { resetStudioResources } = await import("./scene/StudioScene");
        resetStudioResources(projects);
      } catch { onFailure(); return; }
    }
    setSceneReady(false);
    dispatch({ type: "enter" });
  };

  const project = projects[projectIndex];
  const service = services[serviceIndex];
  return <section className={styles.experience} aria-label="Interactive virtual studio" onKeyDown={(event) => {
    if (event.key === "Escape") {
      if (state.panel) dispatch({ type: "close" });
      else if (state.mode === "intro" || state.mode === "loading") dispatch({ type: "skip" });
      else if (state.tour) dispatch({ type: "manual" });
    }
  }}>
    <noscript><p className={styles.accessNote}>JavaScript is off. <a href="#studio-content">Explore the projects, services and contact links below.</a></p></noscript>
    <div className={styles.stage} ref={stage} data-mode={state.mode}>
      <Image src="/studio/studio-poster.png" alt="An original cutaway studio with brass architecture, a reception monogram, project gallery and ruby meeting lounge" fill sizes="(max-width: 768px) 100vw, 1440px" className={styles.poster} priority />
      {active && <SceneBoundary onFailure={onFailure}><StudioScene state={state} projects={projects.slice(0, 3)} visible={visible} onReady={onReady} onFailure={onFailure} onSelect={onSelect} onProject={(index) => { setProjectIndex(index); onSelect("gallery"); }} onService={(index) => { setServiceIndex(index); onSelect("services"); }} onManual={onManual} /></SceneBoundary>}
      <div className={styles.stageTop}><span className={styles.edition}>AB / THE VIRTUAL STUDIO</span><Link prefetch={false} href="/" className={styles.smallButton}>Exit Studio <StudioArrow /></Link></div>
      {!active ? <div className={styles.entry}>
        <p className={styles.kicker}>An independent perspective</p><h2>Make yourself<br /><em>at home.</em></h2>
        <p>{state.mode === "failed" ? "3D could not load on this device. The studio’s projects, services and enquiry links are still available." : policy || "Four spaces. One considered approach. Discover our work, our craft and what we could build together."}</p>
        {!policy && <button ref={enterButton} type="button" className={styles.primary} onClick={enter}>{state.mode === "failed" ? "Try 3D again" : "Enter the Studio"} <StudioArrow /></button>}
        <a href="#studio-content" className={styles.textLink}>Explore without 3D ↓</a>
      </div> : null}
      {(state.mode === "loading" || state.mode === "intro") && <div className={styles.loading}>
        <p role="status">{state.mode === "loading" ? "Preparing your studio…" : "Welcome Inside AB Web Studio"}</p>
        {state.mode === "intro" && <button type="button" className={styles.primary} onClick={() => dispatch({ type: "skip" })}>Start Exploring</button>}
        <button ref={skipButton} type="button" className={styles.smallButton} onClick={() => dispatch({ type: "skip" })}>Skip Intro</button>
      </div>}
      {active && <div className={styles.sceneCaption}><span>{String(areaOrder.indexOf(state.area) + 1).padStart(2, "0")} / {areaLabels[state.area]}</span><span>{state.tour ? "Guided tour · 6.5s per space" : "Drag sideways to orbit · Pinch to zoom · Swipe up to scroll"}</span></div>}
      {state.panel && <aside className={styles.panel} data-collapsed={!sheetExpanded} aria-labelledby="studio-panel-heading">
        <div className={styles.panelTop}><p className={styles.kicker}>Inside / {areaLabels[state.area]}</p><button type="button" onClick={() => dispatch({ type: "close" })} aria-label="Close studio panel">Close ×</button></div>
        <button type="button" className={styles.smallButton} aria-expanded={sheetExpanded} aria-controls="studio-panel-content" onClick={() => setSheetExpanded(value => !value)}>{sheetExpanded ? "Collapse details" : "Expand details"}</button>
        <div id="studio-panel-content" hidden={!sheetExpanded}>
        <h2 ref={heading} tabIndex={-1} id="studio-panel-heading">{state.area === "reception" ? "Ideas start here." : state.area === "gallery" ? "Work with purpose." : state.area === "services" ? "Considered. Connected." : "Let’s Build Something Extraordinary."}</h2>
        {state.area === "reception" && <><p>Welcome Inside AB Web Studio We build premium websites, online stores and custom business systems for Australian businesses.</p><p>Choose a space below, take the guided tour or drag to find your own perspective.</p><Link prefetch={false} className={styles.primary} href="/about">Meet the studio <StudioArrow /></Link></>}
        {state.area === "gallery" && <>
          <label className={styles.fieldLabel} htmlFor="studio-project">Select a project</label><select id="studio-project" value={projectIndex} onChange={(event) => setProjectIndex(Number(event.target.value))}>{projects.map((entry, index) => <option value={index} key={entry.slug}>{entry.name}</option>)}</select>
          <Image src={project.image} alt={project.alt} width={560} height={384} sizes="(max-width: 600px) 85vw, 360px" className={styles.projectImage} />
          <p className={styles.kicker}>{project.sector}{project.destination === "hosted-showcase" ? " · Hosted showcase" : ""}</p><h3>{project.name}</h3><p>{project.description}</p><Link prefetch={false} className={styles.primary} href={`/work/${project.slug}`}>Open Project <StudioArrow /></Link><p className={styles.fine}>Opens the case study, with project context and its available destination.</p>
        </>}
        {state.area === "services" && <>
          <label className={styles.fieldLabel} htmlFor="studio-service">Explore a service</label><select id="studio-service" value={serviceIndex} onChange={(event) => setServiceIndex(Number(event.target.value))}>{services.map((entry, index) => <option key={entry.title} value={index}>{entry.title}</option>)}</select>
          <h3>{service.title}</h3><p>{service.description}</p><ul>{service.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul><Link prefetch={false} className={styles.primary} href={service.href}>{serviceIndex === 3 ? "Discuss automation" : "Explore this service"} <StudioArrow /></Link>
        </>}
        {state.area === "consultation" && <><p>Your business. Your next chapter. Share what you’re building, what needs to change and where you want to go.</p><p>Our enquiry form lets you choose services, describe your project and share your preferred budget and timeline.</p><Link prefetch={false} className={styles.primary} href="/contact">Start Your Project <StudioArrow /></Link><Link prefetch={false} href="/work" className={styles.textLink}>See the work first <StudioArrow /></Link></>}
        </div>
      </aside>}
    </div>
    <div className={styles.controls}>
      <nav className={styles.areaNav} aria-label="Studio spaces">{areaOrder.map((area, index) => <button ref={(node) => { areaButtons.current[area] = node; }} key={area} type="button" aria-pressed={state.area === area && (active || state.panel)} aria-controls={state.panel ? "studio-panel-heading" : undefined} onClick={() => onSelect(area)}><span>{String(index + 1).padStart(2, "0")}</span>{areaLabels[area]}</button>)}</nav>
      <div className={styles.secondaryControls}>{active ? <><button type="button" onClick={() => onSelect(areaOrder[(areaOrder.indexOf(state.area) + 3) % 4])}>Previous Room</button><button type="button" onClick={() => onSelect(areaOrder[(areaOrder.indexOf(state.area) + 1) % 4])}>Next Room</button><button type="button" onClick={() => dispatch({ type: "tour" })}>{state.tour ? "Pause tour" : "Guided tour"} <span aria-hidden="true">{state.tour ? "Ⅱ" : "▷"}</span></button><button type="button" onClick={() => dispatch({ type: "reset" })}>Reset view</button><button type="button" onClick={() => { dispatch({ type: "static" }); setTimeout(() => enterButton.current?.focus({ preventScroll: true }), 0); }}>Use still view</button></> : <span>Explore at your own pace</span>}<Link prefetch={false} href="/contact">Get a Quote <StudioArrow /></Link></div>
    </div>
    <p className={styles.accessNote} role="status">{state.mode === "failed" ? "3D unavailable. All content is available using the space buttons or below." : policy || "No sound. No scroll lock. Use the space buttons with a keyboard; Escape closes a panel or pauses the tour."}</p>
  </section>;
}
