import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ToAppErrorMapper } from './to-app-error';
import { environment } from '../../../environments/environment';
import { TokenStoreService } from '../auth/token-store.service';
import { NotificationService } from '../notifications/notification.service';

function isApiRequest(url: string): boolean {
  if (!environment.apiUrl) {
    return false;
  }

  try {
    const apiBase = new URL(environment.apiUrl);
    const requestUrl = new URL(url, apiBase);
    const basePath = apiBase.pathname.replace(/\/+$/, '');

    return (
      requestUrl.origin === apiBase.origin &&
      (basePath === '' ||
        requestUrl.pathname === basePath ||
        requestUrl.pathname.startsWith(`${basePath}/`))
    );
  } catch {
    return false;
  }
}

function isRefreshRequest(url: string): boolean {
  const apiBase = new URL(environment.apiUrl);
  const requestUrl = new URL(url, apiBase);
  const basePath = apiBase.pathname.replace(/\/+$/, '');

  return requestUrl.pathname == `${basePath}/api/v1/auth/refresh`;
}

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

      if (error.status == 401) {
        if (!isRefreshRequest(request.url)) {
          tokenStoreService.clearToken();
          notificationService.error('Сессия истекла');
        }

        return throwError(() => appError);
      }

      if (error.status == 400 && appError.fieldErrors.length > 0) {
        return throwError(() => appError);
      }

      if (error.status == 429 && appError.retryAfterSeconds !== undefined) {
        notificationService.error(
          `${appError.message}. Повторите попытку через ${appError.retryAfterSeconds} сек.`
        );
      } else {
        notificationService.error(appError.message);
      }

      return throwError(() => appError);
    })
  );
};
