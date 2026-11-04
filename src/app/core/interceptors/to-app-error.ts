import { HttpErrorResponse } from '@angular/common/http';
import { AppError } from '../models/app-error';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToAppErrorMapper {
  map(httpError: HttpErrorResponse): AppError {
    if (httpError.status === 0) {
      return {
        status: 0,
        error: 'NETWORK_ERROR',
        message: 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз',
        fieldErrors: [],
      };
    }

    const body = httpError.error;

    if (
      !body ||
      typeof body !== 'object' ||
      typeof body.status !== 'number' ||
      typeof body.error !== 'string' ||
      typeof body.message !== 'string'
    ) {
      return {
        status: httpError.status,
        error: 'UNKNOWN',
        message: this.getDefaultMessage(httpError.status),
        fieldErrors: [],
      };
    }

    const validationErrors = Array.isArray(body.validationErrors) ? body.validationErrors : [];

    const appError: AppError = {
      status: httpError.status,
      error: body.error,
      message: body.message,
      path: typeof body.path === 'string' ? body.path : undefined,
      fieldErrors: validationErrors.filter(
        (item: unknown) =>
          typeof item === 'object' &&
          item !== null &&
          'field' in item &&
          'message' in item &&
          typeof item.field === 'string' &&
          typeof item.message === 'string'
      ),
    };

    if (httpError.status === 429) {
      const retryAfter = httpError.headers.get('Retry-After');

      if (retryAfter !== null && /^\d+$/.test(retryAfter.trim())) {
        appError.retryAfterSeconds = Number(retryAfter);
      }
    }

    return appError;
  }

  private getDefaultMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Некорректный запрос';

      case 401:
        return 'Требуется авторизация';

      case 403:
        return 'У вас нет прав для выполнения этого действия';

      case 404:
        return 'Запрашиваемый ресурс не найден';

      case 422:
        return 'Не удалось выполнить операцию';

      case 429:
        return 'Слишком много запросов. Попробуйте позже';

      case 500:
        return 'Внутренняя ошибка сервера';

      case 502:
      case 503:
      case 504:
        return 'Сервер временно недоступен';

      default:
        return 'Произошла неизвестная ошибка';
    }
  }
}
