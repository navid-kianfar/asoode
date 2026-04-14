import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
} from '@nestjs/common';
import { Observable, map, catchError, of } from 'rxjs';
import { OperationResult, OperationResultStatus } from '@asoode/shared';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, OperationResult<T>> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<OperationResult<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof OperationResult) {
          return data;
        }
        return OperationResult.Success(data);
      }),
      catchError((err) => {
        if (err instanceof HttpException) {
          const result = new OperationResult<T>();
          const status = err.getStatus();
          if (status === 401) {
            result.status = OperationResultStatus.UnAuthorized;
          } else if (status === 404) {
            result.status = OperationResultStatus.NotFound;
          } else {
            result.status = OperationResultStatus.Failed;
          }
          result.data = null as T;
          result.errors = {};
          return of(result);
        }
        return of(OperationResult.Failed<T>(err));
      }),
    );
  }
}
