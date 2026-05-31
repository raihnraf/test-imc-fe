export interface Page {
  id: number;
  name: string;
  route_path: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface PageForm {
  name: string;
  route_path: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

export interface CreatePageRequest {
  name: string;
  route_path: string;
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdatePageRequest {
  name?: string;
  route_path?: string;
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
}
