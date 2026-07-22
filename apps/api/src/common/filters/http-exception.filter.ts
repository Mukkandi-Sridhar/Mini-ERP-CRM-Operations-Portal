import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        error = resObj.error || exception.name || 'Error';
        message = resObj.message || exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
      console.error('🚀 Unhandled Error in API filter:', exception);
    } else {
      console.error('🚀 Unknown Exception in API filter:', exception);
    }

    // Standard global error envelope matching Section 5 of technical spec
    response.status(status).json({
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      stack: status === 500 && exception instanceof Error ? exception.stack : undefined,
    });
  }
}
