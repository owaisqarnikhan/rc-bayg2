#!/bin/bash
# BAYG E-commerce Platform - Deployment Fix Script
# This script fixes common deployment issues on AWS EC2 Ubuntu

set -e  # Exit on any error

echo "🔧 Fixing BAYG E-commerce Platform Deployment Issues..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Navigate to project directory
cd /home/ubuntu/bayg-ecommerce

# Stop any running processes
print_status "Stopping existing processes..."
pm2 stop all || true
pm2 delete all || true

# Fix PostgreSQL database user issue
print_status "Fixing PostgreSQL database setup..."

# Drop and recreate database and user with correct permissions
sudo -u postgres psql << 'EOF'
-- Drop existing database and user if they exist
DROP DATABASE IF EXISTS bayg_production;
DROP USER IF EXISTS bayg_user;

-- Create database and user
CREATE DATABASE bayg_production;
CREATE USER bayg_user WITH ENCRYPTED PASSWORD 'BaygSecure2024!';

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE bayg_production TO bayg_user;
ALTER DATABASE bayg_production OWNER TO bayg_user;

-- Connect to database and grant schema privileges
\c bayg_production

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO bayg_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bayg_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bayg_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bayg_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO bayg_user;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
EOF

print_status "Database setup completed successfully!"

# Fix environment file with correct DATABASE_URL
print_status "Fixing environment configuration..."
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
print_status "Environment file updated successfully!"

# Test database connection
print_status "Testing database connection..."
export $(cat .env | xargs)

# Verify database connection with node
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('Database connection successful:', res.rows[0]);
    pool.end();
  }
});
"

# Push database schema
print_status "Pushing database schema..."
npm run db:push

# Seed database with initial data and permissions
print_status "Seeding database with initial data..."
npx tsx server/seed-comprehensive-permissions.ts

# Create required directories
print_status "Creating required directories..."
mkdir -p uploads logs
chmod 755 uploads logs

# Fix PM2 configuration and start application
print_status "Starting application with PM2..."

# Test PM2 configuration
pm2 start ecosystem.config.js --env production --no-daemon &
sleep 5
pm2 stop bayg-ecommerce || true

# Start normally
pm2 start ecosystem.config.js --env production
pm2 save

# Test application response
print_status "Testing application response..."
sleep 10

if curl -s http://localhost:5000 > /dev/null; then
    print_status "✅ Application is running successfully!"
    
    # Show PM2 status
    pm2 status
    
    # Show application logs
    print_status "Recent application logs:"
    pm2 logs bayg-ecommerce --lines 20 --nostream
else
    print_error "❌ Application is not responding"
    
    # Show detailed logs for troubleshooting
    print_status "PM2 Status:"
    pm2 status
    
    print_status "Application logs:"
    pm2 logs bayg-ecommerce --lines 50 --nostream
    
    print_status "System logs:"
    sudo tail -20 /var/log/syslog
    
    exit 1
fi

# Test nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

if sudo systemctl is-active --quiet nginx; then
    print_status "✅ Nginx is running successfully!"
else
    print_warning "Nginx might not be running, attempting to start..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx
fi

# Final verification
print_status "Final verification..."
echo ""
print_status "🎉 Deployment fix completed!"
echo ""
print_status "Your BAYG E-commerce Platform should now be accessible at:"
echo -e "${BLUE}http://3.136.95.83${NC}"
echo ""
print_status "Test URLs:"
echo "- Homepage: http://3.136.95.83"
echo "- API Health: http://3.136.95.83/api/health"
echo "- Login: http://3.136.95.83/login"
echo ""
print_status "Default login credentials:"
echo "- Admin: admin@test.com / admin123"
echo "- Manager: manager@test.com / manager123"
echo "- User: john@test.com / user123"
echo ""
print_status "Monitoring commands:"
echo "- View logs: pm2 logs bayg-ecommerce"
echo "- Check status: pm2 status"
echo "- Restart app: pm2 restart bayg-ecommerce"
echo "- Check database: psql postgresql://bayg_user:BaygSecure2024!@localhost:5432/bayg_production"
echo ""
print_status "Deployment fix completed successfully! 🚀"