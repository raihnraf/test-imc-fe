# IMC Frontend — User Permission Management

Angular 20 admin dashboard untuk manajemen user, level, halaman, dan permission matrix.
Terhubung ke backend Slim PHP + PostgreSQL di repo terpisah (`test-imc-be`).

## Fitur

- Login/logout dengan JWT + auto-refresh token saat expired
- CRUD Users — list dengan search/filter, create/edit form dengan validasi, delete dengan confirmation dialog
- CRUD Levels — list, create/edit, soft-delete (diblokir jika level masih dipakai user)
- CRUD Pages — list, create/edit, delete dengan validasi route_path uniqueness
- Permission Matrix — assign halaman ke level (checkbox grid), override permission per user
- Dynamic sidebar — menu hanya muncul sesuai permission user yang login
- 403 Forbidden page + route guards (block navigasi tanpa permission)
- Responsive layout — sidenav collapsible, tabel sembunyikan kolom sekunder, form stacking di tablet

## Tech Stack

| Teknologi | Versi |
|-----------|-------|
| Angular | 20.x (standalone components, signals, new control flow) |
| TypeScript | 5.9 |
| RxJS | 7.8 |
| Angular Material + CDK | 20.x |
| Karma + Jasmine | Unit testing |

Arsitektur: Angular Signals untuk state, Reactive Forms untuk validasi, Functional Interceptors & Guards.

## Prerequisites

- **Node.js** 20.19+ atau 22.12+ ([download](https://nodejs.org))
- **Backend API** di repo `test-imc-be` harus sudah running (lihat README-BE-REPO.md)

## Quick Start

```bash
# Install dependencies
npm install

# Jalankan dev server
npm start
```

Buka http://localhost:4200. Backend API di-proxy ke `localhost:8080` via `proxy.conf.json`.

## Login

Gunakan credentials default backend:

```
Username: admin
Password: admin123
```

## Scripts

| Command | Keterangan |
|---------|------------|
| `npm start` | Dev server di port 4200 |
| `npm run build` | Production build ke `dist/` |
| `npm test` | Run semua unit test (Karma + ChromeHeadless) |

Run spesifik test file:

```bash
ng test --include='**/user-list/**/*.spec.ts' --watch=false
```

## Project Structure

```
src/app/
├── core/                      # Auth, permission, interceptors, guards
│   ├── services/              # AuthService, PermissionService
│   └── interceptors/          # auth.interceptor, error.interceptor
├── layout/
│   └── admin-layout/          # Sidenav, toolbar, responsive BreakpointObserver
├── features/
│   ├── auth/
│   │   └── login/             # Login page (Reactive Forms)
│   ├── users/
│   │   ├── user-list/         # Tabel user + search/filter/pagination
│   │   └── user-form/         # Form create/edit user
│   ├── levels/
│   │   ├── level-list/        # Tabel level + soft-delete
│   │   └── level-form/        # Form create/edit level
│   ├── pages/
│   │   ├── page-list/         # Tabel halaman
│   │   └── page-form/         # Form create/edit halaman
│   └── permissions/
│       ├── level-permission-matrix/   # Grid checkbox permission per level
│       ├── user-permission-override/  # Override permission per user
│       └── forbidden/                 # Halaman 403
├── shared/
│   ├── models/                # TypeScript interfaces (User, Level, Page, Permission)
│   └── services/              # UserService, LevelService, PageService, helpers
├── app.config.ts              # Provider: router, HTTP interceptors, APP_INITIALIZER
├── app.component.ts           # Root component
└── app.routes.ts              # Route definitions + guards
```

## Phase Status

| Phase | Status |
|-------|--------|
| 1. Auth Foundation | ✅ Complete |
| 2. Admin Layout + User CRUD | ✅ Complete |
| 3. Level + Page CRUD | ✅ Complete |
| 4. Permissions + Dynamic Menu | ✅ Complete |
| 5. Polish + Responsive | ✅ Complete |

36/36 requirements mapped. Detail ada di `.planning/ROADMAP.md`.

## Backend

Backend API repo: `test-imc-be`. Proxy config sudah diatur — semua request ke `/api/*` dan `/auth/*` diarahkan ke `http://localhost:8080`.

### Konfigurasi Backend

Jika backend berjalan di port/host berbeda, edit `proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false
  },
  "/auth": {
    "target": "http://localhost:8080",
    "secure": false
  }
}
```
