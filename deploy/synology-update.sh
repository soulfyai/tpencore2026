#!/bin/sh
# Usage: sh synology-update.sh /volume1/web/tpencore [https://.../published-site]
# Download only published website files; never replace local music or an existing config.
set -eu
log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
DEPLOY_ROOT=${1:?Provide the existing Web Station document root}
SITE_SOURCE=${2:-https://soulfyai.github.io/tpencore2026}
case "$DEPLOY_ROOT" in /*) ;; *) echo 'Document root must be absolute' >&2; exit 1;; esac
case "$DEPLOY_ROOT" in /|/volume[0-9]|/volume[0-9]/web) echo 'Use a dedicated website subfolder' >&2; exit 1;; esac
case "$SITE_SOURCE" in https://*) ;; *) echo 'HTTPS source required' >&2; exit 1;; esac
[ -d "$DEPLOY_ROOT" ] && [ -w "$DEPLOY_ROOT" ] || { echo 'Document root must exist and be writable' >&2; exit 1; }
LOCK_DIR="$DEPLOY_ROOT/.tpencore-update.lock"
mkdir "$LOCK_DIR" 2>/dev/null || { echo 'Another deployment is running (or stale lock exists)' >&2; exit 1; }
STAGE_DIR=''
cleanup() { [ -z "$STAGE_DIR" ] || rm -rf "$STAGE_DIR"; rmdir "$LOCK_DIR"; }
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
STAGE_DIR=$(mktemp -d /tmp/tpencore-deploy.XXXXXX)
fetch() { curl --fail --silent --show-error --location --proto '=https' --retry 2 --max-time 90 "$1" -o "$2"; }
SITE_SOURCE=${SITE_SOURCE%/}
fetch "$SITE_SOURCE/version.json?nas=$(date +%s)" "$STAGE_DIR/version.json"
# A local schema marker forces the first run of this updater to refresh manually
# installed pages even when the remote release version has not changed.
SYNC_SCHEMA=2
SYNC_COMPLETE=true
for file in index.html index3d.html 2d.html chiang-wan-an.html robots.txt sitemap.xml llms.txt counter.php; do
  [ -s "$DEPLOY_ROOT/$file" ] || SYNC_COMPLETE=false
done
if [ "$(cat "$DEPLOY_ROOT/.tpencore-sync-schema" 2>/dev/null || true)" = "$SYNC_SCHEMA" ] && [ "$SYNC_COMPLETE" = true ] && [ -f "$DEPLOY_ROOT/version.json" ] && cmp -s "$STAGE_DIR/version.json" "$DEPLOY_ROOT/version.json" && [ -s "$DEPLOY_ROOT/index.html" ] && [ -s "$DEPLOY_ROOT/index3d.html" ] && [ -s "$DEPLOY_ROOT/2d.html" ] && [ -s "$DEPLOY_ROOT/counter.php" ]; then
  log 'TPEncore already at the latest published version.'
  exit 0
fi
for file in index.html index3d.html 2d.html chiang-wan-an.html robots.txt sitemap.xml llms.txt site-config.json counter.php.txt; do
  fetch "$SITE_SOURCE/$file?nas=$(date +%s)" "$STAGE_DIR/$file"
  [ -s "$STAGE_DIR/$file" ] || { echo "Empty file: $file" >&2; exit 1; }
done
fetch "$SITE_SOURCE/version.json?nas=$(date +%s)" "$STAGE_DIR/version-check.json"
cmp -s "$STAGE_DIR/version.json" "$STAGE_DIR/version-check.json" || { echo 'Source changed during download; retry next scheduled run' >&2; exit 1; }
for file in index.html index3d.html 2d.html chiang-wan-an.html; do
  grep -qi '<!doctype html>' "$STAGE_DIR/$file" || { echo "Unexpected HTML response: $file" >&2; exit 1; }
done
grep -q '<urlset' "$STAGE_DIR/sitemap.xml" || { echo 'Unexpected sitemap response' >&2; exit 1; }
grep -qi '^User-agent:' "$STAGE_DIR/robots.txt" || { echo 'Unexpected robots response' >&2; exit 1; }
grep -q '^<?php' "$STAGE_DIR/counter.php.txt" || { echo 'Unexpected counter source' >&2; exit 1; }
# Files are staged on the destination filesystem, then renamed atomically.
# Each HTML is self-contained; publishing index last avoids partially written pages.
cp "$STAGE_DIR/counter.php.txt" "$DEPLOY_ROOT/.counter.php.next"
chmod 644 "$DEPLOY_ROOT/.counter.php.next"
mv -f "$DEPLOY_ROOT/.counter.php.next" "$DEPLOY_ROOT/counter.php"
for file in chiang-wan-an.html index3d.html 2d.html robots.txt sitemap.xml llms.txt; do
  cp "$STAGE_DIR/$file" "$DEPLOY_ROOT/.$file.next"
  chmod 644 "$DEPLOY_ROOT/.$file.next"
  mv -f "$DEPLOY_ROOT/.$file.next" "$DEPLOY_ROOT/$file"
done
if [ ! -e "$DEPLOY_ROOT/site-config.json" ]; then
  cp "$STAGE_DIR/site-config.json" "$DEPLOY_ROOT/.site-config.json.next"
  chmod 644 "$DEPLOY_ROOT/.site-config.json.next"
  mv -f "$DEPLOY_ROOT/.site-config.json.next" "$DEPLOY_ROOT/site-config.json"
fi
for file in index.html version.json; do
  cp "$STAGE_DIR/$file" "$DEPLOY_ROOT/.$file.next"
  chmod 644 "$DEPLOY_ROOT/.$file.next"
  mv -f "$DEPLOY_ROOT/.$file.next" "$DEPLOY_ROOT/$file"
done
printf '%s\n' "$SYNC_SCHEMA" > "$DEPLOY_ROOT/.tpencore-sync-schema.next"
mv -f "$DEPLOY_ROOT/.tpencore-sync-schema.next" "$DEPLOY_ROOT/.tpencore-sync-schema"
RELEASE_VERSION=$(sed -n 's/.*"version":[[:space:]]*"\([^"]*\)".*/\1/p' "$STAGE_DIR/version.json")
log "TPEncore updated to $RELEASE_VERSION; local music and existing site-config.json preserved."
