#!/bin/bash
# Deployment Script for BAYG E-commerce Platform
# AWS EC2 Ubuntu Server: 3.136.95.83

set -e  # Exit on any error

echo "🚀 Starting BAYG E-commerce Platform Deployment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as ubuntu user
if [ "$(whoami)" != "ubuntu" ]; then
    print_error "This script should be run as ubuntu user"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
print_status "Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install required packages
print_status "Installing required packages..."
sudo apt install -y postgresql postgresql-contrib nginx git build-essential

# Install PM2 globally
print_status "Installing PM2..."
sudo npm install -g pm2

# Setup PostgreSQL
print_status "Setting up PostgreSQL database..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << 'EOF' || print_warning "Database might already exist"
CREATE DATABASE bayg_production;
CREATE USER bayg_user WITH ENCRYPTED PASSWORD 'BaygSecure2024!';
GRANT ALL PRIVILEGES ON DATABASE bayg_production TO bayg_user;
ALTER DATABASE bayg_production OWNER TO bayg_user;
\q
EOF

# Navigate to project directory
cd /home/ubuntu/bayg-ecommerce

# Create environment file
print_status "Creating environment configuration..."
# Generate session secret
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

# Set proper permissions for environment file
chmod 600 .env

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install

# Build the application
print_status "Building the application..."
npm run build

# Create required directories
print_status "Creating required directories..."
mkdir -p uploads logs
chmod 755 uploads
chmod 755 logs

# Setup database schema
print_status "Setting up database schema..."
npm run db:push

# Seed database with initial data
print_status "Seeding database..."
npx tsx server/seed-comprehensive-permissions.ts || print_warning "Permissions might already exist"

# Configure Nginx
print_status "Configuring Nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/bayg
sudo ln -sf /etc/nginx/sites-available/bayg /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup ubuntu -u ubuntu --hp /home/ubuntu

# Setup firewall
print_status "Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/bayg << 'EOF'
/home/ubuntu/bayg-ecommerce/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reload bayg-ecommerce
    endscript
}
EOF

# Create backup script
print_status "Creating backup script..."
cat > /home/ubuntu/backup_bayg.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U bayg_user -d bayg_production > $BACKUP_DIR/bayg_db_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/bayg_uploads_$DATE.tar.gz -C /home/ubuntu/bayg-ecommerce uploads/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "bayg_*" -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /home/ubuntu/backup_bayg.sh

# Add backup to crontab
print_status "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup_bayg.sh") | crontab -

# Test the deployment
print_status "Testing the deployment..."
sleep 5

# Check PM2 status
pm2 status

# Check if application is responding
if curl -s http://localhost:5000 > /dev/null; then
    print_status "✅ Application is running successfully!"
else
    print_error "❌ Application is not responding"
    print_status "Check logs with: pm2 logs bayg-ecommerce"
fi

# Check Nginx status
if sudo systemctl is-active --quiet nginx; then
    print_status "✅ Nginx is running successfully!"
else
    print_error "❌ Nginx is not running"
    print_status "Check status with: sudo systemctl status nginx"
fi

# Final status
echo ""
print_status "🎉 Deployment completed!"
echo ""
print_status "Your BAYG E-commerce Platform is now accessible at:"
echo -e "${BLUE}http://3.136.95.83${NC}"
echo ""
print_status "Login credentials:"
echo "Admin: admin@test.com / admin123"
echo "Manager: manager@test.com / manager123"
echo "User: john@test.com / user123"
echo ""
print_status "Useful commands:"
echo "- View logs: pm2 logs bayg-ecommerce"
echo "- Restart app: pm2 restart bayg-ecommerce"
echo "- Check status: pm2 status"
echo "- View Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
print_status "Deployment completed successfully! 🚀"