# ROADMAP: IMC Frontend — User Permission Management

**Created:** 2026-05-31
**Milestone:** v1
**Phases:** 5
**Granularity:** standard
**Coverage:** 36/36 requirements mapped ✓

---

## Phases

- [ ] **Phase 1: Auth Foundation** — Users can log in, tokens auto-refresh, and unauthenticated access is blocked
- [ ] **Phase 2: Admin Layout + User CRUD** — Admin shell with sidenav, full user management (list/create/edit/delete), and shared UI patterns
- [ ] **Phase 3: Level + Page CRUD** — Admin can manage levels (with soft-delete) and pages/menus
- [ ] **Phase 4: Permissions + Dynamic Menu** — Permission matrix UI for levels, user-level overrides, and dynamic sidebar filtered by permissions
- [ ] **Phase 5: Polish + Responsive** — Responsive layout works on desktop and tablet, all edge cases handled

---

## Phase Details

### Phase 1: Auth Foundation
**Goal:** Users can authenticate, tokens are managed securely, and unauthenticated access is blocked
**Depends on:** Nothing (first phase)
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, NAV-04
**Success Criteria** (what must be TRUE):
  1. User can log in with username/email and password, and sees server validation errors for invalid credentials
  2. User stays authenticated across page navigations within the session (token attached to every API call)
  3. When access token expires, the next API call automatically refreshes it without user intervention
  4. User can log out from any page, and all session data is cleared (redirected to login)
  5. Unauthenticated user attempting to access any protected route is redirected to the login page
**Plans:** 3 plans

Plans:
- [ ] 01-auth-foundation-01-PLAN.md — Scaffold Angular 20 + Material, create API models, implement signal-based AuthService with login/logout/refresh/session-restore
- [ ] 01-auth-foundation-02-PLAN.md — Implement auth interceptor (Bearer token), error interceptor (401 refresh queue), auth guard, permission service
- [ ] 01-auth-foundation-03-PLAN.md — Build login UI with Reactive Forms + Material, wire app routes with guards, register interceptors, session restoration via APP_INITIALIZER

### Phase 2: Admin Layout + User CRUD
**Goal:** Admin can manage users through a complete CRUD interface within an admin shell
**Depends on:** Phase 1
**Requirements:** USER-01, USER-02, USER-03, USER-04, USER-05, USER-06, UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. Admin sees a paginated, searchable list of users with inactive users visually distinguished
  2. Admin can create a new user with full validation (required fields, username/email uniqueness checked against backend)
  3. Admin can edit an existing user (password field optional) and save changes
  4. Admin can delete a user after confirming via dialog, and user is removed from the list
  5. All async operations show loading indicators, errors display via snackbar, and forms show field-level validation with server error mapping
**Plans:** TBD
**UI hint**: yes

### Phase 3: Level + Page CRUD
**Goal:** Admin can manage levels and pages through the same CRUD patterns established in Phase 2
**Depends on:** Phase 2
**Requirements:** LEVEL-01, LEVEL-02, LEVEL-03, LEVEL-04, LEVEL-05, PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05
**Success Criteria** (what must be TRUE):
  1. Admin can view, search, and filter a paginated list of levels with status indicators
  2. Admin can create and edit levels with nama_level, deskripsi, and is_active fields
  3. Admin can soft-delete a level, and receives a clear error message if the level has active users
  4. Admin can view, search, and filter a paginated list of pages
  5. Admin can create, edit, and delete pages with validation (route_path uniqueness checked against backend)
**Plans:** TBD
**UI hint**: yes

### Phase 4: Permissions + Dynamic Menu
**Goal:** Admin can control page access through permission matrices and the sidebar reflects user permissions
**Depends on:** Phase 3
**Requirements:** PERM-01, PERM-02, PERM-03, PERM-04, NAV-01, NAV-02, NAV-03
**Success Criteria** (what must be TRUE):
  1. Admin can view and edit a permission matrix for a level (checkbox grid showing pages × level access)
  2. Admin can grant or deny specific pages for an individual user, overriding their level permissions
  3. Admin can remove a user-level permission override, reverting to level defaults
  4. Sidebar menu dynamically shows only the pages the logged-in user has access to
  5. Attempting to navigate to a route without permission shows a 403 Forbidden page (not a broken page)
