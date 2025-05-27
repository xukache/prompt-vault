import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/sqlite';
import { PromptVersion } from '@/types';

// GET /api/prompts/[id]/versions - 获取提示词的版本历史
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDbConnection();

    // 获取版本历史，按版本号降序排列
    let versions = db.prepare(`
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
      WHERE prompt_id = ?
      ORDER BY version_number DESC
    `).all(id) as (PromptVersion & { user_version?: string })[];

    // 如果没有版本记录，检查提示词是否存在以及是否有版本号
    if (versions.length === 0) {
      // 获取提示词信息
      const prompt = db.prepare(`
        SELECT title, content, version, created_at
        FROM prompts 
        WHERE id = ?
      `).get(id) as { title: string; content: string; version: string; created_at: string } | undefined;

      if (!prompt) {
        return NextResponse.json(
          { error: '提示词不存在' },
          { status: 404 }
        );
      }

      // 检查提示词是否有版本号
      if (!prompt.version || prompt.version.trim() === '') {
        return NextResponse.json(
          { error: '提示词版本号未设置，请编辑提示词并设置版本号' },
          { status: 400 }
        );
      }

      // 创建初始版本记录，使用提示词的version字段作为user_version
      const versionId = `version-${id}-1-${Date.now()}`;
      
      db.prepare(`
        INSERT INTO prompt_versions (
          id, prompt_id, version_number, user_version, title, content, change_description, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        versionId,
        id,
        1,
        prompt.version, // 使用用户设置的版本号
        prompt.title,
        prompt.content,
        '初始版本',
        prompt.created_at // 使用提示词的创建时间
      );

      // 重新获取版本历史
      versions = db.prepare(`
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
        WHERE prompt_id = ?
        ORDER BY version_number DESC
      `).all(id) as (PromptVersion & { user_version?: string })[];
    }

    return NextResponse.json(versions);
  } catch (error) {
    console.error('获取版本历史失败:', error);
    return NextResponse.json(
      { error: '获取版本历史失败' },
      { status: 500 }
    );
  }
}

// POST /api/prompts/[id]/versions - 创建新版本
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, user_version, change_description } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();

    // 获取当前最大版本号
    const maxVersionResult = db.prepare(`
      SELECT MAX(version_number) as max_version
      FROM prompt_versions
      WHERE prompt_id = ?
    `).get(id) as { max_version: number | null };

    const nextVersionNumber = (maxVersionResult?.max_version || 0) + 1;

    // 创建新版本记录
    const versionId = `version-${id}-${nextVersionNumber}-${Date.now()}`;
    
    db.prepare(`
      INSERT INTO prompt_versions (
        id, prompt_id, version_number, user_version, title, content, change_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      versionId,
      id,
      nextVersionNumber,
      user_version || `v${nextVersionNumber}`,
      title,
      content,
      change_description || null
    );

    // 获取新创建的版本
    const newVersion = db.prepare(`
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
      WHERE id = ?
    `).get(versionId) as PromptVersion & { user_version?: string };

    return NextResponse.json(newVersion, { status: 201 });
  } catch (error) {
    console.error('创建版本失败:', error);
    return NextResponse.json(
      { error: '创建版本失败' },
      { status: 500 }
    );
  }
} 