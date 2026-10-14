#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env.prod ]]; then
  echo "Missing .env.prod. Create it before starting production."
  exit 1
fi

mkdir -p storage/prod/images storage/prod/thumbnails

sudo docker compose \
  --project-name image-host-prod \
  --env-file .env.prod \
  -f compose.yaml \
  -f compose.prod.yaml \
  config --quiet

sudo docker compose \
  --project-name image-host-prod \
  --env-file .env.prod \
  -f compose.yaml \
  -f compose.prod.yaml \
  up -d --build
