"use client";

import { useEffect, useRef } from "react";

type Props = { inLabel: string; outLabel: string };

const STEP_MS = 160; // time between new samples
const POINTS = 56; // samples visible across the chart
const COLOR_IN = "#155eef";
const COLOR_OUT = "#12b76a";

// Simulated network traffic: two series (data in / data out) that scroll
// continuously from right to left, like a live bandwidth monitor.
// It is illustrative: values are generated in the browser, not measured.
export function TrafficChart({ inLabel, outLabel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Mean-reverting random walk with occasional bursts, kept inside 0..1.
    const makeSeries = (base: number, spread: number) => {
      let v = base;
      return () => {
        v += (base - v) * 0.1 + (Math.random() - 0.5) * spread;
        if (Math.random() < 0.05) v += 0.25 + Math.random() * 0.2;
        v = Math.min(0.95, Math.max(0.08, v));
        return v;
      };
    };
    const nextIn = makeSeries(0.42, 0.26);
    const nextOut = makeSeries(0.28, 0.2);

    const dataIn: number[] = Array.from({ length: POINTS + 2 }, nextIn);
    const dataOut: number[] = Array.from({ length: POINTS + 2 }, nextOut);

    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawSeries = (data: number[], color: string, shift: number) => {
      const dx = width / (POINTS - 1);
      const pad = 6;
      const usable = height - pad * 2;
      const xs = data.map((_, i) => (i - 1) * dx - shift * dx);
      const ys = data.map((v) => pad + (1 - v) * usable);

      const trace = () => {
        ctx.beginPath();
        ctx.moveTo(xs[0], ys[0]);
        for (let i = 1; i < xs.length - 1; i++) {
          const mx = (xs[i] + xs[i + 1]) / 2;
          const my = (ys[i] + ys[i + 1]) / 2;
          ctx.quadraticCurveTo(xs[i], ys[i], mx, my);
        }
        ctx.lineTo(xs[xs.length - 1], ys[ys.length - 1]);
      };

      // Soft area under the line.
      trace();
      ctx.lineTo(xs[xs.length - 1], height);
      ctx.lineTo(xs[0], height);
      ctx.closePath();
      const fill = ctx.createLinearGradient(0, 0, 0, height);
      fill.addColorStop(0, color + "44");
      fill.addColorStop(1, color + "00");
      ctx.fillStyle = fill;
      ctx.fill();

      // Line on top.
      trace();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    };

    const draw = (shift: number) => {
      ctx.clearRect(0, 0, width, height);

      // Faint horizontal guides.
      ctx.strokeStyle = "#e2e7f0";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        const y = Math.round((height / 4) * i) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      drawSeries(dataOut, COLOR_OUT, shift);
      drawSeries(dataIn, COLOR_IN, shift);
    };

    resize();
    const observer = new ResizeObserver(() => {
      resize();
      draw(0);
    });
    observer.observe(canvas);
    draw(0);
    if (reduceMotion) return () => observer.disconnect();

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let visible = true;

    const frame = (now: number) => {
      acc += now - last;
      last = now;
      while (acc >= STEP_MS) {
        acc -= STEP_MS;
        dataIn.shift();
        dataIn.push(nextIn());
        dataOut.shift();
        dataOut.push(nextOut());
      }
      draw(acc / STEP_MS);
      raf = requestAnimationFrame(frame);
    };

    // Only animate while the chart is on screen.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      observer.disconnect();
    };
  }, []);

  return (
    <div className="traffic" aria-hidden="true">
      <div className="traffic-legend">
        <span><i style={{ background: COLOR_IN }} />{inLabel}</span>
        <span><i style={{ background: COLOR_OUT }} />{outLabel}</span>
      </div>
      <canvas ref={canvasRef} className="traffic-canvas" />
    </div>
  );
}
