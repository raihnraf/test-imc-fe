# Phase 4: Permissions + Dynamic Menu - Research

**Researched:** 2026-05-31
**Domain:** Angular 20 / Angular Material / Permission Management
**Confidence:** HIGH

## Summary

This phase delivers the permission management layer: a checkbox-grid permission matrix for levels (PERM-01), user-level permission overrides (PERM-02/PERM-03), dynamic sidebar filtering by user permissions (NAV-01), route guards blocking unauthorized navigation (NAV-02), and a 403 Forbidden page (NAV-03).

The backend API contract has been fully verified from the Slim PHP codebase. Three permission endpoints exist:
1. `GET /api/permissions/matrix?level_id=N` or `?user_id=N` — returns effective permission matrix
2. `GET/POST/DELETE /api/levels/{levelId}/permissions` — level permission CRUD (assign/remove individual page permissions)
3. `GET/POST/DELETE /api/users/{userId}/permissions` — user permission override CRUD (grant/deny/remove individual overrides)

A `PermissionService` already exists in the codebase (`src/app/core/services/permission.service.ts`) with a basic `loadPermissions(userId)` method that calls `/api/permissions/matrix?user_id=${userId}`. It needs extension for the admin features (level matrix loading, individual permission mutations).

The existing `PermissionMiddleware` on the backend checks every `/api/*` request against the user's effective permissions and returns 403 `FORBIDDEN` if access is denied. This means the frontend must also handle 403 responses from API calls (not just route guards).

