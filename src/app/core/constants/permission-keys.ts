export const PERMISSION_KEYS = {
  USERS: '/users',
  LEVELS: '/levels',
  PAGES: '/pages',
} as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];

export interface PermissionGuardData {
  permission: PermissionKey | '';
}
