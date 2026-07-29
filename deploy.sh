#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Your original commands
git pull
npm ci

# A missing secret fails the build loudly, but an EMPTY one builds fine and deploys a broken
# app, so check for both before spending a build on it.
for VAR in STOCKNEAR_API_KEY VAPID_PRIVATE_KEY VITE_VAPID_PUBLIC_KEY; do
  VALUE=$(grep -E "^\s*$VAR\s*=" .env.production | head -1 | cut -d= -f2- | tr -d " \"'")
  if [ -z "$VALUE" ]; then
    echo "❌ $VAR is missing or empty in .env.production - aborting"
    exit 1
  fi
done

# Create builds directory
mkdir -p builds

# Build to timestamped directory
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
npx @inlang/paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide
npm run build
mv build "builds/build_$TIMESTAMP"

# Sourcemaps are emitted by adapter-node regardless of vite's sourcemap:false and contain
# every private env value in plaintext. They are not needed to serve the app.
find "builds/build_$TIMESTAMP" -name '*.map' -delete

# Atomic symlink update
ln -sfn "builds/build_$TIMESTAMP" build

# Reload PM2
pm2 reload frontend

# Cleanup (keep last 3 builds)
cd builds && ls -t | grep "build_" | tail -n +4 | xargs -r rm -rf && cd ..

echo "✅ Deployment complete!"