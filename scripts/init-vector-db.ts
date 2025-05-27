const { getDbConnection } = require('../src/lib/db/sqlite');
const { initializeChroma, batchAddDocuments } = require('../src/lib/vector/chroma');

async function initVectorDatabase() {
  try {
    console.log('🔍 开始初始化向量数据库...\n');
    
    // 1. 初始化Chroma向量数据库
    console.log('📊 初始化Chroma客户端...');
    await initializeChroma();
    console.log('✅ Chroma客户端初始化成功！');
    
    // 2. 从SQLite获取所有提示词数据
    console.log('\n📝 从SQLite获取提示词数据...');
    const db = await getDbConnection();
    const prompts = await db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM prompts p 
      LEFT JOIN categories c ON p.category_id = c.id
    `).all();
    
    console.log(`📊 找到 ${prompts.length} 个提示词`);
    
    // 3. 准备向量数据库文档
    const documents = prompts.map((prompt: any) => ({
      id: `prompt_${prompt.id}`,
      content: `${prompt.title}\n\n${prompt.content}\n\n${prompt.description || ''}`,
      metadata: {
        prompt_id: prompt.id,
        title: prompt.title,
        category: prompt.category_name || '未分类',
        tags: [] // 暂时为空，后续可以添加标签支持
      }
    }));
    
    // 4. 批量添加到向量数据库
    if (documents.length > 0) {
      console.log('\n🚀 批量添加文档到向量数据库...');
      await batchAddDocuments(documents);
      console.log('✅ 文档添加成功！');
      
      // 显示添加的文档信息
      documents.forEach((doc: any) => {
        console.log(`  - ${doc.metadata.title} [${doc.metadata.category}]`);
      });
    }
    
    console.log('\n🎉 向量数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 向量数据库初始化失败:', error);
    process.exit(1);
  }
}

initVectorDatabase(); 