# AUDIT FRONTEND — IMC User Permission Management

**Auditor Role:** Senior Frontend Engineer / Angular Architect / Code Auditor
**Date:** 2026-01-01
**Scope:** Full static review of all source files in `src/app/` (59 TS, 14 SCSS, 13 HTML templates, config files, tests)
**Method:** Line-by-line code inspection. README used only as context — all findings based on actual source code.

---

## Refactor Progress Tracker

| # | Task | Status | Before | After |
|---|------|--------|--------|-------|
| 1 | Add domain check to auth interceptor | ✅ DONE | Token attached to ALL requests — any external URL would leak JWT | `isApiRequest()` guard. Token only on `/api/` and `/auth/`. 6 new tests in `auth.interceptor.spec.ts` |
| 2 | Rename `User` → `AuthUser` in `auth.model.ts` | ✅ DONE | Two `User` interfaces with different shapes in same module — import confusion risk | `AuthUser` in `auth.model.ts`, `User` stays in `user.model.ts`. 5 files updated. Build clean, 0 regressions |
| 3 | Fix `LoginCredentials` type (`undefined` → `string`) | ✅ DONE | `string \| undefined` misleading — suggested optional fields but login always sends both as strings | Both fields are `string`. Type now matches actual usage in `login.component.ts`. Build clean, 0 regressions |
| 4 | Create `PermissionKey` constants | ✅ DONE | Permission keys were magic strings (`'/users'`, `'/levels'`, `'/pages'`) scattered across routes, nav items, dashboard template, and guards — no compile-time guarantee they stay in sync | `PERMISSION_KEYS` const object in `core/constants/permission-keys.ts` with `PermissionKey` type. All 4 locations updated: `admin.routes.ts`, `admin-layout.component.ts`, `dashboard.component.html`, `permission.guard.spec.ts`. Added `hasPermission()` method to `PermissionService`. Fixed pre-existing broken admin-layout tests (Dashboard always renders). Build clean, 156/156 tests pass |
| 5 | Add circuit breaker to error interceptor | ✅ DONE | No protection against infinite refresh loops — if `/auth/refresh` returns 401, interceptor tries to refresh again. Fire-and-forget `logout().subscribe()` propagated errors to calling components causing UI flicker | `RETRY_HEADER` marker on retried requests prevents re-entering refresh flow. `/auth/refresh` URL guard skips refresh for the refresh endpoint itself. Returns `EMPTY` instead of `throwError` after logout — no error propagation. 4 new tests: simultaneous 401 dedup (via existing `shareReplay`), retry-then-401 logout, refresh-endpoint-401 logout, sequential refresh recovery. Build clean, 159/159 tests pass |
| 6 | Add `OnPush` to all components | ✅ DONE | All 14 components used default change detection — every async event triggered full component tree checks, wasting CPU cycles. Angular 20 + signals is designed to work optimally with OnPush | Added `changeDetection: ChangeDetectionStrategy.OnPush` to all 14 components: `App`, `LoginComponent`, `ForbiddenComponent`, `ConfirmDialogComponent`, `AdminLayoutComponent`, `DashboardComponent`, `UserListComponent`, `LevelListComponent`, `PageListComponent`, `UserFormComponent`, `LevelFormComponent`, `PageFormComponent`, `UserPermissionOverrideComponent`, `LevelPermissionMatrixComponent`. Safe because all state uses signals (auto-CD), `toSignal` observables, and `AsyncPipe`-equivalent patterns. Build clean, 159/159 tests pass |
| 7 | Add ESLint + typecheck scripts | ⬜ TODO | | |
| 8 | Extract `handleSubmitError` to ErrorHandlerService | ✅ DONE | `handleSubmitError()` duplicated verbatim across all 3 form components (~30 lines each, 90 lines total) — if backend error format changes, all 3 files must be updated | `handleFormSubmitError()` method in `ErrorHandlerService`. Accepts `(error, form, serverErrors)`. All 3 form components updated, removed private `handleSubmitError()`. Removed unused `HttpErrorResponse` and `ApiErrorResponse` imports from all 3 components. Added 6 new tests in `error-handler.service.spec.ts`. Updated form component specs to spy on new method. Build clean, 164/164 tests pass |
| 9 | Extract `_form-page.scss` mixin | ✅ DONE | 3 form SCSS files were 46-line near-identical copies (only class name differed: `.user-form`, `.level-form`, `.page-form`). Each had `.form-card`, `.loading-container`, grid layout, `mat-form-field`, `.slide-toggle-field`, `.form-actions`, `.server-error` with hardcoded `#f44336`, and responsive media query | `form-page-styles($form-class)` mixin in `shared/styles/_form-page.scss`. Accepts configurable form class name. Replaced hardcoded `#f44336` with `var(--color-error, #f44336)` for theming support. All 3 form components now 3 lines: `@use` + `@include`. 138 lines of duplicated SCSS → 1 mixin + 3 includes. Build clean, 164/164 tests pass |
| 10 | Replace hardcoded hex colors with CSS variables | ⬜ TODO | | |
| 11 | Replace manual `Subscription` with `takeUntilDestroyed` | ⬜ TODO | | |
| 12 | Move CRUD services to feature directories | ✅ DONE | `UserService`, `LevelService`, `PageService` in `shared/services/` — blurred architectural boundary, domain-specific services mixed with cross-cutting utilities | Services moved: `user.service.ts` → `features/users/`, `level.service.ts` → `features/levels/`, `page.service.ts` → `features/pages/` (with specs). All 15 consumer imports updated (components + specs + admin-layout). Model imports in services updated. Build clean, 175/175 tests pass |
| 13 | Extract `DataTableState` composable | ✅ DONE | 3 list components were ~85% identical: same signal declarations (currentPage, pageSize, isLoading, statusFilter, searchQuery), same Subject+Subscription+debounceTime search pattern, same ngOnDestroy, same onSearch/onStatusFilter/onPageChange methods, same toParams structure. User-list had extra levelFilter. Total ~540 lines across 3 files for shared logic | `DataTableState` class in `shared/utils/data-table-state.ts`. Uses `inject(DestroyRef)` + `takeUntilDestroyed` (no manual Subscription/ngOnDestroy). Exposes signals for currentPage, pageSize, statusFilter, isLoading, searchQuery. Provides `search$` debounced Observable, `onSearch()`, `onStatusFilter()`, `onPageChange()`, `resetPage()`, `toListParams(extra?)`. All 3 list components inject it via `readonly state = inject(DataTableState)`. Removed `ngOnDestroy`, `Subscription`, manual `searchSub` from all 3. Components retain entity-specific: items signal, totalItems signal, column definitions, loadItems/loadUsers, handleDelete, entity-specific filters (levelFilter in user-list). 11 new tests in `data-table-state.spec.ts`. Build clean, 175/175 tests pass (164 original + 11 new) |
| 14 | Add typed forms | ⬜ TODO | | |
| 15 | Add `hasPermission()` method | ⬜ TODO | | |
| 16 | Fix `ConfirmDialogService` typing | ⬜ TODO | | |
| 17 | Permission matrix debounce/bulk-save | ⬜ TODO | | |
| 18 | Fix race condition in refresh dedup | ⬜ TODO | | |

