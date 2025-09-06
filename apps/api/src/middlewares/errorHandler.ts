import { Request, Response, NextFunction } from 'express';
import { logger } from '@pkg/logger';
import { errorResponse } from '../utils/response.js';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error(err, 'An unexpected error occurred');
  errorResponse(res, 'An unexpected error occurred');
}
