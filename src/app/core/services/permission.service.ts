import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);

  private readonly _permissions = signal<Record<string, boolean>>({});

  readonly permissions = this._permissions.asReadonly();

  loadPermissions(userId: number): Observable<void> {
    return this.http
      .get<{ route_path: string; has_access: boolean }[]>(
        `/api/permissions/matrix?user_id=${userId}`,
      )
      .pipe(
        tap((perms) => {
          const lookup: Record<string, boolean> = {};
          for (const p of perms) {
            lookup[p.route_path] = p.has_access;
          }
          this._permissions.set(lookup);
        }),
        map(() => void 0),
      );
  }
}
