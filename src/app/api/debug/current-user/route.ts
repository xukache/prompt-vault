import { NextResponse } from 'next/server';
import { getCurrentUserId, getUserInfoServer } from '@/lib/auth/server-cookies';
import { User } from '@/types/auth';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const userInfo = await getUserInfoServer<User>();
    
    return NextResponse.json({
      userId,
      userInfo,
      hasAuth: !!userId,
      message: userId ? '用户已登录' : '用户未登录'
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json({
      error: '获取用户信息失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 