---

## A. Executive Summary

**Overall Verdict: Mid-level but acceptable — leans toward solid junior/mid with good Angular 20 knowledge, but falls short of senior-level engineering.**

This is a **competent, functional Angular application** that demonstrates familiarity with modern Angular patterns (standalone components, signals, functional guards/interceptors, `@if`/`@for`). It is **not garbage code**, but it is also **not senior-level**. The codebase reads like a well-guided technical test submission — clean enough to pass review, but with enough structural and architectural issues that a senior engineer would flag in a real project.

**Biggest risks:**
1. **Duplicate CRUD pattern across 3 list components and 3 form components** — copy-paste architecture (see Section E).
2. **CRUD services placed in `shared/` instead of alongside their features** — violates the stated architecture intent.
3. **No `OnPush` change detection anywhere** — all components use default strategy, meaning every async event triggers full component tree checks.
4. **Manual subscription management in list components** (`Subscription` + `ngOnDestroy`) when `takeUntilDestroyed` is available in Angular 20.
5. **`handleSubmitError` duplicated verbatim across all 3 form components** (user-form, level-form, page-form) — 30+ lines of identical code.

**Strongest areas:**
- Auth service with token deduplication (`shareReplay` + `_refreshCall$` cache) — well-implemented.
- Interceptor chain with 401 → refresh → retry flow — correct pattern.
- Test coverage on auth core (AuthService, interceptors, guards) is genuinely good with `HttpTestingController`.
- Permission service cleanly transforms backend response to `Record<string, boolean>` lookup.

**Most needs refactor:**
- DRY violations in CRUD list/form components.
- Service placement (`shared/services/` for domain-specific CRUD services).
- Missing `OnPush` change detection strategy.
- No ESLint, no `npm run lint`, no typecheck script.

---

## B. Scorecard

| Category | Score (1-10) | Notes |
|----------|-------------|-------|
| Folder/File Structure | 6 | Core/shared boundary blurred; CRUD services in wrong place |
| Angular Best Practice | 6 | No OnPush, manual subscriptions, some outdated patterns |
| TypeScript Quality | 7 | Strict mode on, but `any` in tests, `as` casts, untyped forms |
| Code Readability | 7 | Generally clear, but repetitive and verbose |
| DRY | 4 | Heavy copy-paste across list/form components |
| State Management | 7 | Signals used correctly; auth state clean; some stale risk |
| Auth/Security | 6 | Token in sessionStorage (acceptable but not ideal); no domain check in interceptor |
| API Integration | 7 | Consistent endpoints, proper response mapping |
| Forms/Validation | 6 | Typed forms not fully used; password sent empty on edit; duplicate validation |
| Routing/Permission Flow | 7 | Guards correct; permission key magic strings |
| Error Handling | 6 | Centralized handler exists but form error mapping duplicated |
| UI/UX | 7 | Material used consistently; responsive; good empty states |
| Testing | 7 | Good core tests; shallow list/form tests; no delete/confirm tests |
| Tooling/DX | 4 | No ESLint, no lint script, no typecheck, no format script |
| Performance | 5 | No OnPush, no track on some `@for`, no debounce on search input |
| Accessibility | 4 | Minimal aria attributes; form labels ok but error accessibility incomplete |
| Maintainability | 5 | DRY violations and service misplacement hurt long-term maintenance |
| AI Slop Risk | 6 | Not pure AI slop, but has AI-generated patterns (boilerplate consistency without abstraction) |

---

## C. Findings Detail

### C-1. Critical

**Severity:** Critical
**Category:** Auth/Security
**File:** `src/app/core/interceptors/auth.interceptor.ts:12-15`
**Problem:** Token attached to ALL requests, not just API domain.
**Status:** ✅ FIXED — Added `isApiRequest()` check. Token only attached to `/api/` and `/auth/` URLs. 6 tests added in `auth.interceptor.spec.ts`.
**Evidence:**
```ts
if (token) {
  req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
```
There is no check for `req.url.startsWith('/api')` or `req.url.startsWith('/auth')`. If the app ever makes requests to external URLs (e.g., file uploads, third-party APIs), the JWT token leaks.
**Why it matters:** JWT token exposure to third-party servers is a security vulnerability.
**Recommended fix:**
```ts
const apiUrls = ['/api/', '/auth/'];
const isApiRequest = apiUrls.some(prefix => req.url.startsWith(prefix));
if (token && isApiRequest) {
  req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
```

---

**Severity:** Critical
**Category:** Auth/Security
**File:** `src/app/core/services/auth.service.ts:46-47`
**Problem:** Refresh token stored in `sessionStorage` — accessible to any XSS payload.
**Evidence:**
```ts
sessionStorage.setItem('refresh_token', data.refresh_token);
sessionStorage.setItem('user', JSON.stringify(data.user));
```
**Why it matters:** If any third-party script or injected code runs on the page, it can read `sessionStorage` and steal the refresh token. For a technical test this is acceptable, but in production it should be an httpOnly cookie set by the backend.
**Recommended fix:** Document the limitation. For production, move refresh token to httpOnly cookie (backend change required).

---

### C-2. High

