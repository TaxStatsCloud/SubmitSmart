import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/auditService';

/**
 * Middleware to track API call performance
 * Automatically logs all API requests with response time and status code
 */
export function apiTrackingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Skip tracking for health checks and static assets
  if (req.url === '/api/health' || req.url.startsWith('/assets')) {
    return next();
  }

  // Capture the original end function
  const originalEnd = res.end;

  // Override res.end to log after response is sent
  res.end = function(this: Response, chunk?: any, encoding?: any, cb?: any) {
    const responseTime = Date.now() - startTime;
    const userId = (req as any).user?.id;

    // Log API call asynchronously (don't block response)
    setImmediate(() => {
      auditService.logApiCall({
        userId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime,
        req,
      }).catch(error => {
        console.error('Failed to log API call:', error);
      });
    });

    // Call the original end function with proper arguments
    return originalEnd.call(this, chunk, encoding, cb);
  } as any;

  next();
}

/**
 * Global error handling middleware
 * Logs all uncaught errors with stack traces
 */
export function errorTrackingMiddleware(error: any, req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.id;
  
  // Safely coerce error to Error object - guaranteed never to throw
  let errorObj: Error;
  if (error instanceof Error) {
    errorObj = error;
  } else if (typeof error === 'string') {
    errorObj = new Error(error);
  } else {
    // Safe conversion for any type (objects, BigInt, circular refs, etc.)
    try {
      errorObj = new Error(String(error));
    } catch {
      errorObj = new Error('Unknown error (could not convert to string)');
    }
  }
  
  const errorMessage = errorObj.message || 'Unknown error';
  const errorName = errorObj.name || 'UnknownError';
  
  // Determine error severity based on message content
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  
  const messageLower = errorMessage.toLowerCase();
  if (messageLower.includes('database') || messageLower.includes('connection')) {
    severity = 'critical';
  } else if (messageLower.includes('authentication') || messageLower.includes('authorization')) {
    severity = 'high';
  } else if (errorName === 'ValidationError' || messageLower.includes('validation')) {
    severity = 'low';
  }

  // Log the error asynchronously (non-blocking, guaranteed not to throw)
  auditService.logError({
    userId,
    error: errorObj,
    context: `${req.method} ${req.url}`,
    severity,
    req,
  }).catch(loggingError => {
    // Defensive: ensure audit logging failure never breaks the response
    console.error('Failed to log error:', loggingError);
  });

  // Don't expose internal errors to clients
  const statusCode = (error as any).statusCode || (error as any).status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : errorMessage;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: errorObj.stack }),
  });
}

/**
 * Middleware to track user actions from query/body parameters
 * Use this for specific endpoints where you want to track user behavior
 */
export function userActionTrackingMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.id;
  
  if (!userId) {
    return next();
  }

  // Check if request includes action tracking metadata
  const { _action, _category, _label, _value } = req.body || {};
  
  if (_action) {
    setImmediate(() => {
      auditService.logUserAction({
        userId,
        action: _action,
        category: _category,
        label: _label,
        value: _value,
        metadata: {
          url: req.url,
          method: req.method,
        },
        req,
      }).catch(error => {
        console.error('Failed to log user action:', error);
      });
    });
  }

  next();
}
