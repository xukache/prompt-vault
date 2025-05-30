import { getDbConnection } from "../src/lib/db/sqlite";

interface SharedPrompt {
  id: string;
  title: string;
  is_shared: number;
  like_count: number;
  share_count: number;
}

interface TagRow {
  name: string;
}

async function checkSharedPrompts() {
  try {
    const db = await getDbConnection();

    console.log('=== 检查共享提示词 ===');
    const sharedPrompts = db.prepare('SELECT id, title, is_shared, like_count, share_count FROM prompts WHERE is_shared = 1').all() as SharedPrompt[];
    console.log('共享提示词:', sharedPrompts);

    console.log('\n=== 检查标签关联 ===');
    for (const prompt of sharedPrompts) {
      const tags = db.prepare(`
        SELECT t.name
        FROM tags t
        JOIN prompt_tags pt ON t.id = pt.tag_id
        WHERE pt.prompt_id = ?
      `).all(prompt.id) as TagRow[];
      console.log(`${prompt.title} 的标签:`, tags.map(t => t.name));
    }

  } catch (error) {
    console.error('检查失败:', error);
  }
}

checkSharedPrompts();