import { getDbConnection } from '../src/lib/db/sqlite';

async function seedKnowledge() {
  try {
    console.log('正在初始化知识库测试数据...');
    const db = await getDbConnection();

    // 创建知识库测试数据
    const knowledgeItems = [
      {
        id: 'kb-1',
        title: '常用写作风格指南',
        content: `# 写作风格指南

## 正式学术风格
- 使用第三人称叙述
- 避免情感化语言
- 采用客观、理性的表达方式
- 引用权威资料支持论点

## 商业文案风格
- 简洁明了，直击要点
- 使用行动号召语言
- 强调价值和收益
- 采用说服性表达

## 故事性叙述风格
- 运用生动的场景描述
- 创造情感共鸣
- 使用第一人称或第二人称
- 注重情节发展和转折`,
        type: 'template',
        description: '包含各种常用写作风格的指导和示例，如正式学术风格、商业文案风格、故事性叙述风格等。',
        tags: '写作,风格,模板,指南'
      },
      {
        id: 'kb-2',
        title: 'Web开发最佳实践',
        content: `# Web开发最佳实践

## 性能优化
- 图片压缩和懒加载
- CSS和JavaScript文件压缩
- 使用CDN加速资源加载
- 减少HTTP请求次数

## 安全措施
- 输入验证和SQL注入防护
- HTTPS加密传输
- 跨站脚本(XSS)防护
- CSRF令牌验证

## 可访问性
- 语义化HTML标签
- 适当的alt文本
- 键盘导航支持
- 屏幕阅读器兼容

## 响应式设计
- 移动优先设计原则
- 灵活的网格布局
- 自适应图片
- 触摸友好的交互元素`,
        type: 'practice',
        description: '现代Web开发的最佳实践合集，包括性能优化、安全措施、可访问性考虑和响应式设计原则。',
        tags: 'Web开发,最佳实践,性能,安全,响应式'
      },
      {
        id: 'kb-3',
        title: '机器学习基础概念',
        content: `# 机器学习基础概念

## 监督学习
监督学习使用标记的训练数据来学习输入到输出的映射函数。
- **分类**: 预测离散类别（如邮件分类为垃圾邮件或正常邮件）
- **回归**: 预测连续数值（如房价预测）

## 无监督学习
从无标记数据中发现隐藏模式。
- **聚类**: 将相似数据点分组
- **降维**: 减少数据特征维度
- **异常检测**: 识别异常或罕见的数据点

## 强化学习
通过与环境交互学习最优行为策略。
- **智能体**: 执行行动的实体
- **环境**: 智能体所处的外部世界
- **奖励**: 行动的反馈信号

## 常用算法
- 线性回归
- 决策树
- 随机森林
- 支持向量机
- 神经网络`,
        type: 'domain',
        description: '机器学习领域的核心概念、常用算法和术语解释，适合在提示词中引用以确保专业精确。',
        tags: '机器学习,人工智能,算法,数据科学'
      },
      {
        id: 'kb-4',
        title: 'JSON数据格式规范',
        content: `# JSON数据格式规范

## 基本语法
\`\`\`json
{
  "name": "John Doe",
  "age": 30,
  "isActive": true,
  "address": {
    "street": "123 Main St",
    "city": "New York"
  },
  "hobbies": ["reading", "swimming"]
}
\`\`\`

## 数据类型
- **字符串**: 双引号包围的文本
- **数字**: 整数或浮点数
- **布尔值**: true或false
- **null**: 空值
- **对象**: 键值对的集合
- **数组**: 有序的值列表

## 最佳实践
- 使用驼峰命名法
- 保持一致的数据结构
- 避免深层嵌套
- 提供合理的默认值
- 添加适当的验证

## 常见错误
- 尾随逗号
- 单引号替代双引号
- 未转义的特殊字符
- 循环引用`,
        type: 'reference',
        description: 'JSON数据格式的完整规范和使用指南，包含语法规则、最佳实践和常见错误避免。',
        tags: 'JSON,数据格式,API,编程'
      },
      {
        id: 'kb-5',
        title: 'UX设计原则',
        content: `# UX设计原则

## 可用性原则
- **一致性**: 界面元素在整个应用中保持一致
- **反馈**: 系统状态的清晰反馈
- **容错性**: 错误预防和恢复机制
- **效率**: 支持经验用户的快捷操作

## 设计思维流程
1. **同理心**: 理解用户需求和痛点
2. **定义**: 明确问题陈述
3. **构思**: 产生创意解决方案
4. **原型**: 制作可测试的原型
5. **测试**: 用户反馈和迭代

## 信息架构
- 清晰的导航结构
- 逻辑分组和分类
- 有效的搜索功能
- 面包屑导航

## 交互设计
- 直观的操作方式
- 合理的响应时间
- 清晰的视觉层次
- 适当的动画效果`,
        type: 'domain',
        description: '用户体验设计的核心原则和方法论，涵盖可用性、设计思维、信息架构和交互设计。',
        tags: 'UX设计,用户体验,可用性,交互设计'
      }
    ];

    // 插入知识库条目
    const insertQuery = `
      INSERT OR REPLACE INTO knowledge_base (id, title, content, type, description, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    for (const item of knowledgeItems) {
      db.prepare(insertQuery).run(
        item.id,
        item.title,
        item.content,
        item.type,
        item.description,
        item.tags
      );
    }

    console.log(`成功插入 ${knowledgeItems.length} 个知识库条目`);
    console.log('知识库测试数据初始化完成！');
    
  } catch (error) {
    console.error('知识库数据初始化失败:', error);
    process.exit(1);
  }
}

seedKnowledge(); 