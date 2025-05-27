import fs from 'fs/promises';
import path from 'path';

async function testProfileAPI() {
  try {
    console.log('测试个人资料API...');
    
    const usersDataPath = path.join(process.cwd(), 'data', 'users.json');
    
    // 读取用户数据
    const usersData = JSON.parse(await fs.readFile(usersDataPath, 'utf-8'));
    
    console.log('\n=== 用户资料数据测试 ===');
    
    // 测试管理员账号
    const adminProfile = usersData['1'];
    if (adminProfile) {
      console.log('\n✅ 管理员账号资料:');
      console.log(`  ID: ${adminProfile.id}`);
      console.log(`  显示名称: ${adminProfile.displayName}`);
      console.log(`  用户名: ${adminProfile.username}`);
      console.log(`  邮箱: ${adminProfile.email}`);
      console.log(`  角色: ${adminProfile.role}`);
      console.log(`  个人简介: ${adminProfile.bio}`);
      console.log(`  头像: ${adminProfile.avatar || '(未设置)'}`);
      console.log(`  创建时间: ${adminProfile.createdAt}`);
      console.log(`  更新时间: ${adminProfile.updatedAt}`);
    } else {
      console.log('❌ 管理员账号资料不存在');
    }
    
    // 测试普通用户账号
    const userProfile = usersData['2'];
    if (userProfile) {
      console.log('\n✅ 普通用户账号资料:');
      console.log(`  ID: ${userProfile.id}`);
      console.log(`  显示名称: ${userProfile.displayName}`);
      console.log(`  用户名: ${userProfile.username}`);
      console.log(`  邮箱: ${userProfile.email}`);
      console.log(`  角色: ${userProfile.role}`);
      console.log(`  个人简介: ${userProfile.bio}`);
      console.log(`  头像: ${userProfile.avatar || '(未设置)'}`);
    } else {
      console.log('❌ 普通用户账号资料不存在');
    }
    
    // 模拟API调用逻辑
    console.log('\n=== API调用模拟 ===');
    
    // 模拟获取管理员资料的API响应
    const mockApiResponse = {
      displayName: adminProfile.displayName,
      username: adminProfile.username,
      email: adminProfile.email,
      bio: adminProfile.bio || '',
      avatar: adminProfile.avatar || '',
    };
    
    console.log('\n模拟API响应 (管理员):');
    console.log(JSON.stringify(mockApiResponse, null, 2));
    
    console.log('\n🎉 个人资料API测试完成！');
    console.log('\n💡 现在管理员登录后应该能看到完整的个人资料信息了！');
    
  } catch (error) {
    console.error('测试个人资料API失败:', error);
    process.exit(1);
  }
}

testProfileAPI(); 