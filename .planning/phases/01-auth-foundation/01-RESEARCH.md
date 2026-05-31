# Phase 1: Auth Foundation - Research

**Researched:** 2026-05-31
**Domain:** Angular 20 JWT authentication, HTTP interceptors, route guards, token refresh
**Confidence:** HIGH

## Summary

This phase establishes the authentication foundation for the IMC Frontend User Permission Management system. The project is **greenfield** — no Angular source code exists yet. The phase must scaffold the Angular 20 project, implement JWT-based authentication against an existing Slim PHP backend, and set up the infrastructure (interceptors, guards, services) that all subsequent phases depend on.

The backend API contract is fully documented and verified from source code. Key endpoints: `POST /auth/login` (returns `{data: {access_token, refresh_token, token_type, expires_in, user}}`), `POST /auth/refresh` (accepts `{refresh_token}`, returns new access + rotated refresh token). Access tokens expire in 900s (15 min), refresh tokens in 604800s (7 days) with single-use rotation.

**Primary recommendation:** Scaffold Angular 20.3.x project with Angular Material, implement functional HTTP interceptors for auth token attachment and 401-driven refresh with RxJS `BehaviorSubject` queue, use Angular Signals for in-memory auth state with sessionStorage fallback, and functional `CanActivateFn` guards for route protection.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| JWT token storage | Browser / Client | — | Tokens live in browser memory/sessionStorage |
| Token attachment to requests | Browser / Client (interceptor) | — | HTTP interceptor runs in browser |
| Token refresh on 401 | Browser / Client (interceptor) | API / Backend | Interceptor triggers refresh; backend issues new tokens |
| Auth route guarding | Browser / Client (guard) | — | `CanActivateFn` runs in browser |
| Permission loading on init | Browser / Client (service) | API / Backend | Service calls backend API on app bootstrap |
| Login form UI | Browser / Client | — | Angular Material form component |
| Session state management | Browser / Client (signals) | — | Angular Signals in AuthService |

## User Constraints (from CONTEXT.md / STATE.md)

### Locked Decisions
- Angular 20.x with standalone components, signals, and functional patterns (research validated)
- Angular Material only — no Tailwind, no additional CSS frameworks
- Reactive Forms for all CRUD forms
- In-memory signal + sessionStorage fallback for JWT tokens (never localStorage)
- Functional HTTP interceptors with refresh queue for token auto-refresh
- Feature-based folder structure: core/, shared/, features/, layout/

### the agent's Discretion
- Confirm backend API contract details (exact request/response shapes, error format)
- Validate refresh token rotation behavior with backend
- Determine permission string format (e.g., `users:read`, `levels:write`)

