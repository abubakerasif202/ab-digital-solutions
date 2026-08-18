const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const header = document.querySelector(".site-header");
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];

function setMenu(open) {
  nav?.classList.toggle("open", open);
  menuButton?.setAttribute("aria-expanded", String(open));
  menuButton?.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  document.body.classList.toggle("menu-open", open);
}

menuButton?.addEventListener("click", () => {
  setMenu(!nav.classList.contains("open"));
});

navLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav?.classList.contains("open")) {
    setMenu(false);
    menuButton?.focus();
  }
});

document.addEventListener("click", (event) => {
  if (!nav?.classList.contains("open")) return;
  if (nav.contains(event.target) || menuButton?.contains(event.target)) return;
  setMenu(false);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 900) setMenu(false);
});

function updateHeader() {
  header?.classList.toggle("scrolled", window.scrollY > 16);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const revealElements = document.querySelectorAll(".reveal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const sections = [...document.querySelectorAll("main section[id]")];

function updateActiveNav() {
  const marker = window.scrollY + Math.max(120, window.innerHeight * 0.28);
  let activeId = "top";

  sections.forEach((section) => {
    if (section.offsetTop <= marker) activeId = section.id;
  });

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

let activeNavFrame = 0;
function scheduleActiveNavUpdate() {
  if (activeNavFrame) return;
  activeNavFrame = window.requestAnimationFrame(() => {
    updateActiveNav();
    activeNavFrame = 0;
  });
}

if ("IntersectionObserver" in window && !reduceMotion) {
  document.documentElement.classList.add("motion-ready");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -25px" }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
}

updateActiveNav();
window.addEventListener("scroll", scheduleActiveNavUpdate, { passive: true });
window.addEventListener("resize", scheduleActiveNavUpdate);

window.addEventListener("pageshow", () => {
  updateHeader();
  updateActiveNav();
  if (window.innerWidth > 900) setMenu(false);
});

const heroSlider = document.querySelector(".hero-slider");
const heroSlides = [...document.querySelectorAll(".hero-slide")];
const heroDots = [...document.querySelectorAll(".slider-dot")];
const heroTilt = document.querySelector("[data-hero-tilt]");
let activeSlide = 0;
let slideTimer;

function restartProgress() {
  const progress = heroSlider?.querySelector(".slider-progress span");
  if (!progress || reduceMotion) return;
  progress.style.animation = "none";
  void progress.offsetWidth;
  progress.style.animation = "";
}

function showSlide(index, userInitiated = false) {
  if (!heroSlides.length) return;
  activeSlide = (index + heroSlides.length) % heroSlides.length;
  heroSlides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === activeSlide;
    slide.classList.toggle("active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
  });
  heroDots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === activeSlide;
    dot.classList.toggle("active", isActive);
    dot.setAttribute("aria-current", String(isActive));
  });
  restartProgress();
  if (userInitiated) startSlider();
}

function startSlider() {
  window.clearInterval(slideTimer);
  if (reduceMotion || heroSlides.length < 2) return;
  slideTimer = window.setInterval(() => showSlide(activeSlide + 1), 6000);
}

heroDots.forEach((dot) => dot.addEventListener("click", () => showSlide(Number(dot.dataset.slideTo), true)));
document.querySelector("[data-slide-prev]")?.addEventListener("click", () => showSlide(activeSlide - 1, true));
document.querySelector("[data-slide-next]")?.addEventListener("click", () => showSlide(activeSlide + 1, true));

heroSlider?.addEventListener("mouseenter", () => {
  window.clearInterval(slideTimer);
  heroSlider.classList.add("paused");
});
heroSlider?.addEventListener("mouseleave", () => {
  heroSlider.classList.remove("paused");
  startSlider();
});
heroSlider?.addEventListener("focusin", () => window.clearInterval(slideTimer));
heroSlider?.addEventListener("focusout", startSlider);
document.addEventListener("visibilitychange", () => document.hidden ? window.clearInterval(slideTimer) : startSlider());

if (heroTilt && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
  heroTilt.addEventListener("pointermove", (event) => {
    const bounds = heroTilt.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    heroTilt.style.setProperty("--tilt-x", `${(-y * 5).toFixed(2)}deg`);
    heroTilt.style.setProperty("--tilt-y", `${(x * 7).toFixed(2)}deg`);
    heroTilt.style.setProperty("--shift-x", `${(x * 5).toFixed(1)}px`);
    heroTilt.style.setProperty("--shift-y", `${(y * 5).toFixed(1)}px`);
  });
  heroTilt.addEventListener("pointerleave", () => {
    heroTilt.style.setProperty("--tilt-x", "0deg");
    heroTilt.style.setProperty("--tilt-y", "0deg");
    heroTilt.style.setProperty("--shift-x", "0px");
    heroTilt.style.setProperty("--shift-y", "0px");
  });
}

showSlide(0);
startSlider();

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

document.getElementById("contact-form")?.addEventListener("submit", (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const name = `${data.get("firstName") || ""} ${data.get("lastName") || ""}`.trim();
  const subject = encodeURIComponent(`Website enquiry from ${name}`);
  const body = encodeURIComponent(
`Name: ${name}
Email: ${data.get("email")}
Phone: ${data.get("phone") || "Not supplied"}
Service: ${data.get("service")}
Approx. budget: ${data.get("budget")}
Ideal timeline: ${data.get("timeline")}

Project details:
${data.get("message")}`
  );

  const status = document.getElementById("form-status");
  if (status) status.textContent = "Opening your email app with the enquiry ready to send…";
  window.location.href = `mailto:abubakerasif202@yahoo.com?subject=${subject}&body=${body}`;
});
