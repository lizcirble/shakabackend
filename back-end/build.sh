#!/bin/bash
# Render build script that handles missing pnpm-lock.yaml

if [ ! -f "pnpm-lock.yaml" ]; then
  echo "No pnpm-lock.yaml found, using npm instead..."
  npm install
else
  pnpm install --frozen-lockfile
fi
