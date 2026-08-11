#!/bin/bash

set -e

echo "🚀 Starting deployment..."

mkdir -p builds

# One deploy at a time. Two concurrent runs would delete each other's staging dir (see the
# prune below) and race on the `build` symlink. The fd is released when this shell exits.
exec 9>builds/.deploy.lock
flock -n 9 || { echo "❌ Another deploy is already running - aborting"; exit 1; }

# Reclaim BEFORE building, not after. Cleanup used to be the last line of the script, so an
# out-of-space build failure skipped it entirely and the disk stayed just as full for every
# retry. It also only matched build_*, so legacy_build_* and aborted .staging_* grew forever.
# Keep the live build plus one rollback; never delete what the `build` symlink points at.
ACTIVE=$(readlink build 2>/dev/null || true); ACTIVE=${ACTIVE##*/}
rm -rf -- builds/.staging_*
# -x is load-bearing: when $ACTIVE is empty, `grep -Fv ""` drops every line and prunes nothing.
(cd builds && ls -t | grep -E '^(build|legacy_build)_' | grep -Fxv "$ACTIVE" | tail -n +2 | xargs -r rm -rf)

# npm ci wipes and reinstalls node_modules, so a near-full disk dies mid-install or mid-build
# with a bare ENOSPC. Fail here, where the message says what to do. Real footprint is ~800MB
# (node_modules + two kept builds + staging); 2GB leaves room for npm's cache churn.
AVAIL_MB=$(df -Pm . | awk 'NR==2 {print $4}')
if [ "${AVAIL_MB:-0}" -lt 2000 ]; then
  echo "❌ Only ${AVAIL_MB}MB free, need ~2GB for npm ci + build - aborting"
  df -h .
  du -sh builds/* builds/.[!.]* 2>/dev/null | sort -h | tail -5
  echo "   Try: pm2 flush && npm cache clean --force"
  exit 1
fi

# Anything else parked in builds/ is invisible to the prune above, so surface it rather than
# letting it silently eat the disk (two orphaned 85MB build outputs were found this way).
# `cmd && echo` would abort the deploy under `set -e` on the common path where there is no
# stray, so this has to be an if.
STRAY=$(cd builds && ls -A | grep -vE "^(build_|legacy_build_|\.deploy\.lock$)" | head -5)
if [ -n "$STRAY" ]; then
  echo "⚠️  Unmanaged entries in builds/ (never auto-pruned): $(echo "$STRAY" | tr '\n' ' ')"
fi

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
MCP_FRONTEND_ENV="/etc/stocknear-mcp/frontend.env"
if [ -f "$MCP_FRONTEND_ENV" ]; then
  if [ ! -r "$MCP_FRONTEND_ENV" ]; then
    echo "❌ $MCP_FRONTEND_ENV exists but is not readable by $(id -un)"
    exit 1
  fi
  set -a
  # Root-owned, installer-generated shell assignments; never print this file.
  # shellcheck disable=SC1091
  . "$MCP_FRONTEND_ENV"
  set +a
fi
pm2 reload frontend --update-env

trap - EXIT
echo "✅ Deployment complete!"
