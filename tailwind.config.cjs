/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: ["class"],
  safelist: ["dark"],
  content: [
    "./src/**/*.{html,js,svelte,ts}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1536px",
      },
    },
    extend: {
      screens: {
        "3xl": '1920px',
      },
      fontFamily: {
        sans: [
          "Space Grotesk",
          // Script-scoped faces declared in app.css with `unicode-range`. Space Grotesk
          // declares no range so it is tried first and simply has no Greek/Cyrillic/Thai
          // glyph; the browser then falls through per character to these. Must sit above
          // the generic families or the OS font wins instead.
          "Inter Subset",
          "Noto Sans Thai",
          "Avenir Next",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      // These were `hsl(var(--border))` etc. against CSS variables that were
      // never declared, so every one of them compiled to an invalid value and
      // was dropped — which is why popovers and dialogs rendered transparent.
      // They now point at the semantic tokens in app.css, so the existing
      // markup starts working without touching a component.
      colors: {
        border: "var(--line)",
        input: "var(--line)",
        ring: "var(--accent)",
        // shadcn's `background` means the app background, not a card — mapping
        // it to the card surface made inputs invisible on white cards.
        background: "var(--surface-page)",
        foreground: "var(--fg)",
        primary: "#1E222D",
        secondary: "#2A2E39",
        odd: "#121217",
        table: "#18181D",
        default: "#09090B",
        positive: "var(--up)",
        negative: "var(--down)",
        neutral: "#FFA838",
        // `text-muted` is the global body colour (4,755 uses); as a token it
        // now follows the theme instead of being a fixed dark navy.
        muted: {
          DEFAULT: "var(--fg)",
          foreground: "var(--fg-muted)",
        },
        destructive: {
          DEFAULT: "var(--down)",
          foreground: "var(--accent-fg)",
        },
        // shadcn's `accent` is the hover/highlight surface, not the brand
        // accent — that one is `--accent` / `text-accent`.
        accent: {
          DEFAULT: "var(--surface-raised)",
          foreground: "var(--fg)",
        },
        popover: {
          DEFAULT: "var(--surface-card)",
          foreground: "var(--fg)",
        },
        card: {
          DEFAULT: "var(--surface-card)",
          foreground: "var(--fg)",
        },
      },
      // borderRadius intentionally not overridden: mapping lg/md/sm onto an
      // undefined `--radius` made all three compile to an invalid value, so
      // ~200 elements rendered with square corners. Tailwind v4 supplies
      // --radius-sm/md/lg itself once this block is absent.
      fraction: {
        32: "1/32",
      },
      animation: {
        marquee: "marquee var(--duration) linear infinite",
        "fade-in-once": "fadeIn 0.5s ease-in-out forwards",
        flip: "flip 6s infinite steps(2, end)",
        kitrotate: "kitrotate 3s linear infinite both",
        shine: "shine 4s linear infinite",
        slide: "slide 40s linear infinite",
        spotlight: "spotlight 2s ease .75s 1 forwards",
        "border-width": "border-width 3s infinite alternate",
        "text-gradient": "text-gradient 2s linear infinite",
        "text-shake": "text-shake 1s ease 1",
        "text-glitch-to": "text-glitch-to 0.6s ease-in-out infinite",
        "text-glitch-from": "text-glitch-from 0.6s ease-in-out infinite",
        "text-scale": "text-scale 1s linear infinite forwards",
        spin: "spin 2s linear infinite",
        // From UI-Snippets : https://ui.ibelick.com
        // 'text-gradient': 'text-gradient 1.5s linear infinite',
        "background-shine": "background-shine 2s linear infinite",
        "pulse-slow": "pulse 6s infinite cubic-bezier(0.4, 0, 0.6, 1)",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        fadeIn: {
          "0%": {
            opacity: "0",
            transform: "translateY(25px) scale(0.98)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
        },
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        flip: {
          to: {
            transform: "rotate(360deg)",
          },
        },
        kitrotate: {
          to: {
            transform: "rotate(90deg)",
          },
        },
        shine: {
          from: {
            backgroundPosition: "0 0",
          },
          to: {
            backgroundPosition: "-200% 0",
          },
        },
        "border-width": {
          from: {
            width: "10px",
            opacity: "0",
          },
          to: {
            width: "100px",
            opacity: "1",
          },
        },
        "text-gradient": {
          to: {
            backgroundPosition: "200% center",
          },
        },
        "text-shake": {
          "15%": { transform: "translateX(5px)" },
          "30%": { transform: "translateX(-5px)" },
          "50%": { transform: "translateX(3px)" },
          "80%": { transform: "translateX(2px)" },
          "100%": { transform: "translateX(0)" },
        },
        "text-glitch-to": {
          from: {
            transform: "translateY(0)",
          },
          to: {
            transform: "translateY(-100%)",
          },
        },
        "text-glitch-from": {
          from: {
            transform: "translateY(100%)",
          },
          to: {
            transform: "translateY(0)",
          },
        },
        "text-scale": {
          "0%": {
            transform: "scaleX(0)",
            transformOrigin: "bottom left",
          },
          "25%": {
            transform: "scaleX(1)",
            transformOrigin: "bottom left",
          },
          "75%": {
            transform: "scaleX(1)",
            transformOrigin: "bottom right",
          },
          "100%": {
            transform: "scaleX(0)",
            transformOrigin: "bottom right",
          },
        },
        slide: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        spotlight: {
          "0%": {
            opacity: "0",
            transform: "translate(-72%, -62%) scale(0.5)",
          },
          "100%": {
            opacity: "1",
            transform: "translate(-50%,-40%) scale(1)",
          },
        },
        // For Gradient Input, UI-Snippets : https://ui.ibelick.com
        "background-shine": {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
};
