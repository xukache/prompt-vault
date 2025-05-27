const XLSX = require('xlsx');
const path = require('path');

// 示例数据
const sampleData = [
  // 标题行
  ['title', 'content', 'type', 'description', 'tags'],
  // 数据行
  [
    'CSS 布局技巧',
    `## CSS 布局技巧

### Flexbox 布局
\`\`\`css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}
\`\`\`

### Grid 布局
\`\`\`css
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
\`\`\`

### 响应式设计
\`\`\`css
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}
\`\`\``,
    'reference',
    'CSS 布局的常用技巧和最佳实践',
    'CSS,布局,Flexbox,Grid,响应式'
  ],
  [
    'Python 数据处理',
    `## Python 数据处理

### Pandas 基础操作
\`\`\`python
import pandas as pd

# 读取数据
df = pd.read_csv('data.csv')

# 数据清洗
df.dropna()  # 删除空值
df.fillna(0)  # 填充空值

# 数据筛选
filtered_df = df[df['column'] > 100]
\`\`\`

### 数据可视化
\`\`\`python
import matplotlib.pyplot as plt

df.plot(kind='bar')
plt.show()
\`\`\``,
    'domain',
    'Python 数据处理的基础知识和常用操作',
    'Python,数据处理,Pandas,数据分析'
  ],
  [
    '代码审查清单',
    `# 代码审查清单

## 功能性检查
- [ ] 代码是否实现了预期功能
- [ ] 边界条件是否处理正确
- [ ] 错误处理是否完善

## 代码质量
- [ ] 代码是否易读易懂
- [ ] 变量和函数命名是否清晰
- [ ] 是否遵循编码规范

## 性能考虑
- [ ] 是否存在性能瓶颈
- [ ] 算法复杂度是否合理
- [ ] 内存使用是否优化

## 安全性
- [ ] 输入验证是否充分
- [ ] 是否存在安全漏洞
- [ ] 敏感信息是否正确处理`,
    'template',
    '代码审查时使用的检查清单模板',
    '代码审查,质量控制,模板,团队协作'
  ],
  [
    'Node.js 最佳实践',
    `## Node.js 最佳实践

### 错误处理
\`\`\`javascript
// 使用 try-catch 处理异步错误
async function handleRequest() {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
\`\`\`

### 环境变量管理
\`\`\`javascript
// 使用 dotenv 管理环境变量
require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  dbUrl: process.env.DATABASE_URL
};
\`\`\`

### 安全性
- 使用 helmet 中间件
- 验证和清理用户输入
- 实施速率限制`,
    'practice',
    'Node.js 开发的最佳实践和安全建议',
    'Node.js,最佳实践,安全,后端开发'
  ]
];

// 创建工作簿
const workbook = XLSX.utils.book_new();

// 创建工作表
const worksheet = XLSX.utils.aoa_to_sheet(sampleData);

// 设置列宽
const colWidths = [
  { wch: 20 }, // title
  { wch: 50 }, // content
  { wch: 12 }, // type
  { wch: 30 }, // description
  { wch: 25 }  // tags
];
worksheet['!cols'] = colWidths;

// 添加工作表到工作簿
XLSX.utils.book_append_sheet(workbook, worksheet, 'Knowledge Base');

// 输出文件路径
const outputPath = path.join(__dirname, '../public/sample-knowledge.xlsx');

// 写入文件
XLSX.writeFile(workbook, outputPath);

console.log(`Excel 示例文件已创建: ${outputPath}`); 