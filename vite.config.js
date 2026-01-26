import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
// import { partytownVite } from '@builder.io/partytown/utils';
// import { visualizer } from "rollup-plugin-visualizer";

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    // visualizer({ open: false, filename: "stats.html" }), // Plugin to visualize the bundle
    tailwindcss(),
    sveltekit(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/lib/paraglide",
    }),
    // partytownVite(),
  ],

  server: {
    cors: true,
    watch: {
      usePolling: false, // Use native FS events for better performance
      ignored: ["**/src/lib/paraglide/**"], // Don't watch generated paraglide files
    },
   // allowedHosts: ["rnxuv-78-94-200-246.a.free.pinggy.link"], //dev mode only for testing lemonsqueezy
  },

  optimizeDeps: {
    // Pre-bundle paraglide for faster dev mode
    entries: ["src/lib/paraglide/messages.js", "src/lib/paraglide/runtime.js"],
  },

  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
    cssCodeSplit: true, // Extract CSS into separate files
    chunkSizeWarningLimit: 500, // Lower this to ensure chunks are appropriately sized
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0]
              .toString();
          }
        },
      },
    },
    brotliSize: true, // Enable Brotli compression
  },
};

export default config;
