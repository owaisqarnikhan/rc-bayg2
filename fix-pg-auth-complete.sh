#!/bin/bash
# Complete PostgreSQL Authentication Fix
set -e

echo "🔧 Complete PostgreSQL Authentication Fix..."

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Stop all processes first
pm2 stop all || true
pm2 delete all || true

# Find PostgreSQL version
PG_VERSION=$(ls /etc/postgresql/ | head -1)
PG_CONFIG_DIR="/etc/postgresql/$PG_VERSION/main"

print_status "PostgreSQL version: $PG_VERSION"
print_status "Config directory: $PG_CONFIG_DIR"

# Stop PostgreSQL service
print_status "Stopping PostgreSQL..."
sudo systemctl stop postgresql

# Backup and replace pg_hba.conf with working configuration
print_status "Fixing pg_hba.conf configuration..."
sudo cp $PG_CONFIG_DIR/pg_hba.conf $PG_CONFIG_DIR/pg_hba.conf.backup.$(date +%Y%m%d_%H%M%S)

# Create new pg_hba.conf that allows password authentication
sudo tee $PG_CONFIG_DIR/pg_hba.conf > /dev/null << 'EOF'
# PostgreSQL Client Authentication Configuration File
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Database administrative login by Unix domain socket
local   all             postgres                                peer

# TYPE  DATABASE        USER            ADDRESS                 METHOD
# "local" is for Unix domain socket connections only
local   all             all                                     md5
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
host    all             all             0.0.0.0/0               md5
# IPv6 local connections:
host    all             all             ::1/128                 md5

# Allow replication connections from localhost, by a user with the
# replication privilege.
local   replication     all                                     peer
host    replication     all             127.0.0.1/32            md5
host    replication     all             ::1/128                 md5
EOF

# Set proper permissions
sudo chmod 640 $PG_CONFIG_DIR/pg_hba.conf
sudo chown postgres:postgres $PG_CONFIG_DIR/pg_hba.conf

# Also update postgresql.conf to ensure password authentication is enabled
sudo sed -i "s/#password_encryption = .*/password_encryption = md5/" $PG_CONFIG_DIR/postgresql.conf
sudo sed -i "s/#listen_addresses = .*/listen_addresses = 'localhost'/" $PG_CONFIG_DIR/postgresql.conf

# Start PostgreSQL
print_status "Starting PostgreSQL with new configuration..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Wait for PostgreSQL to be fully ready
sleep 5

# Test postgres user connection
print_status "Testing postgres connection..."
sudo -u postgres psql -c "SELECT 'PostgreSQL is ready!' as status;"

# Force recreate user with proper password
print_status "Recreating database user with proper authentication..."
sudo -u postgres psql << 'EOF'
-- Drop user if exists (cascade to remove dependencies)
DROP DATABASE IF EXISTS bayg_production CASCADE;
DROP USER IF EXISTS bayg_user;

-- Create user with encrypted password
CREATE USER bayg_user WITH ENCRYPTED PASSWORD 'BaygSecure2024!';

-- Give user superuser privileges temporarily to create database
ALTER USER bayg_user CREATEDB CREATEROLE;

-- Create database owned by the user
CREATE DATABASE bayg_production OWNER bayg_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE bayg_production TO bayg_user;

-- Connect to database as postgres user
\c bayg_production postgres

-- Grant all schema privileges
GRANT ALL ON SCHEMA public TO bayg_user;
ALTER SCHEMA public OWNER TO bayg_user;

-- Set default privileges
ALTER DEFAULT PRIVILEGES FOR ROLE bayg_user IN SCHEMA public GRANT ALL ON TABLES TO bayg_user;
ALTER DEFAULT PRIVILEGES FOR ROLE bayg_user IN SCHEMA public GRANT ALL ON SEQUENCES TO bayg_user;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify user can connect
\c bayg_production bayg_user

SELECT 'User connection successful!' as status;

-- Show connection info
\conninfo

\q
EOF

# Test the actual connection string
print_status "Testing connection with actual credentials..."
export PGPASSWORD='BaygSecure2024!'

# Test connection multiple ways
psql -h localhost -U bayg_user -d bayg_production -c "SELECT 'Direct connection successful!' as status, current_user, current_database();"

# Test with full connection string
psql "postgresql://bayg_user:BaygSecure2024!@localhost:5432/bayg_production" -c "SELECT 'Connection string test successful!' as status;"

unset PGPASSWORD

print_status "✅ PostgreSQL authentication completely fixed!"

# Now fix the application
cd /home/ubuntu/bayg-ecommerce

# Create environment file
print_status "Creating environment file..."
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
print_status "Testing Node.js database connection..."
export $(cat .env | xargs)

node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW() as time, current_user as user, current_database() as db', (err, res) => {
  if (err) {
    console.error('❌ Node.js connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Node.js connection successful!');
    console.log('Time:', res.rows[0].time);
    console.log('User:', res.rows[0].user);
    console.log('Database:', res.rows[0].db);
    pool.end();
  }
});
"

# Push database schema
print_status "Pushing database schema..."
npm run db:push

# Seed database
print_status "Seeding database..."
npx tsx server/seed-comprehensive-permissions.ts

# Create directories
mkdir -p uploads logs
chmod 755 uploads logs

# Start application
print_status "Starting application with PM2..."
pm2 start ecosystem.config.cjs --env production

# Wait and test
sleep 10

print_status "Testing application..."
if curl -s http://localhost:5000 > /dev/null; then
    print_status "✅ Application is running!"
    pm2 status
else
    print_error "❌ Application not responding"
    pm2 logs bayg-ecommerce --lines 20
fi

print_status "🎉 Complete PostgreSQL authentication fix finished!"
print_status "Your application should now be accessible at: http://3.136.95.83"