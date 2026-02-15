<script lang="ts">
  type PipelineNode = {
    id: string;
    kicker: string;
    title: string;
    detail: string;
    top: string;
    color: string;
  };

  type BeamPath = {
    id: string;
    d: string;
    color: string;
    duration: number;
    delay: number;
  };

  const inputNodes: PipelineNode[] = [
    {
      id: "input-news",
      kicker: "Input",
      title: "Breaking News",
      detail: "Company and macro headlines",
      top: "9%",
      color: "#38bdf8",
    },
    {
      id: "input-earnings",
      kicker: "Input",
      title: "Earnings Data",
      detail: "EPS, guidance, and revisions",
      top: "24%",
      color: "#f59e0b",
    },
    {
      id: "input-analyst",
      kicker: "Input",
      title: "Analyst Updates",
      detail: "Targets, upgrades, downgrades",
      top: "39%",
      color: "#10b981",
    },
    {
      id: "input-insider",
      kicker: "Input",
      title: "Insider Activity",
      detail: "Buys, sells, and ownership shifts",
      top: "54%",
      color: "#22d3ee",
    },
    {
      id: "input-price",
      kicker: "Input",
      title: "Price Events",
      detail: "Breakouts, reversals, and levels",
      top: "69%",
      color: "#a78bfa",
    },
  ];

  const outputNodes: PipelineNode[] = [
    {
      id: "output-alerts",
      kicker: "Output",
      title: "Realtime Alerts",
      detail: "Push, in-app, and email channels",
      top: "15%",
      color: "#34d399",
    },
    {
      id: "output-watchlist",
      kicker: "Output",
      title: "Watchlist Signals",
      detail: "Symbol-level context and triggers",
      top: "30%",
      color: "#22d3ee",
    },
    {
      id: "output-risk",
      kicker: "Output",
      title: "Portfolio Risk",
      detail: "Concentration and event exposure",
      top: "45%",
      color: "#fb7185",
    },
    {
      id: "output-ideas",
      kicker: "Output",
      title: "Actionable Setups",
      detail: "High-conviction opportunities",
      top: "60%",
      color: "#c084fc",
    },
  ];

  const beamPaths: BeamPath[] = [
    {
      id: "beam-news",
      d: "M220 120 C320 120 340 210 370 310",
      color: "#38bdf8",
      duration: 2600,
      delay: 0,
    },
    {
      id: "beam-earnings",
      d: "M220 200 C310 200 335 245 370 310",
      color: "#f59e0b",
      duration: 2300,
      delay: 250,
    },
    {
      id: "beam-analyst",
      d: "M220 280 C300 280 335 285 370 310",
      color: "#10b981",
      duration: 2000,
      delay: 500,
    },
    {
      id: "beam-insider",
      d: "M220 360 C300 360 335 335 370 310",
      color: "#22d3ee",
      duration: 2100,
      delay: 800,
    },
    {
      id: "beam-price",
      d: "M220 440 C320 440 340 380 370 310",
      color: "#a78bfa",
      duration: 2400,
      delay: 1000,
    },
    {
      id: "beam-alerts",
      d: "M630 310 C670 250 700 190 780 155",
      color: "#34d399",
      duration: 1900,
      delay: 1200,
    },
    {
      id: "beam-watchlist",
      d: "M630 310 C690 285 710 255 780 245",
      color: "#22d3ee",
      duration: 2100,
      delay: 1400,
    },
    {
      id: "beam-risk",
      d: "M630 310 C690 330 710 335 780 335",
      color: "#fb7185",
      duration: 2200,
      delay: 1600,
    },
    {
      id: "beam-ideas",
      d: "M630 310 C680 370 715 420 780 425",
      color: "#c084fc",
      duration: 2400,
      delay: 1800,
    },
  ];

  const mobileStages = [
    {
      id: "mobile-news",
      title: "News + Earnings + Ratings + Price",
      detail: "Live market catalysts stream in continuously.",
      color: "#38bdf8",
      isCore: false,
    },
    {
      id: "mobile-engine",
      title: "Stocknear AI Signal Engine",
      detail:
        "Normalizes and scores each event for relevance and conviction.",
      color: "#a78bfa",
      isCore: true,
    },
    {
      id: "mobile-output",
      title: "Alerts + Watchlist + Risk Context",
      detail: "Actionable outputs are routed to the tools you already use.",
      color: "#34d399",
      isCore: false,
    },
  ];
