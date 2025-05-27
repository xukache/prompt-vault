import { NextResponse } from "next/server";
import { searchSimilarDocuments } from "@/lib/vector/orama";

// 向量搜索API
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      query, 
      limit = 10, 
      mode = 'hybrid' 
    } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '搜索查询不能为空' },
        { status: 400 }
      );
    }

    // 验证搜索模式
    const validModes = ['fulltext', 'vector', 'hybrid'];
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { error: '无效的搜索模式' },
        { status: 400 }
      );
    }

    // 执行向量搜索
    const results = await searchSimilarDocuments(
      query, 
      Math.min(limit, 50), // 限制最大结果数
      mode
    );

    return NextResponse.json({
      query,
      mode,
      results,
      count: results.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('向量搜索失败:', error);
    return NextResponse.json(
      { 
        error: '搜索服务暂时不可用',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 获取搜索统计信息
export async function GET() {
  try {
    const { getDatabaseStats } = await import('@/lib/vector/orama');
    const stats = await getDatabaseStats();

    return NextResponse.json({
      ...stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('获取搜索统计失败:', error);
    return NextResponse.json(
      { 
        error: '无法获取搜索统计信息',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 