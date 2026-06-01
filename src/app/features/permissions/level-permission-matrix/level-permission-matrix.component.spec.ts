import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
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
import type { AuthUser } from '../../../shared/models/auth.model';

describe('LevelPermissionMatrixComponent', () => {
  let component: LevelPermissionMatrixComponent;
  let fixture: ComponentFixture<LevelPermissionMatrixComponent>;
  let httpMock: HttpTestingController;

  const mockUser: AuthUser = {
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

  function createAndLoad(): void {
    fixture = TestBed.createComponent(LevelPermissionMatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const loadReq = httpMock.expectOne('/api/permissions/matrix?level_id=1');
    loadReq.flush({
      data: [
        { id: 1, name: 'Users', route_path: '/users', has_access: true },
        { id: 2, name: 'Levels', route_path: '/levels', has_access: false },
      ],
    });
  }

  it('should create and load matrix', () => {
    createAndLoad();

    expect(component).toBeTruthy();
    expect(component.matrix().length).toBe(2);
    expect(component.matrix()[0].name).toBe('Users');
  });

  it('should queue change and show pending state on toggle', () => {
    createAndLoad();

    component.onToggle(component.matrix()[1], true);

    expect(component.hasPendingChanges()).toBeTrue();
    expect(component.pendingCount()).toBe(1);
    expect(component.matrix()[1].has_access).toBeTrue();
  });

  it('should flush pending changes on saveNow', fakeAsync(() => {
    createAndLoad();

    component.onToggle(component.matrix()[1], true);
    component.saveNow();
    tick(550);
    fixture.detectChanges();

    const grantReq = httpMock.expectOne('/api/levels/1/permissions');
    expect(grantReq.request.method).toBe('POST');
    expect(grantReq.request.body).toEqual({ page_id: 2 });
    grantReq.flush({ message: 'Permission granted' });

    tick(50);
    fixture.detectChanges();
    expect(component.hasPendingChanges()).toBeFalse();
    expect(component.matrix()[1].has_access).toBeTrue();
  }));

  it('should auto-flush pending changes after debounce', fakeAsync(() => {
    createAndLoad();

    component.onToggle(component.matrix()[1], true);
    tick(550);
    fixture.detectChanges();

    const grantReq = httpMock.expectOne('/api/levels/1/permissions');
    expect(grantReq.request.method).toBe('POST');
    grantReq.flush({ message: 'Permission granted' });

    tick(50);
    fixture.detectChanges();
    expect(component.hasPendingChanges()).toBeFalse();
  }));

  it('should batch multiple toggles into single flush', fakeAsync(() => {
    createAndLoad();

    component.onToggle(component.matrix()[0], false);
    component.onToggle(component.matrix()[1], true);
    tick(550);
    fixture.detectChanges();

    const requests = httpMock.match('/api/levels/1/permissions');
    expect(requests.length).toBe(2);
    requests.forEach((req) => req.flush({ message: 'ok' }));

    tick(50);
    fixture.detectChanges();
    expect(component.hasPendingChanges()).toBeFalse();
  }));

  it('should call revokeLevelPermission when toggle is unchecked', fakeAsync(() => {
    createAndLoad();

    component.onToggle(component.matrix()[0], false);
    component.saveNow();
    tick(550);
    fixture.detectChanges();

    const revokeReq = httpMock.expectOne('/api/levels/1/permissions');
    expect(revokeReq.request.method).toBe('DELETE');
    revokeReq.flush({ message: 'Permission revoked' });

    tick(50);
    fixture.detectChanges();
    expect(component.matrix()[0].has_access).toBeFalse();
  }));
});
