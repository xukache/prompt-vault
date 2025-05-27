import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/sqlite";

interface PromptRow {
  id: string;
  is_favorite: number;
}

// 切换收藏状态
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { is_favorite } = body;

    // 验证参数
    if (typeof is_favorite !== 'boolean') {
      return NextResponse.json(
        { error: 'is_favorite 必须是布尔值' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();

    // 检查提示词是否存在
    const prompt = await db.prepare('SELECT * FROM prompts WHERE id = ?').get(params.id) as PromptRow | undefined;
    if (!prompt) {
      return NextResponse.json(
        { error: '提示词不存在' },
        { status: 404 }
      );
    }

    // 更新收藏状态
    await db.prepare(`
      UPDATE prompts
      SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(is_favorite ? 1 : 0, params.id);

    // 获取更新后的提示词
    const updatedPrompt = await db.prepare('SELECT * FROM prompts WHERE id = ?').get(params.id) as PromptRow | undefined;

    return NextResponse.json({
      message: is_favorite ? '已添加到收藏' : '已取消收藏',
      is_favorite: Boolean(updatedPrompt?.is_favorite)
    });
  } catch (error) {
    console.error('更新收藏状态失败:', error);
    return NextResponse.json(
      { error: '更新收藏状态失败' },
      { status: 500 }
    );
  }
}