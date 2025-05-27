import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

interface CategoryRow {
  id: string;
}

const dbPath = path.join(process.cwd(), 'data', 'prompts.db');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '请选择要导入的文件' },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    let importData: any;

    // 根据文件类型解析数据
    if (file.name.endsWith('.json')) {
      try {
        importData = JSON.parse(fileContent);
      } catch (error) {
        return NextResponse.json(
          { error: 'JSON文件格式错误' },
          { status: 400 }
        );
      }
    } else if (file.name.endsWith('.csv')) {
      // 简单的CSV解析（仅支持提示词导入）
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',');

      if (!headers.includes('标题') || !headers.includes('内容')) {
        return NextResponse.json(
          { error: 'CSV文件格式错误，缺少必要的列' },
          { status: 400 }
        );
      }

      const prompts = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = parseCSVLine(line);
        const prompt: any = {};

        headers.forEach((header, index) => {
          const cleanHeader = header.trim().replace(/"/g, '');
          const cleanValue = values[index]?.trim().replace(/^"|"$/g, '') || '';

          switch (cleanHeader) {
            case '标题':
              prompt.title = cleanValue;
              break;
            case '内容':
              prompt.content = cleanValue;
              break;
            case '分类':
              prompt.category_name = cleanValue;
              break;
            case '标签':
              prompt.tags = cleanValue;
              break;
          }
        });

        return prompt;
      }).filter(prompt => prompt.title && prompt.content);

      importData = {
        data: {
          prompts,
          knowledge: [],
          categories: []
        }
      };
    } else {
      return NextResponse.json(
        { error: '不支持的文件格式，请使用JSON或CSV文件' },
        { status: 400 }
      );
    }

    // 验证导入数据结构
    if (!importData.data) {
      return NextResponse.json(
        { error: '导入文件格式错误，缺少data字段' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);
    let importedCount = 0;

    try {
      db.exec('BEGIN TRANSACTION');

      // 导入分类
      if (importData.data.categories && Array.isArray(importData.data.categories)) {
        const insertCategory = db.prepare(`
          INSERT OR IGNORE INTO categories (name, description, color, parent_id)
          VALUES (?, ?, ?, ?)
        `);

        for (const category of importData.data.categories) {
          if (category.name) {
            insertCategory.run(
              category.name,
              category.description || null,
              category.color || '#3b82f6',
              category.parent_id || null
            );
            importedCount++;
          }
        }
      }

      // 导入提示词
      if (importData.data.prompts && Array.isArray(importData.data.prompts)) {
        const insertPrompt = db.prepare(`
          INSERT INTO prompts (title, content, variables, category_id, is_favorite, rating, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `);

        const insertTag = db.prepare(`
          INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_name)
          VALUES (?, ?)
        `);

        const getCategoryId = db.prepare(`
          SELECT id FROM categories WHERE name = ?
        `);

        for (const prompt of importData.data.prompts) {
          if (prompt.title && prompt.content) {
            // 获取分类ID
            let categoryId = null;
            if (prompt.category_name) {
              const category = getCategoryId.get(prompt.category_name) as CategoryRow | undefined;
              categoryId = category?.id || null;
            }

            // 插入提示词
            const result = insertPrompt.run(
              prompt.title,
              prompt.content,
              prompt.variables || null,
              categoryId,
              prompt.is_favorite || 0,
              prompt.rating || 0
            );

            const promptId = result.lastInsertRowid;

            // 插入标签
            if (prompt.tags) {
              const tags = prompt.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
              for (const tag of tags) {
                insertTag.run(promptId, tag);
              }
            }

            importedCount++;
          }
        }
      }

      // 导入知识库
      if (importData.data.knowledge && Array.isArray(importData.data.knowledge)) {
        const insertKnowledge = db.prepare(`
          INSERT INTO knowledge_base (title, content, type, tags, created_at, updated_at)
          VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        `);

        for (const item of importData.data.knowledge) {
          if (item.title && item.content) {
            insertKnowledge.run(
              item.title,
              item.content,
              item.type || '其他',
              item.tags || null
            );
            importedCount++;
          }
        }
      }

      db.exec('COMMIT');

      return NextResponse.json({
        success: true,
        imported: importedCount,
        message: `成功导入 ${importedCount} 条数据`
      });

    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    } finally {
      db.close();
    }

  } catch (error) {
    console.error('导入数据失败:', error);
    return NextResponse.json(
      { error: '导入数据失败，请检查文件格式' },
      { status: 500 }
    );
  }
}

// 简单的CSV行解析函数
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 转义的引号
        current += '"';
        i++; // 跳过下一个引号
      } else {
        // 切换引号状态
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 字段分隔符
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}