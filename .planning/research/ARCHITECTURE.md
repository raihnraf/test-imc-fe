# Architecture Patterns

**Domain:** Angular admin dashboard with JWT auth and permission management
**Researched:** 2026-05-31

## Recommended Architecture

```
app/
├── app.config.ts              # Application providers (HttpClient, Router, Animations)
├── app.routes.ts              # Top-level route definitions with guards
├── app.component.ts           # Root component (router-outlet)
│
├── core/                      # Singleton services, interceptors, guards
│   ├── services/
│   │   ├── auth.service.ts    # JWT auth: login, logout, refresh, token state (signals)
│   │   └── api.service.ts     # Base API URL, error format types
│   ├── interceptors/
│   │   ├── auth.interceptor.ts       # Attach Bearer token to requests
│   │   ├── error.interceptor.ts      # Handle 401 → refresh, map error format
│   │   └── refresh.interceptor.ts    # Token refresh logic (queued requests)
│   └── guards/
│       ├── auth.guard.ts      # CanActivateFn — check isAuthenticated
│       └── permission.guard.ts # CanActivateChildFn — check route permission
│
├── shared/                    # Reusable components, pipes, directives
│   ├── components/
│   │   ├── confirm-dialog/    # Reusable yes/no confirmation dialog
│   │   └── loading-spinner/   # Global loading indicator
│   └── models/
│       ├── user.model.ts
│       ├── level.model.ts
│       ├── page.model.ts
│       └── permission.model.ts
│
├── features/                  # Feature modules (standalone components)
│   ├── auth/
│   │   ├── login/
│   │   │   ├── login.component.ts
│   │   │   └── login.component.html
│   │   └── auth.routes.ts
│   ├── dashboard/
│   │   ├── dashboard.component.ts
│   │   └── dashboard.routes.ts
│   ├── users/
│   │   ├── user-list/
│   │   ├── user-form/
│   │   └── users.routes.ts
│   ├── levels/
│   │   ├── level-list/
│   │   ├── level-form/
│   │   └── levels.routes.ts
│   ├── pages/
│   │   ├── page-list/
│   │   ├── page-form/
│   │   └── pages.routes.ts
│   └── permissions/
│       ├── permission-matrix/
│       └── permissions.routes.ts
│
└── layout/                    # Shell layout components
    ├── admin-layout/
    │   ├── admin-layout.component.ts    # Sidenav + toolbar + router-outlet
    │   └── admin-layout.component.html
    └── sidebar/
        ├── sidebar.component.ts         # Dynamic menu based on permissions
        └── sidebar.component.html
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `AuthService` | Login/logout, token storage, refresh flow, user profile, permission set | HTTP interceptors, auth guard, permission guard, sidebar |
| `AuthInterceptor` | Attach `Authorization: Bearer <token>` to all API requests | AuthService (reads token) |
| `ErrorInterceptor` | Catch 401 → trigger refresh, retry; map backend error format to snackbar messages | AuthService (triggers refresh), MatSnackBar |
| `AuthGuard` | Redirect to `/login` if not authenticated | AuthService (checks `isAuthenticated` signal) |
| `PermissionGuard` | Block route access if user lacks required permission | AuthService (checks permission set), route `data.permission` |
| `AdminLayoutComponent` | Sidenav + toolbar + content area with router-outlet | SidebarComponent, AuthService (for user display) |
| `SidebarComponent` | Dynamic menu items filtered by user permissions | AuthService (reads permissions), Router (for active state) |
| `UserListComponent` | Paginated, sortable user table with actions | UserService (HTTP calls), MatDialog (delete confirm) |
| `UserFormComponent` | Create/edit user form with validation | UserService (HTTP calls), MatSnackBar (success/error) |
| `PermissionMatrixComponent` | Grid of levels × pages with checkboxes, user overrides | LevelService, PageService, PermissionService |

### Data Flow

```
1. User enters credentials → LoginComponent → AuthService.login()
2. AuthService calls POST /auth/login → receives {accessToken, refreshToken, user}
3. AuthService stores tokens (in-memory + sessionStorage), sets user signal
4. All subsequent HTTP requests → AuthInterceptor attaches Bearer token
5. If 401 received → ErrorInterceptor → AuthService.refreshToken() → retry original request
6. If refresh fails → clear tokens → redirect to /login
7. Route navigation → AuthGuard checks isAuthenticated → PermissionGuard checks permission
8. Sidebar renders menu items filtered by user's permission set
9. CRUD operations → Feature service calls HttpClient → updates local signal state → table refreshes
```

## Patterns to Follow

### Pattern 1: Signal-Based Service State
**What:** Services expose state as signals, components read signals in templates
**When:** All service-level state (auth, user profile, permission set)
**Example:**
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  private readonly _permissions = signal<string[]>([]);

  readonly user = this._user.asReadonly();
  readonly permissions = this._permissions.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  hasPermission(permission: string): boolean {
    return this._permissions().includes(permission);
  }
}
```

