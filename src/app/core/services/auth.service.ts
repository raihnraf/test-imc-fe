import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, shareReplay, tap, finalize } from 'rxjs/operators';
import type {
  LoginCredentials,
  LoginResponse,
  RefreshResponse,
  User,
} from '../../shared/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _user = signal<User | null>(null);
  private readonly _accessToken = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly isAuthenticated = computed(() => this._accessToken() !== null);

  private _refreshCall$: Observable<RefreshResponse> | null = null;

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/auth/login', credentials)
      .pipe(tap((res) => this.setSession(res.data)));
  }

  logout(): void {
    this._accessToken.set(null);
    this._user.set(null);
    sessionStorage.removeItem('refresh_token');
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<RefreshResponse> {
    const storedRefreshToken = sessionStorage.getItem('refresh_token');
    if (!storedRefreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    if (!this._refreshCall$) {
      this._refreshCall$ = this.http
        .post<RefreshResponse>('/auth/refresh', { refresh_token: storedRefreshToken })
        .pipe(
          tap((res) => {
            this._accessToken.set(res.data.access_token);
            sessionStorage.setItem('refresh_token', res.data.refresh_token);
          }),
          finalize(() => {
            this._refreshCall$ = null;
          }),
          shareReplay(1),
        );
    }

    return this._refreshCall$;
  }

  restoreSession(): Observable<boolean> {
    const stored = sessionStorage.getItem('refresh_token');
    if (!stored) {
      return of(false);
    }

    return this.refreshToken().pipe(
      map(() => true),
      catchError(() => {
        sessionStorage.removeItem('refresh_token');
        return of(false);
      }),
    );
  }

  private setSession(data: LoginResponse['data']): void {
    this._accessToken.set(data.access_token);
    this._user.set(data.user);
    sessionStorage.setItem('refresh_token', data.refresh_token);
  }
}
