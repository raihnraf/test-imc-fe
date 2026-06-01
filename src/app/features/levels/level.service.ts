import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Level, CreateLevelRequest, UpdateLevelRequest } from '../../shared/models/user.model';
import type { PaginatedResponse } from '../../shared/models/api.model';

interface LevelListParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
}

interface LevelListBackendResponse {
  data: Level[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

interface LevelDetailBackendResponse {
  data: Level;
}

interface DeleteBackendResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class LevelService {
  private readonly http = inject(HttpClient);

  list(params?: LevelListParams): Observable<PaginatedResponse<Level>> {
    let httpParams = new HttpParams()
      .set('page', params?.page ?? 1)
      .set('per_page', params?.perPage ?? 100);

    if (params?.search !== undefined && params.search !== '') {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.isActive !== undefined) {
      httpParams = httpParams.set('is_active', params.isActive ? '1' : '0');
    }

    return this.http.get<LevelListBackendResponse>('/api/levels', { params: httpParams }).pipe(
      map((response) => ({
        data: response.data,
        total: response.meta.total,
        page: response.meta.page,
        perPage: response.meta.per_page,
      })),
    );
  }

  getById(id: number): Observable<Level> {
    return this.http
      .get<LevelDetailBackendResponse>(`/api/levels/${id}`)
      .pipe(map((response) => response.data));
  }

  create(data: CreateLevelRequest): Observable<Level> {
    return this.http
      .post<LevelDetailBackendResponse>('/api/levels', data)
      .pipe(map((response) => response.data));
  }

  update(id: number, data: UpdateLevelRequest): Observable<Level> {
    return this.http
      .put<LevelDetailBackendResponse>(`/api/levels/${id}`, data)
      .pipe(map((response) => response.data));
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<DeleteBackendResponse>(`/api/levels/${id}`);
  }
}
