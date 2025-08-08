import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function testPasswordComparison() {
    console.log("🔍 Password Comparison Debug:");
    
    // Get the stored password hash for admin user
    const { db } = await import("./server/db.js");
    const { users } = await import("./shared/schema.js");
    const { eq } = await import("drizzle-orm");
    
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, "admin"));
    
    if (!user) {
        console.log("❌ User 'admin' not found");
        return;
    }
    
    console.log(`✓ Found user: ${user.username} (${user.email})`);
    console.log(`✓ isAdmin: ${user.isAdmin}, isSuperAdmin: ${user.isSuperAdmin}`);
    console.log(`✓ Stored password hash: ${user.password.substring(0, 20)}...`);
    
    // Test password comparison
    const testPassword = "BaygSecure2024!";
    const [hashedPassword, salt] = user.password.split(".");
    
    if (!salt) {
        console.log("❌ Invalid password format - no salt found");
        return;
    }
    
    try {
        const hashedBuf = Buffer.from(hashedPassword, "hex");
        const suppliedBuf = await scryptAsync(testPassword, salt, 64);
        const isMatch = timingSafeEqual(hashedBuf, suppliedBuf);
        
        console.log(`✓ Password test for '${testPassword}': ${isMatch ? 'MATCH' : 'NO MATCH'}`);
        
        if (!isMatch) {
            console.log("🔧 Testing alternative passwords...");
            const alternatives = ["admin123", "password", "admin", "BaygSecure2024"];
            for (const altPassword of alternatives) {
                const altSuppliedBuf = await scryptAsync(altPassword, salt, 64);
                const altMatch = timingSafeEqual(hashedBuf, altSuppliedBuf);
                console.log(`   - '${altPassword}': ${altMatch ? 'MATCH' : 'NO MATCH'}`);
                if (altMatch) break;
            }
        }
    } catch (error) {
        console.error("❌ Password comparison error:", error.message);
    }
}

testPasswordComparison().catch(console.error);