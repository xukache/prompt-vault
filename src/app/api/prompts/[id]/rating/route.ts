import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/sqlite";

interface PromptRow {
  id: string;
  rating: number;
}

// 提交评分
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { rating } = body;

    // 验证评分值
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '评分必须在1-5之间' },
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

    // 更新提示词评分
    // 这里简化处理，直接更新评分。实际项目中可能需要记录每个用户的评分
    await db.prepare(`
      UPDATE prompts
      SET rating = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(rating, params.id);

    // 获取更新后的提示词
    const updatedPrompt = await db.prepare('SELECT * FROM prompts WHERE id = ?').get(params.id) as PromptRow | undefined;

    return NextResponse.json({
      message: '评分提交成功',
      rating: updatedPrompt?.rating
    });
  } catch (error) {
    console.error('提交评分失败:', error);
    return NextResponse.json(
      { error: '提交评分失败' },
      { status: 500 }
    );
  }
}

// 获取评分统计
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const db = await getDbConnection();

    // 获取提示词评分
    const prompt = await db.prepare('SELECT rating FROM prompts WHERE id = ?').get(params.id) as PromptRow | undefined;

    if (!prompt) {
      return NextResponse.json(
        { error: '提示词不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      rating: prompt.rating || 0,
      // 这里可以扩展更多统计信息，比如评分分布等
    });
  } catch (error) {
    console.error('获取评分失败:', error);
    return NextResponse.json(
      { error: '获取评分失败' },
      { status: 500 }
    );
  }
}