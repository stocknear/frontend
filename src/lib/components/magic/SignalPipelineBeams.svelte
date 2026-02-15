<script lang="ts">
  type SourceNode = {
    id: string;
    label: string;
    left: string;
    top: string;
    x: number;
    y: number;
    color: string;
    duration: number;
    delay: number;
  };

  const center = { x: 500, y: 300 };

  const sourceNodes: SourceNode[] = [
    {
      id: "congress",
      label: "Congress",
      left: "12%",
      top: "25%",
      x: 120,
      y: 150,
      color: "#f97316",
      duration: 2600,
      delay: 0,
    },
    {
      id: "darkpool",
      label: "Dark Pool",
      left: "13%",
      top: "70%",
      x: 130,
      y: 420,
      color: "#14b8a6",
      duration: 2450,
      delay: 180,
    },
    {
      id: "analyst",
      label: "Analyst",
      left: "30%",
      top: "12%",
      x: 330,
      y: 78,
      color: "#10b981",
      duration: 2300,
      delay: 360,
    },
    {
      id: "earnings",
      label: "Earnings",
      left: "50%",
      top: "8%",
      x: 500,
      y: 50,
      color: "#f59e0b",
      duration: 2100,
      delay: 540,
    },
    {
      id: "financials",
      label: "Financials",
      left: "70%",
      top: "12%",
      x: 700,
      y: 78,
      color: "#3b82f6",
      duration: 2250,
      delay: 720,
    },
    {
      id: "ai",
      label: "AI Analysis",
      left: "88%",
      top: "25%",
      x: 880,
      y: 150,
      color: "#a78bfa",
      duration: 2400,
      delay: 900,
    },
    {
      id: "insider",
      label: "Insider",
      left: "87%",
      top: "70%",
      x: 870,
      y: 420,
      color: "#22d3ee",
      duration: 2500,
      delay: 1080,
    },
    {
      id: "news",
      label: "News",
      left: "50%",
      top: "90%",
      x: 500,
      y: 540,
      color: "#38bdf8",
      duration: 2650,
      delay: 1260,
    },
    {
      id: "options-flow",
      label: "Options Flow",
      left: "30%",
      top: "88%",
      x: 300,
      y: 530,
      color: "#6366f1",
      duration: 2550,
      delay: 1440,
    },
    {
      id: "hedge-fund",
      label: "Hedge Fund Portfolio",
      left: "70%",
      top: "88%",
      x: 700,
      y: 530,
      color: "#f43f5e",
      duration: 2500,
      delay: 1620,
    },
    {
      id: "screener",
      label: "Screener",
      left: "89%",
      top: "50%",
      x: 890,
      y: 300,
      color: "#84cc16",
      duration: 2400,
      delay: 1800,
    },
  ];

  const mobileSources = [
    "Congress",
    "Dark Pool",
    "Analyst",
    "Earnings",
    "Financials",
    "Options Flow",
    "Hedge Fund Portfolio",
    "Screener",
    "AI Analysis",
    "Insider",
    "News",
  ];

  function pathToCenter(node: SourceNode): string {
    const controlX = node.x + (center.x - node.x) * 0.58;
    const controlY = node.y + (center.y - node.y) * 0.28;
    return `M ${node.x} ${node.y} Q ${controlX} ${controlY} ${center.x} ${center.y}`;
  }
</script>

<div
  class="relative overflow-hidden rounded-[1.6rem] border border-gray-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/75 p-4 sm:p-6 lg:p-8 shadow-sm"