**Plans:** TBD
**UI hint**: yes

### Phase 5: Polish + Responsive
**Goal:** The application works smoothly across desktop and tablet screen sizes
**Depends on:** Phase 4
**Requirements:** UI-06
**Success Criteria** (what must be TRUE):
  1. Admin layout (sidenav, toolbar, content area) adapts cleanly to tablet-width screens without horizontal scrolling
  2. CRUD tables and forms remain usable and readable on tablet screen sizes
  3. Sidebar collapses/expands appropriately on smaller screens
**Plans:** TBD
**UI hint**: yes

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth Foundation | 3/3 | Planned | - |
| 2. Admin Layout + User CRUD | 0/0 | Not started | - |
| 3. Level + Page CRUD | 0/0 | Not started | - |
| 4. Permissions + Dynamic Menu | 0/0 | Not started | - |
| 5. Polish + Responsive | 0/0 | Not started | - |

---

## Coverage Map

| Requirement | Phase | Description |
|-------------|-------|-------------|
| AUTH-01 | Phase 1 | User can log in with username or email and password |
| AUTH-02 | Phase 1 | JWT access token and refresh token stored securely |
| AUTH-03 | Phase 1 | Access token auto-refreshed on 401 with request queuing |
| AUTH-04 | Phase 1 | User can log out, clearing all session data and tokens |
| AUTH-05 | Phase 1 | Unauthenticated users redirected to login page |
| AUTH-06 | Phase 1 | Login form validates required fields and shows server error messages |
| NAV-04 | Phase 1 | Permission service loads permissions from API on app init |
| USER-01 | Phase 2 | Admin can view paginated list of users with search and filter |
| USER-02 | Phase 2 | Admin can create a new user with full validation |
| USER-03 | Phase 2 | Admin can edit an existing user |
| USER-04 | Phase 2 | Admin can delete a user with confirmation dialog |
| USER-05 | Phase 2 | Form validates username/email uniqueness against backend |
| USER-06 | Phase 2 | Inactive users are visually indicated in the list |
| UI-01 | Phase 2 | Admin layout with Angular Material sidenav, toolbar, and user menu |
| UI-02 | Phase 2 | Loading indicators shown during all async operations |
| UI-03 | Phase 2 | Error notifications displayed via MatSnackBar for all API errors |
| UI-04 | Phase 2 | Confirmation dialogs shown before destructive actions |
| UI-05 | Phase 2 | Reactive forms with field-level validation and server error mapping |
| LEVEL-01 | Phase 3 | Admin can view paginated list of levels with search and filter |
| LEVEL-02 | Phase 3 | Admin can create a new level with nama_level, deskripsi, and is_active |
| LEVEL-03 | Phase 3 | Admin can edit an existing level |
| LEVEL-04 | Phase 3 | Admin can soft-delete a level (blocked if level has active users) |
| LEVEL-05 | Phase 3 | Delete error shows clear message when level is in use |
| PAGE-01 | Phase 3 | Admin can view paginated list of pages with search and filter |
| PAGE-02 | Phase 3 | Admin can create a new page with all required fields |
| PAGE-03 | Phase 3 | Admin can edit an existing page |
| PAGE-04 | Phase 3 | Admin can delete a page with confirmation dialog |
| PAGE-05 | Phase 3 | Form validates route_path uniqueness against backend |
| PERM-01 | Phase 4 | Admin can view and edit permission matrix for a level |
| PERM-02 | Phase 4 | Admin can grant or deny specific pages for a user |
| PERM-03 | Phase 4 | Admin can remove a user permission override |
| PERM-04 | Phase 4 | Permission changes take effect immediately |
| NAV-01 | Phase 4 | Sidebar menu dynamically shows only accessible pages |
| NAV-02 | Phase 4 | Route guards block navigation to unauthorized routes |
| NAV-03 | Phase 4 | Unauthorized navigation attempt shows 403 Forbidden page |
| UI-06 | Phase 5 | Responsive layout works on desktop and tablet screen sizes |

**Coverage:** 36/36 v1 requirements mapped ✓
