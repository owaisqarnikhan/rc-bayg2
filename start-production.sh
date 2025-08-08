#!/bin/bash
# Start Production Server Script
# Quick production startup for AWS deployment

set -e

echo "🚀 STARTING PRODUCTION SERVER"
echo "============================"

# Set production environment
export NODE_ENV=production

echo "Environment: $NODE_ENV"
echo "Database URL: ${DATABASE_URL:0:20}..."

# Ensure required directories exist
mkdir -p uploads
mkdir -p logs

# Start with PM2
echo "Starting server with PM2..."
pm2 start ecosystem.config.cjs

# Show status
pm2 status

echo ""
echo "✅ PRODUCTION SERVER STARTED"
echo "Server running on: http://3.136.95.83"
echo "API endpoints: http://3.136.95.83/api/*"
echo ""
echo "Monitor with:"
echo "  pm2 status"  
echo "  pm2 logs bayg-ecommerce"
echo "  pm2 monit"