**Primary recommendation:** Extend the existing PermissionService with level matrix loading and mutation methods. Build two admin UI components (LevelPermissionMatrixComponent, UserPermissionOverrideComponent) using MatTable with MatCheckbox for the grid. Add a `permissionGuard` (CanActivateFn) that reads from PermissionService. Create a 403 Forbidden page component. Update the admin layout sidenav to filter menu items using PermissionService.permissions() signal.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Permission data fetching | API / Backend | Frontend Server (SSR) | Backend computes effective permissions (level + user overrides) via SQL joins |
| Permission matrix UI | Browser / Client | — | Admin-only CRUD interface, client-side checkbox grid |
| User permission overrides | Browser / Client | — | Admin-only CRUD interface, client-side form |
| Sidebar menu filtering | Browser / Client | — | Client-side signal filtering based on loaded permissions |
| Route guard (403) | Browser / Client | — | Client-side check before navigation; backend enforces independently |
| 403 Forbidden page | Browser / Client | — | Client-side error display page |
| Permission caching/state | Browser / Client | — | In-memory signal in PermissionService, refreshed on permission changes |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@angular/material/checkbox` | 20.2.14 | Checkbox inputs for permission grid | Official Angular Material component, already available via `@angular/material` |
| `@angular/material/table` | 20.2.14 | Permission matrix table | Already used in user/level/page list components; MatTable with checkbox column is the standard pattern |
| `@angular/material/tabs` | 20.2.14 | Tabbed interface for user permission overrides | Official Material tabs — clean way to show "All Pages" vs "Overrides" views |
| `@angular/cdk/collections` | 20.2.14 | SelectionModel for checkbox state management | Ships with Angular CDK; standard for table selection patterns |
| `@angular/router` (built-in) | 20.3.0 | Route guards (CanActivateFn), 403 route | Functional guards are the v20 standard — `inject()` for service access |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `MatSnackBar` (built-in) | 20.2.14 | Success/error notifications | Already used via ErrorHandlerService for all API errors |
| `MatDialog` (built-in) | 20.2.14 | Confirmation for permission removal | Already used via ConfirmDialogService |
| `MatPaginatorModule` (built-in) | 20.2.14 | Pagination for user permission override list | Only if override list is paginated; likely not needed for small page counts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| MatTable + MatCheckbox grid | Custom div grid with ngFor | MatTable provides built-in sorting, accessibility, and consistent styling with existing list components |
| MatTabs for user overrides | Two separate routes | Tabs keep context (user info visible) while switching views; cleaner UX |
| Signal-based permission state | BehaviorSubject/RxJS | Signals are the Angular 20 standard; simpler templates with `permissionService.permissions()` |

**Installation:** No new packages needed. All required modules (`MatCheckboxModule`, `MatTabsModule`, `CdkTable`, `SelectionModel`) ship with existing `@angular/material@20.2.14` and `@angular/cdk@20.2.14`.

**Version verification:**
- `@angular/material` 20.2.14 — confirmed in package.json [VERIFIED: package.json]
- `@angular/cdk` 20.2.14 — confirmed in package.json [VERIFIED: package.json]
- `@angular/core` 20.3.0 — confirmed in package.json [VERIFIED: package.json]

## Package Legitimacy Audit

No new packages to install. All dependencies are Angular core/Material already present in the project.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| @angular/material | npm | 10+ yrs | 2M+/wk | github.com/angular/components | N/A | Already installed |
| @angular/cdk | npm | 10+ yrs | 2M+/wk | github.com/angular/components | N/A | Already installed |

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Angular 20)                      │
│                                                                  │
│  ┌──────────────┐    ┌───────────────────┐    ┌───────────────┐ │
│  │ Admin Layout  │◄───│ PermissionService │    │ 403 Page      │ │
│  │ (sidenav)     │    │ - permissions()   │───►│ (forbidden)   │ │
│  │ filter by     │    │ - loadForUser()   │    └───────────────┘ │
│  │ permissions   │    │ - loadForLevel()  │                      │
│  └──────┬───────┘    │ - grant/deny()    │    ┌───────────────┐ │
│         │            │ - removeOverride()│    │ permissionGuard│ │
│         ▼            └────────┬──────────┘    │ (CanActivateFn)│ │
│  ┌──────────────┐            │                └───────┬───────┘ │
│  │ Level Perm    │            │                        │         │
│  │ Matrix UI     │            │                        │         │
│  │ (checkbox grid)            │                        │         │
│  └──────┬───────┘            │                        │         │
│         │                    │                        │         │
│  ┌──────────────┐            │                        │         │
│  │ User Perm     │            │                        │         │
│  │ Override UI   │            │                        │         │
│  └──────┬───────┘            │                        │         │
│         │                    │                        │         │
└─────────┼────────────────────┼────────────────────────┼─────────┘
          │                    │                        │
          ▼                    ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend API (Slim PHP)                       │
│                                                                  │
│  GET  /api/permissions/matrix?level_id=N  → level matrix        │
│  GET  /api/permissions/matrix?user_id=N   → user effective mtx  │
│  GET  /api/levels/{id}/permissions        → level matrix (alt)  │
│  POST /api/levels/{id}/permissions        → assign page to lvl  │
│  DEL  /api/levels/{id}/permissions        → remove page from lvl│
│  GET  /api/users/{id}/permissions         → user overrides      │
│  POST /api/users/{id}/permissions         → grant/deny page     │
│  DEL  /api/users/{id}/permissions         → remove override     │
│                                                                  │
│  PermissionMiddleware: checks every /api/* request, returns 403  │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/app/
├── core/
│   ├── guards/
│   │   └── permission.guard.ts          # NEW: CanActivateFn for NAV-02
│   └── services/
│       └── permission.service.ts        # EXTEND: add level matrix, mutations
├── features/
│   ├── permissions/
│   │   ├── level-permission-matrix/     # NEW: PERM-01
│   │   │   ├── level-permission-matrix.component.ts
│   │   │   ├── level-permission-matrix.component.html
│   │   │   ├── level-permission-matrix.component.scss
│   │   │   └── level-permission-matrix.component.spec.ts
│   │   └── user-permission-override/    # NEW: PERM-02, PERM-03
│   │       ├── user-permission-override.component.ts
│   │       ├── user-permission-override.component.html
│   │       ├── user-permission-override.component.scss
│   │       └── user-permission-override.component.spec.ts
├── layout/
│   ├── admin-layout/
│   │   └── admin-layout.component.ts    # MODIFY: filter sidenav by permissions
│   └── admin.routes.ts                  # MODIFY: add permission routes, 403 route
├── shared/
│   ├── models/
│   │   └── permission.model.ts          # NEW: Permission interfaces
│   └── pages/
│       └── forbidden/                   # NEW: NAV-03
│           ├── forbidden.component.ts
│           ├── forbidden.component.html
│           ├── forbidden.component.scss
│           └── forbidden.component.spec.ts
```

