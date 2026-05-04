import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      const userAgent = request.get('user-agent') || '';
      const { ip, method, originalUrl } = request;

      const now = Date.now();
      return next.handle().pipe(
        tap(() => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const contentLength = response.get('content-length');

          this.logger.debug(
            `${method} ${originalUrl} status:${statusCode} contentLength:${contentLength || 0} userAgent:${userAgent} ip:${ip} time:${Date.now() - now}ms`,
          );
        }),
      );
    }

    return next.handle();
  }
}
