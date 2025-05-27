import { getDbConnection } from '../src/lib/db/sqlite';

async function checkUserData() {
  try {
    console.log('检查用户数据状况...');
    const db = await getDbConnection();
    
    // 检查prompts表中的用户数据分布
    console.log('\n=== 提示词数据分布 ===');
    const promptUsers = db.prepare(`
      SELECT user_id, COUNT(*) as count 
      FROM prompts 
      GROUP BY user_id
    `).all() as Array<{ user_id: string; count: number }>;
    
    promptUsers.forEach(user => {
      console.log(`用户ID: ${user.user_id} - 提示词数量: ${user.count}`);
    });
    
    // 检查categories表中的用户数据分布
    console.log('\n=== 分类数据分布 ===');
    const categoryUsers = db.prepare(`
      SELECT user_id, COUNT(*) as count 
      FROM categories 
      GROUP BY user_id
    `).all() as Array<{ user_id: string; count: number }>;
    
    categoryUsers.forEach(user => {
      console.log(`用户ID: ${user.user_id} - 分类数量: ${user.count}`);
    });
    
    // 检查knowledge_base表中的用户数据分布
    console.log('\n=== 知识库数据分布 ===');
    const knowledgeUsers = db.prepare(`
      SELECT user_id, COUNT(*) as count 
      FROM knowledge_base 
      GROUP BY user_id
    `).all() as Array<{ user_id: string; count: number }>;
    
    knowledgeUsers.forEach(user => {
      console.log(`用户ID: ${user.user_id} - 知识库数量: ${user.count}`);
    });
    
    // 显示一些示例数据
    console.log('\n=== 示例提示词数据 ===');
    const samplePrompts = db.prepare(`
      SELECT id, title, user_id, created_at 
      FROM prompts 
      LIMIT 5
    `).all() as Array<{ id: string; title: string; user_id: string; created_at: string }>;
    
    samplePrompts.forEach(prompt => {
      console.log(`ID: ${prompt.id}, 标题: ${prompt.title}, 用户ID: ${prompt.user_id}`);
    });
    
    console.log('\n检查完成！');
    
  } catch (error) {
    console.error('检查用户数据失败:', error);
    process.exit(1);
  }
}

checkUserData(); 