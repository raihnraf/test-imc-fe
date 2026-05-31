import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import type { LoginResponse, RefreshResponse } from '../../shared/models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockLoginRes: LoginResponse = {
    data: {
      access_token: 'access-abc',
      refresh_token: 'refresh-xyz',
      token_type: 'Bearer',
      expires_in: 900,
      user: { id: 1, username: 'admin', full_name: 'Super Admin', level_id: 1 },
    },
  };

  const mockRefreshRes: RefreshResponse = {
    data: {
      access_token: 'access-new',
      refresh_token: 'refresh-new',
      token_type: 'Bearer',
      expires_in: 900,
    },
  };

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthService,
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should store tokens in signal and sessionStorage on login', () => {
    expect(service.isAuthenticated()).toBeFalse();

    service
      .login({ username: 'admin', email: 'admin', password: 'pass' })
      .subscribe((res) => {
        expect(res.data.access_token).toBe('access-abc');
      });

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.body).toEqual({
      username: 'admin',
      email: 'admin',
      password: 'pass',
    });
    req.flush(mockLoginRes);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.user()?.username).toBe('admin');
    expect(sessionStorage.getItem('refresh_token')).toBe('refresh-xyz');
  });

  it('should clear signals and sessionStorage on logout', () => {
    service
      .login({ username: 'admin', email: 'admin', password: 'pass' })
      .subscribe();
    httpMock.expectOne('/auth/login').flush(mockLoginRes);

    expect(service.isAuthenticated()).toBeTrue();
    expect(sessionStorage.getItem('refresh_token')).not.toBeNull();

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.user()).toBeNull();
    expect(sessionStorage.getItem('refresh_token')).toBeNull();
  });

  it('should refresh token and rotate refresh token in sessionStorage', () => {
    sessionStorage.setItem('refresh_token', 'refresh-xyz');

    service.refreshToken().subscribe((res) => {
      expect(res.data.access_token).toBe('access-new');
    });

    const req = httpMock.expectOne('/auth/refresh');
    expect(req.request.body).toEqual({ refresh_token: 'refresh-xyz' });
    req.flush(mockRefreshRes);

    expect(sessionStorage.getItem('refresh_token')).toBe('refresh-new');
  });

  it('should throw when refreshToken called with no token in sessionStorage', () => {
    service.refreshToken().subscribe({
      error: (err) => {
        expect(err.message).toBe('No refresh token available');
      },
    });
  });

  it('should return false from restoreSession when no refresh token', () => {
    service.restoreSession().subscribe((result) => {
      expect(result).toBeFalse();
    });
  });

  it('should return true from restoreSession when refresh succeeds', () => {
    sessionStorage.setItem('refresh_token', 'valid-refresh');

    service.restoreSession().subscribe((result) => {
      expect(result).toBeTrue();
      expect(service.isAuthenticated()).toBeTrue();
    });

    const req = httpMock.expectOne('/auth/refresh');
    req.flush(mockRefreshRes);
  });

  it('should return false and clear sessionStorage when restoreSession refresh fails', () => {
    sessionStorage.setItem('refresh_token', 'expired-refresh');

    service.restoreSession().subscribe((result) => {
      expect(result).toBeFalse();
      expect(service.isAuthenticated()).toBeFalse();
      expect(sessionStorage.getItem('refresh_token')).toBeNull();
    });

    httpMock
      .expectOne('/auth/refresh')
      .flush({ error: 'invalid' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should deduplicate concurrent refresh calls', () => {
    sessionStorage.setItem('refresh_token', 'refresh-xyz');

    let callCount = 0;
    service.refreshToken().subscribe(() => callCount++);
    service.refreshToken().subscribe(() => callCount++);
    service.refreshToken().subscribe(() => callCount++);

    const req = httpMock.expectOne('/auth/refresh');
    req.flush(mockRefreshRes);

    expect(callCount).toBe(3);
    httpMock.expectNone('/auth/refresh');
  });
});
