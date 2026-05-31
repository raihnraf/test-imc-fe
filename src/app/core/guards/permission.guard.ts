import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';

export const permissionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  const permissions = permissionService.permissions();

  const requiredPermission = route.data['permission'];
  if (!requiredPermission) return true;

  if (permissions[requiredPermission] === true) return true;

  return router.parseUrl('/forbidden');
};
