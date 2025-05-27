import { NextRequest, NextResponse } from 'next/server';
import { getUserInfoServer } from '@/lib/auth/server-cookies';
import fs from 'fs/promises';
import path from 'path';

interface User {
  id: string;
}

const usersDataPath = path.join(process.cwd(), 'data', 'users.json');
const authDataPath = path.join(process.cwd(), 'data', 'auth.json');

// 初始化认证数据文件
async function initAuthData() {
  try {
    await fs.access(authDataPath);
  } catch {
    // 文件不存在，创建默认数据
    const defaultAuth = {
      '1': {
        id: '1',
        email: 'admin@promptvault.com',
        password: 'admin123',
      },
      '2': {
        id: '2',
        email: 'user@promptvault.com',
        password: 'user123',
      }
    };

    await fs.mkdir(path.dirname(authDataPath), { recursive: true });
    await fs.writeFile(authDataPath, JSON.stringify(defaultAuth, null, 2));
  }
}

// 更新密码
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserInfoServer<User>();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '请提供当前密码和新密码' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: '新密码至少需要8个字符' }, { status: 400 });
    }

    await initAuthData();
    const authData = JSON.parse(await fs.readFile(authDataPath, 'utf-8'));

    if (!authData[user.id]) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 验证当前密码
    if (authData[user.id].password !== currentPassword) {
      return NextResponse.json({ error: '当前密码错误' }, { status: 400 });
    }

    // 更新密码
    authData[user.id].password = newPassword;
    authData[user.id].updatedAt = new Date().toISOString();

    await fs.writeFile(authDataPath, JSON.stringify(authData, null, 2));

    return NextResponse.json({
      success: true,
      message: '密码更新成功'
    });
  } catch (error) {
    console.error('更新密码失败:', error);
    return NextResponse.json({ error: '更新密码失败' }, { status: 500 });
  }
}