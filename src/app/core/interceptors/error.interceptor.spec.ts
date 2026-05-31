import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';
import type { RefreshResponse, LoginResponse } from '../../shared/models/auth.model';

const mockLoginRes: LoginResponse = {
  data: {
    access_token: 'test-token',
    refresh_token: 'refresh-xyz',
    token_type: 'Bearer',
    expires_in: 900,
    user: { id: 1, username: 'admin', full_name: 'Admin', level_id: 1 },
  },
};

const mockRefreshRes: RefreshResponse = {
  data: {
    access_token: 'refreshed-token',
    refresh_token: 'new-refresh',
    token_type: 'Bearer',
    expires_in: 900,
  },
};

const mockPermissionMatrix = {
  data: [
    { route_path: '/users', has_access: true },
  ],
};

describe('Interceptors', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should attach Bearer token when authenticated', () => {
    authService.login({ username: 'admin', email: 'admin', password: 'pass' }).subscribe();
    httpMock.expectOne('/auth/login').flush(mockLoginRes);

    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('should not attach Bearer token when not authenticated', () => {
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should pass through non-401 errors', () => {
    http.get('/api/test').subscribe({
      error: (err) => {
        expect(err.status).toBe(500);
      },
    });

    httpMock
      .expectOne('/api/test')
      .flush({ message: 'error' }, { status: 500, statusText: 'Error' });
  });

  it('should retry request after token refresh on 401', (done) => {
    authService.login({ username: 'admin', email: 'admin', password: 'pass' }).subscribe();
    httpMock.expectOne('/auth/login').flush({
      data: {
        ...mockLoginRes.data,
        access_token: 'old-token',
        refresh_token: 'valid-refresh',
      },
    });

    http.get('/api/protected').subscribe({
      next: (res) => {
        expect(res).toEqual({ data: 'success' });
        done();
      },
      error: (err) => {
        done.fail(`Should have succeeded but got: ${JSON.stringify(err)}`);
      },
    });

    const req1 = httpMock.expectOne('/api/protected');
    req1.flush({ error: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne('/auth/refresh');
    expect(refreshReq.request.body).toEqual({ refresh_token: 'valid-refresh' });
    refreshReq.flush(mockRefreshRes);

    const permReq = httpMock.expectOne('/api/permissions/matrix?user_id=1');
    permReq.flush(mockPermissionMatrix);

    const req2 = httpMock.expectOne('/api/protected');
    expect(req2.request.headers.get('Authorization')).toBe('Bearer refreshed-token');
    req2.flush({ data: 'success' });
  });
});
