import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/sqlite';

interface VersionRow {
  id: string;
  prompt_id: string;
  version_number: number;
  user_version: string;
  version: string;
  title: string;
  content: string;
  change_description: string;
  created_at: string;
}

interface PromptRow {
  id: string;
  title: string;
  content: string;
  description: string;
  category_id: string;
  rating: number;
  is_favorite: number;
  version: string;
  instructions: string;
  notes: string;
  variables: string;
}

// POST /api/prompts/[id]/revert - 回滚到指定版本
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { versionId } = body;

    if (!versionId) {
      return NextResponse.json(
        { error: '版本ID不能为空' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();

    // 获取要回滚到的版本
    const targetVersion = db.prepare(`
      SELECT
        id,
        prompt_id,
        version_number,
        user_version,
        title,
        content,
        change_description,
        created_at
      FROM prompt_versions
      WHERE id = ? AND prompt_id = ?
    `).get(versionId, id) as VersionRow | undefined;

    if (!targetVersion) {
      return NextResponse.json(
        { error: '目标版本不存在' },
        { status: 404 }
      );
    }

    // 获取当前提示词信息
    const currentPrompt = db.prepare(`
      SELECT
        id, title, content, description, category_id, rating, is_favorite,
        version, instructions, notes, variables
      FROM prompts
      WHERE id = ?
    `).get(id) as PromptRow | undefined;

    if (!currentPrompt) {
      return NextResponse.json(
        { error: '提示词不存在' },
        { status: 404 }
      );
    }

    // 开始事务 - 真正的回滚逻辑
    const transaction = db.transaction(() => {
      // 1. 删除目标版本之后的所有版本
      db.prepare(`
        DELETE FROM prompt_versions
        WHERE prompt_id = ? AND version_number > ?
      `).run(id, targetVersion.version_number);

      // 2. 更新主提示词记录为目标版本的内容
      db.prepare(`
        UPDATE prompts
        SET
          title = ?,
          content = ?,
          version = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        targetVersion.title,
        targetVersion.content,
        targetVersion.user_version || targetVersion.version || 'v1.0',
        id
      );
    });

    // 执行事务
    transaction();

    // 获取更新后的提示词
    const updatedPrompt = db.prepare(`
      SELECT
        p.*,
        c.name as category_name
      FROM prompts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id) as any;

    // 解析variables
    if (updatedPrompt && updatedPrompt.variables) {
      try {
        updatedPrompt.variables = JSON.parse(updatedPrompt.variables);
      } catch {
        updatedPrompt.variables = {};
      }
    }

    return NextResponse.json({
      success: true,
      prompt: updatedPrompt,
      message: `已成功回滚到版本 ${targetVersion.user_version || targetVersion.version_number}，后续版本已删除`
    });
  } catch (error) {
    console.error('版本回滚失败:', error);
    return NextResponse.json(
      { error: '版本回滚失败' },
      { status: 500 }
    );
  }
}