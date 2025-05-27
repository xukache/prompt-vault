import { getDbConnection } from "../src/lib/db/sqlite";

async function addSharedPrompts() {
  try {
    const db = await getDbConnection();

    // 添加一些测试的共享提示词
    const sharedPrompts = [
      {
        id: 'shared-1',
        title: '创意写作助手',
        content: `你是一个专业的创意写作助手。请根据以下要求创作内容：

**主题**: {{主题}}
**风格**: {{写作风格}}
**字数**: {{字数要求}}

请确保内容：
1. 符合指定主题和风格
2. 具有创意和吸引力
3. 语言流畅自然
4. 达到指定字数要求

开始创作：`,
        description: '帮助用户进行创意写作的专业助手',
        share_description: '专业的创意写作助手，支持多种主题和风格，适合各种写作需求',
        category_id: 'writing',
        user_id: '1',
        rating: 4.5,
        like_count: 15,
        share_count: 8,
        is_shared: 1,
        shared_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 'v1.0'
      },
      {
        id: 'shared-2',
        title: 'React组件开发指南',
        content: `作为一个React开发专家，请帮我创建一个{{组件类型}}组件。

**组件要求**：
- 组件名称：{{组件名称}}
- 功能描述：{{功能描述}}
- Props接口：{{Props要求}}

**技术要求**：
- 使用TypeScript
- 遵循React最佳实践
- 包含适当的错误处理
- 添加必要的注释
- 支持响应式设计

请提供完整的组件代码和使用示例。`,
        description: 'React组件开发的专业指导',
        share_description: '专业的React组件开发助手，支持TypeScript，遵循最佳实践',
        category_id: 'coding',
        user_id: '1',
        rating: 4.8,
        like_count: 23,
        share_count: 12,
        is_shared: 1,
        shared_at: new Date(Date.now() - 86400000).toISOString(), // 1天前
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        version: 'v1.0'
      },
      {
        id: 'shared-3',
        title: '商业计划书撰写助手',
        content: `你是一位资深的商业顾问，请帮我撰写一份专业的商业计划书。

**项目信息**：
- 项目名称：{{项目名称}}
- 行业领域：{{行业领域}}
- 目标市场：{{目标市场}}
- 预算规模：{{预算规模}}

**计划书结构**：
1. 执行摘要
2. 公司概述
3. 市场分析
4. 产品/服务介绍
5. 营销策略
6. 运营计划
7. 财务预测
8. 风险分析

请确保内容专业、详细且具有可操作性。`,
        description: '专业的商业计划书撰写指导',
        share_description: '资深商业顾问级别的计划书撰写助手，结构完整，内容专业',
        category_id: 'analysis',
        user_id: '2',
        rating: 4.3,
        like_count: 18,
        share_count: 6,
        is_shared: 1,
        shared_at: new Date(Date.now() - 172800000).toISOString(), // 2天前
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString(),
        version: 'v1.0'
      }
    ];

    // 插入共享提示词
    const insertPrompt = db.prepare(`
      INSERT OR REPLACE INTO prompts (
        id, title, content, description, category_id, user_id, rating, 
        like_count, share_count, is_shared, shared_at, share_description,
        created_at, updated_at, version, is_favorite
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    for (const prompt of sharedPrompts) {
      insertPrompt.run(
        prompt.id,
        prompt.title,
        prompt.content,
        prompt.description,
        prompt.category_id,
        prompt.user_id,
        prompt.rating,
        prompt.like_count,
        prompt.share_count,
        prompt.is_shared,
        prompt.shared_at,
        prompt.share_description,
        prompt.created_at,
        prompt.updated_at,
        prompt.version
      );
    }

    // 添加标签关联
    const tagAssociations = [
      { prompt_id: 'shared-1', tag_names: ['写作', '创意', '内容创作'] },
      { prompt_id: 'shared-2', tag_names: ['React', 'TypeScript', '前端开发', '组件'] },
      { prompt_id: 'shared-3', tag_names: ['商业', '计划书', '创业', '咨询'] }
    ];

    for (const association of tagAssociations) {
      for (const tagName of association.tag_names) {
        // 确保标签存在
        const existingTag = db.prepare('SELECT id FROM tags WHERE name = ? AND user_id = ?').get(tagName, association.prompt_id.startsWith('shared-1') ? '1' : '2');
        
        let tagId;
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          const insertTag = db.prepare('INSERT INTO tags (name, user_id, created_at) VALUES (?, ?, ?)');
          const result = insertTag.run(tagName, association.prompt_id.startsWith('shared-1') ? '1' : '2', new Date().toISOString());
          tagId = result.lastInsertRowid;
        }

        // 添加标签关联
        db.prepare('INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)').run(association.prompt_id, tagId);
      }
    }

    console.log('✅ 共享提示词测试数据添加成功！');
    console.log(`添加了 ${sharedPrompts.length} 个共享提示词`);
    
  } catch (error) {
    console.error('❌ 添加共享提示词失败:', error);
  }
}

// 运行脚本
addSharedPrompts(); 