# Overview

This is a comprehensive e-commerce platform built for Bahrain/MENA markets called "BAYG" or "InnovanceOrbit". The application features a full-stack TypeScript architecture with a React frontend, Express.js backend, and PostgreSQL database. It supports product management, order processing with admin approval workflows, multiple payment methods (including local Bahrain options like Benefit Pay), user role-based permissions, and comprehensive admin features.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **UI Framework**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme system supporting multiple color schemes
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Context-based auth provider with protected routes

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy using session-based auth
- **Session Storage**: Memory store for development, PostgreSQL session store for production
- **Password Security**: Scrypt hashing with salt
- **File Uploads**: Multer for image handling with size and type validation
- **Permission System**: Role-based access control with granular permissions across modules

## Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL with Neon serverless support
- **Schema**: Comprehensive schema including users, roles, permissions, products, categories, orders, cart items, and site settings
- **Migrations**: Drizzle Kit for schema migrations
- **Relations**: Well-defined foreign key relationships with proper cascade behaviors

## Authentication & Authorization
- **Multi-tier Role System**: Super Admin, Admin, Manager, and User roles
- **Granular Permissions**: Module-based permissions (users, products, orders, categories, payments, etc.)
- **Permission Modules**: 12 core modules including auth, users, products, orders, categories, cart, payments, slider, settings, units, reports, and database operations
- **Session Management**: Express-session with configurable stores
- **Route Protection**: Middleware-based permission checking on API endpoints

## Payment Integration
- **Multi-provider Support**: Stripe, PayPal, and regional Benefit Pay for Bahrain market
- **Cash on Delivery**: Support for COD payments
- **Payment Workflow**: Integrated with order approval system
- **Security**: Environment-based API key management

## Email System
- **Single Provider**: Microsoft 365 SMTP only
- **Transactional Emails**: Order confirmations, admin notifications, approval workflows
- **Template System**: HTML email templates with dynamic content
- **Configuration**: Database-driven Microsoft 365 SMTP settings with validation and setup instructions
- **Authentication**: Supports regular passwords and App Passwords for MFA-enabled accounts

## Order Management
- **Approval Workflow**: Admin approval required before payment processing
- **Status Tracking**: Comprehensive order status system (pending, awaiting_approval, approved, payment_pending, processing, shipped, delivered, cancelled)
- **Notification System**: Email notifications for all order state changes
- **Payment Integration**: Seamless transition from approval to payment

## File Management
- **Image Uploads**: Multer-based file handling with validation
- **Static Serving**: Express static middleware for uploaded assets
- **Image Processing**: Client-side validation and server-side security checks

## Admin Features
- **Comprehensive Dashboard**: Full CRUD operations for all entities
- **Data Management**: Excel import/export functionality
- **Database Tools**: Backup, restore, and migration utilities
- **Site Customization**: Theme management, slider images, site settings
- **User Management**: Role assignment, permission management

## Theme System
- **Dynamic Theming**: Runtime theme switching with CSS custom properties
- **Predefined Themes**: Default, Ocean, Forest, Sunset, Purple, and Teal themes
- **Customization**: Admin-configurable colors and branding
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

# External Dependencies

## Core Runtime Dependencies
- **Database**: PostgreSQL via Neon serverless (@neondatabase/serverless)
- **ORM**: Drizzle ORM with PostgreSQL adapter
- **Payment Processors**: Stripe API, PayPal Server SDK, custom Benefit Pay integration
- **Email Service**: Nodemailer with Microsoft 365/Gmail SMTP support
- **File Processing**: Multer for uploads, XLSX for Excel operations

## UI and Frontend Libraries
- **Component Library**: Radix UI primitives with Shadcn/UI components
- **Styling**: Tailwind CSS with PostCSS processing
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date formatting and manipulation
- **Validation**: Zod for schema validation across frontend and backend

## Development and Build Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Development**: tsx for TypeScript execution, ESBuild for production builds
- **Replit Integration**: Cartographer plugin and runtime error overlay for Replit development environment
- **Type Safety**: Comprehensive TypeScript configuration with strict mode enabled

## Recent Changes (August 2025)
- **Production Authentication Fix**: Addressed 401 Unauthorized error in production deployment by implementing comprehensive session debugging and switching to PostgreSQL session store for production with proper cookie configuration (August 5, 2025)
- **Project Migration**: Successfully migrated from Replit Agent to standard Replit environment (August 5, 2025)
- **Database Setup**: Configured PostgreSQL database with comprehensive schema push
- **User Account Creation**: Created diverse test user accounts including superadmin, managers, and customers
- **Permission System**: Verified comprehensive role-based permission system is fully operational
- **Manager Role Access Fix**: Permanently fixed critical issue where manager users saw user panel instead of admin panel by updating role-based permission logic and adding users.view permission to manager role (August 5, 2025)
- **Manager Superadmin Equivalence**: Updated manager role to have full superadmin-equivalent access with all 83 permissions when assigned by superadmin (August 5, 2025)
- **Header Tab Border Removal**: Completely removed all tab border styling and configuration options per user request (August 5, 2025)
- **Payment Method Overhaul**: Completely removed all payment methods except Credimax and Cash on Delivery
- **Credimax Integration**: Created new Credimax payment gateway integration for Bahrain market
- **Payment System Cleanup**: Removed Stripe, PayPal, and Benefit Pay integrations across entire codebase
- **Permissions Update**: Updated role permissions to only support Credimax and Cash on Delivery payments
- **Schema Simplification**: Removed Stripe-related fields from user schema and order payment methods
- **Email System Restoration**: Completely rebuilt comprehensive SMTP email functionality per user request
- **Favicon Upload Functionality**: Added superadmin capability to upload and manage site favicon with real-time browser updates (August 5, 2025)
- **Dynamic SMTP Configuration**: Added flexible SMTP configuration supporting Gmail, Outlook, Yahoo, and custom providers
- **Email Service Architecture**: Created new email service with nodemailer integration and professional email templates
- **Admin Email Interface**: Built comprehensive admin interface for SMTP configuration, testing, and status monitoring
- **Email Workflow Integration**: Integrated email notifications throughout order workflow (confirmation, approval, rejection, delivery)
- **Database Schema Enhancement**: Added SMTP configuration fields to site_settings table
- **Email Template System**: Created professional HTML email templates for all notification types

## Authentication and Security
- **Session Management**: Express-session with connect-pg-simple for PostgreSQL session store
- **Password Hashing**: Node.js crypto module with scrypt algorithm
- **CSRF Protection**: Built into session management
- **Input Validation**: Zod schemas shared between frontend and backend

## Data Processing
- **Excel Operations**: XLSX library for import/export functionality
- **CSV Processing**: PapaParse for CSV file handling
- **Caching**: Memoizee for performance optimization
- **Query Optimization**: TanStack Query for efficient data fetching and caching