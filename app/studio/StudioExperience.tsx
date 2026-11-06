"use client";

import { StudioArrow } from "./StudioArrow";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Component, useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState, useSyncExternalStore, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { areaLabels, areaOrder, initialStudioState, studioReducer, type Area } from "./studio-state";
import { ARRIVAL_SECONDS } from "./world/sim/arrival";
import { featuredServiceIndexes, type StudioProject, type StudioService } from "./studio-data";
import { ConsultationPanel, GalleryPanel, ReceptionPanel, ServicesPanel } from "./StudioPanels";
import { StudioAudio, type Cue } from "./audio/studio-audio";
import { LocalBubble, LocalsPanel, SoundControls, type Caption } from "./StudioWildlife";
import { animals, cooldownReady, createLinePicker, REACTION_COOLDOWN_MS, type AnimalId } from "./world/sim/wildlife";
import { onAnimalPicked, requestReaction } from "./world/wildlife-bus";
import styles from "./studio.module.css";

const KANGAROO_BEATS = ["wave", "tilt", "hop"] as const;
/** The 3D view counts as on screen while at least this many pixels of it are visible. */
const MIN_STAGE_VISIBLE = 120;

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
  const roomNav = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const areaButtons = useRef<Partial<Record<Area, HTMLButtonElement | null>>>({});
  const enterButton = useRef<HTMLButtonElement>(null);
  const skipButton = useRef<HTMLButtonElement>(null);
  const optionsButton = useRef<HTMLButtonElement>(null);
  const panelWasOpen = useRef(false);
  const localsButton = useRef<HTMLButtonElement>(null);
  const [audio] = useState(() => new StudioAudio());
  const sound = useSyncExternalStore(audio.subscribe, audio.getSnapshot, audio.getSnapshot);
  const [hintOn, setHintOn] = useState(true);
  const tabbing = useRef(false);
  const [localsOpen, setLocalsOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalId>("kangaroo");
  const [bubblesOn, setBubblesOn] = useState(true);
  const [caption, setCaption] = useState<Caption | null>(null);
  const [pickers] = useState(() => ({ kangaroo: createLinePicker(animals.kangaroo.lines, 11), koala: createLinePicker(animals.koala.lines, 23), cockatoo: createLinePicker(animals.cockatoo.lines, 37) }));
  const lastReaction = useRef<Record<AnimalId, number>>({ kangaroo: 0, koala: 0, cockatoo: 0 });
  const kangarooBeat = useRef(0);
  const welcomed = useRef(false);
  const active = state.mode === "loading" || state.mode === "arrival" || state.mode === "intro" || state.mode === "explore";
  const pendingIntro = state.mode === "loading" || state.mode === "arrival" || state.mode === "intro";
  const onFailure = useCallback(() => dispatch({ type: "fail" }), []);
  const onReady = useCallback(() => { setSceneReady(true); dispatch({ type: "ready" }); }, []);
  const onSelect = useCallback((area: Area) => { setHintOn(false); dispatch({ type: "select", area }); }, []);
  const onRoomKey = (event: ReactKeyboardEvent<HTMLElement>) => {
    const key = event.key;
    const horizontal = key === "ArrowLeft" || key === "ArrowRight";
    const vertical = key === "ArrowUp" || key === "ArrowDown";
    if (!horizontal && !vertical) return;
    if (vertical && window.innerWidth > 900) return;
    event.preventDefault();
    const index = areaOrder.indexOf(state.area);
    const next = horizontal
      ? (index + (key === "ArrowRight" ? 1 : areaOrder.length - 1)) % areaOrder.length
      : Math.min(areaOrder.length - 1, Math.max(0, index + (key === "ArrowDown" ? 2 : -2)));
    if (next === index) return;
    tabbing.current = true;
    onSelect(areaOrder[next]);
  };
  const onManual = useCallback(() => { setHintOn(false); dispatch({ type: "manual" }); }, []);
  const onArrive = useCallback(() => dispatch({ type: "arrive" }), []);
  // Room changes bring the 3D view back only when it has actually left the screen, and never so far that the room tabs leave.
  // Camera controls (entrance, reset, tour) also lift the view up under the fixed header when the page title is still above it.
  const showStage = useCallback((align = false) => {
    const node = stage.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const margin = parseFloat(getComputedStyle(node).scrollMarginTop) || 0;
    if (!align) {
      if (rect.bottom > margin + MIN_STAGE_VISIBLE && rect.top < innerHeight - MIN_STAGE_VISIBLE) return;
      let top = scrollY + rect.top - margin;
      const bar = roomNav.current?.getBoundingClientRect();
      if (bar) top = Math.min(top, scrollY + bar.bottom - innerHeight);
      scrollTo({ top: Math.max(0, top), behavior: "instant" });
      return;
    }
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 0;
    const target = Math.max(margin, header);
    if (Math.abs(rect.top - target) <= 8) return;
    let top = scrollY + rect.top - target;
    const bar = roomNav.current?.getBoundingClientRect();
    if (bar) {
      const minScroll = scrollY + bar.bottom - innerHeight;
      const maxScroll = scrollY + Math.max(0, bar.top);
      top = Math.min(Math.max(top, minScroll), maxScroll);
    }
    scrollTo({ top: Math.max(0, top), behavior: "instant" });
  }, []);
  const onView = (type: "tour" | "tourStop" | "entrance" | "reset") => { showStage(true); if (type === "tour") audio.play("select"); dispatch({ type }); };
  const dismissCaption = useCallback(() => setCaption(null), []);

  // One path for every way of greeting an animal: its button, the 3D model, and the room it lives in.
  const interact = useCallback((id: AnimalId) => {
    const now = performance.now();
    if (!cooldownReady(lastReaction.current[id], now, REACTION_COOLDOWN_MS)) return;
    lastReaction.current[id] = now;
    let kind: string | undefined;
    let cue: Cue = id === "kangaroo" ? "hop" : id;
    if (id === "kangaroo") { kind = KANGAROO_BEATS[kangarooBeat.current++ % KANGAROO_BEATS.length]; cue = kind === "hop" ? "hop" : "select"; }
    requestReaction(id, kind);
    audio.play(cue);
    setSelectedAnimal(id);
    setCaption({ id, text: pickers[id](), key: now });
  }, [audio, pickers]);
  const pickAnimal = (id: AnimalId) => {
    setSelectedAnimal(id);
    audio.play("select");
    if (active) { showStage(); dispatch({ type: "animal", id }); }
  };
  const toggleSound = async () => {
    if (sound.enabled) { audio.setEnabled(false); return; }
    audio.setEnabled(true);
    await audio.resume();
    audio.play("select");
  };

  // Opening or closing room details resizes the 3D view on small screens. Keep the room tabs where the visitor's eyes are.
  const navTop = useRef<number | null>(null);
  useEffect(() => {
    const track = () => { navTop.current = roomNav.current?.getBoundingClientRect().top ?? null; };
    track();
    addEventListener("scroll", track, { passive: true });
    addEventListener("resize", track);
    return () => { removeEventListener("scroll", track); removeEventListener("resize", track); };
  }, []);
  useLayoutEffect(() => {
    const node = roomNav.current;
    if (!node || navTop.current === null) return;
    const delta = node.getBoundingClientRect().top - navTop.current;
    if (Math.abs(delta) > 1) scrollBy({ top: delta, behavior: "instant" });
    navTop.current = node.getBoundingClientRect().top;
  }, [state.panel]);

  useEffect(() => { audio.attach(); return () => audio.dispose(); }, [audio]);
  useEffect(() => onAnimalPicked(interact), [interact]);
  // Soft welcome chime once the studio opens; a returning 3D view does not repeat it.
  useEffect(() => {
    if (state.mode === "loading") { welcomed.current = state.resume; return; }
    if ((state.mode === "intro" || state.mode === "explore") && !welcomed.current) { welcomed.current = true; audio.play("welcome"); }
  }, [state.mode, state.resume, audio]);
  const frameKey = `${state.area}|${state.outside}|${state.animal}`;
  const lastFrame = useRef(frameKey);
  useEffect(() => {
    if (lastFrame.current === frameKey) return;
    lastFrame.current = frameKey;
    if (state.mode === "explore") audio.play("transition");
  }, [frameKey, state.mode, audio]);

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
      else if (localsOpen) { setLocalsOpen(false); localsButton.current?.focus({ preventScroll: true }); }
      else if (state.panel) dispatch({ type: "close" });
      else if (pendingIntro) dispatch({ type: "skip" });
      else if (state.tour) dispatch({ type: "tour" });
      else return;
      event.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [optionsOpen, localsOpen, state.panel, state.tour, pendingIntro]);

  useEffect(() => {
    if (state.panel) {
      showStage();
      if (tabbing.current) {
        tabbing.current = false;
        areaButtons.current[state.area]?.focus({ preventScroll: true });
      } else heading.current?.focus({ preventScroll: true });
    }
    else if (panelWasOpen.current) areaButtons.current[state.area]?.focus({ preventScroll: true });
    panelWasOpen.current = state.panel;
  }, [state.panel, state.area, showStage]);

  // The arrival film is wall-clock time. A stalled WebGL frame must not keep the visitor on "Arriving".
  useEffect(() => {
    if (state.mode !== "arrival") return;
    const timer = setTimeout(() => dispatch({ type: "arrive" }), ARRIVAL_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [state.mode]);

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
    : active ? "No scroll lock. Escape closes room details or pauses the tour. Sound can be switched off above."
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
          {state.mode === "intro" && <><button type="button" className={styles.primary} onClick={() => dispatch({ type: "skip" })}>Start exploring</button><button type="button" className={`${styles.smallButton} ${styles.tourCue}`} onClick={() => dispatch({ type: "tour" })}>Take guided tour</button></>}
          <button ref={skipButton} type="button" className={styles.smallButton} onClick={() => dispatch({ type: "skip" })}>Skip intro</button>
        </div>}
      </div>}
      {active && <div className={styles.sceneCaption}><span>{state.outside ? "Sydney / Studio entrance" : state.mode === "arrival" ? "Sydney / Arrival" : `${String(roomNumber).padStart(2, "0")} / ${areaLabels[state.area]}`}</span>{hintOn && <span className={styles.hint}>{hint}</span>}</div>}
      {active && bubblesOn && <LocalBubble caption={caption} onDismiss={dismissCaption} />}
      {!active && (state.panel || state.still) && <div className={styles.sceneCaption}><span>{String(roomNumber).padStart(2, "0")} / {areaLabels[state.area]}</span><span>Still view</span></div>}
    </div>
    <div className={styles.controls}>
      <nav ref={roomNav} className={styles.areaNav} aria-label="Studio rooms" onKeyDown={onRoomKey}>{areaOrder.map((area, index) => {
        const pressed = !state.outside && state.area === area && (active || state.panel);
        return <button ref={(node) => { areaButtons.current[area] = node; }} key={area} type="button" aria-pressed={pressed} aria-current={pressed ? "true" : undefined} onClick={() => onSelect(area)}><span>{String(index + 1).padStart(2, "0")}</span>{areaLabels[area]}</button>;
      })}</nav>
      <p className={styles.live} aria-live="polite">{state.mode === "explore" && !state.outside ? `Now in ${areaLabels[state.area]}.` : ""}</p>
      <div className={styles.extras}>
        <button ref={localsButton} type="button" className={styles.localsToggle} aria-expanded={localsOpen} aria-controls="studio-locals" onClick={() => setLocalsOpen((open) => !open)}>Meet the locals <span aria-hidden="true">{localsOpen ? "−" : "+"}</span></button>
        <SoundControls sound={sound} onToggle={toggleSound} onVolume={(volume) => { audio.setVolume(volume); audio.play("select"); }} />
      </div>
      <LocalsPanel open={localsOpen} selected={selectedAnimal} caption={caption} bubbles={bubblesOn} active={active} onPick={pickAnimal} onInteract={interact} onBubbles={setBubblesOn} />
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
