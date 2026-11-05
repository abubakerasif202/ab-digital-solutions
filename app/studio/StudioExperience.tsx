"use client";

import { StudioArrow } from "./StudioArrow";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Component, useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { areaLabels, areaOrder, initialStudioState, studioReducer, type Area } from "./studio-state";
import { featuredServiceIndexes, type StudioProject, type StudioService } from "./studio-data";
import { ConsultationPanel, GalleryPanel, ReceptionPanel, ServicesPanel } from "./StudioPanels";
import styles from "./studio.module.css";

const StudioScene = dynamic(() => import("./scene/StudioScene"), { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

const panelHeadings: Record<Area, string> = {
  reception: "Ideas start here.",
  gallery: "Work with purpose.",
  services: "What we can build for you.",
  consultation: "Tell us what you’re building.",
};

export function StudioExperience({ projects, services }: { projects: StudioProject[]; services: StudioService[] }) {
  const [state, dispatch] = useReducer(studioReducer, initialStudioState);
  const [policy, setPolicy] = useState("");
  const [projectIndex, setProjectIndex] = useState(0);
  const [serviceIndex, setServiceIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [touch, setTouch] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const areaButtons = useRef<Partial<Record<Area, HTMLButtonElement | null>>>({});
  const enterButton = useRef<HTMLButtonElement>(null);
  const skipButton = useRef<HTMLButtonElement>(null);
  const optionsButton = useRef<HTMLButtonElement>(null);
  const panelWasOpen = useRef(false);
  const active = state.mode === "loading" || state.mode === "arrival" || state.mode === "intro" || state.mode === "explore";
  const pendingIntro = state.mode === "loading" || state.mode === "arrival" || state.mode === "intro";
  const onFailure = useCallback(() => dispatch({ type: "fail" }), []);
  const onReady = useCallback(() => { setSceneReady(true); dispatch({ type: "ready" }); }, []);
  const onSelect = useCallback((area: Area) => dispatch({ type: "select", area }), []);
  const onManual = useCallback(() => dispatch({ type: "manual" }), []);
  const onArrive = useCallback(() => dispatch({ type: "arrive" }), []);
  const showStage = () => stage.current?.scrollIntoView({ block: "start", behavior: "instant" });
  const onView = (type: "tour" | "tourStop" | "entrance" | "reset") => { showStage(); dispatch({ type }); };

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = matchMedia("(pointer: coarse)");
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean; effectiveType?: string } }).connection;
    const update = () => {
      const reason = motion.matches ? "Reduced motion is enabled, so the still studio is shown. Every room and project is available below." : connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "") ? "Your connection prefers a lighter experience, so the still studio is shown. Every room and project is available below." : "";
      setPolicy(reason);
      setTouch(coarse.matches);
      if (reason) dispatch({ type: "static" });
    };
    update();
    motion.addEventListener("change", update);
    coarse.addEventListener("change", update);
    connection?.addEventListener("change", update);
    return () => { motion.removeEventListener("change", update); coarse.removeEventListener("change", update); connection?.removeEventListener("change", update); };
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

  // Escape works wherever focus is, in order: view options, room details, an unfinished introduction, a running tour.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || document.body.classList.contains("nav-open")) return;
      if (optionsOpen) { setOptionsOpen(false); optionsButton.current?.focus({ preventScroll: true }); }
      else if (state.panel) dispatch({ type: "close" });
      else if (pendingIntro) dispatch({ type: "skip" });
      else if (state.tour) dispatch({ type: "tour" });
      else return;
      event.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [optionsOpen, state.panel, state.tour, pendingIntro]);

  useEffect(() => {
    if (state.panel) {
      showStage();
      heading.current?.focus({ preventScroll: true });
    }
    else if (panelWasOpen.current) areaButtons.current[state.area]?.focus({ preventScroll: true });
    panelWasOpen.current = state.panel;
  }, [state.panel, state.area]);

  useEffect(() => {
    if (state.mode === "loading" && !state.resume) {
      showStage();
      skipButton.current?.focus({ preventScroll: true });
    }
    else if (state.mode === "explore" && document.activeElement === document.body) (state.panel ? heading.current : areaButtons.current[state.area])?.focus({ preventScroll: true });
  // Only a change of mode should move focus here; room changes are handled above.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.mode]);

  const enter = async (keep = false) => {
    if (state.mode === "failed") {
      try {
        const { resetStudioResources } = await import("./scene/StudioScene");
        resetStudioResources(projects);
      } catch { onFailure(); return; }
    }
    setSceneReady(false);
    setOptionsOpen(false);
    dispatch({ type: "enter", keep });
  };
  const showStill = () => { setOptionsOpen(false); dispatch({ type: "static" }); };
  const showThreeD = () => enter(state.still);
  const selectProject = (index: number) => setProjectIndex(index);

  const roomNumber = areaOrder.indexOf(state.area) + 1;
  const hint = state.tour
    ? `Guided tour · room ${roomNumber} of ${areaOrder.length} · about 6.5 seconds each`
    : touch ? "Drag sideways to look around · Pinch to zoom · Swipe up or down to scroll the page" : "Drag to look around · Use the room buttons to move · The page scrolls as normal";
  const modeNote = state.mode === "failed" ? "3D is unavailable on this device. Every room, project and service is still available with the room buttons."
    : policy ? policy
    : active ? "No sound and no scroll lock. Escape closes room details or pauses the tour."
    : "Still view: choose a room to see its details. Switch to 3D view whenever you like.";

  return <section className={styles.experience} aria-label="Interactive virtual studio" data-conversion-area data-panel={state.panel} data-view={active ? "3d" : "still"}>
    <noscript><p className={styles.accessNote}>JavaScript is off. <a href="#studio-content">Explore the projects, services and contact links below.</a></p></noscript>
    <div className={styles.stage} ref={stage} data-mode={state.mode}>
      <Image src="/studio/studio-poster.png" alt="An original cutaway studio with brass architecture, a reception monogram, project gallery and ruby meeting lounge" fill sizes="(max-width: 768px) 100vw, 1440px" className={styles.poster} priority />
      {active && <SceneBoundary onFailure={onFailure}><StudioScene state={state} projects={projects} selectedProject={projectIndex} visible={visible} onReady={onReady} onFailure={onFailure} onSelect={onSelect} onProject={(index) => { selectProject(index); onSelect("gallery"); }} onService={(index) => { setServiceIndex(featuredServiceIndexes[index] ?? 0); onSelect("services"); }} onManual={onManual} onArrive={onArrive} /></SceneBoundary>}
      <div className={styles.stageTop}><span className={styles.edition}>AB / THE VIRTUAL STUDIO</span><Link prefetch={false} href="/" className={styles.smallButton}>Back to website <StudioArrow /></Link></div>
      {!active && (!state.panel || state.mode === "failed") ? <div className={styles.entry}>
        <p className={styles.kicker}>{state.still ? "Still view" : "An independent perspective"}</p><h2>{state.still ? <>Choose a<br /><em>room.</em></> : <>Make yourself<br /><em>at home.</em></>}</h2>
        <p>{state.mode === "failed" ? "3D could not load on this device. The studio’s projects, services and enquiry links are still available." : policy || (state.still ? "Pick a room below to see its details, or switch to the 3D view." : "Four spaces. One considered approach. Discover our work, our craft and what we could build together.")}</p>
        {!policy && <button ref={enterButton} type="button" className={styles.primary} onClick={() => enter(state.still)}>{state.mode === "failed" ? "Try 3D again" : state.still ? "Switch to 3D view" : "Enter the Studio"} <StudioArrow /></button>}
        {!state.still && <a href="#studio-content" className={styles.textLink}>Explore without 3D ↓</a>}
      </div> : null}
      {pendingIntro && <div className={styles.loading} data-stage={state.mode}>
        <p role="status">{state.mode === "loading" ? (state.resume ? "Returning to the 3D view…" : "Preparing your studio…") : state.mode === "arrival" ? "Arriving in Sydney…" : "Welcome inside AB Web Studio"}</p>
        {state.mode === "intro" && <p className={styles.welcome}>“Welcome to AB Web Studio. Feel free to explore.”</p>}
        {!(state.mode === "loading" && state.resume) && <div className={styles.loadingActions}>
          {state.mode === "intro" && <><button type="button" className={styles.primary} onClick={() => dispatch({ type: "skip" })}>Start exploring</button><button type="button" className={styles.smallButton} onClick={() => dispatch({ type: "tour" })}>Take guided tour</button></>}
          <button ref={skipButton} type="button" className={styles.smallButton} onClick={() => dispatch({ type: "skip" })}>Skip intro</button>
        </div>}
      </div>}
      {active && <div className={styles.sceneCaption}><span>{state.outside ? "Sydney / Studio entrance" : state.mode === "arrival" ? "Sydney / Arrival" : `${String(roomNumber).padStart(2, "0")} / ${areaLabels[state.area]}`}</span><span>{hint}</span></div>}
      {!active && (state.panel || state.still) && <div className={styles.sceneCaption}><span>{String(roomNumber).padStart(2, "0")} / {areaLabels[state.area]}</span><span>Still view</span></div>}
    </div>
    <div className={styles.controls}>
      <nav className={styles.areaNav} aria-label="Studio rooms">{areaOrder.map((area, index) => <button ref={(node) => { areaButtons.current[area] = node; }} key={area} type="button" aria-pressed={!state.outside && state.area === area && (active || state.panel)} onClick={() => onSelect(area)}><span>{String(index + 1).padStart(2, "0")}</span>{areaLabels[area]}</button>)}</nav>
      <div className={styles.secondaryControls}>
        {active && (state.tourActive
          ? <div className={styles.tour} role="group" aria-label="Guided tour">
            <span className={styles.tourStatus} role="status">Tour · {areaLabels[state.area]} · {roomNumber} of {areaOrder.length}{state.tour ? "" : " · paused"}</span>
            <button type="button" onClick={() => onView("tour")}>{state.tour ? "Pause tour" : "Resume tour"}</button>
            <button type="button" onClick={() => onView("tourStop")}>Stop tour</button>
          </div>
          : <button type="button" onClick={() => onView("tour")}>Guided tour <span aria-hidden="true">▷</span></button>)}
        <button type="button" onClick={() => onSelect(areaOrder[(areaOrder.indexOf(state.area) + 3) % 4])}>Previous room</button>
        <button type="button" onClick={() => onSelect(areaOrder[(areaOrder.indexOf(state.area) + 1) % 4])}>Next room</button>
        <button ref={optionsButton} type="button" className={styles.optionsToggle} aria-expanded={optionsOpen} aria-controls="studio-view-options" onClick={() => setOptionsOpen((open) => !open)}>View options <span aria-hidden="true">{optionsOpen ? "−" : "+"}</span></button>
        <Link prefetch={false} href="/contact" className={styles.quote}>Start a project <StudioArrow /></Link>
      </div>
      <div id="studio-view-options" className={styles.options} role="group" aria-label="View options" hidden={!optionsOpen}>
        <div className={styles.modeSwitch} role="group" aria-label="Display mode">
          <button type="button" aria-pressed={active} disabled={!!policy} onClick={showThreeD}>3D view</button>
          <button type="button" aria-pressed={!active} onClick={showStill}>Still view</button>
        </div>
        {active && <>
          <button type="button" onClick={() => onView("reset")}>Reset view<small>Re-frames the current room</small></button>
          <button type="button" onClick={() => onView("entrance")}>Back to entrance<small>Shows the street outside the studio</small></button>
        </>}
        <p>{active ? hint : policy || "Still view shows each room as an image with all of its details."}</p>
      </div>
      <p className={styles.accessNote} role={state.mode === "failed" ? "status" : undefined}>{modeNote}</p>
    </div>
    {state.panel && <aside className={styles.panel} aria-labelledby="studio-panel-heading">
      <div className={styles.panelTop}><p className={styles.kicker}>Inside / {areaLabels[state.area]}</p><button type="button" onClick={() => dispatch({ type: "close" })} aria-label="Close room details">Close <span aria-hidden="true">×</span></button></div>
      <h2 ref={heading} tabIndex={-1} id="studio-panel-heading">{panelHeadings[state.area]}</h2>
      {state.area === "reception" && <ReceptionPanel />}
      {state.area === "gallery" && <GalleryPanel projects={projects} index={projectIndex} onIndex={selectProject} />}
      {state.area === "services" && <ServicesPanel services={services} index={serviceIndex} onIndex={setServiceIndex} />}
      {state.area === "consultation" && <ConsultationPanel />}
    </aside>}
  </section>;
}
