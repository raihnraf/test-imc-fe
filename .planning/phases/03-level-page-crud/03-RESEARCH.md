# Phase 3: Level + Page CRUD - Research

**Researched:** 2026-05-31
**Domain:** Angular 20 CRUD patterns, Angular Material, Slim PHP backend API integration
**Confidence:** HIGH

## Summary

Phase 3 extends the CRUD patterns established in Phase 2 (User CRUD) to two additional resources: Levels and Pages. The backend API for both resources already exists and follows the same response format as the Users API. The existing `LevelService` is partially implemented (list only) and needs create/update/delete methods. A new `PageService` must be created from scratch. Two new feature components (`LevelListComponent`, `LevelFormComponent`, `PageListComponent`, `PageFormComponent`) follow the exact same architectural pattern as the Phase 2 User components.

The key differentiator from Phase 2 is the **soft-delete guard on levels** — deleting a level with active users returns a 409 `RESOURCE_IN_USE` error that must be surfaced clearly to the admin. Pages have no such guard (hard delete). Additionally, the **Page form** includes a `display_order` field (non-negative integer) and a `route_path` field that must start with `/` and contain no spaces.

**Primary recommendation:** Replicate Phase 2 patterns exactly — same component structure, same service patterns, same form validation approach, same error handling. No new libraries needed.

## User Constraints (from CONTEXT.md)

### Locked Decisions
No CONTEXT.md exists for this phase — no locked decisions from discuss-phase.

### the agent's Discretion
- Component organization within features/ folder
- Specific form validation rules beyond backend constraints
- UI wording for error messages and confirmation dialogs

### Deferred Ideas (OUT OF SCOPE)
- None specified for this phase

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LEVEL-01 | Admin can view paginated list of levels with search and filter by status | Backend GET /api/levels supports ?search, ?is_active, pagination. Existing LevelService.list() already implements this. |
| LEVEL-02 | Admin can create a new level with nama_level, deskripsi, and is_active | Backend POST /api/levels accepts {name, description?, is_active?}. LevelValidator enforces name required, max 100 chars. |
| LEVEL-03 | Admin can edit an existing level | Backend PUT /api/levels/{id} accepts partial updates. Duplicate name check excludes current level. |
| LEVEL-04 | Admin can soft-delete a level (blocked if level has active users) | Backend DELETE /api/levels/{id} checks countActiveUsers(). Returns 409 RESOURCE_IN_USE if > 0 active users. |
| LEVEL-05 | Delete error shows clear message when level is in use | Backend returns error.description: "Cannot delete level. N active user(s) are assigned to this level." ErrorHandlerService already extracts this. |
| PAGE-01 | Admin can view paginated list of pages with search and filter by status | Backend GET /api/pages supports ?search, ?is_active, pagination. Same response shape as levels. |
| PAGE-02 | Admin can create a new page with nama_page, route_path, deskripsi, urutan_tampil, and is_active | Backend POST /api/pages accepts {name, route_path, description?, display_order?, is_active?}. Validator enforces route_path starts with /, no spaces, max 255 chars. |
| PAGE-03 | Admin can edit an existing page | Backend PUT /api/pages/{id} accepts partial updates. Duplicate route_path check excludes current page. |
| PAGE-04 | Admin can delete a page with confirmation dialog | Backend DELETE /api/pages/{id} is hard delete (no referential guard). Returns {message: "Page deleted"}. |
| PAGE-05 | Form validates route_path uniqueness against backend | Backend returns 409 DUPLICATE_ENTRY with error.field="route_path" on conflict. Same pattern as USER-05. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Level list view | Browser / Client | API / Backend | Client renders MatTable, backend provides paginated data |
| Level CRUD operations | API / Backend | Browser / Client | Backend enforces validation, soft-delete guard, uniqueness. Client sends requests and displays results |
| Page list view | Browser / Client | API / Backend | Client renders MatTable, backend provides paginated data |
| Page CRUD operations | API / Backend | Browser / Client | Backend enforces validation, route_path uniqueness, DB constraints. Client sends requests and displays results |
| Form validation (client-side) | Browser / Client | — | Reactive Forms validators for UX; backend validates independently |
| Error display | Browser / Client | — | ErrorHandlerService maps backend errors to MatSnackBar |
| Delete confirmation | Browser / Client | — | ConfirmDialogService (UX only); backend enforces authorization |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @angular/material | 20.2.14 [VERIFIED: npm registry] | Component library | Already installed. MatTable, MatPaginator, MatSelect, MatFormField, MatInput, MatChip, MatDialog, MatSnackBar, MatSlideToggle, MatButton, MatIcon — all needed for list + form components. |
| @angular/cdk | 20.2.14 [VERIFIED: npm registry] | Low-level primitives | Ships with Material. MatTable extends CdkTable. Already installed. |
| @angular/forms | 20.3.0 [VERIFIED: npm registry] | Reactive Forms | Already installed. FormBuilder, FormGroup, Validators — used for all CRUD forms in Phase 2. |
| @angular/common/http | 20.3.0 [VERIFIED: npm registry] | HTTP client | Already installed. HttpClient, HttpParams — used by all services. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| RxJS | 7.8.0 [VERIFIED: npm registry] | Reactive streams | Already installed. Used for debounceTime on search, map on HTTP responses. |
| Angular Signals (built-in) | 20.3.0 [VERIFIED: npm registry] | Component state | Already installed. signal(), computed() — Phase 2 pattern for all component state. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| MatTable + manual pagination | Angular Material Paginator with MatTableDataSource | MatTableDataSource is client-side only — backend pagination is required by API contract. Current pattern (manual params + signal state) is correct. |
| Reactive Forms | Template-driven forms | PROJECT.md decision: Reactive Forms for all CRUD forms. Better validation control. |

