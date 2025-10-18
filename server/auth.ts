import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
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

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Require SESSION_SECRET - fail fast if missing
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required for session management");
  }

  // Use database-backed session store
  // Note: Session table is created via SQL migration, not auto-created
  const PostgresSessionStore = connectPgSimple(session);

  const sessionStore = new PostgresSessionStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false, // Table created via migration
    ttl: 7 * 24 * 60 * 60, // 1 week in seconds
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Use email field instead of username
  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          console.log('[LocalStrategy] Attempting login for email:', email);
          const user = await storage.getUserByEmail(email);
          console.log('[LocalStrategy] User found:', user ? 'yes' : 'no');
          if (!user || !user.password) {
            console.log('[LocalStrategy] No user or no password');
            return done(null, false, { message: 'Invalid email or password' });
          }
          console.log('[LocalStrategy] Verifying password...');
          const passwordMatch = await comparePasswords(password, user.password);
          console.log('[LocalStrategy] Password match:', passwordMatch);
          if (!passwordMatch) {
            console.log('[LocalStrategy] Password does not match');
            return done(null, false, { message: 'Invalid email or password' });
          }
          console.log('[LocalStrategy] Authentication successful');
          return done(null, user);
        } catch (error) {
          console.log('[LocalStrategy] Error during authentication:', error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (error) {
      done(error);
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, fullName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        fullName: fullName || email.split('@')[0],
        role: "director",
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser, info: any) => {
      if (err) {
        console.error('[LOGIN] Passport authentication error:', err);
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        console.log('[LOGIN] Authentication failed:', info?.message || "No user returned");
        return res.status(401).json({ message: info?.message || "Invalid email or password" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('[LOGIN] Session creation error:', loginErr);
          return res.status(500).json({ message: "Login failed" });
        }
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.sendStatus(401);
    }
    // Remove password from response
    const { password: _, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Refresh session with latest user data from database
  app.post("/api/refresh-session", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Fetch latest user data from database
      const freshUser = await storage.getUser(req.user.id);
      if (!freshUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Re-login to update session with fresh user data
      req.login(freshUser, (err) => {
        if (err) {
          console.error('Session refresh error:', err);
          return res.status(500).json({ message: "Failed to refresh session" });
        }
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = freshUser;
        res.json(userWithoutPassword);
      });
    } catch (error: any) {
      console.error('Refresh session error:', error);
      res.status(500).json({ message: error.message || "Failed to refresh session" });
    }
  });
}

// Middleware to protect routes
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to protect admin-only routes
export function isAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    console.log('[isAdmin] User not authenticated');
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userRole = req.user?.role;
  console.log(`[isAdmin] User ${req.user?.email} role: ${userRole}`);
  
  if (userRole !== 'admin') {
    console.log(`[isAdmin] Access denied for role: ${userRole}`);
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  return next();
}

// Middleware to protect auditor routes
export function isAuditor(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    console.log('[isAuditor] User not authenticated');
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userRole = req.user?.role;
  console.log(`[isAuditor] User ${req.user?.email} role: ${userRole}`);
  
  if (userRole !== 'auditor' && userRole !== 'admin') {
    console.log(`[isAuditor] Access denied for role: ${userRole}`);
    return res.status(403).json({ message: "Forbidden: Auditor access required" });
  }
  
  return next();
}
