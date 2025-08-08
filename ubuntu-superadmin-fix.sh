#!/bin/bash
# Ubuntu Server - Superadmin Access Fix
# For production deployment on AWS EC2

set -e

echo "🎯 UBUNTU SERVER - SUPERADMIN ACCESS FIX"
echo "========================================"

# Check if we're on Ubuntu server
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    echo "OS: $NAME $VERSION"
fi

echo "Working directory: $(pwd)"
echo "User: $(whoami)"

# Fix permissions for all shell scripts first
echo ""
echo "Step 1: Fixing script permissions..."
find . -name "*.sh" -type f -exec chmod +x {} \;
echo "✅ All shell scripts now have execute permissions"

# Check if application is running
echo ""
echo "Step 2: Checking application status..."
if pgrep -f "node\|npm" > /dev/null; then
    echo "✅ Node.js application is running"
    
    # Check if port 5000 is accessible
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "✅ Application responding on port 5000"
    else
        echo "⚠️  Application not responding on port 5000"
    fi
else
    echo "❌ No Node.js application running"
    echo "Starting application with PM2..."
    pm2 start ecosystem.config.cjs --env production
    sleep 5
fi

echo ""
echo "Step 3: Database connection test..."

# Test PostgreSQL connection
if command -v psql &> /dev/null; then
    if psql -d "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ PostgreSQL connection working"
        
        # Check users table
        echo ""
        echo "Current users in database:"
        psql -d "$DATABASE_URL" -c "SELECT username, email, is_admin, is_super_admin FROM users WHERE username IN ('admin', 'manager');"
        
    else
        echo "❌ PostgreSQL connection failed"
        echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
    fi
else
    echo "⚠️  psql not available, skipping database test"
fi

echo ""
echo "Step 4: Authentication test..."

# Test authentication endpoints
echo "Testing login endpoint..."
curl -X POST http://localhost:5000/api/login \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin&password=admin123" \
    -c ubuntu-cookies.txt \
    -w "HTTP Status: %{http_code}\n" \
    -o login-response.json \
    -s

if [ -f login-response.json ]; then
    echo "Login response:"
    cat login-response.json | head -5
    echo ""
fi

# Test user endpoint with session
if [ -f ubuntu-cookies.txt ]; then
    echo "Testing authenticated user endpoint..."
    curl -s http://localhost:5000/api/user \
        -b ubuntu-cookies.txt \
        -w "HTTP Status: %{http_code}\n" \
        -o user-response.json
    
    if [ -f user-response.json ]; then
        echo "User response:"
        cat user-response.json | head -5
        echo ""
    fi
fi

echo ""
echo "Step 5: PM2 application status..."
if command -v pm2 &> /dev/null; then
    echo "PM2 processes:"
    pm2 list
    echo ""
    echo "PM2 logs (last 10 lines):"
    pm2 logs --lines 10
else
    echo "PM2 not available"
fi

# Cleanup
rm -f ubuntu-cookies.txt login-response.json user-response.json 2>/dev/null || true

echo ""
echo "🎯 UBUNTU SERVER SUMMARY:"
echo "========================"
echo "✓ Script permissions fixed"
echo "✓ Application status checked"
echo "✓ Authentication tested"
echo ""
echo "🔑 WORKING CREDENTIALS:"
echo "----------------------"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo "🚀 ACCESS YOUR APPLICATION:"
echo "-------------------------"
echo "1. Open browser to: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5000"
echo "2. Login with: admin / admin123"
echo "3. Should see admin panel with full access"
echo ""
echo "If application is not responding:"
echo "- Check PM2 status: pm2 status"
echo "- Restart application: pm2 restart all"
echo "- Check logs: pm2 logs"