import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PageService } from './page.service';
import type { Page, CreatePageRequest, UpdatePageRequest } from '../../shared/models/page.model';

describe('PageService', () => {
  let service: PageService;
  let httpMock: HttpTestingController;

  const mockPages: Page[] = [
    { id: 1, name: 'Dashboard', route_path: '/dashboard', description: 'Main dashboard', display_order: 1, is_active: true, created_at: null, updated_at: null },
    { id: 2, name: 'Settings', route_path: '/settings', description: 'Settings page', display_order: 2, is_active: true, created_at: null, updated_at: null },
  ];

  const mockPage: Page = mockPages[0];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('list()', () => {
    it('should send GET /api/pages with default pagination', () => {
      service.list().subscribe((response) => {
        expect(response.data).toEqual(mockPages);
      });

      const req = httpMock.expectOne(
        (r) => r.url === '/api/pages' && r.method === 'GET',
      );
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('per_page')).toBe('100');
      req.flush({
        data: mockPages,
        meta: { page: 1, per_page: 100, total: 2, total_pages: 1 },
      });
    });

    it('should accept custom params', () => {
      service.list({ perPage: 50, search: 'dashboard' }).subscribe();

      const req = httpMock.expectOne((r) => r.url === '/api/pages');
      expect(req.request.params.get('per_page')).toBe('50');
      expect(req.request.params.get('search')).toBe('dashboard');
      req.flush({ data: [], meta: { page: 1, per_page: 50, total: 0, total_pages: 0 } });
    });

    it('should map backend meta to PaginatedResponse', () => {
      service.list().subscribe((response) => {
        expect(response.total).toBe(2);
        expect(response.page).toBe(1);
        expect(response.perPage).toBe(100);
      });

      const req = httpMock.expectOne((r) => r.url === '/api/pages');
      req.flush({
        data: mockPages,
        meta: { page: 1, per_page: 100, total: 2, total_pages: 1 },
      });
    });
  });

  describe('getById()', () => {
    it('should send GET /api/pages/1 and return mapped Page', () => {
      service.getById(1).subscribe((page) => {
        expect(page).toEqual(mockPage);
      });

      const req = httpMock.expectOne('/api/pages/1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockPage });
    });
  });

  describe('create()', () => {
    it('should send POST /api/pages with body and return mapped Page', () => {
      const payload: CreatePageRequest = { name: 'Test', route_path: '/test' };
      service.create(payload).subscribe((page) => {
        expect(page).toEqual(mockPage);
      });

      const req = httpMock.expectOne('/api/pages');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ data: mockPage });
    });
  });

  describe('update()', () => {
    it('should send PUT /api/pages/1 with body and return mapped Page', () => {
      const payload: UpdatePageRequest = { name: 'Updated' };
      service.update(1, payload).subscribe((page) => {
        expect(page).toEqual(mockPage);
      });

      const req = httpMock.expectOne('/api/pages/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ data: mockPage });
    });
  });

  describe('delete()', () => {
    it('should send DELETE /api/pages/1 and return message', () => {
      service.delete(1).subscribe((response) => {
        expect(response.message).toBe('Page deleted successfully');
      });

      const req = httpMock.expectOne('/api/pages/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Page deleted successfully' });
    });
  });
});
