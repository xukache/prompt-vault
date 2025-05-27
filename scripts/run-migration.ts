import { initializeDatabase } from '../src/lib/db/sqlite';

async function runMigration() {
  try {
    console.log('开始运行数据库迁移...');
    const db = await initializeDatabase();
    console.log('数据库迁移完成！');
    
    // 检查迁移结果
    const versionRow = db.prepare("SELECT value FROM db_meta WHERE key = ?").get("version") as { value: string } | undefined;
    console.log(`当前数据库版本: v${versionRow?.value || '未知'}`);
    
    // 检查是否成功添加了user_id字段
    try {
      const testQuery = db.prepare("SELECT user_id FROM prompts LIMIT 1").get();
      console.log('✅ prompts表已成功添加user_id字段');
    } catch (error) {
      console.log('❌ prompts表缺少user_id字段');
    }
    
    try {
      const testQuery = db.prepare("SELECT user_id FROM categories LIMIT 1").get();
      console.log('✅ categories表已成功添加user_id字段');
    } catch (error) {
      console.log('❌ categories表缺少user_id字段');
    }
    
    try {
      const testQuery = db.prepare("SELECT user_id FROM knowledge_base LIMIT 1").get();
      console.log('✅ knowledge_base表已成功添加user_id字段');
    } catch (error) {
      console.log('❌ knowledge_base表缺少user_id字段');
    }
    
    console.log('迁移验证完成！');
    
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

runMigration(); 