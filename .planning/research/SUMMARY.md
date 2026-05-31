# Project Research Summary

**Project:** IMC Frontend — User Permission Management
**Domain:** Angular admin dashboard with JWT auth and permission management
**Researched:** 2026-05-31
**Confidence:** HIGH

## Executive Summary

This is a technical-test-grade admin dashboard for managing user permissions, built with Angular 20.x and Angular Material. The product centers on three CRUD domains (users, levels, pages) and a permission matrix that maps level-to-page access with optional user-level overrides. Authentication uses JWT with access/refresh tokens, and the entire app must be protected by route guards and a dynamic sidebar menu that filters based on user permissions.

The recommended approach is a modern Angular 20.x standalone-component architecture with signal-based state management, functional HTTP interceptors, and functional route guards — deliberately avoiding NgModules, NgRx, and class-based patterns that add boilerplate without value for this scope. Angular Material provides the full UI surface (tables, dialogs, forms, sidenav), and Reactive Forms handle all CRUD input validation. Token storage should use in-memory signals with sessionStorage fallback — never localStorage.

The primary risks are security-related: JWT storage in localStorage (XSS exposure), token refresh race conditions under concurrent 401s, and over-reliance on client-side permission guards without backend enforcement. All three are well-understood problems with clear mitigation strategies: in-memory token storage, a refresh queue in the error interceptor, and documentation that backend must enforce permissions independently.

## Key Findings

### Recommended Stack

Angular 20.x with standalone components, signals, and functional patterns throughout. All core needs are met by framework-builtin APIs — no third-party state management or form libraries required.

**Core technologies:**
- **Angular 20.x**: Application framework — signals-based reactivity, standalone components, functional guards/interceptors reduce boilerplate
- **TypeScript 5.9.x**: Type system — strict mode for admin dashboard data integrity
- **Angular Material 20.x**: UI component library — MatTable, MatDialog, MatSnackBar, MatSidenav cover all dashboard needs
- **Angular Signals (built-in)**: Primary state management — zero dependencies, fine-grained reactivity, framework-native
- **RxJS 7.8.x**: Reactive streams — HTTP Observables, form value changes, interop with signals via `toSignal`/`toObservable`
- **HttpClient + functional interceptors**: API communication — explicit interceptor ordering, no DI unpredictability

**Explicitly excluded:** NgRx (overkill), NgModules (deprecated), Tailwind/Bootstrap (violates PROJECT.md constraint), Axios (HttpClient is superior in Angular), Formly (overkill for 3 CRUD forms), `httpResource` for mutations (Angular docs explicitly warn against it).

### Expected Features

The feature landscape splits cleanly into table stakes (auth, CRUD basics, loading states) and differentiators (dynamic menu, permission matrix). Anti-features are well-defined: no real-time notifications, no i18n, no bulk operations, no analytics.

**Must have (table stakes):**
- Login page with form validation — every admin system needs authentication
- Token auto-refresh on 401 — JWT access tokens expire (15 min per backend)
- CRUD list tables with pagination and sorting — admin data exceeds one screen
- Create/Edit forms with validation — data integrity requirement
- Delete confirmation dialogs — prevent accidental data loss
- Success/error notifications (snackbar) — feedback on every action
- Route protection (auth guard) — prevent unauthenticated access
- Responsive layout — Material sidenav with mobile drawer mode

**Should have (competitive):**
- Dynamic sidebar menu based on permissions — users only see what they can access
- Permission matrix UI — visual grid showing level→page access with user overrides
- Unsaved changes guard on forms — prevent data loss on dirty form navigation
- Server-side error display on forms — backend validation errors shown inline

**Defer (v2+):**
- User-level permission overrides — more complex UI, add after level→page works
- Soft-delete UI indicators — nice to have but not blocking
- Real-time notifications, i18n, audit logging, bulk operations, export — out of scope

### Architecture Approach

The architecture follows a feature-based folder structure with clear layer separation: `core/` for singleton services/interceptors/guards, `shared/` for reusable components and models, `features/` for standalone feature components, and `layout/` for the admin shell. Data flows from login through token storage (signals) to interceptors (attach Bearer token) to feature services (HTTP calls) to component signals (template rendering).

