#!/bin/bash
# Create Random Multiple Users for BAYG E-commerce Platform
# This script creates various user types with realistic data

set -e

echo "🧑‍🤝‍🧑 CREATING MULTIPLE RANDOM USERS"
echo "===================================="

# Function to run SQL commands
run_sql() {
    local query="$1"
    if [ -n "$DATABASE_URL" ]; then
        psql -d "$DATABASE_URL" -c "$query" 2>/dev/null || echo "Execute manually: $query"
    else
        echo "RUN THIS SQL: $query"
    fi
}

# Generate password hash for 'password123'
echo "Getting password hash for default password..."
PASSWORD_HASH=$(node -e "
const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');
const scryptAsync = promisify(scrypt);

async function hashPassword() {
    const password = 'password123';
    const salt = randomBytes(16).toString('hex');
    const buf = await scryptAsync(password, salt, 64);
    const hashedPassword = \`\${buf.toString('hex')}.\${salt}\`;
    console.log(hashedPassword);
}
hashPassword().catch(console.error);
" 2>/dev/null || echo "b417bb217af7f34130796b28cbe7eddf12a654028e24d139fd0c4c78f552235ec9f0d2b64718a4b003a15afe9cb049d262a55b306c67b79ee84e3c3fb7bf507c.22e0ff5a31995946ff3da79b7f4afdd8")

echo "Using password hash: ${PASSWORD_HASH:0:20}..."

# Get role IDs
echo "Getting role IDs..."
run_sql "SELECT id, name FROM roles;"

USER_ROLE_ID=$(psql -d "$DATABASE_URL" -t -c "SELECT id FROM roles WHERE name = 'user';" 2>/dev/null | tr -d ' ' || echo "")
MANAGER_ROLE_ID=$(psql -d "$DATABASE_URL" -t -c "SELECT id FROM roles WHERE name = 'manager';" 2>/dev/null | tr -d ' ' || echo "")

echo "User role ID: $USER_ROLE_ID"
echo "Manager role ID: $MANAGER_ROLE_ID"

echo ""
echo "Creating users..."

# Regular Customers
echo "1. Creating Regular Customers (10 users)..."
cat << EOF | while IFS='|' read -r username email first_name last_name; do
customer1|customer1@gmail.com|Ahmed|Al-Rashid
customer2|customer2@hotmail.com|Fatima|Al-Zahra
customer3|customer3@yahoo.com|Mohammed|Bin-Hassan
customer4|customer4@outlook.com|Aisha|Al-Khalifa
customer5|customer5@gmail.com|Omar|Al-Sabah
customer6|customer6@hotmail.com|Layla|Bint-Ahmed
customer7|customer7@yahoo.com|Khalid|Al-Thani
customer8|customer8@outlook.com|Maryam|Al-Mansouri
customer9|customer9@gmail.com|Hassan|Al-Kuwari
customer10|customer10@hotmail.com|Noor|Al-Dosari
EOF
    run_sql "INSERT INTO users (username, email, password, first_name, last_name, is_admin, is_super_admin, role_id) VALUES ('$username', '$email', '$PASSWORD_HASH', '$first_name', '$last_name', false, false, '$USER_ROLE_ID') ON CONFLICT (username) DO NOTHING;"
    echo "Created: $username ($first_name $last_name)"
done

echo ""
echo "2. Creating Business Customers (5 users)..."
cat << EOF | while IFS='|' read -r username email first_name last_name; do
business1|business1@company.bh|Salam|Al-Mannai
business2|business2@trading.bh|Youssef|Al-Zayani
business3|business3@retail.bh|Amina|Bin-Sulayem
business4|business4@wholesale.bh|Tariq|Al-Fadhel
business5|business5@import.bh|Zahra|Al-Ghurair
EOF
    run_sql "INSERT INTO users (username, email, password, first_name, last_name, is_admin, is_super_admin, role_id) VALUES ('$username', '$email', '$PASSWORD_HASH', '$first_name', '$last_name', false, false, '$USER_ROLE_ID') ON CONFLICT (username) DO NOTHING;"
    echo "Created: $username ($first_name $last_name)"
done

echo ""
echo "3. Creating Store Managers (3 users)..."
cat << EOF | while IFS='|' read -r username email first_name last_name; do
manager1|manager1@bayg.com|Rashid|Al-Khalifa
manager2|manager2@bayg.com|Mariam|Al-Sabah
manager3|manager3@bayg.com|Abdullah|Al-Thani
EOF
    run_sql "INSERT INTO users (username, email, password, first_name, last_name, is_admin, is_super_admin, role_id) VALUES ('$username', '$email', '$PASSWORD_HASH', '$first_name', '$last_name', true, false, '$MANAGER_ROLE_ID') ON CONFLICT (username) DO NOTHING;"
    echo "Created: $username ($first_name $last_name) [MANAGER]"
done

echo ""
echo "4. Creating Test Users with Special Cases (5 users)..."
cat << EOF | while IFS='|' read -r username email first_name last_name; do
testuser1|test.user1@test.com|John|Doe
testuser2|test.user2@test.com|Jane|Smith
testuser3|test.user3@test.com|Ali|Hassan
testuser4|test.user4@test.com|Sara|Ahmed
testuser5|test.user5@test.com|Mike|Johnson
EOF
    run_sql "INSERT INTO users (username, email, password, first_name, last_name, is_admin, is_super_admin, role_id) VALUES ('$username', '$email', '$PASSWORD_HASH', '$first_name', '$last_name', false, false, '$USER_ROLE_ID') ON CONFLICT (username) DO NOTHING;"
    echo "Created: $username ($first_name $last_name)"
done

echo ""
echo "5. Creating VIP Customers (3 users)..."
cat << EOF | while IFS='|' read -r username email first_name last_name; do
vip1|vip1@premium.bh|Khalifa|Al-Maktoum
vip2|vip2@luxury.bh|Sheikha|Bint-Rashid
vip3|vip3@elite.bh|Sultan|Al-Qassimi
EOF
    run_sql "INSERT INTO users (username, email, password, first_name, last_name, is_admin, is_super_admin, role_id) VALUES ('$username', '$email', '$PASSWORD_HASH', '$first_name', '$last_name', false, false, '$USER_ROLE_ID') ON CONFLICT (username) DO NOTHING;"
    echo "Created: $username ($first_name $last_name) [VIP]"
done

echo ""
echo "6. VERIFICATION"
echo "==============="

echo "Total users created:"
run_sql "SELECT COUNT(*) as total_users FROM users;"

echo ""
echo "Users by role:"
run_sql "SELECT r.name as role, COUNT(u.id) as user_count FROM users u LEFT JOIN roles r ON u.role_id = r.id GROUP BY r.name ORDER BY user_count DESC;"

echo ""
echo "Sample of created users:"
run_sql "SELECT username, email, first_name, last_name, is_admin FROM users WHERE username LIKE 'customer%' OR username LIKE 'manager%' OR username LIKE 'business%' LIMIT 10;"

echo ""
echo "🎯 USER CREATION SUMMARY"
echo "========================"
echo "✅ Regular Customers: 10 users"
echo "✅ Business Customers: 5 users"
echo "✅ Store Managers: 3 users"
echo "✅ Test Users: 5 users"
echo "✅ VIP Customers: 3 users"
echo ""
echo "📝 LOGIN CREDENTIALS:"
echo "--------------------"
echo "All users can login with their username and password: password123"
echo ""
echo "Examples:"
echo "• customer1 / password123"
echo "• business1 / password123"
echo "• manager1 / password123 (has admin access)"
echo "• vip1 / password123"
echo ""
echo "🔧 ADMIN ACCESS:"
echo "---------------"
echo "Managers (manager1, manager2, manager3) have admin panel access"
echo "Regular users will see the customer dashboard"
echo ""
echo "Total users in system: $(psql -d "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo 'Check manually')"