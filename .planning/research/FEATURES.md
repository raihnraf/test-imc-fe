# Feature Landscape

**Domain:** Angular admin dashboard with JWT auth and permission management
**Researched:** 2026-05-31

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Login page with form validation | Every admin system needs authentication | Low | Email/username + password, remember me optional |
| Token auto-refresh on 401 | JWT access tokens expire (15 min per backend) | Medium | Interceptor-based, transparent to user |
| Logout with token cleanup | Security requirement | Low | Clear tokens, redirect to login |
| CRUD list tables with pagination | Admin data always exceeds one screen | Low | MatTable + MatPaginator, server-side pagination |
| CRUD list tables with sorting | Users expect to sort by name, date, status | Low | MatSort, server-side sorting |
| Create/Edit forms with validation | Data integrity requirement | Medium | Reactive Forms, field-level and form-level validation |
| Delete confirmation dialogs | Prevent accidental data loss | Low | MatDialog with confirm/cancel |
| Success/error notifications (snackbar) | Feedback on every action | Low | MatSnackBar for create, update, delete outcomes |
| Loading states during API calls | UX requirement for async operations | Low | Spinner or progress bar during HTTP requests |
| Route protection (auth guard) | Prevent unauthenticated access | Low | CanActivateFn redirecting to /login |
| Responsive layout | Admin panels used on various screen sizes | Low | Material sidenav with mobile drawer mode |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dynamic sidebar menu based on permissions | Users only see what they can access — cleaner UX, security by obscurity | Medium | Menu items filtered by user's permission set at render time |
| Permission matrix UI | Visual grid showing level→page access with user overrides | High | Complex UI: matrix table with checkboxes, level defaults vs user overrides |
| Soft-delete for levels | Prevent accidental deletion of levels that have assigned users | Low | Toggle is_active flag, filter deleted items from lists |
| Unsaved changes guard on forms | Prevent data loss when navigating away from dirty forms | Low | CanDeactivateFn checking form.dirty state |
| Server-side error display on forms | Backend validation errors shown inline on form fields | Medium | Map backend `{errors: [{field, message}]}` to FormControl.setErrors() |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time notifications | PROJECT.md out of scope; adds WebSocket complexity | Not needed for permission management |
| Multi-language/i18n | PROJECT.md out of scope; English/Indonesian sufficient for demo | Hardcode English labels |
| User profile editing | Not in requirements | Skip unless explicitly requested |
| Password reset flow | Not in requirements; backend may not support it | Skip |
| Audit logging | Not in requirements | Skip |
| Bulk operations (bulk delete, bulk assign) | Not in requirements; adds complexity | Single-item CRUD is sufficient |
| Export to CSV/PDF | Not in requirements | Skip |
| Dashboard analytics/charts | Not in requirements | Skip |

## Feature Dependencies

```
Login/Auth → All CRUD operations (auth token required for API calls)
User CRUD → Permission Matrix (need users to assign permissions)
Level CRUD → Permission Matrix (need levels to assign page access)
Page CRUD → Permission Matrix (need pages to assign to levels/users)
Permission Matrix → Dynamic Menu (menu items filtered by permissions)
Permission Matrix → Route Guards (guards check permissions)
```

## MVP Recommendation

Prioritize:
1. **Login + Auth interceptors** — Without auth, nothing else works
2. **User CRUD (list + create + edit)** — Primary domain entity
3. **Level CRUD + Page CRUD** — Prerequisites for permissions
4. **Permission matrix (level→pages only)** — Core differentiator
5. **Route guards + dynamic menu** — Security polish

Defer:
- **User-level permission overrides** — Add after level→page permissions work. More complex UI, can be done as a follow-up.
- **Soft-delete UI indicators** — Nice to have but not blocking. Levels can be hard-deleted for v1 if simpler.
- **Unsaved changes guard** — Polish feature, not core functionality.

## Sources

- PROJECT.md requirements (HIGH confidence)
- Angular Material component capabilities: https://material.angular.dev (HIGH confidence)
- Standard admin dashboard patterns (MEDIUM confidence — industry knowledge)
