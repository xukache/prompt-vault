import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/sqlite";
import { requireAuth } from "@/lib/auth/server-cookies";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const { promptIds, shareDescription } = await request.json();

    if (!promptIds || !Array.isArray(promptIds) || promptIds.length === 0) {
      return NextResponse.json(
        { error: "请选择要共享的提示词" },
        { status: 400 }
      );
    }

    if (!shareDescription || !shareDescription.trim()) {
      return NextResponse.json(
        { error: "请填写共享描述" },
        { status: 400 }
      );
    }

    const db = await getDbConnection();

    // 检查用户是否拥有这些提示词
    const placeholders = promptIds.map(() => '?').join(',');
    const ownedPrompts = db.prepare(`
      SELECT id, title, is_shared 
      FROM prompts 
      WHERE id IN (${placeholders}) AND user_id = ?
    `).all(...promptIds, userId);

    if (ownedPrompts.length !== promptIds.length) {
      return NextResponse.json(
        { error: "只能共享自己的提示词" },
        { status: 403 }
      );
    }

    // 过滤出未共享的提示词
    const unsharedPrompts = ownedPrompts.filter((prompt: { id: string; title: string; is_shared: boolean }) => !prompt.is_shared);
    
    if (unsharedPrompts.length === 0) {
      return NextResponse.json(
        { error: "选中的提示词已全部共享" },
        { status: 400 }
      );
    }

    // 批量更新提示词为共享状态
    const updatePrompt = db.prepare(`
      UPDATE prompts 
      SET is_shared = 1, 
          shared_at = CURRENT_TIMESTAMP, 
          share_description = ?,
          share_count = 0,
          like_count = 0
      WHERE id = ? AND user_id = ?
    `);

    let sharedCount = 0;
    for (const prompt of unsharedPrompts) {
      try {
        updatePrompt.run(shareDescription.trim(), prompt.id, userId);
        sharedCount++;
      } catch (error) {
        console.error(`共享提示词 ${prompt.id} 失败:`, error);
      }
    }

    return NextResponse.json({
      sharedCount,
      totalSelected: promptIds.length,
      message: `成功共享 ${sharedCount} 个提示词`
    });
  } catch (error) {
    console.error("批量共享提示词失败:", error);
    return NextResponse.json(
      { error: "批量共享提示词失败" },
      { status: 500 }
    );
  }
} 