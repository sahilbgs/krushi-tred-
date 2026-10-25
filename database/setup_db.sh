#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PG_BIN="/home/gtu-itr/pgsql/usr/lib/postgresql/16/bin"
export LD_LIBRARY_PATH="/home/gtu-itr/pgsql/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"
export PGPASSWORD="password"
DB_NAME="krushi_trade"
DB_USER="gtu_admin"
DB_HOST="127.0.0.1"
DB_PORT="5432"

echo "=========================================="
echo "🌱 Krushi Trade - PostgreSQL Setup"
echo "=========================================="

echo "1. Checking/Creating database $DB_NAME..."
$PG_BIN/psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
$PG_BIN/psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME WITH OWNER = $DB_USER ENCODING = 'UTF8';"

echo "2. Applying Schema ($DIR/schema.sql)..."
$PG_BIN/psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$DIR/schema.sql"

echo "3. Populating Seed Data ($DIR/seed_data.sql)..."
$PG_BIN/psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$DIR/seed_data.sql"

echo "4. Verification & Tables Count:"
$PG_BIN/psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt"

echo "5. Verifying Views:"
$PG_BIN/psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dv"

echo "=========================================="
echo "✅ PostgreSQL Database '$DB_NAME' Setup Complete!"
echo "=========================================="
