import { ApplicationConfig, APP_INITIALIZER, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { appRoutes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/services/auth.service';
import { PermissionService } from './core/services/permission.service';
import { GlobalErrorHandler } from './core/handlers/global-error-handler';
import { lastValueFrom } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideRouter(appRoutes),
    provideAnimations(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService, permissionService: PermissionService) => async () => {
        const authenticated = await lastValueFrom(auth.restoreSession());
        if (authenticated) {
          const user = auth.user();
          if (user?.id) {
            await lastValueFrom(permissionService.loadPermissions(user.id));
          }
        }
        return true;
      },
      deps: [AuthService, PermissionService],
      multi: true,
    },
  ],
};
