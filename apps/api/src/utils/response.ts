import { Response } from 'express';
import { getRequestId } from '@pkg/logger';

interface ResponseShape<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string | null;
    message: string | null;
    details: any | null;
  } | null;
  meta: {
    requestId: string | undefined;
    timestamp: string;
  };
}

export function successResponse<T>(res: Response, data: T, statusCode = 200) {
  const response: ResponseShape<T> = {
    success: true,
    data,
    error: null,
    meta: {
      requestId: getRequestId(),
      timestamp: new Date().toISOString(),
    },
  };
  res.status(statusCode).json(response);
}

export function errorResponse(
  res: Response,
  message: string,
  code = 'INTERNAL_SERVER_ERROR',
  details: any = null,
  statusCode = 500,
) {
  const response: ResponseShape<null> = {
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
    meta: {
      requestId: getRequestId(),
      timestamp: new Date().toISOString(),
    },
  };
  res.status(statusCode).json(response);
}
