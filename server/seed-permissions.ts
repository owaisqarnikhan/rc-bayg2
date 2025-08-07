import { db } from "./db";
import { 
  roles, 
  permissionModules, 
  permissions, 
  rolePermissions, 
  users 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { PERMISSION_MODULES, PERMISSIONS, ROLE_PERMISSIONS } from "./permissions-config";

// Define all permission modules
const PERMISSION_MODULES = [
  {
    name: "users",
    displayName: "User Management",
    description: "Manage user accounts and profiles",
    icon: "Users",
    sortOrder: 1
  },
  {
    name: "products",
    displayName: "Product Management",
    description: "Manage products, categories, and inventory",
    icon: "Package",
    sortOrder: 2
  },
  {
    name: "orders",
    displayName: "Order Management",
    description: "Manage customer orders and order processing",
    icon: "ShoppingCart",
    sortOrder: 3
  },
  {
    name: "categories",
    displayName: "Category Management",
    description: "Manage product categories",
    icon: "Tag",
    sortOrder: 4
  },
  {
    name: "units",
    displayName: "Units of Measure",
    description: "Manage measurement units",
    icon: "Ruler",
    sortOrder: 5
  },
  {
    name: "slider",
    displayName: "Slider Management",
    description: "Manage homepage slider images",
    icon: "Image",
    sortOrder: 6
  },
  {
    name: "settings",
    displayName: "Site Settings",
    description: "Configure site-wide settings",
    icon: "Settings",
    sortOrder: 7
  },
  {
    name: "roles",
    displayName: "Role & Permission Management",
    description: "Manage roles and permissions (Super Admin only)",
    icon: "Shield",
    sortOrder: 8
  },
  {
    name: "reports",
    displayName: "Reports & Analytics",
    description: "View reports and analytics",
    icon: "BarChart3",
    sortOrder: 9
  },
  {
    name: "email",
    displayName: "Email Management",
    description: "Manage email templates and SMTP settings",
    icon: "Mail",
    sortOrder: 10
  }
];

// Define permissions for each module
const PERMISSIONS = [
  // User Management
  { module: "users", name: "users.view", displayName: "View Users", action: "read" },
  { module: "users", name: "users.create", displayName: "Create Users", action: "create" },
  { module: "users", name: "users.edit", displayName: "Edit Users", action: "update" },
  { module: "users", name: "users.delete", displayName: "Delete Users", action: "delete" },
  { module: "users", name: "users.manage", displayName: "Full User Management", action: "manage" },

  // Product Management
  { module: "products", name: "products.view", displayName: "View Products", action: "read" },
  { module: "products", name: "products.create", displayName: "Create Products", action: "create" },
  { module: "products", name: "products.edit", displayName: "Edit Products", action: "update" },
  { module: "products", name: "products.delete", displayName: "Delete Products", action: "delete" },
  { module: "products", name: "products.manage", displayName: "Full Product Management", action: "manage" },

  // Order Management
  { module: "orders", name: "orders.view", displayName: "View Orders", action: "read" },
  { module: "orders", name: "orders.approve", displayName: "Approve Orders", action: "update" },
  { module: "orders", name: "orders.reject", displayName: "Reject Orders", action: "update" },
  { module: "orders", name: "orders.process", displayName: "Process Orders", action: "update" },
  { module: "orders", name: "orders.manage", displayName: "Full Order Management", action: "manage" },

  // Category Management
  { module: "categories", name: "categories.view", displayName: "View Categories", action: "read" },
  { module: "categories", name: "categories.create", displayName: "Create Categories", action: "create" },
  { module: "categories", name: "categories.edit", displayName: "Edit Categories", action: "update" },
  { module: "categories", name: "categories.delete", displayName: "Delete Categories", action: "delete" },
  { module: "categories", name: "categories.manage", displayName: "Full Category Management", action: "manage" },

  // Units of Measure
  { module: "units", name: "units.view", displayName: "View Units", action: "read" },
  { module: "units", name: "units.create", displayName: "Create Units", action: "create" },
  { module: "units", name: "units.edit", displayName: "Edit Units", action: "update" },
  { module: "units", name: "units.delete", displayName: "Delete Units", action: "delete" },
  { module: "units", name: "units.manage", displayName: "Full Units Management", action: "manage" },

  // Slider Management
  { module: "slider", name: "slider.view", displayName: "View Slider", action: "read" },
  { module: "slider", name: "slider.create", displayName: "Create Slider Images", action: "create" },
  { module: "slider", name: "slider.edit", displayName: "Edit Slider Images", action: "update" },
  { module: "slider", name: "slider.delete", displayName: "Delete Slider Images", action: "delete" },
  { module: "slider", name: "slider.manage", displayName: "Full Slider Management", action: "manage" },

  // Site Settings
  { module: "settings", name: "settings.view", displayName: "View Settings", action: "read" },
  { module: "settings", name: "settings.edit", displayName: "Edit Settings", action: "update" },
  { module: "settings", name: "settings.manage", displayName: "Full Settings Management", action: "manage" },

  // Role & Permission Management (Super Admin only)
  { module: "roles", name: "roles.view", displayName: "View Roles & Permissions", action: "read" },
  { module: "roles", name: "roles.create", displayName: "Create Roles", action: "create" },
  { module: "roles", name: "roles.edit", displayName: "Edit Roles", action: "update" },
  { module: "roles", name: "roles.delete", displayName: "Delete Roles", action: "delete" },
  { module: "roles", name: "roles.assign", displayName: "Assign Permissions", action: "update" },
  { module: "roles", name: "roles.manage", displayName: "Full Role Management", action: "manage" },

  // Reports & Analytics
  { module: "reports", name: "reports.view", displayName: "View Reports", action: "read" },
  { module: "reports", name: "reports.export", displayName: "Export Reports", action: "read" },
  { module: "reports", name: "reports.manage", displayName: "Full Reports Management", action: "manage" },

  // Email Management
  { module: "email", name: "email.view", displayName: "View Email Settings", action: "read" },
  { module: "email", name: "email.edit", displayName: "Edit Email Templates", action: "update" },
  { module: "email", name: "email.test", displayName: "Test Email Configuration", action: "update" },
  { module: "email", name: "email.manage", displayName: "Full Email Management", action: "manage" },
];

export async function seedPermissions() {
  console.log("🔧 Seeding permission system...");

  try {
    // 1. Create permission modules
    console.log("Creating permission modules...");
    for (const module of PERMISSION_MODULES) {
      const [existingModule] = await db
        .select()
        .from(permissionModules)
        .where(eq(permissionModules.name, module.name));

      if (!existingModule) {
        await db.insert(permissionModules).values(module);
        console.log(`✓ Created module: ${module.displayName}`);
      }
    }

    // 2. Create permissions
    console.log("Creating permissions...");
    const modules = await db.select().from(permissionModules);
    const moduleMap = new Map(modules.map(m => [m.name, m.id]));

    for (const permission of PERMISSIONS) {
      const moduleId = moduleMap.get(permission.module);
      if (!moduleId) continue;

      const [existingPermission] = await db
        .select()
        .from(permissions)
        .where(eq(permissions.name, permission.name));

      if (!existingPermission) {
        await db.insert(permissions).values({
          moduleId,
          name: permission.name,
          displayName: permission.displayName,
          action: permission.action,
          description: `${permission.displayName} - ${permission.action} access`
        });
        console.log(`✓ Created permission: ${permission.displayName}`);
      }
    }

    // 3. Create Super Admin role
    console.log("Creating Super Admin role...");
    const [superAdminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "super_admin"));

    let superAdminRoleId = superAdminRole?.id;

    if (!superAdminRole) {
      const [newSuperAdminRole] = await db.insert(roles).values({
        name: "super_admin",
        displayName: "Super Administrator",
        description: "Full system access with all permissions",
        isSystemRole: true,
        isActive: true
      }).returning();
      superAdminRoleId = newSuperAdminRole.id;
      console.log("✓ Created Super Admin role");
    }

    // 4. Create default Admin role
    console.log("Creating Admin role...");
    const [adminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "admin"));

    let adminRoleId = adminRole?.id;

    if (!adminRole) {
      const [newAdminRole] = await db.insert(roles).values({
        name: "admin",
        displayName: "Administrator",
        description: "Limited administrative access - permissions assigned by Super Admin",
        isSystemRole: false,
        isActive: true
      }).returning();
      adminRoleId = newAdminRole.id;
      console.log("✓ Created Admin role");
    }

    // 4.5. Create default User role
    console.log("Creating User role...");
    const [userRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "user"));

    let userRoleId = userRole?.id;

    if (!userRole) {
      const [newUserRole] = await db.insert(roles).values({
        name: "user",
        displayName: "User",
        description: "Standard user access with basic permissions",
        isSystemRole: false,
        isActive: true
      }).returning();
      userRoleId = newUserRole.id;
      console.log("✓ Created User role");
    }

    // 5.1. Assign basic permissions to User role (if needed)
    if (userRoleId) {
      console.log("Assigning basic permissions to User role...");
      
      // Define basic permissions for regular users
      const userPermissions = [
        "products.view",  // View products
        "categories.view", // View categories
        "orders.view",    // View their own orders
      ];
      
      const allPermissions = await db.select().from(permissions);
      let assignedCount = 0;
      
      for (const permissionName of userPermissions) {
        const permission = allPermissions.find(p => p.name === permissionName);
        if (!permission) continue;
        
        const [existing] = await db
          .select()
          .from(rolePermissions)
          .where(and(
            eq(rolePermissions.roleId, userRoleId),
            eq(rolePermissions.permissionId, permission.id)
          ));

        if (!existing) {
          await db.insert(rolePermissions).values({
            roleId: userRoleId,
            permissionId: permission.id
          });
          assignedCount++;
        }
      }
      
      if (assignedCount > 0) {
        console.log(`✓ Assigned ${assignedCount} basic permissions to User role`);
      }
    }

    // 5.2. Assign intermediate permissions to Admin role
    if (adminRoleId) {
      console.log("Assigning admin permissions to Admin role...");
      
      // Define basic admin permissions (minimal access - Super Admin will assign more as needed)
      const adminPermissions = [
        // Basic view permissions only
        "products.view",
        "categories.view", 
        "orders.view",
        "settings.view",
        "reports.view"
      ];
      
      const allPermissions = await db.select().from(permissions);
      let assignedCount = 0;
      
      for (const permissionName of adminPermissions) {
        const permission = allPermissions.find(p => p.name === permissionName);
        if (!permission) continue;
        
        const [existing] = await db
          .select()
          .from(rolePermissions)
          .where(and(
            eq(rolePermissions.roleId, adminRoleId),
            eq(rolePermissions.permissionId, permission.id)
          ));

        if (!existing) {
          await db.insert(rolePermissions).values({
            roleId: adminRoleId,
            permissionId: permission.id
          });
          assignedCount++;
        }
      }
      
      if (assignedCount > 0) {
        console.log(`✓ Assigned ${assignedCount} admin permissions to Admin role`);
      }
    }

    // 5. Assign ALL permissions to Super Admin role
    if (superAdminRoleId) {
      console.log("Assigning all permissions to Super Admin...");
      const allPermissions = await db.select().from(permissions);
      
      for (const permission of allPermissions) {
        const [existing] = await db
          .select()
          .from(rolePermissions)
          .where(and(
            eq(rolePermissions.roleId, superAdminRoleId),
            eq(rolePermissions.permissionId, permission.id)
          ));

        if (!existing) {
          await db.insert(rolePermissions).values({
            roleId: superAdminRoleId,
            permissionId: permission.id
          });
        }
      }
      console.log(`✓ Assigned ${allPermissions.length} permissions to Super Admin`);
    }

    // 6. Update existing admin user to Super Admin (only the 'admin' user)
    console.log("Setting up Super Admin user...");
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"));

    if (adminUser.length > 0) {
      await db
        .update(users)
        .set({ 
          isSuperAdmin: true, 
          roleId: superAdminRoleId,
          isAdmin: true // Keep this for backward compatibility
        })
        .where(eq(users.username, "admin"));
      
      console.log(`✓ Updated user admin to Super Admin`);
    }

    // 7. Update manager user to Admin role (not Super Admin)
    console.log("Setting up Admin user...");
    const managerUser = await db
      .select()
      .from(users)
      .where(eq(users.username, "manager"));

    if (managerUser.length > 0) {
      await db
        .update(users)
        .set({ 
          isSuperAdmin: false, 
          roleId: adminRoleId,
          isAdmin: false // Remove admin flag - use role-based permissions only
        })
        .where(eq(users.username, "manager"));
      
      console.log(`✓ Updated user manager to Admin`);
    }

    console.log("🎉 Permission system seeded successfully!");
    
    return {
      success: true,
      superAdminRoleId,
      adminRoleId,
      userRoleId,
      modulesCount: PERMISSION_MODULES.length,
      permissionsCount: PERMISSIONS.length
    };

  } catch (error) {
    console.error("❌ Error seeding permissions:", error);
    return { success: false, error };
  }
}

// Helper function to check if user has specific permission
export async function userHasPermission(userId: string, permissionName: string): Promise<boolean> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) return false;

    // Super admins have all permissions
    if (user.isSuperAdmin) return true;

    // Check if user has the specific permission through their role
    if (!user.roleId) return false;

    const userPermissions = await db
      .select({ permissionName: permissions.name })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId));

    return userPermissions.some(p => p.permissionName === permissionName);
  } catch (error) {
    console.error("Error checking user permission:", error);
    return false;
  }
}

// Helper function to get all user permissions
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) return [];

    // Super admins have all permissions
    if (user.isSuperAdmin) {
      const allPermissions = await db.select({ name: permissions.name }).from(permissions);
      return allPermissions.map(p => p.name);
    }

    // Get permissions through role
    if (!user.roleId) return [];

    const userPermissions = await db
      .select({ permissionName: permissions.name })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId));

    return userPermissions.map(p => p.permissionName);
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
}