// Comprehensive permission system based on deep project analysis
// This file defines all modules and permissions for the BAYG e-commerce platform

export const PERMISSION_MODULES = [
  {
    name: "auth",
    displayName: "Authentication & Sessions",
    description: "Login, logout, and session management",
    icon: "Key",
    sortOrder: 1
  },
  {
    name: "users",
    displayName: "User Management",
    description: "Manage user accounts, roles, and profiles",
    icon: "Users",
    sortOrder: 2
  },
  {
    name: "products",
    displayName: "Product Management",
    description: "Manage products, pricing, and inventory",
    icon: "Package",
    sortOrder: 3
  },
  {
    name: "categories",
    displayName: "Category Management",
    description: "Manage product categories and organization",
    icon: "Tag",
    sortOrder: 4
  },
  {
    name: "orders",
    displayName: "Order Management",
    description: "Process orders, approvals, and fulfillment",
    icon: "ShoppingCart",
    sortOrder: 5
  },
  {
    name: "cart",
    displayName: "Shopping Cart",
    description: "Manage shopping cart operations",
    icon: "ShoppingBag",
    sortOrder: 6
  },
  {
    name: "payments",
    displayName: "Payment Processing",
    description: "Handle payments, Credimax, Cash on Delivery",
    icon: "CreditCard",
    sortOrder: 7
  },
  {
    name: "media",
    displayName: "Media & File Management",
    description: "Upload and manage images and files",
    icon: "Image",
    sortOrder: 8
  },
  {
    name: "slider",
    displayName: "Homepage Slider",
    description: "Manage homepage slider images and content",
    icon: "Monitor",
    sortOrder: 9
  },
  {
    name: "units",
    displayName: "Units of Measure",
    description: "Manage product measurement units",
    icon: "Ruler",
    sortOrder: 10
  },
  {
    name: "settings",
    displayName: "Site Settings",
    description: "Configure site-wide settings and preferences",
    icon: "Settings",
    sortOrder: 11
  },
  {
    name: "email",
    displayName: "Email System",
    description: "Configure SMTP, send notifications and emails",
    icon: "Mail",
    sortOrder: 12
  },
  {
    name: "reports",
    displayName: "Reports & Analytics",
    description: "View business reports and analytics",
    icon: "BarChart3",
    sortOrder: 13
  },
  {
    name: "database",
    displayName: "Database Management",
    description: "Import/export data and manage database",
    icon: "Database",
    sortOrder: 14
  },
  {
    name: "roles",
    displayName: "Role & Permission Management",
    description: "Manage roles, permissions, and access control",
    icon: "Shield",
    sortOrder: 15
  }
];

