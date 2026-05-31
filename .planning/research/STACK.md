# Technology Stack

**Project:** IMC Frontend — User Permission Management
**Researched:** 2026-05-31

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular | 20.x | Application framework | Latest LTS-aligned version. Signals-based reactivity, standalone components (no NgModules), functional route guards, functional HTTP interceptors — all reduce boilerplate compared to v17 and earlier. Official docs: v20.angular.dev |
| TypeScript | 5.9.x | Type system | Required by Angular 20.x (>=5.9.0 <6.0.0). Strict mode recommended for admin dashboard data integrity. |
| RxJS | 7.8.x | Reactive streams | Required by Angular 20.x (^6.5.3 \|\| ^7.4.0). v7.x preferred for better tree-shaking and `takeUntilDestroyed` operator. Used for HTTP Observables, form value changes, and interop with signals via `toSignal`/`toObservable`. |

### UI Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular Material + CDK | 20.x | Component library | Official Angular component suite. Provides MatTable (with MatPaginator, MatSort), MatDialog, MatSnackBar, MatSidenav, MatToolbar, MatFormField, MatInput, MatSelect, MatCheckbox, MatButton, MatMenu, MatTabs, MatCard, MatIcon — everything needed for an admin dashboard. Matches PROJECT.md constraint: "Angular Material only." |
| Angular CDK | 20.x | Low-level behavioral primitives | Ships with Angular Material. Provides data table infrastructure, overlay system, drag-drop, a11y utilities, and portal system. MatTable extends CdkTable. |

### State Management

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| Angular Signals (built-in) | 20.x (built-in) | Component & service state | **Primary state mechanism.** Use `signal()`, `computed()`, `linkedSignal()` for local component state and service-level state. Zero dependencies, framework-native, fine-grained reactivity. |
| `@angular/core/rxjs-interop` | 20.x (built-in) | RxJS ↔ Signal bridge | Use `toSignal()` to convert HTTP Observables into signals for templates. Use `toObservable()` to feed signal values into RxJS pipelines (e.g., search debouncing). |
| `httpResource` (experimental) | 20.x (built-in) | Signal-based HTTP data fetching | Use for read-only list/detail views (user list, level list, page list). Provides `value()`, `isLoading()`, `error()`, `hasValue()` signals out of the box. **Do NOT use for mutations** (POST/PUT/DELETE) — use `HttpClient` directly. Source: v20.angular.dev/guide/http/http-resource |

### HTTP & Authentication

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| `HttpClient` + functional interceptors | 20.x (built-in) | API communication | Use `provideHttpClient(withInterceptors([...]))` in app config. Functional interceptors (not class-based) are the Angular v20 recommended approach — more predictable ordering and DI behavior. Source: v20.angular.dev/guide/http/interceptors |
| Custom JWT interceptor | Project code | Attach access token to requests | Functional interceptor that reads token from AuthService and clones request with `Authorization: Bearer <token>` header. |
| Custom error/refresh interceptor | Project code | Handle 401, trigger token refresh | Interceptor that catches 401 responses, calls refresh endpoint, retries original request. Use `switchMap` + `HttpClient` for the refresh flow. |

### Forms

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Reactive Forms (`@angular/forms`) | 20.x (built-in) | Form handling & validation | Better validation control for complex forms (user CRUD, level CRUD, page CRUD). Use `FormBuilder.group()`, `FormControl`, `FormGroup`, built-in validators (`Validators.required`, `Validators.minLength`, `Validators.email`, `Validators.pattern`). Matches PROJECT.md decision. |
| Typed Forms | 20.x (built-in) | Type-safe form controls | Angular 14+ typed forms are stable. Use `FormGroup<UserForm>` for compile-time type safety on form values and errors. |

### Routing & Guards

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular Router | 20.x (built-in) | Navigation & route protection | Functional guards (`CanActivateFn`, `CanActivateChildFn`, `CanMatchFn`) are the v20 standard — simpler than class-based guards, use `inject()` for service access. Source: v20.angular.dev/guide/routing/route-guards |
| `CanActivate` guard | Project code | Auth gate | Redirect unauthenticated users to `/login`. |
| `CanActivateChild` guard | Project code | Permission gate | Check user permissions against route data before allowing child route access. |
| `CanDeactivate` guard | Project code | Unsaved changes warning | Prevent navigation away from dirty forms without confirmation. |

### Build & Tooling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular CLI (`@angular/cli`) | 20.x | Scaffolding, build, serve | Official build tool. `ng new`, `ng generate component/service/guard`, `ng build`, `ng serve`. Vite-based dev server in v20 for faster HMR. |
| ESBuild | 20.x (via CLI) | Bundler | Default Angular 20 build pipeline. Faster than Webpack. No config needed. |
| Karma + Jasmine | 20.x (via CLI) | Unit testing | Default Angular test setup. Can migrate to Vitest later if needed, but for a technical test demo, stick with defaults. |

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Docker + docker-compose | Latest | Local dev + demo environment | PROJECT.md requires "runs locally or via Docker." Multi-stage Dockerfile for production image. docker-compose to run frontend + backend together for demo. |
| Node.js | 20.19+ or 22.12+ or 24.x | Runtime | Required by Angular 20.x. Use 22.x LTS for best compatibility. |

