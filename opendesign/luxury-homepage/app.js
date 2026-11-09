// AB Web Studio — luxury homepage (standalone design-review build).
// Content comes from data.json, which scripts/export-homepage-data.mjs derives
// from the canonical registry (app/project-data.ts, site-config.ts, contact-options.ts).
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const INITIAL_PROJECTS = 6;

const response = await fetch("data.json").catch(() => null);
const data = response && response.ok ? await response.json().catch(() => null) : null;

setupNav();
setupReveal();
setupMonogram();
setupScrollEffects();
setupServiceCards();

if (data) {
  setupContact(data);
  setupProjects(data);
  setupForm(data);
} else {
  const status = $("#resultStatus");
  status.textContent = "";
  const empty = $("#projectsEmpty");
  empty.textContent = "Projects could not be loaded. Please try again shortly.";
  empty.hidden = false;
}

/* ---------- Contact details and profiles (from site-config) ---------- */
function setupContact({ site }) {
  const email = $("#contactEmail");
  email.href = `mailto:${site.email}`;
  email.textContent = site.email;
  const phone = $("#contactPhone");
  phone.href = `tel:${site.phoneInternational}`;
  phone.textContent = site.phoneDisplay;
  $("#contactLocation").textContent = site.location;
  $("#footerNote").textContent = `${site.name} · ${site.location}`;
  $("#allServices").href = `${site.url}/services`;
  $("#privacyLink").href = `${site.url}/privacy`;
  const labels = { linkedin: "LinkedIn", github: "GitHub", facebook: "Facebook", instagram: "Instagram" };
  const list = $("#social");
  for (const [key, href] of Object.entries(site.social)) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = labels[key] ?? key;
    const hint = document.createElement("span");
    hint.className = "sr-only";
    hint.textContent = " (opens in a new tab)";
    a.append(hint);
    li.append(a);
    list.append(li);
  }
}

