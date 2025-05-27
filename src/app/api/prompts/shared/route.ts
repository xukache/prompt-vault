import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/sqlite";
import { getCurrentUserId } from "@/lib/auth/server-cookies";

interface SharedPromptRow {
  id: string;
  title: string;
  content: string;
  description: string;
  share_description: string;
  rating: number;
  like_count: number;
  share_count: number;
  shared_at: string;
  user_id: string;
  category_name: string;
  author_name: string;
  is_liked: number;
  is_favorited: number;
}

interface TagRow {
  name: string;
}

export async function GET(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "all";
    const sort = searchParams.get("sort") || "latest";

    const db = await getDbConnection();

    // 构建查询条件
    let whereClause = "WHERE p.is_shared = 1";
    const params: any[] = [];

    // 搜索条件
    if (search) {
      whereClause += " AND (p.title LIKE ? OR p.description LIKE ? OR p.share_description LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // 分类筛选
    if (category !== "all") {
      whereClause += " AND c.name LIKE ?";
      params.push(`%${category}%`);
    }

    // 排序条件
    let orderClause = "";
    switch (sort) {
      case "popular":
        orderClause = "ORDER BY p.like_count DESC, p.shared_at DESC";
        break;
      case "rating":
        orderClause = "ORDER BY p.rating DESC, p.shared_at DESC";
        break;
      case "most_shared":
        orderClause = "ORDER BY p.share_count DESC, p.shared_at DESC";
        break;
      default:
        orderClause = "ORDER BY p.shared_at DESC";
    }

    // 查询共享提示词
    const query = `
      SELECT
        p.id,
        p.title,
        p.content,
        p.description,
        p.share_description,
        p.rating,
        p.like_count,
        p.share_count,
        p.shared_at,
        p.user_id,
        c.name as category_name,
        CASE
          WHEN p.user_id = '1' THEN '系统管理员'
          WHEN p.user_id = '2' THEN '普通用户'
          ELSE '用户' || p.user_id
        END as author_name,
        CASE WHEN pl.user_id IS NOT NULL THEN 1 ELSE 0 END as is_liked,
        CASE WHEN spf.user_id IS NOT NULL THEN 1 ELSE 0 END as is_favorited
      FROM prompts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN prompt_likes pl ON p.id = pl.prompt_id AND pl.user_id = ?
      LEFT JOIN shared_prompt_favorites spf ON p.id = spf.prompt_id AND spf.user_id = ?
      ${whereClause}
      ${orderClause}
      LIMIT 50
    `;

    const sharedPrompts = db.prepare(query).all(currentUserId, currentUserId, ...params) as SharedPromptRow[];

    // 获取每个提示词的标签
    const promptsWithTags = await Promise.all(
      sharedPrompts.map(async (prompt) => {
        const tags = db.prepare(`
          SELECT t.name
          FROM tags t
          JOIN prompt_tags pt ON t.id = pt.tag_id
          WHERE pt.prompt_id = ?
        `).all(prompt.id) as TagRow[];

        return {
          ...prompt,
          tags: tags.map((tag) => tag.name),
        };
      })
    );

    return NextResponse.json(promptsWithTags);
  } catch (error) {
    console.error("获取共享提示词失败:", error);
    return NextResponse.json(
      { error: "获取共享提示词失败" },
      { status: 500 }
    );
  }
}