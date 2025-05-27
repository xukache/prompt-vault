import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

interface PromptRow {
  id: string;
  title: string;
  content: string;
  category_name: string;
  tags: string;
  created_at: string;
  updated_at: string;
  variables?: string;
}

interface KnowledgeRow {
  title: string;
  content: string;
  type: string;
  tags: string;
  created_at: string;
}

interface CategoryRow {
  name: string;
  description?: string;
}

const dbPath = path.join(process.cwd(), 'data', 'prompts.db');

export async function POST(request: NextRequest) {
  try {
    const { format } = await request.json();

    if (!['json', 'csv', 'markdown'].includes(format)) {
      return NextResponse.json(
        { error: '不支持的导出格式' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);

    // 获取所有数据
    const prompts = db.prepare(`
      SELECT
        p.*,
        c.name as category_name,
        GROUP_CONCAT(t.name) as tags
      FROM prompts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN prompt_tags pt ON p.id = pt.prompt_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all() as PromptRow[];

    const knowledge = db.prepare(`
      SELECT * FROM knowledge_base ORDER BY created_at DESC
    `).all() as KnowledgeRow[];

    const categories = db.prepare(`
      SELECT * FROM categories ORDER BY name
    `).all() as CategoryRow[];

    db.close();

    let content: string;
    let filename: string;
    let contentType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify({
          exportDate: new Date().toISOString(),
          version: '1.0',
          data: {
            prompts,
            knowledge,
            categories
          }
        }, null, 2);
        filename = `promptvault-export-${new Date().toISOString().split('T')[0]}.json`;
        contentType = 'application/json';
        break;

      case 'csv':
        // 导出提示词为CSV格式
        const csvHeaders = ['ID', '标题', '内容', '分类', '标签', '创建时间', '更新时间'];
        const csvRows = prompts.map(prompt => [
          prompt.id,
          `"${prompt.title.replace(/"/g, '""')}"`,
          `"${prompt.content.replace(/"/g, '""')}"`,
          `"${prompt.category_name || ''}"`,
          `"${prompt.tags || ''}"`,
          prompt.created_at,
          prompt.updated_at
        ]);

        content = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
        filename = `promptvault-prompts-${new Date().toISOString().split('T')[0]}.csv`;
        contentType = 'text/csv';
        break;

      case 'markdown':
        content = generateMarkdownExport(prompts, knowledge, categories);
        filename = `promptvault-export-${new Date().toISOString().split('T')[0]}.md`;
        contentType = 'text/markdown';
        break;

      default:
        return NextResponse.json(
          { error: '不支持的导出格式' },
          { status: 400 }
        );
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('导出数据失败:', error);
    return NextResponse.json(
      { error: '导出数据失败' },
      { status: 500 }
    );
  }
}

function generateMarkdownExport(prompts: PromptRow[], knowledge: KnowledgeRow[], categories: CategoryRow[]): string {
  const exportDate = new Date().toLocaleDateString('zh-CN');

  let markdown = `# PromptVault 数据导出

**导出日期:** ${exportDate}
**导出版本:** 1.0

---

## 📝 提示词库 (${prompts.length} 条)

`;

  // 按分类组织提示词
  const promptsByCategory = prompts.reduce((acc, prompt) => {
    const categoryName = prompt.category_name || '未分类';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(prompt);
    return acc;
  }, {} as Record<string, PromptRow[]>);

  Object.entries(promptsByCategory).forEach(([categoryName, categoryPrompts]) => {
    markdown += `### ${categoryName}\n\n`;

    categoryPrompts.forEach(prompt => {
      markdown += `#### ${prompt.title}\n\n`;
      markdown += `**标签:** ${prompt.tags || '无'}\n`;
      markdown += `**创建时间:** ${new Date(prompt.created_at).toLocaleDateString('zh-CN')}\n`;
      markdown += `**更新时间:** ${new Date(prompt.updated_at).toLocaleDateString('zh-CN')}\n\n`;
      markdown += `**内容:**\n\`\`\`\n${prompt.content}\n\`\`\`\n\n`;

      if (prompt.variables) {
        markdown += `**变量:** ${prompt.variables}\n\n`;
      }

      markdown += '---\n\n';
    });
  });

  // 知识库部分
  if (knowledge.length > 0) {
    markdown += `## 📚 知识库 (${knowledge.length} 条)\n\n`;

    knowledge.forEach(item => {
      markdown += `### ${item.title}\n\n`;
      markdown += `**类型:** ${item.type || '未分类'}\n`;
      markdown += `**标签:** ${item.tags || '无'}\n`;
      markdown += `**创建时间:** ${new Date(item.created_at).toLocaleDateString('zh-CN')}\n\n`;
      markdown += `**内容:**\n${item.content}\n\n`;
      markdown += '---\n\n';
    });
  }

  // 分类部分
  if (categories.length > 0) {
    markdown += `## 🏷️ 分类列表 (${categories.length} 个)\n\n`;

    categories.forEach(category => {
      markdown += `- **${category.name}**`;
      if (category.description) {
        markdown += `: ${category.description}`;
      }
      markdown += '\n';
    });
  }

  markdown += `\n---\n\n*导出自 PromptVault - 提示词管理工具*\n`;

  return markdown;
}