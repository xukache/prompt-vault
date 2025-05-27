import { NextRequest, NextResponse } from 'next/server';
import { getUserInfoServer } from '@/lib/auth/server-cookies';
import fs from 'fs/promises';
import path from 'path';

interface User {
  id: string;
}

const usersDataPath = path.join(process.cwd(), 'data', 'users.json');

// 初始化用户数据文件
async function initUsersData() {
  try {
    await fs.access(usersDataPath);
  } catch {
    // 文件不存在，创建默认数据
    const defaultUsers = {
      '1': {
        id: '1',
        email: 'admin@promptvault.com',
        displayName: '管理员',
        username: 'admin',
        bio: '系统管理员，负责平台维护和用户管理。',
        avatar: '',
        role: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      },
      '2': {
        id: '2',
        email: 'user@promptvault.com',
        displayName: '普通用户',
        username: 'user',
        bio: '热爱AI和提示词工程的用户。',
        avatar: '',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      }
    };

    await fs.mkdir(path.dirname(usersDataPath), { recursive: true });
    await fs.writeFile(usersDataPath, JSON.stringify(defaultUsers, null, 2));
  }
}

// 获取用户资料
export async function GET() {
  try {
    const user = await getUserInfoServer<User>();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    await initUsersData();
    const usersData = JSON.parse(await fs.readFile(usersDataPath, 'utf-8'));
    const userProfile = usersData[user.id];

    if (!userProfile) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({
      displayName: userProfile.displayName,
      username: userProfile.username,
      email: userProfile.email,
      bio: userProfile.bio || '',
      avatar: userProfile.avatar || '',
    });
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return NextResponse.json({ error: '获取用户资料失败' }, { status: 500 });
  }
}

// 更新用户资料
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserInfoServer<User>();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { displayName, email, bio, avatar } = await request.json();

    await initUsersData();
    const usersData = JSON.parse(await fs.readFile(usersDataPath, 'utf-8'));

    if (!usersData[user.id]) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 更新用户资料
    usersData[user.id] = {
      ...usersData[user.id],
      displayName,
      email,
      bio,
      avatar,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(usersDataPath, JSON.stringify(usersData, null, 2));

    return NextResponse.json({
      success: true,
      message: '用户资料更新成功'
    });
  } catch (error) {
    console.error('更新用户资料失败:', error);
    return NextResponse.json({ error: '更新用户资料失败' }, { status: 500 });
  }
}