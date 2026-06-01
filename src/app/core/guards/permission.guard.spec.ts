import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { signal } from '@angular/core';
import { permissionGuard } from './permission.guard';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../services/auth.service';
import { PERMISSION_KEYS } from '../constants/permission-keys';
import type { AuthUser } from '../../shared/models/auth.model';

function createRouteSnapshot(data?: Record<string, unknown>): ActivatedRouteSnapshot {
  return { data: data ?? {} } as ActivatedRouteSnapshot;
}

function createRouterState(): RouterStateSnapshot {
  return { url: '/test' } as RouterStateSnapshot;
}

describe('permissionGuard', () => {
  let permissionService: PermissionService;

  const mockUser: AuthUser = {
    id: 1,
    username: 'admin',
    full_name: 'Admin User',
    level_id: 1,
  };

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', [], {
      user: signal(mockUser).asReadonly(),
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    });

    permissionService = TestBed.inject(PermissionService);
  });

  it('should return true when route has no permission data', () => {
    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(createRouteSnapshot(), createRouterState()),
    );
    expect(result).toBeTrue();
  });

  it('should return true when permissions[requiredPermission] === true', () => {
    permissionService['_permissions'].set({ [PERMISSION_KEYS.USERS]: true });

    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(
        createRouteSnapshot({ permission: PERMISSION_KEYS.USERS }),
        createRouterState(),
      ),
    );
    expect(result).toBeTrue();
  });

  it('should return UrlTree to /forbidden when permissions[requiredPermission] !== true', () => {
    permissionService['_permissions'].set({ [PERMISSION_KEYS.USERS]: false });

    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(
        createRouteSnapshot({ permission: PERMISSION_KEYS.USERS }),
        createRouterState(),
      ),
    );
    expect(result).not.toBeTrue();
    expect(result.toString()).toBe('/forbidden');
  });

  it('should return UrlTree to /forbidden when permissions record is empty', () => {
    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(
        createRouteSnapshot({ permission: PERMISSION_KEYS.USERS }),
        createRouterState(),
      ),
    );
    expect(result).not.toBeTrue();
    expect(result.toString()).toBe('/forbidden');
  });

  it('should return true when requiredPermission is present and true in permissions', () => {
    permissionService['_permissions'].set({
      [PERMISSION_KEYS.USERS]: true,
      [PERMISSION_KEYS.LEVELS]: false,
    });

    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(
        createRouteSnapshot({ permission: PERMISSION_KEYS.USERS }),
        createRouterState(),
      ),
    );
    expect(result).toBeTrue();
  });
});
