import { cookies } from "next/headers";
import { User } from "@/types/auth";

// Cookie配置
const USER_COOKIE_NAME = "promptvault_user";

/**
 * 获取用户信息（服务器端）
 */
export async function getUserInfoServer<T = object>(): Promise<T | null> {
  try {
    const cookieStore = await cookies();
    const userString = cookieStore.get(USER_COOKIE_NAME)?.value;
    if (!userString) return null;
    return JSON.parse(userString) as T;
  } catch (error) {
    console.error("解析用户信息失败:", error);
    return null;
  }
}

/**
 * 获取当前用户ID（服务器端）
 * 用于数据库查询中的用户隔离
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const user = await getUserInfoServer<User>();
    return user?.id || null;
  } catch (error) {
    console.error("获取用户ID失败:", error);
    return null;
  }
}

/**
 * 验证用户是否已登录
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("用户未登录");
  }
  return userId;
} 