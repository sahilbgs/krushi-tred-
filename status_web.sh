#!/bin/bash
export PATH="/home/gtu-itr/tools/node/bin:$PATH"
pm2 status
curl -s -I http://localhost:3000/ | head -n 5