**Severity:** High
**Category:** DRY / Architecture
**File:** `src/app/features/users/user-list/user-list.component.ts`, `src/app/features/levels/level-list/level-list.component.ts`, `src/app/features/pages/page-list/page-list.component.ts`
**Problem:** Three list components are ~90% identical copy-paste.
**Evidence:** All three share:
- Same signal declarations (`items`, `totalItems`, `currentPage`, `pageSize`, `isLoading`, `statusFilter`, `searchQuery`)
- Same `toSignal` breakpoint observer pattern
- Same `Subject<string>` + `Subscription` + `debounceTime(300)` + `distinctUntilChanged`
- Same `loadItems()` method structure
- Same `onSearch()`, `onStatusFilter()`, `onPageChange()` methods
- Same `handleDelete()` pattern with confirm dialog + snackBar
- Same `desktopColumns`/`tabletColumns`/`displayedColumns` computed pattern
- Same `ngOnDestroy` unsubscription

Only differences: column names, service injected, entity type, and one extra filter (level filter in user-list).

**Why it matters:** Any bug fix or feature addition (e.g., export to CSV, bulk delete) must be applied 3 times. This is the single biggest maintenance risk in the codebase.

**Recommended fix:** Extract a `DataTableComponent<T>` or at minimum a `useDataTable()` composable function. See Section E for details.

---

**Severity:** High
**Category:** DRY / Forms
**File:** `src/app/features/users/user-form/user-form.component.ts:169-200`, `src/app/features/levels/level-form/level-form.component.ts:134-165`, `src/app/features/pages/page-form/page-form.component.ts:140-171`
**Problem:** `handleSubmitError()` is verbatim copy-paste across all 3 form components (~30 lines each).
**Evidence:**
```ts
private handleSubmitError(err: unknown): void {
  if (err instanceof HttpErrorResponse) {
    const apiError = err?.error as ApiErrorResponse | undefined;
    if ((err.status === 422 || err.status === 409) && apiError?.error) {
      if (apiError.error.errors) {
        const formErrors = this.errorHandler.handleFormErrors(err);
        for (const [field, messages] of Object.entries(formErrors)) {
          const control = this.form.get(field);
          if (control) {
            control.setErrors({ server: messages });
          }
        }
        this.serverErrors.set(formErrors);
      }
      if (apiError.error.field && apiError.error.description) {
        const control = this.form.get(apiError.error.field);
        if (control) {
          control.setErrors({ server: [apiError.error.description] });
          this.serverErrors.set({ [apiError.error.field]: [apiError.error.description] });
        }
      }
    } else {
      this.errorHandler.handle(err);
    }
  } else {
    this.errorHandler.handle(err);
  }
}
```
Identical in all 3 files.

**Why it matters:** If the backend error format changes, all 3 files must be updated. This is exactly the kind of duplication that causes bugs when one file is updated and others are forgotten.

**Recommended fix:** Move to `ErrorHandlerService` as `mapToFormControls(form: FormGroup, err: HttpErrorResponse): void`.

---

**Severity:** High
**Category:** Performance
**File:** All components (13 components)
**Problem:** No `ChangeDetectionStrategy.OnPush` used anywhere.
**Evidence:** Every component declaration lacks `changeDetection: ChangeDetectionStrategy.OnPush`. For example:
```ts
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [...],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
```
**Why it matters:** With default change detection, every async event (HTTP response, timer, click) triggers change detection across the entire component tree. In a real admin dashboard with 100+ users, this becomes noticeable. Angular 20 + signals is designed to work optimally with OnPush.
**Recommended fix:** Add `changeDetection: ChangeDetectionStrategy.OnPush` to all components. Since this app already uses signals extensively, OnPush should work without issues (signals trigger change detection automatically).

---

**Severity:** High
**Category:** Architecture Boundary
**File:** `src/app/shared/services/user.service.ts`, `level.service.ts`, `page.service.ts`
**Problem:** Domain-specific CRUD services placed in `shared/` instead of `features/`.
**Evidence:** `UserService`, `LevelService`, `PageService` are in `shared/services/`. Per Angular best practice and the project's own AGENTS.md convention, `shared/` should contain only truly reusable cross-cutting concerns (error handler, confirm dialog, loading service). Domain CRUD services belong either in `features/*/` or in `core/services/`.
**Why it matters:** This blurs the architectural boundary. A new developer looking at `shared/services/` expects to find utilities, not domain-specific API clients. It also creates circular dependency risk if features start importing from each other via shared.
**Recommended fix:** Move `user.service.ts` → `features/users/user.service.ts`, `level.service.ts` → `features/levels/level.service.ts`, `page.service.ts` → `features/pages/page.service.ts`.

---

### C-3. Medium

**Severity:** Medium
**Category:** Angular Best Practice
**File:** `src/app/features/users/user-list/user-list.component.ts:90-101`
**Problem:** Manual `Subscription` management when `takeUntilDestroyed` is available.
**Evidence:**
```ts
private searchSub: Subscription;
constructor() {
  this.searchSub = this.searchSubject
    .pipe(debounceTime(300), distinctUntilChanged())
    .subscribe((query) => { ... });
}
ngOnDestroy(): void {
  this.searchSub.unsubscribe();
}
```
**Why it matters:** Angular 16+ provides `takeUntilDestroyed()` which eliminates the need for `ngOnDestroy` and manual unsubscription. This is an older pattern that adds boilerplate.
**Recommended fix:**
```ts
constructor() {
  const destroyRef = inject(DestroyRef);
  this.searchSubject
    .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(destroyRef))
    .subscribe((query) => { ... });
}
// No ngOnDestroy needed
```

---

**Severity:** Medium
**Category:** TypeScript Quality
**File:** `src/app/features/users/user-form/user-form.component.ts:71`
**Problem:** FormGroup not typed — uses untyped `FormGroup` instead of `FormGroup<UserFormControls>`.
**Evidence:**
```ts
readonly form: FormGroup = this.fb.group({...});
```
The form controls are not typed. Angular 14+ typed forms allow:
```ts
readonly form = this.fb.group<UserFormControls>({
  full_name: this.fb.nonNullable.control('', [...]),
  ...
});
```
**Why it matters:** Without typed forms, `form.get('full_name')` returns `AbstractControl | null` and `form.value` is `Partial<any>`. This defeats TypeScript's type safety for forms.
**Recommended fix:** Use `fb.nonNullable.control()` with typed form groups.

---

