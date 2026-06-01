# IMC Frontend — User Permission Management

Angular 20 admin dashboard untuk manajemen user, level, halaman, dan permission matrix. Frontend ini terhubung ke backend Slim PHP + PostgreSQL di repo terpisah (`test-imc-be`).

## Fitur

**Autentikasi & Otorisasi**
- Login menggunakan username/email + password dengan JWT
- Auto-refresh token saat token expired (401)
- Session restore via APP_INITIALIZER — user tetap login setelah refresh halaman
- Route guard: halaman `/admin` hanya bisa diakses user yang sudah login
- Permission guard: setiap route dicek terhadap permission user, redirect ke `/forbidden` kalau tidak punya akses
- Menu sidebar dinamis: hanya tampil link ke halaman yang user punya permission-nya

**Dashboard**
- Halaman landing setelah login
- Menampilkan card navigasi ke Users, Levels, Pages sesuai permission user
- User tanpa permission apapun tetap bisa masuk dashboard dengan pesan informasi

**CRUD Users**
- List user dengan MatTable: kolom nama lengkap, username, email, level, status
- Fitur search by nama/username/email, filter by level, filter by status (active/inactive)
- Pagination dengan MatPaginator
- Form create/edit user: validasi lengkap (nama, username, email, password, level, status)
- Username dan email uniqueness divalidasi via backend
- Delete user dengan confirmation dialog

**CRUD Levels**
- List level dengan MatTable: kolom nama, deskripsi, status
- Search dan status filter
- Form create/edit level: validasi nama dan deskripsi
- Soft delete: level yang masih dipakai user tidak bisa dihapus langsung

**CRUD Pages**
- List page dengan MatTable: kolom nama, route path, deskripsi, status
- Search, status filter, pagination
- Form create/edit page: validasi route_path uniqueness

**Permission Matrix**
- Level Permission Matrix: grid checkbox — administrator bisa assign halaman mana yang boleh diakses level tertentu
- User Permission Override: administrator bisa memberi akses tambahan atau mencabut akses user tertentu dari level default-nya
- Perubahan permission langsung memengaruhi menu sidebar dan route guard

**UI/UX**
- Responsive layout: sidenav collapsible di mobile/tablet, form stacking, tabel adaptif
- Material Design 3 dengan theming kustom
- Loading spinner, snackbar notification, error message mapping dari backend

## Tech Stack

- Angular 20.x — standalone components, signals, `@if`/`@for` control flow
- TypeScript 5.9 — strict mode enabled
- RxJS 7.8
- Angular Material + CDK 20.x
- Reactive Forms dengan typed forms
- Functional HTTP interceptors dan route guards
- SCSS — Angular Material theming kustom + CSS variables
- Karma + Jasmine — unit testing (default Angular CLI)
- Build: ESBuild via `@angular/build:application` (default Angular 20)
- State: Angular Signals + `rxjs-interop` (`toSignal`, `toObservable`)

## Prasyarat

- Node.js 20.19+ atau 22.12+ (sesuai requirement Angular 20, lihat `package.json` engines)
- Backend API (`test-imc-be`) harus sudah running di `http://localhost:8080`

## Cara Menjalankan

```bash
# Clone repo
git clone <repo-url>
cd test-imc-fe

# Install dependencies
npm install

# Jalankan dev server
npm start
```

Buka http://localhost:4200. Semua request ke `/api/*` dan `/auth/*` otomatis di-proxy ke `http://localhost:8080` via `proxy.conf.json`.

## Login

Gunakan credentials seed data backend:

- Super Admin — `admin` / `admin123` (akses penuh ke semua module)
- Staff — `admin_dua` / `admin123`
- Viewer — `admin_satu` / `admin123`

## Production Build

```bash
npm run build
```

Output di `dist/imc-frontend/`. Builder: ESBuild (default Angular 20).

## Unit Testing

```bash
# Run semua test
npm test

# Run spesifik test file
npx ng test --include='**/user-list/**/*.spec.ts' --watch=false
```

Test framework: Karma + Jasmine (default Angular CLI).

## Struktur Project

```
src/app/
├── core/
│   ├── guards/                  auth.guard.ts, permission.guard.ts
│   ├── interceptors/            auth.interceptor.ts, error.interceptor.ts
│   └── services/                auth.service.ts, permission.service.ts
├── features/
│   ├── auth/login/              Login page (Reactive Forms + JWT)
│   ├── users/
│   │   ├── user-list/           Tabel user + search/filter/pagination
│   │   └── user-form/           Form create/edit user + validasi
│   ├── levels/
│   │   ├── level-list/          Tabel level + soft-delete
│   │   └── level-form/          Form create/edit level
│   ├── pages/
│   │   ├── page-list/           Tabel page + search/filter
│   │   └── page-form/           Form create/edit page
│   └── permissions/
│       ├── level-permission-matrix/    Grid checkbox permission per level
│       └── user-permission-override/   Override permission per user
├── layout/
│   └── admin-layout/            Shell: sidenav + toolbar + router-outlet
├── shared/
│   ├── components/              confirm-dialog, reusable shared components
│   ├── models/                  TypeScript interfaces (User, Level, Page, Permission)
│   ├── pages/
│   │   ├── dashboard/           Landing page setelah login
│   │   └── forbidden/           Halaman 403
│   └── services/                UserService, LevelService, PageService, helpers
├── app.config.ts                Provider: router, HTTP interceptors, APP_INITIALIZER
├── app.routes.ts                Top-level route definitions + auth guard
└── app.ts                       Root component
```

