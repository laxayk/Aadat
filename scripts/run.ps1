# One-command local setup and run for the Aadat backend (Windows PowerShell).
# Starts PostgreSQL in Docker, applies migrations, runs the API on http://localhost:8081.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $root 'backend')
docker compose up -d
npm install
npm run migrate
npm run dev
