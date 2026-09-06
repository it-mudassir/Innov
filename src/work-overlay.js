import gsap from "gsap";

const $ = (s, c = document) => c.querySelector(s);

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------
   Case study data — index order MUST match the panels in #workTrack.
   Copy + images are placeholders: swap in real content per project.
------------------------------------------------------------------- */
const PROJECTS = [
  {
    seed: "innov-fintech",
    title: "Nexora",
    tag: "Fintech SaaS",
    year: "2025",
    client: "Nexora Technologies",
    sector: "Finance",
    timeline: "12 weeks",
    services: [
      "Product strategy",
      "UI/UX design",
      "Design system",
      "Web app development",
    ],
    overview:
      "Nexora gives finance teams real-time visibility over treasury, cashflow and FX exposure. We joined at the seed stage and shipped the entire product surface — from empty states to enterprise dashboards.",
    challenge:
      "The founding team had a powerful data engine but a prototype UI that crashed past ten widgets. CFOs were exporting to spreadsheets within minutes — the exact behaviour the product was meant to kill.",
    approach:
      "We rebuilt the interface around a modular widget system with a strict design language, moved heavy rendering to canvas-based charts and paired every release with usability tests against real finance workflows.",
    results: [
      { n: "4.2×", l: "Faster dashboard loads" },
      { n: "12", l: "Weeks to public launch" },
      { n: "+31%", l: "Trial-to-paid conversion" },
    ],
  },
  {
    seed: "innov-pulse",
    title: "Pulse",
    tag: "Health app",
    year: "2024",
    client: "Pulse Health Ltd.",
    sector: "Health & fitness",
    timeline: "16 weeks",
    services: [
      "App development",
      "UI/UX design",
      "Brand refresh",
      "Store launch",
    ],
    overview:
      "Pulse turns scattered health data into one calm daily picture — sleep, training, recovery and habits in a single timeline. One codebase, native feel on both platforms.",
    challenge:
      "Health data is fragmented across HealthKit, Google Fit and wearables that disagree with each other. Users churn the moment an app feels like more admin than insight.",
    approach:
      "We designed an offline-first sync layer that reconciles conflicting sources, then built the UI around a single glanceable timeline with proactive, quiet notifications instead of streak-pressure.",
    results: [
      { n: "250k+", l: "Downloads in year one" },
      { n: "4.8★", l: "Average store rating" },
      { n: "38%", l: "Day-30 retention" },
    ],
  },
  {
    seed: "innov-atlas",
    title: "Atlas & Co",
    tag: "Brand identity",
    year: "2024",
    client: "Atlas & Co",
    sector: "Professional services",
    timeline: "6 weeks",
    services: [
      "Brand strategy",
      "Identity design",
      "Guidelines",
      "Print & social kits",
    ],
    overview:
      "A 40-year-old consultancy with a reputation far stronger than its brand. We rebuilt the identity without sanding off the heritage — a new mark, type system and voice that still feels like the same firm, grown up.",
    challenge:
      "Decades of inconsistent usage had left the brand unrecognisable across offices. Leadership wanted a confident, modern identity without alienating long-standing clients.",
    approach:
      "Interviews with partners and clients defined what was sacred and what was stale. We iterated three territories down to one system, then rolled it out across every touchpoint in a single coordinated release.",
    results: [
      { n: "3", l: "Weeks to full rollout" },
      { n: "+52%", l: "Aided brand recall" },
      { n: "120+", l: "Assets in the toolkit" },
    ],
  },
  {
    seed: "innov-loop",
    title: "Loopmart",
    tag: "E-commerce",
    year: "2023",
    client: "Loopmart GmbH",
    sector: "Retail",
    timeline: "14 weeks",
    services: [
      "Headless commerce",
      "Frontend development",
      "CRO",
      "Localization",
    ],
    overview:
      "Loopmart sells design objects to people who notice the details — so the store had to be as considered as the products. A headless storefront tuned for speed, with checkout friction engineered out.",
    challenge:
      "Their legacy theme took 4.9s to become interactive and leaked mobile sales at every step. Expanding into new markets meant weeks of duplicate work per country.",
    approach:
      "We moved to a headless stack with edge rendering, rebuilt the PDP around a single scroll narrative and compressed checkout to two screens — then localized the whole flow from one content model.",
    results: [
      { n: "+64%", l: "Mobile conversion" },
      { n: "0.8s", l: "Largest contentful paint" },
      { n: "18", l: "Markets live at launch" },
    ],
  },
  {
    seed: "innov-orbit",
    title: "Orbitly",
    tag: "Developer tool",
    year: "2023",
    client: "Orbitly Inc.",
    sector: "DevTools",
    timeline: "10 weeks",
    services: [
      "Product design",
      "Dashboard development",
      "Docs site",
      "Design system",
    ],
    overview:
      "Orbitly shows API teams exactly how their integrations behave in production. We designed and built the dashboard, the docs and the design system that keeps both honest.",
    challenge:
      "Developer tools live or die on time-to-first-value. Orbitly's beta required a full onboarding call before anyone saw a single insight — a growth ceiling in plain sight.",
    approach:
      "We restructured onboarding so the product proves itself with sample data before asking for credentials, and rebuilt docs as interactive, copy-paste-first pages generated from the same components as the dashboard.",
    results: [
      { n: "3×", l: "Faster activation" },
      { n: "11k", l: "GitHub stars in 6 months" },
      { n: "-41%", l: "Support tickets per user" },
    ],
  },
];