## Konfigurasi Proxy

Jika backend berjalan di port atau host berbeda, edit `proxy.conf.json`:

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

## Kesesuaian dengan Soal Tes

### Soal Tes Programming PT. Integral Mulia Cipta — User Access Management (Angular 20 | Slim PHP | PostgreSQL)

Berikut ketentuan-ketentuan dari soal tes khusus frontend dan realisasinya di codebase ini.

### 2. Stack Wajib — Frontend

Soal: Angular 20, Angular routing, service untuk API, reactive forms atau template-driven forms, route guard untuk halaman terbatas.

Realisasi: Angular 20.3.x (`@angular/core: ^20.3.0`, `@angular/cli: ^20.3.26`). Angular routing dengan lazy loading (`app.routes.ts` + `admin.routes.ts`). Service: `UserService`, `LevelService`, `PageService`, `AuthService`, `PermissionService`. Reactive Forms dengan typed forms (`FormBuilder.nonNullable.group(...)`). Route guard: `authGuard` (CanActivateFn) melindungi `/admin`, `permissionGuard` (CanActivateFn) melindungi setiap child route.

### 3.1 CRUD User — Wajib

Soal: Administrator dapat menambah, melihat, mengubah, dan menghapus user. Minimal field: nama lengkap, username, email, password, level, status aktif/nonaktif. Password hash. Username dan email unik. User tidak aktif tidak boleh login.

Realisasi: User list (`user-list/`) dengan MatTable, search, filter level/status, pagination. User form create/edit (`user-form/`) dengan semua field + validasi Reactive Forms. Delete dengan confirmation dialog. Password hashing di backend, FE hanya kirim plaintext. Uniqueness error dari backend ditampilkan di form via `serverError`. Status aktif/nonaktif toggle di form.

### 3.2 CRUD Level — Wajib

Soal: Administrator dapat menambah, melihat, mengubah, dan menghapus level. Minimal field: nama level, deskripsi, status aktif/nonaktif. Level yang masih dipakai user tidak boleh dihapus langsung.

Realisasi: Level list (`level-list/`) + level form create/edit (`level-form/`) dengan semua field + validasi. Soft delete: FE menampilkan error dari backend jika level masih dipakai, delete gagal dengan snackbar error.

### 3.3 CRUD Page — Wajib

Soal: Administrator dapat menambah, melihat, mengubah, dan menghapus page. Minimal field: nama page, route/path, deskripsi, urutan tampil, status aktif/nonaktif. Route/path unik. Page ditampilkan sebagai menu berdasarkan permission user login.

Realisasi: Page list (`page-list/`) + page form create/edit (`page-form/`) dengan semua field + validasi. Route_path uniqueness: FE menampilkan error dari backend. Menu dinamis: sidebar `navItems` difilter oleh `permissionService.permissions()`, hanya tampil jika user punya akses.

### 3.4 Manajemen User Permission — Wajib

Soal: Administrator menentukan page yang boleh diakses level tertentu. Administrator menentukan page tambahan/pengecualian untuk user. Aplikasi menyediakan tampilan permission matrix dengan checkbox. Perubahan permission langsung memengaruhi menu dan route setelah login ulang atau refresh token.

Realisasi: Level Permission Matrix (`level-permission-matrix/`) — grid checkbox `MatCheckbox` per page per level. User Permission Override (`user-permission-override/`) — toggle per page per user. Permission dimuat saat login (`loadPermissions` di login flow) dan saat token refresh (`refreshPermissions` di error interceptor). Sidebar + `permissionGuard` membaca signal `permissions` yang sama — perubahan langsung berefek tanpa perlu login ulang.

### 3.5 Autentikasi dan Otorisasi — Wajib

Soal: User login menggunakan username/email dan password. Backend mengembalikan token yang dipakai frontend untuk request berikutnya. Backend menolak akses jika user tidak punya permission. Frontend menyembunyikan menu yang tidak boleh diakses dan mencegah navigasi menggunakan route guard.

Realisasi: Login form menerima identifier (username atau email) + password, dikirim ke `/auth/login`. `AuthService` menyimpan access token di signal + sessionStorage, `auth.interceptor.ts` attach `Authorization: Bearer <token>` ke setiap request. Auto-refresh token saat 401 di `error.interceptor.ts`. Sidebar filter: `@if (permissionService.permissions()[item.permission] === true)`. Route guard: `permissionGuard` di setiap child route `/admin/*`, redirect ke `/forbidden` jika tidak punya akses.

### 5. Batasan dan Ketentuan — Frontend

Soal: Boleh menggunakan UI framework (Angular Material, CoreUI, PrimeNG, Bootstrap, Tailwind). Boleh menggunakan library JWT atau session.

Realisasi: Angular Material 20.x dengan Material Design 3 theming kustom (`styles.scss` — CSS variables, font Hanken Grotesk). JWT via backend, FE hanya simpan dan attach token di interceptor.
