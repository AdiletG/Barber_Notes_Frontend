import { environment } from '../../../environments/environment';

export function isApiRequest(url: string): boolean {
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

export function isAuthRequest(url: string): boolean {
  if (!isApiRequest(url)) {
    return false;
  }

  const apiBase = new URL(environment.apiUrl);
  const requestUrl = new URL(url, apiBase);
  const basePath = apiBase.pathname.replace(/\/+$/, '');

  return requestUrl.pathname.startsWith(`${basePath}/api/v1/auth/`);
}
