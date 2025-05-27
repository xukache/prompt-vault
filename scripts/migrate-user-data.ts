import { getDbConnection } from '../src/lib/db/sqlite';

async function migrateUserData(targetUserId: string) {
  try {
    console.log(`开始将数据迁移到用户ID: ${targetUserId}`);
    const db = await getDbConnection();
    
    // 开始事务
    const transaction = db.transaction(() => {
      // 1. 迁移提示词数据
      console.log('迁移提示词数据...');
      const promptsUpdated = db.prepare(`
        UPDATE prompts 
        SET user_id = ? 
        WHERE user_id = 'default_user'
      `).run(targetUserId);
      console.log(`✅ 已迁移 ${promptsUpdated.changes} 个提示词`);
      
      // 2. 迁移分类数据
      console.log('迁移分类数据...');
      const categoriesUpdated = db.prepare(`
        UPDATE categories 
        SET user_id = ? 
        WHERE user_id = 'default_user'
      `).run(targetUserId);
      console.log(`✅ 已迁移 ${categoriesUpdated.changes} 个分类`);
      
      // 3. 迁移标签数据
      console.log('迁移标签数据...');
      const tagsUpdated = db.prepare(`
        UPDATE tags 
        SET user_id = ? 
        WHERE user_id = 'default_user'
      `).run(targetUserId);
      console.log(`✅ 已迁移 ${tagsUpdated.changes} 个标签`);
      
      // 4. 迁移知识库数据
      console.log('迁移知识库数据...');
      const knowledgeUpdated = db.prepare(`
        UPDATE knowledge_base 
        SET user_id = ? 
        WHERE user_id = 'default_user'
      `).run(targetUserId);
      console.log(`✅ 已迁移 ${knowledgeUpdated.changes} 个知识库条目`);
      
      // 5. 迁移提示词结果数据
      console.log('迁移提示词结果数据...');
      const resultsUpdated = db.prepare(`
        UPDATE prompt_results 
        SET user_id = ? 
        WHERE user_id = 'default_user'
      `).run(targetUserId);
      console.log(`✅ 已迁移 ${resultsUpdated.changes} 个提示词结果`);
      
      // 6. 迁移版本历史数据
      console.log('迁移版本历史数据...');
      const versionsUpdated = db.prepare(`
        UPDATE prompt_versions 
        SET user_id = ? 
        WHERE user_id = 'default_user'
      `).run(targetUserId);
      console.log(`✅ 已迁移 ${versionsUpdated.changes} 个版本记录`);
      
      // 7. 迁移使用统计数据
      console.log('迁移使用统计数据...');
      const statsUpdated = db.prepare(`
        UPDATE usage_stats 
        SET user_id = ? 
        WHERE user_id = 'default_user'
      `).run(targetUserId);
      console.log(`✅ 已迁移 ${statsUpdated.changes} 个使用统计记录`);
    });
    
    // 执行事务
    transaction();
    
    console.log('\n🎉 数据迁移完成！');
    
    // 验证迁移结果
    console.log('\n=== 迁移后数据验证 ===');
    const promptCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM prompts 
      WHERE user_id = ?
    `).get(targetUserId) as { count: number };
    console.log(`用户 ${targetUserId} 的提示词数量: ${promptCount.count}`);
    
    const categoryCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM categories 
      WHERE user_id = ?
    `).get(targetUserId) as { count: number };
    console.log(`用户 ${targetUserId} 的分类数量: ${categoryCount.count}`);
    
    // 检查是否还有default_user的数据
    const remainingDefault = db.prepare(`
      SELECT COUNT(*) as count 
      FROM prompts 
      WHERE user_id = 'default_user'
    `).get() as { count: number };
    console.log(`剩余default_user数据: ${remainingDefault.count}`);
    
  } catch (error) {
    console.error('数据迁移失败:', error);
    process.exit(1);
  }
}

// 从命令行参数获取目标用户ID
const targetUserId = process.argv[2];

if (!targetUserId) {
  console.error('❌ 请提供目标用户ID');
  console.log('使用方法: npx tsx scripts/migrate-user-data.ts <用户ID>');
  console.log('例如: npx tsx scripts/migrate-user-data.ts admin-123');
  process.exit(1);
}

migrateUserData(targetUserId); 