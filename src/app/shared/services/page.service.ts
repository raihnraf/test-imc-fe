import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Page, CreatePageRequest, UpdatePageRequest } from '../models/page.model';
import type { PaginatedResponse } from '../models/api.model';

interface PageListParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
}

interface PageListBackendResponse {
  data: Page[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

interface PageDetailBackendResponse {
  data: Page;
}

interface DeleteBackendResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PageService {
  private readonly http = inject(HttpClient);

  list(params?: PageListParams): Observable<PaginatedResponse<Page>> {
    let httpParams = new HttpParams()
      .set('page', params?.page ?? 1)
      .set('per_page', params?.perPage ?? 100);

    if (params?.search !== undefined && params.search !== '') {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.isActive !== undefined) {
      httpParams = httpParams.set('is_active', params.isActive ? '1' : '0');
    }

    return this.http.get<PageListBackendResponse>('/api/pages', { params: httpParams }).pipe(
      map((response) => ({
        data: response.data,
        total: response.meta.total,
        page: response.meta.page,
        perPage: response.meta.per_page,
      })),
    );
  }

  getById(id: number): Observable<Page> {
    return this.http
      .get<PageDetailBackendResponse>(`/api/pages/${id}`)
      .pipe(map((response) => response.data));
  }

  create(data: CreatePageRequest): Observable<Page> {
    return this.http
      .post<PageDetailBackendResponse>('/api/pages', data)
      .pipe(map((response) => response.data));
  }

  update(id: number, data: UpdatePageRequest): Observable<Page> {
    return this.http
      .put<PageDetailBackendResponse>(`/api/pages/${id}`, data)
      .pipe(map((response) => response.data));
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<DeleteBackendResponse>(`/api/pages/${id}`);
  }
}
