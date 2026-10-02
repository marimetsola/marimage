#!/bin/bash
set -e

sudo docker compose \
  --env-file .env.prod \
  -f compose.yaml \
  -f compose.prod.yaml \
  up -d --build
