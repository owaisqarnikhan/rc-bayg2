#!/bin/bash
# Fix PostgreSQL Authentication Issues
set -e

echo "🔧 Fixing PostgreSQL Authentication..."

# Stop postgresql
sudo systemctl stop postgresql

# Find PostgreSQL version and config directory
PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP 'PostgreSQL \K[0-9]+' | head -1 2>/dev/null || echo "14")
PG_CONFIG_DIR="/etc/postgresql/$PG_VERSION/main"

echo "PostgreSQL version: $PG_VERSION"
echo "Config directory: $PG_CONFIG_DIR"

# Backup original pg_hba.conf
sudo cp $PG_CONFIG_DIR/pg_hba.conf $PG_CONFIG_DIR/pg_hba.conf.backup

# Create new pg_hba.conf with proper authentication
sudo tee $PG_CONFIG_DIR/pg_hba.conf > /dev/null << 'EOF'
# Database administrative login by Unix domain socket
local   all             postgres                                peer

# TYPE  DATABASE        USER            ADDRESS                 METHOD
# "local" is for Unix domain socket connections only
local   all             all                                     md5
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
# IPv6 local connections:
host    all             all             ::1/128                 md5
# Allow replication connections from localhost, by a user with the
# replication privilege.
local   replication     all                                     peer
host    replication     all             127.0.0.1/32            md5
host    replication     all             ::1/128                 md5
EOF

# Ensure proper permissions
sudo chmod 640 $PG_CONFIG_DIR/pg_hba.conf
sudo chown postgres:postgres $PG_CONFIG_DIR/pg_hba.conf

# Start postgresql
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Wait for PostgreSQL to be ready
sleep 3

echo "PostgreSQL authentication configuration updated!"

# Test postgres connection
sudo -u postgres psql -c "SELECT 'PostgreSQL is working!' as status;"

echo "✅ PostgreSQL authentication fix completed!"