### Pattern 1: Permission Matrix (Checkbox Grid)
**What:** A MatTable where each row is a page and the column is a MatCheckbox indicating whether the level has access. Toggling a checkbox immediately calls the backend POST or DELETE endpoint.

**When to use:** PERM-01 — admin editing level permissions.

**Example:**
```typescript
// Component pattern — checkbox per row, immediate save
import { Component, signal, inject, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { PermissionService } from '../../../core/services/permission.service';
import { PageService } from '../../../shared/services/page.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import type { PermissionEntry } from '../../../shared/models/permission.model';
import type { Page } from '../../../shared/models/page.model';

@Component({
  selector: 'app-level-permission-matrix',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCheckboxModule, MatChipsModule],
  templateUrl: './level-permission-matrix.component.html',
})
export class LevelPermissionMatrixComponent implements OnInit {
  private readonly permissionService = inject(PermissionService);
  private readonly pageService = inject(PageService);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly levelId = signal<number | null>(null);
  readonly matrix = signal<PermissionEntry[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal<Record<number, boolean>>({});

  displayedColumns = ['name', 'route_path', 'has_access'];

  ngOnInit(): void {
    // Read levelId from route params
    this.loadMatrix();
  }

  loadMatrix(): void {
    if (!this.levelId()) return;
    this.isLoading.set(true);
    this.permissionService.loadLevelMatrix(this.levelId()!).subscribe({
      next: (entries) => { this.matrix.set(entries); this.isLoading.set(false); },
      error: (err) => { this.errorHandler.handle(err); this.isLoading.set(false); },
    });
  }

  onToggle(entry: PermissionEntry, checked: boolean): void {
    if (!this.levelId()) return;
    this.isSaving.update((s) => ({ ...s, [entry.id]: true }));

    const request$ = checked
      ? this.permissionService.grantLevelPermission(this.levelId()!, entry.id)
      : this.permissionService.revokeLevelPermission(this.levelId()!, entry.id);

    request$.subscribe({
      next: () => {
        this.matrix.update((m) =>
          m.map((e) => (e.id === entry.id ? { ...e, has_access: checked } : e)),
        );
        this.isSaving.update((s) => ({ ...s, [entry.id]: false }));
      },
      error: (err) => {
        this.errorHandler.handle(err);
        this.isSaving.update((s) => ({ ...s, [entry.id]: false }));
        // Revert on error
        this.matrix.update((m) =>
          m.map((e) => (e.id === entry.id ? { ...e, has_access: !checked } : e)),
        );
      },
    });
  }
}
```

```html
<!-- Template pattern -->
<table mat-table [dataSource]="matrix()" class="permission-table">
  <ng-container matColumnDef="name">
    <th mat-header-cell *matHeaderCellDef>Page Name</th>
    <td mat-cell *matCellDef="let entry">{{ entry.name }}</td>
  </ng-container>

  <ng-container matColumnDef="route_path">
    <th mat-header-cell *matHeaderCellDef>Route</th>
    <td mat-cell *matCellDef="let entry">
      <mat-chip highlighted>{{ entry.route_path }}</mat-chip>
    </td>
  </ng-container>

  <ng-container matColumnDef="has_access">
    <th mat-header-cell *matHeaderCellDef>Access</th>
    <td mat-cell *matCellDef="let entry">
      <mat-checkbox
        [checked]="entry.has_access"
        [disabled]="isSaving()[entry.id]"
        (change)="onToggle(entry, $event.checked)">
      </mat-checkbox>
    </td>
  </ng-container>

  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
  <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
</table>
```

### Pattern 2: Permission Guard (CanActivateFn)
**What:** A functional route guard that checks if the current route's path is in the user's allowed permissions.

**When to use:** NAV-02 — blocking navigation to unauthorized routes.

