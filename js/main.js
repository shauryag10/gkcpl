/* =====================================================================
   Jineshwar Industries — interactions
   Dependency-free. Everything degrades gracefully with reduced motion.
   ===================================================================== */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ------------------------------------------------------------------
     1. Split headings into words for masked reveals
     ------------------------------------------------------------------ */
  function splitText() {
    $$("[data-split]").forEach((el) => {
      const words = el.textContent.trim().split(/\s+/);
      const step = Math.min(0.06, 1.3 / words.length);
      el.textContent = "";
      words.forEach((word, i) => {
        const outer = document.createElement("span");
        outer.className = "word";
        const inner = document.createElement("span");
        inner.textContent = word;
        inner.style.transitionDelay = `${(i * step).toFixed(3)}s`;
        outer.appendChild(inner);
        el.appendChild(outer);
        if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      });
    });
  }

  /* ------------------------------------------------------------------
     2. Scroll reveals
     ------------------------------------------------------------------ */
  function initReveals() {
    const targets = $$("[data-reveal], [data-split], .eyebrow");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      targets.forEach((t) => t.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    targets.forEach((t) => io.observe(t));
  }

  /* ------------------------------------------------------------------
     3. Preloader
     ------------------------------------------------------------------ */
  function initPreloader(onDone) {
    const pre = $("#preloader");
    if (!pre) return onDone();
    document.body.classList.add("is-locked");
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      pre.classList.add("is-done");
      document.body.classList.remove("is-locked");
      setTimeout(onDone, 250);
    };
    const minDelay = reduceMotion ? 0 : 1100;
    const start = performance.now();
    const ready = () => {
      const wait = Math.max(0, minDelay - (performance.now() - start));
      setTimeout(finish, wait);
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(ready, ready);
    } else {
      window.addEventListener("load", ready, { once: true });
    }
    setTimeout(finish, 2600); // never trap the visitor
  }

  /* ------------------------------------------------------------------
     4. Navigation: glass on scroll, hide on scroll down, active link
     ------------------------------------------------------------------ */
  function initNav() {
    const nav = $("#nav");
    const toggle = $("#nav-toggle");
    const menu = $("#mobile-menu");
    const progress = $("#scroll-progress");
    const toTop = $("#to-top");
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 40);
      if (y > 320 && y > lastY + 4 && !menu.classList.contains("is-open")) nav.classList.add("is-hidden");
      else if (y < lastY - 4 || y < 320) nav.classList.remove("is-hidden");
      lastY = y;
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      }
      if (toTop) toTop.classList.toggle("is-visible", y > window.innerHeight);
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    }, { passive: true });
    onScroll();

    if (toggle && menu) {
      const setOpen = (open) => {
        toggle.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        menu.classList.toggle("is-open", open);
        menu.setAttribute("aria-hidden", String(!open));
        document.body.classList.toggle("is-locked", open);
      };
      toggle.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));
      $$("a", menu).forEach((a) => a.addEventListener("click", () => setOpen(false)));
      window.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    }

    if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

    // Active section highlighting
    const links = $$("[data-nav]");
    const sections = links.map((l) => $(l.getAttribute("href"))).filter(Boolean);
    if ("IntersectionObserver" in window && sections.length) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${e.target.id}`));
            }
          });
        },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      sections.forEach((s) => io.observe(s));
    }
  }

  /* ------------------------------------------------------------------
     5. Parallax (data-parallax="factor")
     ------------------------------------------------------------------ */
  function initParallax() {
    if (reduceMotion) return;
    const items = $$("[data-parallax]").map((el) => ({
      el,
      factor: parseFloat(el.dataset.parallax) || 0,
      ref: el.closest("section") || el.parentElement,
    }));
    if (!items.length) return;
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      items.forEach(({ el, factor, ref }) => {
        const r = ref.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        const offset = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${(-offset * factor).toFixed(1)}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ------------------------------------------------------------------
     6. Hero: procedural brushed-steel canvas + optional video
     ------------------------------------------------------------------ */
  function initHero() {
    const hero = $("#hero");
    const canvas = $("#hero-canvas");
    const video = $("#hero-video");
    if (!hero || !canvas) return;

    // Video: fade in when it can actually play; otherwise the canvas stays.
    if (video) {
      const sources = $$("source", video);
      const last = sources[sources.length - 1];
      video.addEventListener("canplay", () => hero.classList.add("has-video"), { once: true });
      if (last) last.addEventListener("error", () => hero.classList.remove("has-video"));
      video.play && video.play().catch(() => {});
    }

    // Mouse parallax for the floating discs
    if (finePointer && !reduceMotion) {
      hero.addEventListener("mousemove", (e) => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        hero.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      }, { passive: true });
      hero.addEventListener("mouseleave", () => {
        hero.style.setProperty("--mx", "0");
        hero.style.setProperty("--my", "0");
      });
    }

    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, tex = null, raf = 0, running = false;
    const t0 = performance.now();

    const build = () => {
      w = canvas.width = Math.max(480, Math.floor(canvas.clientWidth * 0.55));
      h = canvas.height = Math.max(320, Math.floor(canvas.clientHeight * 0.55));
      tex = document.createElement("canvas");
      tex.width = w; tex.height = h;
      const tc = tex.getContext("2d");

      const g = tc.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#26272B");
      g.addColorStop(0.32, "#46474C");
      g.addColorStop(0.5, "#5E5F65");
      g.addColorStop(0.62, "#3B3C41");
      g.addColorStop(1, "#18191C");
      tc.fillStyle = g;
      tc.fillRect(0, 0, w, h);

      // brushing strokes
      const strokes = Math.floor(h * 2.4);
      for (let i = 0; i < strokes; i++) {
        const y = Math.random() * h;
        const len = 30 + Math.random() * w * 0.7;
        const x = Math.random() * w - len * 0.35;
        const a = Math.random() * 0.14;
        tc.strokeStyle = Math.random() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.4})`;
        tc.lineWidth = Math.random() < 0.85 ? 1 : 2;
        tc.beginPath();
        tc.moveTo(x, y + 0.5);
        tc.lineTo(x + len, y + 0.5);
        tc.stroke();
      }

      // soft highlight band and vignette
      const band = tc.createLinearGradient(0, h * 0.3, 0, h * 0.7);
      band.addColorStop(0, "rgba(255,255,255,0)");
      band.addColorStop(0.5, "rgba(255,255,255,0.08)");
      band.addColorStop(1, "rgba(255,255,255,0)");
      tc.fillStyle = band;
      tc.fillRect(0, 0, w, h);

      const v = tc.createRadialGradient(w * 0.62, h * 0.45, h * 0.15, w * 0.5, h * 0.5, w * 0.85);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(0,0,0,0.6)");
      tc.fillStyle = v;
      tc.fillRect(0, 0, w, h);
    };

    const frame = (now) => {
      if (!running) return;
      const t = (now - t0) / 1000;
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(tex, 0, 0);
      ctx.globalCompositeOperation = "lighter";
      for (let k = 0; k < 3; k++) {
        const speed = 0.045 + k * 0.02;
        const phase = (t * speed + k * 0.37) % 1;
        const x = phase * w * 1.8 - w * 0.4;
        const gl = ctx.createLinearGradient(x - w * 0.22, 0, x + w * 0.22, h * 0.7);
        gl.addColorStop(0, "rgba(255,255,255,0)");
        gl.addColorStop(0.5, `rgba(255,255,255,${0.045 + k * 0.02})`);
        gl.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gl;
        ctx.fillRect(0, 0, w, h);
      }
      // a faint warm glow, breathing slowly
      const gx = w * (0.72 + Math.sin(t * 0.25) * 0.05);
      const gy = h * (0.5 + Math.cos(t * 0.2) * 0.06);
      const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, h * 0.7);
      glow.addColorStop(0, "rgba(183,101,79,0.10)");
      glow.addColorStop(1, "rgba(183,101,79,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    build();
    if (reduceMotion) {
      running = true;
      frame(t0);
      running = false;
    } else {
      start();
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
          entries[0].isIntersecting ? start() : stop();
        }).observe(hero);
      }
    }
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { build(); if (reduceMotion) { running = true; frame(performance.now()); running = false; } }, 200);
    });
  }

  /* ------------------------------------------------------------------
     7. Custom cursor and magnetic buttons (fine pointers only)
     ------------------------------------------------------------------ */
  function initCursor() {
    const cursor = $("#cursor");
    if (!cursor || !finePointer || reduceMotion) return;
    document.body.classList.add("has-cursor");
    const dot = $(".cursor__dot", cursor);
    const ring = $(".cursor__ring", cursor);
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    let visible = false;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (!visible) { visible = true; cursor.style.opacity = "1"; }
    }, { passive: true });
    document.addEventListener("mouseleave", () => { cursor.style.opacity = "0"; visible = false; });
    window.addEventListener("mousedown", () => cursor.classList.add("is-down"));
    window.addEventListener("mouseup", () => cursor.classList.remove("is-down"));

    const hoverables = "a, button, [data-cursor], select, input, textarea, .gallery__track";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverables)) cursor.classList.add("is-hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverables)) cursor.classList.remove("is-hover");
    });

    const tick = () => {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    cursor.style.opacity = "0";
    cursor.style.transition = "opacity .3s";
    tick();
  }

  function initMagnetic() {
    if (!finePointer || reduceMotion) return;
    $$("[data-magnetic]").forEach((el) => {
      const strength = 0.28;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ------------------------------------------------------------------
     8. Card tilt
     ------------------------------------------------------------------ */
  function initTilt() {
    if (!finePointer || reduceMotion) return;
    $$("[data-tilt]").forEach((card) => {
      let raf = 0;
      card.addEventListener("mouseenter", () => {
        card.style.transition = "transform .18s ease-out, box-shadow .6s cubic-bezier(.16,1,.3,1), border-color .4s";
      });
      card.addEventListener("mousemove", (e) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = `perspective(1000px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg) translateY(-4px)`;
        });
      });
      card.addEventListener("mouseleave", () => {
        cancelAnimationFrame(raf);
        card.style.transition = "transform .9s cubic-bezier(.16,1,.3,1), box-shadow .6s cubic-bezier(.16,1,.3,1), border-color .4s";
        card.style.transform = "";
      });
    });
  }

  /* ------------------------------------------------------------------
     9. Process line drawn by scroll
     ------------------------------------------------------------------ */
  function initProcessLine() {
    const track = $("#process-track");
    const line = $("#process-line");
    if (!track || !line) return;
    if (reduceMotion) { line.style.transform = "scaleX(1)"; return; }
    let ticking = false;
    const update = () => {
      const r = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp((vh * 0.85 - r.top) / (r.height * 0.9), 0, 1);
      line.style.transform = `scaleX(${p.toFixed(3)})`;
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------
     10. Gallery: arrows and drag-to-scroll
     ------------------------------------------------------------------ */
  function initGallery() {
    const track = $("#gallery-track");
    if (!track) return;
    const prev = $("#gallery-prev");
    const next = $("#gallery-next");
    const stepSize = () => {
      const item = $(".gallery__item", track);
      return item ? item.getBoundingClientRect().width + 18 : 320;
    };
    prev && prev.addEventListener("click", () => track.scrollBy({ left: -stepSize(), behavior: "smooth" }));
    next && next.addEventListener("click", () => track.scrollBy({ left: stepSize(), behavior: "smooth" }));

    if (!finePointer) return;
    let down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener("pointerdown", (e) => {
      down = true; moved = false;
      startX = e.clientX; startLeft = track.scrollLeft;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) { moved = true; track.classList.add("is-dragging"); }
      track.scrollLeft = startLeft - dx;
    });
    const release = () => {
      if (!down) return;
      down = false;
      track.classList.remove("is-dragging");
    };
    track.addEventListener("pointerup", release);
    track.addEventListener("pointercancel", release);
    track.addEventListener("click", (e) => { if (moved) e.preventDefault(); }, true);
  }

  /* ------------------------------------------------------------------
     11. Enquiry form
     Set data-endpoint on the <form> to POST JSON to a backend
     (for example a Formspree or Basin URL). Without one, the form
     shows the success state locally.
     ------------------------------------------------------------------ */
  function initForm() {
    const form = $("#enquiry-form");
    if (!form) return;
    const hint = $("#form-hint");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let valid = true;
      $$("[required]", form).forEach((input) => {
        const field = input.closest(".field");
        const ok = input.value.trim() !== "";
        field && field.classList.toggle("is-invalid", !ok);
        if (!ok) valid = false;
      });
      if (!valid) {
        if (hint) { hint.textContent = "Please complete the required fields."; hint.classList.add("is-error"); }
        const first = $(".is-invalid input, .is-invalid select", form);
        first && first.focus();
        return;
      }
      const endpoint = form.dataset.endpoint;
      const data = Object.fromEntries(new FormData(form).entries());
      const button = $("button[type=submit]", form);
      if (endpoint) {
        button && (button.disabled = true);
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error(String(res.status));
        } catch (err) {
          button && (button.disabled = false);
          if (hint) { hint.textContent = "Something went wrong. Please try again or call us."; hint.classList.add("is-error"); }
          return;
        }
      }
      form.classList.add("is-sent");
    });
    $$("input, select, textarea", form).forEach((input) => {
      input.addEventListener("input", () => {
        const field = input.closest(".field");
        field && field.classList.remove("is-invalid");
      });
    });
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", () => {
    splitText();
    initNav();
    initHero();
    initParallax();
    initCursor();
    initMagnetic();
    initTilt();
    initProcessLine();
    initGallery();
    initForm();
    initPreloader(initReveals);
  });
})();
