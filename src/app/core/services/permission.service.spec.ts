import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { PermissionService } from './permission.service';
import { AuthService } from './auth.service';
import type { User } from '../../shared/models/auth.model';

describe('PermissionService', () => {
  let service: PermissionService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const mockUser: User = {
    id: 42,
    username: 'admin',
    full_name: 'Admin User',
    level_id: 1,
  };

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [], {
      user: signal(mockUser).asReadonly(),
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        PermissionService,
      ],
    });

    service = TestBed.inject(PermissionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load permissions and transform to Record<string, boolean>', () => {
    service.loadPermissions(42).subscribe();

    const req = httpMock.expectOne('/api/permissions/matrix?user_id=42');
    req.flush({
      data: [
        { route_path: '/users', has_access: true },
        { route_path: '/levels', has_access: false },
        { route_path: '/pages', has_access: true },
      ],
    });

    expect(service.permissions()).toEqual({
      '/users': true,
      '/levels': false,
      '/pages': true,
    });
  });

  it('should call correct API endpoint with user_id param', () => {
    service.loadPermissions(99).subscribe();
    const req = httpMock.expectOne('/api/permissions/matrix?user_id=99');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('should expose permissions as readonly signal', () => {
    const perms = service.permissions;
    expect(perms()).toEqual({});
    expect(typeof perms).toBe('function');
  });

  it('refreshPermissions should call loadPermissions with auth user id', () => {
    service.refreshPermissions();

    const req = httpMock.expectOne('/api/permissions/matrix?user_id=42');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('loadLevelMatrix should GET matrix with level_id param and return data array', () => {
    const mockMatrix = [
      { id: 1, name: 'Users', route_path: '/users', has_access: true },
      { id: 2, name: 'Levels', route_path: '/levels', has_access: false },
    ];

    service.loadLevelMatrix(5).subscribe((result) => {
      expect(result).toEqual(mockMatrix);
    });

    const req = httpMock.expectOne('/api/permissions/matrix?level_id=5');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockMatrix });
  });

  it('grantLevelPermission should POST with page_id body', () => {
    service.grantLevelPermission(1, 5).subscribe((result) => {
      expect(result.message).toBe('Permission granted');
    });

    const req = httpMock.expectOne('/api/levels/1/permissions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ page_id: 5 });
    req.flush({ message: 'Permission granted' });
  });

  it('revokeLevelPermission should DELETE with page_id in body', () => {
    service.revokeLevelPermission(1, 5).subscribe((result) => {
      expect(result.message).toBe('Permission revoked');
    });

    const req = httpMock.expectOne('/api/levels/1/permissions');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ page_id: 5 });
    req.flush({ message: 'Permission revoked' });
  });

  it('loadUserOverrides should GET user permissions and return data array', () => {
    const mockOverrides = [
      {
        id: 1,
        page_id: 3,
        page_name: 'Users',
        route_path: '/users',
        is_granted: true,
      },
    ];

    service.loadUserOverrides(1).subscribe((result) => {
      expect(result).toEqual(mockOverrides);
    });

    const req = httpMock.expectOne('/api/users/1/permissions');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockOverrides });
  });

  it('grantUserPermission should POST with page_id and is_granted body', () => {
    service.grantUserPermission(1, 5, true).subscribe((result) => {
      expect(result.message).toBe('Override added');
    });

    const req = httpMock.expectOne('/api/users/1/permissions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ page_id: 5, is_granted: true });
    req.flush({ message: 'Override added' });
  });

  it('removeUserOverride should DELETE with page_id in body', () => {
    service.removeUserOverride(1, 5).subscribe((result) => {
      expect(result.message).toBe('Override removed');
    });

    const req = httpMock.expectOne('/api/users/1/permissions');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ page_id: 5 });
    req.flush({ message: 'Override removed' });
  });
});
