# Paraglide JS Wrapper

This directory provides stable wrapper modules for the Paraglide runtime and messages.
Generated output lives in `src/lib/paraglide-generated`.

- `messages.js` lazily loads locale modules to keep non-default locales out of the main bundle.
- `runtime.js` and `server.js` re-export the generated runtime/middleware.

Do not edit the generated output directly. If you add new message keys, rerun:

- `node scripts/generate-paraglide-wrapper.mjs`
