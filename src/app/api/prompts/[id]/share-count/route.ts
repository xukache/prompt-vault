import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/sqlite";
import { requireAuth } from "@/lib/auth/server-cookies";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(); // 验证用户登录状态
    const { id: promptId } = await params;

    const db = await getDbConnection();

    // 检查提示词是否存在且已共享
    const prompt = db.prepare(`
      SELECT id, is_shared, share_count 
      FROM prompts 
      WHERE id = ? AND is_shared = 1
    `).get(promptId);

    if (!prompt) {
      return NextResponse.json(
        { error: "提示词不存在或未共享" },
        { status: 404 }
      );
    }

    // 更新分享次数
    const newShareCount = (prompt as { share_count: number }).share_count + 1;
    db.prepare(`
      UPDATE prompts 
      SET share_count = ? 
      WHERE id = ?
    `).run(newShareCount, promptId);

    return NextResponse.json({
      share_count: newShareCount,
    });
  } catch (error) {
    console.error("更新分享次数失败:", error);
    return NextResponse.json(
      { error: "更新分享次数失败" },
      { status: 500 }
    );
  }
} 