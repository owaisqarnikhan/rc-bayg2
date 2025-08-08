#!/bin/bash
# Production Deployment Fix - Fixed for Missing .env.example
# Comprehensive fix for AWS Ubuntu server 404 errors

set -e

echo "🔧 PRODUCTION DEPLOYMENT FIX"
echo "============================"

echo "Step 1: Environment Setup (Fixed)"
echo "================================"

# Create environment file from current .env or create new one
if [ -f .env ]; then
    echo "Using existing .env file as template"
    cp .env .env.production
else
    echo "Creating production environment file..."
    cat > .env.production << 'EOF'
# Production Environment Configuration
NODE_ENV=production
PORT=5000

# Database (Replace with your actual production database URL)
DATABASE_URL=postgresql://username:password@localhost:5432/bayg_production
PGDATABASE=bayg_production
PGHOST=localhost
PGUSER=username
PGPASSWORD=password
PGPORT=5432

# Session Secret (Generate a new one for production)
SESSION_SECRET=your-super-secure-session-secret-here

# Email Configuration (Optional - configure as needed)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# File Upload Path
UPLOAD_PATH=/home/ubuntu/bayg-ecommerce/uploads
EOF
    echo "✅ Created basic .env.production file"
    echo "⚠️  IMPORTANT: Update DATABASE_URL and other secrets in .env.production"
fi

# Ensure environment is loaded
export NODE_ENV=production
source .env.production 2>/dev/null || echo "Note: .env.production exists but couldn't be sourced"

echo ""
echo "Step 2: Dependency Installation"
echo "=============================="

echo "Installing all dependencies..."
npm install

echo ""
echo "Step 3: Build Process"
echo "=================="

echo "Cleaning previous builds..."
rm -rf dist/
rm -rf client/dist/

echo "Building frontend..."
npm run build

echo "Checking build results..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ Backend build failed - dist/index.js not created"
    echo "Attempting manual backend build..."
    npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
fi

if [ ! -d "client/dist" ]; then
    echo "❌ Frontend build failed - client/dist not created"
    echo "Attempting manual frontend build..."
    npx vite build
fi

# Final build verification
if [ -f "dist/index.js" ] && [ -d "client/dist" ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build verification failed"
    echo "Backend built: $([ -f dist/index.js ] && echo 'YES' || echo 'NO')"
    echo "Frontend built: $([ -d client/dist ] && echo 'YES' || echo 'NO')"
    exit 1
fi

echo ""
echo "Step 4: Database Schema"
echo "====================="

echo "Pushing database schema..."
npm run db:push || echo "⚠️  Database push failed - check DATABASE_URL in .env.production"

echo ""
echo "Step 5: Directory Setup"
echo "====================="

# Create required directories
mkdir -p uploads
mkdir -p logs
chmod 755 uploads
chmod 755 logs

echo ""
echo "Step 6: PM2 Process Management"
echo "============================"

# Stop existing processes
echo "Stopping existing PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start the application
echo "Starting application with PM2..."
NODE_ENV=production pm2 start ecosystem.config.cjs --env production

# Wait for startup
sleep 5

echo "PM2 Status:"
pm2 status

echo ""
echo "Step 7: Server Health Check"
echo "=========================="

# Test local server
echo "Testing server health (may take a moment for startup)..."
for i in {1..10}; do
    if curl -f http://localhost:5000/health >/dev/null 2>&1; then
        echo "✅ Server health check passed"
        break
    elif [ $i -eq 10 ]; then
        echo "❌ Server health check failed after 10 attempts"
        echo "Checking PM2 logs:"
        pm2 logs --lines 20
    else
        echo "Attempt $i/10: Server starting..."
        sleep 3
    fi
done

echo ""
echo "Testing API endpoints:"
endpoints=(
    "/api/settings"
    "/api/products"
    "/api/categories"
    "/api/admin/stats"
)

for endpoint in "${endpoints[@]}"; do
    echo -n "Testing $endpoint: "
    status=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:5000$endpoint" 2>/dev/null || echo "000")
    case "$status" in
        200|304) echo "✅ OK ($status)" ;;
        401|403) echo "✅ OK ($status - auth required)" ;;
        404) echo "❌ NOT FOUND ($status)" ;;
        500) echo "❌ SERVER ERROR ($status)" ;;
        000) echo "❌ CONNECTION FAILED" ;;
        *) echo "⚠️  UNKNOWN ($status)" ;;
    esac
done

echo ""
echo "Step 8: Process Verification"
echo "=========================="

echo "Processes on port 5000:"
netstat -tulpn | grep :5000 || echo "❌ No process found on port 5000"

echo ""
echo "Active PM2 processes:"
pm2 list

echo ""
echo "🎯 DEPLOYMENT STATUS"
echo "==================="

# Final status check
if pm2 list | grep -q "online" && netstat -tulpn | grep -q ":5000"; then
    echo "✅ DEPLOYMENT SUCCESSFUL"
    echo ""
    echo "🌐 Your application should now be accessible at:"
    echo "   http://3.136.95.83"
    echo ""
    echo "📊 API endpoints should work:"
    echo "   http://3.136.95.83/api/admin/stats"
    echo "   http://3.136.95.83/api/products"
    echo "   http://3.136.95.83/api/categories"
    echo ""
    echo "📋 Monitor your application:"
    echo "   pm2 status"
    echo "   pm2 logs bayg-ecommerce"
    echo "   pm2 monit"
else
    echo "❌ DEPLOYMENT ISSUES DETECTED"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Check PM2 logs: pm2 logs bayg-ecommerce"
    echo "2. Verify database connection in .env.production"
    echo "3. Check if port 5000 is available: netstat -tulpn | grep :5000"
    echo "4. Restart services: pm2 restart all"
fi

echo ""
echo "✅ PRODUCTION DEPLOYMENT FIX COMPLETE"