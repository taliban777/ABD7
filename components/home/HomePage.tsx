"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import styles from "./home.module.css";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  born: number;
  lifetime: number;
}

const POOL_MAX = 14;
const SPAWN_THROTTLE = 90; // ms
const GLYPH_SIZE = 14;

export default function HomePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const transitioningRef = useRef(false);
  // Pre-rendered glyph cached on an offscreen canvas
  const glyphRef = useRef<HTMLCanvasElement | null>(null);

  // Pre-render "7" once to an offscreen canvas — avoids repeated fillText calls
  useEffect(() => {
    const off = document.createElement("canvas");
    const pad = 4;
    off.width = GLYPH_SIZE + pad * 2;
    off.height = GLYPH_SIZE + pad * 2;
    const ctx = off.getContext("2d")!;
    ctx.font = `${GLYPH_SIZE}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#3a3630";
    ctx.fillText("7", off.width / 2, off.height / 2);
    glyphRef.current = off;
  }, []);

  const spawnParticle = useCallback((x: number, y: number) => {
    const now = performance.now();
    if (now - lastSpawnRef.current < SPAWN_THROTTLE) return;
    lastSpawnRef.current = now;

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = 0.4 + Math.random() * 0.5;

    if (particlesRef.current.length >= POOL_MAX) {
      particlesRef.current.shift();
    }
    particlesRef.current.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      opacity: 0.45 + Math.random() * 0.35,
      size: 0.6 + Math.random() * 0.7,
      born: now,
      lifetime: 1400 + Math.random() * 800,
    });
  }, []);

  // Particle render loop — only runs when particles are alive
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = (now: number) => {
      const particles = particlesRef.current;

      if (particles.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const glyph = glyphRef.current;
      const gw = glyph ? glyph.width : 0;
      const gh = glyph ? glyph.height : 0;

      particlesRef.current = particles.filter((p) => {
        const age = now - p.born;
        if (age > p.lifetime) return false;

        const t = age / p.lifetime;
        // Smooth fade: quick in, slow out
        const fade = t < 0.12 ? t / 0.12 : 1 - ((t - 0.12) / 0.88) ** 1.5;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.012; // gravity
        p.vx *= 0.997;

        if (!glyph) return true;

        ctx.save();
        ctx.globalAlpha = p.opacity * fade;
        // drawImage is ~10x faster than fillText per frame
        ctx.drawImage(
          glyph,
          p.x - (gw * p.size) / 2,
          p.y - (gh * p.size) / 2,
          gw * p.size,
          gh * p.size
        );
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

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    spawnParticle(e.clientX, e.clientY);
  }, [spawnParticle]);

  const handleEnter = useCallback(() => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;

    const overlay = overlayRef.current;
    if (!overlay) {
      router.push("/test");
      return;
    }

    overlay.classList.add(styles.overlayExpand);

    const tid = setTimeout(() => {
      router.push("/test");
    }, 820);

    return () => clearTimeout(tid);
  }, [router]);

  return (
    <main
      className={styles.root}
      onMouseMove={handleMouseMove}
      aria-label="ARTBYDANI7 — Enter Gallery"
    >
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
