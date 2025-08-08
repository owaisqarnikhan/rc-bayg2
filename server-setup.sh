#!/bin/bash
# Server Setup Script for BAYG E-commerce Platform
# Run this FIRST on your AWS EC2 Ubuntu Server: 3.136.95.83

set -e

echo "🔧 Setting up AWS EC2 Ubuntu Server for BAYG E-commerce Platform..."

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Check if running on Ubuntu
if [ ! -f /etc/lsb-release ]; then
    print_error "This script is designed for Ubuntu systems only"
    exit 1
fi

# Check if running as ubuntu user
if [ "$(whoami)" != "ubuntu" ]; then
    print_error "Please run this script as 'ubuntu' user"
    exit 1
fi

print_status "Starting server setup process..."

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js 20.x
print_status "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
print_status "Node.js installed: $node_version"
print_status "NPM installed: $npm_version"

# Install PostgreSQL 15
print_status "Installing PostgreSQL 15..."
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx

# Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Install build tools
print_status "Installing build tools..."
sudo apt install -y build-essential python3 python3-pip

# Install additional useful tools
print_status "Installing additional tools..."
sudo apt install -y htop tree vim nano ufw fail2ban

# Configure basic security
print_status "Configuring basic security..."

# Configure UFW firewall
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create project directory
print_status "Creating project directory..."
mkdir -p /home/ubuntu/bayg-ecommerce
cd /home/ubuntu/bayg-ecommerce

# Set proper permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/bayg-ecommerce

# Create logs directory
mkdir -p logs uploads backups
chmod 755 logs uploads backups

print_status "Setting up PostgreSQL database..."
sudo -u postgres psql << 'EOF'
CREATE DATABASE bayg_production;
CREATE USER bayg_user WITH ENCRYPTED PASSWORD 'BaygSecure2024!';
GRANT ALL PRIVILEGES ON DATABASE bayg_production TO bayg_user;
ALTER DATABASE bayg_production OWNER TO bayg_user;
\q
EOF

# Configure PostgreSQL for remote connections (if needed)
print_status "Configuring PostgreSQL..."
PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+\.\d+' | head -1)
PG_CONFIG_DIR="/etc/postgresql/$PG_VERSION/main"

# Backup original configuration
sudo cp $PG_CONFIG_DIR/postgresql.conf $PG_CONFIG_DIR/postgresql.conf.backup
sudo cp $PG_CONFIG_DIR/pg_hba.conf $PG_CONFIG_DIR/pg_hba.conf.backup

# Restart PostgreSQL
sudo systemctl restart postgresql

# Test database connection
print_status "Testing database connection..."
if sudo -u postgres psql -d bayg_production -c "SELECT 1;" > /dev/null 2>&1; then
    print_status "✅ Database connection successful"
else
    print_error "❌ Database connection failed"
fi

# Configure Nginx
print_status "Configuring Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

# Remove default Nginx site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx
if curl -s http://localhost > /dev/null; then
    print_status "✅ Nginx is working"
else
    print_warning "⚠️  Nginx test failed"
fi

# System optimization
print_status "Optimizing system settings..."

# Increase file limits
echo "ubuntu soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "ubuntu hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Configure swap (if not exists)
if [ ! -f /swapfile ]; then
    print_status "Creating swap file..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Configure automatic security updates
print_status "Configuring automatic security updates..."
sudo apt install -y unattended-upgrades
echo 'Unattended-Upgrade::Automatic-Reboot "false";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades

# Setup system monitoring
print_status "Setting up system monitoring..."
pm2 install pm2-server-monit || print_warning "PM2 monitoring setup skipped"

# Create deployment info file
print_status "Creating deployment info..."
cat > /home/ubuntu/deployment-info.txt << EOF
BAYG E-commerce Platform - AWS EC2 Ubuntu Server
=================================================

Server IP: 3.136.95.83
Deployment Date: $(date)
Node.js Version: $node_version
NPM Version: $npm_version
PostgreSQL Version: $PG_VERSION

Project Directory: /home/ubuntu/bayg-ecommerce
Database: bayg_production
Database User: bayg_user

Services Status:
- PostgreSQL: $(sudo systemctl is-active postgresql)
- Nginx: $(sudo systemctl is-active nginx)
- UFW: $(sudo ufw status | grep -o "Status: active" || echo "inactive")

Next Steps:
1. Upload your project files to /home/ubuntu/bayg-ecommerce/
2. Run the deployment script: ./deploy.sh
3. Access your application at: http://3.136.95.83

Useful Commands:
- Check system status: systemctl status
- Check logs: journalctl -f
- Monitor processes: htop
- Check disk usage: df -h
- Check memory: free -h
EOF

print_status "✅ Server setup completed successfully!"
echo ""
print_status "📋 Server Information:"
echo "IP Address: 3.136.95.83"
echo "Node.js: $node_version"
echo "NPM: $npm_version"
echo "PostgreSQL: Version $PG_VERSION"
echo "Project Directory: /home/ubuntu/bayg-ecommerce"
echo ""
print_status "🚀 Next Steps:"
echo "1. Upload your BAYG project files to: /home/ubuntu/bayg-ecommerce/"
echo "2. Run the deployment script: ./deploy.sh"
echo "3. Your application will be available at: http://3.136.95.83"
echo ""
print_status "📝 Deployment info saved to: /home/ubuntu/deployment-info.txt"
echo ""
print_warning "⚠️  Important: Change the default database password in production!"
print_status "🎉 Server is ready for deployment!"