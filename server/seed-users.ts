import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { users, roles } from "@shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedUsers() {
  try {
    console.log("Seeding predefined user accounts...");

    // Check if all required users exist
    const requiredUsernames = ["admin", "manager"];
    const existingUsers = await db.select({ username: users.username }).from(users);
    const existingUsernames = existingUsers.map(u => u.username);
    
    const missingUsers = requiredUsernames.filter(name => !existingUsernames.includes(name));
    
    if (missingUsers.length === 0) {
      console.log("All required users already exist, skipping seed...");
      return;
    }
    
    console.log(`Creating missing users: ${missingUsers.join(", ")}`);

    // Get role IDs for assignment
    const [superAdminRole] = await db.select().from(roles).where(eq(roles.name, "super_admin"));
    const [adminRole] = await db.select().from(roles).where(eq(roles.name, "admin"));
    const [userRole] = await db.select().from(roles).where(eq(roles.name, "user"));

    if (!superAdminRole || !adminRole || !userRole) {
      console.log("⚠️  Roles not found. Seeding permissions first...");
      // Roles should be created by seedPermissions function
      return;
    }

    const predefinedUsers = [
      {
        username: "admin",
        email: "admin@bayg.com",
        password: "admin123",
        isAdmin: true,
        isSuperAdmin: true,
        roleId: superAdminRole.id,
        role: "Super Admin"
      },
      {
        username: "manager",
        email: "manager@bayg.com",
        password: "manager123",
        isAdmin: true,
        isSuperAdmin: false,
        roleId: adminRole.id,
        role: "Admin"
      },
      {
        username: "customer1",
        email: "customer1@example.com", 
        password: "customer123",
        isAdmin: false,
        isSuperAdmin: false,
        roleId: userRole.id,
        role: "User"
      },
      {
        username: "customer2",
        email: "customer2@example.com",
        password: "customer123", 
        isAdmin: false,
        isSuperAdmin: false,
        roleId: userRole.id,
        role: "User"
      },
      {
        username: "customer3",
        email: "customer3@example.com",
        password: "customer123",
        isAdmin: false,
        isSuperAdmin: false,
        roleId: userRole.id,
        role: "User"
      },
      {
        username: "testuser",
        email: "test@example.com",
        password: "test123",
        isAdmin: false,
        isSuperAdmin: false,
        roleId: userRole.id,
        role: "User"
      },
      {
        username: "demo",
        email: "demo@innovanceorbit.com",
        password: "demo123",
        isAdmin: false,
        isSuperAdmin: false,
        roleId: userRole.id,
        role: "User"
      }
    ];

    for (const userData of predefinedUsers) {
      // Only create user if they don't exist
      if (!missingUsers.includes(userData.username)) {
        continue;
      }
      
      const hashedPassword = await hashPassword(userData.password);
      
      await db.insert(users).values({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        isAdmin: userData.isAdmin,
        isSuperAdmin: userData.isSuperAdmin,
        roleId: userData.roleId
      });
      
      console.log(`✓ Created ${userData.role} account: ${userData.username}`);
    }

    console.log("\n🎉 All predefined accounts created successfully!");
    console.log("\n📋 Available test accounts with roles:");
    console.log("┌─────────────┬─────────────┬──────────────┐");
    console.log("│   Username  │   Password  │     Role     │");
    console.log("├─────────────┼─────────────┼──────────────┤");
    console.log("│   admin     │   admin123  │ Super Admin  │");
    console.log("│  manager    │ manager123  │    Admin     │");
    console.log("│  customer1  │ customer123 │     User     │");
    console.log("│  customer2  │ customer123 │     User     │");
    console.log("│  customer3  │ customer123 │     User     │");
    console.log("│  testuser   │   test123   │     User     │");
    console.log("│    demo     │   demo123   │     User     │");
    console.log("└─────────────┴─────────────┴──────────────┘");

  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers().then(() => {
    console.log("Seeding completed!");
    process.exit(0);
  }).catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
}

export { seedUsers };