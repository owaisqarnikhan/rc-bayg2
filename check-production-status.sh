#!/bin/bash
# Check Production Status
# Quick status check for production deployment

echo "📊 PRODUCTION STATUS CHECK"
echo "=========================="

echo "1. PM2 Processes:"
pm2 status

echo ""
echo "2. Port 5000 Status:"
netstat -tulpn | grep :5000 || echo "❌ No process on port 5000"

echo ""
echo "3. Server Health:"
curl -s -w "Status: %{http_code}, Time: %{time_total}s\n" -o /tmp/health-check.txt http://localhost:5000/health
if [ -f /tmp/health-check.txt ]; then
    echo "Response: $(cat /tmp/health-check.txt)"
    rm -f /tmp/health-check.txt
fi

echo ""
echo "4. API Endpoints:"
endpoints=("/api/settings" "/api/products" "/api/categories" "/api/admin/stats")
for endpoint in "${endpoints[@]}"; do
    status=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:5000$endpoint" 2>/dev/null || echo "000")
    echo "$endpoint: $status"
done

echo ""
echo "5. Recent Logs (last 10 lines):"
pm2 logs bayg-ecommerce --lines 10 --nostream || echo "No logs available"

echo ""
echo "✅ STATUS CHECK COMPLETE"