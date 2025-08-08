#!/bin/bash
# Debug Production Issues
# Comprehensive debugging for AWS production deployment

echo "🔍 PRODUCTION DEBUG ANALYSIS"
echo "============================"

echo "Step 1: System Information"
echo "========================="
echo "Operating System: $(uname -a)"
echo "Node.js Version: $(node --version)"
echo "NPM Version: $(npm --version)"
echo "PM2 Version: $(pm2 --version)"
echo "Current User: $(whoami)"
echo "Current Directory: $(pwd)"

echo ""
echo "Step 2: Process Analysis"
echo "======================"
echo "PM2 Status:"
pm2 status

echo ""
echo "Processes on port 5000:"
netstat -tulpn | grep :5000 || echo "No processes found on port 5000"

echo ""
echo "All Node.js processes:"
ps aux | grep node | grep -v grep || echo "No Node.js processes found"

echo ""
echo "Step 3: File System Check"
echo "========================"
echo "Project directory contents:"
ls -la | head -20

echo ""
echo "Build artifacts:"
echo "- dist/index.js: $([ -f dist/index.js ] && echo "✅ EXISTS" || echo "❌ MISSING")"
echo "- client/dist: $([ -d client/dist ] && echo "✅ EXISTS" || echo "❌ MISSING")"
echo "- package.json: $([ -f package.json ] && echo "✅ EXISTS" || echo "❌ MISSING")"

if [ -f dist/index.js ]; then
    echo "dist/index.js permissions: $(ls -la dist/index.js)"
fi

echo ""
echo "Step 4: Environment Variables"
echo "==========================="
echo "NODE_ENV: ${NODE_ENV:-'not set'}"
echo "PORT: ${PORT:-'not set'}"
echo "Database URL prefix: ${DATABASE_URL:0:30}..." 

echo ""
echo "Step 5: Network Connectivity"
echo "=========================="
echo "Testing localhost:5000 connectivity:"
curl -s -w "Status: %{http_code}, Time: %{time_total}s\n" -o /tmp/debug-response.txt "http://localhost:5000/health" || echo "Connection failed"

if [ -f /tmp/debug-response.txt ]; then
    echo "Response body:"
    cat /tmp/debug-response.txt
    echo ""
fi

echo ""
echo "Testing API endpoints:"
endpoints=("/api/settings" "/api/products" "/api/categories")
for endpoint in "${endpoints[@]}"; do
    echo -n "$endpoint: "
    curl -s -w "%{http_code}" -o /dev/null "http://localhost:5000$endpoint" || echo "FAILED"
done

echo ""
echo ""
echo "Step 6: Log Analysis"  
echo "=================="
echo "PM2 Application Logs (last 50 lines):"
pm2 logs bayg-ecommerce --lines 50 --nostream || echo "No PM2 logs found"

echo ""
echo "Nginx Error Log (last 20 lines):"
sudo tail -n 20 /var/log/nginx/error.log || echo "Cannot access nginx logs"

echo ""
echo "System Log (relevant entries):"
journalctl --no-pager -n 20 | grep -E "(node|nginx|pm2)" || echo "No relevant system logs"

echo ""
echo "Step 7: Configuration Validation"
echo "==============================="
echo "Nginx configuration test:"
sudo nginx -t || echo "Nginx configuration has errors"

echo ""
echo "PM2 ecosystem config:"
if [ -f ecosystem.config.cjs ]; then
    echo "✅ Ecosystem config exists"
    head -20 ecosystem.config.cjs
else
    echo "❌ Ecosystem config missing"
fi

echo ""
echo "Step 8: Recommendations"
echo "====================="

# Check for common issues and provide recommendations
if [ ! -f dist/index.js ]; then
    echo "❌ CRITICAL: Backend build missing - run 'npm run build'"
fi

if [ ! -d client/dist ]; then
    echo "❌ CRITICAL: Frontend build missing - run 'npm run build'"
fi

if ! pm2 list | grep -q "bayg-ecommerce"; then
    echo "❌ CRITICAL: PM2 process not running - run 'pm2 start ecosystem.config.cjs'"
fi

if ! netstat -tulpn | grep -q ":5000"; then
    echo "❌ CRITICAL: No process listening on port 5000"
fi

echo ""
echo "✅ DEBUG ANALYSIS COMPLETE"
echo "========================="

# Cleanup
rm -f /tmp/debug-response.txt