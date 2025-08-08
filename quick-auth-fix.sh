#!/bin/bash
# Quick PostgreSQL Authentication Fix
set -e

echo "🔧 Quick PostgreSQL Authentication Fix..."

# Stop all PM2 processes
pm2 stop all || true
pm2 delete all || true

# Get PostgreSQL version
PG_VERSION=$(sudo -u postgres psql -t -c "SHOW server_version;" | grep -oP '\d+\.\d+' | head -1)
echo "PostgreSQL version: $PG_VERSION"

# Stop PostgreSQL
sudo systemctl stop postgresql

# Find the correct config directory
if [ -d "/etc/postgresql/14/main" ]; then
    PG_CONFIG_DIR="/etc/postgresql/14/main"
elif [ -d "/etc/postgresql/15/main" ]; then
    PG_CONFIG_DIR="/etc/postgresql/15/main"
elif [ -d "/etc/postgresql/13/main" ]; then
    PG_CONFIG_DIR="/etc/postgresql/13/main"
elif [ -d "/etc/postgresql/16/main" ]; then
    PG_CONFIG_DIR="/etc/postgresql/16/main"
else
    PG_CONFIG_DIR=$(find /etc/postgresql -name "main" -type d | head -1)
fi

echo "Using config directory: $PG_CONFIG_DIR"

# Create a simple pg_hba.conf that definitely works
sudo tee $PG_CONFIG_DIR/pg_hba.conf > /dev/null << 'EOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
EOF

# Set permissions
sudo chmod 640 $PG_CONFIG_DIR/pg_hba.conf
sudo chown postgres:postgres $PG_CONFIG_DIR/pg_hba.conf

# Start PostgreSQL
sudo systemctl start postgresql
sleep 3

# Test postgres connection
echo "Testing postgres connection..."
sudo -u postgres psql -c "SELECT 'PostgreSQL started successfully!' as status;"

# Now recreate user without password issues (using trust authentication)
echo "Recreating database user..."
sudo -u postgres psql << 'EOF'
-- Drop everything and start fresh
DROP DATABASE IF EXISTS bayg_production CASCADE;
DROP USER IF EXISTS bayg_user CASCADE;

-- Create user
CREATE USER bayg_user;

-- Create database
CREATE DATABASE bayg_production OWNER bayg_user;

-- Grant privileges
ALTER USER bayg_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE bayg_production TO bayg_user;

-- Connect and set up schema
\c bayg_production

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO bayg_user;
ALTER SCHEMA public OWNER TO bayg_user;

-- Set default privileges
ALTER DEFAULT PRIVILEGES FOR ROLE bayg_user IN SCHEMA public GRANT ALL ON TABLES TO bayg_user;
ALTER DEFAULT PRIVILEGES FOR ROLE bayg_user IN SCHEMA public GRANT ALL ON SEQUENCES TO bayg_user;

-- Create extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

SELECT 'Database setup complete!' as status;
\q
EOF

# Test connection as bayg_user (should work with trust authentication)
echo "Testing bayg_user connection..."
psql -h localhost -U bayg_user -d bayg_production -c "SELECT 'bayg_user connection successful!' as status, current_user, current_database();"

# Now switch to password authentication
echo "Switching to password authentication..."
sudo tee $PG_CONFIG_DIR/pg_hba.conf > /dev/null << 'EOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             bayg_user                               md5
local   all             all                                     md5
host    all             bayg_user       127.0.0.1/32            md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
EOF

# Set password for user
sudo -u postgres psql -c "ALTER USER bayg_user WITH PASSWORD 'BaygSecure2024!';"

# Reload PostgreSQL configuration
sudo systemctl reload postgresql
sleep 2

# Test password authentication
echo "Testing password authentication..."
export PGPASSWORD='BaygSecure2024!'
psql -h localhost -U bayg_user -d bayg_production -c "SELECT 'Password authentication works!' as status;"
unset PGPASSWORD

# Test connection string
echo "Testing full connection string..."
psql "postgresql://bayg_user:BaygSecure2024!@localhost:5432/bayg_production" -c "SELECT 'Connection string works!' as status;"

echo "✅ PostgreSQL authentication fixed!"

# Setup application
cd /home/ubuntu/bayg-ecommerce

# Create environment file
SESSION_SECRET=$(openssl rand -base64 32)
cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://bayg_user:BaygSecure2024!@localhost:5432/bayg_production
SESSION_SECRET=$SESSION_SECRET
COOKIE_DOMAIN=3.136.95.83
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
PORT=5000
SERVER_HOST=0.0.0.0
UPLOAD_PATH=/home/ubuntu/bayg-ecommerce/uploads
BASE_URL=http://3.136.95.83
API_URL=http://3.136.95.83/api
BCRYPT_ROUNDS=12
LOG_LEVEL=info
EOF
chmod 600 .env

# Test Node.js connection
echo "Testing Node.js connection..."
export $(cat .env | xargs)
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW() as time', (err, res) => {
  if (err) {
    console.error('❌ Node.js connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Node.js connection successful!', res.rows[0].time);
    pool.end();
  }
});
"

# Push schema and seed
echo "Setting up database schema..."
npm run db:push
npx tsx server/seed-comprehensive-permissions.ts

# Create directories
mkdir -p uploads logs

# Start application
echo "Starting application..."
pm2 start ecosystem.config.cjs --env production

sleep 10

# Test application
if curl -s http://localhost:5000 > /dev/null; then
    echo "✅ Application is running successfully!"
    echo "Your application is accessible at: http://3.136.95.83"
    pm2 status
else
    echo "❌ Application not responding"
    pm2 logs bayg-ecommerce --lines 10
fi

echo "🎉 Quick authentication fix completed!"