import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import type { User } from '../../shared/models/user.model';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUsers: User[] = [
    { id: 1, full_name: 'Test', username: 'test', email: 'test@test.com', level_id: null, is_active: true, created_at: null, updated_at: null },
    { id: 2, full_name: 'Test 2', username: 'test2', email: 'test2@test.com', level_id: 1, is_active: false, created_at: null, updated_at: null },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should send GET /api/users with pagination params', () => {
    service.list({ page: 1, perPage: 15 }).subscribe((response) => {
      expect(response.data.length).toBe(2);
      expect(response.page).toBe(1);
      expect(response.perPage).toBe(15);
    });

    const req = httpMock.expectOne(
      (r) => r.url === '/api/users' && r.method === 'GET',
    );
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('per_page')).toBe('15');
    req.flush({ data: mockUsers, meta: { page: 1, per_page: 15, total: 2, total_pages: 1 } });
  });

  it('should include search param when provided', () => {
    service.list({ page: 1, perPage: 15, search: 'admin' }).subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/users');
    expect(req.request.params.get('search')).toBe('admin');
    req.flush({ data: [], meta: { page: 1, per_page: 15, total: 0, total_pages: 0 } });
  });

  it('should include is_active=0 for inactive filter', () => {
    service.list({ page: 1, perPage: 15, isActive: false }).subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/users');
    expect(req.request.params.get('is_active')).toBe('0');
    req.flush({ data: [], meta: { page: 1, per_page: 15, total: 0, total_pages: 0 } });
  });

  it('should include is_active=1 for active filter', () => {
    service.list({ page: 1, perPage: 15, isActive: true }).subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/users');
    expect(req.request.params.get('is_active')).toBe('1');
    req.flush({ data: [], meta: { page: 1, per_page: 15, total: 0, total_pages: 0 } });
  });

  it('should include level_id param when provided', () => {
    service.list({ page: 1, perPage: 15, levelId: 3 }).subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/users');
    expect(req.request.params.get('level_id')).toBe('3');
    req.flush({ data: [], meta: { page: 1, per_page: 15, total: 0, total_pages: 0 } });
  });

  it('should map backend meta response to PaginatedResponse', () => {
    service.list({ page: 2, perPage: 10 }).subscribe((response) => {
      expect(response.data.length).toBe(2);
      expect(response.total).toBe(25);
      expect(response.page).toBe(2);
      expect(response.perPage).toBe(10);
    });

    const req = httpMock.expectOne((r) => r.url === '/api/users');
    req.flush({
      data: mockUsers,
      meta: { page: 2, per_page: 10, total: 25, total_pages: 3 },
    });
  });

  it('should GET /api/users/:id and extract data envelope', () => {
    const user = mockUsers[0];
    service.getById(1).subscribe((result) => {
      expect(result).toEqual(user);
    });

    const req = httpMock.expectOne((r) => r.url === '/api/users/1' && r.method === 'GET');
    req.flush({ data: user });
  });

  it('should POST /api/users with body and extract data envelope', () => {
    const payload = { full_name: 'New', username: 'new', email: 'new@test.com', password: 'secret', level_id: null };
    service.create(payload).subscribe((result) => {
      expect(result.id).toBe(3);
    });

    const req = httpMock.expectOne((r) => r.url === '/api/users' && r.method === 'POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: { ...mockUsers[0], id: 3, full_name: 'New' } });
  });

  it('should PUT /api/users/:id with body and extract data envelope', () => {
    const payload = { full_name: 'Updated' };
    service.update(1, payload).subscribe((result) => {
      expect(result.full_name).toBe('Updated');
    });

    const req = httpMock.expectOne((r) => r.url === '/api/users/1' && r.method === 'PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: { ...mockUsers[0], full_name: 'Updated' } });
  });

  it('should DELETE /api/users/:id and return message', () => {
    service.delete(1).subscribe((result) => {
      expect(result.message).toBe('User deleted');
    });

    const req = httpMock.expectOne((r) => r.url === '/api/users/1' && r.method === 'DELETE');
    req.flush({ message: 'User deleted' });
  });

  it('should remove empty password from update body', () => {
    service.update(1, { full_name: 'Updated', password: '' }).subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/users/1' && r.method === 'PUT');
    expect(req.request.body).toEqual({ full_name: 'Updated' });
    req.flush({ data: mockUsers[0] });
  });
});
