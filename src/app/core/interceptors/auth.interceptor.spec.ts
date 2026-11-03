import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';

import { authInterceptor } from './auth.interceptor';
import { environment } from '../../../environments/environment.development';
import {afterEach, beforeEach, expect} from 'vitest';

describe('AuthInterceptor', () => {
  let httpTestingController: HttpTestingController;

  const token = "test-access-token";

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.removeItem("access_token");
  });


  it('should not add Authorization header when token is absent', () => {
    localStorage.removeItem('access_token');

    const url = `${environment.apiUrl}/api/v1/branches`;

    TestBed.inject(HttpClient)
      .get(url)
      .subscribe();

    const request = httpTestingController.expectOne(url);

    expect(request.request.headers.has('Authorization')).toBe(false);

    request.flush({});
  });

  it('should add Bearer token to Authorization header', () => {
    localStorage.setItem('access_token', token);

    const url = `${environment.apiUrl}/api/v1/branches`;

    TestBed.inject(HttpClient)
      .get(url)
      .subscribe();

    const request = httpTestingController.expectOne(url);

    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${token}`);

    request.flush({});
  });

  it('should enable cookies only for auth endpoints', () => {
    const http = TestBed.inject(
      // HttpClient импортируется отдельно
      // в начале файла
      HttpClient,
    );

    const refreshUrl = `${environment.apiUrl}/api/v1/auth/refresh`;
    const branchesUrl = `${environment.apiUrl}/api/v1/branches`;

    http.post(refreshUrl, {}).subscribe();
    http.get(branchesUrl).subscribe();

    const refreshRequest = httpTestingController.expectOne(refreshUrl);
    const branchesRequest = httpTestingController.expectOne(branchesUrl);

    expect(refreshRequest.request.withCredentials).toBe(true);
    expect(branchesRequest.request.withCredentials).toBe(false);

    refreshRequest.flush({});
    branchesRequest.flush({});
  });

  it('should not add Authorization header to requests to external sites', () => {
    localStorage.setItem('access_token', token);

    const url = 'https://example.com/api/data';

    TestBed.inject(HttpClient).get(url).subscribe();

    const request = httpTestingController.expectOne(url);

    expect(request.request.headers.has('Authorization')).toBe(false);

    request.flush({});
  });

});
