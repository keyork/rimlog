'use client';

import { useCallback, useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
}

interface Nebula {
  x: number;
  y: number;
  rx: number;
  ry: number;
  stops: [number, string][];
}

interface Meteor {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  brightness: number;
  tail: number;
}

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const gauss = () => {
  const u = Math.max(1e-10, Math.random());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
};

const wrap = (value: number, max: number) => {
  if (max <= 0) return value;
  return ((value % max) + max) % max;
};

const BG_COUNT = [180, 90];
const MID_COUNT = [110, 56];
const FG_COUNT = [52, 28];
const BAND_COUNT = [260, 140];

const POINTER_SHIFT_BG = 10;
const POINTER_SHIFT_MID = 20;
const POINTER_SHIFT_BAND = 16;
const POINTER_SHIFT_FG = 28;

const DRIFT_FACTOR_BG = 0.55;
const DRIFT_FACTOR_BAND = 0.75;
const DRIFT_FACTOR_MID = 1;
const DRIFT_FACTOR_FG = 1.3;

const BAND_RAD = (35 * Math.PI) / 180;
const MAX_DRIFT_SPEED = 24;
const DEAD_ZONE = 0.045;
const DESKTOP_FRAME_MS = 1000 / 30;
const MOBILE_FRAME_MS = 1000 / 24;

const NEBULAE: Nebula[] = [
  {
    x: 0.16,
    y: 0.24,
    rx: 0.34,
    ry: 0.26,
    stops: [
      [0, 'rgba(24,88,170,0.18)'],
      [0.38, 'rgba(15,46,118,0.10)'],
      [0.75, 'rgba(7,16,42,0.02)'],
      [1, 'rgba(0,0,0,0)'],
    ],
  },
  {
    x: 0.76,
    y: 0.62,
    rx: 0.32,
    ry: 0.25,
    stops: [
      [0, 'rgba(6,140,170,0.12)'],
      [0.38, 'rgba(4,82,114,0.08)'],
      [0.72, 'rgba(2,20,32,0.02)'],
      [1, 'rgba(0,0,0,0)'],
    ],
  },
  {
    x: 0.52,
    y: 0.4,
    rx: 0.38,
    ry: 0.28,
    stops: [
      [0, 'rgba(118,32,155,0.14)'],
      [0.36, 'rgba(76,18,100,0.09)'],
      [0.72, 'rgba(24,6,34,0.02)'],
      [1, 'rgba(0,0,0,0)'],
    ],
  },
  {
    x: 0.84,
    y: 0.16,
    rx: 0.24,
    ry: 0.18,
    stops: [
      [0, 'rgba(255,110,56,0.08)'],
      [0.36, 'rgba(145,56,34,0.05)'],
      [0.72, 'rgba(24,8,4,0.015)'],
      [1, 'rgba(0,0,0,0)'],
    ],
  },
];

function makeStar(
  band: boolean,
  sizeMin: number,
  sizeMax: number,
  opacityMin: number,
  opacityMax: number,
): Star {
  let x: number;
  let y: number;

  if (band) {
    x = rand(-0.12, 1.12);
    const center = 0.14 + 0.72 * x;
    const spread = 0.08 + 0.04 * Math.sin(Math.min(1, Math.max(0, x)) * Math.PI);
    y = center + gauss() * spread;
  } else {
    x = rand(-0.08, 1.08);
    y = rand(-0.08, 1.08);
  }

  const distFromBand = band ? Math.abs(y - (0.14 + 0.72 * x)) : 1;
  const warmth = band ? Math.max(0, 1 - distFromBand / 0.14) : 0;
  const roll = Math.random();

  let r: number;
  let g: number;
  let b: number;

  if (roll < warmth * 0.38) {
    r = 255;
    g = rand(214, 244);
    b = rand(180, 212);
  } else if (roll < 0.82) {
    r = rand(208, 248);
    g = rand(220, 252);
    b = rand(240, 255);
  } else if (roll < 0.94) {
    r = rand(160, 198);
    g = rand(198, 228);
    b = 255;
  } else {
    r = 255;
    g = rand(224, 244);
    b = rand(188, 220);
  }

  return {
    x,
    y,
    size: rand(sizeMin, sizeMax),
    opacity: rand(opacityMin, opacityMax),
    twinkleSpeed: rand(0.7, 2.1),
    twinkleOffset: rand(0, Math.PI * 2),
    color: `${Math.round(r)},${Math.round(g)},${Math.round(b)}`,
  };
}

function drawWrappedStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fillStyle: string,
  glowStyle: string,
  glow: boolean,
  width: number,
  height: number,
) {
  const pad = Math.max(size * 7, 10);
  const xOffsets = [0];
  const yOffsets = [0];

  if (x < pad) xOffsets.push(width);
  if (x > width - pad) xOffsets.push(-width);
  if (y < pad) yOffsets.push(height);
  if (y > height - pad) yOffsets.push(-height);

  for (const xOffset of xOffsets) {
    for (const yOffset of yOffsets) {
      const sx = x + xOffset;
      const sy = y + yOffset;

      ctx.fillStyle = fillStyle;
      if (size < 1) {
        ctx.fillRect(sx - size * 0.5, sy - size * 0.5, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (glow && size > 1.15) {
        ctx.beginPath();
        ctx.arc(sx, sy, size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = glowStyle;
        ctx.fill();
      }
    }
  }
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const frameRef = useRef(0);
  const dimsRef = useRef({ width: 0, height: 0 });
  const reducedMotionRef = useRef(false);
  const mobileRef = useRef(false);
  const lowPowerRef = useRef(false);
  const visibleRef = useRef(true);
  const pointerRawRef = useRef({ x: 0.5, y: 0.5 });
  const pointerSmoothRef = useRef({ x: 0.5, y: 0.5 });
  const driftRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const prevTimeRef = useRef(0);
  const lastPaintRef = useRef(0);
  const elapsedRef = useRef(0);
  const nextMeteorTimeRef = useRef(0);
  const sceneRef = useRef<{
    bg: Star[];
    mid: Star[];
    fg: Star[];
    band: Star[];
    nebulae: Nebula[];
    meteors: Meteor[];
  }>({
    bg: [],
    mid: [],
    fg: [],
    band: [],
    nebulae: [],
    meteors: [],
  });

  const init = useCallback((width: number, height: number) => {
    dimsRef.current = { width, height };
    mobileRef.current = width < 768;
    const mobileIndex = mobileRef.current ? 1 : 0;
    const density = lowPowerRef.current ? 0.72 : 1;

    sceneRef.current = {
      bg: Array.from({ length: Math.round(BG_COUNT[mobileIndex] * density) }, () => makeStar(false, 0.35, 1.15, 0.18, 0.5)),
      mid: Array.from({ length: Math.round(MID_COUNT[mobileIndex] * density) }, () => makeStar(false, 0.55, 1.95, 0.3, 0.76)),
      fg: Array.from({ length: Math.round(FG_COUNT[mobileIndex] * density) }, () => makeStar(false, 0.9, 3.15, 0.62, 1)),
      band: Array.from({ length: Math.round(BAND_COUNT[mobileIndex] * density) }, () => makeStar(true, 0.22, 1.05, 0.12, 0.62)),
      nebulae: NEBULAE.map((nebula) => (
        mobileRef.current
          ? { ...nebula, rx: nebula.rx * 0.72, ry: nebula.ry * 0.72 }
          : { ...nebula }
      )),
      meteors: Array.from({ length: 3 }, (): Meteor => ({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0,
        brightness: 0,
        tail: 0,
      })),
    };

    pointerSmoothRef.current = { ...pointerRawRef.current };
    driftRef.current = { x: 0, y: 0, vx: 0, vy: 0 };
    elapsedRef.current = 0;
    nextMeteorTimeRef.current = performance.now() + rand(5000, 12000);
  }, []);

  const spawnMeteor = useCallback((width: number, height: number) => {
    const meteor = sceneRef.current.meteors.find((item) => !item.active);
    if (!meteor) return;

    meteor.x = rand(width * 0.08, width * 0.88);
    meteor.y = rand(height * 0.02, height * 0.42);

    const angle = rand(-0.24, 0.28);
    const speed = rand(440, 760);

    meteor.vx = Math.cos(angle) * speed;
    meteor.vy = Math.sin(angle) * speed;
    meteor.maxLife = rand(0.34, 0.65);
    meteor.life = meteor.maxLife;
    meteor.brightness = rand(0.75, 1);
    meteor.tail = rand(90, 170);
    meteor.active = true;
  }, []);

  const frame = useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx) return;

    if (!visibleRef.current) {
      prevTimeRef.current = performance.now();
      frameRef.current = requestAnimationFrame(frame);
      return;
    }

    const { width, height } = dimsRef.current;
    if (!width || !height) {
      frameRef.current = requestAnimationFrame(frame);
      return;
    }

    const now = performance.now();
    const dt = prevTimeRef.current ? Math.min((now - prevTimeRef.current) / 1000, 0.1) : 0.016;
    prevTimeRef.current = now;
    const minFrameMs = mobileRef.current || lowPowerRef.current ? MOBILE_FRAME_MS : DESKTOP_FRAME_MS;

    if (now - lastPaintRef.current < minFrameMs) {
      frameRef.current = requestAnimationFrame(frame);
      return;
    }

    lastPaintRef.current = now;
    elapsedRef.current += dt;
    const elapsed = elapsedRef.current;

    const reducedMotion = reducedMotionRef.current || lowPowerRef.current;
    const pointerEase = reducedMotion ? 0.04 : 0.065;
    pointerSmoothRef.current.x += (pointerRawRef.current.x - pointerSmoothRef.current.x) * pointerEase;
    pointerSmoothRef.current.y += (pointerRawRef.current.y - pointerSmoothRef.current.y) * pointerEase;

    let mx = (pointerSmoothRef.current.x - 0.5) * 2;
    let my = (pointerSmoothRef.current.y - 0.5) * 2;

    if (Math.abs(mx) < DEAD_ZONE) mx = 0;
    if (Math.abs(my) < DEAD_ZONE) my = 0;

    const targetVx = reducedMotion ? 0 : mx * MAX_DRIFT_SPEED;
    const targetVy = reducedMotion ? 0 : my * MAX_DRIFT_SPEED;
    const velocityEase = Math.min(dt * 2.8, 1);

    driftRef.current.vx += (targetVx - driftRef.current.vx) * velocityEase;
    driftRef.current.vy += (targetVy - driftRef.current.vy) * velocityEase;
    driftRef.current.x = wrap(driftRef.current.x + driftRef.current.vx * dt, width);
    driftRef.current.y = wrap(driftRef.current.y + driftRef.current.vy * dt, height);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    const ambient = ctx.createLinearGradient(0, 0, width, height);
    ambient.addColorStop(0, 'rgba(4,9,26,0.92)');
    ambient.addColorStop(0.5, 'rgba(2,6,18,0.82)');
    ambient.addColorStop(1, 'rgba(2,5,14,0.95)');
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, width, height);

    const scene = sceneRef.current;

    for (const nebula of scene.nebulae) {
      const nx = nebula.x * width + mx * 10;
      const ny = nebula.y * height + my * 10;
      const rx = nebula.rx * width;
      const ry = nebula.ry * height;
      const maxRadius = Math.max(rx, ry);

      ctx.save();
      ctx.translate(nx, ny);
      ctx.scale(1, ry / rx);
      ctx.translate(-nx, -ny);

      const gradient = ctx.createRadialGradient(nx, ny, 0, nx, ny, maxRadius);
      for (const [stop, color] of nebula.stops) {
        gradient.addColorStop(stop, color);
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(nx - maxRadius, ny - maxRadius, maxRadius * 2, maxRadius * 2);
      ctx.restore();
    }

    const diagonal = Math.sqrt(width * width + height * height);
    ctx.save();
    ctx.translate(width / 2 + mx * 18, height / 2 + my * 18);
    ctx.rotate(BAND_RAD);
    const bandThickness = height * 0.33;
    const bandGradient = ctx.createLinearGradient(0, -bandThickness / 2, 0, bandThickness / 2);
    bandGradient.addColorStop(0, 'rgba(0,0,0,0)');
    bandGradient.addColorStop(0.18, 'rgba(38,58,96,0.028)');
    bandGradient.addColorStop(0.42, 'rgba(80,78,122,0.095)');
    bandGradient.addColorStop(0.5, 'rgba(252,190,150,0.075)');
    bandGradient.addColorStop(0.58, 'rgba(80,78,122,0.095)');
    bandGradient.addColorStop(0.82, 'rgba(34,54,88,0.028)');
    bandGradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bandGradient;
    ctx.fillRect(-diagonal, -bandThickness / 2, diagonal * 2, bandThickness);
    ctx.restore();

    const drawLayer = (
      stars: Star[],
      pointerShift: number,
      driftFactor: number,
      glow: boolean,
    ) => {
      const pointerX = mx * pointerShift;
      const pointerY = my * pointerShift;
      const driftX = driftRef.current.x * driftFactor;
      const driftY = driftRef.current.y * driftFactor;

      for (const star of stars) {
        const twinkle = 0.72 + 0.28 * Math.sin(elapsed * star.twinkleSpeed + star.twinkleOffset);
        const opacity = star.opacity * twinkle;
        const size = Math.max(0.15, star.size * (0.88 + 0.16 * twinkle));
        const x = wrap(star.x * width + driftX + pointerX, width);
        const y = wrap(star.y * height + driftY + pointerY, height);

        drawWrappedStar(
          ctx,
          x,
          y,
          size,
          `rgba(${star.color},${opacity})`,
          `rgba(${star.color},${opacity * 0.12})`,
          glow && !lowPowerRef.current,
          width,
          height,
        );
      }
    };

    drawLayer(scene.bg, POINTER_SHIFT_BG, DRIFT_FACTOR_BG, false);
    drawLayer(scene.band, POINTER_SHIFT_BAND, DRIFT_FACTOR_BAND, false);
    drawLayer(scene.mid, POINTER_SHIFT_MID, DRIFT_FACTOR_MID, false);
    drawLayer(scene.fg, POINTER_SHIFT_FG, DRIFT_FACTOR_FG, true);

    if (!reducedMotion) {
      if (now >= nextMeteorTimeRef.current) {
        spawnMeteor(width, height);
        nextMeteorTimeRef.current = now + rand(5000, 12000);
      }

      for (const meteor of scene.meteors) {
        if (!meteor.active) continue;

        meteor.life -= dt;
        if (meteor.life <= 0) {
          meteor.active = false;
          continue;
        }

        meteor.x += meteor.vx * dt;
        meteor.y += meteor.vy * dt;

        const progress = 1 - meteor.life / meteor.maxLife;
        const alpha = progress < 0.12
          ? progress / 0.12
          : Math.pow(1 - (progress - 0.12) / 0.88, 1.55);
        const brightness = meteor.brightness * alpha;

        const magnitude = Math.sqrt(meteor.vx * meteor.vx + meteor.vy * meteor.vy);
        const unitX = meteor.vx / magnitude;
        const unitY = meteor.vy / magnitude;
        const tailX = meteor.x - unitX * meteor.tail * alpha;
        const tailY = meteor.y - unitY * meteor.tail * alpha;

        const gradient = ctx.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(0.45, `rgba(115,208,255,${brightness * 0.42})`);
        gradient.addColorStop(1, `rgba(255,255,255,${brightness})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(meteor.x, meteor.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${brightness})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(115,208,255,${brightness * 0.24})`;
        ctx.fill();
      }
    }

    frameRef.current = requestAnimationFrame(frame);
  }, [spawnMeteor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    contextRef.current = ctx;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mediaQuery.matches;
    lowPowerRef.current = (navigator.hardwareConcurrency || 8) <= 4;
    visibleRef.current = document.visibilityState === 'visible';

    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
    };

    const onVisibilityChange = () => {
      visibleRef.current = document.visibilityState === 'visible';
      prevTimeRef.current = performance.now();
    };

    const resize = () => {
      const rawDpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dprCap = width < 768 || lowPowerRef.current ? 1.1 : 1.35;
      const dpr = Math.min(rawDpr, dprCap);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init(width, height);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerRawRef.current.x = event.clientX / window.innerWidth;
      pointerRawRef.current.y = event.clientY / window.innerHeight;
    };

    const resetPointer = () => {
      pointerRawRef.current = { x: 0.5, y: 0.5 };
    };

    resize();
    prevTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(frame);

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('blur', resetPointer);
    document.addEventListener('mouseleave', resetPointer);
    document.addEventListener('visibilitychange', onVisibilityChange);
    mediaQuery.addEventListener('change', onMotionChange);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('blur', resetPointer);
      document.removeEventListener('mouseleave', resetPointer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      mediaQuery.removeEventListener('change', onMotionChange);
      contextRef.current = null;
    };
  }, [frame, init]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" aria-hidden="true" />;
}
