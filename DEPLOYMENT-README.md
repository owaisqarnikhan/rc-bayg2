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