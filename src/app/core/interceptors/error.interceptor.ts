import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { EMPTY, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';

const RETRY_HEADER = 'X-Retry-After-Refresh';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const permissionService = inject(PermissionService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Connection refused / network error — don't logout, let component handle
      if (error.status === 0) {
        return throwError(() => error);
      }

      if (error.status !== 401) {
        return throwError(() => error);
      }

      // For logout requests, just re-throw — auth.service's catchError will call clearSession()
      if (req.url.endsWith('/auth/logout')) {
        return throwError(() => error);
      }

      if (req.headers.has(RETRY_HEADER) || req.url === '/auth/refresh') {
        authService.logout().subscribe();
        return EMPTY;
      }

      return authService.refreshToken().pipe(
        switchMap(() => permissionService.refreshPermissions()),
        switchMap(() => {
          const token = authService.accessToken();
          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
              [RETRY_HEADER]: 'true',
            },
          });
          return next(retryReq);
        }),
        catchError(() => {
          authService.logout().subscribe();
          return EMPTY;
        }),
      );
    }),
  );
};
