import { NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/sqlite";

// 搜索提示词
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await getDbConnection();
    
    // 构建查询条件
    const conditions: string[] = [];
    const params: unknown[] = [];
    
    if (query) {
      conditions.push('(title LIKE ? OR content LIKE ? OR description LIKE ?)');
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }
    
    if (category) {
      conditions.push('category_id = ?');
      params.push(category);
    }
    
    // 构建SQL查询
    let sql = `
      SELECT p.*, c.name as category_name
      FROM prompts p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY p.updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    // 执行查询
    const prompts = await db.prepare(sql).all(...params);
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM prompts p';
    const countParams: unknown[] = [];
    
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
      // 重新添加查询参数（不包括limit和offset）
      if (query) {
        countParams.push(`%${query}%`, `%${query}%`, `%${query}%`);
      }
      if (category) {
        countParams.push(category);
      }
    }
    
    const countResult = await db.prepare(countSql).get(...countParams) as { total: number };
    
    return NextResponse.json({
      prompts,
      total: countResult.total,
      limit,
      offset
    });
  } catch (error) {
    console.error('搜索失败:', error);
    return NextResponse.json(
      { error: '搜索失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, mode = 'fulltext', limit = 20, categoryId, tags } = body;
    
    if (!query) {
      return NextResponse.json(
        { error: '搜索查询不能为空' },
        { status: 400 }
      );
    }
    
    const db = await getDbConnection();
    
    // 根据搜索模式执行不同的搜索
    if (mode === 'semantic') {
      // 语义搜索 - 这里可以集成向量搜索
      try {
        const { searchSimilarDocuments } = await import('@/lib/vector/orama');
        const vectorResults = await searchSimilarDocuments(query, limit, 'hybrid');
        
        if (vectorResults.length === 0) {
          return NextResponse.json({
            prompts: [],
            total: 0,
            mode: 'semantic'
          });
        }
        
        // 根据向量搜索结果获取完整的提示词信息
        const promptIds = vectorResults.map(result => result.id);
        const placeholders = promptIds.map(() => '?').join(',');
        const prompts = await db.prepare(`
          SELECT p.*, c.name as category_name
          FROM prompts p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id IN (${placeholders})
        `).all(...promptIds);
        
        return NextResponse.json({
          prompts,
          total: prompts.length,
          mode: 'semantic'
        });
      } catch (vectorError) {
        console.warn('向量搜索失败，降级到全文搜索:', vectorError);
        // 降级到全文搜索
      }
    }
    
    // 全文搜索
    const conditions: string[] = [];
    const params: unknown[] = [];
    
    conditions.push('(title LIKE ? OR content LIKE ? OR description LIKE ?)');
    params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    
    if (categoryId) {
      conditions.push('category_id = ?');
      params.push(categoryId);
    }
    
    if (tags && tags.length > 0) {
      const tagConditions = tags.map(() => 
        'EXISTS (SELECT 1 FROM prompt_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.prompt_id = p.id AND t.name = ?)'
      );
      conditions.push(`(${tagConditions.join(' AND ')})`);
      params.push(...tags);
    }
    
    const sql = `
      SELECT p.*, c.name as category_name
      FROM prompts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.updated_at DESC
      LIMIT ?
    `;
    params.push(limit);
    
    const prompts = await db.prepare(sql).all(...params);
    
    return NextResponse.json({
      prompts,
      total: prompts.length,
      mode: 'fulltext'
    });
  } catch (error) {
    console.error('搜索失败:', error);
    return NextResponse.json(
      { error: '搜索失败' },
      { status: 500 }
    );
  }
} 