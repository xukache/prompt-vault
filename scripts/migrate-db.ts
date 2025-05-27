import { getDbConnection } from '../src/lib/db/sqlite';

async function migrateDatabase() {
  try {
    console.log('🔄 开始数据库迁移...\n');
    
    const db = await getDbConnection();
    
    // 检查当前数据库版本
    let currentVersion = 0;
    try {
      const versionRow = db.prepare('SELECT value FROM db_meta WHERE key = ?').get('version') as { value: string } | undefined;
      currentVersion = versionRow ? parseInt(versionRow.value, 10) : 0;
    } catch (error) {
      console.log('数据库版本表不存在，将创建...');
    }
    
    console.log(`当前数据库版本: ${currentVersion}`);
    
    // 如果版本小于2，执行迁移
    if (currentVersion < 2) {
      console.log('执行迁移到版本2...');
      
      // 添加新字段
      const fieldsToAdd = [
        { name: 'version', type: 'TEXT DEFAULT \'v1.0\'' },
        { name: 'instructions', type: 'TEXT' },
        { name: 'notes', type: 'TEXT' },
        { name: 'variables', type: 'TEXT' }
      ];
      
      for (const field of fieldsToAdd) {
        try {
          console.log(`添加字段: ${field.name}`);
          await db.exec(`ALTER TABLE prompts ADD COLUMN ${field.name} ${field.type};`);
          console.log(`✅ 字段 ${field.name} 添加成功`);
        } catch (error) {
          console.log(`⚠️  字段 ${field.name} 可能已存在，跳过`);
        }
      }
      
      // 更新数据库版本
      await db.prepare('INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)').run('version', '2');
      console.log('✅ 数据库版本更新为 2');
    } else {
      console.log('数据库已是最新版本，无需迁移');
    }
    
    // 验证表结构
    console.log('\n📋 验证表结构:');
    const tableInfo = await db.prepare('PRAGMA table_info(prompts)').all();
    console.log('prompts表字段:');
    tableInfo.forEach((column: any) => {
      console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
    });
    
    console.log('\n🎉 数据库迁移完成！');
    
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateDatabase();
}

export { migrateDatabase }; 