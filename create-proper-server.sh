#!/bin/bash
# Create proper server with authentication and user creation
set -e

echo "🔧 Creating proper server with authentication..."

# Stop current processes
pm2 stop all || true
pm2 delete all || true

cd /home/ubuntu/bayg-ecommerce

# Create a proper server with authentication
cat > server-with-auth.js << 'EOF'
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Configure express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      console.log(`${new Date().toLocaleTimeString()} [express] ${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Password hashing utilities
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  if (!salt) return false;
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// In-memory user storage (for now)
const users = new Map();

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "bayg-ecommerce-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  name: 'bayg.session'
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(async (username, password, done) => {
  const user = users.get(username) || users.get(Array.from(users.keys()).find(key => users.get(key).email === username));
  if (!user || !(await comparePasswords(password, user.password))) {
    return done(null, false);
  }
  return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = Array.from(users.values()).find(u => u.id === id);
  done(null, user);
});

// Create test users for each role
async function createTestUsers() {
  console.log('Creating test users...');
  
  const testUsers = [
    {
      id: 'superadmin-001',
      username: 'superadmin',
      email: 'superadmin@bayg.com',
      password: 'admin123',
      firstName: 'Super',
      lastName: 'Administrator',
      role: 'Super Admin',
      isAdmin: true,
      isSuperAdmin: true
    },
    {
      id: 'admin-001',
      username: 'admin',
      email: 'admin@bayg.com',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Admin',
      role: 'Admin',
      isAdmin: true,
      isSuperAdmin: false
    },
    {
      id: 'manager-001',
      username: 'manager',
      email: 'manager@bayg.com',
      password: 'manager123',
      firstName: 'Store',
      lastName: 'Manager',
      role: 'Manager',
      isAdmin: true,
      isSuperAdmin: false
    },
    {
      id: 'user-001',
      username: 'customer1',
      email: 'customer1@bayg.com',
      password: 'user123',
      firstName: 'John',
      lastName: 'Customer',
      role: 'Customer',
      isAdmin: false,
      isSuperAdmin: false
    },
    {
      id: 'user-002',
      username: 'customer2',
      email: 'customer2@bayg.com',
      password: 'user123',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'Customer',
      isAdmin: false,
      isSuperAdmin: false
    },
    {
      id: 'staff-001',
      username: 'staff1',
      email: 'staff1@bayg.com',
      password: 'staff123',
      firstName: 'Alice',
      lastName: 'Staff',
      role: 'Staff',
      isAdmin: false,
      isSuperAdmin: false
    }
  ];

  for (const userData of testUsers) {
    const hashedPassword = await hashPassword(userData.password);
    users.set(userData.username, {
      ...userData,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    });
    users.set(userData.email, users.get(userData.username)); // Allow login with email
  }

  console.log('✅ Created test users:');
  testUsers.forEach(user => {
    console.log(`   ${user.role}: ${user.email} / ${user.password}`);
  });
}

// Authentication routes
app.post("/api/login", passport.authenticate("local"), (req, res) => {
  console.log('Login successful:', {
    user: req.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : null,
    sessionID: req.sessionID
  });
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role,
    isAdmin: req.user.isAdmin,
    isSuperAdmin: req.user.isSuperAdmin
  });
});

app.post("/api/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.get("/api/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      isAdmin: req.user.isAdmin,
      isSuperAdmin: req.user.isSuperAdmin
    });
  } else {
    res.sendStatus(401);
  }
});

app.get("/api/user/permissions", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }
  
  // Basic permissions based on role
  const permissions = [];
  if (req.user.isSuperAdmin) {
    permissions.push('full_access', 'user_management', 'product_management', 'order_management');
  } else if (req.user.isAdmin) {
    permissions.push('product_management', 'order_management', 'view_users');
  } else {
    permissions.push('view_products', 'create_orders');
  }
  
  res.json({ permissions });
});

// Basic API endpoints
app.get("/api/health", (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    users: users.size,
    authenticated: req.isAuthenticated()
  });
});

// List users endpoint (admin only)
app.get("/api/users", (req, res) => {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return res.sendStatus(401);
  }
  
  const userList = Array.from(users.values())
    .filter(user => user.id) // Only return actual user objects
    .map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    }));
  
  res.json(userList);
});

// Settings endpoint
app.get("/api/settings", (req, res) => {
  res.json({
    id: "default",
    siteName: "BAYG",
    browserTabTitle: "BAYG - Bahrain E-commerce",
    footerText: "© 2024 BAYG. All rights reserved.",
    theme: "default"
  });
});

// Static file serving
const publicPath = join(__dirname, 'dist/public');
const uploadsPath = join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve uploads
app.use('/uploads', express.static(uploadsPath));

// Serve static files
app.use(express.static(publicPath));

// Catch-all route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ message: 'API endpoint not found' });
  } else {
    res.sendFile(join(publicPath, 'index.html'));
  }
});

// Start server
async function startServer() {
  try {
    await createTestUsers();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎉 BAYG E-commerce Platform running on port ${PORT}`);
      console.log(`📱 Local: http://localhost:${PORT}`);
      console.log(`🌐 Public: http://3.136.95.83`);
      console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
      console.log('');
      console.log('👥 Test User Accounts:');
      console.log('   Super Admin: superadmin@bayg.com / admin123');
      console.log('   Admin: admin@bayg.com / admin123');
      console.log('   Manager: manager@bayg.com / manager123');
      console.log('   Customer 1: customer1@bayg.com / user123');
      console.log('   Customer 2: customer2@bayg.com / user123');
      console.log('   Staff: staff1@bayg.com / staff123');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
