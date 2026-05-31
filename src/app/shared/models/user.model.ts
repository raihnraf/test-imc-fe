export interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  level_id: number | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface Level {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserForm {
  full_name: string;
  username: string;
  email: string;
  password: string;
  level_id: number | null;
  is_active: boolean;
}

export interface CreateUserRequest {
  full_name: string;
  username: string;
  email: string;
  password: string;
  level_id?: number | null;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  full_name?: string;
  username?: string;
  email?: string;
  password?: string;
  level_id?: number | null;
  is_active?: boolean;
}

export interface LevelForm {
  name: string;
  description: string;
  is_active: boolean;
}

export interface CreateLevelRequest {
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface UpdateLevelRequest {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}
