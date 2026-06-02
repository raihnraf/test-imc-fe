import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { LoginComponent } from './login.component';
import type { LoginResponse, ApiErrorResponse } from '../../../shared/models/auth.model';

const mockLoginRes: LoginResponse = {
  data: {
    access_token: 'access-abc',
    refresh_token: 'refresh-xyz',
    token_type: 'Bearer',
    expires_in: 900,
    user: { id: 1, username: 'admin', full_name: 'Super Admin', level_id: 1 },
  },
};

const mockPermissionMatrix = {
  data: [
    { id: 1, name: 'Users', route_path: '/users', has_access: true },
    { id: 2, name: 'Levels', route_path: '/levels', has_access: true },
    { id: 3, name: 'Pages', route_path: '/pages', has_access: true },
  ],
};

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  function flushLoginAndPermissions(): void {
    httpMock.expectOne('/auth/login').flush(mockLoginRes);
    httpMock.expectOne('/api/permissions/matrix?user_id=1').flush(mockPermissionMatrix);
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form when fields are empty', () => {
    expect(component.loginForm.invalid).toBeTrue();
  });

  it('should be valid when both fields are filled', () => {
    component.loginForm.setValue({ identifier: 'admin', password: 'pass' });
    expect(component.loginForm.valid).toBeTrue();
  });

  it('should call AuthService.login with identifier mapped to username on submit', () => {
    component.loginForm.setValue({ identifier: 'admin', password: 'pass' });
    component.onSubmit();

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.body).toEqual({
      username: 'admin',
      password: 'pass',
    });
    req.flush(mockLoginRes);

    httpMock.expectOne('/api/permissions/matrix?user_id=1').flush(mockPermissionMatrix);
  });

  it('should navigate to /admin on login success', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.loginForm.setValue({ identifier: 'admin', password: 'pass' });
    component.onSubmit();

    flushLoginAndPermissions();

    expect(navigateSpy).toHaveBeenCalledWith(['/admin']);
  });

  it('should display server error on login failure', () => {
    component.loginForm.setValue({ identifier: 'wrong', password: 'wrong' });
    component.onSubmit();

    const errorBody: ApiErrorResponse = {
      statusCode: 401,
      error: { type: 'INVALID_CREDENTIALS', description: 'Invalid username or password' },
    };

    httpMock
      .expectOne('/auth/login')
      .flush(errorBody, { status: 401, statusText: 'Unauthorized' });

    expect(component.serverError()).toBe('Invalid username or password');
    expect(component.isLoading()).toBeFalse();
  });

  it('should set isLoading false after login finishes', () => {
    component.loginForm.setValue({ identifier: 'admin', password: 'pass' });
    component.onSubmit();

    flushLoginAndPermissions();

    expect(component.isLoading()).toBeFalse();
  });
});