**Severity:** Medium
**Category:** TypeScript Quality
**File:** `src/app/shared/models/auth.model.ts:28-29`
**Problem:** `LoginCredentials` has `username: string | undefined` and `email: string | undefined` — should not be `undefined` in a request model.
**Status:** ✅ FIXED — Both fields are now `string`. Type matches actual usage where `login.component.ts` always sends both as the same `identifier` value.
**Evidence:**
```ts
export interface LoginCredentials {
  username: string | undefined;
  email: string | undefined;
  password: string;
}
```
**Why it matters:** `undefined` in a request body type suggests the field might not be sent. But the login component always sends both fields. This should be `string` (or `string | null` if optional).
**Recommended fix:** Change to `username: string; email: string;` or make them optional with `?`.

---

**Severity:** Medium
**Category:** TypeScript Quality
**File:** `src/app/shared/models/user.model.ts` + `src/app/shared/models/auth.model.ts`
**Problem:** Duplicate `User` interface with different fields.
**Evidence:**
- `auth.model.ts:1-6`: `User { id, username, full_name, level_id }` (auth user profile)
- `user.model.ts:1-10`: `User { id, full_name, username, email, level_id, is_active, created_at, updated_at }` (CRUD user entity)

These are two different shapes with the same name. The auth model is a subset of the CRUD model.
**Why it matters:** Import confusion. `auth.guard.spec.ts` imports `User` from `auth.model.ts`, while `user-list.component.ts` imports `User` from `user.model.ts`. A developer could easily import the wrong one.
**Recommended fix:** Rename to `AuthUser` in `auth.model.ts` and keep `User` in `user.model.ts`. Or use a single `User` type and derive `AuthUser = Pick<User, 'id' | 'username' | 'user_name' | 'level_id'>`.

---

**Severity:** Medium
**Category:** Auth/Security
**File:** `src/app/core/guards/auth.guard.ts:9`
**Problem:** Auth guard only checks signal, not server-side validity.
**Evidence:**
```ts
return authService.isAuthenticated() || router.parseUrl('/login');
```
This checks if `_accessToken` signal is non-null. If the token is expired but still in memory, the guard passes and the user hits the backend, gets 401, and the interceptor refreshes. This is functionally correct but means the guard is not a real gate — it's a UX optimization.
**Why it matters:** This is actually the correct approach for frontend guards (they should not be the source of truth). But the code should document this intent to avoid confusion.
**Recommended fix:** Add a comment: `// Frontend-only check; backend is the source of truth for auth`.

---

**Severity:** Medium
**Category:** Routing/Permission Flow
**File:** `src/app/layout/admin.routes.ts` (entire file)
**Problem:** Permission keys are magic strings scattered across route definitions.
**Evidence:**
```ts
data: { permission: '/users' }
data: { permission: '/levels' }
data: { permission: '/pages' }
```
These same strings appear in:
- `admin-layout.component.ts:82-87` (navItems)
- `dashboard.component.html:8,20,32` (permission checks)
- `permission.guard.ts:12` (reads from route data)

**Why it matters:** If a permission key changes (e.g., `/users` → `/admin/users`), it must be updated in 4+ places. No compile-time guarantee they stay in sync.
**Recommended fix:** Create a `PermissionKey` const or enum:
```ts
export const PERMISSION_KEYS = { USERS: '/users', LEVELS: '/levels', PAGES: '/pages' } as const;
export type PermissionKey = typeof PERMISSION_KEYS[keyof typeof PERMISSION_KEYS];
```

---

**Severity:** Medium
**Category:** Forms/Validation
**File:** `src/app/features/users/user-form/user-form.component.ts:138-146`
**Problem:** Empty password is sent on edit even though it should be optional.
**Evidence:**
```ts
const payload = {
  full_name: rawValue.full_name,
  username: rawValue.username,
  email: rawValue.email,
  password: rawValue.password,  // <-- empty string sent
  level_id: rawValue.level_id,
  is_active: rawValue.is_active,
};
```
The `UserService.update()` method does delete empty password (line 77-79), but the form component constructs the payload before passing it. This means the form component is sending `password: ''` to the service, relying on the service to clean it up.
**Why it matters:** The form should not send password at all if it's empty. The service cleanup is a safety net, not a design.
**Recommended fix:** Build payload conditionally:
```ts
const payload: UpdateUserRequest = {
  full_name: rawValue.full_name,
  username: rawValue.username,
  email: rawValue.email,
  level_id: rawValue.level_id,
  is_active: rawValue.is_active,
};
if (rawValue.password) {
  payload.password = rawValue.password;
}
```

---

**Severity:** Medium
**Category:** State Management
**File:** `src/app/layout/admin-layout/admin-layout.component.ts:75-79`
**Problem:** Levels fetched on every admin layout init with `perPage: 100` — no caching.
**Evidence:**
```ts
ngOnInit(): void {
  this.levelService.list({ perPage: 100 }).subscribe({
    next: (res) => this.levels.set(res.data),
    error: () => this.levels.set([]),
  });
}
```
This fetches all levels just to display the user's level name in the toolbar. If the user navigates away and back, it fetches again.
**Why it matters:** Unnecessary API call on every admin layout mount. For 100 levels this is minor, but the pattern is wasteful.
**Recommended fix:** Include level name in the auth user profile from the login response, or cache the levels list in a service-level signal.

---

**Severity:** Medium
**Category:** Error Handling
**File:** `src/app/core/interceptors/error.interceptor.ts:36-38`
**Problem:** When refresh token fails, `authService.logout().subscribe()` is fire-and-forget — original error is re-thrown but the calling component may not handle it properly.
**Evidence:**
```ts
catchError(() => {
  authService.logout().subscribe();
  return throwError(() => error);
}),
```
**Why it matters:** The logout navigates to `/login`, but the original failed request's error is propagated. If the calling component has an error handler, it will show a snackbar while the user is already being redirected. This can cause UI flicker.
**Recommended fix:** Return `EMPTY` instead of `throwError` after logout, since the user is being redirected anyway:
```ts
catchError(() => {
  authService.logout().subscribe();
  return EMPTY;
}),
```

---

### C-4. Low

**Severity:** Low
**Category:** Code Style
**File:** `src/app/shared/services/loading.service.ts:1`
**Problem:** Unused imports `Component` in a service file.
**Evidence:**
```ts
import { Component, computed, signal, Injectable, inject } from '@angular/core';
```
`Component` is not used.

---

