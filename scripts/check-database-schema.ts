import { getDbConnection } from '../src/lib/db/sqlite';

async function checkDatabaseSchema() {
  try {
    console.log('检查数据库表结构...');
    const db = await getDbConnection();
    
    // 获取所有表名
    console.log('\n=== 数据库中的所有表 ===');
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all() as Array<{ name: string }>;
    
    tables.forEach(table => {
      console.log(`📋 表名: ${table.name}`);
    });
    
    // 检查每个表的结构
    console.log('\n=== 表结构详情 ===');
    for (const table of tables) {
      console.log(`\n🔍 表 "${table.name}" 的结构:`);
      const columns = db.prepare(`PRAGMA table_info(${table.name})`).all() as Array<{
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: any;
        pk: number;
      }>;
      
      columns.forEach(col => {
        const nullable = col.notnull ? 'NOT NULL' : 'NULL';
        const primaryKey = col.pk ? ' (PRIMARY KEY)' : '';
        const defaultValue = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
        console.log(`  - ${col.name}: ${col.type} ${nullable}${defaultValue}${primaryKey}`);
      });
      
      // 显示表中的数据量
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
      console.log(`  📊 数据量: ${count.count} 条记录`);
    }
    
    // 特别检查是否有users表
    console.log('\n=== 用户相关表检查 ===');
    const userTables = tables.filter(t => 
      t.name.toLowerCase().includes('user') || 
      t.name.toLowerCase().includes('auth') ||
      t.name.toLowerCase().includes('account')
    );
    
    if (userTables.length > 0) {
      console.log('找到用户相关的表:');
      userTables.forEach(table => {
        console.log(`✅ ${table.name}`);
      });
    } else {
      console.log('❌ 没有找到专门的用户表');
      console.log('💡 用户信息可能存储在Cookie或其他地方');
    }
    
    // 检查是否有包含user_id字段的表
    console.log('\n=== 包含user_id字段的表 ===');
    for (const table of tables) {
      const columns = db.prepare(`PRAGMA table_info(${table.name})`).all() as Array<{
        name: string;
      }>;
      
      const hasUserId = columns.some(col => col.name === 'user_id');
      if (hasUserId) {
        console.log(`✅ ${table.name} 包含 user_id 字段`);
        
        // 显示该表中user_id的分布
        const userIdDistribution = db.prepare(`
          SELECT user_id, COUNT(*) as count 
          FROM ${table.name} 
          GROUP BY user_id
        `).all() as Array<{ user_id: string; count: number }>;
        
        userIdDistribution.forEach(dist => {
          console.log(`   - 用户ID "${dist.user_id}": ${dist.count} 条记录`);
        });
      }
    }
    
    console.log('\n检查完成！');
    
  } catch (error) {
    console.error('检查数据库结构失败:', error);
    process.exit(1);
  }
}

checkDatabaseSchema(); 