/* ---------- Projects ---------- */
function setupProjects({ projects, sectors }) {
  const list = $("#projects");
  const emptyEl = $("#projectsEmpty");
  const filters = $("#filters");
  const showAll = $("#showAll");
  const status = $("#resultStatus");
  const dlg = $("#dlg");
  let activeFilter = "all";
  let expanded = false;
  let lastTrigger = null;
  let current = null;

  $("#projectCount").textContent = String(projects.length);

  const makeChip = (value, label, count) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.dataset.filter = value;
    chip.setAttribute("aria-pressed", String(value === "all"));
    chip.classList.toggle("is-on", value === "all");
    chip.append(document.createTextNode(label));
    const n = document.createElement("span");
    n.className = "n";
    n.textContent = String(count);
    chip.append(n);
    return chip;
  };
  filters.append(makeChip("all", "All", projects.length));
  for (const sector of sectors) filters.append(makeChip(sector, sector, projects.filter((p) => p.sector === sector).length));

  function render() {
    const matches = projects.filter((p) => activeFilter === "all" || p.sector === activeFilter);
    const limit = activeFilter === "all" && !expanded ? INITIAL_PROJECTS : matches.length;
    const shown = matches.slice(0, limit);
    list.textContent = "";
    shown.forEach((p, index) => {
      const li = document.createElement("li");
      li.className = "project";
      const button = document.createElement("button");
      button.className = "project-btn";
      button.type = "button";
      button.dataset.id = p.slug;
      const thumb = document.createElement("div");
      thumb.className = "thumb";
      const img = document.createElement("img");
      img.src = p.image.src;
      img.alt = "";
      img.width = p.image.width;
      img.height = p.image.height;
      img.decoding = "async";
      img.loading = index < 2 ? "eager" : "lazy";
      thumb.append(img);
      const meta = document.createElement("div");
      meta.className = "project-meta";
      const cat = document.createElement("span");
      cat.className = "mono";
      cat.textContent = p.sector;
      const name = document.createElement("span");
      name.className = "project-name";
      name.textContent = p.name;
      const sum = document.createElement("span");
      sum.className = "project-sum";
      sum.textContent = p.description.length > 120 ? `${p.description.slice(0, p.description.lastIndexOf(" ", 117))}…` : p.description;
      const st = document.createElement("span");
      st.className = "project-status mono";
      st.textContent = p.statusLabel;
      meta.append(cat, name, sum, st);
      button.append(thumb, meta);
      li.append(button);
      list.append(li);
    });
    emptyEl.hidden = matches.length > 0;
    const canToggle = activeFilter === "all" && matches.length > INITIAL_PROJECTS;
    showAll.hidden = !canToggle;
    showAll.setAttribute("aria-expanded", String(expanded));
    showAll.textContent = expanded ? "Show fewer projects" : `Show all ${matches.length} projects`;
    status.textContent = activeFilter === "all"
      ? `Showing ${shown.length} of ${matches.length} projects.`
      : `Showing ${shown.length} ${shown.length === 1 ? "project" : "projects"} in ${activeFilter}.`;
  }
  render();

  filters.addEventListener("click", (event) => {
    const chip = event.target.closest(".chip");
    if (!chip) return;
    activeFilter = chip.dataset.filter;
    $$(".chip", filters).forEach((x) => {
      const on = x === chip;
      x.classList.toggle("is-on", on);
      x.setAttribute("aria-pressed", String(on));
    });
    render();
  });
  showAll.addEventListener("click", () => {
    expanded = !expanded;
    render();
    if (!expanded) $("#work").scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth" });
  });

  /* Dialog (delegated: items are re-rendered) */
  list.addEventListener("click", (event) => {
    const button = event.target.closest(".project-btn");
    if (!button) return;
    current = projects.find((p) => p.slug === button.dataset.id);
    if (!current) return;
    lastTrigger = button;
    $("#dlgCat").textContent = `${current.sector} · ${current.statusLabel}`;
    $("#dlgTitle").textContent = current.name;
    const img = $("#dlgImg");
    img.src = current.image.src;
    img.alt = current.image.alt;
    img.width = current.image.width;
    img.height = current.image.height;
    img.hidden = false;
    $("#dlgText").textContent = current.solution;
    const ul = $("#dlgList");
    ul.textContent = "";
    for (const feature of current.keyFeatures) {
      const li = document.createElement("li");
      li.textContent = feature;
      ul.append(li);
    }
    $("#dlgStack").textContent = current.techStack.join(" · ");
    $("#dlgCase").href = current.caseStudyUrl;
    const link = $("#dlgLink");
    link.hidden = !current.url;
    if (current.url) {
      link.href = current.url;
      link.textContent = current.visitLabel;
      const hint = document.createElement("span");
      hint.className = "sr-only";
      hint.textContent = " (opens in a new tab)";
      link.append(hint);
    }
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
    $("#dlgClose").focus();
  });
  const closeDlg = () => (dlg.close ? dlg.close() : dlg.removeAttribute("open"));
  $("#dlgClose").addEventListener("click", closeDlg);
  dlg.addEventListener("click", (event) => { if (event.target === dlg) closeDlg(); });
  dlg.addEventListener("close", () => {
    const target = lastTrigger && document.body.contains(lastTrigger) ? lastTrigger : $(".project-btn") || $(".nav-cta");
    if (target) target.focus();
  });
  $("#dlgEnquire").addEventListener("click", () => {
    closeDlg();
    lastTrigger = null;
    $("#message").value = `I would like something similar to "${current.name}".`;
    goEnquire(null);
  });
}

/* ---------- Service cards ---------- */
function setupServiceCards() {
  $$(".card-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".card");
      const body = document.getElementById(button.getAttribute("aria-controls"));
      const open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
      card.classList.toggle("is-open", !open);
      body.hidden = open;
      if (!open) {
        body.classList.remove("enter");
        void body.offsetWidth;
        body.classList.add("enter");
      }
    });
  });
  $$("[data-discuss]").forEach((button) => button.addEventListener("click", () => goEnquire(button.dataset.discuss)));
}