**Severity:** Low
**Category:** Code Style
**File:** `src/app/features/users/user-form/user-form.component.ts:69`
**Problem:** `hidePassword` is a plain boolean, not a signal — inconsistent with the rest of the component which uses signals.
**Evidence:**
```ts
hidePassword = true;  // plain boolean
```
While other state in the same component uses `signal()`:
```ts
readonly isLoading = signal(false);
readonly isSubmitting = signal(false);
```
**Why it matters:** Inconsistency. The template reads `hidePassword` directly (not as a function call), which works but breaks the pattern.
**Recommended fix:** Either make it `readonly hidePassword = signal(true)` and use `hidePassword()` in template, or leave as-is since it's UI-only state that doesn't need signal semantics.

---

**Severity:** Low
**Category:** UI/UX
**File:** `src/app/features/users/user-list/user-list.component.html:20`
**Problem:** MatSelect `[value]="null"` binding may not work as expected with Angular's strict equality.
**Evidence:**
```html
<mat-select (selectionChange)="onLevelFilter($event.value)" [value]="null">
  <mat-option [value]="null">All Levels</mat-option>
```
**Why it matters:** Angular's `[value]` binding with `null` can be flaky. `value` attribute comparison uses strict equality, and `null` from the option may not match `null` from the binding.
**Recommended fix:** Use a sentinel value like `-1` or `undefined` instead of `null`.

---

**Severity:** Low
**Category:** Accessibility
**File:** `src/app/features/users/user-list/user-list.component.html:15`
**Problem:** Search input has no `aria-label` or associated label.
**Evidence:**
```html
<input matInput (input)="onSearch($event)" placeholder="Search users..." />
```
**Why it matters:** Screen readers rely on labels, not placeholders. Placeholders disappear on input.
**Recommended fix:** Add `aria-label="Search users"` or use a `<label>` element.

---

**Severity:** Low
**Category:** Performance
**File:** `src/app/features/users/user-list/user-list.component.html:22-24`
**Problem:** `@for` loop missing `track` for levels dropdown.
**Evidence:**
```html
@for (level of levels(); track level.id) {
  <mat-option [value]="level.id">{{ level.name }}</mat-option>
}
```
Actually this one IS correct with `track level.id`. But the permission matrix component does not use `@for` at all — it uses MatTable which has its own tracking.

---

**Severity:** Low
**Category:** Testing
**File:** Multiple spec files
**Problem:** Tests access private members using bracket notation `service['_accessToken']`.
**Evidence:**
- `auth.guard.spec.ts:30`: `authService['_accessToken'].set('valid-token')`
- `permission.guard.spec.ts:54`: `permissionService['_permissions'].set({ '/users': true })`
**Why it matters:** This breaks encapsulation and makes tests fragile to refactoring. If the private field is renamed, tests break.
**Recommended fix:** Test through public API. For guards, set up the service state through public methods (e.g., mock a login response).

---

**Severity:** Low
**Category:** TypeScript Quality
**File:** `src/app/core/services/permission.service.ts:19`
**Problem:** `permissions` signal is `Record<string, boolean>` with no type-safe accessor.
**Evidence:**
```ts
private readonly _permissions = signal<Record<string, boolean>>({});
```
Any string key is accepted. `permissions()['/users']` returns `boolean | undefined`, and guards check `=== true` so `undefined` acts as `false`. This works but is fragile — a typo in a permission key silently fails with no compile-time error.
**Recommended fix:** Add a `hasPermission(key: string): boolean` method:
```ts
hasPermission(key: string): boolean {
  return !!this._permissions()[key];
}
```
Combined with `PermissionKey` constants (see C-3 Magic Strings), this gives full type safety.

---

**Severity:** Medium
**Category:** Auth/Security
**File:** `src/app/core/interceptors/error.interceptor.ts`
**Problem:** No circuit breaker for refresh token infinite loop.
**Evidence:** If the `/auth/refresh` endpoint returns 401 (expired refresh token), the interceptor catches it via its own `catchError` AND the `catchError` inside `authService.refreshToken()`. The interceptor catches ALL 401s indiscriminately — including from the retry request itself. If the refreshed token is somehow invalid and the retry gets 401, it tries to refresh again. There is no retry count or `_isRefreshing` flag that prevents re-entering the refresh flow from a retry request.
**Why it matters:** In edge cases (clock skew, token revoked server-side but not yet expired client-side), this can create a refresh → 401 → refresh → 401 loop until the browser crashes or the user is stuck in a redirect cycle.
**Recommended fix:** Add a `_retryCount` header or a `_isRefreshing` flag:
```ts
private _isRefreshing = false;
// In the 401 handler:
if (this._isRefreshing) return throwError(() => error);
this._isRefreshing = true;
// After refresh completes or fails:
finally { this._isRefreshing = false; }
```
Alternatively, mark retried requests with a custom header and skip the refresh flow for requests that already have it.

---

**Severity:** Low
**Category:** Performance
**File:** `src/app/features/permissions/level-permission-matrix/level-permission-matrix.component.ts:56-71`
**Problem:** Each checkbox toggle in the permission matrix immediately fires an API call. Rapid clicks on different checkboxes create parallel requests.
**Evidence:**
```ts
onTogglePermission(entry: PermissionEntry, checked: boolean): void {
  this.savingEntries.set({ ...this.savingEntries(), [entry.id]: true });
  this.permissionService.updatePermission(entry.id, { allowed: checked }).subscribe({...});
}
```
With `isSaving` per-entry, rapid toggles on the same entry are prevented, but rapid toggles on different entries create parallel API calls.
**Why it matters:** Minor — unlikely to cause issues in practice with a small permission matrix. But if an admin rapidly clicks 10+ checkboxes, 10 parallel PATCH requests fire. The backend may process them out of order, and the UI state may not reflect the final server state.
**Recommended fix:** Implement a bulk-save pattern — queue changes locally and flush on a "Save All" button or debounce the flush:
```ts
private pendingChanges = new Map<number, boolean>();
private saveSubject = new Subject<void>();

onTogglePermission(entry: PermissionEntry, checked: boolean): void {
  this.pendingChanges.set(entry.id, checked);
  this.saveSubject.next();
}

// In constructor:
this.saveSubject.pipe(debounceTime(500)).subscribe(() => this.flushPendingChanges());
```

---

