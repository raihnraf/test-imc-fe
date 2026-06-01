import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { permissionGuard } from '../core/guards/permission.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      {
        path: 'users',
        canActivate: [permissionGuard],
        data: { permission: '/users' },
        loadComponent: () =>
          import('../features/users/user-list/user-list.component').then(
            (m) => m.UserListComponent,
          ),
      },
      {
        path: 'users/new',
        canActivate: [permissionGuard],
        data: { permission: '/users' },
        loadComponent: () =>
          import('../features/users/user-form/user-form.component').then(
            (m) => m.UserFormComponent,
          ),
      },
      {
        path: 'users/:id/edit',
        canActivate: [permissionGuard],
        data: { permission: '/users' },
        loadComponent: () =>
          import('../features/users/user-form/user-form.component').then(
            (m) => m.UserFormComponent,
          ),
      },
      {
        path: 'users/:id/permissions',
        canActivate: [permissionGuard],
        data: { permission: '/users' },
        loadComponent: () =>
          import('../features/permissions/user-permission-override/user-permission-override.component').then(
            (m) => m.UserPermissionOverrideComponent,
          ),
      },
      {
        path: 'levels',
        canActivate: [permissionGuard],
        data: { permission: '/levels' },
        loadComponent: () =>
          import('../features/levels/level-list/level-list.component').then(
            (m) => m.LevelListComponent,
          ),
      },
      {
        path: 'levels/new',
        canActivate: [permissionGuard],
        data: { permission: '/levels' },
        loadComponent: () =>
          import('../features/levels/level-form/level-form.component').then(
            (m) => m.LevelFormComponent,
          ),
      },
      {
        path: 'levels/:id/edit',
        canActivate: [permissionGuard],
        data: { permission: '/levels' },
        loadComponent: () =>
          import('../features/levels/level-form/level-form.component').then(
            (m) => m.LevelFormComponent,
          ),
      },
      {
        path: 'levels/:id/permissions',
        canActivate: [permissionGuard],
        data: { permission: '/levels' },
        loadComponent: () =>
          import('../features/permissions/level-permission-matrix/level-permission-matrix.component').then(
            (m) => m.LevelPermissionMatrixComponent,
          ),
      },
      {
        path: 'pages',
        canActivate: [permissionGuard],
        data: { permission: '/pages' },
        loadComponent: () =>
          import('../features/pages/page-list/page-list.component').then(
            (m) => m.PageListComponent,
          ),
      },
      {
        path: 'pages/new',
        canActivate: [permissionGuard],
        data: { permission: '/pages' },
        loadComponent: () =>
          import('../features/pages/page-form/page-form.component').then(
            (m) => m.PageFormComponent,
          ),
      },
      {
        path: 'pages/:id/edit',
        canActivate: [permissionGuard],
        data: { permission: '/pages' },
        loadComponent: () =>
          import('../features/pages/page-form/page-form.component').then(
            (m) => m.PageFormComponent,
          ),
      },
      { path: '**', redirectTo: 'users' },
    ],
  },
];
