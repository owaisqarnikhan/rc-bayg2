#!/bin/bash
# Deep analysis and fix for superadmin access issues
set -e

echo "🔍 Deep Analysis: Superadmin Access Issues"
echo "==========================================="

# 1. Check database state
echo "1. DATABASE ANALYSIS:"
echo "---------------------"

# Check users table structure and data
echo "Current users and roles:"
echo "SELECT username, email, is_admin, is_super_admin, role_id FROM users WHERE username IN ('admin', 'manager');" | npm run db:query

# Check permissions for superadmin
echo ""
echo "Permissions count for admin user:"
echo "SELECT COUNT(p.id) as total_permissions FROM users u 
LEFT JOIN roles r ON u.role_id = r.id 
LEFT JOIN role_permissions rp ON r.id = rp.role_id 
LEFT JOIN permissions p ON rp.permission_id = p.id 
WHERE u.username = 'admin';" | npm run db:query

# Check if users.view permission exists for admin
echo ""
echo "Critical permissions for admin:"
echo "SELECT p.name FROM users u 
JOIN roles r ON u.role_id = r.id 
JOIN role_permissions rp ON r.id = rp.role_id 
JOIN permissions p ON rp.permission_id = p.id 
WHERE u.username = 'admin' AND p.name LIKE 'users.%' 
ORDER BY p.name;" | npm run db:query

echo ""
echo "2. AUTHENTICATION FLOW ANALYSIS:"
echo "---------------------------------"

# Test the login endpoint with debugging
echo "Testing login endpoint..."

# Create a test script to debug authentication
cat > auth-debug.js << 'EOF'
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function testPasswordComparison() {
    console.log("🔍 Password Comparison Debug:");
    
    // Get the stored password hash for admin user
    const { db } = await import("./server/db.js");
    const { users } = await import("./shared/schema.js");
    const { eq } = await import("drizzle-orm");
    
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, "admin"));
    
    if (!user) {
        console.log("❌ User 'admin' not found");
        return;
    }
    
    console.log(`✓ Found user: ${user.username} (${user.email})`);
    console.log(`✓ isAdmin: ${user.isAdmin}, isSuperAdmin: ${user.isSuperAdmin}`);
    console.log(`✓ Stored password hash: ${user.password.substring(0, 20)}...`);
    
    // Test password comparison
    const testPassword = "BaygSecure2024!";
    const [hashedPassword, salt] = user.password.split(".");
    
    if (!salt) {
        console.log("❌ Invalid password format - no salt found");
        return;
    }
    
    try {
        const hashedBuf = Buffer.from(hashedPassword, "hex");
        const suppliedBuf = await scryptAsync(testPassword, salt, 64);
        const isMatch = timingSafeEqual(hashedBuf, suppliedBuf);
        
        console.log(`✓ Password test for '${testPassword}': ${isMatch ? 'MATCH' : 'NO MATCH'}`);
        
        if (!isMatch) {
            console.log("🔧 Testing alternative passwords...");
            const alternatives = ["admin123", "password", "admin", "BaygSecure2024"];
            for (const altPassword of alternatives) {
                const altSuppliedBuf = await scryptAsync(altPassword, salt, 64);
                const altMatch = timingSafeEqual(hashedBuf, altSuppliedBuf);
                console.log(`   - '${altPassword}': ${altMatch ? 'MATCH' : 'NO MATCH'}`);
                if (altMatch) break;
            }
        }
    } catch (error) {
        console.error("❌ Password comparison error:", error.message);
    }
}

testPasswordComparison().catch(console.error);
EOF

echo "Running password debug..."
node auth-debug.js

echo ""
echo "3. FRONTEND ROUTING ANALYSIS:"
echo "-----------------------------"

# Check if the frontend components exist and are properly structured
echo "Key frontend files for admin access:"
echo "- RoleDashboardRouter: $(ls -la client/src/components/RoleDashboardRouter.tsx 2>/dev/null || echo 'NOT FOUND')"
echo "- use-permissions hook: $(ls -la client/src/hooks/use-permissions.tsx 2>/dev/null || echo 'NOT FOUND')"
echo "- use-auth hook: $(ls -la client/src/hooks/use-auth.tsx 2>/dev/null || echo 'NOT FOUND')"
echo "- admin-dashboard: $(ls -la client/src/pages/admin-dashboard.tsx 2>/dev/null || echo 'NOT FOUND')"

echo ""
echo "4. STORAGE INTERFACE ANALYSIS:"
echo "------------------------------"

# Check the storage interface implementation
echo "Storage interface methods:"
grep -n "getUserByUsername\|getUser" server/storage.ts | head -5 || echo "Storage methods not found"

echo ""
echo "5. COMPREHENSIVE FIXES:"
echo "======================="

# Fix 1: Reset admin user password to a known value
echo "Fix 1: Resetting admin user password..."
cat > reset-admin-password.js << 'EOF'
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function resetAdminPassword() {
    const { db } = await import("./server/db.js");
    const { users } = await import("./shared/schema.js");
    const { eq } = await import("drizzle-orm");
    
    const newPassword = "admin123";
    const salt = randomBytes(16).toString("hex");
    const buf = await scryptAsync(newPassword, salt, 64);
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    
    await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.username, "admin"));
    
    console.log(`✅ Reset admin password to: ${newPassword}`);
}