**Installation:** No new packages needed. All dependencies already installed from Phase 1/2.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| @angular/material | npm | 10+ yrs | 1.2M/wk | github.com/angular/components | [OK] | Approved |
| @angular/cdk | npm | 10+ yrs | 1.5M/wk | github.com/angular/components | [OK] | Approved |
| @angular/forms | npm | 10+ yrs | 2.5M/wk | github.com/angular/angular | [OK] | Approved |
| @angular/common | npm | 10+ yrs | 2.5M/wk | github.com/angular/angular | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*No new packages are installed in this phase. All packages are Angular core/Material, verified in Phase 1 research.*

## Architecture Patterns

### System Architecture Diagram

```
Admin Browser
    │
    ├── /admin/levels (route)
    │   ├── LevelListComponent
    │   │   ├── LevelService.list() ──GET /api/levels──► Backend (Slim PHP)
    │   │   │                                              │
    │   │   │                                              ├── LevelRepository.findPaginated()
    │   │   │                                              │   └── PostgreSQL: levels table
    │   │   │                                              │
    │   │   │                                              └── Returns {data: Level[], meta: {...}}
    │   │   │
    │   │   ├── LevelService.create() ──POST /api/levels──► Backend
    │   │   │                                                ├── LevelValidator.validate()
    │   │   │                                                ├── LevelRepository.existsByNama() → 409 if dup
    │   │   │                                                └── LevelRepository.create()
    │   │   │
    │   │   ├── LevelService.update() ──PUT /api/levels/:id──► Backend
    │   │   │
    │   │   └── LevelService.delete() ──DELETE /api/levels/:id──► Backend
    │   │                                                        ├── countActiveUsers() → 409 if > 0
    │   │                                                        └── LevelRepository.delete() (soft)
    │   │
    │   └── LevelFormComponent
    │       ├── ReactiveForm (name, description, is_active)
    │       ├── Server error mapping (409/422 → form control errors)
    │       └── ConfirmDialogService → LevelService.delete()
    │
    ├── /admin/pages (route)
    │   ├── PageListComponent
    │   │   ├── PageService.list() ──GET /api/pages──► Backend
    │   │   ├── PageService.create() ──POST /api/pages──► Backend
    │   │   ├── PageService.update() ──PUT /api/pages/:id──► Backend
    │   │   └── PageService.delete() ──DELETE /api/pages/:id──► Backend (hard delete)
    │   │
    │   └── PageFormComponent
    │       ├── ReactiveForm (name, route_path, description, display_order, is_active)
    │       ├── route_path validation: starts with /, no spaces, max 255
    │       ├── display_order validation: non-negative integer
    │       └── Server error mapping (409/422 → form control errors)
    │
    └── Shared Services (Phase 2)
        ├── ErrorHandlerService → MatSnackBar
        ├── ConfirmDialogService → MatDialog
        └── LoadingService → signal-based keyed loading
```

### Recommended Project Structure