**Example:**
```typescript
// permission.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  const permissions = permissionService.permissions();

  // Check route data for required permission (e.g., data: { permission: '/users' })
  const requiredPermission = route.data['permission'];
  if (!requiredPermission) return true; // No permission requirement

  if (permissions[requiredPermission] === true) return true;

  return router.parseUrl('/forbidden');
};
```

### Pattern 3: Dynamic Sidenav Filtering
**What:** The admin layout sidenav uses `@for` with an `@if` filter based on `permissionService.permissions()` to show only accessible pages.

**When to use:** NAV-01 — sidebar reflects user permissions.

**Example:**
```html
<!-- admin-layout.component.html modification -->
<mat-nav-list>
  @for (item of navItems; track item.route) {
    @if (permissionService.permissions()[item.permission] === true) {
      <a mat-list-item [routerLink]="item.route" routerLinkActive="active-link">
        <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
        <span matListItemTitle>{{ item.label }}</span>
      </a>
    }
  }
</mat-nav-list>
```

### Anti-Patterns to Avoid
- **Bulk save pattern:** Don't collect all checkbox changes and save on a "Save" button. The backend API is designed for individual POST/DELETE per page. The existing `PermissionMatrixAction` returns the full matrix on GET, but mutations are per-page. Immediate save per toggle is simpler and matches the API design.
- **JWT-based permissions:** Don't cache permissions in JWT claims. PERM-04 explicitly requires DB-checked permissions. The `PermissionService.loadPermissions()` call on app init (NAV-04, already in Phase 1) fetches from the API, not from token claims.
- **Client-side-only guards:** Don't rely solely on `permissionGuard` for security. The backend `PermissionMiddleware` returns 403 for unauthorized API calls. The frontend guard is UX-only; the backend is the source of truth.
- **Hardcoded route paths in guard:** Don't hardcode route-to-permission mappings in the guard. Use route `data: { permission: '/users' }` so the mapping lives with the route definition.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Checkbox state management | Custom signal array tracking | `SelectionModel` from `@angular/cdk/collections` or direct signal per entry | SelectionModel handles multi-select, toggle, changed events out of the box |
| Permission matrix table | Custom div grid with ngFor | MatTable + MatCheckbox | MatTable provides accessibility, consistent styling with existing list components, and built-in column definitions |
| Route guard logic | Custom navigation event listener | `CanActivateFn` functional guard | Angular Router's built-in guard system handles navigation cancellation, redirects, and lazy-loading boundaries correctly |
| 403 page | Inline error in every component | Dedicated ForbiddenComponent at `/forbidden` route | Single source of truth for unauthorized state; guard can redirect consistently |
| Permission state management | localStorage/sessionStorage caching | In-memory signal in PermissionService | PERM-04 requires DB-checked permissions; stale cached permissions would show wrong access after admin changes |

**Key insight:** The backend permission system is already designed with individual mutation endpoints (POST/DELETE per page). Trying to batch changes or implement optimistic UI without proper rollback logic will create inconsistency between the UI and the actual permission state.

## Common Pitfalls

### Pitfall 1: Permission Staleness After Admin Changes
**What goes wrong:** Admin changes permissions for User A, but User A's sidebar still shows old permissions because the PermissionService signal wasn't refreshed.
**Why it happens:** PermissionService loads permissions once on app init (Phase 1). Subsequent permission changes by admin don't trigger a reload.
**How to avoid:** After any permission mutation (grant/revoke/remove), call `permissionService.loadPermissions(currentUserId)` to refresh the signal. For the logged-in admin viewing their own permissions, this is automatic. For admin changing another user's permissions, the other user will see changes on their next page navigation (when guard checks) or app reload.
**Warning signs:** User reports "I was granted access but still can't see the menu item."

