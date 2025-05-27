import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/sqlite';
import { requireAuth } from '@/lib/auth/server-cookies';

interface PromptRow {
  id: string;
  title: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const { title, content } = await request.json();

    console.log('检查重复提示词:', { userId, title, contentLength: content?.length });

    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();

    // 检查是否存在相同标题或相同内容的提示词
    const baseTitle = title.replace(' (来自广场)', ''); // 去掉后缀的基础标题

    const existingPrompt = db.prepare(`
      SELECT id, title, content
      FROM prompts
      WHERE user_id = ? AND (
        title = ? OR
        title = ? OR
        content = ?
      )
    `).get(
      userId,
      title,           // 检查完整标题
      baseTitle,       // 检查去掉后缀的标题
      content          // 检查相同内容
    ) as PromptRow | undefined;

    if (existingPrompt) {
      console.log('发现重复提示词:', existingPrompt);
      return NextResponse.json({
        exists: true,
        existingPrompt: {
          id: existingPrompt.id,
          title: existingPrompt.title
        }
      });
    }

    console.log('未发现重复提示词');
    return NextResponse.json({ exists: false });

  } catch (error) {
    console.error('检查重复提示词失败:', error);
    return NextResponse.json(
      { error: '检查失败' },
      { status: 500 }
    );
  }
}