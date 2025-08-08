#!/bin/bash
# Quick Production Restart
# For when you just need to restart the server quickly

set -e

echo "⚡ QUICK PRODUCTION RESTART"
echo "=========================="

# Set production environment
export NODE_ENV=production

echo "Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true

echo "Starting server..."
pm2 start ecosystem.config.cjs --env production

echo "Waiting for startup..."
sleep 5

echo "Status check:"
pm2 status

echo "Testing server:"
curl -s -w "Status: %{http_code}\n" -o /dev/null http://localhost:5000/health || echo "Server not responding"

echo ""
echo "✅ RESTART COMPLETE"
echo "Monitor with: pm2 logs bayg-ecommerce"