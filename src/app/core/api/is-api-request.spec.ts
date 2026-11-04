import { describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { isApiRequest, isAuthRequest } from './is-api-request';

describe('isApiRequest', () => {
  it('true для адреса нашего API', () => {
    expect(isApiRequest(`${environment.apiUrl}/api/v1/branches`)).toBe(true);
  });

  it('false для чужого сайта', () => {
    expect(isApiRequest('https://example.com/api/v1/branches')).toBe(false);
  });

  it('false для другого порта того же хоста', () => {
    expect(isApiRequest('http://localhost:8102/api/v1/branches')).toBe(false);
  });
});

describe('isAuthRequest', () => {
  it('true для входа и обновления токена', () => {
    expect(isAuthRequest(`${environment.apiUrl}/api/v1/auth/staff-login`)).toBe(true);
    expect(isAuthRequest(`${environment.apiUrl}/api/v1/auth/refresh`)).toBe(true);
  });

  it('false для обычного адреса API', () => {
    expect(isAuthRequest(`${environment.apiUrl}/api/v1/branches`)).toBe(false);
  });

  it('false для чужого сайта с похожим путём', () => {
    expect(isAuthRequest('https://example.com/api/v1/auth/refresh')).toBe(false);
  });
});
