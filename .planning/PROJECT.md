# IMC Frontend — User Permission Management

## What This Is

Angular 20 frontend application for the IMC User Permission Management system. It connects to an existing Slim PHP + PostgreSQL backend API (in a separate repo `test-imc-be`) and provides a complete admin interface for managing users, levels, pages, and permission matrices. Built for a fullstack technical test demo — runs locally or via Docker.

## Core Value

Admin can fully manage user access control — create users, define roles (levels), list pages, and control who can access what through a permission matrix — all through a clean, functional Angular UI.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User authentication with JWT (login, token refresh, logout)
- [ ] CRUD User — create, list, edit, delete users with validation
- [ ] CRUD Level — create, list, edit, soft-delete levels
- [ ] CRUD Page — create, list, edit, delete pages/menus
- [ ] Permission Matrix — assign pages to levels, override per user
- [ ] Route guards — protect routes based on user permissions
- [ ] Dynamic menu — show/hide sidebar menu items based on permission
- [ ] Responsive admin UI with Angular Material components

### Out of Scope

- [ ] Backend API development — backend already exists in `test-imc-be` repo
- [ ] Mobile app — web-first, desktop admin panel
- [ ] Real-time notifications — not required for permission management
- [ ] Multi-language/i18n — English/Indonesian sufficient for demo

## Context

- **Backend repo:** `test-imc-be` (Slim PHP 4 + PostgreSQL 15)
- **Backend API:** Running on localhost:8080 (Docker or local)
- **Default admin credentials:** `admin` / `admin123`
- **API format:** JSON with consistent error format `{statusCode, error: {type, description, errors?}}`
- **Auth:** JWT access token (15 min) + refresh token (7 days)
- **This is a technical test demo project** — quality of code structure, validation, and security matters
- **UI framework:** Angular Material only (no Tailwind, no additional CSS framework)

## Constraints

- **Tech stack**: Angular 20 frontend only — backend is fixed and already built
- **Timeline**: Technical test submission — needs to be complete and presentable
- **API compatibility**: Must match existing backend API contract exactly (endpoints, request/response format)
- **Local development**: Must run locally or via Docker for demo purposes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Angular Material only | Clean, official Angular components, sufficient for admin UI | — Pending |
| Reactive Forms | Better validation control for complex forms (user, level, page) | — Pending |
| Standalone components | Angular 20 best practice, no NgModules | — Pending |
| HttpClient with interceptors | JWT token attachment, error handling, refresh logic | — Pending |
| Route guards for permissions | Prevent unauthorized navigation at router level | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-31 after initialization*
