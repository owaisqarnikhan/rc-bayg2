#!/bin/bash
# PostgreSQL Commands for BAYG E-commerce Database Management
# Complete collection of PostgreSQL commands for user management, database operations, and data manipulation

echo "📊 POSTGRESQL COMMANDS FOR BAYG DATABASE"
echo "========================================"

# Database connection info
echo "Connection Info:"
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."
echo ""

echo "🔧 BASIC POSTGRESQL COMMANDS:"
echo "============================="

# 1. Connect to database
echo "1. Connect to PostgreSQL:"
echo "psql -d \"\$DATABASE_URL\""
echo ""

# 2. Basic database operations
echo "2. Database Operations:"
echo "# List all databases"
echo "psql -d \"\$DATABASE_URL\" -c \"\\l\""
echo ""
echo "# List all tables"
echo "psql -d \"\$DATABASE_URL\" -c \"\\dt\""
echo ""
echo "# Describe table structure"
echo "psql -d \"\$DATABASE_URL\" -c \"\\d users\""
echo "psql -d \"\$DATABASE_URL\" -c \"\\d products\""
echo "psql -d \"\$DATABASE_URL\" -c \"\\d orders\""
echo ""

echo "👥 USER MANAGEMENT COMMANDS:"
echo "============================"

# User queries
echo "3. User Queries:"
echo "# Show all users with roles"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT u.username, u.email, u.first_name, u.last_name, u.is_admin, u.is_super_admin, r.name as role FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u.username;\""
echo ""

echo "# Count users by role"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT r.name as role, COUNT(u.id) as user_count FROM users u LEFT JOIN roles r ON u.role_id = r.id GROUP BY r.name ORDER BY user_count DESC;\""
echo ""

echo "# Find specific user"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT * FROM users WHERE username = 'admin';\""
echo ""

echo "# Show user permissions"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT p.name FROM users u JOIN roles r ON u.role_id = r.id JOIN role_permissions rp ON r.id = rp.role_id JOIN permissions p ON rp.permission_id = p.id WHERE u.username = 'admin' ORDER BY p.name;\""
echo ""

echo "🛠️ USER MODIFICATION COMMANDS:"
echo "=============================="

echo "4. Create New User:"
echo "psql -d \"\$DATABASE_URL\" -c \"INSERT INTO users (username, email, password, first_name, last_name, is_admin, is_super_admin, role_id) VALUES ('newuser', 'newuser@test.com', 'password_hash_here', 'First', 'Last', false, false, (SELECT id FROM roles WHERE name = 'user'));\""
echo ""

echo "5. Update User Role:"
echo "# Make user admin"
echo "psql -d \"\$DATABASE_URL\" -c \"UPDATE users SET is_admin = true, role_id = (SELECT id FROM roles WHERE name = 'manager') WHERE username = 'username_here';\""
echo ""
echo "# Make user superadmin"
echo "psql -d \"\$DATABASE_URL\" -c \"UPDATE users SET is_admin = true, is_super_admin = true, role_id = (SELECT id FROM roles WHERE name = 'super_admin') WHERE username = 'username_here';\""
echo ""

echo "# Remove admin privileges"
echo "psql -d \"\$DATABASE_URL\" -c \"UPDATE users SET is_admin = false, is_super_admin = false, role_id = (SELECT id FROM roles WHERE name = 'user') WHERE username = 'username_here';\""
echo ""

echo "6. Delete User:"
echo "psql -d \"\$DATABASE_URL\" -c \"DELETE FROM users WHERE username = 'username_here';\""
echo ""

echo "🔑 PERMISSION MANAGEMENT:"
echo "========================"

echo "7. Permission Commands:"
echo "# Show all permissions"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT pm.name as module, p.name as permission, p.display_name FROM permissions p JOIN permission_modules pm ON p.module_id = pm.id ORDER BY pm.name, p.name;\""
echo ""

echo "# Show role permissions"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT r.name as role, COUNT(rp.permission_id) as permission_count FROM roles r LEFT JOIN role_permissions rp ON r.id = rp.role_id GROUP BY r.name;\""
echo ""

