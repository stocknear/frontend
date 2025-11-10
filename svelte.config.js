//import adapter from '@sveltejs/adapter-static';
import adapter from "@sveltejs/adapter-node";

import compression from "compression";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // Add the compression middleware to the adapter options
      middleware: (handler) => compression()(handler),
      worker: true, // Add this line if the adapter supports handling worker files
    }),
  },
  preprocess: vitePreprocess(),
  paths: {
    relative: false,
  },
};

export default config;
