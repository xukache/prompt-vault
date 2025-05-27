import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/sqlite';
import { PromptResult } from '@/types';

// GET /api/prompts/[id]/results/[resultId] - 获取特定效果记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resultId: string }> }
) {
  try {
    const { id, resultId } = await params;
    const db = await getDbConnection();

    const result = db.prepare(`
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
      WHERE id = ? AND prompt_id = ?
    `).get(resultId, id) as PromptResult | undefined;

    if (!result) {
      return NextResponse.json(
        { error: '效果记录不存在' },
        { status: 404 }
      );
    }

    // 处理字段映射
    const parsedResult = {
      ...result,
      cover_image: result.cover_image || null
    };

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error('获取效果记录失败:', error);
    return NextResponse.json(
      { error: '获取效果记录失败' },
      { status: 500 }
    );
  }
}

// PUT /api/prompts/[id]/results/[resultId] - 更新效果记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resultId: string }> }
) {
  try {
    const { id, resultId } = await params;
    const body = await request.json();
    const { rating, feedback } = body;

    const db = await getDbConnection();

    // 检查记录是否存在
    const existingResult = db.prepare(`
      SELECT id FROM prompt_results 
      WHERE id = ? AND prompt_id = ?
    `).get(resultId, id);

    if (!existingResult) {
      return NextResponse.json(
        { error: '效果记录不存在' },
        { status: 404 }
      );
    }

    // 更新记录
    db.prepare(`
      UPDATE prompt_results 
      SET rating = ?, feedback = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND prompt_id = ?
    `).run(rating, feedback || null, resultId, id);

    // 获取更新后的记录
          const updatedResult = db.prepare(`
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
      ...updatedResult,
      cover_image: updatedResult.cover_image || null
    };

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error('更新效果记录失败:', error);
    return NextResponse.json(
      { error: '更新效果记录失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/prompts/[id]/results/[resultId] - 删除效果记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resultId: string }> }
) {
  try {
    const { id, resultId } = await params;
    const db = await getDbConnection();

    // 检查记录是否存在
    const existingResult = db.prepare(`
      SELECT id FROM prompt_results 
      WHERE id = ? AND prompt_id = ?
    `).get(resultId, id);

    if (!existingResult) {
      return NextResponse.json(
        { error: '效果记录不存在' },
        { status: 404 }
      );
    }

    // 删除相关评价
    db.prepare('DELETE FROM result_ratings WHERE result_id = ?').run(resultId);

    // 删除效果记录
    db.prepare(`
      DELETE FROM prompt_results 
      WHERE id = ? AND prompt_id = ?
    `).run(resultId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除效果记录失败:', error);
    return NextResponse.json(
      { error: '删除效果记录失败' },
      { status: 500 }
    );
  }
} 