export function initWorkOverlay({ lenis = null, scrollToTarget = null } = {}) {
  const panels = [...document.querySelectorAll("#workTrack .wpanel")].filter(
    (p) =>
      !p.classList.contains("wpanel--intro") &&
      !p.classList.contains("wpanel--outro"),
  );
  if (!panels.length) return;

  /* ---------- Build the overlay once ---------- */
  const root = document.createElement("div");
  root.className = "wov";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "wovTitle");
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <button class="wov-close" aria-label="Close case study">
      <svg aria-hidden="true"><use href="#plus" /></svg>
    </button>
    <div class="wov-scroll" data-lenis-prevent>
      <article class="wov-inner">
        <span class="wov-idx mono"></span>
        <h2 class="wov-title" id="wovTitle"></h2>
        <p class="wov-tag mono"></p>
        <figure class="wov-hero"><img alt="" /></figure>
        <div class="wov-meta"></div>
        <div class="wov-secs"></div>
        <div class="wov-results"></div>
        <div class="wov-chips"></div>
        <div class="wov-gallery"></div>
        <div class="wov-foot">
          <button class="btn btn--acc wov-cta">
            <span class="roll"
              ><span>Start a project like this</span
              ><span aria-hidden="true">Start a project like this</span></span
            >
          </button>
          <button class="wov-next">
            <span class="wov-next-t"></span>
            <svg aria-hidden="true"><use href="#arr" /></svg>
          </button>
        </div>
      </article>
    </div>`;
  document.body.appendChild(root);

  const scroll = $(".wov-scroll", root);
  const closeBtn = $(".wov-close", root);
  const nextBtn = $(".wov-next", root);
  const nextLabel = $(".wov-next-t", root);
  const ctaBtn = $(".wov-cta", root);

  let current = -1;
  let isOpen = false;
  let animating = false;
  let lastFocus = null;

  /* ---------- Populate overlay from a project ---------- */
  function fill(p, i) {
    const pad = (n) => String(n).padStart(2, "0");
    $(".wov-idx", root).textContent = `${pad(i + 1)} / ${pad(PROJECTS.length)}`;
    $(".wov-title", root).textContent = p.title;
    $(".wov-tag", root).textContent = `${p.tag} — ${p.year}`;

    const hero = $(".wov-hero img", root);
    hero.src = `https://picsum.photos/seed/${p.seed}/1800/1000.jpg`;
    hero.alt = `${p.title} — case study hero`;

    $(".wov-meta", root).innerHTML = [
      ["Client", p.client],
      ["Sector", p.sector],
      ["Year", p.year],
      ["Timeline", p.timeline],
    ]
      .map(
        ([k, v]) =>
          `<div class="wov-meta-i"><span class="mono">${k}</span><strong>${v}</strong></div>`,
      )
      .join("");

    $(".wov-secs", root).innerHTML = [
      ["Overview", p.overview],
      ["The challenge", p.challenge],
      ["The approach", p.approach],
    ]
      .map(
        ([h, t]) =>
          `<section class="wov-sec"><h3 class="mono">${h}</h3><p>${t}</p></section>`,
      )
      .join("");

    $(".wov-results", root).innerHTML = p.results
      .map(
        (r) =>
          `<div class="wstat"><span class="wstat-n">${r.n}</span><span class="wstat-l mono">${r.l}</span></div>`,
      )
      .join("");

    $(".wov-chips", root).innerHTML = p.services
      .map((s) => `<span>${s}</span>`)
      .join("");

    $(".wov-gallery", root).innerHTML = [1, 2]
      .map(
        (k) =>
          `<figure><img src="https://picsum.photos/seed/${p.seed}-g${k}/1200/800.jpg" alt="${p.title} — detail ${k}" loading="lazy" decoding="async" /></figure>`,
      )
      .join("");

    const nextP = PROJECTS[(i + 1) % PROJECTS.length];
    nextLabel.textContent = `Next — ${nextP.title}`;
  }

  /* ---------- Open / close / next ---------- */
  function open(i) {
    const p = PROJECTS[i];
    if (!p || isOpen || animating) return;
    current = i;
    lastFocus = document.activeElement;
    fill(p, i);
    isOpen = true;
    root.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("wov-open");
    lenis && lenis.stop();
    scroll.scrollTop = 0;
    closeBtn.focus({ preventScroll: true });

    if (reduced) {
      root.style.display = "block";
      return;
    }
    animating = true;
    gsap
      .timeline({ onComplete: () => (animating = false) })
      .set(root, { display: "block" })
      .fromTo(
        root,
        { yPercent: 100 },
        { yPercent: 0, duration: 0.85, ease: "power4.inOut" },
      )
      .fromTo(
        ".wov-idx, .wov-title, .wov-tag, .wov-hero, .wov-meta > *, .wov-sec, .wov-results .wstat, .wov-chips, .wov-gallery figure, .wov-foot",
        { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.05, ease: "power3.out" },
        "-=0.25",
      )
      .fromTo(
        ".wov-hero img",
        { scale: 1.25 },
        { scale: 1, duration: 1.2, ease: "power3.out" },
        "<",
      );
  }

  function close() {
    if (!isOpen || animating) return;
    isOpen = false;
    root.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("wov-open");
    lenis && lenis.start();
    lastFocus && lastFocus.focus({ preventScroll: true });

    if (reduced) {
      root.style.display = "none";
      return;
    }
    animating = true;
    gsap.to(root, {
      yPercent: 100,
      duration: 0.65,
      ease: "power4.inOut",
      onComplete: () => {
        root.style.display = "none";
        animating = false;
      },
    });
  }

  function next() {
    const n = (current + 1) % PROJECTS.length;
    if (reduced) {
      fill(PROJECTS[n], n);
      scroll.scrollTop = 0;
      current = n;
      return;
    }
    gsap.to(".wov-inner", {
      opacity: 0,
      y: 24,
      duration: 0.28,
      ease: "power2.in",
      onComplete: () => {
        fill(PROJECTS[n], n);
        scroll.scrollTop = 0;
        current = n;
        gsap.fromTo(
          ".wov-inner",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
        );
      },
    });
  }

  /* ---------- Wire up the work panels ---------- */
  panels.forEach((panel, i) => {
    const p = PROJECTS[i];
    if (!p) return;
    panel.classList.add("wpanel--case");
    panel.dataset.cursor = "VIEW";
    panel.setAttribute("tabindex", "0");
    panel.setAttribute("role", "button");
    panel.setAttribute("aria-haspopup", "dialog");
    panel.setAttribute("aria-label", `Open case study: ${p.title}`);

    const fig = $(".wimg", panel);
    if (fig)
      fig.insertAdjacentHTML(
        "beforeend",
        `<span class="wview mono">View case</span>`,
      );

    panel.addEventListener("click", () => open(i));
    panel.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(i);
      }
    });
  });

  closeBtn.addEventListener("click", close);
  nextBtn.addEventListener("click", next);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) close();
  });

  /* Button (not an <a href="#...">) so it can't collide with the global
     anchor-scroll handler — we close first, then scroll to #contact. */
  ctaBtn.addEventListener("click", () => {
    close();
    setTimeout(
      () => scrollToTarget && scrollToTarget("#contact"),
      reduced ? 0 : 450,
    );
  });
}
