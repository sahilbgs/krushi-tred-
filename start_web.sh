#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/web"
export PATH="/home/gtu-itr/tools/node/bin:$PATH"

cd "$DIR/server"
if pm2 list | grep -q "krushi-trade-api"; then
  echo "Restarting krushi-trade-api..."
  pm2 restart krushi-trade-api
else
  echo "Starting krushi-trade-api on port 5005..."
  pm2 start index.js --name "krushi-trade-api"
fi

cd "$DIR/web"
npm run build
if pm2 list | grep -q "krushi-trade-web"; then
  echo "Restarting krushi-trade-web (preview mode)..."
  pm2 restart krushi-trade-web
else
  echo "Starting krushi-trade-web on port 3000 (preview mode)..."
  pm2 start npm --name "krushi-trade-web" -- run preview
fi
pm2 save
pm2 status
