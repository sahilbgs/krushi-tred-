#!/bin/bash
export PATH="/home/gtu-itr/tools/node/bin:$PATH"
echo "Stopping krushi-trade-web..."
pm2 stop krushi-trade-web
pm2 save
pm2 status
