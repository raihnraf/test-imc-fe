import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { AuthService } from './auth.service';
import type {
  PermissionEntry,
  UserPermissionOverride,
} from '../../shared/models/permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly _permissions = signal<Record<string, boolean>>({});

  readonly permissions = this._permissions.asReadonly();

  loadPermissions(userId: number): Observable<void> {
    return this.http
      .get<{
        data: { route_path: string; has_access: boolean }[];
      }>(`/api/permissions/matrix?user_id=${userId}`)
      .pipe(
        map((response) => response.data),
        tap((perms) => {
          const lookup: Record<string, boolean> = {};
          for (const p of perms) {
            lookup[p.route_path] = p.has_access;
          }
          this._permissions.set(lookup);
        }),
        map(() => void 0),
        catchError(() => {
          this._permissions.set({});
          return of(void 0);
        }),
      );
  }

  refreshPermissions(): Observable<void> {
    const user = this.authService.user();
    if (!user?.id) {
      return new Observable((subscriber) => {
        subscriber.next();
        subscriber.complete();
      });
    }
    return this.loadPermissions(user.id);
  }

  loadLevelMatrix(levelId: number): Observable<PermissionEntry[]> {
    return this.http
      .get<{ data: PermissionEntry[] }>(
        `/api/permissions/matrix?level_id=${levelId}`,
      )
      .pipe(map((response) => response.data));
  }

  grantLevelPermission(
    levelId: number,
    pageId: number,
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `/api/levels/${levelId}/permissions`,
      { page_id: pageId },
    );
  }

  revokeLevelPermission(
    levelId: number,
    pageId: number,
  ): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `/api/levels/${levelId}/permissions`,
      { body: { page_id: pageId } },
    );
  }

  loadUserOverrides(userId: number): Observable<UserPermissionOverride[]> {
    return this.http
      .get<{ data: UserPermissionOverride[] }>(
        `/api/users/${userId}/permissions`,
      )
      .pipe(map((response) => response.data));
  }

  grantUserPermission(
    userId: number,
    pageId: number,
    isGranted: boolean,
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `/api/users/${userId}/permissions`,
      { page_id: pageId, is_granted: isGranted },
    );
  }

  removeUserOverride(
    userId: number,
    pageId: number,
  ): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `/api/users/${userId}/permissions`,
      { body: { page_id: pageId } },
    );
  }
}
