#!/bin/bash
# Quick fix for all permission issues

echo "Fixing all script permissions..."
find . -name "*.sh" -type f -exec chmod +x {} \;

echo "Fixed scripts:"
ls -la *.sh | grep "^-rwx"

echo ""
echo "Now you can run:"
echo "./ubuntu-superadmin-fix.sh"