**Major components:**
1. **AuthService** — login/logout, token storage (signals), refresh flow, user profile, permission set
2. **HTTP Interceptor Chain** — auth interceptor (Bearer token), error interceptor (401→refresh, error mapping)
3. **Route Guards** — AuthGuard (CanActivateFn), PermissionGuard (CanActivateChildFn), CanDeactivateFn for dirty forms
4. **AdminLayout + Sidebar** — sidenav shell with dynamic menu filtered by user permissions
5. **Feature Services** — UserService, LevelService, PageService, PermissionService (one per CRUD domain)
6. **CRUD Components** — list (smart container) + table/form (presentational) split per feature

### Critical Pitfalls

1. **JWT in localStorage** — XSS vulnerability. Use in-memory signal + sessionStorage fallback. Never localStorage.
2. **Token refresh race conditions** — Multiple 401s trigger concurrent refreshes. Implement refresh queue with BehaviorSubject to serialize refresh attempts.
3. **Client-side guards as sole security** — Route guards are UX, not security. Backend must enforce permissions on every API endpoint.
4. **Using httpResource for mutations** — Causes duplicate POST/PUT/DELETE on signal changes. Use httpResource only for GET; use HttpClient directly for mutations.
5. **Client-side pagination for large datasets** — MatTable becomes slow with 100+ records. Use server-side pagination from day one with MatPaginator + API params.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Project Scaffold + Auth Foundation
**Rationale:** Without authentication, no other feature works. This phase establishes the core infrastructure every subsequent phase depends on.
**Delivers:** Angular 20 project with Material, app config (functional interceptors), AuthService (login, logout, token signals), auth interceptor, error/refresh interceptor with refresh queue, login page with Reactive Forms, AuthGuard
**Addresses:** Login page, token auto-refresh, logout with cleanup, route protection
**Avoids:** Pitfall 1 (localStorage tokens), Pitfall 2 (refresh race conditions), Pitfall 3 (guards as sole security — document backend requirement)

### Phase 2: Admin Layout + User CRUD
**Rationale:** With auth working, build the admin shell and the primary domain entity. User CRUD exercises the full pattern (list + form + dialog) that will be reused for levels and pages.
**Delivers:** AdminLayout (sidenav + toolbar + router-outlet), SidebarComponent (static menu for now), UserListComponent (MatTable + MatPaginator + MatSort, server-side pagination), UserFormComponent (Reactive Forms, validation), UserService, confirm-dialog shared component
**Addresses:** CRUD tables with pagination/sorting, create/edit forms, delete confirmations, snackbar notifications, loading states
**Avoids:** Pitfall 6 (client-side pagination), Pitfall 7 (unsubscribed Observables — use toSignal), Pitfall 9 (OnPush change detection)

