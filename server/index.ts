import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeAgents } from "./services/agents/agentOrchestrator";
import { initializeSchedules } from "./services/agents/scheduler";
import { logger } from "./utils/logger";
import { apiTrackingMiddleware, errorTrackingMiddleware } from "./middleware/analyticsMiddleware";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Production analytics tracking - track all API calls with performance metrics
app.use(apiTrackingMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Verify session table exists before starting
  try {
    const { db } = await import('./db');
    await db.execute(`SELECT 1 FROM session LIMIT 1`);
    logger.info('Session table verified');
  } catch (error) {
    logger.error('Session table not found - creating it now');
    const { db } = await import('./db');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
    logger.info('Session table created successfully');
  }

  const server = await registerRoutes(app);

  // Production error tracking - log all uncaught errors with stack traces
  app.use(errorTrackingMiddleware);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Initialize the agent system
    try {
      logger.info('Initializing agent system');
      
      // Initialize agents
      initializeAgents();
      
      // Initialize agent scheduling
      initializeSchedules();
      
      logger.info('Agent system initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize agent system:', error);
    }
  });
})();
