import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const permissionService = inject(PermissionService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      return authService.refreshToken().pipe(
        switchMap(() => permissionService.refreshPermissions()),
        switchMap(() => {
          const token = authService.accessToken();
          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
          });
          return next(retryReq);
        }),
        catchError(() => {
          authService.logout().subscribe();
          return throwError(() => error);
        }),
      );
    }),
  );
};
