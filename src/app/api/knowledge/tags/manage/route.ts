import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/sqlite';

// GET - 获取所有知识库标签及其统计信息
export async function GET() {
  try {
    const db = await getDbConnection();

    // 获取所有知识库条目的标签
    const knowledgeItems = db.prepare(
      'SELECT id, tags FROM knowledge_base WHERE tags IS NOT NULL AND tags != \'\''
    ).all() as Array<{ id: string; tags: string }>;

    // 统计标签使用情况
    const tagStats = new Map<string, { count: number; items: string[] }>();
    
    knowledgeItems.forEach(item => {
      if (item.tags) {
        const tags = item.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        tags.forEach(tag => {
          if (!tagStats.has(tag)) {
            tagStats.set(tag, { count: 0, items: [] });
          }
          const stats = tagStats.get(tag)!;
          stats.count++;
          stats.items.push(item.id);
        });
      }
    });

    // 转换为数组并排序
    const tagsArray = Array.from(tagStats.entries()).map(([name, stats]) => ({
      name,
      count: stats.count,
      items: stats.items
    })).sort((a, b) => b.count - a.count);

    return NextResponse.json(tagsArray);
  } catch (error) {
    console.error('获取知识库标签失败:', error);
    return NextResponse.json(
      { error: '获取知识库标签失败' },
      { status: 500 }
    );
  }
}

// PUT - 重命名标签
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { oldTag, newTag } = body;

    if (!oldTag || !newTag) {
      return NextResponse.json(
        { error: '原标签和新标签为必填项' },
        { status: 400 }
      );
    }

    if (oldTag === newTag) {
      return NextResponse.json(
        { error: '新标签名称与原标签相同' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();

    // 获取所有包含该标签的知识库条目
    const knowledgeItems = db.prepare(
      'SELECT id, tags FROM knowledge_base WHERE tags LIKE ? OR tags LIKE ? OR tags LIKE ? OR tags = ?'
    ).all(`${oldTag},%`, `%,${oldTag},%`, `%,${oldTag}`, oldTag) as Array<{ id: string; tags: string }>;

    let updatedCount = 0;

    // 更新每个条目的标签
    const updateStmt = db.prepare('UPDATE knowledge_base SET tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    
    knowledgeItems.forEach(item => {
      if (item.tags) {
        const tags = item.tags.split(',').map(tag => tag.trim());
        const updatedTags = tags.map(tag => tag === oldTag ? newTag : tag);
        const newTagsString = updatedTags.join(',');
        
        if (newTagsString !== item.tags) {
          updateStmt.run(newTagsString, item.id);
          updatedCount++;
        }
      }
    });

    return NextResponse.json({
      message: '标签重命名成功',
      oldTag,
      newTag,
      updatedCount
    });
  } catch (error) {
    console.error('重命名标签失败:', error);
    return NextResponse.json(
      { error: '重命名标签失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除标签
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');

    if (!tag) {
      return NextResponse.json(
        { error: '标签参数为必填项' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();

    // 获取所有包含该标签的知识库条目
    const knowledgeItems = db.prepare(
      'SELECT id, tags FROM knowledge_base WHERE tags LIKE ? OR tags LIKE ? OR tags LIKE ? OR tags = ?'
    ).all(`${tag},%`, `%,${tag},%`, `%,${tag}`, tag) as Array<{ id: string; tags: string }>;

    let updatedCount = 0;

    // 从每个条目中移除该标签
    const updateStmt = db.prepare('UPDATE knowledge_base SET tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    
    knowledgeItems.forEach(item => {
      if (item.tags) {
        const tags = item.tags.split(',').map(tag => tag.trim()).filter(t => t !== tag);
        const newTagsString = tags.length > 0 ? tags.join(',') : null;
        
        if (newTagsString !== item.tags) {
          updateStmt.run(newTagsString, item.id);
          updatedCount++;
        }
      }
    });

    return NextResponse.json({
      message: '标签删除成功',
      deletedTag: tag,
      updatedCount
    });
  } catch (error) {
    console.error('删除标签失败:', error);
    return NextResponse.json(
      { error: '删除标签失败' },
      { status: 500 }
    );
  }
}

// POST - 合并标签
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceTags, targetTag } = body;

    if (!sourceTags || !Array.isArray(sourceTags) || sourceTags.length === 0 || !targetTag) {
      return NextResponse.json(
        { error: '源标签数组和目标标签为必填项' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();
    let totalUpdatedCount = 0;

    // 为每个源标签执行合并操作
    const updateStmt = db.prepare('UPDATE knowledge_base SET tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    
    for (const sourceTag of sourceTags) {
      if (sourceTag === targetTag) continue; // 跳过目标标签本身

      // 获取包含源标签的所有条目
      const knowledgeItems = db.prepare(
        'SELECT id, tags FROM knowledge_base WHERE tags LIKE ? OR tags LIKE ? OR tags LIKE ? OR tags = ?'
      ).all(`${sourceTag},%`, `%,${sourceTag},%`, `%,${sourceTag}`, sourceTag) as Array<{ id: string; tags: string }>;

      knowledgeItems.forEach(item => {
        if (item.tags) {
          const tags = item.tags.split(',').map(tag => tag.trim());
          
          // 替换源标签为目标标签，并去重
          const updatedTags = tags.map(tag => tag === sourceTag ? targetTag : tag);
          const uniqueTags = Array.from(new Set(updatedTags));
          const newTagsString = uniqueTags.join(',');
          
          if (newTagsString !== item.tags) {
            updateStmt.run(newTagsString, item.id);
            totalUpdatedCount++;
          }
        }
      });
    }

    return NextResponse.json({
      message: '标签合并成功',
      sourceTags,
      targetTag,
      updatedCount: totalUpdatedCount
    });
  } catch (error) {
    console.error('合并标签失败:', error);
    return NextResponse.json(
      { error: '合并标签失败' },
      { status: 500 }
    );
  }
} 