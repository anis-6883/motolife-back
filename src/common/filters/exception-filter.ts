import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { JsonWebTokenError } from '@nestjs/jwt';
import { MongoServerError } from 'mongodb';
import { Error } from 'mongoose';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    const data = {};

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const responseBody = exception.getResponse();

      if (
        httpStatus === HttpStatus.BAD_REQUEST &&
        typeof responseBody === 'object' &&
        'message' in responseBody &&
        Array.isArray(responseBody['message'])
      ) {
        message = 'Validation Failed';

        responseBody['message'].map((msg: string) => {
          const key = msg.split(' ')[0];

          return (data[key] = msg);
        });

        message = `${message}: ${Object.values(data)[0]}`;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof MongoServerError) {
      if (exception.code === 11000) {
        httpStatus = HttpStatus.CONFLICT;

        const field = Object.keys(exception.keyPattern)[0];
        message = `Duplicate entry detected for field: '${field}'`;
      } else {
        httpStatus = HttpStatus.BAD_REQUEST;
        message = 'Database operation failed';
      }
    } else if (exception instanceof Error.CastError) {
      httpStatus = HttpStatus.BAD_REQUEST;
      message = `Invalid value provided for field: '${exception.path}'`;
    } else if (exception instanceof JsonWebTokenError) {
      httpStatus = HttpStatus.UNAUTHORIZED;
      message = 'You are not authorized to access';
    } else if (exception instanceof SyntaxError) {
      httpStatus = HttpStatus.BAD_REQUEST;
      message = 'Invalid request';
    } else {
      this.logger.error(exception);
      if (exception instanceof Error) {
        message = exception.message;
      }
    }

    const responseBody = {
      status: false,
      message: `${message}!`,
      ...(data !== null &&
        data !== undefined &&
        Object.keys(data).length > 0 && { data }),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
