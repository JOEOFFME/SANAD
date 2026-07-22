#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_PYTHON="$ROOT_DIR/venv/bin/python"
FRONTEND_DIR="$ROOT_DIR/frontend"
LOG_DIR="$ROOT_DIR/logs"
POSTGRES_CONTAINER="sanad-postgres"

declare -a SERVICE_PIDS=()
declare -a SERVICE_NAMES=()

info() {
  printf '[SANAD] %s\n' "$*"
}

fail() {
  printf '[SANAD] ERROR: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  local index pid
  trap - INT TERM EXIT
  if ((${#SERVICE_PIDS[@]})); then
    info "Stopping services started by this script..."
    for index in "${!SERVICE_PIDS[@]}"; do
      pid="${SERVICE_PIDS[$index]}"
      if kill -0 "$pid" 2>/dev/null; then
        info "Stopping ${SERVICE_NAMES[$index]} (PID $pid)"
        kill -TERM -- "-$pid" 2>/dev/null || true
      fi
    done
    wait "${SERVICE_PIDS[@]}" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

command -v docker >/dev/null 2>&1 || fail "Docker is not installed."
command -v npm >/dev/null 2>&1 || fail "npm is not installed."
command -v curl >/dev/null 2>&1 || fail "curl is not installed."
[[ -x "$VENV_PYTHON" ]] || fail "Python environment not found at $VENV_PYTHON"
[[ -f "$ROOT_DIR/.env" ]] || fail "Missing $ROOT_DIR/.env"
[[ -d "$FRONTEND_DIR/node_modules" ]] || fail "Run 'cd frontend && npm install' first."

mkdir -p "$LOG_DIR"
cd "$ROOT_DIR"

if docker info >/dev/null 2>&1; then
  DOCKER=(docker)
else
  info "Docker requires administrator access."
  sudo -v
  DOCKER=(sudo docker)
fi

if ! "${DOCKER[@]}" container inspect "$POSTGRES_CONTAINER" >/dev/null 2>&1; then
  fail "Container '$POSTGRES_CONTAINER' does not exist. Create it before running SANAD."
fi

if [[ "$("${DOCKER[@]}" inspect -f '{{.State.Running}}' "$POSTGRES_CONTAINER")" != "true" ]]; then
  info "Starting PostgreSQL..."
  "${DOCKER[@]}" start "$POSTGRES_CONTAINER" >/dev/null
else
  info "PostgreSQL is already running."
fi

info "Waiting for PostgreSQL..."
for _ in {1..30}; do
  if "${DOCKER[@]}" exec "$POSTGRES_CONTAINER" pg_isready -U sanad -d sanaddb >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
"${DOCKER[@]}" exec "$POSTGRES_CONTAINER" pg_isready -U sanad -d sanaddb >/dev/null 2>&1 \
  || fail "PostgreSQL did not become ready within 30 seconds."

ASSET_COUNT="$($VENV_PYTHON - <<'PY'
from app import models
from app.database import Base, SessionLocal, engine
from app.models import Asset

Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    print(db.query(Asset).count())
PY
)"

if [[ "$ASSET_COUNT" == "0" ]]; then
  info "Empty database detected; loading SANAD assets and topology..."
  "$VENV_PYTHON" -m clients.sanad.seed
else
  info "Database ready ($ASSET_COUNT assets); preserving existing history."
fi

start_service() {
  local name="$1"
  shift
  local log_file="$LOG_DIR/$name.log"

  : >"$log_file"
  setsid "$@" >"$log_file" 2>&1 &
  local pid=$!
  SERVICE_PIDS+=("$pid")
  SERVICE_NAMES+=("$name")
  sleep 1
  if ! kill -0 "$pid" 2>/dev/null; then
    printf '\n' >&2
    tail -n 30 "$log_file" >&2 || true
    fail "$name failed to start."
  fi
  info "Started $name (PID $pid, log: $log_file)"
}

if curl --silent --fail http://localhost:8000/health >/dev/null 2>&1; then
  info "Backend is already running at http://localhost:8000"
else
  start_service backend "$VENV_PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
fi

if curl --silent --fail http://localhost:3000 >/dev/null 2>&1; then
  info "Frontend is already running at http://localhost:3000"
else
  start_service frontend npm --prefix "$FRONTEND_DIR" run dev
fi

if pgrep -f '[d]ata.mqtt.machine2_subscriber' >/dev/null 2>&1; then
  info "MQTT subscriber is already running."
else
  start_service subscriber "$VENV_PYTHON" -m data.mqtt.machine2_subscriber
fi

info "SANAD is ready: http://localhost:3000"
info "Backend API: http://localhost:8000"

if ((${#SERVICE_PIDS[@]} == 0)); then
  info "All services were already running; nothing new to supervise."
  exit 0
fi

info "Press Ctrl+C to stop services started by this script."
wait -n "${SERVICE_PIDS[@]}" || true

for index in "${!SERVICE_PIDS[@]}"; do
  if ! kill -0 "${SERVICE_PIDS[$index]}" 2>/dev/null; then
    info "${SERVICE_NAMES[$index]} stopped. See $LOG_DIR/${SERVICE_NAMES[$index]}.log"
  fi
done
