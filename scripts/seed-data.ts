import { getDbConnection } from '../src/lib/db/sqlite';

const samplePrompts = [
  {
    id: 'prompt-1',
    title: '创意文案生成器',
    content: '请为以下产品创作一段吸引人的营销文案：\n\n产品名称：{product_name}\n产品特点：{features}\n目标受众：{target_audience}\n\n要求：\n1. 突出产品核心优势\n2. 语言生动有趣\n3. 包含行动号召\n4. 字数控制在100-200字',
    description: '专业的营销文案生成工具，帮助快速创作吸引人的产品宣传文案',
    category_id: 'writing',
    rating: 4,
    is_favorite: true,
    created_at: new Date('2024-01-15').toISOString(),
    updated_at: new Date('2024-01-20').toISOString(),
  },
  {
    id: 'prompt-2',
    title: 'React组件代码生成',
    content: '请根据以下需求生成一个React函数组件：\n\n组件名称：{component_name}\n功能描述：{description}\n所需props：{props}\n样式要求：{styling}\n\n要求：\n1. 使用TypeScript\n2. 包含完整的类型定义\n3. 遵循React最佳实践\n4. 添加必要的注释\n5. 使用现代React Hooks',
    description: '快速生成高质量的React组件代码，支持TypeScript和现代React特性',
    category_id: 'coding',
    rating: 5,
    is_favorite: false,
    created_at: new Date('2024-01-10').toISOString(),
    updated_at: new Date('2024-01-18').toISOString(),
  },
  {
    id: 'prompt-3',
    title: '数据分析报告模板',
    content: '请基于以下数据生成一份专业的分析报告：\n\n数据来源：{data_source}\n分析目标：{objective}\n关键指标：{metrics}\n时间范围：{time_period}\n\n报告结构：\n1. 执行摘要\n2. 数据概览\n3. 关键发现\n4. 趋势分析\n5. 建议和行动计划\n\n要求：数据驱动、逻辑清晰、结论明确',
    description: '生成专业的数据分析报告，包含完整的分析框架和可行建议',
    category_id: 'analysis',
    rating: 4,
    is_favorite: true,
    created_at: new Date('2024-01-12').toISOString(),
    updated_at: new Date('2024-01-22').toISOString(),
  },
  {
    id: 'prompt-4',
    title: '英中翻译助手',
    content: '请将以下英文内容翻译成中文：\n\n原文：{english_text}\n\n翻译要求：\n1. 保持原文的语气和风格\n2. 确保专业术语的准确性\n3. 语言自然流畅\n4. 如有文化差异，请适当本土化\n5. 保留原文的格式结构\n\n请提供翻译结果，并简要说明翻译思路。',
    description: '专业的英中翻译工具，确保翻译质量和文化适应性',
    category_id: 'translation',
    rating: 4,
    is_favorite: false,
    created_at: new Date('2024-01-08').toISOString(),
    updated_at: new Date('2024-01-16').toISOString(),
  },
  {
    id: 'prompt-5',
    title: '会议纪要总结器',
    content: '请根据以下会议记录生成简洁的会议纪要：\n\n会议主题：{meeting_topic}\n参会人员：{participants}\n会议时间：{meeting_time}\n会议内容：{meeting_content}\n\n纪要格式：\n1. 会议基本信息\n2. 主要讨论点\n3. 决策事项\n4. 行动计划（负责人+截止时间）\n5. 下次会议安排\n\n要求：条理清晰、重点突出、便于跟进',
    description: '快速生成结构化的会议纪要，提高会议效率和跟进效果',
    category_id: 'summary',
    rating: 3,
    is_favorite: false,
    created_at: new Date('2024-01-05').toISOString(),
    updated_at: new Date('2024-01-14').toISOString(),
  },
  {
    id: 'prompt-6',
    title: 'API文档生成器',
    content: '请为以下API接口生成详细的文档：\n\n接口名称：{api_name}\n请求方法：{method}\n请求路径：{endpoint}\n请求参数：{parameters}\n响应格式：{response_format}\n\n文档内容：\n1. 接口描述\n2. 请求示例\n3. 参数说明（类型、必填、描述）\n4. 响应示例\n5. 错误码说明\n6. 使用注意事项\n\n要求：格式规范、示例完整、易于理解',
    description: '自动生成标准化的API文档，提高开发效率和接口可维护性',
    category_id: 'coding',
    rating: 5,
    is_favorite: true,
    created_at: new Date('2024-01-03').toISOString(),
    updated_at: new Date('2024-01-25').toISOString(),
  }
];

const sampleCategories = [
  {
    id: 'writing',
    name: '创意写作',
    description: '文案创作、内容写作相关的提示词',
    parent_id: null,
    color: '#3B82F6',
    icon: 'pencil',
    order_index: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'coding',
    name: '代码生成',
    description: '编程、代码生成相关的提示词',
    parent_id: null,
    color: '#10B981',
    icon: 'code',
    order_index: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'analysis',
    name: '数据分析',
    description: '数据分析、报告生成相关的提示词',
    parent_id: null,
    color: '#8B5CF6',
    icon: 'chart',
    order_index: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'translation',
    name: '翻译助手',
    description: '语言翻译相关的提示词',
    parent_id: null,
    color: '#F59E0B',
    icon: 'language',
    order_index: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: 'summary',
    name: '内容摘要',
    description: '内容总结、摘要生成相关的提示词',
    parent_id: null,
    color: '#EF4444',
    icon: 'document',
    order_index: 5,
    created_at: new Date().toISOString(),
  }
];

