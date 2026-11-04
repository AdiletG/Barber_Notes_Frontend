import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationService } from '../../notifications/notification.service';
import { TokenStoreService } from '../../auth/token-store.service';
import { errorInterceptor } from '../error.interceptor';
import { ToAppErrorMapper } from '../to-app-error';

describe('ErrorInterceptor', () => {
  let http: HttpClient;
  let httpTestingController: HttpTestingController;

  let notificationService: { error: ReturnType<typeof vi.fn> };
  let tokenStore: { clearToken: ReturnType<typeof vi.fn> };

  const API_URL = 'http://localhost:8101';

  beforeEach(() => {
    notificationService = {
      error: vi.fn(),
    };

    tokenStore = {
      clearToken: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),

        {
          provide: NotificationService,
          useValue: notificationService,
        },
        {
          provide: TokenStoreService,
          useValue: tokenStore,
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('должен выбрасывать AppError и показывать уведомление при статусе 422', () => {
    const errors: unknown[] = [];

    http.get(`${API_URL}/api/v1/appointments`).subscribe({
      error: (error) => errors.push(error),
    });

    const request = httpTestingController.expectOne(`${API_URL}/api/v1/appointments`);

    request.flush(
      {
        status: 422,
        error: 'BUSINESS_RULE_VIOLATION',
        message: 'Дата записи не может быть в прошлом',
      },
      {
        status: 422,
        statusText: 'Unprocessable Entity',
      }
    );

    expect(errors[0]).toEqual(
      expect.objectContaining({
        status: 422,
        error: 'BUSINESS_RULE_VIOLATION',
      })
    );

    expect(notificationService.error).toHaveBeenCalledWith('Дата записи не может быть в прошлом');
  });

  it('не должен показывать уведомление при статусе 400 с validationErrors', () => {
    const errors: unknown[] = [];

    http.get(`${API_URL}/api/v1/appointments`).subscribe({
      error: (error) => errors.push(error),
    });

    const request = httpTestingController.expectOne(`${API_URL}/api/v1/appointments`);

    request.flush(
      {
        status: 400,
        error: 'VALIDATION_ERROR',
        message: 'Проверьте введённые данные',
        validationErrors: [
          {
            field: 'phone',
            message: 'Некорректный номер телефона',
          },
        ],
      },
      {
        status: 400,
        statusText: 'Bad Request',
      }
    );

    expect(errors[0]).toEqual(
      expect.objectContaining({
        status: 400,
        error: 'VALIDATION_ERROR',
      })
    );

    expect(notificationService.error).not.toHaveBeenCalled();
  });

  it('должен показывать уведомление при статусе 400 без validationErrors', () => {
    http.get(`${API_URL}/api/v1/appointments`).subscribe({
      error: (error: unknown) => {
        expect(error).toBeDefined();
      },
    });

    const request = httpTestingController.expectOne(`${API_URL}/api/v1/appointments`);

    request.flush(
      {
        status: 400,
        error: 'INVALID_INPUT',
        message: 'Некорректные входные данные',
      },
      {
        status: 400,
        statusText: 'Bad Request',
      }
    );

    expect(notificationService.error).toHaveBeenCalledWith('Некорректные входные данные');
  });

  it('должен показывать время ожидания при статусе 429', () => {
    http.get(`${API_URL}/api/v1/appointments`).subscribe({
      error: (error: unknown) => {
        expect(error).toBeDefined();
      },
    });

    const request = httpTestingController.expectOne(`${API_URL}/api/v1/appointments`);

    request.flush(
      {
        status: 429,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Слишком много запросов. Повторите попытку позже.',
      },
      {
        status: 429,
        statusText: 'Too Many Requests',
        headers: new HttpHeaders({
          'Retry-After': '30',
        }),
      }
    );

    expect(notificationService.error).toHaveBeenCalledWith(
      'Слишком много запросов. Повторите попытку через 30 сек.'
    );
  });

  it('не должен очищать токен и показывать уведомление при 401 на refresh', () => {
    http.post(`${API_URL}/api/v1/auth/refresh`, {}).subscribe({
      error: (error: unknown) => {
        expect(error).toBeDefined();
      },
    });

    const request = httpTestingController.expectOne(`${API_URL}/api/v1/auth/refresh`);

    request.flush(
      {
        status: 401,
        error: 'UNAUTHORIZED',
        message: 'Ошибка обновления токена',
      },
      {
        status: 401,
        statusText: 'Unauthorized',
      }
    );

    expect(tokenStore.clearToken).not.toHaveBeenCalled();
    expect(notificationService.error).not.toHaveBeenCalled();
  });

  it('должен очищать токен и показывать уведомление при 401 на другом адресе API', () => {
    http.get(`${API_URL}/api/v1/users/me`).subscribe({
      error: (error: unknown) => {
        expect(error).toBeDefined();
      },
    });

    const request = httpTestingController.expectOne(`${API_URL}/api/v1/users/me`);

    request.flush(
      {
        status: 401,
        error: 'UNAUTHORIZED',
        message: 'Требуется авторизация',
      },
      {
        status: 401,
        statusText: 'Unauthorized',
      }
    );

    expect(tokenStore.clearToken).toHaveBeenCalledOnce();

    expect(notificationService.error).toHaveBeenCalledWith('Сессия истекла, войдите снова');
  });

  it('не должен очищать токен и показывать уведомление при 401 на входе', () => {
    http.post(`${API_URL}/api/v1/auth/staff-login`, {}).subscribe({ error: () => undefined });

    httpTestingController
      .expectOne(`${API_URL}/api/v1/auth/staff-login`)
      .flush(
        { status: 401, error: 'INVALID_CREDENTIALS', message: 'Неверные учётные данные' },
        { status: 401, statusText: 'Unauthorized' }
      );

    expect(tokenStore.clearToken).not.toHaveBeenCalled();
    expect(notificationService.error).not.toHaveBeenCalled();
  });

  it('должен показывать уведомление при отсутствии соединения', () => {
    const errors: unknown[] = [];

    http.get(`${API_URL}/api/v1/appointments`).subscribe({
      error: (error) => errors.push(error),
    });

    const request = httpTestingController.expectOne(`${API_URL}/api/v1/appointments`);

    request.error(new ProgressEvent('error'));

    expect(errors[0]).toEqual(
      expect.objectContaining({
        status: 0,
        error: 'NETWORK_ERROR',
      })
    );

    expect(notificationService.error).toHaveBeenCalledWith(
      'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз'
    );
  });

  it('не должен вмешиваться в запросы на чужие адреса', () => {
    const errors: unknown[] = [];

    const mapper = TestBed.inject(ToAppErrorMapper);
    const mapperSpy = vi.spyOn(mapper, 'map');

    http.get('https://example.com/api').subscribe({
      error: (error) => errors.push(error),
    });

    const request = httpTestingController.expectOne('https://example.com/api');

    request.flush(
      {
        message: 'External server error',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    expect(errors[0]).toBeInstanceOf(HttpErrorResponse);
    expect(mapperSpy).not.toHaveBeenCalled();
    expect(notificationService.error).not.toHaveBeenCalled();
    expect(tokenStore.clearToken).not.toHaveBeenCalled();
  });
});
