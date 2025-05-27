import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    // 重置用户数据为默认值
    const defaultUserData = {
      displayName: '用户',
      username: 'user',
      email: 'user@example.com',
      bio: ''
    };
    
    const defaultIntegrationData = {
      apiBaseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      apiModel: 'gpt-3.5-turbo'
    };
    
    // 写入默认数据
    fs.writeFileSync(
      path.join(dataDir, 'users.json'),
      JSON.stringify(defaultUserData, null, 2)
    );
    
    fs.writeFileSync(
      path.join(dataDir, 'integrations.json'),
      JSON.stringify(defaultIntegrationData, null, 2)
    );

    return NextResponse.json({ 
      success: true, 
      message: '所有设置已重置为默认值' 
    });

  } catch (error) {
    console.error('重置设置失败:', error);
    return NextResponse.json(
      { error: '重置设置失败' },
      { status: 500 }
    );
  }
} 