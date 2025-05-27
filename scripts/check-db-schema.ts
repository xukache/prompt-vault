import { getDbConnection } from "../src/lib/db/sqlite";

async function checkDbSchema() {
  try {
    const db = await getDbConnection();
    
    console.log('=== 检查prompts表结构 ===');
    const promptsSchema = db.prepare("PRAGMA table_info(prompts)").all();
    console.log('prompts表字段:', promptsSchema);
    
    console.log('\n=== 检查外键约束 ===');
    const foreignKeys = db.prepare("PRAGMA foreign_key_list(prompts)").all();
    console.log('prompts表外键:', foreignKeys);
    
    console.log('\n=== 检查现有提示词 ===');
    const existingPrompts = db.prepare('SELECT id, title, category_id, user_id FROM prompts LIMIT 5').all();
    console.log('现有提示词示例:', existingPrompts);
    
  } catch (error) {
    console.error('检查失败:', error);
  }
}

checkDbSchema(); 