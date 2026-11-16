"use client";

import { useEffect, useRef, useState } from "react";

const LINES = [
  { cmd: "pnpm test", out: "✓ tests passed" },
  { cmd: "pnpm build", out: "✓ build completed" },
  { cmd: "deploy --prod", out: "✓ online" },
];

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Decorative terminal that types a short test, build and deploy sequence in a loop.
// It only runs while visible and shows the finished sequence with reduced motion.
export function Terminal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<{ text: string; kind: "cmd" | "out" }[]>([]);
  const [typing, setTyping] = useState("");

  useEffect(() => {
    const finished = LINES.flatMap((l) => [
      { text: l.cmd, kind: "cmd" as const },
      { text: l.out, kind: "out" as const },
    ]);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRows(finished);
      return;
    }

    let cancelled = false;
    let visible = false;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    if (rootRef.current) io.observe(rootRef.current);

    const pause = async (ms: number) => {
      await sleep(ms);
      while (!visible && !cancelled) await sleep(250);
    };

    (async () => {
      while (!cancelled) {
        setRows([]);
        setTyping("");
        await pause(600);
        for (const line of LINES) {
          for (let i = 1; i <= line.cmd.length && !cancelled; i++) {
            setTyping(line.cmd.slice(0, i));
            await pause(70);
          }
          if (cancelled) return;
          setTyping("");
          setRows((r) => [...r, { text: line.cmd, kind: "cmd" }]);
          await pause(380);
          setRows((r) => [...r, { text: line.out, kind: "out" }]);
          await pause(520);
        }
        await pause(3200);
      }
    })();

    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, []);

  return (
    <div className="terminal" data-reveal ref={rootRef} aria-hidden="true">
      <div className="terminal-bar">
        <span /><span /><span />
      </div>
      <div className="terminal-body">
        {rows.map((row, i) => (
          <p key={i} className={row.kind === "out" ? "t-out" : "t-cmd"}>
            {row.kind === "cmd" && <b>$ </b>}
            {row.text}
          </p>
        ))}
        <p className="t-cmd">
          <b>$ </b>
          {typing}
          <i className="t-cursor" />
        </p>
      </div>
    </div>
  );
}
