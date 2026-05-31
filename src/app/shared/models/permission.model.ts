export interface PermissionEntry {
  id: number;
  name: string;
  route_path: string;
  has_access: boolean;
}

export interface UserPermissionOverride {
  id: number;
  page_id: number;
  page_name: string;
  route_path: string;
  is_granted: boolean;
}

export interface LevelPermissionRequest {
  page_id: number;
}

export interface UserPermissionRequest {
  page_id: number;
  is_granted: boolean;
}

export interface NavItem {
  route: string;
  label: string;
  icon: string;
  permission: string;
}
