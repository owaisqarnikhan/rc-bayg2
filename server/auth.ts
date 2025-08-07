import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  if (!salt) {
    return false;
  }
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-fallback-secret-key-for-development-only-please-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Disable secure for now to test deployment
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax', // Use lax for deployment compatibility
    },
    name: 'bayg.session', // Custom session name
  };

  if (isProduction) {
    app.set("trust proxy", 1);
  }
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  // Registration disabled - using predefined accounts only
  app.post("/api/register", async (req, res) => {
    res.status(403).json({ message: "Registration is disabled. Please contact admin for account access." });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    console.log('Login successful:', {
      user: req.user ? { id: req.user.id, username: req.user.username } : null,
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated()
    });
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user route
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.sendStatus(401);
    }
  });

  // Get user permissions
  app.get("/api/user/permissions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { getUserPermissions } = await import("./seed-comprehensive-permissions");
      const permissions = await getUserPermissions(req.user!.id);
      res.json({ permissions });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Check specific permission
  app.post("/api/user/check-permission", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { permission } = req.body;
      if (!permission) {
        return res.status(400).json({ message: "Permission name required" });
      }

      const { userHasPermission } = await import("./seed-comprehensive-permissions");
      const hasPermission = await userHasPermission(req.user!.id, permission);
      res.json({ hasPermission });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
}
