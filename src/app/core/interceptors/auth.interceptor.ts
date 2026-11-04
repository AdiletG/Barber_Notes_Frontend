import { HttpInterceptorFn } from '@angular/common/http';
import { TokenStoreService } from '../auth/token-store.service';
import { inject } from '@angular/core';
import { isApiRequest, isAuthRequest } from '../api/is-api-request';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }
  const token = inject(TokenStoreService).token();

  const headers = token ? req.headers.set('Authorization', `Bearer ${token}`) : req.headers;

  const modifiedRequest = req.clone({
    headers,
    withCredentials: isAuthRequest(req.url),
  });

  return next(modifiedRequest);
};
