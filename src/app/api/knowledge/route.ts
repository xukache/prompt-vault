import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/sqlite';
import { requireAuth } from '@/lib/auth/server-cookies';
import { KnowledgeBase } from '@/types';

// GET - 获取知识库条目列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const userId = await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const tag = searchParams.get('tag') || '';
    const sortBy = searchParams.get('sortBy') || 'updated_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const db = await getDbConnection();

    // 构建查询条件 - 添加用户隔离
    let whereClause = 'WHERE user_id = ?';
    const params: any[] = [userId];

    if (search) {
      whereClause += ' AND (title LIKE ? OR content LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (type && type !== 'all') {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (tag && tag !== 'all') {
      whereClause += ' AND (tags LIKE ? OR tags LIKE ? OR tags LIKE ? OR tags = ?)';
      params.push(`${tag},%`, `%,${tag},%`, `%,${tag}`, tag);
    }

    // 验证排序字段
    const validSortFields = ['title', 'type', 'usage_count', 'created_at', 'updated_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'updated_at';
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // 获取总数
    const countQuery = `SELECT COUNT(*) as count FROM knowledge_base ${whereClause}`;
    const countResult = db.prepare(countQuery).get(...params) as { count: number };
    const total = countResult.count;

    // 获取知识库条目
    const query = `
      SELECT * FROM knowledge_base 
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `;
    const knowledgeItems = db.prepare(query).all(...params, limit, offset) as KnowledgeBase[];

    return NextResponse.json({
      items: knowledgeItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取知识库条目失败:', error);
    return NextResponse.json(
      { error: '获取知识库条目失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新的知识库条目
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const userId = await requireAuth();
    
    const body = await request.json();
    const { title, content, type = 'domain', description, tags } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容为必填项' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();
    const id = `kb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 插入知识库条目 - 添加用户ID
    const insertQuery = `
      INSERT INTO knowledge_base (id, title, content, type, description, tags, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.prepare(insertQuery).run(
      id,
      title,
      content,
      type,
      description || null,
      tags || null,
      userId
    );

    // 获取创建的条目 - 添加用户隔离
    const createdItem = db.prepare('SELECT * FROM knowledge_base WHERE id = ? AND user_id = ?').get(id, userId) as KnowledgeBase;

    return NextResponse.json(createdItem, { status: 201 });
  } catch (error) {
    console.error('创建知识库条目失败:', error);
    return NextResponse.json(
      { error: '创建知识库条目失败' },
      { status: 500 }
    );
  }
} 