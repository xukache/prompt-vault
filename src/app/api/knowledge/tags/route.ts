import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/sqlite';

// GET - 获取所有知识库标签
export async function GET() {
  try {
    const db = await getDbConnection();

    // 获取所有知识库条目的标签
    const knowledgeItems = db.prepare(
      'SELECT tags FROM knowledge_base WHERE tags IS NOT NULL AND tags != \'\''
    ).all() as { tags: string }[];

    // 提取并去重所有标签
    const allTags = new Set<string>();
    
    knowledgeItems.forEach(item => {
      if (item.tags) {
        // 按逗号分割标签，并去除空白
        const tags = item.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        tags.forEach(tag => allTags.add(tag));
      }
    });

    // 转换为数组并排序
    const sortedTags = Array.from(allTags).sort();

    return NextResponse.json(sortedTags);
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json(
      { error: '获取标签失败' },
      { status: 500 }
    );
  }
} 