// Comprehensive permissions based on all API endpoints discovered in the project
export const PERMISSIONS = [
  // Authentication & Sessions
  { module: "auth", name: "auth.login", displayName: "Login Access", action: "access" },
  { module: "auth", name: "auth.logout", displayName: "Logout", action: "access" },
  { module: "auth", name: "auth.session", displayName: "Session Management", action: "manage" },
  
  // User Management
  { module: "users", name: "users.view", displayName: "View Users", action: "read" },
  { module: "users", name: "users.create", displayName: "Create Users", action: "create" },
  { module: "users", name: "users.edit", displayName: "Edit Users", action: "update" },
  { module: "users", name: "users.delete", displayName: "Delete Users", action: "delete" },
  { module: "users", name: "users.manage", displayName: "Full User Management", action: "manage" },
  { module: "users", name: "users.profile", displayName: "Edit Own Profile", action: "update" },
  
  // Product Management
  { module: "products", name: "products.view", displayName: "View Products", action: "read" },
  { module: "products", name: "products.create", displayName: "Create Products", action: "create" },
  { module: "products", name: "products.edit", displayName: "Edit Products", action: "update" },
  { module: "products", name: "products.delete", displayName: "Delete Products", action: "delete" },
  { module: "products", name: "products.manage", displayName: "Full Product Management", action: "manage" },
  { module: "products", name: "products.featured", displayName: "Manage Featured Products", action: "manage" },
  { module: "products", name: "products.pricing", displayName: "Manage Product Pricing", action: "update" },
  
  // Category Management
  { module: "categories", name: "categories.view", displayName: "View Categories", action: "read" },
  { module: "categories", name: "categories.create", displayName: "Create Categories", action: "create" },
  { module: "categories", name: "categories.edit", displayName: "Edit Categories", action: "update" },
  { module: "categories", name: "categories.delete", displayName: "Delete Categories", action: "delete" },
  { module: "categories", name: "categories.manage", displayName: "Full Category Management", action: "manage" },
  
  // Order Management
  { module: "orders", name: "orders.view", displayName: "View Orders", action: "read" },
  { module: "orders", name: "orders.create", displayName: "Create Orders", action: "create" },
  { module: "orders", name: "orders.edit", displayName: "Edit Orders", action: "update" },
  { module: "orders", name: "orders.delete", displayName: "Delete Orders", action: "delete" },
  { module: "orders", name: "orders.manage", displayName: "Full Order Management", action: "manage" },
  { module: "orders", name: "orders.approve", displayName: "Approve Orders", action: "approve" },
  { module: "orders", name: "orders.reject", displayName: "Reject Orders", action: "reject" },
  { module: "orders", name: "orders.process", displayName: "Process Orders", action: "process" },
  { module: "orders", name: "orders.complete", displayName: "Complete Orders", action: "complete" },
  { module: "orders", name: "orders.own", displayName: "View Own Orders", action: "read" },
  
  // Shopping Cart
  { module: "cart", name: "cart.view", displayName: "View Cart", action: "read" },
  { module: "cart", name: "cart.add", displayName: "Add to Cart", action: "create" },
  { module: "cart", name: "cart.update", displayName: "Update Cart", action: "update" },
  { module: "cart", name: "cart.remove", displayName: "Remove from Cart", action: "delete" },
  { module: "cart", name: "cart.clear", displayName: "Clear Cart", action: "delete" },
  
  // Payment Processing
  { module: "payments", name: "payments.credimax", displayName: "Process Credimax Payments", action: "process" },
  { module: "payments", name: "payments.cod", displayName: "Cash on Delivery", action: "process" },
  { module: "payments", name: "payments.view", displayName: "View Payment History", action: "read" },
  { module: "payments", name: "payments.refund", displayName: "Process Refunds", action: "refund" },
  
  // Media & File Management
  { module: "media", name: "media.upload", displayName: "Upload Images", action: "create" },
  { module: "media", name: "media.view", displayName: "View Media Files", action: "read" },
  { module: "media", name: "media.delete", displayName: "Delete Media Files", action: "delete" },
  { module: "media", name: "media.manage", displayName: "Full Media Management", action: "manage" },
  
  // Homepage Slider
  { module: "slider", name: "slider.view", displayName: "View Slider Images", action: "read" },
  { module: "slider", name: "slider.create", displayName: "Add Slider Images", action: "create" },
  { module: "slider", name: "slider.edit", displayName: "Edit Slider Images", action: "update" },
  { module: "slider", name: "slider.delete", displayName: "Delete Slider Images", action: "delete" },
  { module: "slider", name: "slider.manage", displayName: "Full Slider Management", action: "manage" },
  { module: "slider", name: "slider.order", displayName: "Reorder Slider Images", action: "update" },
  
  // Units of Measure
  { module: "units", name: "units.view", displayName: "View Units", action: "read" },
  { module: "units", name: "units.create", displayName: "Create Units", action: "create" },
  { module: "units", name: "units.edit", displayName: "Edit Units", action: "update" },
  { module: "units", name: "units.delete", displayName: "Delete Units", action: "delete" },
  { module: "units", name: "units.manage", displayName: "Full Units Management", action: "manage" },
  
  // Site Settings
  { module: "settings", name: "settings.view", displayName: "View Settings", action: "read" },
  { module: "settings", name: "settings.edit", displayName: "Edit Settings", action: "update" },
  { module: "settings", name: "settings.manage", displayName: "Full Settings Management", action: "manage" },
  { module: "settings", name: "settings.smtp", displayName: "Configure SMTP", action: "configure" },
  { module: "settings", name: "settings.footer", displayName: "Manage Footer", action: "update" },
  
  // Email System
  { module: "email", name: "email.view", displayName: "View Email Settings", action: "read" },
  { module: "email", name: "email.edit", displayName: "Edit Email Settings", action: "update" },
  { module: "email", name: "email.test", displayName: "Test Email Connection", action: "test" },
  { module: "email", name: "email.send", displayName: "Send Emails", action: "send" },
  { module: "email", name: "email.manage", displayName: "Full Email Management", action: "manage" },
  { module: "email", name: "email.notifications", displayName: "Manage Email Notifications", action: "manage" },
  
  // Reports & Analytics
  { module: "reports", name: "reports.view", displayName: "View Reports", action: "read" },
  { module: "reports", name: "reports.export", displayName: "Export Reports", action: "export" },
  { module: "reports", name: "reports.analytics", displayName: "View Analytics", action: "read" },
  { module: "reports", name: "reports.manage", displayName: "Full Reports Management", action: "manage" },
  { module: "reports", name: "reports.stats", displayName: "View Statistics", action: "read" },
  
  // Database Management
  { module: "database", name: "database.export", displayName: "Export Database", action: "export" },
  { module: "database", name: "database.import", displayName: "Import Database", action: "import" },
  { module: "database", name: "database.backup", displayName: "Backup Database", action: "backup" },
  { module: "database", name: "database.restore", displayName: "Restore Database", action: "restore" },
  { module: "database", name: "database.excel", displayName: "Excel Import/Export", action: "manage" },
  
  // Role & Permission Management (Super Admin Only)
  { module: "roles", name: "roles.view", displayName: "View Roles", action: "read" },
  { module: "roles", name: "roles.create", displayName: "Create Roles", action: "create" },
  { module: "roles", name: "roles.edit", displayName: "Edit Roles", action: "update" },
  { module: "roles", name: "roles.delete", displayName: "Delete Roles", action: "delete" },
  { module: "roles", name: "roles.manage", displayName: "Full Role Management", action: "manage" },
  { module: "roles", name: "roles.assign", displayName: "Assign Roles to Users", action: "assign" },
  { module: "roles", name: "roles.permissions", displayName: "Manage Role Permissions", action: "manage" }
];

// Define role permission sets based on project requirements
export const ROLE_PERMISSIONS = {
  // Super Admin: Full access to everything
  super_admin: "all", // Special keyword for all permissions
  
  // Manager: Full superadmin-equivalent access when permissions are assigned
  manager: "all", // Same as super_admin - full access to all permissions
  
  // User: Complete customer permissions - access to all customer features
  user: [
    // Authentication & Profile
    "auth.login",
    "auth.logout",
    "auth.session",
    "users.profile",
    
    // Product & Category Access
    "products.view",
    "categories.view",
    
    // Shopping Cart - Full Access
    "cart.view",
    "cart.add",
    "cart.update", 
    "cart.remove",
    "cart.clear",
    
    // Order Management - Customer Orders
    "orders.own",
    "orders.create",
    "orders.view", // Can view all orders (for order history)
    
    // Payment Processing - Credimax and Cash on Delivery only
    "payments.credimax",
    "payments.cod",
    "payments.view",
    
    // Media Access (for viewing product images)
    "media.view",
    
    // Settings Access (for site information)
    "settings.view"
  ]
};