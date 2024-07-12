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
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
      // Enable tree shaking
      treeshake: true,
    },
  },

  optimizeDeps: {
    // Exclude unnecessary dependencies to reduce bundle size and potential compatibility issues
    exclude: [
      'pocketbase',
    ],
  }
};

export default config;