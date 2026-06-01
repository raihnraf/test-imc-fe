import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

const API_PREFIXES = ['/api/', '/auth/'] as const;

function isApiRequest(url: string): boolean {
  const normalized = url.startsWith('/') ? url : `/${url.replace(/^https?:\/\/[^/]+/, '')}`;
  return API_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(AuthService);
  const token = authService.accessToken();

  if (token && isApiRequest(req.url)) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
