import { getDbConnection } from '../src/lib/db/sqlite';

async function verifyDatabase() {
  try {
    console.log('🔍 开始验证数据库...\n');
    
    const db = await getDbConnection();
    
    // 1. 验证表结构
    console.log('📋 验证表结构:');
    const tables = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();
    
    console.log('已创建的表:', tables.map((t: any) => t.name).join(', '));
    
    // 2. 验证分类数据
    console.log('\n📁 验证分类数据:');
    const categories = await db.prepare('SELECT * FROM categories ORDER BY name').all();
    console.log(`分类数量: ${categories.length}`);
    categories.forEach((cat: any) => {
      console.log(`  - ${cat.name} (${cat.id}): ${cat.description}`);
    });
    
    // 3. 验证提示词数据
    console.log('\n💡 验证提示词数据:');
    const prompts = await db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM prompts p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.title
    `).all();
    console.log(`提示词数量: ${prompts.length}`);
    prompts.forEach((prompt: any) => {
      console.log(`  - ${prompt.title} [${prompt.category_name || '无分类'}]`);
      console.log(`    描述: ${prompt.description}`);
      console.log(`    内容长度: ${prompt.content.length} 字符\n`);
    });
    
    // 4. 验证表关联
    console.log('🔗 验证表关联:');
    const promptsWithCategories = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM prompts p 
      INNER JOIN categories c ON p.category_id = c.id
    `).get();
    console.log(`有分类的提示词数量: ${(promptsWithCategories as any).count}`);
    
    // 5. 验证外键约束
    console.log('\n🔒 验证外键约束:');
    const foreignKeys = await db.prepare('PRAGMA foreign_key_check').all();
    if (foreignKeys.length === 0) {
      console.log('✅ 外键约束验证通过');
    } else {
      console.log('❌ 外键约束错误:', foreignKeys);
    }
    
    console.log('\n✅ 数据库验证完成！');
    
  } catch (error) {
    console.error('❌ 数据库验证失败:', error);
    process.exit(1);
  }
}

verifyDatabase(); 