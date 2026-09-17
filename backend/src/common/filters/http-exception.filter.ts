import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

type HttpExceptionPayload = {
  code?: string;
  message?: string | string[];
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const requestId = getRequestId(request);
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : 500;
    const payload = isHttpException
      ? normalizeHttpExceptionPayload(exception.getResponse())
      : undefined;
    const message =
      payload?.message ?? 'İşlem şu an yapılamadı. Lütfen tekrar dene.';

    if (status >= 500) {
      const error =
        exception instanceof Error
          ? (exception.stack ?? exception.message)
          : exception;
      this.logger.error(
        `[${requestId}] ${request.method} ${request.originalUrl} -> ${status}`,
        error,
      );
    }

    response
      .status(status)
      .setHeader('x-request-id', requestId)
      .json({
        statusCode: status,
        message,
        ...(payload?.code ? { code: payload.code } : {}),
        requestId,
      });
  }
}

function getRequestId(request: Request) {
  const incomingRequestId = request.header('x-request-id');
  return incomingRequestId?.trim() || randomUUID();
}

function normalizeHttpExceptionPayload(
  response: string | object,
): HttpExceptionPayload {
  if (typeof response === 'string') return { message: response };

  const payload = response as HttpExceptionPayload;
  return { code: payload.code, message: payload.message };
}
