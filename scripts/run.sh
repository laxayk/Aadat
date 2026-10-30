#!/usr/bin/env bash
# One-command local setup and run for the HabitCanvas backend.
set -euo pipefail
cd "$(dirname "$0")/../backend"
docker compose up -d
npm install
npm run migrate
npm run dev
