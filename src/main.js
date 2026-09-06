import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { initWorkOverlay } from "./work-overlay.js";

gsap.registerPlugin(ScrollTrigger);

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePtr = matchMedia("(pointer: fine)").matches;
const ANIM = !reduced;

// Graceful fallback when motion is reduced
if (!ANIM) document.documentElement.classList.add("no-anim");

/* ---------- Smooth scroll (Lenis) ---------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.11 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop(); // locked until the loader finishes
}
const scrollToTarget = (t) => {
  if (lenis) lenis.scrollTo(t, { duration: 1.3 });
  else if (typeof t === "string") {
    const el = $(t);
    el && el.scrollIntoView({ behavior: "smooth" });
  } else window.scrollTo({ top: 0, behavior: "smooth" });
};

/* ---------- Theme (dark / light) ---------- */
const metaTheme = $("#metaTheme");
let repaintDots = null; // assigned by the hero canvas below
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  try {
    localStorage.setItem("innov-theme", t);
  } catch (e) {}
  if (metaTheme)
    metaTheme.setAttribute("content", t === "dark" ? "#131310" : "#F1EFE8");
  repaintDots && repaintDots();
  const tb = $("#themeBtn");
  if (tb)
    tb.setAttribute(
      "aria-label",
      t === "dark" ? "Switch to light mode" : "Switch to dark mode",
    );
}
const themeBtn = $("#themeBtn");
if (themeBtn) {
  // sync the initial label with whatever the bootstrap script picked
  applyTheme(document.documentElement.getAttribute("data-theme") || "light");
  themeBtn.addEventListener("click", () => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    // 600ms window in which every color cross-fades
    root.classList.add("theme-anim");
    clearTimeout(themeBtn._t);
    themeBtn._t = setTimeout(() => root.classList.remove("theme-anim"), 600);
    applyTheme(next);
  });
}
// Follow OS changes only while the user hasn't made an explicit choice
try {
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    let saved = null;
    try {
      saved = localStorage.getItem("innov-theme");
    } catch (_) {}
    if (!saved) applyTheme(e.matches ? "dark" : "light");
  });
} catch (e) {}

/* ---------- Initial hidden states (page is behind the loader) ---------- */
if (ANIM) {
  gsap.set(".hero .hline-in", { yPercent: 115 });
  gsap.set(".st-in", { yPercent: 115 });
}

/* ---------- Loader + hero intro ---------- */
function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  tl.to(".hero .hline-in", {
    yPercent: 0,
    duration: 1.15,
    stagger: 0.1,
  })
    .from(
      ".nav > *",
      { y: -18, opacity: 0, stagger: 0.07, duration: 0.8 },
      "-=.9",
    )
    .from(
      ".hero-meta span",
      { y: 12, opacity: 0, stagger: 0.08, duration: 0.6 },
      "-=.85",
    )
    .from(
      [".hero-p", ".hero-btns", ".scroll-hint"],
      { y: 26, opacity: 0, stagger: 0.1, duration: 0.9 },
      "-=.75",
    )
    .from("#dots", { opacity: 0, duration: 1.4, ease: "power2.out" }, "-=1");
  return tl;
}
if (ANIM) {
  const count = $("#ldCount"),
    bar = $("#ldBar"),
    loader = $("#loader");
  const cnt = { v: 0 };
  const tl = gsap.timeline();
  tl.to(cnt, {
    v: 100,
    duration: 1.5,
    ease: "power2.inOut",
    onUpdate: () => (count.textContent = Math.round(cnt.v)),
  })
    .to(bar, { scaleX: 1, duration: 1.5, ease: "power2.inOut" }, 0)
    .to(loader, {
      yPercent: -100,
      duration: 0.85,
      ease: "power4.inOut",
      delay: 0.15,
    })
    .add(() => {
      document.body.classList.remove("is-loading");
      lenis && lenis.start();
    }, "-=.75")
    .add(heroIntro(), "-=.6")
    .set(loader, { display: "none" })
    .add(() => ScrollTrigger.refresh());
} else {
  document.body.classList.remove("is-loading");
  lenis && lenis.start();
}

