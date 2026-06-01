import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { UserPermissionOverrideComponent } from './user-permission-override.component';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { AuthService } from '../../../core/services/auth.service';
import type { AuthUser } from '../../../shared/models/auth.model';
import type { Page } from '../../../shared/models/page.model';

describe('UserPermissionOverrideComponent', () => {
  let component: UserPermissionOverrideComponent;
  let fixture: ComponentFixture<UserPermissionOverrideComponent>;
  let httpMock: HttpTestingController;
  let confirmDialog: jasmine.SpyObj<ConfirmDialogService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockUser: AuthUser = {
    id: 1,
    username: 'admin',
    full_name: 'Admin User',
    level_id: 1,
  };

  const mockPages: Page[] = [
    { id: 1, name: 'Users', route_path: '/users', description: null, display_order: 1, is_active: true, created_at: null, updated_at: null },
    { id: 2, name: 'Levels', route_path: '/levels', description: null, display_order: 2, is_active: true, created_at: null, updated_at: null },
  ];

  const mockOverrides = [
    { id: 1, page_id: 3, page_name: 'Pages', route_path: '/pages', is_granted: true },
  ];

  beforeEach(async () => {
    confirmDialog = jasmine.createSpyObj<ConfirmDialogService>('ConfirmDialogService', ['confirm']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', [], {
      user: signal(mockUser).asReadonly(),
    });

    await TestBed.configureTestingModule({
      imports: [UserPermissionOverrideComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
        { provide: ConfirmDialogService, useValue: confirmDialog },
        { provide: MatSnackBar, useValue: snackBar },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: '1' }) },
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create and load overrides', () => {
    fixture = TestBed.createComponent(UserPermissionOverrideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const overridesReq = httpMock.expectOne('/api/users/1/permissions');
    overridesReq.flush({ data: [] });

    const pagesReq = httpMock.expectOne('/api/pages?page=1&per_page=100');
    pagesReq.flush({
      data: mockPages,
      meta: { page: 1, per_page: 100, total: 2, total_pages: 1 },
    });

    expect(component).toBeTruthy();
  });

  it('should call grantUserPermission on adding override', () => {
    fixture = TestBed.createComponent(UserPermissionOverrideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const overridesReq = httpMock.expectOne('/api/users/1/permissions');
    overridesReq.flush({ data: [] });

    const pagesReq = httpMock.expectOne('/api/pages?page=1&per_page=100');
    pagesReq.flush({
      data: mockPages,
      meta: { page: 1, per_page: 100, total: 2, total_pages: 1 },
    });

    component.onGrantOverride(1, true);

    const grantReq = httpMock.expectOne('/api/users/1/permissions');
    expect(grantReq.request.method).toBe('POST');
    expect(grantReq.request.body).toEqual({ page_id: 1, is_granted: true });
    grantReq.flush({ message: 'Override added' });

    const reloadReq = httpMock.expectOne('/api/users/1/permissions');
    reloadReq.flush({ data: mockOverrides });

    const pagesReloadReq = httpMock.expectOne('/api/pages?page=1&per_page=100');
    pagesReloadReq.flush({
      data: mockPages,
      meta: { page: 1, per_page: 100, total: 2, total_pages: 1 },
    });

    expect(snackBar.open).toHaveBeenCalledWith('Override added', 'Close', jasmine.any(Object));
  });

  it('should call ConfirmDialogService.confirm before removing override', () => {
    confirmDialog.confirm.and.returnValue(of(true));

    fixture = TestBed.createComponent(UserPermissionOverrideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const overridesReq = httpMock.expectOne('/api/users/1/permissions');
    overridesReq.flush({ data: mockOverrides });

    const pagesReq = httpMock.expectOne('/api/pages?page=1&per_page=100');
    pagesReq.flush({
      data: mockPages,
      meta: { page: 1, per_page: 100, total: 2, total_pages: 1 },
    });

    component.onRemoveOverride(mockOverrides[0]);

    expect(confirmDialog.confirm).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'Remove Override',
        color: 'warn',
      }),
    );

    const removeReq = httpMock.expectOne('/api/users/1/permissions');
    expect(removeReq.request.method).toBe('DELETE');
    removeReq.flush({ message: 'Override removed' });

    const pagesReloadReq = httpMock.expectOne('/api/pages?page=1&per_page=100');
    pagesReloadReq.flush({
      data: mockPages,
      meta: { page: 1, per_page: 100, total: 2, total_pages: 1 },
    });
  });
});
