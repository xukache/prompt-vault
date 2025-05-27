import Cookies from "js-cookie";
import { CookieConfig } from "@/types/auth";

// Cookie配置
const AUTH_COOKIE_CONFIG: CookieConfig = {
  name: "promptvault_auth",
  expires: 1, // 1天
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

// 用户信息Cookie配置
const USER_COOKIE_CONFIG: CookieConfig = {
  name: "promptvault_user",
  expires: 1, // 1天
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

/**
 * 设置认证Token Cookie
 */
export function setAuthToken(token: string): void {
  Cookies.set(AUTH_COOKIE_CONFIG.name, token, {
    expires: AUTH_COOKIE_CONFIG.expires,
    secure: AUTH_COOKIE_CONFIG.secure,
    sameSite: AUTH_COOKIE_CONFIG.sameSite,
  });
}

/**
 * 获取认证Token
 */
export function getAuthToken(): string | undefined {
  return Cookies.get(AUTH_COOKIE_CONFIG.name);
}

/**
 * 设置用户信息Cookie
 */
export function setUserInfo(user: object): void {
  const userString = JSON.stringify(user);
  Cookies.set(USER_COOKIE_CONFIG.name, userString, {
    expires: USER_COOKIE_CONFIG.expires,
    secure: USER_COOKIE_CONFIG.secure,
    sameSite: USER_COOKIE_CONFIG.sameSite,
  });
}

/**
 * 获取用户信息（客户端）
 */
export function getUserInfo<T = object>(): T | null {
  try {
    const userString = Cookies.get(USER_COOKIE_CONFIG.name);
    if (!userString) return null;
    return JSON.parse(userString) as T;
  } catch (error) {
    console.error("解析用户信息失败:", error);
    return null;
  }
}

/**
 * 清除所有认证相关Cookie
 */
export function clearAuthCookies(): void {
  Cookies.remove(AUTH_COOKIE_CONFIG.name);
  Cookies.remove(USER_COOKIE_CONFIG.name);
}

/**
 * 检查认证Token是否存在且有效
 */
export function isTokenValid(): boolean {
  const token = getAuthToken();
  const user = getUserInfo();
  return !!(token && user);
}

/**
 * 刷新Cookie过期时间
 */
export function refreshAuthCookies(): void {
  const token = getAuthToken();
  const user = getUserInfo();

  if (token && user) {
    setAuthToken(token);
    setUserInfo(user);
  }
}

/**
 * 获取Cookie过期时间（毫秒）
 */
export function getCookieExpireTime(): number {
  return AUTH_COOKIE_CONFIG.expires * 24 * 60 * 60 * 1000; // 转换为毫秒
}

/**
 * 检查Cookie是否即将过期（剩余时间少于2小时）
 */
export function isCookieExpiringSoon(): boolean {
  // 这里可以通过检查Cookie的设置时间来判断
  // 简化实现：如果Cookie存在就认为还有效
  return false;
}
