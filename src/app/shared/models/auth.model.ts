export interface User {
  id: number;
  username: string;
  full_name: string;
  level_id: number;
}

export interface LoginResponse {
  data: {
    access_token: string;
    refresh_token: string;
    token_type: 'Bearer';
    expires_in: number;
    user: User;
  };
}

export interface RefreshResponse {
  data: {
    access_token: string;
    refresh_token: string;
    token_type: 'Bearer';
    expires_in: number;
  };
}

export interface LoginCredentials {
  username: string | undefined;
  email: string | undefined;
  password: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  error: {
    type: string;
    description: string;
    errors?: Record<string, string[]>;
    field?: string;
  };
}
