import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { LevelService } from './level.service';
import type { Level, CreateLevelRequest, UpdateLevelRequest } from '../../shared/models/user.model';

describe('LevelService', () => {
  let service: LevelService;
  let httpMock: HttpTestingController;

  const mockLevels: Level[] = [
    { id: 1, name: 'Admin', description: 'Administrator', is_active: true, created_at: null, updated_at: null },
    { id: 2, name: 'User', description: 'Regular user', is_active: true, created_at: null, updated_at: null },
  ];

  const mockLevel: Level = mockLevels[0];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LevelService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('list()', () => {
    it('should send GET /api/levels with default pagination', () => {
      service.list().subscribe((response) => {
        expect(response.data).toEqual(mockLevels);
      });

      const req = httpMock.expectOne(
        (r) => r.url === '/api/levels' && r.method === 'GET',
      );
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('per_page')).toBe('100');
      req.flush({
        data: mockLevels,
        meta: { page: 1, per_page: 100, total: 2, total_pages: 1 },
      });
    });

    it('should accept custom params', () => {
      service.list({ perPage: 50, search: 'admin' }).subscribe();

      const req = httpMock.expectOne((r) => r.url === '/api/levels');
      expect(req.request.params.get('per_page')).toBe('50');
      expect(req.request.params.get('search')).toBe('admin');
      req.flush({ data: [], meta: { page: 1, per_page: 50, total: 0, total_pages: 0 } });
    });

    it('should map backend meta to PaginatedResponse', () => {
      service.list().subscribe((response) => {
        expect(response.total).toBe(2);
        expect(response.page).toBe(1);
        expect(response.perPage).toBe(100);
      });

      const req = httpMock.expectOne((r) => r.url === '/api/levels');
      req.flush({
        data: mockLevels,
        meta: { page: 1, per_page: 100, total: 2, total_pages: 1 },
      });
    });
  });

  describe('getById()', () => {
    it('should send GET /api/levels/1 and return mapped Level', () => {
      service.getById(1).subscribe((level) => {
        expect(level).toEqual(mockLevel);
      });

      const req = httpMock.expectOne('/api/levels/1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockLevel });
    });
  });

  describe('create()', () => {
    it('should send POST /api/levels with body and return mapped Level', () => {
      const payload: CreateLevelRequest = { name: 'Test' };
      service.create(payload).subscribe((level) => {
        expect(level).toEqual(mockLevel);
      });

      const req = httpMock.expectOne('/api/levels');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ data: mockLevel });
    });
  });

  describe('update()', () => {
    it('should send PUT /api/levels/1 with body and return mapped Level', () => {
      const payload: UpdateLevelRequest = { name: 'Updated' };
      service.update(1, payload).subscribe((level) => {
        expect(level).toEqual(mockLevel);
      });

      const req = httpMock.expectOne('/api/levels/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ data: mockLevel });
    });
  });

  describe('delete()', () => {
    it('should send DELETE /api/levels/1 and return message', () => {
      service.delete(1).subscribe((response) => {
        expect(response.message).toBe('Level deleted successfully');
      });

      const req = httpMock.expectOne('/api/levels/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Level deleted successfully' });
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate cache after create', () => {
      service.listCached().subscribe();
      httpMock.expectOne('/api/levels?per_page=100').flush({
        data: mockLevels,
        meta: { page: 1, per_page: 100, total: 2, total_pages: 1 },
      });

      const newLevel: Level = { id: 3, name: 'New Level', description: '', is_active: true, created_at: null, updated_at: null };
      service.create({ name: 'New Level' }).subscribe();
      httpMock.expectOne('/api/levels').flush({ data: newLevel });

      service.listCached().subscribe((levels) => {
        expect(levels).toEqual([...mockLevels, newLevel]);
      });
      httpMock.expectOne('/api/levels?per_page=100').flush({
        data: [...mockLevels, newLevel],
        meta: { page: 1, per_page: 100, total: 3, total_pages: 1 },
      });
    });

    it('should invalidate cache after update', () => {
      service.listCached().subscribe();
      httpMock.expectOne('/api/levels?per_page=100').flush({
        data: mockLevels,
        meta: { page: 1, per_page: 100, total: 2, total_pages: 1 },
      });

      const updated: Level = { ...mockLevel, name: 'Admin Updated' };
      service.update(1, { name: 'Admin Updated' }).subscribe();
      httpMock.expectOne('/api/levels/1').flush({ data: updated });

      service.listCached().subscribe((levels) => {
        expect(levels.find((l) => l.id === 1)?.name).toBe('Admin Updated');
      });
      httpMock.expectOne('/api/levels?per_page=100').flush({
        data: [updated, mockLevels[1]],
        meta: { page: 1, per_page: 100, total: 2, total_pages: 1 },
      });
    });

    it('should invalidate cache after delete', () => {
      service.listCached().subscribe();
      httpMock.expectOne('/api/levels?per_page=100').flush({
        data: mockLevels,
        meta: { page: 1, per_page: 100, total: 2, total_pages: 1 },
      });

      service.delete(1).subscribe();
      httpMock.expectOne('/api/levels/1').flush({ message: 'deleted' });

      service.listCached().subscribe((levels) => {
        expect(levels).toEqual([mockLevels[1]]);
      });
      httpMock.expectOne('/api/levels?per_page=100').flush({
        data: [mockLevels[1]],
        meta: { page: 1, per_page: 100, total: 1, total_pages: 1 },
      });
    });
  });
});