const sampleTags = [
  { id: 'tag-1', name: 'AI', color: '#3B82F6', description: '人工智能相关', usage_count: 0, created_at: new Date().toISOString() },
  { id: 'tag-2', name: '效率', color: '#10B981', description: '提高工作效率', usage_count: 0, created_at: new Date().toISOString() },
  { id: 'tag-3', name: '创意', color: '#8B5CF6', description: '创意和创新', usage_count: 0, created_at: new Date().toISOString() },
  { id: 'tag-4', name: '商务', color: '#F59E0B', description: '商务和业务', usage_count: 0, created_at: new Date().toISOString() },
  { id: 'tag-5', name: '教育', color: '#EF4444', description: '教育和学习', usage_count: 0, created_at: new Date().toISOString() },
  { id: 'tag-6', name: '技术', color: '#6B7280', description: '技术和开发', usage_count: 0, created_at: new Date().toISOString() }
];

// 提示词标签关联
const promptTags = [
  { prompt_id: 'prompt-1', tag_id: 'tag-2' }, // 创意文案 - 效率
  { prompt_id: 'prompt-1', tag_id: 'tag-3' }, // 创意文案 - 创意
  { prompt_id: 'prompt-1', tag_id: 'tag-4' }, // 创意文案 - 商务
  { prompt_id: 'prompt-2', tag_id: 'tag-6' }, // React组件 - 技术
  { prompt_id: 'prompt-2', tag_id: 'tag-2' }, // React组件 - 效率
  { prompt_id: 'prompt-3', tag_id: 'tag-4' }, // 数据分析 - 商务
  { prompt_id: 'prompt-3', tag_id: 'tag-2' }, // 数据分析 - 效率
  { prompt_id: 'prompt-4', tag_id: 'tag-5' }, // 翻译助手 - 教育
  { prompt_id: 'prompt-5', tag_id: 'tag-2' }, // 会议纪要 - 效率
  { prompt_id: 'prompt-5', tag_id: 'tag-4' }, // 会议纪要 - 商务
  { prompt_id: 'prompt-6', tag_id: 'tag-6' }, // API文档 - 技术
  { prompt_id: 'prompt-6', tag_id: 'tag-2' }, // API文档 - 效率
];

async function seedData() {
  try {
    const db = await getDbConnection();
    
    console.log('开始初始化测试数据...');
    
    // 清空现有数据
    db.prepare('DELETE FROM prompt_tags').run();
    db.prepare('DELETE FROM prompts').run();
    db.prepare('DELETE FROM categories').run();
    db.prepare('DELETE FROM tags').run();
    
    // 插入分类数据
    const insertCategory = db.prepare(`
      INSERT INTO categories (id, name, description, parent_id, color, icon, order_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const category of sampleCategories) {
      insertCategory.run(
        category.id,
        category.name,
        category.description,
        category.parent_id,
        category.color,
        category.icon,
        category.order_index,
        category.created_at
      );
    }
    console.log(`✓ 插入了 ${sampleCategories.length} 个分类`);
    
    // 插入标签数据
    const insertTag = db.prepare(`
      INSERT INTO tags (id, name, color, description, usage_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const tag of sampleTags) {
      insertTag.run(
        tag.id,
        tag.name,
        tag.color,
        tag.description,
        tag.usage_count,
        tag.created_at
      );
    }
    console.log(`✓ 插入了 ${sampleTags.length} 个标签`);
    
    // 插入提示词数据
    const insertPrompt = db.prepare(`
      INSERT INTO prompts (id, title, content, description, category_id, rating, is_favorite, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const prompt of samplePrompts) {
      insertPrompt.run(
        prompt.id,
        prompt.title,
        prompt.content,
        prompt.description,
        prompt.category_id,
        prompt.rating,
        prompt.is_favorite ? 1 : 0,
        prompt.created_at,
        prompt.updated_at
      );
    }
    console.log(`✓ 插入了 ${samplePrompts.length} 个提示词`);
    
    // 插入提示词标签关联
    const insertPromptTag = db.prepare(`
      INSERT INTO prompt_tags (prompt_id, tag_id)
      VALUES (?, ?)
    `);
    
    for (const relation of promptTags) {
      insertPromptTag.run(relation.prompt_id, relation.tag_id);
    }
    console.log(`✓ 插入了 ${promptTags.length} 个提示词标签关联`);
    
    // 更新标签使用次数
    const updateTagUsage = db.prepare(`
      UPDATE tags 
      SET usage_count = (
        SELECT COUNT(*) FROM prompt_tags WHERE tag_id = tags.id
      )
    `);
    updateTagUsage.run();
    console.log('✓ 更新了标签使用次数');
    
    console.log('🎉 测试数据初始化完成！');
    
  } catch (error) {
    console.error('❌ 数据初始化失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('数据种子脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('数据种子脚本执行失败:', error);
      process.exit(1);
    });
}

export { seedData }; 