### Deferred Ideas (OUT OF SCOPE)
- AUTH-07: Session timeout warning before auto-logout
- OAuth/SSO login, 2FA/MFA, role hierarchy, ABAC

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can log in with username or email and password | Backend `POST /auth/login` accepts `username` or `email` + `password`. Verified from LoginAction.php source. |
| AUTH-02 | JWT access token and refresh token stored securely (in-memory + sessionStorage) | Locked decision: in-memory signal + sessionStorage fallback. Access token in signal, refresh token in sessionStorage. |
| AUTH-03 | Access token auto-refreshed on 401 with request queuing to prevent race conditions | Backend rotates refresh tokens (single-use). Requires `BehaviorSubject`-based queue in error interceptor. Verified from RefreshTokenAction.php source. |
| AUTH-04 | User can log out, clearing all session data and tokens | Clear signal, clear sessionStorage, redirect to `/login`. |
| AUTH-05 | Unauthenticated users redirected to login page | `CanActivateFn` guard returning `router.parseUrl('/login')` when not authenticated. |
| AUTH-06 | Login form validates required fields and shows server error messages | Reactive Forms with `Validators.required`. Backend returns `{statusCode, error: {type, description, errors?}}` format. |
| NAV-04 | Permission service loads permissions from API on app init (separate from JWT) | Backend has `GET /api/permissions/matrix?user_id=X` endpoint. Load via `APP_INITIALIZER` or post-login service call. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@angular/core` | 20.3.x | Application framework | Latest Angular 20 LTS-aligned version. Signals-based reactivity, standalone components, functional guards/interceptors. Verified on npm registry. |
| `@angular/router` | 20.3.x | Navigation & route protection | Required for auth guards, lazy-loaded feature routes, redirect logic. Verified on npm registry. |
| `@angular/common/http` | 20.3.x | API communication | Built-in HttpClient with functional interceptor support. Verified on npm registry. |
| `@angular/forms` | 20.3.x | Reactive Forms | Locked decision. Typed forms, FormBuilder, built-in validators. Verified on npm registry. |
| `@angular/material` | 20.3.x | UI component library | Locked decision. MatFormField, MatInput, MatButton, MatSnackBar for login UI. Verified on npm registry. |
| `@angular/cdk` | 20.3.x | Behavioral primitives | Ships with Angular Material. Overlay system for dialogs, snackbar positioning. Verified on npm registry. |
| `@angular/animations` | 20.3.x | Material animation support | Peer dependency of Angular Material. Required for MatSnackBar, MatDialog transitions. Verified on npm registry. |
| `rxjs` | 7.8.x | Reactive streams | Required by Angular 20.x. `BehaviorSubject` for refresh queue, `catchError`, `switchMap`, `tap` operators. Verified on npm registry. |
| `zone.js` | 0.16.x | Change detection | Auto-installed by Angular CLI. Required for Angular's change detection system. Verified on npm registry. |

**Installation:**
```bash
ng new imc-frontend --routing --style=scss --standalone
cd imc-frontend
ng add @angular/material
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Angular Signals for state | NgRx / SignalStore | Overkill for auth state (token, user, permissions). Adds 50+ files of boilerplate. |
| Functional interceptors | Class-based `HttpInterceptor` | Angular v20 explicitly recommends functional. Class-based has unpredictable ordering. |
| sessionStorage for refresh token | httpOnly cookie | Ideal but requires backend changes. Backend currently returns refresh token in JSON body. |
| `localStorage` for tokens | — | XSS vulnerability. Locked decision explicitly forbids it. |

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| @angular/core | npm | 11+ yrs | 5M+/wk | github.com/angular/angular | N/A (npm) | Approved |
| @angular/router | npm | 11+ yrs | 5M+/wk | github.com/angular/angular | N/A (npm) | Approved |
| @angular/common | npm | 11+ yrs | 5M+/wk | github.com/angular/angular | N/A (npm) | Approved |
| @angular/forms | npm | 11+ yrs | 5M+/wk | github.com/angular/angular | N/A (npm) | Approved |
| @angular/material | npm | 9+ yrs | 1.5M+/wk | github.com/angular/components | N/A (npm) | Approved |
| @angular/cdk | npm | 9+ yrs | 1.5M+/wk | github.com/angular/components | N/A (npm) | Approved |
| @angular/animations | npm | 11+ yrs | 3M+/wk | github.com/angular/angular | N/A (npm) | Approved |
| rxjs | npm | 10+ yrs | 30M+/wk | github.com/reactivex/rxjs | N/A (npm) | Approved |
| zone.js | npm | 10+ yrs | 8M+/wk | github.com/angular/zone.js | N/A (npm) | Approved |

