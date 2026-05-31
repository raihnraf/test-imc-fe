import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
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
    req.flush([
      { route_path: '/users', has_access: true },
      { route_path: '/levels', has_access: false },
      { route_path: '/pages', has_access: true },
    ]);

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
    req.flush([]);
  });

  it('should expose permissions as readonly signal', () => {
    // Signal returned by asReadonly() is assignable to Signal type but not WritableSignal
    const perms = service.permissions;
    expect(perms()).toEqual({});
    expect(typeof perms).toBe('function');
  });
});
