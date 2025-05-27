import { NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/sqlite";
import { generateId } from "@/lib/utils";
import { requireAuth } from "@/lib/auth/server-cookies";
import type { Database } from "better-sqlite3";

interface PromptRow {
  id: string;
  title: string;
  content: string;
  description?: string;
  category_id?: string;
  rating: number;
  is_favorite: number; // SQLite中布尔值存储为数字
  created_at: string;
  updated_at: string;
  version?: string;
  instructions?: string;
  notes?: string;
  variables?: string; // JSON字符串
}

interface TagRow {
  name: string;
}

interface UsageCountRow {
  count: number;
}

// 获取所有提示词
export async function GET(request: Request) {
  try {
    // 验证用户身份
    const userId = await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    
    const db = await getDbConnection();
    
    // 构建SQL查询 - 添加用户隔离
    let sql = 'SELECT * FROM prompts WHERE user_id = ?';
    let params: any[] = [userId];
    
    if (categoryId) {
      sql += ' AND category_id = ?';
      params.push(categoryId);
    }
    
    sql += ' ORDER BY updated_at DESC';
    
    // 获取提示词基本信息
    const prompts = await db.prepare(sql).all(...params) as PromptRow[];
    
    // 为每个提示词获取标签信息
    const promptsWithTags = await Promise.all(
      prompts.map(async (prompt: PromptRow) => {
        // 检查用户是否设置了版本号
        if (!prompt.version || prompt.version.trim() === '') {
          // 如果没有设置版本号，跳过这个提示词或设置默认值
          console.warn(`提示词 ${prompt.id} 缺少版本号`);
        }

        // 获取标签 - 添加用户隔离
        const tags = await db.prepare(`
          SELECT t.name 
          FROM tags t 
          JOIN prompt_tags pt ON t.id = pt.tag_id 
          WHERE pt.prompt_id = ? AND t.user_id = ?
        `).all(prompt.id, userId) as TagRow[];
        
        // 获取使用次数 - 添加用户隔离
        const usageCount = await db.prepare(`
          SELECT COUNT(*) as count 
          FROM usage_stats 
          WHERE prompt_id = ? AND user_id = ?
        `).get(prompt.id, userId) as UsageCountRow | undefined;
        
        return {
          ...prompt,
          tags: tags.map((tag: TagRow) => tag.name),
          usage_count: usageCount?.count || 0,
          is_favorite: Boolean(prompt.is_favorite), // 转换为布尔值
          version: prompt.version || 'v1.0', // 直接使用用户设置的版本号，如果没有则使用默认值
          variables: prompt.variables ? (() => {
            try {
              return JSON.parse(prompt.variables);
            } catch {
              return {};
            }
          })() : {}
        };
      })
    );
    
    return NextResponse.json(promptsWithTags);
  } catch (error: unknown) {
    console.error('获取提示词失败:', error);
    return NextResponse.json(
      { error: '获取提示词失败' },
      { status: 500 }
    );
  }
}

// 创建提示词
export async function POST(request: Request) {
  try {
    // 验证用户身份
    const userId = await requireAuth();
    
    const body = await request.json();
    const { 
      title, 
      content, 
      description, 
      category_id, 
      tags = [], 
      rating = 0, 
      is_favorite = false,
      version,
      instructions = '',
      notes = '',
      variables = {}
    } = body;

    // 验证必填字段
    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容为必填项' },
        { status: 400 }
      );
    }

    // 验证版本号是必填的
    if (!version || version.trim() === '') {
      return NextResponse.json(
        { error: '版本号不能为空，请设置版本号' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();
    const id = generateId();
    const now = new Date().toISOString();

    // 将variables对象转换为JSON字符串
    const variablesJson = JSON.stringify(variables);

    // 开始事务
    const transaction = db.transaction(() => {
      // 1. 创建提示词 - 添加用户ID
      db.prepare(`
        INSERT INTO prompts (
          id, title, content, description, category_id, rating, is_favorite, 
          version, instructions, notes, variables, user_id, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, title, content, description || null, category_id || null, 
        rating, is_favorite ? 1 : 0, version, instructions, notes, 
        variablesJson, userId, now, now
      );

      // 2. 创建初始版本记录 - 添加用户ID
      const versionId = `version-${id}-1-${Date.now()}`;
      db.prepare(`
        INSERT INTO prompt_versions (
          id, prompt_id, version_number, user_version, title, content, change_description, user_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        versionId,
        id,
        1,
        version, // 使用用户设置的版本号
        title,
        content,
        '初始版本',
        userId,
        now
      );

      // 3. 处理标签 - 添加用户隔离
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          // 先查找是否已存在同名标签（限制在当前用户）
          const existingTag = db.prepare('SELECT id FROM tags WHERE name = ? AND user_id = ?').get(tagName, userId) as { id: string } | undefined;
          
          let tagId: string;
          if (existingTag) {
            // 使用现有标签ID
            tagId = existingTag.id;
          } else {
            // 创建新标签ID（使用连字符格式）
            tagId = `tag-${tagName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
            db.prepare(`
              INSERT OR IGNORE INTO tags (id, name, user_id) 
              VALUES (?, ?, ?)
            `).run(tagId, tagName, userId);
          }

          // 关联标签（使用tag_id）
          db.prepare(`
            INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) 
            VALUES (?, ?)
          `).run(id, tagId);
        }
      }
    });

    // 执行事务
    transaction();

    // 获取创建的提示词（包含标签和正确的版本号）
    const prompt = await getPromptWithTags(db, id);

    return NextResponse.json(prompt, { status: 201 });
  } catch (error: unknown) {
    console.error('创建提示词失败:', error);
    return NextResponse.json(
      { error: '创建提示词失败' },
      { status: 500 }
    );
  }
}

// 辅助函数：获取包含标签的提示词
async function getPromptWithTags(db: Database, promptId: string) {
  const promptRow = await db.prepare('SELECT * FROM prompts WHERE id = ?').get(promptId) as PromptRow;
  
  if (!promptRow) {
    return null;
  }

  // 获取标签
  const tagRows = await db.prepare(`
    SELECT t.name 
    FROM tags t 
    JOIN prompt_tags pt ON t.id = pt.tag_id 
    WHERE pt.prompt_id = ?
  `).all(promptId) as { name: string }[];

  // 转换数据格式 - 直接使用prompts表中的用户版本号
  const prompt = {
    ...promptRow,
    is_favorite: Boolean(promptRow.is_favorite),
    tags: tagRows.map(row => row.name),
    version: promptRow.version || 'v1.0', // 直接使用用户设置的版本号
    variables: promptRow.variables ? JSON.parse(promptRow.variables) : {}
  };

  return prompt;
} 