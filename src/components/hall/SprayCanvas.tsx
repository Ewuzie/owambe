"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

/*
  The spray canvas: a physics layer above the video where notes fly in,
  tumble, and settle in a growing pile at the bottom of the frame.
  The pile persists and deepens all night.

  Reduced motion gets a calmer variant (slow drift, no tumbling),
  not a disabled one — the moment still has to land.
*/

export type SprayCanvasHandle = {
  /** Throw a burst of notes. origin "you" launches from the bottom, "room" drifts in from the top. */
  burst: (noteCount: number, origin: "you" | "room") => void;
  setRain: (on: boolean) => void;
};

type Note = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  w: number;
  h: number;
  hue: "gold" | "cream" | "aso";
  settled: boolean;
};

const MAX_FLYING = 260;
const MAX_SETTLED = 420;

export const SprayCanvas = forwardRef<SprayCanvasHandle, { className?: string }>(
  function SprayCanvas({ className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const flying = useRef<Note[]>([]);
    const settled = useRef<Note[]>([]);
    const raining = useRef(false);
    const reduced = useRef(false);
    const running = useRef(false);

    useImperativeHandle(ref, () => ({
      burst(noteCount, origin) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { width: w, height: h } = canvas;
        const dpr = window.devicePixelRatio || 1;
        const W = w / dpr;
        const H = h / dpr;
        const n = reduced.current ? Math.min(noteCount, 12) : noteCount;
        for (let i = 0; i < n; i++) {
          if (flying.current.length >= MAX_FLYING) break;
          const fromYou = origin === "you";
          flying.current.push(makeNote(W, H, fromYou, reduced.current));
        }
      },
      setRain(on) {
        raining.current = on;
      },
    }));

    useEffect(() => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      reduced.current = mq.matches;
      const onChange = () => (reduced.current = mq.matches);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement!.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + "px";
        canvas.style.height = rect.height + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas.parentElement!);

      running.current = true;
      let last = performance.now();
      let rainSpawnAcc = 0;

      const frame = (now: number) => {
        if (!running.current) return;
        const dt = Math.min(0.033, (now - last) / 1000);
        last = now;
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.width / dpr;
        const H = canvas.height / dpr;

        /* Rain mode: dense notes from the top */
        if (raining.current) {
          rainSpawnAcc += dt * (reduced.current ? 6 : 34);
          while (rainSpawnAcc >= 1 && flying.current.length < MAX_FLYING) {
            rainSpawnAcc -= 1;
            flying.current.push(makeRainNote(W, reduced.current));
          }
        }

        const pileBase = H - 6;
        const next: Note[] = [];
        for (const n of flying.current) {
          n.vy += (reduced.current ? 160 : 620) * dt; /* gravity */
          n.vx *= 1 - 0.9 * dt; /* drag */
          n.vy *= 1 - 0.25 * dt;
          n.x += n.vx * dt;
          n.y += n.vy * dt;
          if (!reduced.current) n.rot += n.vrot * dt;
          /* settle into the pile */
          const pileH = pileHeightAt(settled.current, n.x, W);
          if (n.y >= pileBase - pileH && n.vy > 0) {
            n.settled = true;
            n.y = pileBase - pileH;
            n.rot = (Math.random() - 0.5) * 0.6;
            settled.current.push(n);
            if (settled.current.length > MAX_SETTLED) settled.current.shift();
          } else if (n.x > -60 && n.x < W + 60 && n.y < H + 60) {
            next.push(n);
          }
        }
        flying.current = next;

        ctx.clearRect(0, 0, W, H);
        for (const n of settled.current) drawNote(ctx, n);
        for (const n of flying.current) drawNote(ctx, n);

        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);

      return () => {
        running.current = false;
        ro.disconnect();
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={className}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />
    );
  },
);

function makeNote(W: number, H: number, fromYou: boolean, reduced: boolean): Note {
  const base: Note = {
    x: fromYou ? W * (0.35 + Math.random() * 0.3) : W * Math.random(),
    y: fromYou ? H + 20 : -30,
    vx: (Math.random() - 0.5) * (fromYou ? 320 : 120),
    vy: fromYou ? -(520 + Math.random() * 420) : 40 + Math.random() * 80,
    rot: Math.random() * Math.PI * 2,
    vrot: (Math.random() - 0.5) * 9,
    w: 30 + Math.random() * 10,
    h: 14 + Math.random() * 5,
    hue: Math.random() < 0.55 ? "gold" : Math.random() < 0.7 ? "cream" : "aso",
    settled: false,
  };
  if (reduced) {
    base.vx = (Math.random() - 0.5) * 30;
    base.vy = fromYou ? -160 : 50;
    base.vrot = 0;
  }
  return base;
}

function makeRainNote(W: number, reduced: boolean): Note {
  const n = makeNote(W, 0, false, reduced);
  n.y = -30 - Math.random() * 80;
  n.vy = reduced ? 60 : 120 + Math.random() * 220;
  return n;
}

/** Approximate pile height near x: count settled notes within a band. */
function pileHeightAt(settledNotes: Note[], x: number, W: number): number {
  const band = W / 14;
  let count = 0;
  for (const n of settledNotes) {
    if (Math.abs(n.x - x) < band) count++;
  }
  return Math.min(70, count * 1.1);
}

function drawNote(ctx: CanvasRenderingContext2D, n: Note) {
  ctx.save();
  ctx.translate(n.x, n.y);
  ctx.rotate(n.rot);
  /* Notes fly over the accent-coloured stage, so they are paper white and
     ink black — the two colours guaranteed to read against any cloth. */
  const colors =
    n.hue === "gold"
      ? { fill: "#ffffff", edge: "#0b0b0c", ink: "#0b0b0c" }
      : n.hue === "cream"
        ? { fill: "#f4f2ee", edge: "#0b0b0c", ink: "#0b0b0c" }
        : { fill: "#0b0b0c", edge: "#0b0b0c", ink: "#ffffff" };
  ctx.fillStyle = colors.fill;
  ctx.strokeStyle = colors.edge;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = n.settled ? 0.92 : 1;
  ctx.fillRect(-n.w / 2, -n.h / 2, n.w, n.h);
  ctx.strokeRect(-n.w / 2, -n.h / 2, n.w, n.h);
  /* inner rule + denomination mark, like an engraved note */
  ctx.strokeRect(-n.w / 2 + 2.5, -n.h / 2 + 2.5, n.w - 5, n.h - 5);
  ctx.fillStyle = colors.ink;
  ctx.font = `700 ${Math.max(7, n.h * 0.55)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("₦", 0, 0.5);
  ctx.restore();
}