/* ---------- Hero rolling word ---------- */
(function cycle() {
  if (!ANIM) return;
  const cyc = $(".cycle"),
    track = $(".cycle-track"),
    meas = $(".cycle-m");
  if (!cyc) return;
  const words = $$(".cycle-w", track)
    .slice(0, 5)
    .map((w) => w.textContent);
  let i = 0,
    slot = 0;
  const measure = (w) => {
    meas.textContent = w;
    return meas.offsetWidth;
  };
  const setWidth = (w, instant) => {
    const wd = measure(w);
    instant
      ? gsap.set(cyc, { width: wd })
      : gsap.to(cyc, {
          width: wd,
          duration: 0.7,
          ease: "power4.inOut",
        });
  };
  function next() {
    i++;
    gsap.to(track, {
      y: -i * slot,
      duration: 0.95,
      ease: "power4.inOut",
    });
    setWidth(words[i % words.length]);
    if (i === words.length) {
      gsap.delayedCall(1.05, () => {
        gsap.set(track, { y: 0 });
        i = 0;
      });
    }
  }
  function start() {
    setSlot();
    setWidth(words[0], true);
    gsap.delayedCall(1.6, function loop() {
      next();
      gsap.delayedCall(2.6, loop);
    });
  }
  function setSlot() {
    slot = cyc.offsetHeight;
  }
  const kick = () => start();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(kick);
  else setTimeout(kick, 800);
  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      setSlot();
      gsap.set(track, { y: -i * slot });
      setWidth(words[i % words.length], true);
    }, 200);
  });
})();

/* ---------- Hero dot-field canvas ---------- */
(function dots() {
  const cv = $("#dots"),
    hero = $(".hero");
  if (!cv || !hero) return;
  const ctx = cv.getContext("2d");
  let W = 0,
    H = 0,
    pts = [],
    run = false,
    raf = 0,
    t = 0;
  const M = { x: -1e4, y: -1e4 };
  function build() {
    const r = hero.getBoundingClientRect();
    W = r.width;
    H = r.height;
    const d = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * d;
    cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    pts = [];
    const gap = W < 720 ? 30 : 27;
    for (let y = gap * 0.6; y < H; y += gap)
      for (let x = gap * 0.6; x < W; x += gap) pts.push({ x, y });
  }
  hero.addEventListener("mousemove", (e) => {
    const r = cv.getBoundingClientRect();
    M.x = e.clientX - r.left;
    M.y = e.clientY - r.top;
  });
  hero.addEventListener("mouseleave", () => {
    M.x = -1e4;
    M.y = -1e4;
  });
  function paint() {
    t += 0.016;
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    const idleCol = dark ? "rgba(236,233,223,.15)" : "rgba(20,20,18,.16)";
    ctx.clearRect(0, 0, W, H);
    const R = 160;
    for (let k = 0; k < pts.length; k++) {
      const p = pts[k];
      const dx = p.x - M.x,
        dy = p.y - M.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = d < R ? 1 - d / R : 0;
      const wob = Math.sin(t * 1.6 + p.x * 0.011 + p.y * 0.013);
      const x = p.x + (dx / d) * f * 26;
      const y = p.y + (dy / d) * f * 26 + wob * (1.1 + f * 1.6);
      const rad = 1.1 + f * 2.4 + Math.max(0, wob) * 0.5;
      ctx.fillStyle =
        f > 0.02 ? "rgba(255,106,0," + (0.3 + f * 0.7) + ")" : idleCol;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, 6.2832);
      ctx.fill();
    }
  }
  function frame() {
    if (!run) return;
    paint();
    raf = requestAnimationFrame(frame);
  }
  build();
  // Let the theme toggle force an instant repaint in reduced-motion mode
  repaintDots = () => {
    if (!run) paint();
  };
  if (reduced) {
    paint();
  } else {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((en) => {
        en.forEach((e) => {
          if (e.isIntersecting && !run) {
            run = true;
            frame();
          } else if (!e.isIntersecting && run) {
            run = false;
            cancelAnimationFrame(raf);
          }
        });
      }).observe(hero);
    } else {
      run = true;
      frame();
    }
  }
  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      build();
      if (reduced) paint();
    }, 200);
  });
})();

/* ---------- Custom cursor ---------- */
(function cursor() {
  if (!finePtr) return;
  document.documentElement.classList.add("has-cursor");
  const dot = $(".cursor-dot"),
    ring = $(".cursor-ring"),
    label = $(".c-label");
  let x = innerWidth / 2,
    y = innerHeight / 2,
    dx = x,
    dy = y,
    rx = x,
    ry = y,
    seen = false;
  window.addEventListener("mousemove", (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!seen) {
      seen = true;
      gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
    }
  });
  gsap.ticker.add(() => {
    dx += (x - dx) * 0.4;
    dy += (y - dy) * 0.4;
    rx += (x - rx) * 0.16;
    ry += (y - ry) * 0.16;
    dot.style.transform =
      "translate(" + dx + "px," + dy + "px) translate(-50%,-50%)";
    ring.style.transform =
      "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
  });
  document.addEventListener("mouseover", (e) => {
    const lbl = e.target.closest("[data-cursor]");
    const hov = e.target.closest("a,button");
    if (lbl) {
      label.textContent = lbl.dataset.cursor;
      ring.classList.add("is-label");
      ring.classList.remove("is-hover");
    } else if (hov) {
      ring.classList.add("is-hover");
      ring.classList.remove("is-label");
    } else ring.classList.remove("is-hover", "is-label");
  });
})();