### Pattern 2: Functional HTTP Interceptor Chain
**What:** Chain of functional interceptors for auth, error handling, logging
**When:** All HTTP communication with the backend
**Example:**
```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor]),
    ),
  ],
};
```

### Pattern 3: Functional Route Guards
**What:** `CanActivateFn` and `CanActivateChildFn` functions using `inject()`
**When:** Route protection for auth and permissions
**Example:**
```typescript
export const permissionGuard: CanActivateChildFn = (route, state) => {
  const authService = inject(AuthService);
  const requiredPermission = route.data['permission'];
  if (requiredPermission && !authService.hasPermission(requiredPermission)) {
    return false; // or: return new UrlTree('/unauthorized')
  }
  return true;
};
```

### Pattern 4: Smart/Dumb Component Split
**What:** Container components handle data fetching and state; presentational components receive inputs and emit outputs
**When:** CRUD list pages (list component fetches data, table component renders it)
**Example:**
```typescript
// Smart: UserListComponent fetches data
@Component({ template: `<user-table [users]="users()" (delete)="onDelete($event)" />` })
export class UserListComponent {
  users = signal<User[]>([]);
  constructor(private userService: UserService) {}
  ngOnInit() { this.users.set(await this.userService.list()); }
}

// Dumb: UserTableComponent renders data
@Component({ selector: 'user-table', inputs: ['users'], outputs: ['delete'] })
export class UserTableComponent {
  users: User[] = [];
  delete = new EventEmitter<string>();
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing JWT in localStorage
**What:** Using `localStorage.setItem('token', token)` for JWT storage
**Why bad:** XSS vulnerability — any injected script can read localStorage and steal tokens
**Instead:** In-memory storage (signal) with `sessionStorage` as fallback. For production, use httpOnly cookies for refresh tokens.

### Anti-Pattern 2: Class-based Interceptors in New Projects
**What:** Implementing `HttpInterceptor` interface with `@Injectable()` class
**Why bad:** Unpredictable ordering in complex DI hierarchies, requires `withInterceptorsFromDi()` boilerplate
**Instead:** Functional interceptors with explicit ordering in `withInterceptors([...])`

### Anti-Pattern 3: NgModules for New Angular 20 Projects
**What:** Creating `@NgModule` classes to group components
**Why bad:** Adds boilerplate without benefit. Angular 20 standalone components are the default and recommended pattern.
**Instead:** Standalone components with `imports: [CommonModule, MaterialModules]`

### Anti-Pattern 4: Subscribing in Components Without Cleanup
**What:** `this.http.get().subscribe(data => this.data = data)` in ngOnInit without unsubscribe
**Why bad:** Memory leaks, stale data on component re-creation
**Instead:** Use `toSignal()` for auto-unsubscribe, or `takeUntilDestroyed()` operator

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| List pagination | Client-side OK for <50 items | Server-side pagination required | Server-side pagination + caching |
| Permission checks | In-memory signal lookup | Same — O(1) array includes check | Consider permission service with caching |
| Token refresh | Simple interceptor retry | Same — refresh is per-request | Consider token rotation, concurrent refresh dedup |
| Bundle size | Full Material ~200KB gzipped | Tree-shake unused Material modules | Lazy-load feature routes, defer heavy components |

## Sources

- Angular v20 Official Docs: https://v20.angular.dev (HIGH confidence)
- Angular v20 HTTP Interceptors: https://v20.angular.dev/guide/http/interceptors (HIGH confidence)
- Angular v20 Route Guards: https://v20.angular.dev/guide/routing/route-guards (HIGH confidence)
- Angular v20 Signals: https://v20.angular.dev/guide/signals (HIGH confidence)
- Angular Material: https://material.angular.dev (HIGH confidence)
