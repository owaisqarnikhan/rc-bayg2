-- Database Setup Script for BAYG E-commerce Platform
-- AWS EC2 Ubuntu Server: 3.136.95.83

-- Create database and user (PostgreSQL syntax)
CREATE DATABASE bayg_production;
CREATE USER bayg_user WITH ENCRYPTED PASSWORD 'BaygSecure2024!';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bayg_production TO bayg_user;
ALTER DATABASE bayg_production OWNER TO bayg_user;

-- Connect to the database
\c bayg_production;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO bayg_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bayg_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bayg_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bayg_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO bayg_user;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Show connection info
\conninfo

-- List databases
\l

-- Show user privileges
\du

-- Success message
SELECT 'Database setup completed successfully!' as status;