</script>

<div
  class="relative overflow-hidden rounded-[1.75rem] border border-gray-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 p-4 sm:p-6 lg:p-8 shadow-sm"
>
  <div
    class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(59,130,246,0.09),transparent_38%),radial-gradient(circle_at_74%_74%,rgba(167,139,250,0.11),transparent_45%)]"
  ></div>
  <div
    class="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl"
  ></div>
  <div
    class="pointer-events-none absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl"
  ></div>

  <div class="relative hidden h-[31rem] lg:block">
    <svg
      class="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1000 620"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {#each beamPaths as beam (beam.id)}
        <path d={beam.d} pathLength="100" class="beam-track"></path>
        <path
          d={beam.d}
          pathLength="100"
          class="beam-line"
          style={`--beam-color:${beam.color}; --beam-duration:${beam.duration}ms; --beam-delay:${beam.delay}ms;`}
        ></path>
        <circle
          r="4"
          class="beam-dot"
          style={`fill:${beam.color}; --beam-delay:${beam.delay}ms;`}
        >
          <animateMotion
            path={beam.d}
            dur={`${beam.duration}ms`}
            begin={`${beam.delay}ms`}
            repeatCount="indefinite"
          ></animateMotion>
        </circle>
      {/each}
    </svg>

    <div
      class="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full engine-halo"
    ></div>

    <article
      class="engine-card absolute left-1/2 top-1/2 w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-violet-300/70 dark:border-violet-500/40 bg-white/92 dark:bg-zinc-900/80 p-4 shadow-lg"
    >
      <span
        class="inline-flex rounded-full bg-violet-100 dark:bg-violet-500/20 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-violet-700 dark:text-violet-200"
      >
        Correlation Core
      </span>
      <h3 class="mt-2 text-base font-semibold text-gray-900 dark:text-white">
        Stocknear AI Signal Engine
      </h3>
      <p class="mt-1 text-xs leading-relaxed text-gray-600 dark:text-zinc-300">
        Merges multiple feeds, scores conviction, and routes high-signal events
        in real time.
      </p>
      <div class="mt-3 grid grid-cols-3 gap-1.5">
        <span class="engine-stat">Normalize</span>
        <span class="engine-stat">Score</span>
        <span class="engine-stat">Route</span>
      </div>
    </article>

    {#each inputNodes as node (node.id)}
      <article
        class="pipeline-node pipeline-node-input"
        style={`top:${node.top}; --node-color:${node.color};`}
      >
        <p class="node-kicker">{node.kicker}</p>
        <h4 class="node-title">{node.title}</h4>
        <p class="node-detail">{node.detail}</p>
      </article>
    {/each}

    {#each outputNodes as node (node.id)}
      <article
        class="pipeline-node pipeline-node-output"
        style={`top:${node.top}; --node-color:${node.color};`}
      >
        <p class="node-kicker">{node.kicker}</p>
        <h4 class="node-title">{node.title}</h4>
        <p class="node-detail">{node.detail}</p>
      </article>
    {/each}
  </div>

  <div class="relative mx-auto max-w-xl space-y-3 py-2 lg:hidden">
    <div
      class="absolute bottom-6 left-[1.1rem] top-6 w-px rounded-full bg-gray-300/80 dark:bg-zinc-700"
      aria-hidden="true"
    >
      <span class="mobile-rail-runner"></span>
    </div>

    {#each mobileStages as step (step.id)}
      <article
        class={`relative ml-8 rounded-xl border p-3.5 ${step.isCore
          ? "border-violet-300/70 bg-violet-50/80 dark:border-violet-500/40 dark:bg-violet-500/15"
          : "border-gray-200 bg-white/85 dark:border-zinc-700 dark:bg-zinc-900/70"}`}
      >
        <span
          class="absolute -left-[1.03rem] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-white dark:border-zinc-950"
          style={`background:${step.color};`}
        ></span>
        <h3 class="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
          {step.title}
        </h3>
        <p class="mt-1 text-xs leading-relaxed text-gray-600 dark:text-zinc-300">
          {step.detail}
        </p>
      </article>
    {/each}
  </div>
</div>

<style>
  .beam-track {
    fill: none;
    stroke: rgba(148, 163, 184, 0.35);
    stroke-width: 1.3;
  }

  :global(.dark) .beam-track {
    stroke: rgba(82, 82, 91, 0.75);
  }

  .beam-line {
    fill: none;
    stroke: var(--beam-color);
    stroke-linecap: round;
    stroke-width: 2.15;
    stroke-dasharray: 18 82;
    animation: beamTravel var(--beam-duration) linear infinite;
    animation-delay: var(--beam-delay);
    filter: drop-shadow(0 0 6px var(--beam-color));
  }

  .beam-dot {
    opacity: 0.95;
  }

  .engine-halo {
    background: radial-gradient(
      circle,
      rgba(139, 92, 246, 0.2) 0%,
      rgba(56, 189, 248, 0.12) 45%,
      transparent 72%
    );
    animation: haloPulse 5.6s ease-in-out infinite;
  }

  .engine-card {
    box-shadow:
      0 18px 40px -24px rgba(15, 23, 42, 0.55),
      0 10px 20px -16px rgba(139, 92, 246, 0.5);
  }

  :global(.dark) .engine-card {
    box-shadow:
      0 20px 46px -30px rgba(0, 0, 0, 0.85),
      0 10px 24px -18px rgba(139, 92, 246, 0.75);
  }

  .engine-stat {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    border-radius: 9999px;
    border: 1px solid rgba(196, 181, 253, 0.7);
    background: rgba(245, 243, 255, 0.9);
    color: rgb(76, 29, 149);
    padding: 0.2rem 0.35rem;
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  :global(.dark) .engine-stat {
    border-color: rgba(139, 92, 246, 0.45);
    background: rgba(76, 29, 149, 0.22);
    color: rgb(233, 213, 255);
  }

  .pipeline-node {
    position: absolute;
    width: min(14.6rem, 21vw);
    border-radius: 0.95rem;
    border: 1px solid rgba(203, 213, 225, 0.85);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 12px 28px -22px rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(5px);
    padding: 0.65rem 0.72rem;
  }

  :global(.dark) .pipeline-node {
    border-color: rgba(63, 63, 70, 0.9);
    background: rgba(9, 9, 11, 0.72);
    box-shadow: 0 16px 32px -24px rgba(0, 0, 0, 0.8);
  }

  .pipeline-node-input {
    left: 2.5%;
  }

  .pipeline-node-output {
    right: 2.5%;
  }

  .node-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: rgb(71, 85, 105);
    text-transform: uppercase;
    letter-spacing: 0.09em;
    font-size: 0.58rem;
    font-weight: 700;
  }

  .node-kicker::before {
    content: "";
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 9999px;
    background: var(--node-color);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.6);
  }

  :global(.dark) .node-kicker {
    color: rgb(161, 161, 170);
  }

  :global(.dark) .node-kicker::before {
    box-shadow: 0 0 0 3px rgba(9, 9, 11, 0.7);
  }

  .node-title {
    margin-top: 0.35rem;
    color: rgb(17, 24, 39);
    font-size: 0.82rem;
    line-height: 1.15rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  :global(.dark) .node-title {
    color: rgb(250, 250, 250);
  }

  .node-detail {
    margin-top: 0.15rem;
    color: rgb(75, 85, 99);
    font-size: 0.69rem;
    line-height: 1rem;
  }

  :global(.dark) .node-detail {
    color: rgb(161, 161, 170);
  }

  .mobile-rail-runner {
    position: absolute;
    left: 0;
    width: 100%;
    height: 3.4rem;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(125, 211, 252, 0.95) 30%,
      rgba(167, 139, 250, 0.95) 70%,
      transparent 100%
    );
    animation: mobileBeamFlow 2.8s linear infinite;
  }

  @keyframes beamTravel {
    to {
      stroke-dashoffset: -100;
    }
  }

  @keyframes haloPulse {
    0%,
    100% {
      opacity: 0.45;
      transform: scale(0.96);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.03);
    }
  }

  @keyframes mobileBeamFlow {
    from {
      transform: translateY(-3.4rem);
    }
    to {
      transform: translateY(calc(100% + 3.4rem));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .beam-line,
    .engine-halo,
    .mobile-rail-runner {
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
