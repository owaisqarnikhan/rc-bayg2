#!/bin/bash
# Production Server Fix for AWS Ubuntu Server
# Fixes 404 API errors and ensures proper server deployment

set -e

echo "🔧 FIXING PRODUCTION SERVER DEPLOYMENT"
echo "====================================="

echo "Step 1: Environment Setup"
echo "========================"

# Create proper production environment file
if [ ! -f .env.production ]; then
    echo "Creating production environment file..."
    cp .env.example .env.production
    echo "✅ Created .env.production from template"
fi

# Ensure proper Node.js version and dependencies
echo "Checking Node.js version..."
node --version
npm --version

echo ""
echo "Step 2: Clean Build Process"
echo "=========================="

echo "Cleaning previous builds..."
rm -rf dist/
rm -rf client/dist/
rm -rf node_modules/.cache/

echo "Installing dependencies..."
npm ci --production=false

echo "Building frontend..."
npm run build

echo "Building backend..."
# Ensure esbuild builds server correctly
npm run build

# Check if build was successful
if [ ! -f "dist/index.js" ]; then
    echo "❌ Backend build failed - dist/index.js not found"
    exit 1
fi

if [ ! -d "client/dist" ]; then
    echo "❌ Frontend build failed - client/dist not found" 
    exit 1
fi

echo "✅ Build completed successfully"

echo ""
echo "Step 3: Database Schema Push"
echo "==========================="

echo "Pushing database schema..."
npm run db:push

echo ""
echo "Step 4: PM2 Process Management"
echo "============================="

# Stop any existing PM2 processes
echo "Stopping existing PM2 processes..."
pm2 stop ecosystem.config.cjs 2>/dev/null || true
pm2 delete all 2>/dev/null || true

echo "Starting application with PM2..."
NODE_ENV=production pm2 start ecosystem.config.cjs

# Show PM2 status
echo "PM2 Status:"
pm2 status

echo ""
echo "Step 5: Nginx Configuration Check"
echo "================================="

# Check if nginx config exists and is correct
if [ ! -f "/etc/nginx/sites-available/bayg" ]; then
    echo "❌ Nginx configuration missing"
    echo "Copying nginx configuration..."
    sudo cp nginx.conf /etc/nginx/sites-available/bayg
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/bayg /etc/nginx/sites-enabled/
    
    # Remove default nginx site
    sudo rm -f /etc/nginx/sites-enabled/default
fi

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

# Reload nginx
echo "Reloading nginx..."
sudo systemctl reload nginx

echo ""
echo "Step 6: Server Health Check"
echo "=========================="

# Wait for server to start
sleep 5

# Test server endpoints
echo "Testing server health..."
curl -f http://localhost:5000/health || echo "❌ Health check failed"

echo "Testing API endpoints..."
endpoints=(
    "/api/settings"
    "/api/products" 
    "/api/categories"
    "/api/units-of-measure"
)

for endpoint in "${endpoints[@]}"; do
    echo -n "Testing $endpoint: "
    status=$(curl -s -w "%{http_code}" -o "/tmp/test-response.json" "http://localhost:5000$endpoint")
    if [ "$status" = "200" ] || [ "$status" = "401" ]; then
        echo "✅ OK ($status)"
    else
        echo "❌ FAILED ($status)"
        if [ -f "/tmp/test-response.json" ]; then
            echo "Response: $(cat /tmp/test-response.json)"
        fi
    fi
done

echo ""
echo "Step 7: Port and Process Verification"
echo "===================================="

echo "Checking processes on port 5000..."
netstat -tulpn | grep :5000 || echo "No process found on port 5000"

echo "PM2 logs (last 20 lines):"
pm2 logs --lines 20

echo ""
echo "Step 8: File Permissions"
echo "======================"

# Ensure proper permissions
chmod +x dist/index.js 2>/dev/null || true
chmod -R 755 client/dist/ 2>/dev/null || true
chmod -R 755 uploads/ 2>/dev/null || true

echo ""
echo "🎯 PRODUCTION DIAGNOSTICS COMPLETE"
echo "=================================="

echo ""
echo "✅ FIXES APPLIED:"
echo "1. Clean build process for both frontend and backend"
echo "2. Database schema pushed to production database"  
echo "3. PM2 process management configured and started"
echo "4. Nginx configuration verified and reloaded"
echo "5. Server health checks performed"
echo "6. File permissions corrected"

echo ""
echo "🔧 VERIFICATION STEPS:"
echo "====================="
echo "1. Check PM2 status: pm2 status"
echo "2. Check PM2 logs: pm2 logs bayg-ecommerce"  
echo "3. Check nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "4. Test endpoints: curl http://localhost:5000/api/settings"
echo "5. Check browser: http://3.136.95.83"

echo ""
echo "⚡ COMMON FIXES IF STILL FAILING:"
echo "================================"
echo "1. Environment variables: Check DATABASE_URL in .env"
echo "2. Database connection: Verify PostgreSQL is running"
echo "3. Port conflicts: Check if port 5000 is available" 
echo "4. Build issues: Check dist/index.js exists and is executable"
echo "5. Permissions: Ensure ubuntu user owns all files"

echo ""
echo "✅ PRODUCTION FIX COMPLETE"