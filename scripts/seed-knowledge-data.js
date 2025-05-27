import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 数据库路径
const dbPath = join(__dirname, '..', 'data', 'prompts.db');

// 真实的知识库数据
const knowledgeData = [
  // 领域知识类型
  {
    id: 'kb-001',
    title: 'React Hooks 最佳实践',
    content: `React Hooks 是 React 16.8 引入的新特性，它让你在不编写 class 的情况下使用 state 以及其他的 React 特性。

## 核心 Hooks

### useState
用于在函数组件中添加状态：
\`\`\`javascript
const [count, setCount] = useState(0);
\`\`\`

### useEffect
用于处理副作用：
\`\`\`javascript
useEffect(() => {
  document.title = \`You clicked \${count} times\`;
}, [count]);
\`\`\`

### useContext
用于消费 Context：
\`\`\`javascript
const theme = useContext(ThemeContext);
\`\`\`

## 最佳实践

1. **只在最顶层使用 Hook**：不要在循环、条件或嵌套函数中调用 Hook
2. **使用依赖数组**：在 useEffect 中正确设置依赖数组
3. **自定义 Hook**：将组件逻辑提取到自定义 Hook 中以便复用
4. **避免过度优化**：不要过早使用 useMemo 和 useCallback

## 常见陷阱

- 忘记在 useEffect 中清理副作用
- 依赖数组设置不正确导致的无限循环
- 在条件语句中使用 Hook`,
    type: 'domain',
    description: 'React Hooks 的核心概念、最佳实践和常见陷阱',
    tags: 'React,Hooks,前端开发,JavaScript,最佳实践',
    usage_count: 15,
    created_at: new Date('2024-01-15').toISOString(),
    updated_at: new Date('2024-01-20').toISOString()
  },
  {
    id: 'kb-002',
    title: 'TypeScript 类型系统深入理解',
    content: `TypeScript 的类型系统是其核心特性，提供了强大的静态类型检查能力。

## 基础类型

### 原始类型
\`\`\`typescript
let isDone: boolean = false;
let decimal: number = 6;
let color: string = "blue";
\`\`\`

### 数组类型
\`\`\`typescript
let list: number[] = [1, 2, 3];
let list2: Array<number> = [1, 2, 3];
\`\`\`

## 高级类型

### 联合类型
\`\`\`typescript
type StringOrNumber = string | number;
\`\`\`

### 交叉类型
\`\`\`typescript
type Person = { name: string } & { age: number };
\`\`\`

### 泛型
\`\`\`typescript
function identity<T>(arg: T): T {
  return arg;
}
\`\`\`

## 实用工具类型

- \`Partial<T>\`: 将 T 的所有属性设为可选
- \`Required<T>\`: 将 T 的所有属性设为必需
- \`Pick<T, K>\`: 从 T 中选择属性 K
- \`Omit<T, K>\`: 从 T 中排除属性 K

## 最佳实践

1. 优先使用 interface 而不是 type（除非需要联合类型）
2. 使用严格模式配置
3. 避免使用 any，使用 unknown 替代
4. 合理使用类型断言`,
    type: 'domain',
    description: 'TypeScript 类型系统的深入讲解，包括基础类型、高级类型和最佳实践',
    tags: 'TypeScript,类型系统,前端开发,静态类型,编程语言',
    usage_count: 23,
    created_at: new Date('2024-01-10').toISOString(),
    updated_at: new Date('2024-01-25').toISOString()
  },
  {
    id: 'kb-003',
    title: 'Node.js 性能优化指南',
    content: `Node.js 性能优化是后端开发中的重要话题，涉及多个方面的优化策略。

## 事件循环优化

### 避免阻塞事件循环
\`\`\`javascript
// 错误示例
function blockingOperation() {
  let result = 0;
  for (let i = 0; i < 10000000; i++) {
    result += i;
  }
  return result;
}

// 正确示例
function nonBlockingOperation(callback) {
  setImmediate(() => {
    let result = 0;
    for (let i = 0; i < 10000000; i++) {
      result += i;
    }
    callback(result);
  });
}
\`\`\`

## 内存管理

### 避免内存泄漏
1. 及时清理事件监听器
2. 避免全局变量
3. 正确使用闭包
4. 监控内存使用情况

### 垃圾回收优化
\`\`\`javascript
// 使用 --max-old-space-size 调整堆内存大小
node --max-old-space-size=4096 app.js
\`\`\`

## 数据库优化

### 连接池管理
\`\`\`javascript
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'mydb'
});
\`\`\`

### 查询优化
- 使用索引
- 避免 N+1 查询
- 使用分页
- 缓存查询结果

## 缓存策略

### Redis 缓存
\`\`\`javascript
const redis = require('redis');
const client = redis.createClient();

async function getCachedData(key) {
  const cached = await client.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await fetchDataFromDB();
  await client.setex(key, 3600, JSON.stringify(data));
  return data;
}
\`\`\`

## 监控和分析

### 性能监控工具
- New Relic
- AppDynamics
- Datadog
- 自建监控系统

### 性能分析
\`\`\`javascript
// 使用 clinic.js 进行性能分析
clinic doctor -- node app.js
clinic flame -- node app.js
\`\`\``,
    type: 'domain',
    description: 'Node.js 应用性能优化的全面指南，包括事件循环、内存管理、数据库优化等',
    tags: 'Node.js,性能优化,后端开发,事件循环,内存管理,数据库优化',
    usage_count: 18,
    created_at: new Date('2024-01-08').toISOString(),
    updated_at: new Date('2024-01-22').toISOString()
  },

  // 格式模板类型
  {
    id: 'kb-004',
    title: 'API 文档模板',
    content: `# API 文档模板

## 接口概述

**接口名称**: [接口名称]
**接口描述**: [接口功能描述]
**请求方式**: GET/POST/PUT/DELETE
**接口地址**: \`/api/v1/[endpoint]\`

## 请求参数

### 路径参数
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | string | 是 | 资源ID |

### 查询参数
| 参数名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |
| sort | string | 否 | created_at | 排序字段 |

### 请求体参数
\`\`\`json
{
  "name": "string",
  "email": "string",
  "age": "number"
}
\`\`\`

## 响应格式

### 成功响应
\`\`\`json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
\`\`\`

### 错误响应
\`\`\`json
{
  "code": 400,
  "message": "参数错误",
  "errors": [
    {
      "field": "email",
      "message": "邮箱格式不正确"
    }
  ]
}
\`\`\`

## 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 示例代码

### JavaScript
\`\`\`javascript
const response = await fetch('/api/v1/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com'
  })
});

const data = await response.json();
\`\`\`

### cURL
\`\`\`bash
curl -X POST \\
  http://localhost:3000/api/v1/users \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token' \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com"
  }'
\`\`\`

## 注意事项

1. 所有请求都需要在 Header 中包含 Authorization
2. 请求频率限制：每分钟最多 100 次请求
3. 数据格式必须为 JSON
4. 时间格式统一使用 ISO 8601 标准`,
    type: 'template',
    description: 'RESTful API 文档的标准模板，包含请求参数、响应格式、示例代码等',
    tags: 'API文档,模板,RESTful,接口设计,文档规范',
    usage_count: 31,
    created_at: new Date('2024-01-05').toISOString(),
    updated_at: new Date('2024-01-18').toISOString()
  },
  {
    id: 'kb-005',
    title: '代码审查清单模板',
    content: `# 代码审查清单

## 基本检查项

### 代码质量
- [ ] 代码逻辑清晰，易于理解
- [ ] 变量和函数命名有意义
- [ ] 代码格式符合团队规范
- [ ] 没有重复代码
- [ ] 复杂逻辑有适当的注释

### 功能性
- [ ] 实现了所有需求功能
- [ ] 边界条件处理正确
- [ ] 错误处理完善
- [ ] 输入验证充分
- [ ] 输出格式正确

### 性能
- [ ] 算法复杂度合理
- [ ] 数据库查询优化
- [ ] 内存使用合理
- [ ] 网络请求优化
- [ ] 缓存策略合适

### 安全性
- [ ] 输入数据验证和清理
- [ ] SQL 注入防护
- [ ] XSS 攻击防护
- [ ] 敏感信息保护
- [ ] 权限控制正确

### 可维护性
- [ ] 代码结构清晰
- [ ] 模块化程度高
- [ ] 依赖关系合理
- [ ] 配置外部化
- [ ] 日志记录完善

## 技术特定检查

### 前端代码
- [ ] 组件拆分合理
- [ ] 状态管理正确
- [ ] 事件处理优化
- [ ] 样式规范统一
- [ ] 无障碍性考虑

### 后端代码
- [ ] API 设计合理
- [ ] 数据模型正确
- [ ] 事务处理完善
- [ ] 并发控制合适
- [ ] 监控和日志

### 数据库相关
- [ ] 索引设计合理
- [ ] 查询性能优化
- [ ] 数据完整性约束
- [ ] 备份和恢复策略
- [ ] 数据迁移脚本

## 测试相关

### 单元测试
- [ ] 测试覆盖率达标
- [ ] 测试用例充分
- [ ] 边界条件测试
- [ ] 异常情况测试
- [ ] 模拟对象使用合理

### 集成测试
- [ ] 接口测试完整
- [ ] 数据流测试
- [ ] 第三方服务集成测试
- [ ] 端到端测试
- [ ] 性能测试

## 文档和注释

### 代码注释
- [ ] 复杂逻辑有注释
- [ ] 公共接口有文档
- [ ] 配置参数有说明
- [ ] 已知问题有标记
- [ ] TODO 项目有跟踪

### 外部文档
- [ ] README 文件更新
- [ ] API 文档更新
- [ ] 部署文档更新
- [ ] 变更日志记录
- [ ] 用户手册更新

## 部署和运维

### 部署相关
- [ ] 环境配置正确
- [ ] 依赖版本锁定
- [ ] 构建脚本完善
- [ ] 回滚策略准备
- [ ] 健康检查配置

### 监控和告警
- [ ] 关键指标监控
- [ ] 错误日志收集
- [ ] 性能指标跟踪
- [ ] 告警规则设置
- [ ] 故障恢复流程

## 审查结论

### 总体评价
- [ ] 优秀 - 可以直接合并
- [ ] 良好 - 小修改后合并
- [ ] 一般 - 需要重要修改
- [ ] 较差 - 需要重新设计

### 主要问题
1. [问题描述]
2. [问题描述]
3. [问题描述]

### 改进建议
1. [建议内容]
2. [建议内容]
3. [建议内容]

### 审查人员
- 审查人：[姓名]
- 审查时间：[日期]
- 审查版本：[版本号]`,
    type: 'template',
    description: '全面的代码审查清单模板，涵盖代码质量、功能性、性能、安全性等各个方面',
    tags: '代码审查,清单,模板,质量控制,团队协作',
    usage_count: 27,
    created_at: new Date('2024-01-12').toISOString(),
    updated_at: new Date('2024-01-28').toISOString()
  },

  // 最佳实践类型
  {
    id: 'kb-006',
    title: 'Git 工作流最佳实践',
    content: `# Git 工作流最佳实践

## 分支策略

### Git Flow 模型
\`\`\`
main (生产环境)
├── develop (开发环境)
│   ├── feature/user-auth (功能分支)
│   ├── feature/payment-system (功能分支)
│   └── release/v1.2.0 (发布分支)
└── hotfix/critical-bug (热修复分支)
\`\`\`

### 分支命名规范
- **功能分支**: \`feature/功能描述\`
- **修复分支**: \`bugfix/问题描述\`
- **热修复分支**: \`hotfix/紧急修复描述\`
- **发布分支**: \`release/版本号\`

## 提交规范

### 提交信息格式
\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

### 类型说明
- **feat**: 新功能
- **fix**: 修复bug
- **docs**: 文档更新
- **style**: 代码格式调整
- **refactor**: 代码重构
- **test**: 测试相关
- **chore**: 构建过程或辅助工具的变动

### 示例
\`\`\`
feat(auth): add user login functionality

- Implement JWT token authentication
- Add login form validation
- Create user session management

Closes #123
\`\`\`

## 工作流程

### 1. 创建功能分支
\`\`\`bash
git checkout develop
git pull origin develop
git checkout -b feature/user-profile
\`\`\`

### 2. 开发和提交
\`\`\`bash
# 频繁提交，保持提交粒度小
git add .
git commit -m "feat(profile): add user avatar upload"

# 推送到远程分支
git push origin feature/user-profile
\`\`\`

### 3. 创建 Pull Request
- 填写详细的 PR 描述
- 关联相关的 Issue
- 请求代码审查
- 确保 CI/CD 通过

### 4. 代码审查
- 至少一人审查
- 解决所有评论
- 确保测试覆盖率
- 检查代码质量

### 5. 合并和清理
\`\`\`bash
# 合并后删除功能分支
git checkout develop
git pull origin develop
git branch -d feature/user-profile
git push origin --delete feature/user-profile
\`\`\`

## 最佳实践

### 提交频率
- 小步快跑，频繁提交
- 每个提交都应该是可工作的状态
- 避免大量文件的单次提交

### 代码同步
\`\`\`bash
# 定期同步主分支
git checkout feature/my-feature
git rebase develop

# 解决冲突后
git add .
git rebase --continue
\`\`\`

### 历史管理
\`\`\`bash
# 使用 rebase 保持线性历史
git rebase -i HEAD~3

# 合并提交
pick abc1234 feat: add user model
squash def5678 fix: typo in user model
squash ghi9012 refactor: improve user model
\`\`\`

## 团队协作

### 代码审查要点
1. 功能是否符合需求
2. 代码质量和可读性
3. 测试覆盖率
4. 性能影响
5. 安全性考虑

### 冲突解决
\`\`\`bash
# 拉取最新代码
git fetch origin
git rebase origin/develop

# 解决冲突
# 编辑冲突文件
git add <resolved-files>
git rebase --continue
\`\`\`

### 发布流程
1. 从 develop 创建 release 分支
2. 在 release 分支进行最后的测试和修复
3. 合并到 main 和 develop
4. 打标签并发布

## 工具和配置

### Git 配置
\`\`\`bash
# 设置用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 设置默认编辑器
git config --global core.editor "code --wait"

# 设置默认分支名
git config --global init.defaultBranch main
\`\`\`

### Git Hooks
\`\`\`bash
#!/bin/sh
# pre-commit hook
npm run lint
npm run test
\`\`\`

### .gitignore 模板
\`\`\`
# 依赖
node_modules/
vendor/

# 构建产物
dist/
build/
*.min.js

# 环境配置
.env
.env.local

# IDE 文件
.vscode/
.idea/
*.swp

# 日志文件
*.log
logs/

# 操作系统文件
.DS_Store
Thumbs.db
\`\`\``,
    type: 'practice',
    description: 'Git 版本控制的最佳实践，包括分支策略、提交规范、工作流程和团队协作',
    tags: 'Git,版本控制,工作流,团队协作,最佳实践,分支管理',
    usage_count: 42,
    created_at: new Date('2024-01-03').toISOString(),
    updated_at: new Date('2024-01-30').toISOString()
  },
  {
    id: 'kb-007',
    title: '数据库设计最佳实践',
    content: `# 数据库设计最佳实践

## 设计原则

### 1. 规范化设计
- **第一范式 (1NF)**: 确保每个字段都是原子性的
- **第二范式 (2NF)**: 消除部分函数依赖
- **第三范式 (3NF)**: 消除传递函数依赖

### 2. 命名规范
\`\`\`sql
-- 表名：使用复数形式，下划线分隔
users, user_profiles, order_items

-- 字段名：使用下划线分隔，避免保留字
user_id, created_at, is_active

-- 索引名：表名_字段名_idx
idx_users_email, idx_orders_created_at
\`\`\`

### 3. 数据类型选择
\`\`\`sql
-- 字符串类型
VARCHAR(255) -- 变长字符串，指定合适长度
TEXT         -- 大文本内容
CHAR(2)      -- 固定长度，如国家代码

-- 数值类型
INT          -- 整数
BIGINT       -- 大整数，如 ID
DECIMAL(10,2) -- 精确小数，如金额
BOOLEAN      -- 布尔值

-- 日期时间
TIMESTAMP    -- 时间戳，带时区
DATE         -- 日期
TIME         -- 时间
\`\`\`

## 表结构设计

### 基础表结构
\`\`\`sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_created_at (created_at)
);
\`\`\`

### 关联表设计
\`\`\`sql
-- 一对多关系
CREATE TABLE posts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_posts_user_id (user_id),
    INDEX idx_posts_status (status),
    INDEX idx_posts_published_at (published_at)
);

-- 多对多关系
CREATE TABLE post_tags (
    post_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
\`\`\`

## 索引策略

### 索引类型
\`\`\`sql
-- 主键索引（自动创建）
PRIMARY KEY (id)

-- 唯一索引
UNIQUE INDEX idx_users_email (email)

-- 普通索引
INDEX idx_posts_created_at (created_at)

-- 复合索引
INDEX idx_posts_user_status (user_id, status)

-- 全文索引
FULLTEXT INDEX idx_posts_content (title, content)
\`\`\`

### 索引优化原则
1. **选择性高的字段**：优先为选择性高的字段创建索引
2. **查询频率**：为经常用于 WHERE、ORDER BY 的字段创建索引
3. **复合索引顺序**：将选择性高的字段放在前面
4. **避免过多索引**：索引会影响写入性能

## 查询优化

### 高效查询模式
\`\`\`sql
-- 使用 LIMIT 限制结果集
SELECT * FROM posts 
WHERE status = 'published' 
ORDER BY created_at DESC 
LIMIT 20;

-- 使用索引覆盖
SELECT id, title, created_at 
FROM posts 
WHERE user_id = 123;

-- 避免 SELECT *
SELECT id, title, content 
FROM posts 
WHERE id = 123;

-- 使用 EXISTS 代替 IN（大数据集）
SELECT * FROM users u 
WHERE EXISTS (
    SELECT 1 FROM posts p 
    WHERE p.user_id = u.id
);
\`\`\`

### 避免的反模式
\`\`\`sql
-- 避免在 WHERE 中使用函数
-- 错误
SELECT * FROM posts WHERE YEAR(created_at) = 2024;
-- 正确
SELECT * FROM posts WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';

-- 避免前导通配符
-- 错误
SELECT * FROM users WHERE username LIKE '%john%';
-- 正确
SELECT * FROM users WHERE username LIKE 'john%';
\`\`\`

## 数据完整性

### 约束设计
\`\`\`sql
-- 非空约束
email VARCHAR(255) NOT NULL

-- 唯一约束
UNIQUE KEY uk_users_email (email)

-- 外键约束
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- 检查约束
CHECK (age >= 0 AND age <= 150)

-- 默认值
status ENUM('active', 'inactive') DEFAULT 'active'
\`\`\`

### 事务处理
\`\`\`sql
START TRANSACTION;

INSERT INTO orders (user_id, total_amount) VALUES (123, 99.99);
SET @order_id = LAST_INSERT_ID();

INSERT INTO order_items (order_id, product_id, quantity, price) 
VALUES (@order_id, 456, 2, 49.99);

UPDATE products SET stock_quantity = stock_quantity - 2 WHERE id = 456;

COMMIT;
\`\`\`

## 性能优化

### 分区策略
\`\`\`sql
-- 按日期分区
CREATE TABLE logs (
    id BIGINT AUTO_INCREMENT,
    message TEXT,
    created_at TIMESTAMP,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
\`\`\`

### 读写分离
\`\`\`sql
-- 主库：处理写操作
-- 从库：处理读操作

-- 应用层配置
const writeDB = mysql.createConnection(masterConfig);
const readDB = mysql.createConnection(slaveConfig);
\`\`\`

## 安全考虑

### 权限管理
\`\`\`sql
-- 创建专用用户
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'strong_password';

-- 授予最小权限
GRANT SELECT, INSERT, UPDATE, DELETE ON myapp.* TO 'app_user'@'localhost';

-- 撤销不必要权限
REVOKE ALL PRIVILEGES ON *.* FROM 'app_user'@'localhost';
\`\`\`

### 数据加密
\`\`\`sql
-- 敏感数据加密存储
password_hash VARCHAR(255) -- 使用 bcrypt 等安全哈希
encrypted_ssn VARBINARY(255) -- 加密存储社会保险号

-- 传输加密
-- 使用 SSL/TLS 连接数据库
\`\`\`

## 监控和维护

### 性能监控
\`\`\`sql
-- 慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- 查看执行计划
EXPLAIN SELECT * FROM posts WHERE user_id = 123;

-- 监控索引使用情况
SHOW INDEX FROM posts;
\`\`\`

### 定期维护
\`\`\`sql
-- 优化表
OPTIMIZE TABLE posts;

-- 分析表
ANALYZE TABLE posts;

-- 检查表
CHECK TABLE posts;

-- 修复表
REPAIR TABLE posts;
\`\`\``,
    type: 'practice',
    description: '数据库设计的最佳实践，包括表结构设计、索引优化、查询优化和性能调优',
    tags: '数据库设计,SQL,索引优化,查询优化,性能调优,数据完整性',
    usage_count: 35,
    created_at: new Date('2024-01-07').toISOString(),
    updated_at: new Date('2024-01-26').toISOString()
  },

  // 参考资料类型
  {
    id: 'kb-008',
    title: 'HTTP 状态码完整参考',
    content: `# HTTP 状态码完整参考

HTTP 状态码用于表示 HTTP 请求的结果。状态码分为五个类别，每个类别有不同的含义。

## 1xx 信息响应

### 100 Continue
客户端应继续其请求。服务器已收到请求头，客户端应继续发送请求体。

### 101 Switching Protocols
服务器正在切换协议，根据客户端的请求。

### 102 Processing (WebDAV)
服务器已收到并正在处理请求，但尚无响应可用。

## 2xx 成功响应

### 200 OK
请求成功。响应的信息取决于使用的方法。

**使用场景**:
- GET: 资源已被提取并在消息体中传输
- HEAD: 实体头在消息体中
- POST: 描述或包含操作结果的资源

### 201 Created
请求成功，并因此创建了一个新的资源。

**使用场景**:
- POST 请求创建新资源
- PUT 请求创建新资源

**响应示例**:
\`\`\`http
HTTP/1.1 201 Created
Location: /api/users/123
Content-Type: application/json

{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com"
}
\`\`\`

### 202 Accepted
请求已经接收到，但还未响应，没有结果。

**使用场景**:
- 异步处理的请求
- 批处理操作
- 长时间运行的任务

### 204 No Content
服务器成功处理了请求，但不需要返回任何实体内容。

**使用场景**:
- DELETE 操作成功
- PUT 更新操作成功
- 不需要返回数据的操作

## 3xx 重定向

### 301 Moved Permanently
请求的资源已被永久移动到新位置。

**使用场景**:
- 网站迁移
- URL 结构调整
- SEO 优化

**响应示例**:
\`\`\`http
HTTP/1.1 301 Moved Permanently
Location: https://newdomain.com/new-path
\`\`\`

### 302 Found
请求的资源现在临时从不同的 URI 响应请求。

**使用场景**:
- 临时重定向
- 负载均衡
- 维护页面

### 304 Not Modified
资源未修改，可以使用缓存版本。

**使用场景**:
- 条件请求
- 缓存验证
- 带 If-Modified-Since 的请求

## 4xx 客户端错误

### 400 Bad Request
服务器不理解请求的语法。

**常见原因**:
- JSON 格式错误
- 缺少必需参数
- 参数类型错误

**响应示例**:
\`\`\`http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Bad Request",
  "message": "Invalid JSON format",
  "details": [
    {
      "field": "email",
      "message": "Email format is invalid"
    }
  ]
}
\`\`\`

### 401 Unauthorized
请求要求用户的身份认证。

**使用场景**:
- 未提供认证信息
- 认证信息无效
- Token 过期

**响应示例**:
\`\`\`http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api"
Content-Type: application/json

{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
\`\`\`

### 403 Forbidden
服务器理解请求，但拒绝执行。

**使用场景**:
- 权限不足
- 资源访问被禁止
- IP 被封禁

### 404 Not Found
请求失败，请求所希望得到的资源未被在服务器上发现。

**使用场景**:
- 资源不存在
- URL 路径错误
- 资源已被删除

### 409 Conflict
请求的资源的当前状态之间存在冲突。

**使用场景**:
- 资源已存在
- 并发修改冲突
- 业务规则冲突

### 422 Unprocessable Entity
请求格式正确，但语义错误。

**使用场景**:
- 数据验证失败
- 业务逻辑错误
- 字段值不符合要求

### 429 Too Many Requests
用户在给定的时间内发送了太多的请求。

**使用场景**:
- API 限流
- 防止滥用
- 保护服务器资源

**响应示例**:
\`\`\`http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200

{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 60 seconds."
}
\`\`\`

## 5xx 服务器错误

### 500 Internal Server Error
服务器遇到了不知道如何处理的情况。

**常见原因**:
- 代码异常
- 数据库连接失败
- 第三方服务异常

### 502 Bad Gateway
服务器作为网关或代理，从上游服务器收到无效响应。

**使用场景**:
- 上游服务器宕机
- 网络连接问题
- 代理配置错误

### 503 Service Unavailable
服务器暂时无法处理请求。

**使用场景**:
- 服务器维护
- 服务器过载
- 临时故障

**响应示例**:
\`\`\`http
HTTP/1.1 503 Service Unavailable
Retry-After: 120
Content-Type: application/json

{
  "error": "Service Unavailable",
  "message": "Server is temporarily unavailable due to maintenance"
}
\`\`\`

### 504 Gateway Timeout
服务器作为网关或代理，但是没有及时从上游服务器收到请求。

**使用场景**:
- 上游服务器响应超时
- 网络延迟过高
- 处理时间过长

## 最佳实践

### 1. 选择合适的状态码
\`\`\`javascript
// 创建资源
app.post('/api/users', (req, res) => {
  const user = createUser(req.body);
  res.status(201).json(user); // 使用 201 而不是 200
});

// 删除资源
app.delete('/api/users/:id', (req, res) => {
  deleteUser(req.params.id);
  res.status(204).send(); // 使用 204 而不是 200
});

// 资源不存在
app.get('/api/users/:id', (req, res) => {
  const user = findUser(req.params.id);
  if (!user) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'User not found'
    });
  }
  res.json(user);
});
\`\`\`

### 2. 提供有意义的错误信息
\`\`\`javascript
// 好的错误响应
{
  "error": "Validation Failed",
  "message": "The request data is invalid",
  "details": [
    {
      "field": "email",
      "code": "INVALID_FORMAT",
      "message": "Email must be a valid email address"
    },
    {
      "field": "age",
      "code": "OUT_OF_RANGE",
      "message": "Age must be between 18 and 120"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/users"
}
\`\`\`

### 3. 一致的错误格式
\`\`\`javascript
class APIError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }

  toJSON() {
    return {
      error: this.constructor.name,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString()
    };
  }
}

// 使用示例
throw new APIError(400, 'Invalid request data', [
  { field: 'email', message: 'Email is required' }
]);
\`\`\`

### 4. 状态码映射表

| 操作 | 成功 | 客户端错误 | 服务器错误 |
|------|------|------------|------------|
| GET | 200, 304 | 404, 400 | 500, 502 |
| POST | 201, 202 | 400, 409, 422 | 500, 503 |
| PUT | 200, 204 | 400, 404, 409 | 500 |
| DELETE | 204, 200 | 404, 400 | 500 |
| PATCH | 200, 204 | 400, 404, 409 | 500 |`,
    type: 'reference',
    description: 'HTTP 状态码的完整参考指南，包括各状态码的含义、使用场景和最佳实践',
    tags: 'HTTP,状态码,API设计,Web开发,RESTful,参考手册',
    usage_count: 56,
    created_at: new Date('2024-01-02').toISOString(),
    updated_at: new Date('2024-01-29').toISOString()
  },
  {
    id: 'kb-009',
    title: 'CSS 选择器完整参考',
    content: `# CSS 选择器完整参考

CSS 选择器用于选择要设置样式的 HTML 元素。本参考包含所有主要的选择器类型和用法。

## 基础选择器

### 通用选择器
\`\`\`css
/* 选择所有元素 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
\`\`\`

### 元素选择器
\`\`\`css
/* 选择所有 p 元素 */
p {
  color: #333;
  line-height: 1.6;
}

/* 选择所有 h1 元素 */
h1 {
  font-size: 2rem;
  font-weight: bold;
}
\`\`\`

### 类选择器
\`\`\`css
/* 选择 class="button" 的元素 */
.button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
}

/* 选择多个类 */
.button.primary {
  background-color: #0056b3;
}
\`\`\`

### ID 选择器
\`\`\`css
/* 选择 id="header" 的元素 */
#header {
  background-color: #f8f9fa;
  padding: 20px;
}

/* ID 选择器具有最高优先级 */
#navigation {
  position: fixed;
  top: 0;
  width: 100%;
}
\`\`\`

### 属性选择器
\`\`\`css
/* 选择具有 title 属性的元素 */
[title] {
  border-bottom: 1px dotted;
}

/* 选择 type="text" 的元素 */
[type="text"] {
  border: 1px solid #ccc;
  padding: 8px;
}

/* 选择 class 属性包含 "nav" 的元素 */
[class*="nav"] {
  display: flex;
}

/* 选择 href 属性以 "https" 开头的元素 */
[href^="https"] {
  color: green;
}

/* 选择 href 属性以 ".pdf" 结尾的元素 */
[href$=".pdf"] {
  background: url(pdf-icon.png) no-repeat;
  padding-left: 20px;
}

/* 选择 data-status 属性包含 "active" 的元素 */
[data-status~="active"] {
  background-color: #28a745;
}

/* 选择 lang 属性为 "en" 或以 "en-" 开头的元素 */
[lang|="en"] {
  font-family: "Arial", sans-serif;
}
\`\`\`

## 组合选择器

### 后代选择器
\`\`\`css
/* 选择 .container 内的所有 p 元素 */
.container p {
  margin-bottom: 1rem;
}

/* 选择 article 内的所有 h2 元素 */
article h2 {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
}
\`\`\`

### 子选择器
\`\`\`css
/* 选择 .menu 的直接子元素 li */
.menu > li {
  display: inline-block;
  margin-right: 20px;
}

/* 选择 form 的直接子元素 div */
form > div {
  margin-bottom: 15px;
}
\`\`\`

### 相邻兄弟选择器
\`\`\`css
/* 选择紧跟在 h1 后面的 p 元素 */
h1 + p {
  font-size: 1.2rem;
  font-weight: bold;
  margin-top: 0;
}

/* 选择紧跟在 .alert 后面的 .button */
.alert + .button {
  margin-top: 10px;
}
\`\`\`

### 通用兄弟选择器
\`\`\`css
/* 选择 h1 后面的所有 p 兄弟元素 */
h1 ~ p {
  color: #666;
}

/* 选择 .active 后面的所有 .tab 兄弟元素 */
.active ~ .tab {
  opacity: 0.5;
}
\`\`\`

## 伪类选择器

### 链接伪类
\`\`\`css
/* 未访问的链接 */
a:link {
  color: #007bff;
  text-decoration: none;
}

/* 已访问的链接 */
a:visited {
  color: #6c757d;
}

/* 鼠标悬停 */
a:hover {
  color: #0056b3;
  text-decoration: underline;
}

/* 激活状态 */
a:active {
  color: #004085;
}
\`\`\`

### 用户行为伪类
\`\`\`css
/* 获得焦点的元素 */
input:focus {
  outline: 2px solid #007bff;
  border-color: #007bff;
}

/* 鼠标悬停 */
.button:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

/* 激活状态 */
.button:active {
  transform: translateY(0);
}
\`\`\`

### 结构伪类
\`\`\`css
/* 第一个子元素 */
li:first-child {
  margin-top: 0;
}

/* 最后一个子元素 */
li:last-child {
  margin-bottom: 0;
}

/* 第 n 个子元素 */
tr:nth-child(2n) {
  background-color: #f8f9fa;
}

/* 奇数行 */
tr:nth-child(odd) {
  background-color: #ffffff;
}

/* 偶数行 */
tr:nth-child(even) {
  background-color: #f8f9fa;
}

/* 倒数第 n 个子元素 */
li:nth-last-child(2) {
  font-weight: bold;
}

/* 唯一子元素 */
p:only-child {
  text-align: center;
}

/* 没有子元素的元素 */
div:empty {
  display: none;
}
\`\`\`

### 表单伪类
\`\`\`css
/* 启用的表单元素 */
input:enabled {
  background-color: white;
}

/* 禁用的表单元素 */
input:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

/* 选中的复选框或单选按钮 */
input:checked {
  accent-color: #007bff;
}

/* 必填字段 */
input:required {
  border-left: 3px solid #dc3545;
}

/* 可选字段 */
input:optional {
  border-left: 3px solid #28a745;
}

/* 有效输入 */
input:valid {
  border-color: #28a745;
}

/* 无效输入 */
input:invalid {
  border-color: #dc3545;
}

/* 在范围内的输入 */
input:in-range {
  border-color: #28a745;
}

/* 超出范围的输入 */
input:out-of-range {
  border-color: #dc3545;
}
\`\`\`

### 其他伪类
\`\`\`css
/* 根元素 */
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
}

/* 目标元素（URL 片段标识符指向的元素） */
:target {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
}

/* 非指定元素 */
:not(.hidden) {
  display: block;
}

/* 包含指定文本的元素 */
:contains("重要") {
  font-weight: bold;
  color: #dc3545;
}
\`\`\`

## 伪元素选择器

### 内容伪元素
\`\`\`css
/* 元素内容之前 */
.quote::before {
  content: """;
  font-size: 2rem;
  color: #6c757d;
}

/* 元素内容之后 */
.quote::after {
  content: """;
  font-size: 2rem;
  color: #6c757d;
}

/* 首字母 */
p::first-letter {
  font-size: 3rem;
  float: left;
  line-height: 1;
  margin-right: 5px;
}

/* 首行 */
p::first-line {
  font-weight: bold;
  color: #2c3e50;
}
\`\`\`

### 选择伪元素
\`\`\`css
/* 用户选择的文本 */
::selection {
  background-color: #007bff;
  color: white;
}

/* Firefox 中的选择 */
::-moz-selection {
  background-color: #007bff;
  color: white;
}
\`\`\`

### 表单伪元素
\`\`\`css
/* 输入框占位符 */
input::placeholder {
  color: #6c757d;
  font-style: italic;
}

/* 文件上传按钮 */
input[type="file"]::file-selector-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
\`\`\`

## 选择器优先级

### 优先级计算
\`\`\`css
/* 优先级：0,0,0,1 */
p { color: black; }

/* 优先级：0,0,1,0 */
.text { color: blue; }

/* 优先级：0,1,0,0 */
#content { color: green; }

/* 优先级：1,0,0,0 */
p { color: red !important; }

/* 优先级：0,0,1,1 */
p.text { color: purple; }

/* 优先级：0,1,1,0 */
#content .text { color: orange; }
\`\`\`

### 优先级规则
1. **内联样式** (1,0,0,0)
2. **ID 选择器** (0,1,0,0)
3. **类选择器、属性选择器、伪类** (0,0,1,0)
4. **元素选择器、伪元素** (0,0,0,1)
5. **通用选择器** (0,0,0,0)

## 实用示例

### 响应式导航菜单
\`\`\`css
/* 基础导航样式 */
.nav {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav > li {
  position: relative;
}

.nav > li > a {
  display: block;
  padding: 15px 20px;
  text-decoration: none;
  color: #333;
  transition: background-color 0.3s;
}

.nav > li > a:hover,
.nav > li > a:focus {
  background-color: #f8f9fa;
}

/* 下拉菜单 */
.nav > li > ul {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;
}

.nav > li:hover > ul {
  opacity: 1;
  visibility: visible;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .nav {
    flex-direction: column;
  }
  
  .nav > li > ul {
    position: static;
    box-shadow: none;
    opacity: 1;
    visibility: visible;
  }
}
\`\`\`

### 表单验证样式
\`\`\`css
/* 表单基础样式 */
.form-group {
  margin-bottom: 20px;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  transition: border-color 0.3s, box-shadow 0.3s;
}

/* 焦点状态 */
.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* 验证状态 */
.form-control:valid {
  border-color: #28a745;
}

.form-control:invalid:not(:placeholder-shown) {
  border-color: #dc3545;
}

/* 必填字段标识 */
.required::after {
  content: " *";
  color: #dc3545;
}

/* 错误消息 */
.form-control:invalid:not(:placeholder-shown) + .error-message {
  display: block;
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 5px;
}

.error-message {
  display: none;
}
\`\`\``,
    type: 'reference',
    description: 'CSS 选择器的完整参考指南，包括基础选择器、组合选择器、伪类和伪元素',
    tags: 'CSS,选择器,前端开发,样式,Web开发,参考手册',
    usage_count: 48,
    created_at: new Date('2024-01-04').toISOString(),
    updated_at: new Date('2024-01-27').toISOString()
  }
];

