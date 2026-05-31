# Domain Pitfalls

**Domain:** Angular admin dashboard with JWT auth and permission management
**Researched:** 2026-05-31

## Critical Pitfalls

### Pitfall 1: JWT Token Storage in localStorage
**What goes wrong:** Storing JWT access tokens or refresh tokens in `localStorage` makes them accessible to any JavaScript running on the page, including malicious scripts injected via XSS attacks.
**Why it happens:** `localStorage` is the easiest browser storage API to use — one line of code. Developers often prioritize convenience over security.
**Consequences:** If an XSS vulnerability exists anywhere in the app (or in a third-party dependency), attackers can steal tokens and impersonate users. For a technical test, this may not be exploited, but it demonstrates poor security awareness.
**Prevention:** 
- Store access tokens in-memory (Angular signal) — lost on page refresh but safe
- Store refresh tokens in `sessionStorage` (cleared on tab close) or, ideally, httpOnly cookies (requires backend support)
- Never store tokens in `localStorage`
**Detection:** Code review — search for `localStorage.setItem` with token-related keys.

### Pitfall 2: Token Refresh Race Conditions
**What goes wrong:** Multiple simultaneous API requests all receive 401, each triggers a token refresh, resulting in multiple refresh calls. The first refresh succeeds, but subsequent refreshes may invalidate the already-refreshed token (if the backend rotates refresh tokens).
**Why it happens:** The error interceptor naively calls refresh for every 401 without coordinating concurrent refresh attempts.
**Consequences:** Token invalidation, user logged out unexpectedly, or infinite refresh loops.
**Prevention:** Implement a refresh queue in the error interceptor. When the first 401 arrives, trigger refresh and queue subsequent 401 requests. When refresh completes, replay all queued requests with the new token. Use a `BehaviorSubject` or signal to track refresh state.
**Detection:** Network tab showing multiple concurrent POST /auth/refresh calls.

### Pitfall 3: Client-Side Permission Guards as Sole Security
**What goes wrong:** Relying only on Angular route guards for access control. Users can modify JavaScript in the browser to bypass guards and access routes directly.
**Why it happens:** Route guards feel like security — they block navigation. But they run in the browser and are fully可控 by the user.
**Consequences:** Users can access routes they shouldn't, potentially triggering API calls that the backend should reject. If the backend also doesn't enforce permissions, data leakage occurs.
**Prevention:** 
- Route guards are UX, not security. Always enforce permissions server-side.
- Angular docs explicitly state: "Never rely on client-side guards as the sole source of access control."
- The backend (Slim PHP) must validate permissions on every API endpoint.
**Detection:** Security review — verify every API endpoint checks permissions, not just the frontend.

## Moderate Pitfalls

### Pitfall 4: Using httpResource for Mutations
**What goes wrong:** Using `httpResource()` for POST, PUT, or DELETE operations. `httpResource` is designed for read-only data fetching and eagerly triggers requests when dependencies change.
**Why it happens:** `httpResource` is convenient — it provides loading, error, and value signals automatically. Developers may reach for it for all HTTP operations.
**Consequences:** Unintended duplicate mutations (e.g., a PUT fires every time a signal dependency changes), unpredictable behavior.
**Prevention:** Use `httpResource` ONLY for GET requests (list, detail). Use `HttpClient.post()`, `HttpClient.put()`, `HttpClient.delete()` directly for mutations. Angular docs explicitly warn against this.
**Detection:** Code review — search for `httpResource` usage and verify all are GET-only.

### Pitfall 5: Not Handling Backend Error Format
**What goes wrong:** The backend returns errors in a specific format: `{statusCode, error: {type, description, errors?}}`. Generic error handling displays raw JSON or unhelpful messages.
**Why it happens:** Developers use generic `catchError` that displays `error.message` or the raw response.
**Consequences:** Users see technical error messages instead of actionable feedback. Form validation errors from the backend don't map to form controls.
**Prevention:** 
- Define TypeScript interfaces for the backend error format
- Create an error mapping service that extracts user-friendly messages
- For form errors, map `errors: [{field, message}]` to `form.get(field).setErrors()`
**Detection:** Trigger backend validation errors and verify user sees field-level messages.

