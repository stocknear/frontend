import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
// import { partytownVite } from '@builder.io/partytown/utils';
// import { visualizer } from "rollup-plugin-visualizer";

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    // visualizer({ open: true }), // Plugin to visualize the bundle
    tailwindcss(),
    sveltekit(),
    // partytownVite(),
  ],

  server: {
    cors: true,
    watch: {
      usePolling: false, // Use native FS events for better performance
    },
   // allowedHosts: ["rnxuv-78-94-200-246.a.free.pinggy.link"], //dev mode only for testing lemonsqueezy
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
