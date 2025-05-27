import { initializeDatabase } from '../src/lib/db/sqlite';

async function initDb() {
  try {
    console.log('正在初始化数据库...');
    const db = await initializeDatabase();
    console.log('数据库初始化成功！');
    
    // 测试插入一些示例数据
    const categories = [
      { id: 'cat-1', name: '创意写作', description: '用于创意写作的提示词', color: '#3B82F6', icon: 'pencil' },
      { id: 'cat-2', name: '代码开发', description: '编程和代码相关的提示词', color: '#10B981', icon: 'code' },
      { id: 'cat-3', name: '内容营销', description: '营销和推广相关的提示词', color: '#F59E0B', icon: 'megaphone' }
    ];

    for (const category of categories) {
      await db.prepare(`
        INSERT OR REPLACE INTO categories (id, name, description, color, icon)
        VALUES (?, ?, ?, ?, ?)
      `).run(category.id, category.name, category.description, category.color, category.icon);
    }

    const prompts = [
      {
        id: 'prompt-1',
        title: '创意写作助手',
        content: '你是一个专业的创意写作助手。请根据用户提供的主题和要求，创作出富有想象力和吸引力的内容。',
        description: '帮助用户进行创意写作，包括故事、文章、诗歌等',
        category_id: 'cat-1'
      },
      {
        id: 'prompt-2',
        title: '代码调试专家',
        content: '你是一个经验丰富的程序员。请分析用户提供的代码，找出潜在的问题并提供解决方案。',
        description: '协助用户调试和优化代码',
        category_id: 'cat-2'
      },
      {
        id: 'prompt-3',
        title: '内容摘要生成器',
        content: '请将用户提供的长文本内容总结成简洁明了的摘要，保留关键信息和要点。',
        description: '将长文本内容转换为简洁摘要',
        category_id: 'cat-3'
      }
    ];

    for (const prompt of prompts) {
      await db.prepare(`
        INSERT OR REPLACE INTO prompts (id, title, content, description, category_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(prompt.id, prompt.title, prompt.content, prompt.description, prompt.category_id);
    }

    console.log('示例数据插入成功！');
    console.log('数据库初始化完成。');
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

initDb(); 