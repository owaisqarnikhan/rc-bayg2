#!/bin/bash
# Quick restart with fixed permissions
set -e

echo "🔄 Restarting server with fixed role permissions..."

cd /home/ubuntu/bayg-ecommerce

# Stop current server
pm2 stop bayg-ecommerce || true

# Update the server with fixed permissions directly (no need to recreate everything)
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

// In-memory user storage
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
      isAdmin: true,  // Important: Manager should have isAdmin: true
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
    console.log(`   ${user.role}: ${user.email} / ${user.password} (isAdmin: ${user.isAdmin})`);
  });
}

// Authentication routes
app.post("/api/login", passport.authenticate("local"), (req, res) => {
  console.log('Login successful:', {
    user: req.user ? { 
      id: req.user.id, 
      username: req.user.username, 
      role: req.user.role, 
      isAdmin: req.user.isAdmin,
      isSuperAdmin: req.user.isSuperAdmin 
    } : null,
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
  
  // Permissions based on role - using the exact permission names the frontend expects
  const permissions = [];
  
  console.log('Getting permissions for user:', {
    role: req.user.role,
    isAdmin: req.user.isAdmin,
    isSuperAdmin: req.user.isSuperAdmin
  });
  
  if (req.user.isSuperAdmin) {
    // Super Admin gets all permissions
    permissions.push(
      'users.view', 'users.create', 'users.edit', 'users.delete',
      'products.view', 'products.create', 'products.edit', 'products.delete',
      'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
      'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
      'settings.view', 'settings.edit',
      'reports.view',
      'full_access'
    );
  } else if (req.user.isAdmin) {
    // Admin gets most permissions
    permissions.push(
      'users.view', 'users.create', 'users.edit',
      'products.view', 'products.create', 'products.edit', 'products.delete',
      'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
      'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
      'reports.view'
    );
  } else if (req.user.role === 'Manager') {
    // Manager gets user management and product management permissions
    permissions.push(
      'users.view', 'users.create', 'users.edit',
      'products.view', 'products.create', 'products.edit',
      'orders.view', 'orders.edit',
      'categories.view', 'categories.create', 'categories.edit',
      'reports.view'
    );
  } else if (req.user.role === 'Staff') {
    // Staff gets limited permissions
    permissions.push(
      'products.view',
      'orders.view', 'orders.edit'
    );
  } else {
    // Regular customers
    permissions.push('products.view', 'orders.create');
  }
  
  console.log('Returning permissions:', permissions);
  res.json({ permissions });
});

// Basic API endpoints
app.get("/api/health", (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    users: users.size,
    authenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? { 
      role: req.user.role, 
      isAdmin: req.user.isAdmin,
      isSuperAdmin: req.user.isSuperAdmin 
    } : null
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
      console.log('   Manager: manager@bayg.com / manager123 (has isAdmin: true)');
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

# Start the server
echo "Starting server with fixed role permissions..."
pm2 start bayg-ecommerce

# Wait a moment
sleep 5

# Test the permissions
echo ""
echo "Testing superadmin permissions..."
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=superadmin@bayg.com&password=admin123" \
  -c /tmp/superadmin-cookies.txt -s > /dev/null

echo "Superadmin permissions:"
curl -s http://localhost:5000/api/user/permissions -b /tmp/superadmin-cookies.txt | jq '.permissions[]' | head -10

echo ""
echo "Testing manager permissions..."
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=manager@bayg.com&password=manager123" \
  -c /tmp/manager-cookies.txt -s > /dev/null

echo "Manager permissions:"
curl -s http://localhost:5000/api/user/permissions -b /tmp/manager-cookies.txt | jq '.permissions[]' | head -10

echo ""
pm2 status

if curl -s http://localhost:5000/api/health > /dev/null; then
    echo ""
    echo "✅ Server restarted with fixed permissions!"
    echo "🎯 Both superadmin and manager should now see admin panel"
    echo "📊 Test at: http://3.136.95.83"
else
    echo "❌ Server restart failed"
fi

pm2 save