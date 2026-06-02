import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';

function createRouteSnapshot(): ActivatedRouteSnapshot {
  return {} as ActivatedRouteSnapshot;
}

function createRouterState(): RouterStateSnapshot {
  return { url: '/test' } as RouterStateSnapshot;
}

describe('authGuard', () => {
  let authService: AuthService;
  let permissionService: PermissionService;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([])],
    });

    authService = TestBed.inject(AuthService);
    permissionService = TestBed.inject(PermissionService);
  });

  it('should return true when authenticated and has permissions', () => {
    authService['_accessToken'].set('valid-token');
    permissionService['_permissions'].set({ '/dashboard': true });

    const result = TestBed.runInInjectionContext(() =>
      authGuard(createRouteSnapshot(), createRouterState()),
    );
    expect(result).toBeTrue();
  });

  it('should return UrlTree to /forbidden when authenticated but has no permissions', () => {
    authService['_accessToken'].set('valid-token');
    permissionService['_permissions'].set({});

    const result = TestBed.runInInjectionContext(() =>
      authGuard(createRouteSnapshot(), createRouterState()),
    );
    expect(result).not.toBeTrue();
    expect(result.toString()).toBe('/forbidden');
  });

  it('should return UrlTree to /forbidden when authenticated but all permissions are false', () => {
    authService['_accessToken'].set('valid-token');
    permissionService['_permissions'].set({
      '/dashboard': false,
      '/users': false,
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard(createRouteSnapshot(), createRouterState()),
    );
    expect(result).not.toBeTrue();
    expect(result.toString()).toBe('/forbidden');
  });

  it('should return UrlTree to /login when unauthenticated', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(createRouteSnapshot(), createRouterState()),
    );
    expect(result).not.toBeTrue();
    expect(result.toString()).toBe('/login');
  });
});
