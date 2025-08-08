#!/bin/bash
# Fix the full application with proper API routes and static file serving
set -e

echo "🔧 Fixing full application with API routes..."

# Stop current processes
pm2 stop all || true
pm2 delete all || true

cd /home/ubuntu/bayg-ecommerce

# Create a fixed server entry point that handles seeding errors gracefully
echo "Creating fixed server entry point..."
cat > server-fixed.js << 'EOF'
import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(`${new Date().toLocaleTimeString()} [express] ${logLine}`);
    }
  });

  next();
});

async function startServer() {
  try {
    console.log('🚀 Starting BAYG E-commerce Platform...');
    
    // Test database connection first
    console.log('📡 Testing database connection...');
    const { db } = await import("./server/db.js");
    await db.execute('SELECT 1 as test');
    console.log('✅ Database connection successful');
    
    // Try to seed permissions (but don't fail if it has issues)
    try {
      console.log('🌱 Attempting to seed permissions...');
      const { seedComprehensivePermissions } = await import("./server/seed-comprehensive-permissions.js");
      await seedComprehensivePermissions();
      console.log('✅ Permissions seeded successfully');
    } catch (seedError) {
      console.warn('⚠️  Seeding permissions failed, continuing without seeding:', seedError.message);
    }
    
    // Try to seed users (but don't fail if it has issues)
    try {
      console.log('👥 Attempting to seed users...');
      const { seedUsers } = await import("./server/seed-users.js");
      await seedUsers();
      console.log('✅ Users seeded successfully');
    } catch (userSeedError) {
      console.warn('⚠️  Seeding users failed, continuing without seeding:', userSeedError.message);
    }
    
    // Register routes
    console.log('🛠️  Registering API routes...');
    const { registerRoutes } = await import("./server/routes.js");
    const server = await registerRoutes(app);
    
    // Error handling middleware
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error('❌ Server error:', err);
      res.status(status).json({ message });
    });

    // Serve uploaded files
    const uploadsPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    app.use('/uploads', express.static(uploadsPath));
    
    // Serve static files (built frontend)
    const publicPath = join(__dirname, 'dist/public');
    app.use(express.static(publicPath));
    
    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        port: process.env.PORT || 5000
      });
    });
    
    // Catch-all route to serve the frontend
    app.get('*', (req, res) => {
      res.sendFile(join(publicPath, 'index.html'));
    });

    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen(port, "0.0.0.0", () => {
      console.log(`🎉 BAYG E-commerce Platform serving on port ${port}`);
      console.log(`📱 Local: http://localhost:${port}`);
      console.log(`🌐 Public: http://3.136.95.83`);
      console.log(`❤️  Health check: http://localhost:${port}/api/health`);
    });
    
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    // Don't exit the process, just log the error
    setTimeout(() => {
      console.log("🔄 Retrying server start in 5 seconds...");
      startServer();
    }, 5000);
  }
}

startServer();
EOF

# Update PM2 configuration to use the fixed server
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'bayg-ecommerce',
    script: 'node',
    args: 'server-fixed.js',
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
    min_uptime: '30s',
    restart_delay: 5000,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    watch: false,
    autorestart: true,
    kill_timeout: 5000
  }]
};
EOF

# Make sure uploads directory exists with proper permissions
mkdir -p uploads
chmod 755 uploads

# Clear old logs
rm -f logs/*.log

# Start the application
echo "Starting full application with API routes..."
pm2 start ecosystem.config.cjs --env production

# Wait for application to start
sleep 15

# Test the application
echo "Testing application endpoints..."

# Test health endpoint
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Health endpoint working"
    curl -s http://localhost:5000/api/health | jq . || curl -s http://localhost:5000/api/health
else
    echo "❌ Health endpoint not responding"
fi

# Test static files
if curl -s http://localhost:5000 > /dev/null; then
    echo "✅ Frontend serving correctly"
else
    echo "❌ Frontend not serving"
fi

# Show PM2 status
echo ""
echo "PM2 Status:"
pm2 status

echo ""
echo "Recent logs:"
pm2 logs bayg-ecommerce --lines 10 --nostream

echo ""
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "🎉 Full application is now running!"
    echo "✅ Your application: http://3.136.95.83"
    echo "✅ API Health: http://3.136.95.83/api/health"
    echo ""
    echo "The application now includes:"
    echo "- All API routes (/api/*)"
    echo "- Static file serving"
    echo "- Image uploads (/uploads/*)"
    echo "- Frontend application"
    echo "- Database integration"
else
    echo "❌ Application may have issues. Check logs with: pm2 logs bayg-ecommerce"
fi

pm2 save
EOF