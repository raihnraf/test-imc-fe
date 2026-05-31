import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

function createRouteSnapshot(): ActivatedRouteSnapshot {
  return {} as ActivatedRouteSnapshot;
}

function createRouterState(): RouterStateSnapshot {
  return { url: '/test' } as RouterStateSnapshot;
}

describe('authGuard', () => {
  let authService: AuthService;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([])],
    });

    authService = TestBed.inject(AuthService);
  });

  it('should return true when user is authenticated', () => {
    authService['_accessToken'].set('valid-token');
    const result = TestBed.runInInjectionContext(() =>
      authGuard(createRouteSnapshot(), createRouterState()),
    );
    expect(result).toBeTrue();
  });

  it('should return UrlTree to /login when unauthenticated', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(createRouteSnapshot(), createRouterState()),
    );
    expect(result).not.toBeTrue();
    expect(result.toString()).toBe('/login');
  });
});