## Supporting Libraries (Built-in — No Extra Installs)

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `@angular/common` | `DatePipe`, `CurrencyPipe`, `NgClass`, `NgIf`, `NgFor` | Template formatting and structural directives |
| `@angular/animations` | Route transitions, component animations | Optional — only if polish is needed for demo |
| `@angular/cdk/clipboard` | Copy-to-clipboard | If needed for copying permission IDs or tokens |
| `@angular/cdk/table` | Base table component | MatTable extends this; use MatTable directly |
| `@angular/cdk/overlay` | Positioning overlay panels | Used internally by MatDialog, MatMenu, MatSelect |

## What NOT to Use and Why

| Technology | Why Not | What to Use Instead |
|------------|---------|---------------------|
| **NgRx / NgRx SignalStore** | Overkill for this project. Admin dashboard with CRUD + auth has simple state: auth token, user profile, list data. Signals + services handle this cleanly. Adds 50+ files of boilerplate for a technical test demo. | Angular Signals + service-level state |
| **NgModules** | Deprecated pattern. Angular 20 defaults to standalone components. NgModules add ceremony without benefit for new projects. | Standalone components with `imports: []` |
| **Class-based HTTP interceptors** | Angular v20 explicitly recommends functional interceptors. Class-based interceptors have unpredictable ordering in complex DI hierarchies and require `withInterceptorsFromDi()` boilerplate. | Functional interceptors with `withInterceptors()` |
| **Tailwind CSS** | PROJECT.md explicitly constrains to "Angular Material only." Adding Tailwind creates style conflicts and violates the constraint. | Angular Material theming + custom CSS only where Material falls short |
| **Bootstrap / PrimeNG / NG-ZORRO** | PROJECT.md says "Angular Material only." These would duplicate component functionality and increase bundle size. | Angular Material |
| **Axios** | Angular's HttpClient is purpose-built for Angular: integrates with interceptors, provides typed responses, handles XSRF tokens, works with Angular's zone.js for change detection. Axios adds nothing HttpClient doesn't do better in Angular. | `@angular/common/http` |
| **Formly / ngx-formly** | Dynamic form library. Overkill for 3 CRUD forms (user, level, page). Reactive Forms with FormBuilder is simpler and more maintainable for this scope. | `@angular/forms` Reactive Forms |
| **`httpResource` for mutations** | Official Angular docs explicitly say: "Avoid using httpResource for mutations like POST or PUT. Instead, prefer directly using the underlying HttpClient APIs." | `HttpClient.post()`, `HttpClient.put()`, `HttpClient.delete()` |
| **localStorage for JWT tokens** | XSS vulnerability. `localStorage` is accessible to any JavaScript running on the page. For a technical test, at minimum use `sessionStorage` (cleared on tab close) or in-memory storage with refresh token in httpOnly cookie (ideal, but requires backend changes). | In-memory + `sessionStorage` fallback, or httpOnly cookie if backend supports it |
| **Class-based route guards** | Angular v20 documentation shows functional guards as the primary pattern. Class-based guards require implementing interfaces and are more verbose. | `CanActivateFn`, `CanActivateChildFn` functional guards |

## Installation

```bash
# Create new Angular 20 project with routing and SCSS styling
ng new imc-frontend --routing --style=scss --standalone

# Add Angular Material (includes CDK automatically)
ng add @angular/material

# This installs:
# @angular/core@20.x
# @angular/common@20.x
# @angular/router@20.x
# @angular/forms@20.x
# @angular/material@20.x
# @angular/cdk@20.x
# @angular/animations@20.x (peer dependency of Material)
```

## Version Compatibility (Angular 20.x)

| Dependency | Version |
|------------|---------|
| Node.js | ^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0 |
| TypeScript | >=5.9.0 <6.0.0 |
| RxJS | ^6.5.3 \|\| ^7.4.0 |
| Zone.js | 0.14.x (auto-installed) |

Source: v20.angular.dev/reference/versions

## Sources

- Angular v20 Official Docs: https://v20.angular.dev (HIGH confidence)
- Angular v20 Signals Guide: https://v20.angular.dev/guide/signals (HIGH confidence)
- Angular v20 HTTP Interceptors: https://v20.angular.dev/guide/http/interceptors (HIGH confidence)
- Angular v20 httpResource: https://v20.angular.dev/guide/http/http-resource (HIGH confidence)
- Angular v20 Route Guards: https://v20.angular.dev/guide/routing/route-guards (HIGH confidence)
- Angular v20 RxJS Interop: https://v20.angular.dev/ecosystem/rxjs-interop (HIGH confidence)
- Angular v20 Version Compatibility: https://v20.angular.dev/reference/versions (HIGH confidence)
- Angular Material Docs: https://material.angular.dev (HIGH confidence)
- Angular Components GitHub Releases: https://github.com/angular/components/releases (HIGH confidence)
- PROJECT.md constraints: Angular Material only, Reactive Forms, Standalone components (HIGH confidence)
