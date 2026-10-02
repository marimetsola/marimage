#!/bin/bash
set -e

sudo docker compose \
  --env-file .env.dev \
  -f compose.yaml \
  -f compose.dev.yaml \
  down