**Severity:** Low
**Category:** TypeScript Quality
**File:** `src/app/shared/services/confirm-dialog.service.ts:28`
**Problem:** `ConfirmDialogService` opens `MatDialog` without generic type — `afterClosed()` returns `Observable<any>`.
**Evidence:**
```ts
return this.dialog
  .open(ConfirmDialogComponent, { data, width: '400px' })
  .afterClosed()
  .pipe(map((result) => result === true));
```
`MatDialog.open()` accepts a second generic parameter for the return type: `MatDialogRef<ConfirmDialogComponent, boolean>`. Without it, `result` is `any` and the `=== true` comparison is defensive but not type-enforced.
**Recommended fix:**
```ts
const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, { data, width: '400px' });
return dialogRef.afterClosed().pipe(map((result) => result === true));
```

---

**Severity:** Low
**Category:** SCSS / Theming
**File:** `src/app/features/auth/login/login.component.scss`, `user-permission-override.component.scss`, `forbidden.component.scss`, `_list-page.scss`
**Problem:** Hardcoded hex color values instead of CSS variables.
**Evidence:**
- `login.component.scss`: `#f5f5f5` (background), `#d32f2f` (error red)
- `user-permission-override.component.scss`: `#666` (text), `#e0e0e0` (border)
- `forbidden.component.scss`: `#fafafa` (background), `#666` (text)
- `_list-page.scss`: `#22c55e` (success green), `#16a34a` (success green hover)

**Why it matters:** These colors won't respect theming changes and break dark mode support. If the design system changes its primary error color, every hardcoded hex must be found and replaced manually.
**Recommended fix:** Replace with CSS variables defined in `styles.scss`:
```scss
:root {
  --color-error: #d32f2f;
  --color-success: #22c55e;
  --color-text-secondary: #666;
  --color-border: #e0e0e0;
  --color-bg-subtle: #f5f5f5;
}
```
Then use `var(--color-error)` throughout.

---

**Severity:** Medium
**Category:** Auth/Security
**File:** `src/app/core/interceptors/error.interceptor.ts:26-43`
**Problem:** Subtle race condition in refresh deduplication with `shareReplay(1)` + `finalize`.
**Evidence:** The flow is:
1. Request A gets 401 → sets `_refreshCall$`, starts refresh via `shareReplay(1)`
2. Request B gets 401 → sees `_refreshCall$` exists, subscribes to it
3. Refresh completes, `finalize` sets `_refreshCall$ = null`
4. Both A and B retry

The race window: between `finalize` clearing `_refreshCall$` and `shareReplay(1)` completing its emission to all subscribers, a third concurrent 401 (Request C) may check `_refreshCall$`, see `null`, and start a second refresh. This is a microsecond window but real under high concurrency.
**Why it matters:** If the backend rate-limits refresh endpoints, a second refresh call could be rejected. More importantly, if Request C's refresh succeeds while A and B's refresh is still being processed, the tokens may be out of sync.
**Recommended fix:** Use a `BehaviorSubject` or `ReplaySubject` as the shared refresh observable instead of the `_refreshCall$` null-check pattern:
```ts
private _refreshSubject = new ReplaySubject<void>(1);
private _refreshInProgress = false;

// In the 401 handler:
if (!this._refreshInProgress) {
  this._refreshInProgress = true;
  this._refreshSubject.next();
  authService.refreshToken().pipe(
    finalize(() => { this._refreshInProgress = false; })
  ).subscribe();
}
return this._refreshSubject.pipe(first(), switchMap(() => next(req)));
```

---

## D. Import and Code Organization Issues

### D-1. Import Organization

| File | Issue |
|------|-------|
| `loading.service.ts:1` | Unused `Component` import from `@angular/core` |
| `user-list.component.ts:32` | Duplicate import: `type { User }` and `type { Level }` both from `user.model.ts` — should be single import line |
| `user-form.component.ts:30-31` | Same duplicate import pattern |
| All form components | Import `ApiErrorResponse` from `auth.model.ts` — semantically it belongs in `api.model.ts` since it's a generic API error shape |

### D-2. File Placement Violations

| File | Should Be In | Reason |
|------|-------------|--------|
| `shared/services/user.service.ts` | `features/users/` | Domain-specific CRUD service |
| `shared/services/level.service.ts` | `features/levels/` | Domain-specific CRUD service |
| `shared/services/page.service.ts` | `features/pages/` | Domain-specific CRUD service |
| `shared/pages/dashboard/` | `features/dashboard/` or `layout/` | Dashboard is a feature page, not shared utility |
| `shared/pages/forbidden/` | `features/auth/` or `layout/` | Forbidden page is part of auth flow |

### D-3. Template Complexity

| File | Issue |
|------|-------|
| `admin-layout.component.html` (76 lines) | Acceptable — clean sidenav/toolbar layout |
| `user-list.component.html` (137 lines) | Heavy but acceptable — table with filters |
| `user-permission-override.component.html` (117 lines) | Two tabs with tables + add form — borderline complex |

### D-4. SCSS Issues

| File | Issue |
|------|-------|
| `styles.scss` (171 lines) | Global `!important` overrides on Material components (lines 144-170) — fragile if Material updates |
| `_list-page.scss` (235 lines) | Large mixin but well-organized. Only used by user-list (which adds its own styles on top). Level-list and page-list do NOT use this mixin — they should. |
| `level-list.component.scss` | Does NOT include `_list-page.scss` mixin — duplicates styles inline |
| `page-list.component.scss` | Does NOT include `_list-page.scss` mixin — duplicates styles inline |

---

## E. DRY Refactor Opportunities

### E-1. CRUD List Components (Highest Priority)

**Files:** `user-list.component.ts`, `level-list.component.ts`, `page-list.component.ts`
**Duplication:** ~85% identical code
**Impact:** Any change to list behavior (export, bulk actions, new filter) requires 3x work

**Recommended abstraction — `DataTableState` service:**
```ts
export interface DataTableParams {
  page: number;
  perPage: number;
  search?: string;
  isActive?: boolean;
}

export class DataTableState {
  readonly currentPage = signal(1);
  readonly pageSize = signal(15);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<boolean | null>(null);
  readonly isLoading = signal(false);

  private searchSubject = new Subject<string>();
  readonly search$ = this.searchSubject.pipe(debounceTime(300), distinctUntilChanged());

  constructor() {
    inject(DestroyRef).onDestroy(() => this.searchSubject.complete());
  }

  onSearch(value: string) { this.searchSubject.next(value); this.currentPage.set(1); }
  onStatusFilter(value: boolean | null) { this.statusFilter.set(value); this.currentPage.set(1); }
  onPageChange(event: PageEvent) { this.currentPage.set(event.pageIndex + 1); this.pageSize.set(event.pageSize); }
  toParams(extra?: Record<string, unknown>): DataTableParams { ... }
}
```

