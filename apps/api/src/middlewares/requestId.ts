import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { runWithRequestId } from '@pkg/logger';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id']?.toString() || randomUUID();
  runWithRequestId(() => {
    next();
  }, requestId);
}
