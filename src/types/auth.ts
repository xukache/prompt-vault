// 用户信息类型
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLoginAt: string;
}

// 登录请求类型
export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

// 登录响应类型
export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// 注册请求类型
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// 身份验证上下文类型
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => void;
  register: (data: RegisterRequest) => Promise<LoginResponse>;
  checkAuth: () => Promise<void>;
}

// Cookie配置类型
export interface CookieConfig {
  name: string;
  expires: number; // 天数
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
} 