### Phase 3: Level CRUD + Page CRUD
**Rationale:** Reuse the CRUD pattern established in Phase 2. These are prerequisites for the permission matrix. Low complexity — mostly copy-paste-adapt from User CRUD.
**Delivers:** LevelListComponent + LevelFormComponent, PageListComponent + PageFormComponent, LevelService, PageService, soft-delete support for levels (is_active toggle)
**Addresses:** Level CRUD, Page CRUD, soft-delete for levels
**Avoids:** Pitfall 8 (importing entire Material modules — import only what's needed), Pitfall 10 (hardcoded API URL — use environment config)

### Phase 4: Permission Matrix + Dynamic Menu
**Rationale:** The core differentiator. Requires users, levels, and pages to exist first. This is the most complex UI phase and the main value proposition.
**Delivers:** PermissionMatrixComponent (level×page grid with checkboxes), PermissionService, dynamic sidebar menu filtered by user permissions, PermissionGuard (CanActivateChildFn), route data with required permissions
**Addresses:** Permission matrix UI, dynamic sidebar menu, route-level permission checks
**Avoids:** Pitfall 3 (document backend enforcement), Pitfall 5 (map backend error format to form controls)

### Phase 5: Polish + Docker Deployment
**Rationale:** Final polish and demo readiness. Unsaved changes guard, error mapping, Docker setup.
**Delivers:** CanDeactivateFn for dirty forms, server-side error display on forms, error mapping service, Docker + docker-compose config, responsive refinements
**Addresses:** Unsaved changes guard, server-side error display, Docker deployment requirement
**Avoids:** Pitfall 5 (raw backend errors), Pitfall 10 (hardcoded API URL in Docker)

### Phase Ordering Rationale

- **Auth must come first** — every API call requires a token; no CRUD works without it
- **Layout + User CRUD second** — establishes the reusable CRUD pattern and admin shell
- **Level + Page CRUD third** — low-risk pattern reuse, prerequisites for permissions
- **Permission matrix fourth** — depends on all three CRUD domains being complete; highest complexity phase
- **Polish + Docker last** — demo readiness, non-blocking features that enhance the experience

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Permission Matrix):** Complex UI with user-level overrides. The exact matrix rendering strategy (nested tables vs custom grid) and performance with many levels/pages needs spike validation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Auth Foundation):** Well-documented JWT + interceptor patterns. Angular v20 docs cover functional interceptors and guards thoroughly.
- **Phase 2 (User CRUD):** Standard MatTable + Reactive Forms pattern. Angular Material docs are comprehensive.
- **Phase 3 (Level + Page CRUD):** Pattern reuse from Phase 2. No new concepts.
- **Phase 5 (Polish + Docker):** Standard Docker multi-stage build for Angular apps. CanDeactivateFn is well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations verified against Angular v20 official docs (v20.angular.dev). Version compatibility confirmed from official reference. |
| Features | HIGH | Derived directly from PROJECT.md requirements. Feature dependencies are logical and well-understood. |
| Architecture | HIGH | Based on Angular v20 official patterns (standalone components, signals, functional interceptors/guards). Feature-based folder structure is industry standard. |
| Pitfalls | HIGH | Security pitfalls verified against OWASP guidelines and Angular security docs. Performance pitfalls verified against Angular Material docs. |

**Overall confidence:** HIGH

### Gaps to Address

- **Backend API contract details:** Exact request/response shapes, error format structure, and permission string conventions need validation against the actual Slim PHP backend during implementation. The research assumes `{statusCode, error: {type, description, errors?}}` format but this should be confirmed.
- **Refresh token rotation behavior:** Whether the backend rotates refresh tokens (invalidating old ones) affects the refresh queue implementation. If tokens don't rotate, the race condition is less severe.
- **Permission string format:** The exact format of permission identifiers (e.g., `users:read`, `levels:write`) needs to match backend expectations. This should be resolved during Phase 4 planning.

## Sources

### Primary (HIGH confidence)
- Angular v20 Official Docs: https://v20.angular.dev — signals, routing, interceptors, httpResource, guards, version compatibility
- Angular v20 Signals Guide: https://v20.angular.dev/guide/signals — signal-based state management patterns
- Angular v20 HTTP Interceptors: https://v20.angular.dev/guide/http/interceptors — functional interceptor patterns
- Angular v20 httpResource: https://v20.angular.dev/guide/http/http-resource — read-only data fetching, mutation warnings
- Angular v20 Route Guards: https://v20.angular.dev/guide/routing/route-guards — functional guard patterns
- Angular v20 RxJS Interop: https://v20.angular.dev/ecosystem/rxjs-interop — toSignal/toObservable
- Angular v20 Security Guide: https://v20.angular.dev/best-practices/security — XSS, token storage
- Angular Material Docs: https://material.angular.dev — component capabilities and patterns
- OWASP JWT Storage Guidelines: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet_for_Java.html — token storage security
- Angular Components GitHub Releases: https://github.com/angular/components/releases — Material version tracking
- PROJECT.md constraints — Angular Material only, Reactive Forms, Standalone components, Docker deployment

### Secondary (MEDIUM confidence)
- Standard admin dashboard patterns — industry knowledge for feature prioritization and CRUD patterns
- Angular Material Performance: https://material.angular.dev — general best practices for table performance

---
*Research completed: 2026-05-31*
*Ready for roadmap: yes*
