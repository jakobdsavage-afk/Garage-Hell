#!/bin/zsh
cd "$(dirname "$0")" || exit 1

URL="http://127.0.0.1:5173/"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm was not found. Install Node.js first: https://nodejs.org/"
  read -k 1 "?Press any key to close..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installing Garage Hell dependencies..."
  npm install || {
    read -k 1 "?Install failed. Press any key to close..."
    exit 1
  }
fi

echo "Opening Garage Hell at $URL"
open "$URL"
echo "Starting local server. Keep this window open while playing."
npm run dev -- --port 5173
