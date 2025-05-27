import { getDbConnection } from "../src/lib/db/sqlite";

async function checkCategories() {
  try {
    const db = await getDbConnection();
    
    console.log('=== 检查分类数据 ===');
    const categories = db.prepare('SELECT * FROM categories').all();
    console.log('现有分类:', categories);
    
    console.log('\n=== 检查用户数据 ===');
    const users = db.prepare('SELECT id, username, display_name FROM users').all();
    console.log('现有用户:', users);
    
  } catch (error) {
    console.error('检查失败:', error);
  }
}

checkCategories(); 