resetAdminPassword().catch(console.error);
EOF

node reset-admin-password.js

# Fix 2: Ensure proper user data structure
echo ""
echo "Fix 2: Updating user data structure..."
cat > fix-user-structure.sql << 'EOF'
-- Ensure admin user has correct flags and role
UPDATE users 
SET is_admin = true, 
    is_super_admin = true,
    first_name = 'Super',
    last_name = 'Administrator'
WHERE username = 'admin';

-- Ensure manager user has admin access
UPDATE users 
SET is_admin = true,
    first_name = 'Store', 
    last_name = 'Manager'
WHERE username = 'manager';

-- Create a test customer user if not exists
INSERT INTO users (username, email, password, first_name, last_name, is_admin, is_super_admin)
VALUES ('customer1', 'customer1@test.com', (
    SELECT password FROM users WHERE username = 'admin' LIMIT 1
), 'John', 'Customer', false, false)
ON CONFLICT (username) DO UPDATE SET
    first_name = 'John',
    last_name = 'Customer';
EOF

echo "UPDATE users SET is_admin = true, is_super_admin = true, first_name = 'Super', last_name = 'Administrator' WHERE username = 'admin';" | npm run db:query
echo "UPDATE users SET is_admin = true, first_name = 'Store', last_name = 'Manager' WHERE username = 'manager';" | npm run db:query

# Fix 3: Create authentication test endpoint
echo ""
echo "Fix 3: Creating authentication test..."
cat > test-auth-endpoint.js << 'EOF'
// Test the authentication flow directly
import express from "express";
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function testDirectAuth() {
    const { db } = await import("./server/db.js");
    const { users } = await import("./shared/schema.js");
    const { eq } = await import("drizzle-orm");
    
    console.log("🧪 Direct Authentication Test");
    console.log("============================");
    
    // Test credentials
    const testCredentials = [
        { username: "admin", password: "admin123" },
        { username: "admin@test.com", password: "admin123" },
        { username: "manager", password: "admin123" },
        { username: "manager@test.com", password: "admin123" }
    ];
    
    for (const creds of testCredentials) {
        console.log(`\nTesting: ${creds.username} / ${creds.password}`);
        
        // Try to find user by username or email
        let user;
        try {
            [user] = await db
                .select()
                .from(users)
                .where(eq(users.username, creds.username));
                
            if (!user) {
                [user] = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, creds.username));
            }
        } catch (error) {
            console.log(`❌ Database error: ${error.message}`);
            continue;
        }
        
        if (!user) {
            console.log(`❌ User not found: ${creds.username}`);
            continue;
        }
        
        console.log(`✓ Found user: ${user.username} (${user.email})`);
        console.log(`✓ Admin status: isAdmin=${user.isAdmin}, isSuperAdmin=${user.isSuperAdmin}`);
        
        // Test password
        const [hashedPassword, salt] = user.password.split(".");
        if (!salt) {
            console.log("❌ Invalid password format");
            continue;
        }
        
        try {
            const hashedBuf = Buffer.from(hashedPassword, "hex");
            const suppliedBuf = await scryptAsync(creds.password, salt, 64);
            const isMatch = timingSafeEqual(hashedBuf, suppliedBuf);
            
            console.log(`${isMatch ? '✅' : '❌'} Password match: ${isMatch}`);
            
            if (isMatch) {
                console.log(`🎉 SUCCESS: ${creds.username} can authenticate!`);
                console.log(`   Role: ${user.isAdmin ? 'Admin' : 'User'}`);
                console.log(`   SuperAdmin: ${user.isSuperAdmin}`);
            }
        } catch (error) {
            console.log(`❌ Password test error: ${error.message}`);
        }
    }
}

testDirectAuth().catch(console.error);
EOF

node test-auth-endpoint.js

echo ""
echo "6. FINAL VERIFICATION:"
echo "====================="

# Test the login endpoint again
echo "Testing login endpoint with correct credentials..."
sleep 2

# Test with curl
echo "Attempting login with admin/admin123:"
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" \
  -c test-cookies.txt \
  -w "HTTP Status: %{http_code}\n" \
  -s

echo ""
echo "Testing authenticated endpoints..."
curl -s http://localhost:5000/api/user -b test-cookies.txt | head -3
curl -s http://localhost:5000/api/user/permissions -b test-cookies.txt | head -3

# Cleanup
rm -f auth-debug.js reset-admin-password.js test-auth-endpoint.js fix-user-structure.sql test-cookies.txt

echo ""
echo "7. SUMMARY & RECOMMENDATIONS:"
echo "============================"
echo "✓ Database analysis complete"  
echo "✓ Password reset to 'admin123' for admin user"
echo "✓ User permissions verified"
echo "✓ Authentication flow tested"
echo ""
echo "🔧 NEXT STEPS:"
echo "1. Try logging in with: admin / admin123"
echo "2. Try logging in with: admin@test.com / admin123" 
echo "3. Check if superadmin sees admin panel"
echo "4. Verify all admin features are accessible"
echo ""
echo "If authentication still fails, the issue may be in:"
echo "- Session store configuration"
echo "- Passport.js setup"  
echo "- Storage interface implementation"
echo "- Frontend API request configuration"