### Pitfall 2: Route Path Mismatch Between Backend and Frontend
**What goes wrong:** Backend permission checks against `/users` but frontend route is `/admin/users`. Guard checks the wrong path.
**Why it happens:** Backend `PermissionMiddleware` strips `/api` prefix and uses the first path segment (e.g., `/users`, `/levels`, `/pages`). Frontend routes are nested under `/admin/`.
**How to avoid:** Store the backend permission key (e.g., `/users`) separately from the frontend route path (e.g., `/admin/users`). Use route `data: { permission: '/users' }` to map frontend routes to backend permission keys. The matrix entries use `route_path` from the `pages` table which matches the backend check.
**Warning signs:** Guard always returns false even though permission matrix shows `has_access: true`.

### Pitfall 3: 403 from API Calls Not Handled
**What goes wrong:** User with no permission to `/api/users` tries to load user list, gets 403 from backend, but the error shows as a generic snackbar instead of redirecting to 403 page.
**Why it happens:** The error interceptor only handles 401 (token refresh). 403 responses pass through to component-level error handlers.
**How to avoid:** In component error handlers, check for `err.status === 403` and redirect to `/forbidden`. Alternatively, extend the error interceptor to catch 403 and redirect globally. The simpler approach: component-level check in list components.
**Warning signs:** User sees "You do not have permission to access this resource" in snackbar but stays on the broken page.

### Pitfall 4: Race Condition on Permission Load
**What goes wrong:** Route guard runs before `PermissionService.loadPermissions()` completes, so permissions are empty and guard blocks all routes.
**Why it happens:** APP_INITIALIZER in Phase 1 calls `auth.restoreSession()` but does NOT call `permissionService.loadPermissions()`. The guard runs synchronously on first navigation.
**How to avoid:** Add `permissionService.loadPermissions(userId)` to the APP_INITIALIZER chain (after auth restore), OR make the guard wait for permissions to load. The cleanest approach: extend APP_INITIALIZER to load permissions after auth restore, using `authService.user()` to get the user ID. Note: the current `PermissionService.loadPermissions()` takes a `userId` parameter — the user ID must come from `AuthService.user()`.
**Warning signs:** After login, user is redirected to /forbidden even though they should have access.

### Pitfall 5: Level Permission Matrix Shows Wrong Data
**What goes wrong:** Admin opens level permission matrix, sees all pages unchecked even though some are assigned.
**Why it happens:** The backend `PermissionMatrixAction` returns `has_access` as a boolean based on the SQL join. The frontend must map this correctly. The current `PermissionService.loadPermissions()` expects `{ route_path, has_access }[]` — verify the response shape matches.
**How to avoid:** The backend returns `{ data: [{ id, name, route_path, has_access }] }`. The PermissionService must map `response.data` correctly. The existing service already does this for user permissions — extend the same pattern for level permissions.

## Code Examples

### Permission Model Interfaces
```typescript
// src/app/shared/models/permission.model.ts
export interface PermissionEntry {
  id: number;
  name: string;
  route_path: string;
  has_access: boolean;
}

export interface UserPermissionOverride {
  id: number;
  page_id: number;
  page_name: string;
  route_path: string;
  is_granted: boolean;
}

export interface LevelPermissionRequest {
  page_id: number;
}

export interface UserPermissionRequest {
  page_id: number;
  is_granted: boolean;
}

export interface NavItem {
  route: string;
  label: string;
  icon: string;
  permission: string; // backend route_path key, e.g., '/users'
}
```

### Extended PermissionService Methods
```typescript
// Methods to add to existing PermissionService
loadLevelMatrix(levelId: number): Observable<PermissionEntry[]> {
  return this.http
    .get<{ data: PermissionEntry[] }>(
      `/api/permissions/matrix?level_id=${levelId}`,
    )
    .pipe(map((res) => res.data));
}

grantLevelPermission(levelId: number, pageId: number): Observable<{ message: string }> {
  return this.http.post<{ message: string }>(
    `/api/levels/${levelId}/permissions`,
    { page_id: pageId },
  );
}

revokeLevelPermission(levelId: number, pageId: number): Observable<{ message: string }> {
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
    .pipe(map((res) => res.data));
}

grantUserPermission(userId: number, pageId: number, isGranted: boolean): Observable<{ message: string }> {
  return this.http.post<{ message: string }>(
    `/api/users/${userId}/permissions`,
    { page_id: pageId, is_granted: isGranted },
  );
}

removeUserOverride(userId: number, pageId: number): Observable<{ message: string }> {
  return this.http.delete<{ message: string }>(
    `/api/users/${userId}/permissions`,
    { body: { page_id: pageId } },
  );
}

refreshPermissions(): void {
  const user = this.authService.user();
  if (user?.id) {
    this.loadPermissions(user.id).subscribe();
  }
}
```

