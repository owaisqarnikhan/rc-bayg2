#!/bin/bash
# Bulk User Creation with Random Data Generator
# Creates configurable number of users with realistic Middle Eastern names

set -e

echo "🎲 BULK RANDOM USER GENERATOR"
echo "============================="

# Configuration
TOTAL_USERS=${1:-50}  # Default 50 users if not specified
DEFAULT_PASSWORD="password123"

echo "Creating $TOTAL_USERS random users..."

# Arrays for random name generation
FIRST_NAMES_MALE=("Ahmed" "Mohammed" "Ali" "Omar" "Hassan" "Khalid" "Abdullah" "Rashid" "Youssef" "Tariq" "Salem" "Mansour" "Faisal" "Nasser" "Hamad" "Sultan" "Majid" "Saeed" "Waleed" "Fahad")
FIRST_NAMES_FEMALE=("Fatima" "Aisha" "Maryam" "Layla" "Noor" "Zahra" "Amina" "Sara" "Mariam" "Noura" "Hala" "Reem" "Dina" "Lina" "Rana" "Salam" "Maha" "Rania" "Yasmina" "Ghada")
LAST_NAMES=("Al-Rashid" "Al-Khalifa" "Al-Sabah" "Al-Thani" "Al-Mansouri" "Al-Kuwari" "Al-Dosari" "Bin-Hassan" "Al-Zahra" "Al-Mannai" "Al-Zayani" "Bin-Sulayem" "Al-Fadhel" "Al-Ghurair" "Al-Maktoum" "Bint-Rashid" "Al-Qassimi" "Al-Nahyan" "Al-Saud" "Al-Hashemi")
DOMAINS=("gmail.com" "hotmail.com" "yahoo.com" "outlook.com" "company.bh" "business.bh" "email.bh" "bahrain.bh")

# Function to run SQL
run_sql() {
    local query="$1"
    if [ -n "$DATABASE_URL" ]; then
        psql -d "$DATABASE_URL" -c "$query" 2>/dev/null || echo "SQL Error: $query"
    else
        echo "RUN MANUALLY: $query"
    fi
}

# Generate password hash
echo "Generating password hash..."
PASSWORD_HASH=$(node -e "
const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');
const scryptAsync = promisify(scrypt);

async function hashPassword() {
    const password = '$DEFAULT_PASSWORD';
    const salt = randomBytes(16).toString('hex');
    const buf = await scryptAsync(password, salt, 64);
    console.log(\`\${buf.toString('hex')}.\${salt}\`);
}
hashPassword().catch(() => console.log('b417bb217af7f34130796b28cbe7eddf12a654028e24d139fd0c4c78f552235ec9f0d2b64718a4b003a15afe9cb049d262a55b306c67b79ee84e3c3fb7bf507c.22e0ff5a31995946ff3da79b7f4afdd8'));
" 2>/dev/null || echo "b417bb217af7f34130796b28cbe7eddf12a654028e24d139fd0c4c78f552235ec9f0d2b64718a4b003a15afe9cb049d262a55b306c67b79ee84e3c3fb7bf507c.22e0ff5a31995946ff3da79b7f4afdd8")

# Get role IDs
USER_ROLE_ID=$(psql -d "$DATABASE_URL" -t -c "SELECT id FROM roles WHERE name = 'user';" 2>/dev/null | tr -d ' ' || echo "")
MANAGER_ROLE_ID=$(psql -d "$DATABASE_URL" -t -c "SELECT id FROM roles WHERE name = 'manager';" 2>/dev/null | tr -d ' ' || echo "")

echo "Password hash generated"
echo "User role ID: $USER_ROLE_ID"
echo "Manager role ID: $MANAGER_ROLE_ID"

# Function to get random array element
get_random() {
    local arr=("$@")
    echo "${arr[RANDOM % ${#arr[@]}]}"
}

echo ""
echo "Creating $TOTAL_USERS users..."

for ((i=1; i<=TOTAL_USERS; i++)); do
    # Random gender assignment
    if [ $((RANDOM % 2)) -eq 0 ]; then
        FIRST_NAME=$(get_random "${FIRST_NAMES_MALE[@]}")
    else
        FIRST_NAME=$(get_random "${FIRST_NAMES_FEMALE[@]}")
    fi
    
    LAST_NAME=$(get_random "${LAST_NAMES[@]}")
    DOMAIN=$(get_random "${DOMAINS[@]}")
    
    # Generate unique username and email
    USERNAME="user${i}_$(echo $FIRST_NAME | tr '[:upper:]' '[:lower:]')"
    EMAIL="${USERNAME}@${DOMAIN}"
    
    # Determine role (10% managers, 90% regular users)
    if [ $((RANDOM % 10)) -eq 0 ] && [ -n "$MANAGER_ROLE_ID" ]; then
        IS_ADMIN="true"
        ROLE_ID="$MANAGER_ROLE_ID"
        ROLE_TYPE="[MANAGER]"
    else
        IS_ADMIN="false"
        ROLE_ID="$USER_ROLE_ID"
        ROLE_TYPE=""
    fi
    
    # Insert user
    run_sql "INSERT INTO users (username, email, password, first_name, last_name, is_admin, is_super_admin, role_id) VALUES ('$USERNAME', '$EMAIL', '$PASSWORD_HASH', '$FIRST_NAME', '$LAST_NAME', $IS_ADMIN, false, '$ROLE_ID') ON CONFLICT (username) DO NOTHING;"
    
    echo "Created: $USERNAME ($FIRST_NAME $LAST_NAME) $ROLE_TYPE"
    
    # Progress indicator
    if [ $((i % 10)) -eq 0 ]; then
        echo "Progress: $i/$TOTAL_USERS users created..."
    fi
done

echo ""
echo "🎯 BULK CREATION COMPLETE"
echo "========================"

# Verification
echo "Final statistics:"
run_sql "SELECT COUNT(*) as total_users FROM users;"
run_sql "SELECT r.name as role, COUNT(u.id) as count FROM users u LEFT JOIN roles r ON u.role_id = r.id GROUP BY r.name;"

echo ""
echo "📝 USAGE INSTRUCTIONS:"
echo "====================="
echo "All users can login with: [username] / $DEFAULT_PASSWORD"
echo ""
echo "Examples of created users:"
run_sql "SELECT username, first_name, last_name, email, is_admin FROM users WHERE username LIKE 'user%' ORDER BY username LIMIT 5;"

echo ""
echo "🔄 TO CREATE MORE USERS:"
echo "======================="
echo "Run: ./create-bulk-users.sh [NUMBER]"
echo "Example: ./create-bulk-users.sh 100  (creates 100 users)"