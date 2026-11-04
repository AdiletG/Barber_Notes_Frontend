import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ToAppErrorMapper } from './to-app-error';
import { TokenStoreService } from '../auth/token-store.service';
import { NotificationService } from '../notifications/notification.service';
import { isApiRequest, isAuthRequest } from '../api/is-api-request';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiRequest(request.url)) {
    return next(request);
  }

  const errorMapper = inject(ToAppErrorMapper);
  const tokenStoreService = inject(TokenStoreService);
  const notificationService = inject(NotificationService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const appError = errorMapper.map(error);

      if (error.status === 401) {
        if (!isAuthRequest(request.url)) {
          tokenStoreService.clearToken();
          notificationService.error('Сессия истекла, войдите снова');
        }

        return throwError(() => appError);
      }

      if (error.status === 400 && appError.fieldErrors.length > 0) {
        return throwError(() => appError);
      }

      if (error.status === 429) {
        notificationService.error(
          appError.error !== undefined
            ? `Слишком много запросов. Повторите попытку через ${appError.retryAfterSeconds} сек.`
            : appError.message
        );

        return throwError(() => appError);
      }

      notificationService.error(appError.message);
      return throwError(() => appError);
    })
  );
};
