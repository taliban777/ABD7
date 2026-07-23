"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import styles from "./home.module.css";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  scale: number;
  rotation: number;
  born: number;
  lifetime: number;
}

export default function HomePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const nextIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const transitioningRef = useRef(false);

  // Grain canvas
  const grainCanvasRef = useRef<HTMLCanvasElement>(null);
  const grainRafRef = useRef<number>(0);

  const spawnParticle = useCallback((x: number, y: number) => {
    const now = performance.now();
    // Throttle: max 1 particle every 80ms
    if (now - lastSpawnRef.current < 80) return;
    lastSpawnRef.current = now;

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.6;
    particlesRef.current.push({
      id: nextIdRef.current++,
      x: x + (Math.random() - 0.5) * 14,
      y: y + (Math.random() - 0.5) * 14,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.4,
      opacity: 0.55 + Math.random() * 0.3,
      scale: 0.55 + Math.random() * 0.55,
      rotation: Math.random() * Math.PI * 2,
      born: now,
      lifetime: 1600 + Math.random() * 900,
    });

    // Cap pool
    if (particlesRef.current.length > 18) {
      particlesRef.current.shift();
    }
  }, []);

  // Particle render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const FONT_SIZE = 13;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const tick = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => {
        const age = now - p.born;
        if (age > p.lifetime) return false;

        const progress = age / p.lifetime;
        // ease-out fade
        const fade = progress < 0.15
          ? progress / 0.15
          : 1 - ((progress - 0.15) / 0.85);

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.006; // gentle gravity
        p.vx *= 0.998;
        p.rotation += 0.008;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(p.scale, p.scale);
        ctx.globalAlpha = p.opacity * fade;
        ctx.font = `${FONT_SIZE}px Georgia, serif`;
        ctx.fillStyle = "#3a3630";
        ctx.fillText("7", 0, 0);
        ctx.restore();
        return true;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Animated grain
  useEffect(() => {
    const canvas = grainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SIZE = 200;
    canvas.width = SIZE;
    canvas.height = SIZE;

    let frame = 0;
    const renderGrain = () => {
      const imageData = ctx.createImageData(SIZE, SIZE);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 30;
        data[i] = noise;
        data[i + 1] = noise;
        data[i + 2] = noise;
        data[i + 3] = Math.random() * 22;
      }
      ctx.putImageData(imageData, 0, 0);

      // Only re-render grain every 3 frames for performance
      frame++;
      if (frame % 3 === 0) {
        grainRafRef.current = requestAnimationFrame(renderGrain);
      } else {
        grainRafRef.current = requestAnimationFrame(renderGrain);
      }
    };

    grainRafRef.current = requestAnimationFrame(renderGrain);
    return () => cancelAnimationFrame(grainRafRef.current);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    spawnParticle(e.clientX, e.clientY);
  }, [spawnParticle]);

  const handleEnter = useCallback(() => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;

    const overlay = overlayRef.current;
    if (!overlay) {
      router.push("/archive");
      return;
    }

    // Trigger the radial expand from center
    overlay.classList.add(styles.overlayExpand);

    // After transition completes, navigate
    const tid = setTimeout(() => {
      router.push("/archive");
    }, 820);

    return () => clearTimeout(tid);
  }, [router]);

  return (
    <main
      className={styles.root}
      onMouseMove={handleMouseMove}
      aria-label="ARTBYDANI7 — Enter Gallery"
    >
      {/* Atmospheric grain overlay */}
      <canvas
        ref={grainCanvasRef}
        className={styles.grain}
        aria-hidden="true"
      />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className={styles.particles}
        aria-hidden="true"
      />

      {/* Slow light shift */}
      <div className={styles.lightShift} aria-hidden="true" />

      {/* Centre content */}
      <div className={styles.centre}>
        <h1 className={styles.wordmark}>ARTBYDANI7</h1>
        <button
          type="button"
          className={styles.enterBtn}
          onClick={handleEnter}
          aria-label="Enter the gallery archive"
        >
          ENTER GALLERY
        </button>
      </div>

      {/* Transition overlay */}
      <div ref={overlayRef} className={styles.overlay} aria-hidden="true" />
    </main>
  );
}