### Forbidden Component
```typescript
// src/app/shared/pages/forbidden/forbidden.component.ts
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCardModule, RouterLink],
  templateUrl: './forbidden.component.html',
  styleUrls: ['./forbidden.component.scss'],
})
export class ForbiddenComponent {
  private readonly router = inject(Router);

  goBack(): void {
    this.router.navigate(['/admin']);
  }
}
```

```html
<!-- forbidden.component.html -->
<div class="forbidden-container">
  <mat-card class="forbidden-card">
    <mat-card-content>
      <mat-icon class="forbidden-icon" color="warn">block</mat-icon>
      <h1>403 — Forbidden</h1>
      <p>You do not have permission to access this page.</p>
      <button mat-raised-button color="primary" routerLink="/admin">
        <mat-icon>home</mat-icon>
        Back to Dashboard
      </button>
    </mat-card-content>
  </mat-card>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class-based route guards (`implements CanActivate`) | Functional guards (`CanActivateFn`) | Angular v14+ | Simpler, uses `inject()`, no class boilerplate |
| NgModules for feature modules | Standalone components with `loadComponent` | Angular v15+ | No module files, direct component lazy loading |
| BehaviorSubject for permission state | Signals (`signal()`, `computed()`) | Angular v16+ | Finer-grained reactivity, simpler templates |
| localStorage for permissions | In-memory signal + API refresh | PERM-04 requirement | Permissions always fresh from DB, not stale cache |
| Permission in JWT claims | DB-checked on every request | Backend design | Admin changes take effect immediately without token refresh |

**Deprecated/outdated:**
- **NgModules:** Angular 20 defaults to standalone components. Don't create modules for permission features.
- **Class-based guards:** Angular v20 documentation shows functional guards as the primary pattern.
- **localStorage for permissions:** XSS vulnerability and stale data. Use in-memory signals.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Backend `PermissionMatrixAction` returns `{ data: [{ id, name, route_path, has_access }] }` for both level_id and user_id queries | Code Examples | If response shape differs, all matrix components will break. Verified from backend source code. |
| A2 | Backend `PermissionMiddleware` checks permissions based on first path segment after `/api` (e.g., `/users`, `/levels`, `/pages`) | Pitfall 2 | If middleware uses different matching logic, guards will check wrong permissions. Verified from middleware source. |
| A3 | The `pages` table `route_path` field contains values like `/users`, `/levels`, `/pages` (not `/admin/users`) | Pitfall 2 | If route_path includes `/admin/` prefix, the permission key mapping in route data will be wrong. Verified from backend PermissionRepository.getLevelMatrix() which returns `route_path` directly from pages table. |
| A4 | Admin user has permission to all pages (or at least to the permission management pages) | General | If admin cannot access permission pages, the feature is unusable. This should be verified with test data. |
| A5 | `PermissionService.loadPermissions()` is NOT currently called in APP_INITIALIZER (only `auth.restoreSession()` is) | Pitfall 4 | If it IS already called, the guard race condition pitfall doesn't apply. Verified from app.config.ts — only `auth.restoreSession()` is in APP_INITIALIZER. |

## Open Questions

1. **Should permission changes trigger a sidebar refresh for the affected user?**
   - What we know: PermissionService.permissions() is a signal. If the admin changes another user's permissions, that user won't see the change until their next navigation or app reload.
   - What's unclear: Whether the technical test expects real-time sidebar updates for the affected user.
   - Recommendation: For the logged-in admin viewing their own matrix, call `refreshPermissions()` after changes. For other users, the change takes effect on their next page navigation (when the guard checks). This is sufficient for a technical test demo.

2. **Should the level permission matrix be accessed from the level list (action button) or as a separate route?**
   - What we know: The backend endpoint is `GET /api/levels/{levelId}/permissions` or `GET /api/permissions/matrix?level_id={levelId}`.
   - What's unclear: The preferred UX pattern.
   - Recommendation: Add an action button "Permissions" in LevelListComponent that navigates to `/admin/levels/:id/permissions`. This keeps context (which level is being edited) and follows the existing edit pattern (`/admin/levels/:id/edit`).

3. **Should the user permission override UI show all pages or only overridden pages?**
   - What we know: `GET /api/users/{userId}/permissions` returns the effective matrix (level + overrides combined). `GET /api/permissions/matrix?user_id=N` returns the same.
   - What's unclear: Whether the admin wants to see the full effective matrix or just the overrides.
   - Recommendation: Use MatTabs — Tab 1 shows "Effective Permissions" (all pages with their effective access, read-only), Tab 2 shows "Overrides" (only pages where user has an override, with remove buttons). This gives both views without confusion.

4. **What happens when the backend returns 403 for an API call (not a route navigation)?**
   - What we know: PermissionMiddleware returns 403 for unauthorized API access.
   - What's unclear: Whether the frontend should redirect to /forbidden or just show an error.
   - Recommendation: For list/detail API calls that return 403, redirect to `/forbidden`. For mutation calls (POST/DELETE) that return 403, show a snackbar error (the user tried an action they're not allowed to do).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Angular CLI | Build/serve | ✓ | 20.3.26 | — |
| Node.js | Runtime | ✓ | See package.json engines | — |
| @angular/material | UI components | ✓ | 20.2.14 | — |
| @angular/cdk | SelectionModel, table | ✓ | 20.2.14 | — |
| Backend API (test-imc-be) | Permission endpoints | ✗ (separate repo) | Slim PHP | Mock data for development, verify with running backend |
| Chrome/Chromium | Karma tests | Needs verification | — | Headless Chrome via Karma config |

**Missing dependencies with fallback:**
- Backend API must be running for end-to-end verification. Can develop with mock data, but final verification requires the backend.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jasmine + Karma (via Angular CLI) |
| Config file | karma.conf.js (default Angular setup) |
| Quick run command | `ng test --include='**/permissions/**/*.spec.ts' --watch=false` |
| Full suite command | `ng test --watch=false` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERM-01 | Admin can view and edit permission matrix for a level | unit | `ng test --include='**/level-permission-matrix/**/*.spec.ts' --watch=false` | ❌ Wave 0 |
| PERM-02 | Admin can grant or deny specific pages for a user | unit | `ng test --include='**/user-permission-override/**/*.spec.ts' --watch=false` | ❌ Wave 0 |
| PERM-03 | Admin can remove a user permission override | unit | `ng test --include='**/user-permission-override/**/*.spec.ts' --watch=false` | ❌ Wave 0 |
| PERM-04 | Permission changes take effect immediately | integration | Manual — verify sidebar updates after permission change | — |
| NAV-01 | Sidebar menu shows only accessible pages | unit | `ng test --include='**/admin-layout/**/*.spec.ts' --watch=false` | ❌ Wave 0 |
| NAV-02 | Route guards block unauthorized navigation | unit | `ng test --include='**/permission.guard.spec.ts' --watch=false` | ❌ Wave 0 |
| NAV-03 | Unauthorized navigation shows 403 page | unit | `ng test --include='**/forbidden/**/*.spec.ts' --watch=false` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `ng test --include='**/{feature}/**/*.spec.ts' --watch=false`
- **Per wave merge:** `ng test --watch=false`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/app/shared/models/permission.model.ts` — PermissionEntry, UserPermissionOverride, NavItem interfaces
- [ ] `src/app/core/services/permission.service.spec.ts` — extend with loadLevelMatrix, grantLevelPermission, revokeLevelPermission, loadUserOverrides, grantUserPermission, removeUserOverride tests
- [ ] `src/app/core/guards/permission.guard.spec.ts` — test guard allows/denies based on permissions
- [ ] `src/app/shared/pages/forbidden/forbidden.component.spec.ts` — test component renders and goBack navigates
- [ ] `src/app/features/permissions/level-permission-matrix/level-permission-matrix.component.spec.ts` — test matrix loads, toggle calls correct API
- [ ] `src/app/features/permissions/user-permission-override/user-permission-override.component.spec.ts` — test tabs render, grant/remove calls correct API
- [ ] `src/app/layout/admin-layout/admin-layout.component.spec.ts` — test sidenav filters items by permissions

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT via AuthService (Phase 1) |
| V3 Session Management | yes | Token refresh queue (Phase 1) |
| V4 Access Control | yes | PermissionMiddleware (backend) + permissionGuard (frontend) |
| V5 Input Validation | yes | Backend validates page_id, is_granted, level_id on all permission endpoints |
| V6 Cryptography | yes | JWT signing (backend) — never hand-roll |