```
src/app/
├── features/
│   ├── levels/
│   │   ├── level-list/
│   │   │   ├── level-list.component.ts       # MatTable + search + status filter
│   │   │   ├── level-list.component.html
│   │   │   ├── level-list.component.scss
│   │   │   └── level-list.component.spec.ts
│   │   └── level-form/
│   │       ├── level-form.component.ts        # Create/Edit form (shared component)
│   │       ├── level-form.component.html
│   │       ├── level-form.component.scss
│   │       └── level-form.component.spec.ts
│   └── pages/
│       ├── page-list/
│       │   ├── page-list.component.ts         # MatTable + search + status filter
│       │   ├── page-list.component.html
│       │   ├── page-list.component.scss
│       │   └── page-list.component.spec.ts
│       └── page-form/
│           ├── page-form.component.ts          # Create/Edit form (shared component)
│           ├── page-form.component.html
│           ├── page-form.component.scss
│           └── page-form.component.spec.ts
├── shared/
│   ├── services/
│   │   ├── level.service.ts                   # EXTEND: add create, update, delete
│   │   ├── level.service.spec.ts              # EXTEND: add tests for new methods
│   │   ├── page.service.ts                    # NEW: full CRUD service
│   │   └── page.service.spec.ts               # NEW: tests
│   └── models/
│       └── page.model.ts                      # NEW: Page, PageForm, request interfaces
└── layout/
    └── admin.routes.ts                        # EXTEND: add /levels and /pages routes
```

### Pattern 1: List Component (Replicate UserListComponent)
**What:** Paginated table with search, status filter, and action buttons (edit/delete)
**When to use:** Every list view (levels, pages)
**Example:**
```typescript
// Source: src/app/features/users/user-list/user-list.component.ts (Phase 2)
@Component({
  selector: 'app-level-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatTableModule, MatPaginatorModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatChipsModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatCardModule,
  ],
  templateUrl: './level-list.component.html',
  styleUrls: ['./level-list.component.scss'],
})
export class LevelListComponent implements OnInit, OnDestroy {
  private readonly levelService = inject(LevelService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);

  readonly items = signal<Level[]>([]);
  readonly totalItems = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(15);
  readonly isLoading = signal(false);
  readonly statusFilter = signal<boolean | null>(null);
  private searchQuery = signal('');

  readonly displayedColumns: string[] = ['name', 'description', 'status', 'actions'];

  // ... loadItems(), onSearch(), onStatusFilter(), onPageChange(), handleDelete()
}
```

### Pattern 2: Form Component (Replicate UserFormComponent)
**What:** Shared create/edit form using Reactive Forms with server error mapping
**When to use:** Every CRUD form (level create/edit, page create/edit)
**Example:**
```typescript
// Source: src/app/features/users/user-form/user-form.component.ts (Phase 2)
@Component({
  selector: 'app-level-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressSpinnerModule,
  ],
  templateUrl: './level-form.component.html',
  styleUrls: ['./level-form.component.scss'],
})
export class LevelFormComponent implements OnInit {
  private readonly levelService = inject(LevelService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  private readonly levelId = signal<number | null>(null);
  readonly isEditMode = computed(() => this.levelId() !== null);
  readonly pageTitle = computed(() => (this.isEditMode() ? 'Edit Level' : 'Create Level'));
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly serverErrors = signal<Record<string, string[]>>({});

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    is_active: [true],
  });

  // ... ngOnInit(), loadLevel(), onSubmit(), handleSubmitError()
}
```

### Pattern 3: Service CRUD Extension (Extend LevelService, Create PageService)
**What:** HTTP service with list, getById, create, update, delete methods
**When to use:** Every resource service
**Example:**
```typescript
// Source: src/app/shared/services/user.service.ts (Phase 2) — pattern to replicate
@Injectable({ providedIn: 'root' })
export class PageService {
  private readonly http = inject(HttpClient);

  list(params: PageListParams): Observable<PaginatedResponse<Page>> { ... }
  getById(id: number): Observable<Page> { ... }
  create(data: CreatePageRequest): Observable<Page> { ... }
  update(id: number, data: UpdatePageRequest): Observable<Page> { ... }
  delete(id: number): Observable<{ message: string }> { ... }
}
```

