#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="/srv/personalblogweb"
RELEASES_DIR="$APP_ROOT/releases"
SHARED_DIR="$APP_ROOT/shared"
LOG_DIR="$APP_ROOT/logs"
CURRENT_LINK="$APP_ROOT/current"
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
EOF
}

log() {
  printf '[personalblogweb-deploy] %s\n' "$*"
}

ensure_layout() {
  mkdir -p "$RELEASES_DIR" "$SHARED_DIR" "$LOG_DIR"
  touch "$SHARED_DIR/.env.production"
  chmod 600 "$SHARED_DIR/.env.production"

  if ! docker network inspect personalblogweb_net >/dev/null 2>&1; then
    docker network create personalblogweb_net >/dev/null
  fi
}

status() {
  ensure_layout
  log "current=$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)"
  docker ps --filter name=personalblogweb --format 'container={{.Names}} image={{.Image}} status={{.Status}} ports={{.Ports}}'
  if curl -fsS --max-time 5 "$HEALTH_URL" >/dev/null; then
    log "health=ok url=$HEALTH_URL"
  else
    log "health=failed url=$HEALTH_URL"
    return 1
  fi
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
  NODE_IMAGE="$NODE_IMAGE" docker compose -f "$release_dir/deploy/docker-compose.server.yml" up -d --build --remove-orphans

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
    *)
      usage
      exit 2
      ;;
  esac
}

main "$@"
