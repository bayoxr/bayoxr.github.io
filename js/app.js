/* ==========================================================================
   AHMED BAYOUR (@BAYOXR) — 24FPS // 60HZ
   Filmmaker · Computer Scientist · Mediendesigner
   Motion & Interaction Engine
   ========================================================================== */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobileMQ = window.matchMedia("(max-width: 1024px)");

  /* ========================================================================
     1. OPTIONAL WEB AUDIO API MICRO-SYNTH (Subtle Camera Shutter & UI Clicks)
     ======================================================================== */
  let audioCtx = null;
  let soundEnabled = false;

  function playUiSound(type = "click") {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "shutter") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.045);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "chord") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.14);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.16);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.025);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
        osc.start(now);
        osc.stop(now + 0.03);
      }
    } catch (_) {
      /* ignore audio context restrictions */
    }
  }

  const audioToggle = $("#audioToggle");
  if (audioToggle) {
    audioToggle.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      audioToggle.classList.toggle("is-on", soundEnabled);
      if (soundEnabled) playUiSound("chord");
    });
  }

  /* ========================================================================
     2. LENIS SMOOTH SCROLL + GSAP SCROLLTRIGGER SYNC
     ======================================================================== */
  let lenis = null;
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  if (window.Lenis && !reducedMotion) {
    lenis = new Lenis({ duration: 1.12, smoothWheel: true });
    window.lenis = lenis;
    if (window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
    }
    if (window.gsap) {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  // Smooth anchor scrolling
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      playUiSound("click");
      if (lenis) {
        lenis.scrollTo(target, { offset: -64, duration: 1.2 });
      } else {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Topbar smart hide on scroll down, show on scroll up
  const topbar = $("#topbar");
  let lastScrollY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (y > lastScrollY + 10 && y > 420) {
        topbar.classList.add("is-hidden");
      } else if (y < lastScrollY - 10 || y < 120) {
        topbar.classList.remove("is-hidden");
      }
      lastScrollY = y;
    },
    { passive: true }
  );

  /* ========================================================================
     3. 35MM FILM LEADER & KERNEL BOOT PRELOADER
     ======================================================================== */
  const loader = $("#loader");
  const loaderFill = $("#loaderFill");
  const loaderCounter = $("#loaderCounter");
  const loaderSkip = $("#loaderSkip");
  let loaderDone = false;

  function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;
    document.body.classList.remove("is-loading");
    if (!loader) return;

    if (reducedMotion || !window.gsap) {
      loader.style.display = "none";
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        loader.style.display = "none";
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      },
    });

    tl.to(".loader-inner", { opacity: 0, duration: 0.3, ease: "power2.out" }, 0)
      .to(".loader-shutter-top", { yPercent: -102, duration: 0.85, ease: "power4.inOut" }, 0.1)
      .to(".loader-shutter-bottom", { yPercent: 102, duration: 0.85, ease: "power4.inOut" }, 0.1)
      .from(
        ".hero-grid .cell",
        { opacity: 0, y: 36, stagger: 0.08, duration: 0.85, ease: "power3.out", clearProps: "all" },
        0.35
      );
  }

  if (loaderSkip) {
    loaderSkip.addEventListener("click", finishLoader);
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !loaderDone) finishLoader();
  });

  if (reducedMotion || !window.gsap) {
    finishLoader();
  } else {
    const bootState = { p: 0 };
    gsap.to(bootState, {
      p: 100,
      duration: 1.55,
      ease: "power2.inOut",
      onUpdate: () => {
        const pct = Math.round(bootState.p);
        if (loaderFill) loaderFill.style.width = `${pct}%`;
        const secs = String(Math.floor(pct / 34)).padStart(2, "0");
        const frames = String(Math.floor((pct * 24) / 100) % 24).padStart(2, "0");
        if (loaderCounter) loaderCounter.textContent = `TC 00:00:${secs}:${frames}`;
      },
      onComplete: finishLoader,
    });
    // Fail-safe so preloader never blocks longer than 2.4s
    setTimeout(finishLoader, 2400);
  }

  /* ========================================================================
     4. TRILINGUAL SWITCHER (EN / DE / AR) & DARKROOM / SWISS PAPER THEME
     ======================================================================== */
  const urlParams = new URLSearchParams(window.location.search);
  const paramLang = urlParams.get("lang");
  let savedLang = null;
  try {
    savedLang = localStorage.getItem("bayoxr_lang");
  } catch (_) {}

  let currentLang =
    paramLang && ["en", "de", "ar"].includes(paramLang)
      ? paramLang
      : document.body.dataset.lang === "ar"
      ? "ar"
      : savedLang && ["en", "de", "ar"].includes(savedLang)
      ? savedLang
      : document.body.dataset.lang || "en";

  const roleDescriptions = {
    en: {
      film: "> 48+ films & visual stories on YouTube (@bayoxr) — directing, cinematography & editing in Premiere Pro & After Effects.",
      cs: "> Computer Science: Java, C/C++, C#, JavaScript, HTML/CSS, SQL, Git & Linux — plus open-source Museo (github.com/bayoxr/museo).",
      design: "> Media Design: Clean UI/UX, brand identities & visual graphics crafted with Figma, Photoshop & Illustrator.",
    },
    de: {
      film: "> 48+ Filme & visuelle Storys auf YouTube (@bayoxr) — Regie, Kamera & Schnitt mit Premiere Pro & After Effects.",
      cs: "> Informatik: Java, C/C++, C#, JavaScript, HTML/CSS, SQL, Git & Linux — sowie Open-Source Museo (github.com/bayoxr/museo).",
      design: "> Mediendesign: Klare UI/UX-Systeme, Markenidentitäten & Grafikdesign mit Figma, Photoshop & Illustrator.",
    },
    ar: {
      film: "> أكثر من 48 فلماً وقصة بصرية على يوتيوب (@bayoxr) — إخراج وتصوير ومونتاج عبر Premiere Pro وAfter Effects.",
      cs: "> علوم الحاسوب: Java, C/C++, C#, JavaScript, HTML/CSS, SQL, Git, Linux — ومشروع Museo المفتوح المصدر (github.com/bayoxr/museo).",
      design: "> التصميم الإعلامي: واجهات رقمية، هويات بصرية وتصاميم احترافية باستخدام Figma وPhotoshop وIllustrator.",
    },
  };
  let currentRole = "film";

  function updateThemeLabel() {
    const themeLabel = $("#themeLabel");
    if (!themeLabel) return;
    const isDark = document.body.dataset.theme !== "light";
    if (currentLang === "ar") {
      themeLabel.textContent = isDark ? "الوضع الداكن" : "الوضع الفاتح";
    } else if (currentLang === "de") {
      themeLabel.textContent = isDark ? "DARKROOM" : "LIGHT MODE";
    } else {
      themeLabel.textContent = isDark ? "DARKROOM" : "LIGHT MODE";
    }
  }

  function applyLanguage(lang) {
    if (!["en", "de", "ar"].includes(lang)) lang = "en";
    currentLang = lang;
    document.body.dataset.lang = lang;
    document.documentElement.lang = lang;
    // Keep documentElement dir="ltr" so GSAP pin-spacers and grids never jump;
    // CSS body[data-lang="ar"] handles RTL text alignment cleanly.
    document.documentElement.dir = "ltr";

    try {
      localStorage.setItem("bayoxr_lang", lang);
    } catch (_) {}

    $$("[data-set-lang]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-set-lang") === lang);
    });

    $$("[data-en], [data-de], [data-ar]").forEach((el) => {
      const val =
        el.getAttribute(`data-${lang}`) ||
        el.getAttribute("data-en") ||
        el.getAttribute("data-de");
      if (val !== null) el.innerHTML = val;
    });

    $$("[data-placeholder-en]").forEach((input) => {
      const ph =
        input.getAttribute(`data-placeholder-${lang}`) ||
        input.getAttribute("data-placeholder-en");
      if (ph) input.setAttribute("placeholder", ph);
    });

    // Update active reel title in viewfinder
    const activeReelTab = $(".reel-tab.is-active");
    const vfTitleEl = $("#vfActiveTitle");
    if (activeReelTab && vfTitleEl) {
      const t =
        lang === "ar"
          ? activeReelTab.dataset.titleAr || activeReelTab.dataset.title
          : lang === "de"
          ? activeReelTab.dataset.titleDe || activeReelTab.dataset.title
          : activeReelTab.dataset.title;
      if (t) vfTitleEl.innerHTML = t;
    }

    const roleDescEl = $("#roleDynamicDesc");
    if (roleDescEl && roleDescriptions[lang] && roleDescriptions[lang][currentRole]) {
      roleDescEl.textContent = roleDescriptions[lang][currentRole];
    }

    updateThemeLabel();

    if (window.ScrollTrigger) {
      setTimeout(() => ScrollTrigger.refresh(), 50);
    }
  }

  $$("[data-set-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      playUiSound("shutter");
      applyLanguage(btn.getAttribute("data-set-lang") || "en");
    });
  });

  // Apply initial language on load
  applyLanguage(currentLang);

  const themeToggle = $("#themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      playUiSound("shutter");
      const next = document.body.dataset.theme === "dark" ? "light" : "dark";
      document.body.dataset.theme = next;
      updateThemeLabel();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }

  /* ========================================================================
     5. HERO ROLE SWITCHER & LIVE TICKER
     ======================================================================== */
  $$(".role-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      playUiSound("click");
      $$(".role-pill").forEach((p) => p.classList.remove("is-active"));
      pill.classList.add("is-active");
      currentRole = pill.dataset.role || "film";
      const roleDescEl = $("#roleDynamicDesc");
      if (roleDescEl) {
        gsap.fromTo(
          roleDescEl,
          { opacity: 0, y: 6 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            onStart: () => {
              roleDescEl.textContent = roleDescriptions[currentLang][currentRole];
            },
          }
        );
      }
    });
  });

  const tickerItems = [
    "Magical Hangzhou at Night (4K)",
    "AGAIN — Narrative Short Film",
    "Museo — github.com/bayoxr/museo",
    "First 48 Hours in China (Doc)",
    "How I Shot My Short Film (BTS)",
  ];
  let tickerIdx = 0;
  const heroTicker = $("#heroTicker");
  if (heroTicker && window.gsap) {
    setInterval(() => {
      gsap.to(heroTicker, {
        opacity: 0,
        y: -8,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          tickerIdx = (tickerIdx + 1) % tickerItems.length;
          heroTicker.textContent = tickerItems[tickerIdx];
          gsap.fromTo(
            heroTicker,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
          );
        },
      });
    }, 2800);
  }

  /* ========================================================================
     6. LIVE 24FPS SMPTE TIMECODE & DUAL TIMEZONE CLOCKS (BERLIN / HANGZHOU)
     ======================================================================== */
  const liveTimecode = $("#liveTimecode");
  let frameTick = 0;
  setInterval(() => {
    frameTick = (frameTick + 1) % 24;
    if (liveTimecode) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      const ff = String(frameTick).padStart(2, "0");
      liveTimecode.textContent = `TC ${hh}:${mm}:${ss}:${ff}`;
    }
  }, 1000 / 24);

  function updateClocks() {
    const now = new Date();
    $$("[data-tz]").forEach((el) => {
      try {
        el.textContent = new Intl.DateTimeFormat("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: el.dataset.tz,
        }).format(now);
      } catch (_) {
        el.textContent = now.toLocaleTimeString();
      }
    });

    const osClock = $("#osClock");
    if (osClock) {
      osClock.textContent = now.toLocaleTimeString("de-DE", { hour12: false });
    }

    // Update analog SVG clock hands for Berlin & China
    const setHands = (tz, hId, mId) => {
      try {
        const parts = new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: false,
          timeZone: tz,
        }).formatToParts(now);
        const h = Number(parts.find((p) => p.type === "hour")?.value || 0) % 12;
        const m = Number(parts.find((p) => p.type === "minute")?.value || 0);
        const hAngle = ((h + m / 60) / 12) * Math.PI * 2 - Math.PI / 2;
        const mAngle = (m / 60) * Math.PI * 2 - Math.PI / 2;
        const hLine = $(hId);
        const mLine = $(mId);
        if (hLine) {
          hLine.setAttribute("x2", (20 + Math.cos(hAngle) * 8.5).toFixed(1));
          hLine.setAttribute("y2", (20 + Math.sin(hAngle) * 8.5).toFixed(1));
        }
        if (mLine) {
          mLine.setAttribute("x2", (20 + Math.cos(mAngle) * 12.5).toFixed(1));
          mLine.setAttribute("y2", (20 + Math.sin(mAngle) * 12.5).toFixed(1));
        }
      } catch (_) {}
    };
    setHands("Europe/Berlin", "#clockHandBerlinH", "#clockHandBerlinM");
    setHands("Asia/Shanghai", "#clockHandChinaH", "#clockHandChinaM");
  }
  updateClocks();
  setInterval(updateClocks, 1000);

  /* ========================================================================
     7. HERO HALFTONE DITHER-DISSOLVE CANVAS
     ======================================================================== */
  function initDitherCell(cell, idx) {
    const canvas = document.createElement("canvas");
    cell.prepend(canvas);
    const ctx = canvas.getContext("2d");
    let dots = [];
    let trail = [];
    let dirty = true;
    const GAP = 6;
    const BASE_DOT = 1.4;
    const ACTIVE_DOT = 2.4;

    function build() {
      const r = cell.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width));
      canvas.height = Math.max(1, Math.floor(r.height));
      dots = [];
      for (let y = GAP; y < canvas.height; y += GAP) {
        for (let x = GAP; x < canvas.width; x += GAP) {
          dots.push({ x, y, noise: Math.random() });
        }
      }
      dirty = true;
      draw(performance.now());
    }

    function draw(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isLight = document.body.dataset.theme === "light";
      const baseColor = isLight ? "rgba(20,20,19,0.22)" : "rgba(245,243,238,0.18)";
      trail = trail.filter((p) => now - p.t < 650);

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        let intensity = 0;
        for (let j = 0; j < trail.length; j++) {
          const p = trail[j];
          const age = (now - p.t) / 650;
          const radius = 140 - 90 * age;
          const dist = Math.hypot(d.x - p.x, d.y - p.y);
          if (dist < radius) {
            intensity = Math.max(intensity, 1 - dist / radius);
          }
        }

        if (intensity > 0.18 + 0.55 * d.noise) {
          ctx.fillStyle = intensity > 0.62 ? "#ff5121" : "#b8f0d0";
          ctx.beginPath();
          ctx.arc(d.x, d.y, ACTIVE_DOT, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = baseColor;
          ctx.fillRect(d.x - BASE_DOT / 2, d.y - BASE_DOT / 2, BASE_DOT, BASE_DOT);
        }
      }

      // If bottom-left optical cell, draw a subtle 24fps sine soundtrack wave
      if (idx === 1) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 81, 33, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const midY = canvas.height * 0.52;
        for (let x = 0; x < canvas.width; x += 6) {
          const y =
            midY +
            Math.sin(x * 0.025 + now * 0.004) * 18 * Math.sin(x * 0.006 - now * 0.002);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    function loop(now) {
      if (trail.length > 0 || dirty || idx === 1) {
        draw(now);
        dirty = trail.length > 0;
      }
      if (!reducedMotion) requestAnimationFrame(loop);
    }

    cell.addEventListener("pointermove", (e) => {
      const r = cell.getBoundingClientRect();
      trail.push({
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        t: performance.now(),
      });
    });

    window.addEventListener("resize", build, { passive: true });
    build();
    if (!reducedMotion) requestAnimationFrame(loop);
  }

  $$("[data-dither-cell]").forEach((cell, i) => initDitherCell(cell, i));

  /* ========================================================================
     8. ROTATING SVG CURSOR FOLLOWER
     ======================================================================== */
  const cursorFollower = $("#cursorFollower");
  const cursorRingText = $("#cursorRingText");
  let mouseX = 0,
    mouseY = 0,
    curX = 0,
    curY = 0,
    cursorActive = false;

  if (cursorFollower && !reducedMotion) {
    window.addEventListener(
      "pointermove",
      (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      },
      { passive: true }
    );

    const tickCursor = () => {
      if (cursorActive) {
        curX += (mouseX - curX) * 0.2;
        curY += (mouseY - curY) * 0.2;
        cursorFollower.style.left = `${curX}px`;
        cursorFollower.style.top = `${curY}px`;
      }
      requestAnimationFrame(tickCursor);
    };
    requestAnimationFrame(tickCursor);

    $$("[data-cursor-ring]").forEach((el) => {
      el.addEventListener("pointerenter", (e) => {
        curX = e.clientX;
        curY = e.clientY;
        cursorActive = true;
        const label = el.getAttribute("data-cursor-ring") || "WATCH FILM · 24FPS · ";
        if (cursorRingText) {
          cursorRingText.textContent = `${label} ${label}`;
        }
        cursorFollower.classList.add("is-active");
      });
      el.addEventListener("pointerleave", () => {
        cursorActive = false;
        cursorFollower.classList.remove("is-active");
      });
    });
  }

  /* ========================================================================
     9. ANAMORPHIC 2.39:1 SHOWREEL VIEWFINDER STAGE & INLINE PLAYER
     ======================================================================== */
  const vfGate = $("#viewfinderGate");
  const vfBackdrop = $("#vfBackdrop");
  const vfActiveKicker = $("#vfActiveKicker");
  const vfActiveTitle = $("#vfActiveTitle");
  const vfActiveMeta = $("#vfActiveMeta");
  const vfPlayInlineBtn = $("#vfPlayInlineBtn");
  const vfYoutubeLink = $("#vfYoutubeLink");
  const vfEmbedContainer = $("#vfEmbedContainer");
  const vfIframeMount = $("#vfIframeMount");
  const vfCloseInline = $("#vfCloseInline");

  // Aspect Ratio Gate Switcher
  $$("[data-aspect-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      playUiSound("shutter");
      $$("[data-aspect-btn]").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      if (vfGate) vfGate.setAttribute("data-aspect", btn.getAttribute("data-aspect-btn"));
      if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 560);
    });
  });

  // LUT Color Grade Switcher
  $$("[data-lut-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      playUiSound("shutter");
      $$("[data-lut-btn]").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      if (vfGate) vfGate.setAttribute("data-lut", btn.getAttribute("data-lut-btn"));
    });
  });

  function stopInlineVideo() {
    if (vfEmbedContainer) vfEmbedContainer.classList.remove("is-playing");
    if (vfIframeMount) vfIframeMount.innerHTML = "";
  }

  function playInlineVideo(vid) {
    if (!vfEmbedContainer || !vfIframeMount || !vid) return;
    playUiSound("chord");
    vfEmbedContainer.classList.add("is-playing");
    vfIframeMount.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(
      vid
    )}?autoplay=1&rel=0&modestbranding=1" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  }

  if (vfPlayInlineBtn) {
    vfPlayInlineBtn.addEventListener("click", () => {
      playInlineVideo(vfPlayInlineBtn.dataset.vid || "NxxHqwq5Yxw");
    });
  }
  if (vfCloseInline) {
    vfCloseInline.addEventListener("click", stopInlineVideo);
  }

  // 4-Reel Selector Tabs
  $$(".reel-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      playUiSound("shutter");
      stopInlineVideo();
      $$(".reel-tab").forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");

      const vid = tab.dataset.vid;
      const thumb = tab.dataset.thumb;
      const kicker = tab.dataset.kicker;
      const title =
        currentLang === "ar"
          ? tab.dataset.titleAr || tab.dataset.title
          : currentLang === "de"
          ? tab.dataset.titleDe || tab.dataset.title
          : tab.dataset.title;
      const meta = tab.dataset.meta;

      if (vfBackdrop && thumb) {
        gsap.to(vfBackdrop, {
          opacity: 0.2,
          duration: 0.2,
          onComplete: () => {
            vfBackdrop.src = thumb;
            gsap.to(vfBackdrop, { opacity: 0.78, duration: 0.35 });
          },
        });
      }
      if (vfActiveKicker && kicker) vfActiveKicker.textContent = kicker;
      if (vfActiveTitle && title) vfActiveTitle.innerHTML = title;
      if (vfActiveMeta && meta) vfActiveMeta.textContent = meta;
      if (vfPlayInlineBtn && vid) vfPlayInlineBtn.dataset.vid = vid;
      if (vfYoutubeLink && vid) vfYoutubeLink.href = `https://www.youtube.com/watch?v=${vid}`;
    });
  });

  // Viewfinder Subtle Anamorphic Flare & Scanline Shader Canvas
  const vfShaderCanvas = $("#vfShaderCanvas");
  if (vfShaderCanvas && !reducedMotion) {
    const sCtx = vfShaderCanvas.getContext("2d");
    const resizeVfCanvas = () => {
      vfShaderCanvas.width = 640;
      vfShaderCanvas.height = 280;
    };
    resizeVfCanvas();
    const renderVfShader = (now) => {
      const w = vfShaderCanvas.width;
      const h = vfShaderCanvas.height;
      sCtx.clearRect(0, 0, w, h);
      const t = now * 0.0008;
      const gx = w * (0.5 + 0.35 * Math.sin(t));
      const gy = h * (0.5 + 0.25 * Math.cos(t * 0.7));
      const grad = sCtx.createRadialGradient(gx, gy, 8, gx, gy, w * 0.48);
      grad.addColorStop(0, "rgba(255, 81, 33, 0.22)");
      grad.addColorStop(0.5, "rgba(59, 111, 245, 0.08)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, w, h);

      // Anamorphic horizontal streak
      sCtx.fillStyle = "rgba(184, 240, 208, 0.07)";
      sCtx.fillRect(0, gy - 1, w, 2);
      requestAnimationFrame(renderVfShader);
    };
    requestAnimationFrame(renderVfShader);
  }

  /* ========================================================================
     10. GSAP SCROLLTRIGGER CHOREOGRAPHY & HORIZONTAL PIN PASSAGE
     ======================================================================== */
  if (window.gsap && window.ScrollTrigger && !reducedMotion) {
    // Slide-in section headlines
    $$("[data-slide]").forEach((el) => {
      gsap.from(el, {
        xPercent: -4,
        opacity: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });
    });

    // Showreel Gate Scroll-Scrubbed Scale Expansion
    if (vfGate) {
      gsap.fromTo(
        vfGate,
        { scale: 0.92 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: "#showreel",
            start: "top 80%",
            end: "top 20%",
            scrub: 0.6,
          },
        }
      );
    }

    // Horizontal Pin Passage (#hwrap / #htrack) — Desktop only (> 768px)
    const hwrap = $("#hwrap");
    const htrack = $("#htrack");
    const discProgressFill = $("#discProgressFill");
    const discStepLabel = $("#discStepLabel");

    if (hwrap && htrack && gsap.matchMedia) {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 769px)", () => {
        const getScrollDist = () => Math.max(0, htrack.scrollWidth - window.innerWidth);

        const horizTween = gsap.to(htrack, {
          x: () => -getScrollDist(),
          ease: "none",
          scrollTrigger: {
            trigger: hwrap,
            start: "top top",
            end: () => "+=" + getScrollDist(),
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate: (self) => {
              const p = self.progress;
              if (discProgressFill) {
                discProgressFill.style.width = `${Math.max(12, Math.round(p * 100))}%`;
              }
              if (discStepLabel) {
                const step = clamp(Math.floor(p * 4) + 1, 1, 4);
                discStepLabel.textContent = `0${step} / 04`;
              }
            },
          },
        });

        $$(".dpanel").forEach((panel) => {
          gsap.from(panel.children, {
            opacity: 0,
            y: 24,
            stagger: 0.08,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: panel,
              containerAnimation: horizTween,
              start: "left 92%",
              toggleActions: "play none none none",
            },
          });
        });
      });
    }

    // Count-Up Stats Bento (Aspen Search Reference)
    $$(".stat-num").forEach((el) => {
      const target = Number(el.dataset.count || 0);
      const suffix = el.dataset.suffix || "";
      const counter = { val: 0 };
      gsap.to(counter, {
        val: target,
        duration: 1.6,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = `${Math.round(counter.val)}${suffix}`;
        },
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });
    });
  }

  /* ========================================================================
     11. INTERACTIVE WIDGETS IN DISCIPLINE PANELS
         (LENS SIMULATOR, GITHUB BAYOXR/MUSEO CODE INSPECTOR & TYPE TESTER)
     ======================================================================== */
  const lensPreviewImg = $("#lensPreviewImg");
  const lensReadout = $("#lensReadout");
  $$(".lens-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      playUiSound("shutter");
      $$(".lens-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const sc = btn.dataset.scale || "1";
      const bl = btn.dataset.blur || "0px";
      if (lensPreviewImg) {
        lensPreviewImg.style.transform = `scale(${sc})`;
        lensPreviewImg.style.filter = `blur(${bl}) contrast(1.08)`;
      }
      if (lensReadout) lensReadout.textContent = btn.textContent;
    });
  });

  // Real GitHub Repository Code Inspector (https://github.com/bayoxr/museo)
  const ghCodeDisplay = $("#ghCodeDisplay");
  const ghCodeSnippets = {
    swift: `<span class="cm">// github.com/bayoxr/museo — macos/MuseoApp.swift</span>
<span class="kw">final class</span> <span class="fn">AppDelegate</span>: NSObject, NSApplicationDelegate {
  <span class="kw">private var</span> window: NSWindow!
  <span class="kw">private var</span> webView: WKWebView!
  <span class="kw">private let</span> serverPort: Int = <span class="fn">8765</span>

  <span class="kw">func</span> <span class="fn">applicationDidFinishLaunching</span>(_ n: Notification) {
    startBackendServer() <span class="cm">// Atomic iCloud + Local Sync</span>
    setupNativeWindow()  <span class="cm">// 1480x940 Full-Bleed Canvas</span>
  }
}`,
    store: `<span class="cm">// github.com/bayoxr/museo — js/store.js (3-Layer Sync)</span>
<span class="kw">export class</span> <span class="fn">Store</span> {
  <span class="fn">constructor</span>() {
    <span class="kw">this</span>.zoom = <span class="fn">1</span>; <span class="kw">this</span>.panX = <span class="fn">0</span>; <span class="kw">this</span>.panY = <span class="fn">0</span>;
    <span class="kw">this</span>.cloudAvailable = <span class="kw">false</span>;
  }
  <span class="kw">async</span> <span class="fn">syncToCloud</span>(payload) {
    <span class="kw">return</span> fetch(<span class="fn">"/api/workspace"</span>, { method: <span class="fn">"POST"</span>, body: payload });
  }
}`,
    python: `<span class="cm"># github.com/bayoxr/museo — server.py (Atomic iCloud Engine)</span>
<span class="kw">def</span> <span class="fn">atomic_write_json</span>(path: Path, raw_bytes: bytes) -> <span class="fn">None</span>:
    path.parent.mkdir(parents=<span class="kw">True</span>, exist_ok=<span class="kw">True</span>)
    tmp = path.with_suffix(<span class="fn">".tmp"</span>)
    tmp.write_bytes(raw_bytes)
    tmp.replace(path) <span class="cm"># Zero-corruption atomic swap</span>`,
  };

  $$("[data-gh-file]").forEach((tab) => {
    tab.addEventListener("click", () => {
      playUiSound("click");
      $$("[data-gh-file]").forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const key = tab.getAttribute("data-gh-file") || "swift";
      if (ghCodeDisplay && ghCodeSnippets[key]) {
        ghCodeDisplay.innerHTML = ghCodeSnippets[key];
      }
    });
  });

  const typeWeightSlider = $("#typeWeightSlider");
  const typeTrackSlider = $("#typeTrackSlider");
  const typeTesterTarget = $("#typeTesterTarget");
  const typeWeightReadout = $("#typeWeightReadout");

  function updateTypeSpecimen() {
    if (!typeTesterTarget) return;
    const w = typeWeightSlider ? typeWeightSlider.value : 400;
    const tr = typeTrackSlider ? typeTrackSlider.value : -1;
    typeTesterTarget.style.fontWeight = w;
    typeTesterTarget.style.letterSpacing = `${tr * 0.005}em`;
    if (typeWeightReadout) {
      typeWeightReadout.textContent = `WEIGHT: ${w} · TRACK: ${tr}`;
    }
  }
  if (typeWeightSlider) typeWeightSlider.addEventListener("input", updateTypeSpecimen);
  if (typeTrackSlider) typeTrackSlider.addEventListener("input", updateTypeSpecimen);

  /* ========================================================================
     12. FILMOGRAPHY FILTER & IN-PAGE SCREENING ROOM MODAL
     ======================================================================== */
  const filmCards = $$(".film-card");
  $$(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      playUiSound("click");
      $$(".filter-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const filter = btn.dataset.filter || "all";

      filmCards.forEach((card) => {
        const match = filter === "all" || card.dataset.cat === filter;
        card.classList.toggle("is-hidden-filter", !match);
      });

      if (window.gsap) {
        const visible = filmCards.filter((c) => !c.classList.contains("is-hidden-filter"));
        gsap.fromTo(
          visible,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, stagger: 0.05, duration: 0.45, ease: "power2.out" }
        );
      }
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  // Screening Room Modal
  const filmModal = $("#filmModal");
  const modalPlayerMount = $("#modalPlayerMount");
  const modalFilmTitle = $("#modalFilmTitle");
  const modalYoutubeBtn = $("#modalYoutubeBtn");
  const closeModalBtn = $("#closeModalBtn");

  function openFilmModal(vid, title) {
    if (!filmModal || !modalPlayerMount) return;
    playUiSound("chord");
    stopInlineVideo();
    if (modalFilmTitle) modalFilmTitle.textContent = title || "Film Screening";
    if (modalYoutubeBtn) modalYoutubeBtn.href = `https://www.youtube.com/watch?v=${vid}`;
    modalPlayerMount.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(
      vid
    )}?autoplay=1&rel=0&modestbranding=1" title="${
      title || "YouTube Film"
    }" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    filmModal.classList.add("is-open");
    filmModal.setAttribute("aria-hidden", "false");
    if (lenis) lenis.stop();
  }

  function closeFilmModal() {
    if (!filmModal || !modalPlayerMount) return;
    filmModal.classList.remove("is-open");
    filmModal.setAttribute("aria-hidden", "true");
    modalPlayerMount.innerHTML = "";
    if (lenis) lenis.start();
  }

  filmCards.forEach((card) => {
    card.addEventListener("click", () => {
      const vid = card.dataset.vid;
      const title = card.dataset.title;
      if (vid) openFilmModal(vid, title);
    });
  });

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeFilmModal);
  if (filmModal) {
    filmModal.addEventListener("click", (e) => {
      if (e.target === filmModal) closeFilmModal();
    });
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && filmModal?.classList.contains("is-open")) {
      closeFilmModal();
    }
  });

  /* ========================================================================
     13. BAYOXR_OS v2.6: MUSEO SPATIAL CANVAS + CLI TERMINAL + CATENARY SHADER
     ======================================================================== */
  // A) Museo.app Interactive Spatial Canvas
  const museoCanvas = $("#museoCanvas");
  const museoWires = $("#museoWires");

  function drawMuseoWires() {
    if (!museoCanvas || !museoWires) return;
    const cards = $$(".mu-card", museoCanvas);
    if (cards.length < 2) {
      museoWires.innerHTML = "";
      return;
    }
    const cRect = museoCanvas.getBoundingClientRect();
    let paths = "";
    for (let i = 0; i < cards.length - 1; i++) {
      const a = cards[i].getBoundingClientRect();
      const b = cards[i + 1].getBoundingClientRect();
      const x1 = a.left - cRect.left + a.width / 2;
      const y1 = a.top - cRect.top + a.height / 2;
      const x2 = b.left - cRect.left + b.width / 2;
      const y2 = b.top - cRect.top + b.height / 2;
      const cx1 = x1 + (x2 - x1) * 0.45;
      const cx2 = x1 + (x2 - x1) * 0.55;
      paths += `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${cx1.toFixed(1)} ${y1.toFixed(
        1
      )}, ${cx2.toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(
        1
      )}" fill="none" stroke="rgba(255, 81, 33, 0.65)" stroke-width="1.8" stroke-dasharray="5 5" />`;
      paths += `<circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="4" fill="#b8f0d0" />`;
      paths += `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="4" fill="#ff5121" />`;
    }
    museoWires.innerHTML = paths;
  }

  function makeMuCardDraggable(card) {
    let dragging = false;
    let startX = 0,
      startY = 0,
      origLeft = 0,
      origTop = 0;

    card.addEventListener("pointerdown", (e) => {
      dragging = true;
      $$(".mu-card", museoCanvas).forEach((c) => c.classList.remove("is-selected"));
      card.classList.add("is-selected");
      startX = e.clientX;
      startY = e.clientY;
      origLeft = parseFloat(card.style.left) || 0;
      origTop = parseFloat(card.style.top) || 0;
      card.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    card.addEventListener("pointermove", (e) => {
      if (!dragging || !museoCanvas) return;
      const maxW = museoCanvas.clientWidth - card.offsetWidth - 8;
      const maxH = museoCanvas.clientHeight - card.offsetHeight - 8;
      const nx = clamp(origLeft + (e.clientX - startX), 8, Math.max(8, maxW));
      const ny = clamp(origTop + (e.clientY - startY), 8, Math.max(8, maxH));
      card.style.left = `${nx}px`;
      card.style.top = `${ny}px`;
      drawMuseoWires();
    });

    const stopDrag = () => {
      dragging = false;
    };
    card.addEventListener("pointerup", stopDrag);
    card.addEventListener("pointercancel", stopDrag);
  }

  if (museoCanvas) {
    $$(".mu-card", museoCanvas).forEach(makeMuCardDraggable);
    setTimeout(drawMuseoWires, 150);
    window.addEventListener("resize", drawMuseoWires, { passive: true });

    $$("[data-mu-grid]").forEach((btn) => {
      btn.addEventListener("click", () => {
        playUiSound("click");
        $$("[data-mu-grid]").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        museoCanvas.setAttribute("data-grid", btn.getAttribute("data-mu-grid"));
      });
    });

    let addedCardCount = 3;
    const muAddCardBtn = $("#muAddCardBtn");
    if (muAddCardBtn) {
      muAddCardBtn.addEventListener("click", () => {
        playUiSound("shutter");
        addedCardCount++;
        const card = document.createElement("div");
        card.className = "mu-card is-selected";
        card.style.left = `${40 + ((addedCardCount * 45) % 220)}px`;
        card.style.top = `${60 + ((addedCardCount * 35) % 180)}px`;
        card.innerHTML = `
          <div class="mu-card-tag">0${addedCardCount} // STUDIO NODE</div>
          <h4>Idea Node #${addedCardCount}</h4>
          <p>24fps Storyboard + GSAP ScrollTrigger + iCloud Sync Node.</p>
        `;
        museoCanvas.appendChild(card);
        makeMuCardDraggable(card);
        drawMuseoWires();
      });
    }

    const muResetBoardBtn = $("#muResetBoardBtn");
    if (muResetBoardBtn) {
      muResetBoardBtn.addEventListener("click", () => {
        playUiSound("click");
        const c1 = $("#muCard1"),
          c2 = $("#muCard2"),
          c3 = $("#muCard3");
        if (c1) {
          c1.style.left = "28px";
          c1.style.top = "32px";
        }
        if (c2) {
          c2.style.left = "295px";
          c2.style.top = "54px";
        }
        if (c3) {
          c3.style.left = "155px";
          c3.style.top = "275px";
        }
        $$(".mu-card", museoCanvas).forEach((c) => {
          if (!["muCard1", "muCard2", "muCard3"].includes(c.id)) c.remove();
        });
        addedCardCount = 3;
        drawMuseoWires();
      });
    }
  }

  // B) bayoxr-cli Interactive Terminal
  const terminalOutput = $("#terminalOutput");
  const terminalForm = $("#terminalForm");
  const terminalInput = $("#terminalInput");

  const terminalCommandsByLang = {
    en: {
      help: "Available commands: <code>skills</code>, <code>github</code>, <code>museo</code>, <code>films</code>, <code>socials</code>, <code>clear</code>",
      whoami:
        "<strong>Ahmed Bayour (@bayoxr)</strong> — Syrian-German Filmmaker, Computer Scientist & Media Designer based in Germany.",
      github:
        "GitHub: <a href='https://github.com/bayoxr' target='_blank' rel='noopener' style='color:var(--mint);text-decoration:underline;'>github.com/bayoxr</a> | Project: <a href='https://github.com/bayoxr/museo' target='_blank' rel='noopener' style='color:var(--vermilion);text-decoration:underline;'>bayoxr/museo</a> (Museo — Visual Workspace).",
      skills:
        "<strong>[CS]:</strong> Java, C, C++, C#, JavaScript, HTML, CSS, SQL, Git, Linux &bull; <strong>[FILM]:</strong> Premiere Pro, After Effects &bull; <strong>[DESIGN]:</strong> Figma, Photoshop, Illustrator.",
      films:
        "YouTube (<strong>@bayoxr</strong>): 1) Magical Hangzhou at Night 2) AGAIN Short Film 3) First 48h in China 4) How I Shot My Short Film.",
      museo:
        "<strong>bayoxr/museo (Mu)</strong> — Visual Workspace for Creative Projects on GitHub.",
      socials:
        "All handles are <strong>@bayoxr</strong>: YouTube, Instagram, TikTok & GitHub — or open <a href='links.html' style='color:var(--mint);text-decoration:underline;'>links.html</a>.",
      contact:
        "Connect via <strong>@bayoxr</strong> on Instagram, YouTube, TikTok, or GitHub.",
    },
    de: {
      help: "Befehle: <code>skills</code>, <code>github</code>, <code>museo</code>, <code>films</code>, <code>socials</code>, <code>clear</code>",
      whoami:
        "<strong>Ahmed Bayour (@bayoxr)</strong> — Syrisch-Deutscher Filmmaker, Informatiker & Mediendesigner in Deutschland.",
      github:
        "GitHub: <a href='https://github.com/bayoxr' target='_blank' rel='noopener' style='color:var(--mint);text-decoration:underline;'>github.com/bayoxr</a> | Projekt: <a href='https://github.com/bayoxr/museo' target='_blank' rel='noopener' style='color:var(--vermilion);text-decoration:underline;'>bayoxr/museo</a> (Museo — Visual Workspace).",
      skills:
        "<strong>[CS]:</strong> Java, C, C++, C#, JavaScript, HTML, CSS, SQL, Git, Linux &bull; <strong>[FILM]:</strong> Premiere Pro, After Effects &bull; <strong>[DESIGN]:</strong> Figma, Photoshop, Illustrator.",
      films:
        "YouTube (<strong>@bayoxr</strong>): 1) Magical Hangzhou at Night 2) AGAIN Kurzfilm 3) Erste 48h in China 4) Kurzfilm im Zimmer.",
      museo:
        "<strong>bayoxr/museo (Mu)</strong> — Visueller Workspace für Kreativprojekte auf GitHub.",
      socials:
        "Überall <strong>@bayoxr</strong>: YouTube, Instagram, TikTok & GitHub — oder öffne <a href='links.html' style='color:var(--mint);text-decoration:underline;'>links.html</a>.",
      contact:
        "Vernetze dich über <strong>@bayoxr</strong> auf Instagram, YouTube, TikTok oder GitHub.",
    },
    ar: {
      help: "الأوامر المتاحة: <code>skills</code>, <code>github</code>, <code>museo</code>, <code>films</code>, <code>socials</code>, <code>clear</code>",
      whoami:
        "<strong>أحمد بيور (@bayoxr)</strong> — صانع أفلام وطالب إعلام وعلوم حاسوب سوري-ألماني مقيم في ألمانيا.",
      github:
        "حساب GitHub: <a href='https://github.com/bayoxr' target='_blank' rel='noopener' style='color:var(--mint);text-decoration:underline;'>github.com/bayoxr</a> | المشروع: <a href='https://github.com/bayoxr/museo' target='_blank' rel='noopener' style='color:var(--vermilion);text-decoration:underline;'>bayoxr/museo</a>.",
      skills:
        "<strong>[البرمجة]:</strong> Java, C, C++, C#, JavaScript, HTML, CSS, SQL, Git, Linux &bull; <strong>[السينما]:</strong> Premiere Pro, After Effects &bull; <strong>[التصميم]:</strong> Figma, Photoshop, Illustrator.",
      films:
        "يوتيوب (<strong>@bayoxr</strong>): ١) هانجو الخيالية في الليل ٢) فلم AGAIN القصير ٣) أول 48 ساعة في الصين ٤) كيف صورت فلمي القصير من غرفتي.",
      museo:
        "<strong>bayoxr/museo (Mu)</strong> — مساحة عمل بصرية للمشاريع الإبداعية على GitHub.",
      socials:
        "جميع الحسابات باسم <strong>@bayoxr</strong> على يوتيوب، إنستغرام، تيك توك وGitHub — أو افتح <a href='links.html' style='color:var(--mint);text-decoration:underline;'>links.html</a>.",
      contact:
        "تواصل عبر <strong>@bayoxr</strong> على إنستغرام، يوتيوب، تيك توك أو GitHub.",
    },
  };

  function runTerminalCmd(raw) {
    if (!terminalOutput) return;
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    playUiSound("click");

    if (cmd === "clear") {
      terminalOutput.innerHTML = "";
      return;
    }

    const lineCmd = document.createElement("div");
    lineCmd.className = "term-line";
    lineCmd.innerHTML = `<span class="term-prompt">ahmed@bayoxr ~ %</span> <span class="term-cmd">${cmd.replace(
      /[<>]/g,
      ""
    )}</span>`;
    terminalOutput.appendChild(lineCmd);

    const dict = terminalCommandsByLang[currentLang] || terminalCommandsByLang.de;
    const notFoundMsg =
      currentLang === "ar"
        ? `الأمر غير موجود: <code>${cmd.replace(/[<>]/g, "")}</code>. اكتب <code>help</code>.`
        : currentLang === "en"
        ? `Command not found: <code>${cmd.replace(/[<>]/g, "")}</code>. Type <code>help</code>.`
        : `Befehl nicht gefunden: <code>${cmd.replace(/[<>]/g, "")}</code>. Tippe <code>help</code>.`;

    const lineOut = document.createElement("div");
    lineOut.className = "term-line term-out";
    lineOut.innerHTML = `&rarr; ${dict[cmd] || notFoundMsg}`;
    terminalOutput.appendChild(lineOut);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  $$("[data-term-cmd]").forEach((chip) => {
    chip.addEventListener("click", () => runTerminalCmd(chip.dataset.termCmd || "help"));
  });

  if (terminalForm && terminalInput) {
    terminalForm.addEventListener("submit", (e) => {
      e.preventDefault();
      runTerminalCmd(terminalInput.value);
      terminalInput.value = "";
    });
  }

  // C) Procedural Rolling Polygon & Catenary Road Canvas
  const polyRoadCanvas = $("#polyRoadCanvas");
  const polySidesSlider = $("#polySidesSlider");
  const polySpeedSlider = $("#polySpeedSlider");
  const polySidesVal = $("#polySidesVal");

  if (polyRoadCanvas) {
    const pCtx = polyRoadCanvas.getContext("2d");
    let pW = 0,
      pH = 0,
      dpr = 1;
    let phase = 0;

    function resizePolyCanvas() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = polyRoadCanvas.getBoundingClientRect();
      pW = Math.max(260, r.width || 480);
      pH = Math.max(160, r.height || 190);
      polyRoadCanvas.width = Math.round(pW * dpr);
      polyRoadCanvas.height = Math.round(pH * dpr);
      pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function polyRadius(theta, n, R) {
      const seg = (Math.PI * 2) / n;
      const a = (((theta % seg) + seg) % seg) - seg / 2;
      return (R * Math.cos(Math.PI / n)) / Math.cos(a);
    }

    function drawPolyRoad() {
      pCtx.clearRect(0, 0, pW, pH);
      const nSides = Number(polySidesSlider ? polySidesSlider.value : 6);
      const speed = Number(polySpeedSlider ? polySpeedSlider.value : 4);
      if (polySidesVal) polySidesVal.textContent = String(nSides);

      phase = (phase + 0.0022 * speed) % 1;
      const R = Math.min(pW, pH) * 0.22;
      const apothem = R * Math.cos(Math.PI / nSides);
      const axleY = pH * 0.56;
      const roadY = axleY + apothem;
      const spacing = 2 * R * Math.sin(Math.PI / nSides);

      // Catenary arches road: y = a * cosh(x / a)
      pCtx.beginPath();
      const firstPeak = -spacing;
      const arches = Math.ceil((pW + spacing * 3) / spacing);
      for (let i = 0; i < arches; i++) {
        const peak = firstPeak + i * spacing;
        const left = peak - spacing / 2;
        const steps = 28;
        for (let j = 0; j <= steps; j++) {
          const lx = left + (j / steps) * spacing;
          const rel = lx - peak;
          const cy = roadY + apothem * (Math.cosh(rel / apothem) - 1);
          if (i === 0 && j === 0) pCtx.moveTo(lx, cy);
          else pCtx.lineTo(lx, cy);
        }
      }
      pCtx.strokeStyle = "rgba(184, 240, 208, 0.55)";
      pCtx.lineWidth = 1.4;
      pCtx.stroke();

      // Horizontal dashed axle
      pCtx.save();
      pCtx.setLineDash([5, 8]);
      pCtx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      pCtx.beginPath();
      pCtx.moveTo(0, axleY);
      pCtx.lineTo(pW, axleY);
      pCtx.stroke();
      pCtx.restore();

      // Rolling N-gon
      const x = lerp(R * 1.2, pW - R * 1.2, (Math.sin(phase * Math.PI * 2 - Math.PI / 2) + 1) / 2);
      const rot = ((x / spacing) * (Math.PI * 2)) / nSides - Math.PI / nSides;
      const pts = 120;
      pCtx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const th = (i / pts) * Math.PI * 2;
        const rad = polyRadius(th, nSides, R);
        const px = x + Math.cos(th + rot) * rad;
        const py = axleY + Math.sin(th + rot) * rad;
        if (i === 0) pCtx.moveTo(px, py);
        else pCtx.lineTo(px, py);
      }
      pCtx.closePath();
      pCtx.strokeStyle = "#ff5121";
      pCtx.lineWidth = 2;
      pCtx.stroke();

      // Center vertex dot
      pCtx.beginPath();
      pCtx.arc(x, axleY, 3.5, 0, Math.PI * 2);
      pCtx.fillStyle = "#b8f0d0";
      pCtx.fill();

      if (!reducedMotion) requestAnimationFrame(drawPolyRoad);
    }

    resizePolyCanvas();
    window.addEventListener("resize", resizePolyCanvas, { passive: true });
    drawPolyRoad();
  }

  /* ========================================================================
     14. BAND 6: POINTER-DRIVEN 6-CHECKPOINT POLYGON MORPH TRACK
         & 7-SHAPE RADIAL FOOTER "O"
     ======================================================================== */
  function polyPath(cx, cy, R, n, rot, steps = 160) {
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const th = (i / steps) * Math.PI * 2;
      const seg = (Math.PI * 2) / n;
      const a = (((th % seg) + seg) % seg) - seg / 2;
      const r = (R * Math.cos(Math.PI / n)) / Math.cos(a);
      const x = cx + Math.cos(th + rot) * r;
      const y = cy + Math.sin(th + rot) * r;
      d += (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
    }
    return d + "Z";
  }

  // Pointer-Driven Polygon Morph CTA Track
  (() => {
    const track = $("#ctaMorphTrack");
    const link = $("#morphCtaLink");
    const path = $("#morphCtaPath");
    if (!track || !link || !path) return;

    const SIZE = 190;
    const CP = [0, 0.2, 0.4, 0.6, 0.8, 1];
    const SIDES = [4, 6, 8, 12, 16, 24];
    const ROT = [0, 90, 180, 270, 360, 450];
    let progress = 0;

    const sidesAt = (p) => {
      for (let i = 1; i < CP.length; i++) {
        if (p <= CP[i]) {
          const f = (p - CP[i - 1]) / (CP[i] - CP[i - 1]);
          return SIDES[i - 1] + (SIDES[i] - SIDES[i - 1]) * f;
        }
      }
      return SIDES[SIDES.length - 1];
    };

    const spawnTrail = (idx) => {
      if (reducedMotion || !window.gsap) return;
      const usable = Math.max(0, track.getBoundingClientRect().width - SIZE);
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 220 220");
      svg.setAttribute("class", "cta-trail");
      svg.style.left = `${CP[idx] * usable}px`;
      const outline = document.createElementNS("http://www.w3.org/2000/svg", "path");
      outline.setAttribute(
        "d",
        polyPath(110, 110, 96, SIDES[idx], (ROT[idx] * Math.PI) / 180)
      );
      outline.setAttribute("fill", "none");
      outline.setAttribute("stroke", "currentColor");
      outline.setAttribute("stroke-width", "1.2");
      svg.appendChild(outline);
      track.appendChild(svg);
      gsap.to(svg, {
        opacity: 0,
        scale: 1.08,
        duration: 0.65,
        ease: "power2.out",
        onComplete: () => svg.remove(),
      });
    };

    const setMorphProgress = (p) => {
      p = clamp(p, 0, 1);
      const usable = Math.max(0, track.getBoundingClientRect().width - SIZE);
      const x = p * usable;
      if (window.gsap && !reducedMotion) {
        gsap.to(link, { x, duration: 0.14, ease: "none", overwrite: "auto" });
      } else {
        link.style.transform = `translateX(${x}px)`;
      }
      path.setAttribute("d", polyPath(110, 110, 96, sidesAt(p), (p * 450 * Math.PI) / 180));

      for (let i = 0; i < CP.length; i++) {
        const c = CP[i];
        if (
          (progress < c - 0.002 && p >= c - 0.002) ||
          (progress > c + 0.002 && p <= c + 0.002)
        ) {
          spawnTrail(i);
        }
      }
      progress = p;
    };

    track.addEventListener(
      "pointermove",
      (e) => {
        const r = track.getBoundingClientRect();
        const usable = Math.max(1, r.width - SIZE);
        const x = clamp(e.clientX - r.left - SIZE / 2, 0, usable);
        setMorphProgress(x / usable);
      },
      { passive: true }
    );

    setMorphProgress(0.08);
  })();

  // Footer "O" 7-Shape Radial Aperture Loop
  (() => {
    const oPath = $("#footerOMorphPath");
    if (!oPath || reducedMotion) return;
    const CX = 715,
      CY = 110,
      R = 48;
    const SIDES_SEQ = [4, 5, 6, 7, 8, 10, 14];
    const start = performance.now();

    const tickFooterO = (now) => {
      const elapsed = (now - start) / 1000;
      const step = Math.floor(elapsed) % SIDES_SEQ.length;
      const frac = elapsed % 1;
      const ease = frac < 0.5 ? 2 * frac * frac : 1 - Math.pow(-2 * frac + 2, 2) / 2;
      const nA = SIDES_SEQ[step];
      const nB = SIDES_SEQ[(step + 1) % SIDES_SEQ.length];
      const n = nA + (nB - nA) * ease;
      const rot = ((step * 60 + ease * 60) * Math.PI) / 180;
      oPath.setAttribute("d", polyPath(CX, CY, R, n, rot, 120));
      requestAnimationFrame(tickFooterO);
    };
    requestAnimationFrame(tickFooterO);
  })();

  /* ========================================================================
     15. INQUIRY CONFIGURATOR & ONE-CLICK HANDLE COPY
     ======================================================================== */
  const directMailBtn = $("#directMailBtn");
  $$(".inq-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      playUiSound("click");
      $$(".inq-chip").forEach((c) => c.classList.remove("is-selected"));
      chip.classList.add("is-selected");
      const topic = chip.dataset.topic || "Collaboration";
      if (directMailBtn) {
        directMailBtn.href = `mailto:ahmed.bayour@outlook.com?subject=${encodeURIComponent(
          `Projektanfrage: ${topic} — Ahmed Bayour (@bayoxr)`
        )}`;
      }
    });
  });

  const copyHandleBtn = $("#copyHandleBtn");
  const copyHandleText = $("#copyHandleText");
  if (copyHandleBtn && copyHandleText) {
    copyHandleBtn.addEventListener("click", async () => {
      playUiSound("chord");
      try {
        await navigator.clipboard.writeText("https://www.youtube.com/@bayoxr");
      } catch (_) {}
      const prev = copyHandleText.textContent;
      copyHandleText.textContent =
        currentLang === "ar"
          ? "✓ تم نسخ رابط youtube.com/@bayoxr!"
          : currentLang === "de"
          ? "✓ youtube.com/@bayoxr kopiert!"
          : "✓ youtube.com/@bayoxr copied!";
      setTimeout(() => {
        copyHandleText.textContent = prev;
      }, 2200);
    });
  }

  // Refresh ScrollTrigger after fonts and images settle
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }
  window.addEventListener("load", () => {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();