### Anti-Patterns to Avoid
- **Client-side pagination:** Backend provides pagination; do NOT use MatTableDataSource with client-side filtering. Use signal-based state + HTTP params.
- **Async validators for uniqueness:** Phase 2 decision — use server 409/422 responses on submit, not async validators. Simpler and matches backend error format.
- **Separate create/edit components:** Use a single form component that detects edit mode from route params (Phase 2 pattern). Reduces code duplication.
- **localStorage for anything:** Phase 1 decision — in-memory + sessionStorage only. Never localStorage.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confirmation dialogs | Custom modal component | ConfirmDialogService (Phase 2) | Already built, tested, and used for user delete. MatDialog wrapper with Observable<boolean> return. |
| Error display | Custom error component per page | ErrorHandlerService (Phase 2) | Already extracts backend error.description and maps form errors. MatSnackBar with 5s duration. |
| Loading state | Per-component boolean flags | LoadingService (Phase 2) | Keyed signal-based loading. Supports multiple concurrent operations. |
| Pagination logic | Manual page calculations | MatPaginator + signal state | Phase 2 pattern: currentPage signal, pageSize signal, onPageChange handler. |
| Search debouncing | setTimeout/clearTimeout | RxJS Subject + debounceTime(300) | Phase 2 pattern. Clean, cancellable, distinctUntilChanged. |
| HTTP response mapping | Direct backend response in templates | Service-level map() to PaginatedResponse<T> | Backend returns {data, meta: {page, per_page, total, total_pages}}. Map to {data, total, page, perPage} at service layer. |

**Key insight:** Phase 2 established a complete CRUD infrastructure (services, shared components, error handling, confirmation dialogs, loading state). Phase 3 is purely about replicating these patterns for two new resources. No new infrastructure is needed.

## Runtime State Inventory

> This is a greenfield feature phase (new components/services), not a rename/refactor/migration. No runtime state inventory needed.

**Nothing found in category:** N/A — Phase 3 creates new resources, does not modify existing ones.

## Common Pitfalls

### Pitfall 1: Level Soft-Delete Error Not Surfaced Clearly
**What goes wrong:** Admin tries to delete a level with active users. Backend returns 409 `RESOURCE_IN_USE` with message "Cannot delete level. N active user(s) are assigned to this level." If the error handler only shows a generic message, the admin won't understand why deletion failed.
**Why it happens:** The ErrorHandlerService already extracts `error.error.description` from the backend response — this should work automatically. The risk is if the backend returns a different error shape for this specific case.
**How to avoid:** Verify the backend error shape matches the existing `ApiErrorResponse` interface. From LevelAction.php line 169-172, it throws `ResourceInUseException` which maps to the standard error format with `error.description` and `error.field`. The existing ErrorHandlerService.handle() will display this correctly.
**Warning signs:** If snackbar shows "An unexpected error occurred" instead of the actual message, the error shape has changed.

### Pitfall 2: Page route_path Validation Mismatch
**What goes wrong:** Frontend allows route_path values that backend rejects (e.g., missing leading `/`, containing spaces, exceeding 255 chars).
**Why it happens:** Client-side validators must match backend PageValidator rules exactly. Backend enforces: starts with `/`, no spaces, max 255 chars, required on create.
**How to avoid:** Add client-side validators matching backend:
- `Validators.required` (create only)
- `Validators.maxLength(255)`
- Custom validator: `Validators.pattern(/^\/\S*$/)` (starts with `/`, no spaces)
- Server error mapping for 409 DUPLICATE_ENTRY on route_path
**Warning signs:** Form submits successfully but backend returns 422 validation errors.

### Pitfall 3: Level name Uniqueness on Edit
**What goes wrong:** Admin edits a level, keeps the same name, but gets "Name already exists" error.
**Why it happens:** Backend LevelAction.php line 133 checks `existsByNama($trimmed, $id)` — it excludes the current level's ID. This is correct. The frontend should NOT add a client-side uniqueness validator (Phase 2 decision: server validation only).
**How to avoid:** Trust backend uniqueness check. Map 409 response to form error on `name` field via existing `handleSubmitError()` pattern.
**Warning signs:** Edit form shows duplicate error when name hasn't changed — indicates backend bug (unlikely, already tested in backend integration tests).

### Pitfall 4: display_order Type Coercion
**What goes wrong:** Frontend sends `display_order` as string instead of number, or sends negative values.
**Why it happens:** HTML number input returns string values. Backend PageAction.php line 96 casts to `(int)`, but frontend should send the correct type.
**How to avoid:** Use `Validators.min(0)` on the form control. Parse value as `Number()` before sending in the payload.
**Warning signs:** Backend returns 422 "Display order must be a non-negative integer".

