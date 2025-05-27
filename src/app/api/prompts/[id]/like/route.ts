import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/sqlite";
import { requireAuth } from "@/lib/auth/server-cookies";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id: promptId } = await params;

    const db = await getDbConnection();

    // 检查提示词是否存在且已共享
    const prompt = db.prepare(`
      SELECT id, is_shared, like_count 
      FROM prompts 
      WHERE id = ? AND is_shared = 1
    `).get(promptId);

    if (!prompt) {
      return NextResponse.json(
        { error: "提示词不存在或未共享" },
        { status: 404 }
      );
    }

    // 检查用户是否已经点赞
    const existingLike = db.prepare(`
      SELECT id FROM prompt_likes 
      WHERE prompt_id = ? AND user_id = ?
    `).get(promptId, userId);

    let isLiked: boolean;
    let newLikeCount: number;

    if (existingLike) {
      // 取消点赞
      db.prepare(`DELETE FROM prompt_likes WHERE id = ?`).run(existingLike.id);
      newLikeCount = Math.max(0, (prompt as { like_count: number }).like_count - 1);
      isLiked = false;
    } else {
      // 添加点赞
      const likeId = uuidv4();
      db.prepare(`
        INSERT INTO prompt_likes (id, prompt_id, user_id)
        VALUES (?, ?, ?)
      `).run(likeId, promptId, userId);
      newLikeCount = (prompt as { like_count: number }).like_count + 1;
      isLiked = true;
    }

    // 更新提示词的点赞数
    db.prepare(`
      UPDATE prompts 
      SET like_count = ? 
      WHERE id = ?
    `).run(newLikeCount, promptId);

    return NextResponse.json({
      is_liked: isLiked,
      like_count: newLikeCount,
    });
  } catch (error) {
    console.error("点赞操作失败:", error);
    return NextResponse.json(
      { error: "点赞操作失败" },
      { status: 500 }
    );
  }
} 