### Pitfall 6: MatTable Performance with Large Datasets
**What goes wrong:** Loading all records into the table at once and using client-side pagination. With hundreds of users, the table becomes slow.
**Why it happens:** MatTable's default behavior works fine with small datasets. Developers may not test with large data.
**Consequences:** Slow rendering, high memory usage, poor UX with 100+ records.
**Prevention:** Always use server-side pagination. Send `page` and `pageSize` params to the API. Use `MatPaginator` with `length` set to total count from API response.
**Detection:** Test with 500+ records. If table takes >1s to render, switch to server-side pagination.

### Pitfall 7: Forgetting to Unsubscribe from Observables
**What goes wrong:** Subscribing to HTTP Observables or form value changes in components without unsubscribing, causing memory leaks and stale data.
**Why it happens:** HTTP Observables complete automatically, so they don't leak. But form `valueChanges` and custom Observables don't complete.
**Consequences:** Memory leaks, multiple subscriptions firing on component re-creation, stale state updates.
**Prevention:** 
- Use `toSignal()` for automatic lifecycle management
- Use `takeUntilDestroyed()` operator for manual subscriptions
- Avoid `.subscribe()` in components when possible
**Detection:** Angular DevTools memory profiler, or search for `.subscribe(` without corresponding cleanup.

## Minor Pitfalls

### Pitfall 8: Importing Entire Angular Material Modules
**What goes wrong:** Importing `MatModule` (all Material components) instead of individual component modules.
**Why it happens:** Convenience — one import instead of 20.
**Consequences:** Larger bundle size (~200KB+ gzipped vs ~50KB for just the components used).
**Prevention:** Import only needed Material modules: `MatTableModule`, `MatPaginatorModule`, `MatSortModule`, `MatFormFieldModule`, `MatInputModule`, etc.
**Detection:** `ng build --stats-json` and analyze bundle with webpack-bundle-analyzer.

### Pitfall 9: Not Using OnPush Change Detection
**What goes wrong:** Using default change detection strategy, causing unnecessary change detection cycles on every event.
**Why it happens:** Default is the Angular default. Developers may not know about OnPush.
**Consequences:** Performance degradation as the app grows — every click, keypress, or timer triggers full change detection.
**Prevention:** Use `changeDetection: ChangeDetectionStrategy.OnPush` on all components. With Signals, OnPush is even more effective since Signals automatically mark components dirty.
**Detection:** Angular DevTools profiler showing excessive change detection cycles.

### Pitfall 10: Hardcoding API Base URL
**What goes wrong:** Hardcoding `http://localhost:8080` in services instead of using environment configuration.
**Why it happens:** Quick development setup.
**Consequences:** Code doesn't work in different environments (staging, production, Docker). Requires code changes to switch environments.
**Prevention:** Use Angular environment files (`environment.ts`, `environment.prod.ts`) or `APP_INITIALIZER` to load config from a JSON file. For Docker, use environment variable injection at build time.
**Detection:** Search for hardcoded URLs in service files.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| JWT Auth Setup | Token stored in localStorage | Use in-memory signal + sessionStorage fallback |
| JWT Auth Setup | Refresh race conditions | Implement refresh queue with BehaviorSubject |
| Route Guards | Guards as sole security | Document that backend must also enforce permissions |
| User CRUD | Client-side pagination for large datasets | Server-side pagination from day one |
| Permission Matrix | Complex permission matching logic slow | Pre-compute permission set in AuthService, O(1) lookup |
| Error Handling | Raw backend errors shown to users | Error mapping service with TypeScript interfaces |
| Build/Deploy | Hardcoded API URL | Environment-based configuration |
| All CRUD | Not unsubscribing from Observables | Use `toSignal()` or `takeUntilDestroyed()` |

## Sources

- Angular v20 Security Guide: https://v20.angular.dev/best-practices/security (HIGH confidence)
- Angular v20 HTTP Interceptors: https://v20.angular.dev/guide/http/interceptors (HIGH confidence)
- Angular v20 httpResource docs: https://v20.angular.dev/guide/http/http-resource (HIGH confidence)
- OWASP JWT Storage Guidelines: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet_for_Java.html (HIGH confidence)
- Angular Material Performance: https://material.angular.dev (MEDIUM confidence — general best practices)
