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
STAGING_DIR="builds/.staging_$TIMESTAMP"
FINAL_DIR="builds/build_$TIMESTAMP"
TEMP_LINK=".build-link-$TIMESTAMP"
trap 'if [ -d "$STAGING_DIR" ]; then rm -r -- "$STAGING_DIR"; fi; if [ -L "$TEMP_LINK" ]; then unlink "$TEMP_LINK"; fi' EXIT

npm run i18n:audit
STOCKNEAR_BUILD_OUT="$STAGING_DIR" npm run build

# Adapter output can include server sourcemaps even though Vite client sourcemaps are disabled.
find "$STAGING_DIR" -name '*.map' -delete
npm run verify:production -- "$STAGING_DIR"

mv "$STAGING_DIR" "$FINAL_DIR"

# Preserve a pre-symlink deployment recoverably, then atomically activate the verified build.
if [ -e build ] && [ ! -L build ]; then
  mv build "builds/legacy_build_$TIMESTAMP"
fi
ln -s "$FINAL_DIR" "$TEMP_LINK"
mv -Tf "$TEMP_LINK" build

if [ "$(readlink build)" != "$FINAL_DIR" ]; then
  echo "❌ Failed to activate $FINAL_DIR - aborting before PM2 reload"
  exit 1
fi

# Reload PM2
pm2 reload frontend

# Cleanup (keep last 3 builds)
cd builds && ls -t | grep '^build_' | tail -n +4 | xargs -r rm -rf && cd ..

trap - EXIT
echo "✅ Deployment complete!"
