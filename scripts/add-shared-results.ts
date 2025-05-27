import { getDbConnection } from "../src/lib/db/sqlite";

async function addSharedResults() {
  try {
    const db = await getDbConnection();

    // 为共享提示词添加效果演示数据
    const sharedResults = [
      // 创意写作助手的效果
      {
        id: 'result-shared-1-1',
        prompt_id: 'shared-1',
        title: '科幻小说开头创作',
        input_variables: null, // cover_image 字段
        generated_content: `# 星际迷航：新纪元

在2387年的深空中，联邦星舰"探索者号"正在执行一项前所未有的任务。船长艾莉娜·陈站在舰桥上，凝视着前方那片神秘的星云。

"船长，我们检测到了异常的能量读数，"科学官瓦伦报告道，"这种能量签名...我从未见过。"

艾莉娜深吸一口气。作为星际舰队最年轻的船长之一，她知道这次任务可能会改变人类对宇宙的认知。星云深处似乎隐藏着某种古老的秘密，而她的船员们即将成为第一批揭开这个谜团的人。

"全速前进，"她下令道，"让我们去看看宇宙还为我们准备了什么惊喜。"

探索者号缓缓驶入星云，船体在五彩斑斓的宇宙尘埃中闪闪发光，开始了一段将载入史册的冒险之旅...`,
        result_type: 'text',
        result_data: JSON.stringify({
          variables_used: {
            '主题': '科幻探索',
            '写作风格': '悬疑冒险',
            '字数要求': '300字左右'
          }
        }),
        rating: 5,
        feedback: '非常棒的开头！成功营造了神秘的氛围，人物设定清晰，情节引人入胜。',
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1天前
        updated_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'result-shared-1-2',
        prompt_id: 'shared-1',
        title: '商业计划书摘要',
        input_variables: null,
        generated_content: `# 智能家居解决方案 - 执行摘要

## 项目概述
"智慧生活"是一个面向现代家庭的综合性智能家居平台，致力于通过AI技术和物联网设备，为用户提供便捷、安全、节能的居住体验。

## 市场机遇
随着5G技术普及和消费者对智能化生活需求的增长，智能家居市场预计在未来5年内将达到3000亿元规模。我们的目标是在这个快速增长的市场中占据5%的份额。

## 产品优势
- **一体化解决方案**：从硬件到软件的完整生态系统
- **AI驱动**：基于机器学习的个性化服务
- **开放平台**：兼容主流智能设备品牌
- **隐私保护**：本地化数据处理，确保用户隐私安全

## 财务预测
预计首年营收2000万元，第三年达到盈亏平衡，第五年营收突破5亿元。初期需要投资3000万元用于产品研发和市场推广。

## 团队实力
核心团队拥有10年以上物联网和AI领域经验，曾成功孵化多个科技项目，具备从0到1的完整产品开发能力。`,
        result_type: 'text',
        result_data: JSON.stringify({
          variables_used: {
            '主题': '商业计划',
            '写作风格': '专业正式',
            '字数要求': '500字以内'
          }
        }),
        rating: 4,
        feedback: '结构清晰，内容专业，很好地展现了项目的商业价值和可行性。',
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2天前
        updated_at: new Date(Date.now() - 172800000).toISOString()
      },

      // React组件开发指南的效果
      {
        id: 'result-shared-2-1',
        prompt_id: 'shared-2',
        title: 'UserCard组件开发',
        input_variables: null,
        generated_content: `\`\`\`typescript
import React from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
}

interface UserCardProps {
  user: User;
  showEmail?: boolean;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
  className?: string;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  showEmail = true,
  onEdit,
  onDelete,
  className = ''
}) => {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(user);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('确定要删除这个用户吗？')) {
      onDelete(user.id);
    }
  };

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'guest': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={\`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow \${className}\`}>
      <div className="flex items-center space-x-4">
        {/* 头像 */}
        <div className="flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(user.name)}&background=random\`;
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* 用户信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {user.name}
            </h3>
            <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getRoleBadgeColor(user.role)}\`}>
              {user.role}
            </span>
          </div>
          {showEmail && (
            <p className="text-sm text-gray-500 truncate">
              {user.email}
            </p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="编辑用户"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="删除用户"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserCard;

// 使用示例
const ExampleUsage = () => {
  const sampleUser: User = {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    role: 'admin'
  };

  return (
    <UserCard
      user={sampleUser}
      showEmail={true}
      onEdit={(user) => console.log('编辑用户:', user)}
      onDelete={(userId) => console.log('删除用户:', userId)}
      className="max-w-md"
    />
  );
};
\`\`\``,
        result_type: 'code',
        result_data: JSON.stringify({
          variables_used: {
            '组件类型': '用户卡片',
            '组件名称': 'UserCard',
            '功能描述': '展示用户信息，支持编辑和删除操作',
            'Props要求': 'user对象、显示选项、回调函数'
          }
        }),
        rating: 5,
        feedback: '代码质量很高！完全符合React最佳实践，TypeScript类型定义完整，组件设计合理，可复用性强。',
        created_at: new Date(Date.now() - 259200000).toISOString(), // 3天前
        updated_at: new Date(Date.now() - 259200000).toISOString()
      },

      // 商业计划书撰写助手的效果
      {
        id: 'result-shared-3-1',
        prompt_id: 'shared-3',
        title: '在线教育平台商业计划书',
        input_variables: null,
        generated_content: `# EduTech在线教育平台商业计划书

## 1. 执行摘要

EduTech是一个专注于职业技能培训的在线教育平台，致力于为职场人士提供高质量、实用性强的技能提升课程。通过AI个性化学习路径和项目实战相结合的方式，帮助学员快速掌握市场需求的核心技能。

## 2. 公司概述

**公司名称**：EduTech在线教育科技有限公司  
**成立时间**：2024年  
**注册资本**：1000万元  
**公司性质**：有限责任公司  
**核心理念**：让每个人都能通过学习改变命运

## 3. 市场分析

### 3.1 市场规模
- 中国在线教育市场规模已超过4000亿元
- 职业教育细分市场年增长率达25%
- 目标用户群体超过2亿人

### 3.2 目标市场
- **主要用户**：25-35岁职场人士
- **细分领域**：IT技能、数字营销、数据分析、设计创意
- **地域分布**：一二线城市为主，逐步向三四线城市扩展

## 4. 产品/服务介绍

### 4.1 核心产品
- **技能课程**：涵盖编程、设计、营销等热门领域
- **项目实战**：真实企业项目，提升实战能力
- **AI学习助手**：个性化学习路径推荐
- **职业规划**：一对一职业咨询服务

### 4.2 产品优势
- 课程内容与企业需求高度匹配
- 学练结合，注重实际应用
- AI技术提升学习效率
- 完善的就业服务体系

## 5. 营销策略

### 5.1 品牌定位
"最懂职场的在线教育平台"

### 5.2 推广渠道
- **线上推广**：搜索引擎、社交媒体、内容营销
- **合作推广**：与企业、高校建立合作关系
- **口碑营销**：学员推荐奖励机制
- **KOL合作**：行业专家背书

## 6. 运营计划

### 6.1 团队建设
- **技术团队**：20人，负责平台开发和维护
- **内容团队**：15人，负责课程开发和更新
- **运营团队**：10人，负责用户运营和市场推广
- **客服团队**：8人，提供学习支持服务

### 6.2 发展阶段
- **第一阶段**（0-12个月）：平台搭建，核心课程上线
- **第二阶段**（12-24个月）：用户规模扩大，课程体系完善
- **第三阶段**（24-36个月）：市场领先地位，生态体系建设

## 7. 财务预测

### 7.1 收入模式
- **课程销售**：单课程售价500-3000元
- **会员订阅**：年费会员2980元
- **企业培训**：定制化企业培训服务
- **就业服务**：成功推荐就业收取服务费

### 7.2 财务预测（单位：万元）
| 年份 | 营业收入 | 营业成本 | 净利润 | 用户数量 |
|------|----------|----------|--------|----------|
| 第1年 | 1,200 | 800 | -200 | 5,000 |
| 第2年 | 3,500 | 2,100 | 400 | 15,000 |
| 第3年 | 8,000 | 4,800 | 1,600 | 35,000 |

## 8. 风险分析

### 8.1 主要风险
- **市场竞争风险**：行业竞争激烈，需要差异化定位
- **技术风险**：技术更新换代快，需要持续投入研发
- **政策风险**：教育政策变化可能影响业务发展
- **人才风险**：优秀师资和技术人才竞争激烈

### 8.2 风险应对
- 建立核心竞争优势，形成护城河
- 加大技术研发投入，保持技术领先
- 密切关注政策动向，及时调整策略
- 完善人才激励机制，留住核心人才

## 9. 融资需求

**融资金额**：3000万元  
**资金用途**：
- 技术研发：40%（1200万元）
- 市场推广：30%（900万元）
- 团队建设：20%（600万元）
- 运营资金：10%（300万元）

**退出机制**：计划在3-5年内实现IPO或被行业龙头企业收购

---

*本商业计划书为EduTech在线教育平台的发展蓝图，我们相信通过专业的团队、创新的产品和有效的运营，一定能够在竞争激烈的在线教育市场中脱颖而出，为用户创造价值，为投资者带来回报。*`,
        result_type: 'text',
        result_data: JSON.stringify({
          variables_used: {
            '项目名称': 'EduTech在线教育平台',
            '行业领域': '在线教育/职业培训',
            '目标市场': '25-35岁职场人士',
            '预算规模': '3000万元'
          }
        }),
        rating: 5,
        feedback: '非常专业的商业计划书！结构完整，数据详实，分析深入，完全达到了投资级别的标准。',
        created_at: new Date(Date.now() - 345600000).toISOString(), // 4天前
        updated_at: new Date(Date.now() - 345600000).toISOString()
      }
    ];

    // 插入效果记录
    const insertResult = db.prepare(`
      INSERT OR REPLACE INTO prompt_results (
        id, prompt_id, title, input_variables, generated_content, 
        result_type, result_data, rating, feedback, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const result of sharedResults) {
      insertResult.run(
        result.id,
        result.prompt_id,
        result.title,
        result.input_variables,
        result.generated_content,
        result.result_type,
        result.result_data,
        result.rating,
        result.feedback,
        result.created_at,
        result.updated_at
      );
    }

    console.log('✅ 共享提示词效果数据添加成功！');
    console.log(`添加了 ${sharedResults.length} 条效果记录`);
    
  } catch (error) {
    console.error('❌ 添加效果数据失败:', error);
  }
}

// 运行脚本
addSharedResults(); 