### Pitfall 5: is_active Boolean Serialization
**What goes wrong:** Frontend sends `is_active` as string `"true"` instead of boolean `true`.
**Why it happens:** MatSlideToggle returns boolean, but if form value is serialized incorrectly (e.g., via JSON.stringify with custom replacer), it may become a string.
**How to avoid:** Use `form.getRawValue()` which preserves boolean types. Backend `filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)` handles both boolean and string, but sending the correct type is cleaner.
**Warning signs:** Backend returns 422 "is_active must be a boolean value" — only happens if value is neither boolean nor recognizable string.

### Pitfall 6: LevelService Already Exists with List Only
**What goes wrong:** Planner creates a new LevelService instead of extending the existing one, causing duplicate services or import conflicts.
**Why it happens:** The existing `LevelService` at `src/app/shared/services/level.service.ts` only has `list()` method. It needs `getById()`, `create()`, `update()`, and `delete()` added.
**How to avoid:** Extend the existing LevelService file. Do NOT create a new file. Update the spec file to add tests for new methods.
**Warning signs:** Two LevelService files exist, or imports reference the wrong one.

## Code Examples

### Level Service — Full CRUD (Extend Existing)
```typescript
// Source: src/app/shared/services/level.service.ts (existing) + backend API contract
// EXTEND this file with the following methods:

interface LevelListParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
}

interface LevelListBackendResponse {
  data: Level[];
  meta: { page: number; per_page: number; total: number; total_pages: number };
}

interface LevelDetailBackendResponse {
  data: Level;
}

// ADD to existing LevelService class:

getById(id: number): Observable<Level> {
  return this.http
    .get<LevelDetailBackendResponse>(`/api/levels/${id}`)
    .pipe(map((response) => response.data));
}

create(data: CreateLevelRequest): Observable<Level> {
  return this.http
    .post<LevelDetailBackendResponse>('/api/levels', data)
    .pipe(map((response) => response.data));
}

update(id: number, data: UpdateLevelRequest): Observable<Level> {
  return this.http
    .put<LevelDetailBackendResponse>(`/api/levels/${id}`, data)
    .pipe(map((response) => response.data));
}

delete(id: number): Observable<{ message: string }> {
  return this.http.delete<{ message: string }>(`/api/levels/${id}`);
}
```

### Page Service — Full CRUD (New)
```typescript
// Source: Backend API contract (README-BE-REPO.md + PageAction.php)
// NEW file: src/app/shared/services/page.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Page } from '../models/page.model';
import type { PaginatedResponse } from '../models/api.model';

interface PageListParams {
  page: number;
  perPage: number;
  search?: string;
  isActive?: boolean;
}

interface PageListBackendResponse {
  data: Page[];
  meta: { page: number; per_page: number; total: number; total_pages: number };
}

interface PageDetailBackendResponse {
  data: Page;
}

@Injectable({ providedIn: 'root' })
export class PageService {
  private readonly http = inject(HttpClient);

  list(params: PageListParams): Observable<PaginatedResponse<Page>> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('per_page', params.perPage);

    if (params.search !== undefined && params.search !== '') {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.isActive !== undefined) {
      httpParams = httpParams.set('is_active', params.isActive ? '1' : '0');
    }

    return this.http.get<PageListBackendResponse>('/api/pages', { params: httpParams }).pipe(
      map((response) => ({
        data: response.data,
        total: response.meta.total,
        page: response.meta.page,
        perPage: response.meta.per_page,
      })),
    );
  }

  getById(id: number): Observable<Page> {
    return this.http
      .get<PageDetailBackendResponse>(`/api/pages/${id}`)
      .pipe(map((response) => response.data));
  }

  create(data: CreatePageRequest): Observable<Page> {
    return this.http
      .post<PageDetailBackendResponse>('/api/pages', data)
      .pipe(map((response) => response.data));
  }

  update(id: number, data: UpdatePageRequest): Observable<Page> {
    return this.http
      .put<PageDetailBackendResponse>(`/api/pages/${id}`, data)
      .pipe(map((response) => response.data));
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/pages/${id}`);
  }
}
```

### Page Model Interfaces (New)
```typescript
// NEW file: src/app/shared/models/page.model.ts
// Source: Backend Page.toApiResponse() + PageValidator rules

