import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ToAppErrorMapper } from './to-app-error';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const errorMapper = inject(ToAppErrorMapper);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const appErr = errorMapper.map(error);

        return throwError(() => appErr);
      }
      return throwError(() => error);
    })
  );
};
