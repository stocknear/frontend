import { sveltekit } from '@sveltejs/kit/vite';
import { visualizer } from 'rollup-plugin-visualizer';

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    sveltekit(),
    visualizer({ open: true }) // Plugin to visualize the bundle
  ],
  server: {
    cors: true,
  },
  build: {
    target: 'esnext',
    minify: true,
    chunkSizeWarningLimit: 500, // Lower this to ensure chunks are appropriately sized
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    },
    brotliSize: true, // Enable Brotli compression
  },
  optimizeDeps: {
    exclude: [
      'pocketbase',
    ],
  }
};

export default config;
