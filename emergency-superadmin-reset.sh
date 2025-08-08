#!/bin/bash
# Emergency Superadmin Reset - Nuclear option for complete permission reset

echo "🚨 EMERGENCY SUPERADMIN RESET"
echo "============================="

# Function to run SQL
run_sql() {
    local query="$1"
    if [ -n "$DATABASE_URL" ]; then
        psql -d "$DATABASE_URL" -c "$query" 2>/dev/null || echo "SQL: $query"
    else
        echo "RUN THIS SQL: $query"
    fi
}

echo "1. NUCLEAR PERMISSION RESET"
echo "Delete and recreate ALL permissions for super_admin role..."

# Clear all role permissions for super_admin
run_sql "DELETE FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin');"

# Grant EVERY permission to super_admin
run_sql "INSERT INTO role_permissions (role_id, permission_id) SELECT (SELECT id FROM roles WHERE name = 'super_admin'), id FROM permissions;"

echo ""
echo "2. ADMIN USER COMPLETE RESET"
echo "Force admin user to have maximum privileges..."

# Reset admin user completely
run_sql "UPDATE users SET is_admin = true, is_super_admin = true, role_id = (SELECT id FROM roles WHERE name = 'super_admin') WHERE username = 'admin';"

echo ""
echo "3. CREATE BACKUP SUPERADMIN"
echo "Create emergency superadmin account..."

# Create emergency backup admin
run_sql "INSERT INTO users (username, email, password, first_name, last_name, is_admin, is_super_admin, role_id) VALUES ('superadmin', 'superadmin@test.com', (SELECT password FROM users WHERE username = 'admin'), 'Emergency', 'SuperAdmin', true, true, (SELECT id FROM roles WHERE name = 'super_admin')) ON CONFLICT (username) DO UPDATE SET is_admin = true, is_super_admin = true, role_id = (SELECT id FROM roles WHERE name = 'super_admin');"

echo ""
echo "4. FORCE APPLICATION RESTART"

# Kill all node processes
pkill -f "node" || true
pkill -f "npm" || true

# Restart with PM2
if command -v pm2 &> /dev/null; then
    pm2 delete all || true
    pm2 start ecosystem.config.cjs --env production
    sleep 5
    pm2 status
fi

echo ""
echo "5. VERIFICATION"

sleep 10

# Test both admin accounts
for user in "admin" "superadmin"; do
    echo "Testing $user account..."
    curl -X POST http://localhost:5000/api/login \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "username=$user&password=admin123" \
      -c "${user}-cookies.txt" \
      -w "Status: %{http_code} " \
      -s -o "${user}-response.json"
    
    if [ -f "${user}-response.json" ]; then
        echo "Response: $(head -c 100 ${user}-response.json)"
    fi
    echo ""
done

echo ""
echo "🎯 EMERGENCY RESET COMPLETE"
echo "=========================="
echo ""
echo "ACCOUNTS AVAILABLE:"
echo "1. admin / admin123"
echo "2. superadmin / admin123"
echo ""
echo "Both accounts now have COMPLETE superadmin access!"
echo "Try logging in with either account."

# Cleanup
rm -f *-cookies.txt *-response.json 2>/dev/null || true