function seedKnowledgeData() {
  console.log('开始添加知识库测试数据...');
  
  try {
    const db = new Database(dbPath);
    
    // 清空现有数据（可选）
    console.log('清空现有知识库数据...');
    db.prepare('DELETE FROM knowledge_base').run();
    
    // 插入新数据
    const insertStmt = db.prepare(`
      INSERT INTO knowledge_base (
        id, title, content, type, description, tags, usage_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    knowledgeData.forEach(item => {
      insertStmt.run(
        item.id,
        item.title,
        item.content,
        item.type,
        item.description,
        item.tags,
        item.usage_count,
        item.created_at,
        item.updated_at
      );
      console.log(`✓ 添加知识库条目: ${item.title}`);
    });
    
    db.close();
    
    console.log(`\n✅ 成功添加 ${knowledgeData.length} 条知识库数据！`);
    console.log('\n数据统计:');
    console.log(`- 领域知识 (domain): ${knowledgeData.filter(item => item.type === 'domain').length} 条`);
    console.log(`- 格式模板 (template): ${knowledgeData.filter(item => item.type === 'template').length} 条`);
    console.log(`- 最佳实践 (practice): ${knowledgeData.filter(item => item.type === 'practice').length} 条`);
    console.log(`- 参考资料 (reference): ${knowledgeData.filter(item => item.type === 'reference').length} 条`);
    
  } catch (error) {
    console.error('❌ 添加知识库数据失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  seedKnowledgeData();
}

export { seedKnowledgeData }; 