# AWS EC2 Ubuntu Deployment Guide
**Server IP: 3.136.95.83**

## 📁 Deployment Files Created

Your project now includes these deployment files:

- **`server-setup.sh`** - Initial server setup script
- **`deploy.sh`** - Main deployment script  
- **`ecosystem.config.js`** - PM2 process configuration
- **`nginx.conf`** - Nginx web server configuration
- **`database-setup.sql`** - PostgreSQL database setup
- **`env.example`** - Environment variables template

## 🚀 Quick Deployment Steps

### Step 1: Upload Project to Server
```bash
# From your local machine:
scp -i "your-key.pem" -r ./* ubuntu@3.136.95.83:/home/ubuntu/bayg-ecommerce/
```

### Step 2: Run Server Setup (First Time Only)
```bash
# Connect to your server:
ssh -i "your-key.pem" ubuntu@3.136.95.83

# Make setup script executable and run it:
cd /home/ubuntu/bayg-ecommerce
chmod +x server-setup.sh
./server-setup.sh
```

### Step 3: Deploy Application
```bash
# Make deploy script executable and run it:
chmod +x deploy.sh
./deploy.sh
```

## ✅ After Deployment

Your application will be available at: **http://3.136.95.83**

### Default Login Credentials:
- **Admin:** admin@test.com / admin123
- **Manager:** manager@test.com / manager123  
- **User:** john@test.com / user123

## 🔧 Management Commands

```bash
# View application status
pm2 status

# View application logs
pm2 logs bayg-ecommerce

# Restart application
pm2 restart bayg-ecommerce

# Stop application
pm2 stop bayg-ecommerce

# Restart Nginx
sudo systemctl restart nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

## 🚨 Troubleshooting Common Issues

### Issue 1: PostgreSQL Authentication Failed
**Error:** `password authentication failed for user "bayg_user"`

**Solution:** Run the deployment fix script:
```bash
cd /home/ubuntu/bayg-ecommerce
chmod +x fix-deployment.sh
./fix-deployment.sh
```

This will:
- Drop and recreate the database user with correct permissions
- Fix the DATABASE_URL in environment file
- Test database connection
- Restart the application

### Issue 2: PM2 Configuration Error
**Error:** `File ecosystem.config.js malformated` or `module is not defined`

**Solution:** The PM2 config has been moved to `ecosystem.config.cjs` to avoid ES module conflicts. Use:
```bash
pm2 delete all
pm2 start ecosystem.config.cjs --env production
```

### Issue 3: DATABASE_URL Not Set
**Error:** `DATABASE_URL must be set. Did you forget to provision a database?`

**Solution:** 
1. Check if .env file exists: `ls -la .env`
2. If missing, run: `./fix-deployment.sh`
3. Verify environment variables: `cat .env`

### Issue 4: Database Connection Issues
**Test database connection manually:**
```bash
# Test with psql
psql postgresql://bayg_user:BaygSecure2024!@localhost:5432/bayg_production

# Test with node
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://bayg_user:BaygSecure2024!@localhost:5432/bayg_production' });
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Error:', err.message);
  else console.log('Success:', res.rows[0]);
  pool.end();
});
"
```

### Issue 5: Application Not Responding
**Check these steps:**
```bash
# 1. Check PM2 status
pm2 status

# 2. Check application logs
pm2 logs bayg-ecommerce --lines 50

# 3. Check if port is in use
netstat -tlnp | grep :5000

# 4. Test direct connection
curl http://localhost:5000

# 5. Restart everything
pm2 restart bayg-ecommerce
sudo systemctl restart nginx
```

## 📊 System Services Status

```bash
# Check all services
sudo systemctl status postgresql nginx

# Check firewall status
sudo ufw status

# Check PM2 processes
pm2 list
```

## 🔒 Security Notes

- Database password: `BaygSecure2024!` (change in production)
- Firewall configured to allow ports 22, 80, 443 only
- Session secrets auto-generated during deployment

## 🔄 Updates and Maintenance

To update your application:
```bash
cd /home/ubuntu/bayg-ecommerce
git pull origin main  # or upload new files
npm install
npm run build
pm2 restart bayg-ecommerce
```

## 📁 Project Structure on Server

```
/home/ubuntu/bayg-ecommerce/
├── server/           # Backend code
├── client/           # Frontend code  
├── uploads/          # User uploaded files
├── logs/             # Application logs
├── .env              # Environment variables
├── ecosystem.config.js
└── deploy.sh
```

## 🆘 Troubleshooting

**Application not starting:**
```bash
pm2 logs bayg-ecommerce
pm2 restart bayg-ecommerce
```

**Database connection issues:**
```bash
sudo systemctl status postgresql
sudo -u postgres psql -d bayg_production -c "SELECT 1;"
```

**Nginx issues:**
```bash
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx
```

---

**🎉 Your BAYG e-commerce platform is ready for production!**