/* ---------- Marquee: duplicate the group for a seamless loop ---------- */
$$(".mq-inner").forEach((m) => {
  const g = m.querySelector(".mq-group");
  const c = g.cloneNode(true);
  c.setAttribute("aria-hidden", "true");
  m.appendChild(c);
});

/* ---------- Work case study overlay ---------- */
initWorkOverlay({ lenis, scrollToTarget });

/* ---------- Menu ---------- */
const menuBtn = $("#menuBtn"),
  menu = $("#menu");
let menuOpen = false;
function openMenu() {
  menuOpen = true;
  document.body.classList.add("menu-open");
  menuBtn.setAttribute("aria-expanded", "true");
  menu.setAttribute("aria-hidden", "false");
  lenis && lenis.stop();
  updateNavTheme();
}
function closeMenu() {
  menuOpen = false;
  document.body.classList.remove("menu-open");
  menuBtn.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-hidden", "true");
  lenis && lenis.start();
  updateNavTheme();
}
menuBtn.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menuOpen) closeMenu();
});

/* ---------- Anchor scrolling ---------- */
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2 || !$(id)) return;
    e.preventDefault();
    if (menuOpen) {
      closeMenu();
      setTimeout(() => scrollToTarget(id), 480);
    } else scrollToTarget(id);
  });
});

/* ---------- Nav: hide on scroll down + ink/paper theme ---------- */
const nav = $("#nav");
const themeEls = $$(".dark, .marquee--ink, .marquee--acc").map((el) => ({
  el,
  onAcc: el.classList.contains("marquee--acc"),
}));
let navMode = "";
function updateNavTheme() {
  const probe = Math.min(nav.offsetHeight * 0.5, 40);
  let mode = "paper";
  for (const t of themeEls) {
    const r = t.el.getBoundingClientRect();
    if (r.top <= probe && r.bottom >= probe) {
      mode = t.onAcc ? "acc" : "dark";
      break;
    }
  }
  if (menuOpen) mode = "dark";
  if (mode !== navMode) {
    navMode = mode;
    nav.classList.toggle("nav--ondark", mode === "dark");
    nav.classList.toggle("nav--onacc", mode === "acc");
  }
}
let lastY = 0;
const onScroll = (y) => {
  nav.classList.toggle("hide", !menuOpen && y > lastY + 2 && y > 340);
  lastY = y;
  updateNavTheme();
};
if (lenis && lenis.on) lenis.on("scroll", (e) => onScroll(e.scroll));
else
  window.addEventListener("scroll", () => onScroll(window.scrollY), {
    passive: true,
  });
window.addEventListener("resize", updateNavTheme);

/* ---------- Generic reveals ---------- */
if (ANIM) {
  $$(".st-in").forEach((el) => {
    gsap.to(el, {
      yPercent: 0,
      duration: 1.1,
      ease: "power4.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });
  $$("[data-reveal]").forEach((el) => {
    gsap.from(el, {
      y: 36,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });
}

/* ---------- Services accordion ---------- */
$$(".srow").forEach((row) => {
  const head = $(".srow-head", row);
  head.addEventListener("click", () => {
    const isOpen = row.classList.contains("open");
    $$(".srow.open").forEach((r) => {
      if (r !== row) {
        r.classList.remove("open");
        $(".srow-head", r).setAttribute("aria-expanded", "false");
      }
    });
    row.classList.toggle("open", !isOpen);
    head.setAttribute("aria-expanded", String(!isOpen));
    setTimeout(() => ScrollTrigger.refresh(), 650);
  });
});

/* ---------- Floating preview image over service rows ---------- */
(function preview() {
  if (!finePtr || reduced || innerWidth < 1000) return;
  const pv = $("#svc-preview"),
    img = $("img", pv),
    tag = $(".pv-tag", pv);
  const rowsEl = $(".srows");
  gsap.set(pv, { scale: 0.85 });
  let px = 0,
    py = 0,
    tx = 0,
    ty = 0,
    rot = 0,
    trot = 0,
    lastX = 0,
    vis = false;
  window.addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
    trot = gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.55);
    lastX = e.clientX;
  });
  gsap.ticker.add(() => {
    px += (tx - px) * 0.12;
    py += (ty - py) * 0.12;
    rot += (trot - rot) * 0.08;
    trot *= 0.9;
    pv.style.transform =
      "translate3d(" +
      (px + 28) +
      "px," +
      (py - pv.offsetHeight / 2) +
      "px,0) rotate(" +
      rot +
      "deg) scale(" +
      gsap.getProperty(pv, "scale") +
      ")";
  });
  $$(".srow").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      img.src = row.dataset.img;
      tag.textContent = row.dataset.tag;
      if (!vis) {
        vis = true;
        gsap.to(pv, {
          opacity: 1,
          scale: 1,
          duration: 0.45,
          ease: "power3.out",
        });
      }
    });
  });
  rowsEl.addEventListener("mouseleave", () => {
    vis = false;
    gsap.to(pv, {
      opacity: 0,
      scale: 0.85,
      duration: 0.35,
      ease: "power3.out",
    });
  });
  window.addEventListener("load", () =>
    $$(".srow").forEach((r) => {
      const i = new Image();
      i.src = r.dataset.img;
    }),
  );
})();

