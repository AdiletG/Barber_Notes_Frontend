import { HttpInterceptorFn } from '@angular/common/http';
import { environment} from '../../../environments/environment.development';

const AUTH_PATH = "/api/v1/auth";

export const authInterceptor : HttpInterceptorFn = (req, next) => {
    if(!req.url.startsWith(environment.apiUrl)){
      return next(req);
    }

    const token = localStorage.getItem("access_token");

    const isAuthRequest = req.url.startsWith(`${environment.apiUrl}${AUTH_PATH}`);

    const headers = token
      ? req.headers.set("Authorization", "Bearer " + token)
      : req.headers;

    const modifiedRequest = req.clone({
      headers,
      withCredentials: isAuthRequest,
    });

    return next(modifiedRequest);
}
