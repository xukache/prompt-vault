import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/sqlite';

// GET - 获取所有知识库类型及其统计信息
export async function GET() {
  try {
    const db = await getDbConnection();

    // 获取所有类型及其使用数量
    const typesQuery = `
      SELECT 
        type,
        COUNT(*) as count,
        MAX(updated_at) as last_used
      FROM knowledge_base 
      GROUP BY type
      ORDER BY count DESC
    `;
    
    const types = db.prepare(typesQuery).all() as Array<{
      type: string;
      count: number;
      last_used: string;
    }>;

    // 添加类型的中文名称和描述
    const typeLabels: Record<string, { label: string; description: string; color: string }> = {
      domain: { 
        label: '领域知识', 
        description: '特定领域的专业知识和概念',
        color: 'purple'
      },
      template: { 
        label: '格式模板', 
        description: '可复用的文档和内容模板',
        color: 'blue'
      },
      practice: { 
        label: '最佳实践', 
        description: '经验总结和最佳实践指南',
        color: 'green'
      },
      reference: { 
        label: '参考资料', 
        description: '参考文档和资料链接',
        color: 'yellow'
      }
    };

    const enrichedTypes = types.map(type => ({
      ...type,
      label: typeLabels[type.type]?.label || type.type,
      description: typeLabels[type.type]?.description || '',
      color: typeLabels[type.type]?.color || 'gray'
    }));

    return NextResponse.json(enrichedTypes);
  } catch (error) {
    console.error('获取知识库类型失败:', error);
    return NextResponse.json(
      { error: '获取知识库类型失败' },
      { status: 500 }
    );
  }
}

// POST - 添加新的知识库类型
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, label, description, color = 'gray' } = body;

    if (!type || !label) {
      return NextResponse.json(
        { error: '类型标识和名称为必填项' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();

    // 检查类型是否已存在
    const existingType = db.prepare(
      'SELECT COUNT(*) as count FROM knowledge_base WHERE type = ?'
    ).get(type) as { count: number };

    if (existingType.count > 0) {
      return NextResponse.json(
        { error: '该类型已存在' },
        { status: 400 }
      );
    }

    // 这里我们不需要实际插入数据，因为类型是在创建知识库条目时自动创建的
    // 返回新类型信息
    return NextResponse.json({
      type,
      label,
      description,
      color,
      count: 0,
      last_used: null
    }, { status: 201 });
  } catch (error) {
    console.error('添加知识库类型失败:', error);
    return NextResponse.json(
      { error: '添加知识库类型失败' },
      { status: 500 }
    );
  }
}

// PUT - 重命名知识库类型
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { oldType, newType, label, description, color } = body;

    if (!oldType || !newType) {
      return NextResponse.json(
        { error: '原类型和新类型为必填项' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();

    // 检查原类型是否存在
    const existingCount = db.prepare(
      'SELECT COUNT(*) as count FROM knowledge_base WHERE type = ?'
    ).get(oldType) as { count: number };

    if (existingCount.count === 0) {
      return NextResponse.json(
        { error: '原类型不存在' },
        { status: 404 }
      );
    }

    // 检查新类型是否已存在（如果不是重命名为自己）
    if (oldType !== newType) {
      const newTypeCount = db.prepare(
        'SELECT COUNT(*) as count FROM knowledge_base WHERE type = ?'
      ).get(newType) as { count: number };

      if (newTypeCount.count > 0) {
        return NextResponse.json(
          { error: '新类型已存在' },
          { status: 400 }
        );
      }
    }

    // 更新所有使用该类型的知识库条目
    const updateQuery = `
      UPDATE knowledge_base 
      SET type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE type = ?
    `;
    
    const result = db.prepare(updateQuery).run(newType, oldType);

    return NextResponse.json({
      type: newType,
      label,
      description,
      color,
      count: result.changes,
      updated: true
    });
  } catch (error) {
    console.error('重命名知识库类型失败:', error);
    return NextResponse.json(
      { error: '重命名知识库类型失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除知识库类型
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { error: '类型参数为必填项' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();

    // 检查是否有知识库条目使用该类型
    const usageCount = db.prepare(
      'SELECT COUNT(*) as count FROM knowledge_base WHERE type = ?'
    ).get(type) as { count: number };

    if (usageCount.count > 0) {
      return NextResponse.json(
        { error: `无法删除类型，还有 ${usageCount.count} 个知识库条目正在使用该类型` },
        { status: 400 }
      );
    }

    // 如果没有条目使用该类型，则认为删除成功
    return NextResponse.json({
      message: '类型删除成功',
      deletedType: type
    });
  } catch (error) {
    console.error('删除知识库类型失败:', error);
    return NextResponse.json(
      { error: '删除知识库类型失败' },
      { status: 500 }
    );
  }
} 