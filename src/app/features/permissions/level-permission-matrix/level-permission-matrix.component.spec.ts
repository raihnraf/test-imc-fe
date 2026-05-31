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
import { LevelPermissionMatrixComponent } from './level-permission-matrix.component';
import { AuthService } from '../../../core/services/auth.service';
import type { User } from '../../../shared/models/auth.model';

describe('LevelPermissionMatrixComponent', () => {
  let component: LevelPermissionMatrixComponent;
  let fixture: ComponentFixture<LevelPermissionMatrixComponent>;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 1,
    username: 'admin',
    full_name: 'Admin User',
    level_id: 1,
  };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', [], {
      user: signal(mockUser).asReadonly(),
    });

    await TestBed.configureTestingModule({
      imports: [LevelPermissionMatrixComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: '1' }) },
          },
        },
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create and load matrix', () => {
    fixture = TestBed.createComponent(LevelPermissionMatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/permissions/matrix?level_id=1');
    req.flush({
      data: [
        { id: 1, name: 'Users', route_path: '/users', has_access: true },
        { id: 2, name: 'Levels', route_path: '/levels', has_access: false },
      ],
    });

    expect(component).toBeTruthy();
    expect(component.matrix().length).toBe(2);
    expect(component.matrix()[0].name).toBe('Users');
  });

  it('should call grantLevelPermission when toggle is checked', () => {
    fixture = TestBed.createComponent(LevelPermissionMatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const loadReq = httpMock.expectOne('/api/permissions/matrix?level_id=1');
    loadReq.flush({
      data: [
        { id: 5, name: 'Users', route_path: '/users', has_access: false },
      ],
    });

    component.onToggle(component.matrix()[0], true);

    const grantReq = httpMock.expectOne('/api/levels/1/permissions');
    expect(grantReq.request.method).toBe('POST');
    expect(grantReq.request.body).toEqual({ page_id: 5 });
    grantReq.flush({ message: 'Permission granted' });

    expect(component.matrix()[0].has_access).toBeTrue();
  });

  it('should call revokeLevelPermission when toggle is unchecked', () => {
    fixture = TestBed.createComponent(LevelPermissionMatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const loadReq = httpMock.expectOne('/api/permissions/matrix?level_id=1');
    loadReq.flush({
      data: [
        { id: 5, name: 'Users', route_path: '/users', has_access: true },
      ],
    });

    component.onToggle(component.matrix()[0], false);

    const revokeReq = httpMock.expectOne('/api/levels/1/permissions');
    expect(revokeReq.request.method).toBe('DELETE');
    revokeReq.flush({ message: 'Permission revoked' });

    expect(component.matrix()[0].has_access).toBeFalse();
  });
});
