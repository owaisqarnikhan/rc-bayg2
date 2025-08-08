#!/bin/bash
# BAYG E-commerce Platform - Complete Deployment Fix
# This script completely fixes all deployment issues

set -e

echo "🔧 Complete BAYG E-commerce Platform Fix..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Stop all PM2 processes
print_status "Stopping all processes..."
pm2 stop all || true
pm2 delete all || true

# Navigate to project directory
cd /home/ubuntu/bayg-ecommerce

# STEP 1: Completely fix PostgreSQL database
print_status "Completely fixing PostgreSQL database..."

# Stop postgresql to ensure clean state
sudo systemctl stop postgresql

# Remove existing data and restart fresh
sudo -u postgres dropdb bayg_production || true
sudo -u postgres dropuser bayg_user || true

# Start postgresql
sudo systemctl start postgresql

# Create database and user fresh
sudo -u postgres psql << 'EOF'
-- Create user first
CREATE USER bayg_user WITH PASSWORD 'BaygSecure2024!';

-- Create database
CREATE DATABASE bayg_production OWNER bayg_user;

-- Grant all privileges
ALTER USER bayg_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE bayg_production TO bayg_user;

-- Connect to the database
\c bayg_production

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO bayg_user;
ALTER SCHEMA public OWNER TO bayg_user;

-- Set default privileges
ALTER DEFAULT PRIVILEGES FOR ROLE bayg_user IN SCHEMA public GRANT ALL ON TABLES TO bayg_user;
ALTER DEFAULT PRIVILEGES FOR ROLE bayg_user IN SCHEMA public GRANT ALL ON SEQUENCES TO bayg_user;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Test connection
SELECT 'Database setup completed!' as status;
\q
EOF

print_status "Database recreated successfully!"

# STEP 2: Test database connection manually
print_status "Testing database connection..."
sudo -u postgres psql -d bayg_production -c "SELECT current_user, current_database();"

# Test with the actual connection string
export PGPASSWORD='BaygSecure2024!'
psql -h localhost -U bayg_user -d bayg_production -c "SELECT 'Connection successful!' as status;" || {
    print_error "Database connection still failing. Fixing pg_hba.conf..."
    
    # Fix pg_hba.conf to allow password authentication
    sudo sed -i 's/local   all             all                                     peer/local   all             all                                     md5/g' /etc/postgresql/*/main/pg_hba.conf
    sudo sed -i 's/local   all             all                                     ident/local   all             all                                     md5/g' /etc/postgresql/*/main/pg_hba.conf
    
    # Restart PostgreSQL
    sudo systemctl restart postgresql
    
    # Test again
    sleep 3
    psql -h localhost -U bayg_user -d bayg_production -c "SELECT 'Connection successful!' as status;"
}

unset PGPASSWORD

# STEP 3: Create proper environment file
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
print_status "Environment file created!"

# STEP 4: Test database with Node.js
print_status "Testing database with Node.js..."
export $(cat .env | xargs)

node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW() as current_time, current_user, current_database()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connection successful!');
    console.log('Current time:', res.rows[0].current_time);
    console.log('User:', res.rows[0].current_user);
    console.log('Database:', res.rows[0].current_database);
    pool.end();
  }
});
" || {
    print_error "Node.js database connection failed. Check your installation."
    exit 1
}

# STEP 5: Push database schema
print_status "Pushing database schema..."
npm run db:push || {
    print_error "Database schema push failed"
    exit 1
}

# STEP 6: Seed database
print_status "Seeding database..."
npx tsx server/seed-comprehensive-permissions.ts || {
    print_error "Database seeding failed"
    exit 1
}

# STEP 7: Create required directories
print_status "Creating directories..."
mkdir -p uploads logs
chmod 755 uploads logs

# STEP 8: Create ecosystem.config.cjs if it doesn't exist
if [ ! -f "ecosystem.config.cjs" ]; then
    print_status "Creating PM2 configuration file..."
    cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'bayg-ecommerce',
    script: 'npm',
    args: 'start',
    cwd: '/home/ubuntu/bayg-ecommerce',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    max_memory_restart: '1G',
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    kill_timeout: 3000,
    listen_timeout: 3000,
    source_map_support: true,
    merge_logs: true,
    autorestart: true,
    exp_backoff_restart_delay: 100
  }]
};
EOF
fi

# STEP 9: Test application build
print_status "Testing application build..."
npm run build || {
    print_error "Build failed"
    exit 1
}

# STEP 10: Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.cjs --env production

# Wait for application to start
sleep 10

# STEP 11: Test application
print_status "Testing application response..."
for i in {1..30}; do
    if curl -s http://localhost:5000 > /dev/null; then
        print_status "✅ Application is running successfully!"
        break
    else
        echo "Waiting for application to start... ($i/30)"
        sleep 2
        if [ $i -eq 30 ]; then
            print_error "❌ Application failed to start after 60 seconds"
            print_status "Checking logs..."
            pm2 logs bayg-ecommerce --lines 20
            exit 1
        fi
    fi
done

# STEP 12: Configure and test Nginx
print_status "Configuring Nginx..."

# Create Nginx configuration if it doesn't exist
if [ ! -f "nginx.conf" ]; then
    cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name 3.136.95.83;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF
fi

# Install Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/bayg
sudo ln -sf /etc/nginx/sites-available/bayg /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t || {
    print_error "Nginx configuration test failed"
    exit 1
}

sudo systemctl restart nginx
sudo systemctl enable nginx

# STEP 13: Final verification
print_status "Final verification..."
pm2 save
pm2 startup ubuntu -u ubuntu --hp /home/ubuntu || true

# Test full stack
sleep 5

print_status "Testing full application stack..."
if curl -s http://localhost > /dev/null; then
    print_status "✅ Full stack is working!"
else
    print_error "❌ Nginx proxy not working"
    sudo tail -20 /var/log/nginx/error.log
fi

# Show final status
echo ""
print_status "🎉 Complete fix completed!"
echo ""
print_status "Your BAYG E-commerce Platform is now running at:"
echo -e "${GREEN}http://3.136.95.83${NC}"
echo ""
print_status "PM2 Status:"
pm2 status
echo ""
print_status "Recent Application Logs:"
pm2 logs bayg-ecommerce --lines 10 --nostream
echo ""
print_status "Default login credentials:"
echo "- Admin: admin@test.com / admin123"
echo "- Manager: manager@test.com / manager123"
echo "- User: john@test.com / user123"
echo ""
print_status "Monitoring commands:"
echo "- pm2 logs bayg-ecommerce"
echo "- pm2 restart bayg-ecommerce"
echo "- pm2 status"
echo ""
print_status "Complete fix finished! 🚀"