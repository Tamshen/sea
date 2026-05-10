<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let animationId: number | null = null;
let particles: Particle[] = [];
let dpr = 1;

const MAX_PARTICLES = 45;
const MOUSE_ATTRACTION_DIST = 120;

let mouse = { x: -1000, y: -1000 };

function resize() {
  const canvas = canvasRef.value;
  if (!canvas || !ctx) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function spawnParticle() {
  if (particles.length >= MAX_PARTICLES) return;
  const size = 0.8 + Math.random() * 2.8;
  const speed = 0.35 + (3.5 - size) * 0.12 + Math.random() * 0.2;
  const life = 600 + Math.random() * 500;
  particles.push({
    x: Math.random() * window.innerWidth,
    y: window.innerHeight + Math.random() * 50,
    vx: (Math.random() - 0.5) * 0.2,
    vy: -speed,
    life,
    maxLife: life,
    size,
  });
}

function draw() {
  if (!ctx) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  ctx.clearRect(0, 0, w, h);

  if (Math.random() < 0.12) spawnParticle();

  ctx.globalCompositeOperation = 'lighter';

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    if (mouse.x >= 0) {
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_ATTRACTION_DIST && dist > 12) {
        const force = 0.012 * (1 - dist / MOUSE_ATTRACTION_DIST);
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
      if (dist < 40) {
        p.vx *= 0.97;
        p.vy *= 0.97;
      }
    }

    // 海洋气泡效果：轻微摇摆 + 缓慢上浮
    p.vx += Math.sin(p.y * 0.008 + p.x * 0.003) * 0.0015;
    p.vy -= 0.0008;

    p.vx *= 0.995;
    p.vy *= 0.999;

    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > 1.2) {
      p.vx = (p.vx / speed) * 1.2;
      p.vy = (p.vy / speed) * 1.2;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    // 到达水面（50vh）后加速破裂
    if (p.y < h * 0.5) {
      p.life -= 2;
    }

    if (p.life <= 0 || p.y > h + 60 || p.x < -40 || p.x > w + 40) {
      particles.splice(i, 1);
      continue;
    }

    const progress = p.life / p.maxLife;
    const alpha = progress * 0.5;
    const size = p.size * (0.6 + 0.4 * progress);

    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 245, 255, ${alpha})`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `rgba(160, 240, 255, ${alpha * 0.5})`;
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowBlur = 0;

  animationId = requestAnimationFrame(draw);
}

function onMouseMove(e: MouseEvent) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
}

function onMouseLeave() {
  mouse.x = -1000;
  mouse.y = -1000;
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  resize();
  draw();
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseleave', onMouseLeave);
});

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId);
  window.removeEventListener('resize', resize);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseleave', onMouseLeave);
});
</script>

<template>
  <canvas ref="canvasRef" class="fixed inset-0 pointer-events-none z-0" />
</template>
