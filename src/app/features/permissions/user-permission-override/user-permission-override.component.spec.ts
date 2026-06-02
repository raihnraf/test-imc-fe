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

  const mockMatrixEntries = [
    { id: 1, name: 'Users', route_path: '/users', has_access: true },
    { id: 2, name: 'Levels', route_path: '/levels', has_access: false },
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

    const matrixReq = httpMock.expectOne('/api/permissions/matrix?user_id=1');
    matrixReq.flush({ data: mockMatrixEntries });

    expect(component).toBeTruthy();
  });

  it('should call grantUserPermission on adding override', () => {
    fixture = TestBed.createComponent(UserPermissionOverrideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const overridesReq = httpMock.expectOne('/api/users/1/permissions');
    overridesReq.flush({ data: [] });

    const matrixReq = httpMock.expectOne('/api/permissions/matrix?user_id=1');
    matrixReq.flush({ data: mockMatrixEntries });

    component.onGrantOverride(1, true);

    const grantReq = httpMock.expectOne('/api/users/1/permissions');
    expect(grantReq.request.method).toBe('POST');
    expect(grantReq.request.body).toEqual({ page_id: 1, is_granted: true });
    grantReq.flush({ message: 'Override added' });

    const reloadOverridesReq = httpMock.expectOne('/api/users/1/permissions');
    reloadOverridesReq.flush({ data: mockOverrides });

    const reloadMatrixReq = httpMock.expectOne('/api/permissions/matrix?user_id=1');
    reloadMatrixReq.flush({ data: mockMatrixEntries });

    expect(snackBar.open).toHaveBeenCalledWith('Override added', 'Close', jasmine.any(Object));
  });

  it('should call ConfirmDialogService.confirm before removing override', () => {
    confirmDialog.confirm.and.returnValue(of(true));

    fixture = TestBed.createComponent(UserPermissionOverrideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const overridesReq = httpMock.expectOne('/api/users/1/permissions');
    overridesReq.flush({ data: mockOverrides });

    const matrixReq = httpMock.expectOne('/api/permissions/matrix?user_id=1');
    matrixReq.flush({ data: mockMatrixEntries });

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

    const reloadMatrixReq = httpMock.expectOne('/api/permissions/matrix?user_id=1');
    reloadMatrixReq.flush({ data: mockMatrixEntries });
  });
});