EOF

# Update PM2 configuration
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'bayg-ecommerce',
    script: 'node',
    args: 'server-with-auth.js',
    cwd: '/home/ubuntu/bayg-ecommerce',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    max_memory_restart: '1G',
    max_restarts: 5,
    min_uptime: '10s',
    restart_delay: 3000,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    time: true,
    watch: false,
    autorestart: true
  }]
};
EOF

# Ensure required directories exist
mkdir -p uploads logs dist/public
chmod 755 uploads

# Start the application
echo "Starting application with authentication..."
pm2 start ecosystem.config.cjs

# Wait for startup
sleep 10

# Test the application
echo "Testing authentication endpoints..."

# Test health
echo "Health check:"
curl -s http://localhost:5000/api/health | jq . || curl -s http://localhost:5000/api/health

# Test login
echo ""
echo "Testing login with admin user:"
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@bayg.com&password=admin123" \
  -c cookies.txt -s | jq . || echo "Login test completed"

# Test authenticated endpoint
echo ""
echo "Testing authenticated user endpoint:"
curl -s http://localhost:5000/api/user -b cookies.txt | jq . || echo "User endpoint test completed"

# Show status
echo ""
echo "PM2 Status:"
pm2 status

echo ""
echo "Recent logs:"
pm2 logs bayg-ecommerce --lines 5 --nostream

if curl -s http://localhost:5000/api/health > /dev/null; then
    echo ""
    echo "🎉 Server with authentication is running!"
    echo "✅ Application: http://3.136.95.83"
    echo "✅ Login endpoint: http://3.136.95.83/api/login"
    echo ""
    echo "👥 Test Accounts Created:"
    echo "   Super Admin: superadmin@bayg.com / admin123"
    echo "   Admin: admin@bayg.com / admin123" 
    echo "   Manager: manager@bayg.com / manager123"
    echo "   Customer 1: customer1@bayg.com / user123"
    echo "   Customer 2: customer2@bayg.com / user123"
    echo "   Staff: staff1@bayg.com / staff123"
else
    echo "❌ Server may have issues. Check logs with: pm2 logs bayg-ecommerce"
fi

pm2 save

echo "🎉 Proper server with authentication created!"