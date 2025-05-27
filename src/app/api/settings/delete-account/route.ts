import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'prompts.db');

export async function DELETE(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { error: '请输入密码确认删除操作' },
        { status: 400 }
      );
    }

    // 验证密码（这里简化处理，实际应该验证用户密码）
    const authPath = path.join(process.cwd(), 'data', 'auth.json');
    let authData = { password: 'admin123' }; // 默认密码
    
    if (fs.existsSync(authPath)) {
      authData = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    }
    
    if (password !== authData.password) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }

    // 清除数据库
    const db = new Database(dbPath);
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM usage_stats').run();
      db.prepare('DELETE FROM prompt_tags').run();
      db.prepare('DELETE FROM prompts').run();
      db.prepare('DELETE FROM knowledge_base').run();
      db.prepare('DELETE FROM tags').run();
      db.prepare('DELETE FROM categories').run();
    });
    
    transaction();
    db.close();

    // 清除用户数据文件
    const dataDir = path.join(process.cwd(), 'data');
    const filesToDelete = ['users.json', 'integrations.json', 'auth.json'];
    
    filesToDelete.forEach(file => {
      const filePath = path.join(dataDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: '账户已删除，所有数据已清除' 
    });

  } catch (error) {
    console.error('删除账户失败:', error);
    return NextResponse.json(
      { error: '删除账户失败' },
      { status: 500 }
    );
  }
} 