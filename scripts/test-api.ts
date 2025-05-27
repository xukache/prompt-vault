async function testAPI() {
  const baseURL = 'http://localhost:3000/api';
  
  console.log('🚀 开始测试API endpoints...\n');
  
  try {
    // 1. 测试获取所有提示词
    console.log('📝 测试 GET /api/prompts');
    const promptsResponse = await fetch(`${baseURL}/prompts`);
    const prompts = await promptsResponse.json();
    console.log(`✅ 状态: ${promptsResponse.status}`);
    console.log(`📊 提示词数量: ${prompts.length}`);
    console.log(`📋 提示词列表: ${prompts.map((p: any) => p.title).join(', ')}\n`);
    
    // 2. 测试获取所有分类
    console.log('📁 测试 GET /api/categories');
    const categoriesResponse = await fetch(`${baseURL}/categories`);
    const categories = await categoriesResponse.json();
    console.log(`✅ 状态: ${categoriesResponse.status}`);
    console.log(`📊 分类数量: ${categories.length}`);
    console.log(`📋 分类列表: ${categories.map((c: any) => c.name).join(', ')}\n`);
    
    // 3. 测试创建新提示词
    console.log('➕ 测试 POST /api/prompts');
    const newPrompt = {
      title: '测试提示词',
      content: '这是一个测试提示词的内容',
      description: '用于API测试的提示词',
      categoryId: categories[0]?.id
    };
    
    const createResponse = await fetch(`${baseURL}/prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPrompt),
    });
    
    const createdPrompt = await createResponse.json();
    console.log(`✅ 状态: ${createResponse.status}`);
    console.log(`📝 创建的提示词: ${createdPrompt.title}`);
    console.log(`🆔 提示词ID: ${createdPrompt.id}\n`);
    
    // 4. 测试获取单个提示词
    if (createdPrompt.id) {
      console.log('🔍 测试 GET /api/prompts/[id]');
      const singlePromptResponse = await fetch(`${baseURL}/prompts/${createdPrompt.id}`);
      const singlePrompt = await singlePromptResponse.json();
      console.log(`✅ 状态: ${singlePromptResponse.status}`);
      console.log(`📝 提示词标题: ${singlePrompt.title}`);
      console.log(`📄 提示词内容: ${singlePrompt.content}\n`);
    }
    
    // 5. 测试创建新分类
    console.log('➕ 测试 POST /api/categories');
    const newCategory = {
      name: '测试分类',
      description: '用于API测试的分类',
      color: '#FF6B6B',
      icon: 'test'
    };
    
    const createCategoryResponse = await fetch(`${baseURL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newCategory),
    });
    
    const createdCategory = await createCategoryResponse.json();
    console.log(`✅ 状态: ${createCategoryResponse.status}`);
    console.log(`📁 创建的分类: ${createdCategory.name}`);
    console.log(`🆔 分类ID: ${createdCategory.id}\n`);
    
    console.log('🎉 所有API测试完成！');
    
  } catch (error) {
    console.error('❌ API测试失败:', error);
  }
}

// 等待服务器启动后运行测试
setTimeout(() => {
  testAPI();
}, 3000); 