export interface Page {
  id: number;
  name: string;
  route_path: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface PageForm {
  name: string;
  route_path: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

export interface CreatePageRequest {
  name: string;
  route_path: string;
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdatePageRequest {
  name?: string;
  route_path?: string;
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
}
```

### Level Model — Add Request Interfaces (Extend Existing)
```typescript
// EXTEND src/app/shared/models/user.model.ts (Level interface already exists)
// Add these interfaces to the same file or a new level.model.ts:

export interface LevelForm {
  name: string;
  description: string;
  is_active: boolean;
}

export interface CreateLevelRequest {
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface UpdateLevelRequest {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}
```

### Admin Routes — Add Level and Page Routes
```typescript
// EXTEND src/app/layout/admin.routes.ts
// Source: Phase 2 pattern — lazy-loaded feature components

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  {
    path: 'users',
    loadComponent: () => import('../features/users/user-list/user-list.component').then(
      (m) => m.UserListComponent,
    ),
  },
  {
    path: 'users/new',
    loadComponent: () => import('../features/users/user-form/user-form.component').then(
      (m) => m.UserFormComponent,
    ),
  },
  {
    path: 'users/:id/edit',
    loadComponent: () => import('../features/users/user-form/user-form.component').then(
      (m) => m.UserFormComponent,
    ),
  },
  // ADD:
  {
    path: 'levels',
    loadComponent: () => import('../features/levels/level-list/level-list.component').then(
      (m) => m.LevelListComponent,
    ),
  },
  {
    path: 'levels/new',
    loadComponent: () => import('../features/levels/level-form/level-form.component').then(
      (m) => m.LevelFormComponent,
    ),
  },
  {
    path: 'levels/:id/edit',
    loadComponent: () => import('../features/levels/level-form/level-form.component').then(
      (m) => m.LevelFormComponent,
    ),
  },
  {
    path: 'pages',
    loadComponent: () => import('../features/pages/page-list/page-list.component').then(
      (m) => m.PageListComponent,
    ),
  },
  {
    path: 'pages/new',
    loadComponent: () => import('../features/pages/page-form/page-form.component').then(
      (m) => m.PageFormComponent,
    ),
  },
  {
    path: 'pages/:id/edit',
    loadComponent: () => import('../features/pages/page-form/page-form.component').then(
      (m) => m.PageFormComponent,
    ),
  },
  { path: '**', redirectTo: 'users' },
];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NgModules + class-based components | Standalone components with `imports: []` | Angular 17+ | Phase 2 already uses standalone. Phase 3 follows same pattern. |
| Class-based HTTP interceptors | Functional interceptors with `withInterceptors()` | Angular 15+ | Phase 1 already uses functional interceptors. |
| Class-based route guards | Functional guards (`CanActivateFn`) | Angular 15+ | Phase 1 already uses functional guards. |
| AsyncValidators for uniqueness | Server 409/422 on submit | Phase 2 decision | Simpler, matches backend error format, no race conditions. |
| MatTableDataSource (client-side) | Signal-based state + HTTP params | Phase 2 decision | Backend pagination required by API contract. |

**Deprecated/outdated:**
- **NgModules:** Angular 20 defaults to standalone. Do NOT use NgModules.
- **Class-based guards/interceptors:** Angular 20 docs show functional patterns as primary.
- **MatTableDataSource for paginated data:** Only use for client-side data. Backend pagination requires manual state management.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Backend `is_active` filter accepts `'1'`/`'0'` string format for levels (same as users) | Code Examples — LevelService list | LOW — LevelAction.php confirms same pattern as UserAction |
| A2 | Page list endpoint supports `?search=` and `?is_active=` query params | Code Examples — PageService list | LOW — PageAction.php confirms both params are supported |
| A3 | Backend returns 409 with `error.field` and `error.description` for level delete guard | Pitfall 1 | LOW — LevelAction.php line 169-172 confirms ResourceInUseException format |
| A4 | No new npm packages needed for this phase | Standard Stack | NONE — all packages already installed from Phase 1/2 |

## Open Questions

1. **Should level list show `deleted_at` status?**
   - What we know: Backend soft-deletes levels (sets `deleted_at`). The `toApiResponse()` does NOT include `deleted_at` field. Soft-deleted levels are excluded from list queries (LevelRepository.findPaginated filters `WHERE deleted_at IS NULL`).
   - What's unclear: Whether soft-deleted levels should be visible in a "deleted items" view.
   - Recommendation: Out of scope for Phase 3. Backend already filters soft-deleted levels from list. If needed later, add a separate "trash" view.

2. **Should page form include a route_path pattern hint?**
   - What we know: Backend requires route_path to start with `/` and contain no spaces.
   - What's unclear: Whether to add a placeholder/hint text in the UI.
   - Recommendation: Add placeholder text like `e.g. /dashboard` and a mat-hint explaining the format. This is a UX detail the planner can decide.

3. **Should level list include a description column?**
   - What we know: Level has `description` field (nullable, text). User list has 5 data columns + actions.
   - What's unclear: Whether description should be shown in the table (could be long text).
   - Recommendation: Include description column but truncate with CSS (`text-overflow: ellipsis`) or show full text on hover. The planner should decide based on expected description length.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Angular dev server | ✓ | v22.x | — |
| npm | Package management | ✓ | 10.x | — |
| Angular CLI | Build/serve | ✓ | 20.3.x | — |
| @angular/material | UI components | ✓ | 20.2.14 | — |
| @angular/cdk | Component primitives | ✓ | 20.2.14 | — |
| Backend API (test-imc-be) | All HTTP calls | ✗ (separate repo) | Slim PHP 4 | Must be running for e2e testing |

**Missing dependencies with fallback:**
- Backend API — separate repo (`test-imc-be`). Must be running via Docker or local for end-to-end testing. Planner should note this as a human checkpoint: "Verify CRUD flows against running backend."

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Karma + Jasmine (via Angular CLI 20.x) |
| Config file | None — uses Angular CLI defaults (`ng test`) |
| Quick run command | `ng test --include='**/features/levels/**/*.spec.ts' --include='**/features/pages/**/*.spec.ts' --watch=false` |
| Full suite command | `ng test --watch=false` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LEVEL-01 | Paginated level list with search/filter | unit | `ng test --include='**/level-list/**/*.spec.ts' --watch=false` | ❌ Wave 0 |
| LEVEL-02 | Create level with validation | unit | `ng test --include='**/level-form/**/*.spec.ts' --watch=false` | ❌ Wave 0 |
| LEVEL-03 | Edit level with validation | unit | Same as LEVEL-02 | ❌ Wave 0 |
| LEVEL-04 | Soft-delete blocked if active users | unit | `ng test --include='**/level-list/**/*.spec.ts' --watch=false` | ❌ Wave 0 |
| LEVEL-05 | Delete error message displayed | unit | Same as LEVEL-04 | ❌ Wave 0 |
| PAGE-01 | Paginated page list with search/filter | unit | `ng test --include='**/page-list/**/*.spec.ts' --watch=false` | ❌ Wave 0 |
| PAGE-02 | Create page with validation | unit | `ng test --include='**/page-form/**/*.spec.ts' --watch=false` | ❌ Wave 0 |
| PAGE-03 | Edit page with validation | unit | Same as PAGE-02 | ❌ Wave 0 |
| PAGE-04 | Delete page with confirmation | unit | Same as PAGE-01 | ❌ Wave 0 |
| PAGE-05 | route_path uniqueness validated | unit | Same as PAGE-02 | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `ng test --include='**/<feature>/**/*.spec.ts' --watch=false`
- **Per wave merge:** `ng test --watch=false`
- **Phase-gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/app/features/levels/level-list/level-list.component.spec.ts` — covers LEVEL-01, LEVEL-04, LEVEL-05
- [ ] `src/app/features/levels/level-form/level-form.component.spec.ts` — covers LEVEL-02, LEVEL-03
- [ ] `src/app/features/pages/page-list/page-list.component.spec.ts` — covers PAGE-01, PAGE-04
- [ ] `src/app/features/pages/page-form/page-form.component.spec.ts` — covers PAGE-02, PAGE-03, PAGE-05
- [ ] `src/app/shared/services/level.service.spec.ts` — EXTEND: add tests for create, update, delete
- [ ] `src/app/shared/services/page.service.spec.ts` — NEW: full CRUD tests
- [ ] `src/app/shared/models/page.model.ts` — NEW: Page interface tests (type-checking only)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT Bearer token via auth interceptor (Phase 1) |
| V3 Session Management | yes | Token refresh queue (Phase 1) |
| V4 Access Control | yes | PermissionMiddleware on all /api/* routes (backend) |
| V5 Input Validation | yes | Reactive Forms validators + backend validation |
| V6 Cryptography | no | No client-side cryptography |

### Known Threat Patterns for Angular + Slim PHP

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via form input | Tampering | Angular auto-escapes template bindings. No innerHTML usage. |
| CSRF | Spoofing | JWT Bearer auth (not cookie-based) — CSRF not applicable. |
| Unauthorized CRUD | Authorization | JwtMiddleware + PermissionMiddleware on backend. Frontend authGuard on /admin route. |
| Level delete bypass | Tampering | ConfirmDialogService is UX only. Backend enforces ResourceInUseException guard. |
| route_path injection | Tampering | Client-side pattern validator + backend unique constraint + PageValidator. |

## Sources

### Primary (HIGH confidence)
- Backend API documentation: `/home/raihan/Documents/kerja/test-imc-fe/README-BE-REPO.md` — full API reference, error types, response formats
- Backend LevelAction.php: `/home/raihan/Documents/kerja/test-imc-be/src/Application/Actions/Level/LevelAction.php` — exact CRUD logic, validation, soft-delete guard
- Backend PageAction.php: `/home/raihan/Documents/kerja/test-imc-be/src/Application/Actions/Page/PageAction.php` — exact CRUD logic, validation
- Backend LevelValidator.php: `/home/raihan/Documents/kerja/test-imc-be/src/Application/Validation/LevelValidator.php` — validation rules
- Backend PageValidator.php: `/home/raihan/Documents/kerja/test-imc-be/src/Application/Validation/PageValidator.php` — validation rules
- Backend Level.php entity: `/home/raihan/Documents/kerja/test-imc-be/src/Domain/Level/Level.php` — toApiResponse() shape
- Backend Page.php entity: `/home/raihan/Documents/kerja/test-imc-be/src/Domain/Page/Page.php` — toApiResponse() shape
- Phase 2 UserListComponent: `src/app/features/users/user-list/user-list.component.ts` — list pattern to replicate
- Phase 2 UserFormComponent: `src/app/features/users/user-form/user-form.component.ts` — form pattern to replicate
- Phase 2 UserService: `src/app/shared/services/user.service.ts` — service pattern to replicate
- Phase 2 LevelService (existing): `src/app/shared/services/level.service.ts` — service to extend
- Phase 2 admin.routes.ts: `src/app/layout/admin.routes.ts` — route pattern to extend
- Angular v20 Official Docs: https://v20.angular.dev (HIGH confidence)
- Angular Material Docs: https://material.angular.dev (HIGH confidence)

### Secondary (MEDIUM confidence)
- Phase 2 plans: `.planning/phases/02-admin-layout-user-crud/02-01-PLAN.md`, `02-02-PLAN.md`, `02-03-PLAN.md` — established patterns and decisions
- Phase 2 verification: `.planning/phases/02-admin-layout-user-crud/VERIFICATION.md` — confirmed working patterns

### Tertiary (LOW confidence)
- None — all claims verified against source code or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified via npm registry, already installed in project
- Architecture: HIGH — patterns directly observed from Phase 2 implementation and backend source code
- Pitfalls: HIGH — derived from actual backend code (LevelAction.php, PageAction.php, validators)
- API contract: HIGH — verified against backend source code (not just documentation)

**Research date:** 2026-05-31
**Valid until:** 30 days — stable stack, no fast-moving dependencies

## RESEARCH COMPLETE

**Phase:** 3 — Level + Page CRUD
**Confidence:** HIGH

### Key Findings
1. **No new dependencies needed** — all Angular Material packages already installed from Phase 1/2
2. **LevelService exists but is incomplete** — has `list()` only, needs `getById()`, `create()`, `update()`, `delete()` added
3. **Backend API contract is identical** for levels and pages — same pagination format `{data, meta: {page, per_page, total, total_pages}}`, same error format `{statusCode, error: {type, description, errors?, field?}}`
4. **Level soft-delete guard** returns 409 `RESOURCE_IN_USE` with clear message — existing ErrorHandlerService handles this automatically
5. **Page form has additional fields** — `route_path` (must start with `/`, no spaces, max 255) and `display_order` (non-negative integer) require specific validators
6. **Phase 2 patterns replicate exactly** — list components, form components, services, routes all follow the same structure

### File Created
`.planning/phases/03-level-page-crud/03-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All packages verified via npm registry, already installed |
| Architecture | HIGH | Patterns directly observed from Phase 2 implementation |
| API Contract | HIGH | Verified against backend source code (LevelAction.php, PageAction.php, validators) |
| Pitfalls | HIGH | Derived from actual backend code and error handling paths |
| Validation | HIGH | Backend validators read directly (LevelValidator.php, PageValidator.php) |

### Open Questions
1. Should level list show description column (truncate or hover)?
2. Should page form include route_path format hint text?
3. Should soft-deleted levels be visible in a "trash" view? (Recommend: out of scope)

### Ready for Planning
Research complete. Planner can now create PLAN.md files. All API contracts verified against backend source code. Phase 2 patterns documented for exact replication.
