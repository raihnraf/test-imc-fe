# Requirements: IMC Frontend — User Permission Management

**Defined:** 2026-05-31
**Core Value:** Admin can fully manage user access control — create users, define roles (levels), list pages, and control who can access what through a permission matrix — all through a clean, functional Angular UI.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can log in with username or email and password
- [ ] **AUTH-02**: JWT access token and refresh token stored securely (in-memory + sessionStorage)
- [ ] **AUTH-03**: Access token auto-refreshed on 401 with request queuing to prevent race conditions
- [ ] **AUTH-04**: User can log out, clearing all session data and tokens
- [ ] **AUTH-05**: Unauthenticated users redirected to login page
- [ ] **AUTH-06**: Login form validates required fields and shows server error messages

### Users

- [ ] **USER-01**: Admin can view paginated list of users with search and filter by level/status
- [ ] **USER-02**: Admin can create a new user with full_name, username, email, password, level, and status
- [ ] **USER-03**: Admin can edit an existing user (password field optional on edit)
- [ ] **USER-04**: Admin can delete a user with confirmation dialog
- [ ] **USER-05**: Form validates username uniqueness and email uniqueness against backend
- [ ] **USER-06**: Inactive users are visually indicated in the list

### Levels

- [ ] **LEVEL-01**: Admin can view paginated list of levels with search and filter by status
- [ ] **LEVEL-02**: Admin can create a new level with nama_level, deskripsi, and is_active
- [ ] **LEVEL-03**: Admin can edit an existing level
- [ ] **LEVEL-04**: Admin can soft-delete a level (blocked if level has active users)
- [ ] **LEVEL-05**: Delete error shows clear message when level is in use

### Pages

- [ ] **PAGE-01**: Admin can view paginated list of pages with search and filter by status
- [ ] **PAGE-02**: Admin can create a new page with nama_page, route_path, deskripsi, urutan_tampil, and is_active
- [ ] **PAGE-03**: Admin can edit an existing page
- [ ] **PAGE-04**: Admin can delete a page with confirmation dialog
- [ ] **PAGE-05**: Form validates route_path uniqueness against backend

### Permissions

- [ ] **PERM-01**: Admin can view and edit permission matrix for a level (checkbox grid: pages × level)
- [ ] **PERM-02**: Admin can grant or deny specific pages for a user (override level permissions)
- [ ] **PERM-03**: Admin can remove a user permission override
- [ ] **PERM-04**: Permission changes take effect immediately (backend checks DB, not JWT claims)

### Navigation & Guards

- [ ] **NAV-01**: Sidebar menu dynamically shows only pages the logged-in user has access to
- [ ] **NAV-02**: Route guards block navigation to routes the user does not have permission for
- [ ] **NAV-03**: Unauthorized navigation attempt shows 403 Forbidden page
- [ ] **NAV-04**: Permission service loads permissions from API on app init (separate from JWT)

### UI Shell

- [ ] **UI-01**: Admin layout with Angular Material sidenav, toolbar, and user menu
- [ ] **UI-02**: Loading indicators shown during all async operations
- [ ] **UI-03**: Error notifications displayed via MatSnackBar for all API errors
- [ ] **UI-04**: Confirmation dialogs shown before destructive actions (delete, soft-delete)
- [ ] **UI-05**: Reactive forms with field-level validation and server error mapping
- [ ] **UI-06**: Responsive layout works on desktop and tablet screen sizes

## v2 Requirements

### Differentiators (Deferred)

- **AUTH-07**: Session timeout warning before auto-logout
- **PERM-05**: Visual diff showing permission changes before saving
- **PERM-06**: Bulk assign/remove pages for a level
- **UI-07**: Dashboard overview with stats cards (total users, levels, pages)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend API development | Backend already exists in `test-imc-be` repo |
| Mobile app | Web-first, desktop admin panel for technical test |
| OAuth/SSO login | Backend only supports username/email + password |
| 2FA / MFA | Not required by technical test spec |
| Role hierarchy | Backend has flat level structure, no parent-child |
| ABAC (attribute-based access) | Backend uses RBAC only |
| Dark mode | Not required for demo |
| i18n/multi-language | English/Indonesian sufficient |
| File uploads | No file upload endpoints in backend |
| Real-time notifications | Not required for permission management |
| CSV export / reports | Not in technical test spec |
| Audit trail / activity log | Backend does not log permission changes |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| NAV-04 | Phase 1 | Pending |
| USER-01 | Phase 2 | Pending |
| USER-02 | Phase 2 | Pending |
| USER-03 | Phase 2 | Pending |
| USER-04 | Phase 2 | Pending |
| USER-05 | Phase 2 | Pending |
| USER-06 | Phase 2 | Pending |
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 2 | Pending |
| UI-03 | Phase 2 | Pending |
| UI-04 | Phase 2 | Pending |
| UI-05 | Phase 2 | Pending |
| LEVEL-01 | Phase 3 | Pending |
| LEVEL-02 | Phase 3 | Pending |
| LEVEL-03 | Phase 3 | Pending |
| LEVEL-04 | Phase 3 | Pending |
| LEVEL-05 | Phase 3 | Pending |
| PAGE-01 | Phase 3 | Pending |
| PAGE-02 | Phase 3 | Pending |
| PAGE-03 | Phase 3 | Pending |
| PAGE-04 | Phase 3 | Pending |
| PAGE-05 | Phase 3 | Pending |
| PERM-01 | Phase 4 | Pending |
| PERM-02 | Phase 4 | Pending |
| PERM-03 | Phase 4 | Pending |
| PERM-04 | Phase 4 | Pending |
| NAV-01 | Phase 4 | Pending |
| NAV-02 | Phase 4 | Pending |
| NAV-03 | Phase 4 | Pending |
| UI-06 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-31*
*Last updated: 2026-05-31 after initial definition*
