import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [sveltekit()],
  server: {
    cors: true,
  },

  build: {
    // Target ESNext for better compatibility with modern browsers
    target: 'esnext',
    // Enable minification and other optimizations for production builds
    minify: true,
    // Enable code splitting to reduce initial loading time
    chunkSizeWarningLimit: 1500, // Adjust as per your project size
  },

  optimizeDeps: {
    // Exclude unnecessary dependencies to reduce bundle size and potential compatibility issues
    exclude: [
      'pocketbase',
    ],
  }
};

export default config;