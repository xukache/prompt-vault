import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/sqlite';
import { PromptResult } from '@/types';

// GET /api/prompts/[id]/results - 获取提示词的效果记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDbConnection();

    // 获取效果记录，按创建时间降序排列
    const results = db.prepare(`
      SELECT 
        id,
        prompt_id,
        title,
        input_variables as cover_image,
        generated_content,
        result_type,
        result_data,
        rating,
        feedback,
        created_at,
        updated_at
      FROM prompt_results 
      WHERE prompt_id = ?
      ORDER BY created_at DESC
    `).all(id) as PromptResult[];

    // 处理字段映射
    const parsedResults = results.map(result => ({
      ...result,
      cover_image: result.cover_image || null
    }));

    return NextResponse.json(parsedResults);
  } catch (error) {
    console.error('获取效果记录失败:', error);
    return NextResponse.json(
      { error: '获取效果记录失败' },
      { status: 500 }
    );
  }
}

// POST /api/prompts/[id]/results - 创建新的效果记录
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      title,
      cover_image, 
      generated_content, 
      result_type = 'text', 
      result_data, 
      rating = 0, 
      feedback 
    } = body;

    // 对于非图片和非HTML类型，生成内容是必填的
    if (result_type !== 'image' && result_type !== 'html' && !generated_content) {
      return NextResponse.json(
        { error: '生成内容不能为空' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();

    // 检查提示词是否存在
    const prompt = db.prepare('SELECT id FROM prompts WHERE id = ?').get(id);
    if (!prompt) {
      return NextResponse.json(
        { error: '提示词不存在' },
        { status: 404 }
      );
    }

    // 创建效果记录
    const resultId = `result-${id}-${Date.now()}`;
    
    db.prepare(`
      INSERT INTO prompt_results (
        id, prompt_id, title, input_variables, generated_content, 
        result_type, result_data, rating, feedback
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      resultId,
      id,
      title || null,
      cover_image || null,
      generated_content || null,
      result_type,
      result_data || null,
      rating,
      feedback || null
    );

    // 获取新创建的记录
    const newResult = db.prepare(`
      SELECT 
        id,
        prompt_id,
        title,
        input_variables as cover_image,
        generated_content,
        result_type,
        result_data,
        rating,
        feedback,
        created_at,
        updated_at
      FROM prompt_results 
      WHERE id = ?
    `).get(resultId) as PromptResult;

    // 处理字段映射
    const parsedResult = {
      ...newResult,
      cover_image: newResult.cover_image || null
    };

    return NextResponse.json(parsedResult, { status: 201 });
  } catch (error) {
    console.error('创建效果记录失败:', error);
    return NextResponse.json(
      { error: '创建效果记录失败' },
      { status: 500 }
    );
  }
} 