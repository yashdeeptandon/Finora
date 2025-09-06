import { Request, Response, NextFunction } from 'express';
import { logger } from '@pkg/logger';

export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  logger.info({ req }, 'Incoming request');

  const originalSend = res.send;
  res.send = function (body) {
    logger.info({ res, body }, 'Outgoing response');
    return originalSend.apply(res, [body]);
  };

  next();
}