Each list component would then be ~40 lines instead of ~180.

### E-2. Form Error Handler

**Files:** `user-form.component.ts`, `level-form.component.ts`, `page-form.component.ts`
**Duplication:** `handleSubmitError()` — 30 lines identical

**Move to `ErrorHandlerService`:**
```ts
mapToFormControls(form: FormGroup, error: HttpErrorResponse): Record<string, string[]> {
  const apiError = error?.error as ApiErrorResponse;
  const errors: Record<string, string[]> = {};

  if (apiError?.error?.errors) {
    Object.assign(errors, apiError.error.errors);
    for (const [field, messages] of Object.entries(apiError.error.errors)) {
      form.get(field)?.setErrors({ server: messages });
    }
  }
  if (apiError?.error?.field && apiError?.error?.description) {
    errors[apiError.error.field] = [apiError.error.description];
    form.get(apiError.error.field)?.setErrors({ server: [apiError.error.description] });
  }
  return errors;
}
```

### E-3. Confirmation + Delete Pattern

**Files:** All 3 list components
**Duplication:** `handleDelete()` method with confirm dialog → service.delete → update signal → snackBar → page-back logic

**Recommended:**
```ts
async handleDelete<T extends { id: number; name?: string; full_name?: string }>(
  entity: T,
  deleteFn: (id: number) => Observable<{ message: string }>,
  entityLabel: string,
): Promise<void> {
  const name = entity.name ?? entity.full_name ?? 'item';
  const confirmed = await firstValueFrom(
    this.confirmDialog.confirm({
      title: `Delete ${entityLabel}`,
      message: `Are you sure you want to delete "${name}"?`,
      confirmText: 'Delete',
      color: 'warn',
    }),
  );
  if (!confirmed) return;

  deleteFn(entity.id).subscribe({
    next: () => { /* update signal, snackBar, page-back */ },
    error: (err) => this.errorHandler.handle(err),
  });
}
```

### E-4. Snackbar Notification

**Duplication:** `snackBar.open('...deleted successfully', 'Close', { duration: 3000 })` appears in 6+ places with slight variations.

**Recommended:**
```ts
// In ErrorHandlerService or new NotificationService
success(message: string) { this.snackBar.open(message, 'Close', { duration: 3000, panelClass: 'success-snackbar' }); }
error(message: string) { this.snackBar.open(message, 'Close', { duration: 5000, panelClass: 'error-snackbar' }); }
```

### E-5. Test Setup

**Duplication:** Every component spec has the same `jasmine.createSpyObj` pattern with `ErrorHandlerService`, `BreakpointObserver`, `RouterTestingModule`.

**Recommended:** Create test utility functions:
```ts
export function createMockErrorHandler() {
  return jasmine.createSpyObj('ErrorHandlerService', ['handle', 'handleFormErrors', 'getErrorMessage']);
}
export function createMockBreakpointObserver(isTablet = false) {
  return { observe: jasmine.createSpy('observe').and.returnValue(of({ matches: isTablet })) };
}
```

---

## F. Architecture Boundary Violations

| Violation | Location | Description |
|-----------|----------|-------------|
| **Shared contains domain logic** | `shared/services/user.service.ts`, `level.service.ts`, `page.service.ts` | These are feature-specific API clients, not shared utilities |
| **Shared contains feature pages** | `shared/pages/dashboard/`, `shared/pages/forbidden/` | These are application pages, not reusable shared components |
| **Core depends on shared models** | `core/services/auth.service.ts` imports from `shared/models/auth.model.ts` | Acceptable — models are meant to be shared |
| **Features import from core** | All feature components import `AuthService`, `PermissionService` from `core/` | Correct — core services are meant to be consumed by features |
| **Features import from shared** | All feature components import services from `shared/services/` | Problematic — these should be in features, not shared |
| **Layout imports from features** | None detected | Good — layout is clean |
| **Guard/interceptor too thin** | `auth.guard.ts` (10 lines), `permission.guard.ts` (18 lines) | Good — guards are appropriately thin |
| **Interceptor has business logic** | `error.interceptor.ts` calls `permissionService.refreshPermissions()` after token refresh | Acceptable — this is orchestration, not business logic |
| **AdminLayout fetches levels** | `admin-layout.component.ts:75-79` | Layout component making API calls for data display — should be handled by a service or resolved via route resolver |

---

## G. Missing Tests

### G-1. Critical Missing Tests

| Test Name | File | Reason |
|-----------|------|--------|
| `shouldNotAttachTokenToExternalUrls` | `error.interceptor.spec.ts` | Verify interceptor only attaches token to `/api` and `/auth` URLs |
| `shouldLogoutWhenRefreshTokenFails` | `error.interceptor.spec.ts` | Test the 401 → refresh fails → logout flow |
| `shouldNotSpamRefreshWhenMultiple401s` | `error.interceptor.spec.ts` | Verify that multiple simultaneous 401s don't trigger multiple refresh requests |
| `shouldMapBackendValidationErrorsToFormControls` | `user-form.component.spec.ts` | Already exists — good |
| `shouldNotSendEmptyPasswordOnUserEdit` | `user-form.component.spec.ts` | Verify that edit mode doesn't send password when field is empty |
| `shouldDisableSubmitWhileSaving` | All form specs | Verify button is disabled during `isSubmitting` |
| `shouldHandleDeleteConfirmation` | `user-list.component.spec.ts` | Test that delete only proceeds after user confirms |
| `shouldNotDeleteWhenCancelled` | `user-list.component.spec.ts` | Test that delete is cancelled when user dismisses dialog |
| `shouldReloadPermissionsAfterPermissionMatrixUpdate` | `level-permission-matrix.component.spec.ts` | Verify that after permission change, sidebar reflects update |
| `shouldRedirectUserWithNoPermissionsToEmptyDashboard` | `dashboard.component.spec.ts` | Test empty state when user has no permissions |
| `shouldHandleConcurrentRefreshTokenCalls` | `auth.service.spec.ts` | Already exists — good |
| `shouldRestoreSessionAndNavigate` | `app.config.ts` APP_INITIALIZER | Test that APP_INITIALIZER correctly restores session before app boot |