function goEnquire(service) {
  if (service) {
    const select = $("#service");
    if ([...select.options].some((option) => option.value === service)) select.value = service;
  }
  $("#enquire").scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth" });
  setTimeout(() => $("#fullName").focus({ preventScroll: true }), reduce.matches ? 0 : 500);
}

/* ---------- Nav ---------- */
function setupNav() {
  const menuBtn = $("#menuBtn");
  const navLinks = $("#navLinks");
  const setOpen = (open) => {
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    navLinks.classList.toggle("is-open", open);
  };
  menuBtn.addEventListener("click", () => setOpen(menuBtn.getAttribute("aria-expanded") !== "true"));
  $$("a", navLinks).forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navLinks.classList.contains("is-open")) {
      setOpen(false);
      menuBtn.focus();
    }
  });

  const spyLinks = $$("[data-spy]");
  const spyMap = new Map(spyLinks.map((a) => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      spyLinks.forEach((a) => { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
      const link = spyMap.get(entry.target.id);
      link.classList.add("is-active");
      link.setAttribute("aria-current", "true");
    }
  }, { rootMargin: "-45% 0px -50% 0px" });
  spyMap.forEach((_, id) => spy.observe(document.getElementById(id)));
}

/* ---------- Reveal ---------- */
function setupReveal() {
  const items = $$(".reveal");
  if (!("IntersectionObserver" in window) || reduce.matches) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) { entry.target.classList.add("in"); observer.unobserve(entry.target); }
    }
  }, { threshold: 0.12 });
  items.forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 60}ms`; observer.observe(el); });
}

/* ---------- 3D monogram (CSS 3D layered extrusion) ---------- */
function setupMonogram() {
  const mono = $("#monogram");
  const stage = $("#stage");
  const DEPTH = 22;
  const STEP = 2;
  for (let z = -DEPTH; z < 0; z += STEP) {
    const layer = document.createElement("div");
    layer.className = `m-layer ${z < -DEPTH + 6 ? "edge" : "depth"}`;
    layer.textContent = "AB";
    layer.style.transform = `translateZ(${z}px)`;
    mono.append(layer);
  }
  const face = document.createElement("div");
  face.className = "m-layer face";
  face.textContent = "AB";
  mono.append(face);

  let tx = 24, ty = -8, cx = 24, cy = -8, visible = true, raf = 0, idle = 0;
  window.addEventListener("pointermove", (event) => {
    if (reduce.matches) return;
    const r = stage.getBoundingClientRect();
    const nx = (event.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const ny = (event.clientY - (r.top + r.height / 2)) / (r.height / 2);
    tx = Math.max(-1, Math.min(1, nx)) * 38;
    ty = -Math.max(-1, Math.min(1, ny)) * 18;
    idle = 0;
  }, { passive: true });
  function frame(t) {
    raf = 0;
    if (!visible || document.hidden || reduce.matches) return;
    idle += 1;
    if (idle > 180) { tx = 24 + Math.sin(t / 2400) * 26; ty = -8 + Math.cos(t / 3100) * 6; }
    const scrollTurn = Math.min(window.scrollY, 800) * 0.09;
    cx += ((tx + scrollTurn) - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    mono.style.setProperty("--ry", `${cx.toFixed(2)}deg`);
    mono.style.setProperty("--rx", `${cy.toFixed(2)}deg`);
    raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && visible && !document.hidden && !reduce.matches) raf = requestAnimationFrame(frame); };
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; kick(); }, { threshold: 0 }).observe(stage);
  document.addEventListener("visibilitychange", kick);
  reduce.addEventListener("change", () => {
    if (reduce.matches) { mono.style.removeProperty("--ry"); mono.style.removeProperty("--rx"); }
    kick();
  });
  kick();
}

/* ---------- Skyline parallax, solid nav and process progress ---------- */
function setupScrollEffects() {
  const nav = $("#nav");
  const layers = $$(".sky-layer");
  const harbour = $("#harbour");
  const steps = $$("#steps .step");
  const bar = $("#progressBar");
  const processSection = $("#process");
  let ticking = false;
  function onScroll() {
    nav.classList.toggle("is-solid", window.scrollY > 24);
    const vh = window.innerHeight;
    if (!reduce.matches) {
      const r = harbour.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const p = (vh - r.top) / (vh + r.height) - 0.5;
        layers.forEach((l) => { l.style.transform = `translate3d(${(p * -120 * parseFloat(l.dataset.depth)).toFixed(1)}px,0,0)`; });
      }
    }
    const pr = processSection.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (vh * 0.7 - pr.top) / (pr.height * 0.8)));
    bar.style.width = `${(progress * 100).toFixed(1)}%`;
    const idx = Math.min(steps.length - 1, Math.floor(progress * steps.length));
    steps.forEach((s, i) => s.classList.toggle("is-on", i <= idx));
    ticking = false;
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
}

/* ---------- Enquiry form: posts to the same /api/contact contract as the live site ---------- */
function setupForm({ site, services }) {
  const form = $("#form");
  const submitBtn = $("#submitBtn");
  const summary = $("#errSummary");
  const success = $("#success");
  const formError = $("#formError");
  const select = $("#service");
  let submissionId = crypto.randomUUID();

  const placeholder = new Option("Choose a service", "", true, true);
  placeholder.disabled = true;
  select.append(placeholder, ...services.map((s) => new Option(s, s)));

  const rules = {
    fullName: (v) => (v.trim().length >= 2 ? "" : "Enter your name so we know who to reply to."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Enter an email address like name@company.com.au so we can reply."),
    service: (v) => (v ? "" : "Choose the service you are enquiring about."),
    message: (v) => (v.trim().length >= 10 ? "" : "Add a sentence or two (at least 10 characters) about what you need."),
  };
  function check(id) {
    const el = document.getElementById(id);
    const err = document.getElementById(`${id}-err`);
    const message = rules[id](el.value);
    err.textContent = message;
    err.hidden = !message;
    el.setAttribute("aria-invalid", message ? "true" : "false");
    return message;
  }
  Object.keys(rules).forEach((id) => document.getElementById(id).addEventListener("blur", () => check(id)));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    success.hidden = true;
    formError.hidden = true;
    const errors = Object.keys(rules).map((id) => ({ id, message: check(id) })).filter((e) => e.message);
    summary.textContent = "";
    if (errors.length) {
      const p = document.createElement("p");
      p.textContent = `Please fix ${errors.length} ${errors.length > 1 ? "fields" : "field"}:`;
      summary.append(p);
      for (const { id, message } of errors) {
        const a = document.createElement("a");
        a.href = `#${id}`;
        a.textContent = message;
        a.addEventListener("click", (e) => { e.preventDefault(); document.getElementById(id).focus(); });
        summary.append(a);
      }
      summary.hidden = false;
      summary.focus();
      return;
    }
    summary.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    form.setAttribute("aria-busy", "true");
    const payload = {
      fullName: $("#fullName").value.trim(),
      email: $("#email").value.trim(),
      phone: $("#phone").value.trim(),
      services: [select.value],
      message: $("#message").value.trim(),
      company: $("#company").value,
      submissionId,
    };
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.ok !== true) throw new Error(typeof body.error === "string" ? body.error : `Enquiry could not be sent. Please email ${site.email}.`);
      const name = payload.fullName.split(/\s+/)[0];
      form.reset();
      submissionId = crypto.randomUUID();
      Object.keys(rules).forEach((id) => { document.getElementById(id).setAttribute("aria-invalid", "false"); document.getElementById(`${id}-err`).hidden = true; });
      success.textContent = `Thanks, ${name}. Your enquiry has been sent.`;
      success.hidden = false;
    } catch (error) {
      // Never report a send that did not happen.
      formError.textContent = error instanceof TypeError ? `We could not reach the server. Please email ${site.email}.` : error.message;
      formError.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send enquiry";
      form.removeAttribute("aria-busy");
    }
  });
}
