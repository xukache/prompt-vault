import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'prompts.db');

export async function DELETE(request: NextRequest) {
  try {
    const db = new Database(dbPath);
    
    // 开始事务
    const transaction = db.transaction(() => {
      // 清除使用统计
      db.prepare('DELETE FROM usage_stats').run();
      
      // 清除提示词标签关联
      db.prepare('DELETE FROM prompt_tags').run();
      
      // 清除所有提示词
      db.prepare('DELETE FROM prompts').run();
      
      // 重置标签使用计数
      db.prepare('UPDATE tags SET usage_count = 0').run();
      
      // 清除知识库
      db.prepare('DELETE FROM knowledge_base').run();
    });
    
    transaction();
    db.close();

    return NextResponse.json({ 
      success: true, 
      message: '所有提示词历史已清除' 
    });

  } catch (error) {
    console.error('清除历史失败:', error);
    return NextResponse.json(
      { error: '清除历史失败' },
      { status: 500 }
    );
  }
} 