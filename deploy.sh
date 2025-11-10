#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Your original commands
git pull
npm ci

# Create builds directory
mkdir -p builds

# Build to timestamped directory
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
npm run build
mv build "builds/build_$TIMESTAMP"

# Atomic symlink update
ln -sfn "builds/build_$TIMESTAMP" build

# Reload PM2
pm2 reload frontend

# Cleanup (keep last 3 builds)
cd builds && ls -t | grep "build_" | tail -n +4 | xargs -r rm -rf && cd ..

echo "✅ Deployment complete!"