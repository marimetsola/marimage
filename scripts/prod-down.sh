#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

sudo docker compose \
  --project-name image-host-prod \
  --env-file .env.prod \
  -f compose.yaml \
  -f compose.prod.yaml \
  down
