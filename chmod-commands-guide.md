# Chmod Commands for BAYG Project

## Common Chmod Usage in This Project

### Make Scripts Executable
```bash
# Make a single script executable
chmod +x script-name.sh

# Make all shell scripts executable
chmod +x *.sh

# Make specific fix scripts executable
chmod +x fix-superadmin-settings-access.sh
chmod +x complete-auth-fix.sh
chmod +x create-multiple-users.sh
```

### Current Project Scripts That Need Execute Permissions
```bash
chmod +x fix-superadmin-settings-access.sh
chmod +x complete-auth-fix.sh
chmod +x bypass-seeding-fix.sh
chmod +x complete-fix.sh
chmod +x create-bulk-users.sh
chmod +x create-multiple-users.sh
chmod +x create-proper-server.sh
chmod +x database-setup.sql
chmod +x deploy.sh
chmod +x direct-fix.sh
chmod +x emergency-superadmin-reset.sh
chmod +x final-fix.sh
chmod +x fix-deployment.sh
chmod +x fix-full-application.sh
chmod +x fix-pg-auth-complete.sh
chmod +x fix-postgres-auth.sh
chmod +x fix-superadmin-access.sh
chmod +x fix-superadmin-settings-access.sh
chmod +x postgresql-commands.sh
chmod +x quick-auth-fix.sh
chmod +x quick-permission-fix.sh
chmod +x restart-server.sh
chmod +x server-setup.sh
chmod +x stop-restart-loop.sh
chmod +x superadmin-access-solution.sh
chmod +x superadmin-full-permissions-fix.sh
chmod +x ubuntu-superadmin-fix.sh
```

### Chmod Permission Numbers Explained
- `755` = rwxr-xr-x (owner: read/write/execute, group/others: read/execute)
- `644` = rw-r--r-- (owner: read/write, group/others: read only)
- `600` = rw------- (owner: read/write only)
- `777` = rwxrwxrwx (all permissions for everyone - avoid in production)

### Usage Examples
```bash
# Make script executable for owner only
chmod 700 script.sh

# Make script executable for owner, readable for group/others
chmod 755 script.sh

# Make all scripts in current directory executable
chmod +x *.sh

# Remove execute permission
chmod -x script.sh

# Set specific permissions
chmod 755 deploy.sh
chmod 644 README.md
chmod 600 .env
```

### For AWS EC2 Deployment
```bash
# Make deployment scripts executable
chmod +x deploy.sh
chmod +x server-setup.sh
chmod +x nginx.conf

# Set proper permissions for configuration files
chmod 644 .env.example
chmod 600 .env

# Set permissions for uploaded files directory
chmod 755 uploads/
```

### Quick Command to Fix All Project Scripts
```bash
# Run this to make all shell scripts executable at once
find . -name "*.sh" -type f -exec chmod +x {} \;
```