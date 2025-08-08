#!/bin/bash
# Stop the restart loop immediately
echo "Stopping restart loop..."

# Kill all PM2 processes
pm2 stop all || true
pm2 delete all || true
pm2 kill

# Kill any remaining node processes
pkill -f "node dist/index.js" || true
pkill -f "npm start" || true

echo "All processes stopped. You can now run the final fix."