echo "# Grant all permissions to a role"
echo "psql -d \"\$DATABASE_URL\" -c \"INSERT INTO role_permissions (role_id, permission_id) SELECT (SELECT id FROM roles WHERE name = 'role_name'), id FROM permissions ON CONFLICT DO NOTHING;\""
echo ""

echo "🛒 BUSINESS DATA QUERIES:"
echo "========================"

echo "8. Product Management:"
echo "# Show all products"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT p.name, p.price, p.stock_quantity, c.name as category FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name;\""
echo ""

echo "# Count products by category"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT c.name as category, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.name ORDER BY product_count DESC;\""
echo ""

echo "9. Order Management:"
echo "# Show recent orders"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT o.id, u.username, o.total_amount, o.status, o.created_at FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 10;\""
echo ""

echo "# Orders by status"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT status, COUNT(*) as order_count FROM orders GROUP BY status ORDER BY order_count DESC;\""
echo ""

echo "# Revenue statistics"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT SUM(total_amount) as total_revenue, AVG(total_amount) as average_order, COUNT(*) as total_orders FROM orders WHERE status = 'completed';\""
echo ""

echo "🔧 MAINTENANCE COMMANDS:"
echo "======================="

echo "10. Database Maintenance:"
echo "# Backup database"
echo "pg_dump \"\$DATABASE_URL\" > backup_\$(date +%Y%m%d_%H%M%S).sql"
echo ""

echo "# Restore database"
echo "psql -d \"\$DATABASE_URL\" < backup_file.sql"
echo ""

echo "# Check database size"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT pg_size_pretty(pg_database_size(current_database()));\""
echo ""

echo "# Check table sizes"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;\""
echo ""

echo "🧹 CLEANUP COMMANDS:"
echo "=================="

echo "11. Data Cleanup:"
echo "# Delete test users (be careful!)"
echo "psql -d \"\$DATABASE_URL\" -c \"DELETE FROM users WHERE username LIKE 'test%' OR username LIKE 'customer%';\""
echo ""

echo "# Reset auto-increment sequences"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM users;\""
echo ""

echo "# Vacuum and analyze (optimize performance)"
echo "psql -d \"\$DATABASE_URL\" -c \"VACUUM ANALYZE;\""
echo ""

echo "📊 ANALYTICS QUERIES:"
echo "==================="

echo "12. Business Analytics:"
echo "# User registration trends (last 30 days)"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT DATE(created_at) as date, COUNT(*) as new_users FROM users WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY DATE(created_at) ORDER BY date;\""
echo ""

echo "# Top customers by orders"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT u.username, u.email, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent FROM users u JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.username, u.email ORDER BY total_spent DESC LIMIT 10;\""
echo ""

echo "# Monthly revenue"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT DATE_TRUNC('month', created_at) as month, SUM(total_amount) as revenue FROM orders WHERE status = 'completed' GROUP BY month ORDER BY month DESC;\""
echo ""

echo "⚡ QUICK INTERACTIVE MODE:"
echo "========================"

echo "13. Start Interactive PostgreSQL Session:"
echo "psql -d \"\$DATABASE_URL\""
echo ""
echo "Inside psql, you can use:"
echo "\\dt        - List tables"
echo "\\d users   - Describe users table"
echo "\\q         - Quit"
echo "\\h         - Help"
echo "\\?         - List all commands"
echo ""

echo "🎯 COMMONLY USED COMMANDS:"
echo "========================="
echo "# Quick user check"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT username, is_admin, is_super_admin FROM users WHERE username IN ('admin', 'manager');\""
echo ""
echo "# Quick permission count"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT r.name, COUNT(rp.permission_id) FROM roles r LEFT JOIN role_permissions rp ON r.id = rp.role_id GROUP BY r.name;\""
echo ""
echo "# System status"
echo "psql -d \"\$DATABASE_URL\" -c \"SELECT 'Users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'Products', COUNT(*) FROM products UNION ALL SELECT 'Orders', COUNT(*) FROM orders;\""
echo ""

echo "✅ COMMANDS READY TO USE!"
echo "Copy and paste any command above to execute it."