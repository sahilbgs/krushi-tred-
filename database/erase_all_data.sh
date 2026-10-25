#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PG_BIN="/home/gtu-itr/pgsql/usr/lib/postgresql/16/bin"
export LD_LIBRARY_PATH="/home/gtu-itr/pgsql/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"
export PGPASSWORD="password"
$PG_BIN/psql -h 127.0.0.1 -p 5432 -U gtu_admin -d krushi_trade -f "$DIR/erase_data.sql"
echo "✅ All data erased from krushi_trade database successfully!"
