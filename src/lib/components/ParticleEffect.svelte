<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let quantity = 30;
  export let staticity = 50;
  export let ease = 50;

  let canvas: HTMLCanvasElement;
  let canvasContainer: HTMLDivElement;

  class ParticleAnimation {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    dpr: number;
    settings: { quantity: number; staticity: number; ease: number };
    circles: any[];
    canvasSize: { w: number; h: number };
    initCanvas: () => void;
    resizeCanvas: () => void;
    drawCircle: (circle: any, update?: boolean) => void;
    drawParticles: () => void;
    animate: () => void;

    constructor(el: HTMLCanvasElement, options = {}) {
      this.canvas = el;
      if (!this.canvas) return;
      this.context = this.canvas.getContext('2d');
      this.dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      this.settings = {
        quantity: options.quantity || 30,
        staticity: options.staticity || 50,
        ease: options.ease || 50,
      };
      this.circles = [];
      this.canvasSize = {
        w: 0,
        h: 0,
      };
      this.initCanvas = this.initCanvas.bind(this);
      this.resizeCanvas = this.resizeCanvas.bind(this);
      this.drawCircle = this.drawCircle.bind(this);
      this.drawParticles = this.drawParticles.bind(this);
      this.animate = this.animate.bind(this);
      this.init();
    }

    init() {
      this.initCanvas();
      this.animate();
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', this.initCanvas);
      }
    }

    initCanvas() {
      this.resizeCanvas();
      this.drawParticles();
    }

    resizeCanvas() {
      this.circles.length = 0;
      this.canvasSize.w = this.canvas.parentElement.offsetWidth;
      this.canvasSize.h = this.canvas.parentElement.offsetHeight;
      this.canvas.width = this.canvasSize.w * this.dpr;
      this.canvas.height = this.canvasSize.h * this.dpr;
      this.canvas.style.width = this.canvasSize.w + 'px';
      this.canvas.style.height = this.canvasSize.h + 'px';
      this.context.scale(this.dpr, this.dpr);
    }

    circleParams() {
      const x = Math.floor(Math.random() * this.canvasSize.w);
      const y = Math.floor(Math.random() * this.canvasSize.h);
      const translateX = 0;
      const translateY = 0;
      const size = Math.floor(Math.random() * 2) + 1;
      const alpha = 0;
      const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
      const dx = (Math.random() - 0.5) * 0.2;
      const dy = (Math.random() - 0.5) * 0.2;
      return { x, y, translateX, translateY, size, alpha, targetAlpha, dx, dy };
    }

    drawCircle(circle, update = false) {
      const { x, y, translateX, translateY, size, alpha } = circle;
      this.context.translate(translateX, translateY);
      this.context.beginPath();
      this.context.arc(x, y, size, 0, 2 * Math.PI);
      this.context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.context.fill();
      this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      if (!update) {
        this.circles.push(circle);
      }
    }

    clearContext() {
      this.context.clearRect(0, 0, this.canvasSize.w, this.canvasSize.h);
    }

    drawParticles() {
      this.clearContext();
      const particleCount = this.settings.quantity;
      for (let i = 0; i < particleCount; i++) {
        const circle = this.circleParams();
        this.drawCircle(circle);
      }
    }

    animate() {
      this.clearContext();
      this.circles.forEach((circle) => {
        const { x, y, dx, dy, alpha, targetAlpha } = circle;
        circle.x += dx;
        circle.y += dy;

        // Wrap particles around the canvas edges
        if (circle.x > this.canvasSize.w) circle.x = 0;
        if (circle.x < 0) circle.x = this.canvasSize.w;
        if (circle.y > this.canvasSize.h) circle.y = 0;
        if (circle.y < 0) circle.y = this.canvasSize.h;

        circle.alpha += alpha < targetAlpha ? 0.01 : -0.01;
        circle.alpha = Math.min(Math.max(circle.alpha, 0), targetAlpha);
        this.drawCircle(circle, true);
      });
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(this.animate);
      }
    }
  }

  let animation: ParticleAnimation;

  onMount(() => {
    if (canvas) {
      animation = new ParticleAnimation(canvas, { quantity, staticity, ease });
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', animation.initCanvas);
    }
  });
</script>

<div bind:this={canvasContainer}>
  <canvas bind:this={canvas} data-particle-animation></canvas>
</div>

<style>
  canvas {
    width: 100%;
    height: 100%;
  }
</style>