/* ---------- Pinned horizontal work gallery (desktop) ---------- */
if (!reduced) {
  const mm = gsap.matchMedia();
  mm.add("(min-width: 901px)", () => {
    const track = $("#workTrack");
    if (!track) return;
    const imgs = $$(".wimg img");
    const dist = () => track.scrollWidth - window.innerWidth;
    gsap.to(track, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: "#work",
        start: "top top",
        end: () => "+=" + dist(),
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          gsap.set("#workBar", { scaleX: self.progress });
          imgs.forEach((im) => {
            const r = im.parentElement.getBoundingClientRect();
            const c = (r.left + r.width / 2 - innerWidth / 2) / innerWidth;
            gsap.set(im, { x: c * -50 });
          });
        },
      },
    });
  });
}

/* ---------- Studio: word-by-word scroll scrub ---------- */
(function scrub() {
  const p = $(".scrub");
  if (!p) return;
  const frag = document.createDocumentFragment();
  [...p.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      n.textContent.split(/\s+/).forEach((part) => {
        if (!part) return;
        const s = document.createElement("span");
        s.className = "w";
        s.textContent = part;
        frag.appendChild(s);
        frag.appendChild(document.createTextNode(" "));
      });
    } else {
      const s = document.createElement("span");
      s.className = "w accw";
      s.textContent = n.textContent;
      frag.appendChild(s);
      frag.appendChild(document.createTextNode(" "));
    }
  });
  p.innerHTML = "";
  p.appendChild(frag);
  if (ANIM) {
    gsap.to(".scrub .w", {
      opacity: 1,
      ease: "none",
      stagger: 0.08,
      scrollTrigger: {
        trigger: ".scrub",
        start: "top 80%",
        end: "bottom 55%",
        scrub: 0.4,
      },
    });
  } else {
    $$(".scrub .w").forEach((w) => (w.style.opacity = 1));
  }
})();

/* ---------- Counters ---------- */
$$(".stat-n").forEach((el) => {
  const end = +el.dataset.n,
    pad = el.dataset.pad === "1";
  const b = $("b", el);
  const fmt = (v) =>
    pad ? String(Math.round(v)).padStart(2, "0") : String(Math.round(v));
  if (!ANIM) {
    b.textContent = fmt(end);
    return;
  }
  const o = { v: 0 };
  gsap.to(o, {
    v: end,
    duration: 2,
    ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 88%", once: true },
    onUpdate: () => (b.textContent = fmt(o.v)),
  });
});

/* ---------- Process line draw ---------- */
if (ANIM) {
  gsap.fromTo(
    ".steps-fill",
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".steps",
        start: "top 72%",
        end: "bottom 60%",
        scrub: 0.4,
      },
    },
  );
}

/* ---------- Magnetic elements ---------- */
if (finePtr && ANIM) {
  $$(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - r.left - r.width / 2) * 0.32,
        y: (e.clientY - r.top - r.height / 2) * 0.32,
        duration: 0.5,
        ease: "power3.out",
      });
    });
    el.addEventListener("mouseleave", () =>
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1,.4)",
      }),
    );
  });
}

/* ---------- Footer: letters, clock, back-to-top ---------- */
if (ANIM) {
  gsap.from(".f-mark span", {
    y: 44,
    opacity: 0,
    stagger: 0.06,
    duration: 1,
    ease: "power4.out",
    scrollTrigger: { trigger: ".f-mark", start: "top 95%", once: true },
  });
}
const clock = $("#clock");
const tick = () => {
  clock.textContent = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
};
tick();
setInterval(tick, 1000);
$("#toTop").addEventListener("click", () => scrollToTarget(0));

/* ---------- Final refresh + first theme pass ---------- */
updateNavTheme();
window.addEventListener("load", () => {
  ScrollTrigger.refresh();
  updateNavTheme();
});
if (document.fonts && document.fonts.ready)
  document.fonts.ready.then(() => {
    ScrollTrigger.refresh();
    updateNavTheme();
  });
