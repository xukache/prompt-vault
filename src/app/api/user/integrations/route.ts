import { NextRequest, NextResponse } from 'next/server';
import { getUserInfoServer } from '@/lib/auth/server-cookies';
import fs from 'fs/promises';
import path from 'path';

const integrationsDataPath = path.join(process.cwd(), 'data', 'integrations.json');

// 初始化集成数据文件
async function initIntegrationsData() {
  try {
    await fs.access(integrationsDataPath);
  } catch {
    // 文件不存在，创建默认数据
    const defaultIntegrations = {
      '1': {
        apiBaseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        apiModel: 'gpt-3.5-turbo',
        updatedAt: new Date().toISOString(),
      },
      '2': {
        apiBaseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        apiModel: 'gpt-3.5-turbo',
        updatedAt: new Date().toISOString(),
      }
    };
    
    await fs.mkdir(path.dirname(integrationsDataPath), { recursive: true });
    await fs.writeFile(integrationsDataPath, JSON.stringify(defaultIntegrations, null, 2));
  }
}

// 获取集成设置
export async function GET() {
  try {
    const user = await getUserInfoServer();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    await initIntegrationsData();
    const integrationsData = JSON.parse(await fs.readFile(integrationsDataPath, 'utf-8'));
    const userIntegrations = integrationsData[user.id] || {
      apiBaseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      apiModel: 'gpt-3.5-turbo',
    };

    return NextResponse.json(userIntegrations);
  } catch (error) {
    console.error('获取集成设置失败:', error);
    return NextResponse.json({ error: '获取集成设置失败' }, { status: 500 });
  }
}

// 更新集成设置
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserInfoServer();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { apiBaseUrl, apiKey, apiModel } = await request.json();

    await initIntegrationsData();
    const integrationsData = JSON.parse(await fs.readFile(integrationsDataPath, 'utf-8'));
    
    // 更新用户集成设置
    integrationsData[user.id] = {
      apiBaseUrl,
      apiKey,
      apiModel,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(integrationsDataPath, JSON.stringify(integrationsData, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: '集成设置更新成功' 
    });
  } catch (error) {
    console.error('更新集成设置失败:', error);
    return NextResponse.json({ error: '更新集成设置失败' }, { status: 500 });
  }
} 