import '@angular/compiler';

import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { ToAppErrorMapper } from '../to-app-error';

describe('ToAppErrorMapper', () => {
  const errorMapper = new ToAppErrorMapper();

  it('должен переносить поля из ответа бэкенда', () => {
    const responseBody = {
      timestamp: '2026-11-03T10:00:00',
      status: 400,
      error: 'VALIDATION_ERROR',
      message: 'Проверьте введённые данные',
      path: '/api/v1/appointments',
      validationErrors: [
        {
          field: 'phone',
          message: 'Некорректный номер телефона',
        },
      ],
    };

    const httpError = new HttpErrorResponse({
      status: 400,
      error: responseBody,
    });

    const result = errorMapper.map(httpError);

    expect(result.status).toBe(400);
    expect(result.error).toBe('VALIDATION_ERROR');
    expect(result.message).toBe('Проверьте введённые данные');
    expect(result.path).toBe('/api/v1/appointments');
    expect(result.fieldErrors).toEqual([
      {
        field: 'phone',
        message: 'Некорректный номер телефона',
      },
    ]);
  });

  it('должен возвращать пустой fieldErrors, если validationErrors отсутствует', () => {
    const responseBody = {
      timestamp: '2026-11-03T10:00:00',
      status: 422,
      error: 'BUSINESS_RULE_VIOLATION',
      message: 'Дата записи не может быть в прошлом',
      path: '/api/v1/appointments',
    };

    const httpError = new HttpErrorResponse({
      status: 422,
      error: responseBody,
    });

    const result = errorMapper.map(httpError);

    expect(result.fieldErrors).toEqual([]);
  });

  it('должен обрабатывать отсутствие соединения с сервером', () => {
    const httpError = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
    });

    const result = errorMapper.map(httpError);

    expect(result.status).toBe(0);
    expect(result.error).toBe('NETWORK_ERROR');
    expect(result.message).toBe('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз');
    expect(result.fieldErrors).toEqual([]);
  });

  it('должен возвращать стандартное сообщение, если тело ответа не JSON', () => {
    const httpError = new HttpErrorResponse({
      status: 502,
      error: '<html>Bad Gateway</html>',
    });

    const result = errorMapper.map(httpError);

    expect(result.status).toBe(502);
    expect(result.error).toBe('UNKNOWN');
    expect(result.message).toBe('Сервер временно недоступен');
    expect(result.fieldErrors).toEqual([]);
  });

  it('должен читать Retry-After при статусе 429', () => {
    const httpError = new HttpErrorResponse({
      status: 429,
      error: {
        status: 429,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Слишком много запросов',
      },
      headers: new HttpHeaders({
        'Retry-After': 30,
      }),
    });

    const result = errorMapper.map(httpError);

    expect(result.status).toBe(429);
    expect(result.retryAfterSeconds).toBe(30);
  });

  it('должен оставлять retryAfterSeconds пустым, если заголовка нет', () => {
    const httpError = new HttpErrorResponse({
      status: 429,
      error: {
        status: 429,
        error: 'OTP_COOLDOWN_ACTIVE',
        message: 'Повторите попытку позже',
      },
    });

    const result = errorMapper.map(httpError);

    expect(result.status).toBe(429);
    expect(result.retryAfterSeconds).toBeUndefined();
  });
});
