import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/connection';

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const db = await getDbConnection();

    // 获取提示词基本信息
    const prompt = db.prepare(`
      SELECT 
        p.id, p.title, p.content, p.description, p.category_id, p.rating, 
        p.is_favorite, p.created_at, p.updated_at, p.version, p.instructions, 
        p.notes, p.variables,
        c.name as category_name
      FROM prompts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(params.id) as PromptRow & { category_name?: string } | undefined;

    if (!prompt) {
      return NextResponse.json(
        { error: '提示词不存在' },
        { status: 404 }
      );
    }

    // 检查用户是否设置了版本号，如果没有则提示必填
    if (!prompt.version || prompt.version.trim() === '') {
      return NextResponse.json(
        { error: '提示词版本号未设置，请编辑提示词并设置版本号' },
        { status: 400 }
      );
    }

    // 获取标签
    const tags = db.prepare(`
      SELECT t.name
      FROM tags t
      JOIN prompt_tags pt ON t.id = pt.tag_id
      WHERE pt.prompt_id = ?
    `).all(params.id) as { name: string }[];

    // 解析variables字段
    let parsedVariables = {};
    if (prompt.variables) {
      try {
        parsedVariables = JSON.parse(prompt.variables);
      } catch (error) {
        console.error('解析variables字段失败:', error);
      }
    }

    // 构建返回数据 - 直接使用用户设置的版本号
    const result = {
      id: prompt.id,
      title: prompt.title,
      content: prompt.content,
      description: prompt.description,
      category_id: prompt.category_id,
      category_name: prompt.category_name,
      rating: prompt.rating,
      is_favorite: Boolean(prompt.is_favorite),
      created_at: prompt.created_at,
      updated_at: prompt.updated_at,
      version: prompt.version, // 直接使用用户设置的版本号
      instructions: prompt.instructions,
      notes: prompt.notes,
      variables: parsedVariables,
      tags: tags.map(tag => tag.name)
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取提示词失败:', error);
    return NextResponse.json(
      { error: '获取提示词失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { title, content, description, category_id, tags, version, instructions, notes, variables, changeDescription } = body;

    // 验证必填字段
    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容不能为空' },
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
    
    // 获取当前提示词信息（用于对比内容变化）
    const currentPrompt = db.prepare(`
      SELECT title, content, description, category_id, version, instructions, notes, variables
      FROM prompts 
      WHERE id = ?
    `).get(params.id) as {
      title: string;
      content: string;
      description?: string;
      category_id?: string;
      version?: string;
      instructions?: string;
      notes?: string;
      variables?: string;
    } | undefined;

    if (!currentPrompt) {
      return NextResponse.json(
        { error: '提示词不存在' },
        { status: 404 }
      );
    }

    // 将新的variables对象转换为JSON字符串用于对比
    const newVariablesJson = variables ? JSON.stringify(variables) : null;
    
    // 检查内容是否真正发生了变化
    const hasContentChanged = (
      currentPrompt.title !== title ||
      currentPrompt.content !== content ||
      (currentPrompt.description || '') !== (description || '') ||
      (currentPrompt.category_id || '') !== (category_id || '') ||
      (currentPrompt.instructions || '') !== (instructions || '') ||
      (currentPrompt.notes || '') !== (notes || '') ||
      (currentPrompt.variables || '') !== (newVariablesJson || '') ||
      currentPrompt.version !== version
    );

    // 开始事务
    const transaction = db.transaction(() => {
      // 只有在内容真正发生变化时才创建版本历史记录
      if (hasContentChanged) {
        const maxVersionResult = db.prepare(`
          SELECT MAX(version_number) as max_version
          FROM prompt_versions
          WHERE prompt_id = ?
        `).get(params.id) as { max_version: number | null };
        
        const nextVersionNumber = (maxVersionResult?.max_version || 0) + 1;
        const versionId = `version-${params.id}-${nextVersionNumber}-${Date.now()}`;

        db.prepare(`
          INSERT INTO prompt_versions (
            id, prompt_id, version_number, user_version, title, content, change_description
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          versionId,
          params.id,
          nextVersionNumber,
          currentPrompt.version || 'v1.0', // 保存编辑前的用户版本号
          currentPrompt.title,
          currentPrompt.content,
          changeDescription || '编辑更新'
        );
      }

      // 更新提示词（无论内容是否变化都要更新，因为可能只是重新保存）
      db.prepare(`
        UPDATE prompts 
        SET title = ?, content = ?, description = ?, category_id = ?, 
            version = ?, instructions = ?, notes = ?, variables = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(title, content, description, category_id, version, instructions, notes, newVariablesJson, params.id);

      // 更新标签关联
      if (tags && Array.isArray(tags)) {
        // 删除现有标签关联
        db.prepare('DELETE FROM prompt_tags WHERE prompt_id = ?').run(params.id);

        // 添加新的标签关联（使用tag_id）
        for (const tagName of tags) {
          // 查找或创建标签
          let tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName) as { id: string } | undefined;
          
          if (!tag) {
            // 创建新标签，使用连字符格式的ID
            const tagId = `tag-${tagName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
            db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)').run(tagId, tagName);
            tag = { id: tagId };
          }

          // 创建关联（使用tag_id）
          db.prepare('INSERT INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)').run(params.id, tag.id);
        }
      }
    });

    // 执行事务
    transaction();

    const message = hasContentChanged 
      ? '提示词更新成功，已自动创建版本历史'
      : '提示词保存成功，内容无变化未创建新版本';

    return NextResponse.json({ 
      success: true,
      message,
      hasContentChanged
    });
  } catch (error) {
    console.error('更新提示词失败:', error);
    return NextResponse.json(
      { error: '更新提示词失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const db = await getDbConnection();

    // 删除标签关联
    db.prepare('DELETE FROM prompt_tags WHERE prompt_id = ?').run(params.id);

    // 删除提示词
    const result = db.prepare('DELETE FROM prompts WHERE id = ?').run(params.id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: '提示词不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除提示词失败:', error);
    return NextResponse.json(
      { error: '删除提示词失败' },
      { status: 500 }
    );
  }
} 