import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');

  console.error(`[Server Error] [${req.method}] ${req.path} - ${err.message}`, {
    code: errorCode,
    statusCode,
  });

  // Handle express JSON body parse error
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON payload received',
      },
    });
    return;
  }

  // Handle Payload Too Large
  if (err.message && err.message.includes('too large')) {
    res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Payload size exceeds the allowable limit',
      },
    });
    return;
  }

  // Database Connection Failures
  if (err.name === 'MongooseServerSelectionError' || err.name === 'MongoTimeoutError') {
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is temporarily unreachable. Please retry shortly.',
      },
    });
    return;
  }

  // Fallback for general errors
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected error occurred processing your request',
    },
  });
}
