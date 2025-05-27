import fs from 'fs/promises';
import path from 'path';

async function fixUserProfiles() {
  try {
    console.log('开始修复用户资料数据...');
    
    const dataDir = path.join(process.cwd(), 'data');
    const usersDataPath = path.join(dataDir, 'users.json');
    const authDataPath = path.join(dataDir, 'auth.json');
    
    // 确保data目录存在
    await fs.mkdir(dataDir, { recursive: true });
    
    // 创建完整的用户资料数据
    const usersData = {
      '1': {
        id: '1',
        email: 'admin@promptvault.com',
        displayName: '系统管理员',
        username: 'admin',
        bio: '系统管理员，负责平台维护和用户管理。热爱AI技术和提示词工程，致力于为用户提供最佳的提示词管理体验。',
        avatar: '',
        role: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      },
      '2': {
        id: '2',
        email: 'user@promptvault.com',
        displayName: '普通用户',
        username: 'user',
        bio: '热爱AI和提示词工程的用户，喜欢探索各种创新的提示词技巧和最佳实践。',
        avatar: '',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      }
    };
    
    // 创建认证数据
    const authData = {
      '1': {
        id: '1',
        email: 'admin@promptvault.com',
        password: 'admin123',
      },
      '2': {
        id: '2',
        email: 'user@promptvault.com',
        password: 'user123',
      }
    };
    
    // 写入用户资料数据
    await fs.writeFile(usersDataPath, JSON.stringify(usersData, null, 2));
    console.log('✅ 用户资料数据已更新');
    
    // 写入认证数据
    await fs.writeFile(authDataPath, JSON.stringify(authData, null, 2));
    console.log('✅ 认证数据已更新');
    
    // 验证数据
    console.log('\n=== 用户资料验证 ===');
    const savedUsersData = JSON.parse(await fs.readFile(usersDataPath, 'utf-8'));
    
    Object.entries(savedUsersData).forEach(([userId, userData]: [string, any]) => {
      console.log(`\n用户ID: ${userId}`);
      console.log(`  显示名称: ${userData.displayName}`);
      console.log(`  用户名: ${userData.username}`);
      console.log(`  邮箱: ${userData.email}`);
      console.log(`  角色: ${userData.role}`);
      console.log(`  个人简介: ${userData.bio}`);
    });
    
    console.log('\n🎉 用户资料修复完成！');
    
  } catch (error) {
    console.error('修复用户资料失败:', error);
    process.exit(1);
  }
}

fixUserProfiles(); 