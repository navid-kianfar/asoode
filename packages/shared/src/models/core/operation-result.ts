import { OperationResultStatus } from '../../enums/core.enum';

export class OperationResult<T> {
  data!: T;
  status!: OperationResultStatus;
  errors!: { [id: string]: string[] };
  exception!: Error;

  static Success<T>(data?: T): OperationResult<T> {
    const result = new OperationResult<T>();
    result.status = OperationResultStatus.Success;
    result.data = data as T;
    return result;
  }

  static Failed<T>(err?: Error): OperationResult<T> {
    const result = new OperationResult<T>();
    result.status = OperationResultStatus.Failed;
    result.exception = err as Error;
    return result;
  }

  static NotFound<T>(err?: Error): OperationResult<T> {
    const result = new OperationResult<T>();
    result.status = OperationResultStatus.NotFound;
    result.exception = err as Error;
    return result;
  }

  static Duplicate<T>(err?: Error): OperationResult<T> {
    const result = new OperationResult<T>();
    result.status = OperationResultStatus.Duplicate;
    result.exception = err as Error;
    return result;
  }

  static Rejected<T>(err?: Error): OperationResult<T> {
    const result = new OperationResult<T>();
    result.status = OperationResultStatus.Rejected;
    result.exception = err as Error;
    return result;
  }

  static Validation<T>(err?: Error): OperationResult<T> {
    const result = new OperationResult<T>();
    result.status = OperationResultStatus.Validation;
    result.exception = err as Error;
    return result;
  }
}