### Known Threat Patterns for Angular + Slim PHP Permission System

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Client-side permission bypass | Spoofing | Backend PermissionMiddleware enforces on every API call; frontend guard is UX only |
| Permission enumeration | Information Disclosure | Backend returns only pages the user has access to (via SQL WHERE is_active = true); no endpoint lists all pages for unauthorized users |
| CSRF on permission mutations | Tampering | JWT in Authorization header (not cookie) — CSRF not applicable for Bearer token auth |
| Stale permission cache | Integrity | In-memory signal, refreshed on mutation via `refreshPermissions()`; no localStorage caching |
| Privilege escalation via route manipulation | Spoofing | permissionGuard checks route data against PermissionService; backend PermissionMiddleware double-checks |

## Sources

### Primary (HIGH confidence)
- Backend routes: `/home/raihan/Documents/kerja/test-imc-be/routes/routes.php` — verified all permission endpoints [VERIFIED: codebase]
- Backend PermissionMatrixAction: `/home/raihan/Documents/kerja/test-imc-be/src/Application/Actions/Permission/PermissionMatrixAction.php` — verified response shape [VERIFIED: codebase]
- Backend LevelPermissionAction: `/home/raihan/Documents/kerja/test-imc-be/src/Application/Actions/Permission/LevelPermissionAction.php` — verified request/response format [VERIFIED: codebase]
- Backend UserPermissionAction: `/home/raihan/Documents/kerja/test-imc-be/src/Application/Actions/Permission/UserPermissionAction.php` — verified request/response format [VERIFIED: codebase]
- Backend PermissionRepository: `/home/raihan/Documents/kerja/test-imc-be/src/Domain/Permission/PermissionRepository.php` — verified hasAccess logic, matrix shapes [VERIFIED: codebase]
- Backend PermissionMiddleware: `/home/raihan/Documents/kerja/test-imc-be/src/Application/Middleware/PermissionMiddleware.php` — verified 403 response format and path matching [VERIFIED: codebase]
- Existing PermissionService: `src/app/core/services/permission.service.ts` — verified current implementation [VERIFIED: codebase]
- Angular Material Table Selection: https://material.angular.dev/components/table/overview [CITED: material.angular.dev]
- Angular Material Checkbox API: https://material.angular.dev/components/checkbox/api [CITED: material.angular.dev]
- Angular v20 Route Guards: https://v20.angular.dev/guide/routing/route-guards [CITED: v20.angular.dev]

### Secondary (MEDIUM confidence)
- Frontend codebase patterns from Phase 1-3 plans and existing components [VERIFIED: codebase]
- package.json dependency versions [VERIFIED: package.json]

### Tertiary (LOW confidence)
- None — all claims verified against backend source or official Angular documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages are Angular core/Material already installed, no new dependencies
- Architecture: HIGH — backend API contract verified from source code, frontend patterns established in Phases 1-3
- Pitfalls: HIGH — derived from verified backend code (PermissionMiddleware path matching, PermissionMatrixAction response shape) and existing frontend code (APP_INITIALIZER, PermissionService)

**Research date:** 2026-05-31
**Valid until:** 2026-07-31 (stable — backend API contract is fixed, Angular 20 is current)