>
  <div
    class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(167,139,250,0.14),transparent_44%),radial-gradient(circle_at_16%_20%,rgba(56,189,248,0.08),transparent_34%),radial-gradient(circle_at_84%_80%,rgba(20,184,166,0.08),transparent_34%)]"
  ></div>

  <div class="relative hidden h-[30rem] lg:block">
    <svg
      class="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1000 600"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {#each sourceNodes as node (node.id)}
        {@const d = pathToCenter(node)}
        <path d={d} class="beam-track"></path>
        <path
          d={d}
          class="beam-line"
          style={`--beam-color:${node.color}; --beam-duration:${node.duration}ms; --beam-delay:${node.delay}ms;`}
        ></path>
        <circle r="3.5" class="beam-dot" style={`fill:${node.color};`}>
          <animateMotion
            path={d}
            dur={`${node.duration}ms`}
            begin={`${node.delay}ms`}
            repeatCount="indefinite"
          ></animateMotion>
        </circle>
      {/each}
    </svg>

    {#each sourceNodes as node (node.id)}
      <div
        class="source-node"
        style={`left:${node.left}; top:${node.top}; --node-color:${node.color};`}
      >
        <span class="source-dot"></span>
        <span class="source-label">{node.label}</span>
      </div>
    {/each}

    <div
      class="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full center-halo"
    ></div>

    <article
      class="center-card absolute left-1/2 top-1/2 w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-violet-300/65 dark:border-violet-500/40 bg-white/95 dark:bg-zinc-900/88 p-4 text-center"
    >
      <img
        src="/pwa-192x192.png"
        alt="Stocknear"
        class="mx-auto h-11 w-11 rounded-full border border-violet-200/80 dark:border-violet-500/35"
        loading="lazy"
      />
      <h3 class="mt-2 text-base font-semibold tracking-tight text-gray-900 dark:text-white">
        Stocknear
      </h3>
      <p class="mt-1 text-xs leading-relaxed text-gray-600 dark:text-zinc-300">
        All-in-one Stock Analysis Platform to research your trading ideas.
      </p>
    </article>
  </div>

  <div class="relative space-y-4 lg:hidden">
    <div class="grid grid-cols-2 gap-2">
      {#each mobileSources as label (label)}
        <div class="mobile-source">{label}</div>
      {/each}
    </div>

    <div class="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 dark:text-zinc-400">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14m0 0l-5-5m5 5l5-5" />
      </svg>
      <span>Flows into</span>
    </div>

    <article
      class="mx-auto max-w-xs rounded-2xl border border-violet-300/65 dark:border-violet-500/40 bg-white/95 dark:bg-zinc-900/88 p-4 text-center"
    >
      <img
        src="/pwa-192x192.png"
        alt="Stocknear"
        class="mx-auto h-10 w-10 rounded-full border border-violet-200/80 dark:border-violet-500/35"
        loading="lazy"
      />
      <h3 class="mt-2 text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
        Stocknear
      </h3>
      <p class="mt-1 text-xs text-gray-600 dark:text-zinc-300">
        All-in-one Stock Analysis Platform to research your trading ideas.
      </p>
    </article>
  </div>
</div>

<style>
  .beam-track {
    fill: none;
    stroke: rgba(148, 163, 184, 0.3);
    stroke-width: 1.25;
  }

  :global(.dark) .beam-track {
    stroke: rgba(82, 82, 91, 0.75);
  }

  .beam-line {
    fill: none;
    stroke: var(--beam-color);
    stroke-linecap: round;
    stroke-width: 2;
    stroke-dasharray: 22 78;
    animation: beamFlow var(--beam-duration) linear infinite;
    animation-delay: var(--beam-delay);
    filter: drop-shadow(0 0 5px var(--beam-color));
  }

  .beam-dot {
    opacity: 0.96;
  }

  .source-node {
    position: absolute;
    transform: translate(-50%, -50%);
    display: inline-flex;
    align-items: center;
    gap: 0.36rem;
    border-radius: 9999px;
    border: 1px solid rgba(203, 213, 225, 0.9);
    background: rgba(255, 255, 255, 0.94);
    color: rgb(15, 23, 42);
    padding: 0.34rem 0.62rem;
    font-size: 0.68rem;
    font-weight: 600;
    box-shadow: 0 10px 24px -18px rgba(15, 23, 42, 0.65);
    white-space: nowrap;
  }

  :global(.dark) .source-node {
    border-color: rgba(63, 63, 70, 0.95);
    background: rgba(9, 9, 11, 0.84);
    color: rgb(228, 228, 231);
    box-shadow: 0 14px 26px -20px rgba(0, 0, 0, 0.8);
  }

  .source-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 9999px;
    background: var(--node-color);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.7);
  }

  :global(.dark) .source-dot {
    box-shadow: 0 0 0 2px rgba(9, 9, 11, 0.78);
  }

  .center-halo {
    background: radial-gradient(
      circle,
      rgba(139, 92, 246, 0.2) 0%,
      rgba(56, 189, 248, 0.12) 44%,
      transparent 72%
    );
    animation: hubPulse 5.4s ease-in-out infinite;
  }

  .center-card {
    box-shadow:
      0 22px 52px -34px rgba(15, 23, 42, 0.7),
      0 12px 28px -20px rgba(139, 92, 246, 0.6);
  }

  :global(.dark) .center-card {
    box-shadow:
      0 26px 56px -36px rgba(0, 0, 0, 0.85),
      0 12px 32px -20px rgba(139, 92, 246, 0.72);
  }

  .mobile-source {
    border-radius: 9999px;
    border: 1px solid rgba(203, 213, 225, 0.9);
    background: rgba(255, 255, 255, 0.94);
    color: rgb(30, 41, 59);
    padding: 0.42rem 0.5rem;
    text-align: center;
    font-size: 0.68rem;
    font-weight: 600;
  }

  :global(.dark) .mobile-source {
    border-color: rgba(63, 63, 70, 0.95);
    background: rgba(9, 9, 11, 0.8);
    color: rgb(228, 228, 231);
  }

  @keyframes beamFlow {
    to {
      stroke-dashoffset: -100;
    }
  }

  @keyframes hubPulse {
    0%,
    100% {
      opacity: 0.42;
      transform: scale(0.96);
    }
    50% {
      opacity: 0.82;
      transform: scale(1.03);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .beam-line,
    .center-halo {
      animation: none !important;
    }

    .beam-line {
      stroke-dasharray: none;
      filter: none;
    }

    .beam-dot {
      display: none;
    }
  }
</style>
