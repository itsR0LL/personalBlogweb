#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="/srv/personalblogweb"
RELEASES_DIR="$APP_ROOT/releases"
SHARED_DIR="$APP_ROOT/shared"
LOG_DIR="$APP_ROOT/logs"
CURRENT_LINK="$APP_ROOT/current"
CONTENT_ROOT="$SHARED_DIR/content"
CONTENT_RELEASES_DIR="$CONTENT_ROOT/releases"
CONTENT_CURRENT_LINK="$CONTENT_ROOT/current"
REPO_URL="https://github.com/itsR0LL/personalBlogweb.git"
BRANCH="main"
KEEP_RELEASES=5
NODE_IMAGE="docker.m.daocloud.io/library/node:22-bookworm-slim"
HEALTH_URL="http://127.0.0.1:13000/"

usage() {
  cat <<'EOF'
Usage:
  personalblogweb-deploy deploy
  personalblogweb-deploy status
  personalblogweb-deploy content-status
  personalblogweb-deploy content-activate /tmp/content-bundle-dir
EOF
}

log() {
  printf '[personalblogweb-deploy] %s\n' "$*"
}

ensure_layout() {
  mkdir -p "$RELEASES_DIR" "$SHARED_DIR" "$LOG_DIR"
  mkdir -p "$CONTENT_RELEASES_DIR"
  touch "$SHARED_DIR/.env.production"
  chmod 600 "$SHARED_DIR/.env.production"

  if ! docker network inspect personalblogweb_net >/dev/null 2>&1; then
    docker network create personalblogweb_net >/dev/null
  fi
}

status() {
  ensure_layout
  log "current=$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)"
  log "content_current=$(readlink -f "$CONTENT_CURRENT_LINK" 2>/dev/null || true)"
  docker ps --filter name=personalblogweb --format 'container={{.Names}} image={{.Image}} status={{.Status}} ports={{.Ports}}'
  if curl -fsS --max-time 5 "$HEALTH_URL" >/dev/null; then
    log "health=ok url=$HEALTH_URL"
  else
    log "health=failed url=$HEALTH_URL"
    return 1
  fi
}

content_status() {
  ensure_layout
  local current_path
  current_path="$(readlink -f "$CONTENT_CURRENT_LINK" 2>/dev/null || true)"
  python3 - "$CONTENT_CURRENT_LINK" "$current_path" <<'PY'
import datetime
import json
import pathlib
import sys

link = pathlib.Path(sys.argv[1])
current_path = sys.argv[2] or None
manifest_path = link / "manifest.json"
payload = {
    "success": manifest_path.exists(),
    "currentPath": current_path,
    "checkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
}

if manifest_path.exists():
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    payload.update({
        "manifest": manifest,
        "contentVersion": manifest.get("contentVersion"),
        "exportedAt": manifest.get("exportedAt"),
        "schemaVersion": manifest.get("schemaVersion"),
    })
else:
    payload["message"] = "content bundle is not active"

print(json.dumps(payload, ensure_ascii=False))
raise SystemExit(0 if payload["success"] else 1)
PY
}

validate_content_bundle() {
  local source_dir="$1"
  [[ -d "$source_dir" ]] || { log "content source is not a directory: $source_dir"; return 1; }
  [[ -f "$source_dir/manifest.json" ]] || { log "missing manifest.json"; return 1; }
  [[ -f "$source_dir/site.json" ]] || { log "missing site.json"; return 1; }
  [[ -f "$source_dir/albums.json" ]] || { log "missing albums.json"; return 1; }
  [[ -f "$source_dir/projects.json" ]] || { log "missing projects.json"; return 1; }
  [[ -f "$source_dir/friends.json" ]] || { log "missing friends.json"; return 1; }
  [[ -f "$source_dir/music.json" ]] || { log "missing music.json"; return 1; }
  python3 - "$source_dir" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
for name in ["manifest.json", "site.json", "albums.json", "projects.json", "friends.json", "music.json"]:
    with (root / name).open("r", encoding="utf-8") as f:
        json.load(f)
manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
if manifest.get("schemaVersion") != 1:
    raise SystemExit("unsupported schemaVersion")
PY
}

activate_content() {
  ensure_layout
  local source_dir="${1:-}"
  if [[ -z "$source_dir" ]]; then
    log "missing content bundle path"
    return 2
  fi
  validate_content_bundle "$source_dir"

  local version
  version="$(python3 - "$source_dir" <<'PY'
import json, pathlib, sys
root = pathlib.Path(sys.argv[1])
manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
print(manifest["contentVersion"])
PY
)"
  version="${version//[^A-Za-z0-9._-]/-}"
  local release_dir="$CONTENT_RELEASES_DIR/$version"
  rm -rf "$release_dir"
  mkdir -p "$release_dir"
  cp -a "$source_dir"/. "$release_dir"/
  rm -rf "$CONTENT_CURRENT_LINK"
  ln -sfn "$release_dir" "$CONTENT_CURRENT_LINK"
  log "content activated: $release_dir"
}

restore_previous() {
  local previous_release="$1"
  if [[ -n "$previous_release" && -d "$previous_release/deploy" ]]; then
    log "restoring previous release: $previous_release"
    docker compose -f "$previous_release/deploy/docker-compose.server.yml" up -d --build --remove-orphans
    ln -sfn "$previous_release" "$CURRENT_LINK"
  fi
}

prune_old_releases() {
  find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d \
    | sort -r \
    | tail -n +$((KEEP_RELEASES + 1)) \
    | while read -r old_release; do
        log "pruning old release: $old_release"
        rm -rf "$old_release"
      done
}

deploy() {
  ensure_layout

  local previous_release=""
  previous_release="$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)"

  local release_id
  release_id="$(date +%Y%m%d-%H%M%S)"
  local release_dir="$RELEASES_DIR/$release_id"

  log "cloning $REPO_URL#$BRANCH -> $release_dir"
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$release_dir"

  if [[ ! -f "$release_dir/deploy/docker-compose.server.yml" ]]; then
    log "missing deploy/docker-compose.server.yml in release"
    rm -rf "$release_dir"
    return 1
  fi

  log "building and restarting Docker container"
  local app_commit
  app_commit="$(git -C "$release_dir" rev-parse HEAD)"
  local app_build_time
  app_build_time="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  APP_COMMIT="$app_commit" APP_BUILD_TIME="$app_build_time" NODE_IMAGE="$NODE_IMAGE" docker compose -f "$release_dir/deploy/docker-compose.server.yml" up -d --build --remove-orphans

  log "checking health"
  local ok="false"
  for _ in $(seq 1 20); do
    if curl -fsS --max-time 5 "$HEALTH_URL" >/dev/null; then
      ok="true"
      break
    fi
    sleep 2
  done

  if [[ "$ok" != "true" ]]; then
    log "health check failed"
    restore_previous "$previous_release"
    return 1
  fi

  ln -sfn "$release_dir" "$CURRENT_LINK"
  prune_old_releases
  log "deploy complete: $release_dir"
}

main() {
  case "${1:-}" in
    deploy)
      deploy
      ;;
    status)
      status
      ;;
    content-status)
      content_status
      ;;
    content-activate)
      activate_content "${2:-}"
      ;;
    *)
      usage
      exit 2
      ;;
  esac
}

main "$@"
