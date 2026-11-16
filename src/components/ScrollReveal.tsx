"use client";

import { useEffect } from "react";

const HERO_INTRO_MS = 450; // small pause so the hero entrance (about 0.9 s) is nearly done

// Fades in every [data-reveal] element the first time it is on screen, including
// the ones already visible on load. CSS keeps them hidden until .is-visible is set;
// reduced motion and <noscript> (see layout) show them right away.
export function ScrollReveal() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const show = (el: Element) => el.classList.add("is-visible");

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      targets.forEach(show);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    for (const el of targets) {
      // Stagger siblings (e.g. cards in the same row) by a short delay.
      const index = Array.prototype.indexOf.call(el.parentElement?.children ?? [], el);
      // Content already on screen at load waits for the hero sequence to finish first.
      const onLoad = el.getBoundingClientRect().top < window.innerHeight;
      el.style.transitionDelay = `${(onLoad ? HERO_INTRO_MS : 0) + Math.min(index, 5) * 70}ms`;
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return null;
}
