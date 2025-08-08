#!/bin/bash
# Final Fix for BAYG E-commerce Platform
set -e

echo "🔧 Final fix for application startup..."

# Stop all processes and clear PM2
pm2 stop all || true
pm2 delete all || true
pm2 kill || true

cd /home/ubuntu/bayg-ecommerce

# Create the correct PM2 configuration file
echo "Creating PM2 configuration..."
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
    max_restarts: 3,
    min_uptime: '10s',
    restart_delay: 4000,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    watch: false,
    autorestart: true
  }]
};
EOF

# Remove the problematic .js config file
rm -f ecosystem.config.js

# Create directories
mkdir -p uploads logs
chmod 755 uploads logs

# Clear old log files
rm -f logs/*.log

# Fix the seeding issue by running it manually first
echo "Running database seeding manually..."
export $(cat .env | xargs)

# Run seeding script directly without the application
npx tsx server/seed-comprehensive-permissions.ts || echo "Seeding might have partial errors, continuing..."

# Build the application
echo "Building application..."
npm run build

# Start the application with PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.cjs --env production

# Wait for application to stabilize
sleep 15

# Check if application is running
echo "Checking application status..."
pm2 status

# Test application response
if curl -s http://localhost:5000 > /dev/null; then
    echo "✅ Application is responding on port 5000"
    
    # Configure Nginx if not already done
    if [ -f "nginx.conf" ]; then
        echo "Setting up Nginx..."
        sudo cp nginx.conf /etc/nginx/sites-available/bayg
        sudo ln -sf /etc/nginx/sites-available/bayg /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        sudo nginx -t && sudo systemctl reload nginx
        
        # Test full stack
        sleep 2
        if curl -s http://3.136.95.83 > /dev/null; then
            echo "✅ Full stack working! Application accessible at: http://3.136.95.83"
        else
            echo "⚠️  Application running but Nginx proxy may need configuration"
        fi
    fi
else
    echo "❌ Application not responding, checking logs..."
    pm2 logs bayg-ecommerce --lines 20
fi

# Save PM2 configuration
pm2 save

echo "Final fix completed!"
echo "Commands to monitor:"
echo "- pm2 status"
echo "- pm2 logs bayg-ecommerce"
echo "- curl http://localhost:5000"