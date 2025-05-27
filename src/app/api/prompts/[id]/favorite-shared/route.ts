import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/sqlite";
import { requireAuth } from "@/lib/auth/server-cookies";
import { v4 as uuidv4 } from "uuid";

interface PromptRow {
  id: string;
  is_shared: number;
}

interface FavoriteRow {
  id: string;
}

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
      SELECT id, is_shared
      FROM prompts
      WHERE id = ? AND is_shared = 1
    `).get(promptId) as PromptRow | undefined;

    if (!prompt) {
      return NextResponse.json(
        { error: "提示词不存在或未共享" },
        { status: 404 }
      );
    }

    // 检查用户是否已经收藏
    const existingFavorite = db.prepare(`
      SELECT id FROM shared_prompt_favorites
      WHERE prompt_id = ? AND user_id = ?
    `).get(promptId, userId) as FavoriteRow | undefined;

    let isFavorited: boolean;

    if (existingFavorite) {
      // 取消收藏
      db.prepare(`DELETE FROM shared_prompt_favorites WHERE id = ?`).run(existingFavorite.id);
      isFavorited = false;
    } else {
      // 添加收藏
      const favoriteId = uuidv4();
      db.prepare(`
        INSERT INTO shared_prompt_favorites (id, prompt_id, user_id)
        VALUES (?, ?, ?)
      `).run(favoriteId, promptId, userId);
      isFavorited = true;
    }

    return NextResponse.json({
      is_favorited: isFavorited,
    });
  } catch (error) {
    console.error("收藏操作失败:", error);
    return NextResponse.json(
      { error: "收藏操作失败" },
      { status: 500 }
    );
  }
}