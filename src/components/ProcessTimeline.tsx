"use client";

import { useEffect, useRef, useState } from "react";

type Step = { title: string; desc: string };

// Four-step timeline whose line draws itself and whose steps light up
// as the visitor scrolls the section into view.
export function ProcessTimeline({ steps }: { steps: Step[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const [progress, setProgress] = useState(1); // 1 = fully drawn (no JS / reduced motion)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const vh = window.innerHeight;
      const top = el.getBoundingClientRect().top;
      const p = (vh * 0.85 - top) / (vh * 0.4);
      setProgress(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <ol className="process-grid" ref={ref} style={{ "--progress": progress } as React.CSSProperties}>
      {steps.map((step, i) => (
        <li
          className={`process-step${progress >= i / steps.length ? " is-active" : ""}`}
          key={step.title}
        >
          <span className="process-number" aria-hidden="true">{i + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.desc}</p>
        </li>
      ))}
    </ol>
  );
}