### G-2. Test Quality Issues

| Issue | Location | Description |
|-------|----------|-------------|
| **No e2e tests** | Entire project | No Playwright/Cypress setup. Critical flows (login → CRUD → permission → logout) are untested end-to-end |
| **No dashboard component spec** | `shared/pages/dashboard/` | No test file exists for dashboard component |
| **No page-list delete test** | `page-list.component.spec.ts` | Missing `handleDelete` test (unlike user-list which has it) |
| **No level-form edit mode test** | `level-form.component.spec.ts` | Only tests create mode, no edit mode flow |
| **No page-form edit mode test** | `page-form.component.spec.ts` | Same — only create mode tested |
| **No user-permission-override remove test** | `user-permission-override.component.spec.ts` | `onRemoveOverride` test exists but doesn't verify the HTTP DELETE call |

---

## H. Refactor Roadmap

### H-1. Quick Wins (< 1 day)

| Task | Impact | Effort |
|------|--------|--------|
| Remove unused `Component` import from `loading.service.ts` | Clean code | 2 min |
| Add `changeDetection: ChangeDetectionStrategy.OnPush` to all components | Performance | 30 min |
| Rename `User` in `auth.model.ts` to `AuthUser` | Type clarity | 15 min |
| Fix `LoginCredentials` type (`undefined` → `string`) | Type correctness | 5 min |
| Add `aria-label` to search inputs | Accessibility | 10 min |
| Add `npm run lint` with ESLint | Developer experience | 2 hours |
| Add `npm run typecheck` script (`tsc --noEmit`) | Developer experience | 5 min |
| Add domain check to auth interceptor | Security | 10 min |
| Fix `hidePassword` to use signal for consistency | Consistency | 5 min |
| Add `return EMPTY` in error interceptor after logout | UX polish | 5 min |

### H-2. Medium Refactor (1-3 days)

| Task | Impact | Effort |
|------|--------|--------|
| Move `handleSubmitError` to `ErrorHandlerService` | DRY, maintainability | 2 hours |
| Move CRUD services to feature directories | Architecture clarity | 3 hours |
| Extract `DataTableState` composable for list components | DRY, maintainability | 4 hours |
| Create `PermissionKey` constants/enum | Type safety, maintainability | 1 hour |
| Add missing component tests (dashboard, delete flows, edit modes) | Test coverage | 4 hours |
| Add `NotificationService` for consistent snackbar usage | Consistency | 1 hour |
| Move dashboard/forbidden out of `shared/pages/` | Architecture clarity | 1 hour |
| Replace manual `Subscription` with `takeUntilDestroyed` | Modern Angular pattern | 1 hour |

### H-3. Deep Refactor (3+ days)

| Task | Impact | Effort |
|------|--------|--------|
| Extract reusable `DataTableComponent<T>` with search/filter/pagination | Massive DRY improvement | 2 days |
| Extract reusable `FormPageComponent<T>` with create/edit/error mapping | Massive DRY improvement | 2 days |
| Add e2e test suite (Playwright) for critical flows | Quality assurance | 2 days |
| Implement httpOnly cookie for refresh token (requires backend change) | Security | 1 day |
| Add route resolvers for level data in admin layout | Performance | 2 hours |

### H-4. Optional Improvements

| Task | Impact |
|------|--------|
| Add bundle size analysis (`webpack-bundle-analyzer` or `ng build --stats-json`) | Performance monitoring |
| Add dark mode support via Angular Material theming | UX enhancement |
| Add loading skeleton/spinner for list components | UX polish |
| Add keyboard shortcuts (e.g., Ctrl+S to save form) | UX enhancement |
| Add internationalization (`@angular/localize`) | Future-proofing |

---

## I. Final Verdict

### Is this frontend clean?
**Yes, mostly.** The code is readable, follows Angular 20 patterns, and is structurally organized. It is not messy or chaotic.

### Is this senior-level?
**No.** A senior engineer would have:
1. Extracted the duplicated list/form patterns into reusable abstractions.
2. Placed domain services in feature directories, not shared.
3. Used `OnPush` change detection across the board.
4. Used `takeUntilDestroyed` instead of manual subscriptions.
5. Used typed forms throughout.
6. Created permission key constants instead of magic strings.
7. Added ESLint and proper tooling.

### Is there AI slop indication?
**Moderate.** The code has characteristics of AI-assisted generation:
- **Boilerplate consistency:** All 3 list components and all 3 form components follow the exact same template — this is typical of AI generating "the same pattern for each entity."
- **Shallow tests:** Many spec files test `should create` and basic form validation but skip business-critical flows (delete confirmation, edit mode, permission updates).
- **README vs code gap:** The README is comprehensive and well-written, but the code has obvious DRY violations that the README doesn't acknowledge.
- **Signals used correctly but not optimally:** Signals are used for state, but `OnPush` is missing — suggesting the developer knows about signals but doesn't understand their full performance implications.

However, this is **not pure AI slop**. The auth service with token deduplication, the interceptor chain, and the core tests show genuine understanding. A human reviewed and likely wrote significant portions.

### Is it safe to use/continue?
**Yes, with caveats.** The application is functional and will work for a technical test demo. The main risks are:
1. Maintenance burden from duplicated code.
2. Performance issues at scale (no OnPush).
3. Security gap in interceptor (token attached to all URLs).

### Top 5 things to fix first:

1. **Add domain check to auth interceptor** — prevent token leakage to external URLs (Security, 10 min)
2. **Add `OnPush` change detection to all components** — performance improvement with zero risk since signals are already used (Performance, 30 min)
3. **Extract `handleSubmitError` to `ErrorHandlerService`** — eliminate 90 lines of duplicated code (DRY, 2 hours)
4. **Move CRUD services to feature directories** — fix architectural boundary (Architecture, 3 hours)
5. **Add ESLint + `npm run lint` script** — enforce code quality automatically (Tooling, 2 hours)

---

**Summary:** This is a **solid mid-level Angular 20 application** that demonstrates good understanding of modern Angular patterns. It is not senior-level due to DRY violations, missing performance optimizations, and architectural boundary issues. It is not garbage code — it is functional, tested, and well-organized. With the quick wins above, it could reach a senior-level standard within 1-2 days of focused refactoring.
