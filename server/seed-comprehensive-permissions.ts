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

// Main seeding function for comprehensive permission system
export async function seedComprehensivePermissions() {
  try {
    console.log("🔧 Seeding comprehensive permission system...");

    // 1. Clear existing permissions
    console.log("Clearing existing permissions...");
    await db.delete(rolePermissions);
    await db.delete(permissions);
    await db.delete(permissionModules);

    // 2. Create permission modules
    console.log("Creating permission modules...");
    const moduleMap = new Map();
    
    for (const module of PERMISSION_MODULES) {
      const [createdModule] = await db
        .insert(permissionModules)
        .values({
          name: module.name,
          displayName: module.displayName,
          description: module.description,
          icon: module.icon,
          sortOrder: module.sortOrder
        })
        .returning();
      
      moduleMap.set(module.name, createdModule.id);
      console.log(`✓ Created module: ${module.displayName}`);
    }

    // 3. Create permissions
    console.log("Creating permissions...");
    const permissionMap = new Map();
    
    for (const permission of PERMISSIONS) {
      const moduleId = moduleMap.get(permission.module);
      if (!moduleId) {
        console.warn(`Warning: Module ${permission.module} not found for permission ${permission.name}`);
        continue;
      }

      const [createdPermission] = await db
        .insert(permissions)
        .values({
          moduleId: moduleId,
          name: permission.name,
          displayName: permission.displayName,
          description: permission.displayName, // Use displayName as description for now
          action: permission.action
        })
        .returning();
      
      permissionMap.set(permission.name, createdPermission.id);
      console.log(`✓ Created permission: ${permission.displayName}`);
    }

    // 4. Get or create roles
    console.log("Setting up roles...");
    
    // Super Admin role
    let superAdminRole = await db.select().from(roles).where(eq(roles.name, "super_admin"));
    let superAdminRoleId: string;
    
    if (superAdminRole.length === 0) {
      [superAdminRole[0]] = await db
        .insert(roles)
        .values({
          name: "super_admin",
          displayName: "Super Administrator",
          description: "Full system access with all permissions",
          isSystemRole: true
        })
        .returning();
    }
    superAdminRoleId = superAdminRole[0].id;

    // Manager role
    let managerRole = await db.select().from(roles).where(eq(roles.name, "manager"));
    let managerRoleId: string;
    
    if (managerRole.length === 0) {
      [managerRole[0]] = await db
        .insert(roles)
        .values({
          name: "manager",
          displayName: "Manager",
          description: "Limited access - permissions controlled by Super Admin"
        })
        .returning();
    }
    managerRoleId = managerRole[0].id;

    // User role
    let userRole = await db.select().from(roles).where(eq(roles.name, "user"));
    let userRoleId: string;
    
    if (userRole.length === 0) {
      [userRole[0]] = await db
        .insert(roles)
        .values({
          name: "user",
          displayName: "Customer",
          description: "Basic customer access for shopping and orders"
        })
        .returning();
    }
    userRoleId = userRole[0].id;

    // 5. Assign permissions to roles
    console.log("Assigning permissions to roles...");

    // Super Admin gets all permissions
    const allPermissionIds = Array.from(permissionMap.values());
    for (const permissionId of allPermissionIds) {
      await db
        .insert(rolePermissions)
        .values({
          roleId: superAdminRoleId,
          permissionId: permissionId
        })
        .onConflictDoNothing();
    }
    console.log(`✓ Assigned ${allPermissionIds.length} permissions to Super Admin`);

    // Manager gets all permissions (same as Super Admin)
    const managerPermissions = ROLE_PERMISSIONS.manager;
    let assignedManagerCount = 0;
    
    if (managerPermissions === "all") {
      // Assign all permissions to Manager role
      for (const permissionId of allPermissionIds) {
        await db
          .insert(rolePermissions)
          .values({
            roleId: managerRoleId,
            permissionId: permissionId
          })
          .onConflictDoNothing();
        assignedManagerCount++;
      }
    } else {
      // Assign specific permissions
      for (const permissionName of managerPermissions as string[]) {
        const permissionId = permissionMap.get(permissionName);
        if (permissionId) {
          await db
            .insert(rolePermissions)
            .values({
              roleId: managerRoleId,
              permissionId: permissionId
            })
            .onConflictDoNothing();
          assignedManagerCount++;
        }
      }
    }
    console.log(`✓ Assigned ${assignedManagerCount} permissions to Manager role`);

    // User gets basic permissions
    const userPermissions = ROLE_PERMISSIONS.user;
    let assignedUserCount = 0;
    for (const permissionName of userPermissions) {
      const permissionId = permissionMap.get(permissionName);
      if (permissionId) {
        await db
          .insert(rolePermissions)
          .values({
            roleId: userRoleId,
            permissionId: permissionId
          })
          .onConflictDoNothing();
        assignedUserCount++;
      }
    }
    console.log(`✓ Assigned ${assignedUserCount} permissions to User role`);

    // 6. Update user accounts
    console.log("Updating user accounts...");
    
    // Update admin user to Super Admin
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"));

    if (adminUsers.length > 0) {
      await db
        .update(users)
        .set({ 
          isSuperAdmin: true,
          isAdmin: true,
          roleId: superAdminRoleId
        })
        .where(eq(users.username, "admin"));
      
      console.log(`✓ Updated admin user to Super Admin`);
    }

    // Update manager user to Manager role (with limited permissions)
    const managerUsers = await db
      .select()
      .from(users)
      .where(eq(users.username, "manager"));

    if (managerUsers.length > 0) {
      await db
        .update(users)
        .set({ 
          isSuperAdmin: false, 
          isAdmin: false, // Remove admin flag - use role-based permissions only
          roleId: managerRoleId
        })
        .where(eq(users.username, "manager"));
      
      console.log(`✓ Updated manager user to Manager role (limited permissions)`);
    }

    // Update regular user to User role
    const regularUsers = await db
      .select()
      .from(users)
      .where(eq(users.username, "user"));

    if (regularUsers.length > 0) {
      await db
        .update(users)
        .set({ 
          isSuperAdmin: false,
          isAdmin: false,
          roleId: userRoleId
        })
        .where(eq(users.username, "user"));
      
      console.log(`✓ Updated user to Customer role`);
    }

    console.log("🎉 Comprehensive permission system seeded successfully!");
    
    return {
      success: true,
      superAdminRoleId,
      managerRoleId,
      userRoleId,
      modulesCount: PERMISSION_MODULES.length,
      permissionsCount: PERMISSIONS.length,
      totalPermissions: allPermissionIds.length,
      managerPermissions: assignedManagerCount,
      userPermissions: assignedUserCount
    };

  } catch (error) {
    console.error("❌ Error seeding comprehensive permissions:", error);
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