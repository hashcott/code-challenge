export interface User {
  id?: number;
  name: string;
  email: string;
  age?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  age?: number;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  age?: number;
}

export interface UserFilters {
  name?: string;
  email?: string;
  age?: number;
  limit?: number;
  offset?: number;
}
