import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';
import type { LoginResponse } from '../../shared/models/auth.model';

const mockLoginRes: LoginResponse = {
  data: {
    access_token: 'test-token',
    refresh_token: 'refresh-xyz',
    token_type: 'Bearer',
    expires_in: 900,
    user: { id: 1, username: 'admin', full_name: 'Admin', level_id: 1 },
  },
};

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  function login() {
    authService.login({ username: 'admin', email: 'admin', password: 'pass' }).subscribe();
    httpMock.expectOne('/auth/login').flush(mockLoginRes);
  }

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
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

  it('should attach Bearer token to /api/ requests when authenticated', () => {
    login();

    http.get('/api/users').subscribe();
    const req = httpMock.expectOne('/api/users');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('should attach Bearer token to /auth/ requests when authenticated', () => {
    login();

    http.get('/auth/me').subscribe();
    const req = httpMock.expectOne('/auth/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('should not attach Bearer token when not authenticated', () => {
    http.get('/api/users').subscribe();
    const req = httpMock.expectOne('/api/users');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should not attach token to external URLs', () => {
    login();

    http.get('https://external-api.com/data').subscribe();
    const req = httpMock.expectOne('https://external-api.com/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should not attach token to non-API relative URLs', () => {
    login();

    http.get('/assets/config.json').subscribe();
    const req = httpMock.expectOne('/assets/config.json');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should not attach token to third-party file upload URLs', () => {
    login();

    http.post('https://upload.s3.amazonaws.com/file', {}, {}).subscribe();
    const req = httpMock.expectOne('https://upload.s3.amazonaws.com/file');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
