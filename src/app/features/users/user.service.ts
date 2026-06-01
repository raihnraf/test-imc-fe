import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { User, CreateUserRequest, UpdateUserRequest } from '../../shared/models/user.model';
import type { PaginatedResponse } from '../../shared/models/api.model';

interface UserListParams {
  page: number;
  perPage: number;
  search?: string;
  isActive?: boolean;
  levelId?: number;
}

interface UserListBackendResponse {
  data: User[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

interface UserDetailBackendResponse {
  data: User;
}

interface DeleteBackendResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  list(params: UserListParams): Observable<PaginatedResponse<User>> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('per_page', params.perPage);

    if (params.search !== undefined && params.search !== '') {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.isActive !== undefined) {
      httpParams = httpParams.set('is_active', params.isActive ? '1' : '0');
    }
    if (params.levelId !== undefined && params.levelId !== null) {
      httpParams = httpParams.set('level_id', params.levelId);
    }

    return this.http.get<UserListBackendResponse>('/api/users', { params: httpParams }).pipe(
      map((response) => ({
        data: response.data,
        total: response.meta.total,
        page: response.meta.page,
        perPage: response.meta.per_page,
      })),
    );
  }

  getById(id: number): Observable<User> {
    return this.http
      .get<UserDetailBackendResponse>(`/api/users/${id}`)
      .pipe(map((response) => response.data));
  }

  create(data: CreateUserRequest): Observable<User> {
    return this.http
      .post<UserDetailBackendResponse>('/api/users', data)
      .pipe(map((response) => response.data));
  }

  update(id: number, data: UpdateUserRequest): Observable<User> {
    const body = { ...data };
    if (body.password === '') {
      delete body.password;
    }
    return this.http
      .put<UserDetailBackendResponse>(`/api/users/${id}`, body)
      .pipe(map((response) => response.data));
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<DeleteBackendResponse>(`/api/users/${id}`);
  }
}