**Note:** slopcheck only checks PyPI, not npm. All packages verified directly via `npm view` on the npm registry. All are official Angular/core ecosystem packages with multi-year history and millions of weekly downloads.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Angular)                     │
│                                                              │
│  ┌──────────┐    ┌───────────────┐    ┌──────────────────┐  │
│  │  Login   │───>│  AuthService  │───>│  Signal State    │  │
│  │ Component│    │  (login/logout│    │  user: signal    │  │
│  │          │    │   /refresh)   │    │  accessToken: sig│  │
│  └──────────┘    └───────┬───────┘    │  refreshToken:   │  │
│                          │             │  sessionStorage  │  │
│                          │             └──────────────────┘  │
│                          │                      │            │
│  ┌──────────────┐        │                      │            │
│  │ AuthGuard    │<───────┘                      │            │
│  │ (CanActivate)│                               │            │
│  └──────────────┘                               │            │
│                          ┌──────────────────────┘            │
│  ┌──────────────┐        │                                   │
│  │ Auth         │<───────┘                                   │
│  │ Interceptor  │     (reads accessToken from signal)        │
│  └──────┬───────┘                                           │
│         │                                                    │
│  ┌──────▼───────┐    ┌──────────────────┐                    │
│  │ Error        │    │ Refresh Queue    │                    │
│  │ Interceptor  │───>│ BehaviorSubject  │                    │
│  │ (401 handler)│    │ (pending requests│                    │
│  └──────────────┘    │  replay on new   │                    │
│                      │  token)          │                    │
│                      └──────────────────┘                    │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP (Bearer token)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Slim PHP)                     │
│                                                              │
│  POST /auth/login     → {access_token, refresh_token, user}  │
│  POST /auth/refresh   → {access_token, refresh_token}        │
│  GET  /api/*          → requires Bearer token                │
│  (401 if invalid/expired/missing token)                      │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/app/
├── app.config.ts              # provideHttpClient(withInterceptors), provideRouter, provideAnimations
├── app.routes.ts              # Top-level routes: login (public), admin (guarded, lazy-loaded)
├── app.component.ts           # Root: <router-outlet>
│
├── core/                      # Singleton services, interceptors, guards
│   ├── services/
│   │   ├── auth.service.ts    # Login, logout, refresh, token state (signals), user profile
│   │   └── permission.service.ts # NAV-04: load user permissions from API
│   ├── interceptors/
│   │   ├── auth.interceptor.ts       # Attach Bearer token to all API requests
│   │   └── error.interceptor.ts      # Catch 401 → refresh queue → retry
│   └── guards/
│       └── auth.guard.ts      # CanActivateFn → redirect to /login if unauthenticated
│
├── shared/                    # Reusable types, models, utilities
│   └── models/
│       ├── auth.model.ts      # LoginResponse, RefreshResponse, User, ApiError interfaces
│       └── api.model.ts       # PaginatedResponse, ApiErrorResponse
│
├── features/
│   └── auth/
│       ├── login/
│       │   ├── login.component.ts    # Reactive form, submit handler, error display
│       │   └── login.component.html  # MatFormField + MatInput + MatButton
│       └── auth.routes.ts    # Route: { path: 'login', component: LoginComponent }
│
└── layout/                    # (Phase 2 — placeholder for admin layout)
```

### Pattern 1: Signal-Based AuthService
**What:** Service exposes auth state as signals, components read reactively
**When:** All authentication state management
**Example:**
```typescript
// Source: v20.angular.dev/guide/signals
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  private readonly _accessToken = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._accessToken() !== null);

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/auth/login', credentials).pipe(
      tap((res) => this.setSession(res.data)),
    );
  }

  private setSession(data: LoginData): void {
    this._accessToken.set(data.access_token);
    this._user.set(data.user);
    sessionStorage.setItem('refresh_token', data.refresh_token);
  }

  logout(): void {
    this._accessToken.set(null);
    this._user.set(null);
    sessionStorage.removeItem('refresh_token');
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem('refresh_token');
  }
}
```

### Pattern 2: Functional Auth Interceptor
**What:** Functional interceptor attaches Bearer token to every API request
**When:** All HTTP communication
**Example:**
```typescript
// Source: v20.angular.dev/guide/http/interceptors
export function authInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const token = authService.accessToken();

  if (token) {
    request = request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(request);
}
```

### Pattern 3: Error Interceptor with Refresh Queue
**What:** Catches 401, queues concurrent requests, refreshes token once, replays all
**When:** Token auto-refresh (AUTH-03)
**Example:**
```typescript
// Source: v20.angular.dev/guide/http/interceptors + RxJS patterns
export function errorInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            const cloned = request.clone({
              setHeaders: { Authorization: `Bearer ${authService.accessToken()}` },
            });
            return next(cloned);
          }),
          catchError((refreshError) => {
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
}
```

**Key insight for refresh queue:** The `AuthService.refreshToken()` method should use a `BehaviorSubject<boolean>` to track refresh state. When the first 401 arrives, it triggers the refresh HTTP call. Subsequent 401s `switchMap` to the same `BehaviorSubject`, so they all wait for the single refresh to complete. This prevents multiple concurrent refresh calls that would invalidate rotated tokens.

### Pattern 4: Functional Auth Guard
**What:** `CanActivateFn` redirects unauthenticated users to `/login`
**When:** Protect all routes except login
**Example:**
```typescript
// Source: v20.angular.dev/guide/routing/route-guards
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.parseUrl('/login');
};
```

### Anti-Patterns to Avoid
- **Storing tokens in localStorage:** XSS vulnerability. Use in-memory signal + sessionStorage.
- **Class-based interceptors:** Angular v20 recommends functional. Class-based has unpredictable DI ordering.
- **Refreshing token for every 401 without queue:** Backend rotates refresh tokens — concurrent refreshes invalidate each other.
- **Using `httpResource` for login POST:** `httpResource` is for GET-only. Use `HttpClient.post()` for mutations.
- **Not cloning the request in interceptors:** `HttpRequest` is immutable. Must use `.clone()` to modify headers.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT token storage | Custom crypto + cookie management | In-memory signal + sessionStorage | Simpler, locked decision, no XSS risk from localStorage |
| HTTP request queuing | Manual array + Promise.resolve | RxJS `BehaviorSubject` + `shareReplay(1)` | Handles race conditions, concurrent subscribers, error propagation |
| Form validation | Manual DOM checks | Angular Reactive Forms + `Validators` | Built-in error tracking, async validator support, type safety |
| Route protection | Manual `window.location` checks | Angular `CanActivateFn` guards | Integrates with router, supports UrlTree redirects, composable |
| Error format mapping | String parsing | TypeScript interfaces + typed error handler | Backend returns structured `{statusCode, error: {type, description, errors?}}` |

**Key insight:** The backend's refresh token rotation (single-use) makes the refresh queue non-optional. Without it, concurrent API calls on page load will each trigger a refresh, and the second refresh will invalidate the first one's new token, causing a logout loop.

## Runtime State Inventory

> Not applicable — this is a greenfield phase with no existing runtime state.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no database or storage exists yet | N/A |
| Live service config | None — no external services configured | N/A |
| OS-registered state | None | N/A |
| Secrets/env vars | None — API base URL will be configured via Angular environment | N/A |
| Build artifacts | None — project not yet scaffolded | N/A |

## Common Pitfalls

### Pitfall 1: Token Refresh Race Conditions
**What goes wrong:** Multiple simultaneous API requests all receive 401, each triggers a token refresh. Backend rotates refresh tokens (single-use), so the second refresh invalidates the first one's new token.
**Why it happens:** Error interceptor naively calls `refreshToken()` for every 401 without coordinating concurrent attempts.
**How to avoid:** Use a `BehaviorSubject<Observable<any>>` in AuthService to track refresh state. First 401 triggers the HTTP refresh call. Subsequent 401s subscribe to the same observable via `switchMap`. When refresh completes, all queued requests retry with the new token.
**Warning signs:** Network tab showing multiple concurrent `POST /auth/refresh` calls. User logged out unexpectedly after page load.

### Pitfall 2: Refresh Token Lost on Page Refresh
**What goes wrong:** Access token stored only in memory (signal). User refreshes page, signal resets to null, user appears logged out despite valid refresh token.
**Why it happens:** In-memory storage is volatile. sessionStorage survives page refresh but signal doesn't auto-restore.
**How to avoid:** On app initialization (in `app.config.ts` or `APP_INITIALIZER`), check `sessionStorage.getItem('refresh_token')`. If present, call `POST /auth/refresh` to get a new access token and restore the session. Handle refresh failure by clearing sessionStorage.
**Warning signs:** User refreshes page and is redirected to login despite having a valid refresh token.

### Pitfall 3: Backend Error Format Mismatch
**What goes wrong:** Generic error handler displays `error.message` or raw JSON. Users see technical messages instead of actionable feedback.
**Why it happens:** Backend returns `{statusCode, error: {type, description, errors?}}` format, not standard `HttpErrorResponse.message`.
**How to avoid:** Define TypeScript interfaces matching the backend format. Create an error mapping utility that extracts `error.description` for snackbar messages and `error.errors` for form field mapping.
**Warning signs:** Login form shows `[object Object]` or raw JSON on invalid credentials.

### Pitfall 4: Interceptor Ordering
**What goes wrong:** Error interceptor runs before auth interceptor, so 401 retry doesn't have the new token attached.
**Why it happens:** Angular interceptors execute in the order they are registered. The auth interceptor must run first (attach token), then error interceptor (catch 401, refresh, retry).
**How to avoid:** Register interceptors in correct order: `withInterceptors([authInterceptor, errorInterceptor])`. Auth interceptor first, error interceptor second.
**Warning signs:** Retried requests after 401 still fail with 401 (token not re-attached).

### Pitfall 5: Login Accepts `email` Field But Backend Expects `username` or `email` in Same Field
**What goes wrong:** Login form sends `{username, password}` but user tries to log in with email. Backend `LoginAction.php` checks `$body['username'] ?? null` and `$body['email'] ?? null` separately — it accepts EITHER `username` OR `email` as separate fields.
**Why it happens:** Backend code: `$username = $body['username'] ?? null; $email = $body['email'] ?? null;` — it looks for both fields independently. The login form should send EITHER `{username: '...', password: '...'}` OR `{email: '...', password: '...'}`, or better: send both fields with the same value (the user's input) and let the backend resolve.
**How to avoid:** The login form has a single "Username or Email" field. On submit, detect if input contains `@` — if yes, send as `email` field; otherwise send as `username` field. Or send both fields with the same value (simpler, backend resolves correctly).
**Warning signs:** Login fails with "Username or email is required" when user enters email address.

## Code Examples

### Backend API Contract (Verified from Source)

**Login Request:**
```json
POST /auth/login
Content-Type: application/json

{ "username": "admin", "password": "admin123" }
// OR
{ "email": "admin@example.com", "password": "admin123" }
```

**Login Response (200):**
```json
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "a1b2c3...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": 1,
      "username": "admin",
      "full_name": "Super Admin",
      "level_id": 1
    }
  }
}
```

**Refresh Request:**
```json
POST /auth/refresh
Content-Type: application/json

{ "refresh_token": "a1b2c3..." }
```

**Refresh Response (200):**
```json
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "d4e5f6...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

**Error Response (401/422/409/etc.):**
```json
{
  "statusCode": 401,
  "error": {
    "type": "INVALID_CREDENTIALS",
    "description": "Invalid username/email or password"
  }
}
```

**Validation Error Response (422):**
```json
{
  "statusCode": 422,
  "error": {
    "type": "VALIDATION_ERROR",
    "description": "Validation failed",
    "errors": {
      "username": ["Username or email is required"],
      "password": ["Password is required"]
    }
  }
}
```

### TypeScript Interfaces for Backend Contract
```typescript
export interface User {
  id: number;
  username: string;
  full_name: string;
  level_id: number;
}

export interface LoginResponse {
  data: {
    access_token: string;
    refresh_token: string;
    token_type: 'Bearer';
    expires_in: number;
    user: User;
  };
}

export interface RefreshResponse {
  data: {
    access_token: string;
    refresh_token: string;
    token_type: 'Bearer';
    expires_in: number;
  };
}

export interface ApiErrorResponse {
  statusCode: number;
  error: {
    type: string;
    description: string;
    errors?: Record<string, string[]>;
    field?: string;
  };
}
```

### Login Component Pattern
```typescript
// Source: v20.angular.dev/guide/forms/reactive-forms + v20.angular.dev/guide/http
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loginForm = inject(FormBuilder).group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  isLoading = signal(false);
  serverError = signal<string | null>(null);

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.serverError.set(null);

    const { identifier, password } = this.loginForm.value;
    // Send as both fields — backend resolves which one matches
    const credentials = {
      username: identifier ?? '',
      email: identifier ?? '',
      password: password ?? '',
    };

    this.authService.login(credentials).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const apiError = err.error as ApiErrorResponse;
        this.serverError.set(apiError?.error?.description ?? 'Login failed');
      },
    });
  }
}
```

### App Configuration with Interceptors
```typescript
// Source: v20.angular.dev/guide/http/interceptors
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor]),
    ),
    provideRouter(appRoutes),
    provideAnimations(),
    {
      provide: HTTP_INTERCEPTORS, // Not needed with functional — use withInterceptors above
    },
  ],
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NgModule-based apps | Standalone components | Angular 14+ (stable in 17) | No boilerplate `@NgModule`, simpler imports |
| Class-based guards (`CanActivate` interface) | Functional guards (`CanActivateFn`) | Angular 14+ | Simpler, uses `inject()`, no class instantiation |
| Class-based interceptors (`HttpInterceptor`) | Functional interceptors (`HttpInterceptorFn`) | Angular 15+ | Predictable ordering, no DI complexity |
| Zone.js-heavy change detection | Signals + OnPush | Angular 16+ (mature in 17-20) | Fine-grained reactivity, fewer change detection cycles |
| `async` pipe for HTTP data | `toSignal()` + Signals | Angular 16+ | Cleaner templates, type-safe, composable with `computed()` |
| `HttpClient` manual subscribe | `httpResource` (experimental) | Angular 20 | Auto loading/error/value signals for GET requests |

**Deprecated/outdated:**
- **NgModules for new projects:** Angular 20 defaults to standalone. NgModules add ceremony without benefit.
- **`withInterceptorsFromDi()`:** Only needed when mixing class-based and functional interceptors. Pure functional projects don't need it.
- **`localStorage` for JWT:** Security anti-pattern. Use in-memory + sessionStorage or httpOnly cookies.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Angular 20.3.x is the correct version to use (not 21.x) | Standard Stack | Medium — Angular 21 exists but project locked to 20.x. `ng new` may install 21.x by default; need to pin version. |
| A2 | Backend API base URL will be `http://localhost:8080` for local dev | Code Examples | Low — configurable via environment files. README-BE-REPO.md confirms this URL. |
| A3 | Permission format for NAV-04 will be based on page route paths (e.g., `/users`, `/levels`) | NAV-04 research | Medium — backend permission matrix returns page data with `route_path` field. Permission service should map these to route guard checks. Exact format needs confirmation during execution. |
| A4 | The Postman collection's `jsonData.data.token` reference is a bug — actual response uses `access_token` | API Contract | Low — verified from LoginAction.php source code. Response uses `access_token`. |

## Open Questions

1. **Should the app auto-restore session on page refresh using the refresh token?**
   - What we know: Refresh token stored in sessionStorage (survives page refresh). Backend supports `POST /auth/refresh`.
   - What's unclear: Should the plan include an `APP_INITIALIZER` that checks for a stored refresh token and auto-refreshes on app load?
   - Recommendation: Yes — include session restoration in Phase 1. It's a small addition (check sessionStorage on init, call refresh if token exists) and significantly improves UX. Without it, every page refresh logs the user out.

2. **What should the default redirect be after successful login?**
   - What we know: Phase 2 will create an admin dashboard. Phase 4 will create dynamic sidebar.
   - What's unclear: Where should the user land after login in Phase 1 (before dashboard exists)?
   - Recommendation: Redirect to `/` which will be a placeholder or the first available feature route. The route config can be updated in Phase 2.

3. **Should the error interceptor show snackbar notifications for all errors?**
   - What we know: UI-03 (Phase 2) requires MatSnackBar for all API errors.
   - What's unclear: Should the error interceptor handle snackbar display in Phase 1, or defer to Phase 2?
   - Recommendation: The error interceptor should handle the 401 refresh flow silently. Non-401 errors should be re-thrown and handled by the calling component (or a global error handler in Phase 2). Keep Phase 1 focused on auth mechanics.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Angular CLI, build | ✓ | v22.22.2 | — |
| npm | Package management | ✓ | 10.9.7 | — |
| Angular CLI | Project scaffolding | ✗ | — | Install via `npm install -g @angular/cli@20` |
| Angular 20.x | Application framework | ✗ | — | Install via `ng new` |
| Angular Material 20.x | UI components | ✗ | — | Install via `ng add @angular/material` |
| Backend API (`test-imc-be`) | Auth endpoints, all API calls | ✗ (separate repo) | — | Must run backend separately (Docker or local). URL: `http://localhost:8080` |
| Docker | Backend + PostgreSQL | Unknown | — | Backend can run locally with PHP 8.1+ + PostgreSQL |

**Missing dependencies with no fallback:**
- Angular CLI — must be installed before scaffolding
- Backend API — must be running for auth to work (separate repo `test-imc-be`)

**Missing dependencies with fallback:**
- None identified

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Karma + Jasmine (Angular CLI default) |
| Config file | `karma.conf.js` (generated by `ng new`) |
| Quick run command | `ng test --include='**/auth/**/*.spec.ts' --watch=false` |
| Full suite command | `ng test --watch=false` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Login with username/email + password succeeds | Unit + Integration | `ng test --include='**/auth.service.spec.ts' --watch=false` | ❌ Wave 0 |
| AUTH-02 | Tokens stored in-memory + sessionStorage, not localStorage | Unit | `ng test --include='**/auth.service.spec.ts' --watch=false` | ❌ Wave 0 |
| AUTH-03 | 401 triggers token refresh, queued requests retry | Unit (mocked HTTP) | `ng test --include='**/error.interceptor.spec.ts' --watch=false` | ❌ Wave 0 |
| AUTH-04 | Logout clears all session data | Unit | `ng test --include='**/auth.service.spec.ts' --watch=false` | ❌ Wave 0 |
| AUTH-05 | Unauthenticated user redirected to /login | Unit (guard test) | `ng test --include='**/auth.guard.spec.ts' --watch=false` | ❌ Wave 0 |
| AUTH-06 | Login form validates required fields, shows server errors | Component | `ng test --include='**/login.component.spec.ts' --watch=false` | ❌ Wave 0 |
| NAV-04 | Permission service loads permissions from API on init | Unit | `ng test --include='**/permission.service.spec.ts' --watch=false` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `ng test --include='**/{affected-file}.spec.ts' --watch=false`
- **Per wave merge:** `ng test --watch=false`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/app/core/services/auth.service.spec.ts` — covers AUTH-01, AUTH-02, AUTH-04
- [ ] `src/app/core/interceptors/error.interceptor.spec.ts` — covers AUTH-03
- [ ] `src/app/core/guards/auth.guard.spec.ts` — covers AUTH-05
- [ ] `src/app/features/auth/login/login.component.spec.ts` — covers AUTH-06
- [ ] `src/app/core/services/permission.service.spec.ts` — covers NAV-04
- [ ] Framework install: `ng new` generates test config automatically — no manual setup needed

## Security Domain

> Security enforcement is enabled (default in config.json).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT via backend; frontend never handles passwords beyond sending to `/auth/login` |
| V3 Session Management | yes | In-memory signal + sessionStorage; no localStorage; token refresh with rotation |
| V4 Access Control | yes | Route guards (client-side UX); backend enforces permissions server-side |
| V5 Input Validation | yes | Angular Reactive Forms validators (`Validators.required`, `Validators.email`) |
| V6 Cryptography | no | Frontend does not perform cryptographic operations; backend handles JWT signing |

### Known Threat Patterns for Angular + JWT

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS token theft | Information Disclosure | Never store tokens in localStorage; use in-memory signals |
| Token replay on refresh | Spoofing | Backend rotates refresh tokens (single-use); frontend sends refresh token once |
| Client-side guard bypass | Tampering | Document that guards are UX only; backend enforces permissions on every API call |
| CSRF (if cookies used) | Spoofing | Not applicable — using Bearer token in Authorization header, not cookies |
| Man-in-the-middle token interception | Information Disclosure | Recommend HTTPS in production; not in scope for local demo |

## Sources

### Primary (HIGH confidence)
- Angular v20 Official Docs: https://v20.angular.dev — interceptors, guards, signals, forms, routing
- Angular v20 HTTP Interceptors: https://v20.angular.dev/guide/http/interceptors — functional interceptor patterns
- Angular v20 Route Guards: https://v20.angular.dev/guide/routing/route-guards — `CanActivateFn` patterns
- Angular v20 Signals: https://v20.angular.dev/guide/signals — `signal()`, `computed()`, `linkedSignal()`
- Angular v20 Resources: https://v20.angular.dev/guide/signals/resource — `httpResource` for GET requests
- Backend source code: `/home/raihan/Documents/kerja/test-imc-be/src/Application/Actions/Auth/LoginAction.php` — verified login response format
- Backend source code: `/home/raihan/Documents/kerja/test-imc-be/src/Application/Actions/Auth/RefreshTokenAction.php` — verified refresh flow with token rotation
- Backend source code: `/home/raihan/Documents/kerja/test-imc-be/src/Application/Actions/BaseAction.php` — verified error response format
- Backend source code: `/home/raihan/Documents/kerja/test-imc-be/src/Application/Handlers/JsonErrorRenderer.php` — verified error structure
- npm registry: `npm view @angular/core version` (21.2.15 latest), `npm view @angular/core versions` (20.3.23 latest 20.x)

### Secondary (MEDIUM confidence)
- README-BE-REPO.md — backend API documentation (confirmed against source code, minor discrepancy in Postman collection `data.token` vs actual `data.access_token`)
- Angular Components GitHub Releases: https://github.com/angular/components/releases — Material version tracking

### Tertiary (LOW confidence)
- None — all critical claims verified against official docs or source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified on npm registry, Angular 20.x confirmed available
- Architecture: HIGH — patterns verified against Angular v20 official docs and backend source code
- Pitfalls: HIGH — refresh race condition verified from backend RefreshTokenAction.php (token rotation), error format verified from BaseAction.php
- API contract: HIGH — verified directly from PHP source code, not just documentation

**Research date:** 2026-05-31
**Valid until:** 2026-07-31 (Angular 20.x is stable; 60-day validity for stable framework)
