import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TokenStoreService } from '../auth/token-store.service';
import { inject } from '@angular/core';

const AUTH_PATH = '/api/v1/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const token = inject(TokenStoreService).token();

  const isAuthRequest = req.url.startsWith(`${environment.apiUrl}${AUTH_PATH}`);

  const headers = token ? req.headers.set('Authorization', `Bearer ${token}`) : req.headers;

  const modifiedRequest = req.clone({
    headers,
    withCredentials: isAuthRequest,
  });

  return next(modifiedRequest);
};
