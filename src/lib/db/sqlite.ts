import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// 数据库实例
let db: Database.Database | null = null;

// 数据库配置
const DB_CONFIG = {
  path: path.join(process.cwd(), "data", "prompts.db"),
  options: {
    verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
    fileMustExist: false,
  },
  pragmas: {
    journal_mode: "WAL",
    synchronous: "NORMAL",
    cache_size: 32000,
    temp_store: "MEMORY",
    mmap_size: 268435456, // 256MB
  },
};

// 数据库版本和迁移
const DATABASE_VERSION = 8;

interface Migration {
  version: number;
  description: string;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void;
}

// 迁移脚本
const migrations: Migration[] = [
  {
    version: 1,
    description: "Initial database schema",
    up: (db: Database.Database) => {
      // 创建提示词表
      db.exec(`
        CREATE TABLE IF NOT EXISTS prompts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          description TEXT,
          category_id TEXT,
          rating INTEGER DEFAULT 0,
          is_favorite BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id)
        );
      `);

      // 创建分类表
      db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          parent_id TEXT,
          color TEXT DEFAULT '#3B82F6',
          icon TEXT DEFAULT 'folder',
          order_index INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_id) REFERENCES categories(id)
        );
      `);

      // 创建标签表
      db.exec(`
        CREATE TABLE IF NOT EXISTS tags (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          color TEXT DEFAULT '#10B981',
          description TEXT,
          usage_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 创建提示词标签关联表
      db.exec(`
        CREATE TABLE IF NOT EXISTS prompt_tags (
          prompt_id TEXT,
          tag_id TEXT,
          PRIMARY KEY (prompt_id, tag_id),
          FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );
      `);

      // 创建版本历史表
      db.exec(`
        CREATE TABLE IF NOT EXISTS prompt_versions (
          id TEXT PRIMARY KEY,
          prompt_id TEXT NOT NULL,
          version_number INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          change_description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
        );
      `);

      // 创建使用统计表
      db.exec(`
        CREATE TABLE IF NOT EXISTS usage_stats (
          id TEXT PRIMARY KEY,
          prompt_id TEXT NOT NULL,
          used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          context TEXT,
          FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
        );
      `);

      // 创建数据库元信息表
      db.exec(`
        CREATE TABLE IF NOT EXISTS db_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 创建索引
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category_id);
        CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at);
        CREATE INDEX IF NOT EXISTS idx_prompts_updated_at ON prompts(updated_at);
        CREATE INDEX IF NOT EXISTS idx_prompts_rating ON prompts(rating);
        CREATE INDEX IF NOT EXISTS idx_prompts_is_favorite ON prompts(is_favorite);
        CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
        CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(order_index);
        CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
        CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count);
        CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt ON prompt_versions(prompt_id);
        CREATE INDEX IF NOT EXISTS idx_usage_stats_prompt ON usage_stats(prompt_id);
        CREATE INDEX IF NOT EXISTS idx_usage_stats_used_at ON usage_stats(used_at);
      `);

      // 设置数据库版本
      db.prepare(
        "INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)"
      ).run("version", "1");
    },
  },
  {
    version: 2,
    description: "Add extended fields to prompts table",
    up: (db: Database.Database) => {
      // 添加新字段到prompts表
      try {
        db.exec(`
          ALTER TABLE prompts ADD COLUMN version TEXT DEFAULT 'v1.0';
        `);
      } catch (error) {
        // 字段可能已存在，忽略错误
        console.log("version字段可能已存在");
      }

      try {
        db.exec(`
          ALTER TABLE prompts ADD COLUMN instructions TEXT;
        `);
      } catch (error) {
        console.log("instructions字段可能已存在");
      }

      try {
        db.exec(`
          ALTER TABLE prompts ADD COLUMN notes TEXT;
        `);
      } catch (error) {
        console.log("notes字段可能已存在");
      }

      try {
        db.exec(`
          ALTER TABLE prompts ADD COLUMN variables TEXT;
        `);
      } catch (error) {
        console.log("variables字段可能已存在");
      }

      // 更新数据库版本
      db.prepare(
        "INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)"
      ).run("version", "2");
    },
    down: (db: Database.Database) => {
      // SQLite不支持DROP COLUMN，所以这里只是记录
      console.log("SQLite不支持删除列，需要重建表来回滚");
    },
  },
  {
    version: 3,
    description: "Add prompt results table for effect demonstration",
    up: (db: Database.Database) => {
      // 创建效果记录表
      db.exec(`
        CREATE TABLE IF NOT EXISTS prompt_results (
          id TEXT PRIMARY KEY,
          prompt_id TEXT NOT NULL,
          input_variables TEXT,
          generated_content TEXT NOT NULL,
          result_type TEXT DEFAULT 'text',
          result_data TEXT,
          rating INTEGER DEFAULT 0,
          feedback TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
        );
      `);

      // 创建效果评价表
      db.exec(`
        CREATE TABLE IF NOT EXISTS result_ratings (
          id TEXT PRIMARY KEY,
          result_id TEXT NOT NULL,
          rating_type TEXT NOT NULL,
          rating_value INTEGER NOT NULL,
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (result_id) REFERENCES prompt_results(id) ON DELETE CASCADE
        );
      `);

      // 创建索引
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_prompt_results_prompt ON prompt_results(prompt_id);
        CREATE INDEX IF NOT EXISTS idx_prompt_results_created_at ON prompt_results(created_at);
        CREATE INDEX IF NOT EXISTS idx_prompt_results_rating ON prompt_results(rating);
        CREATE INDEX IF NOT EXISTS idx_result_ratings_result ON result_ratings(result_id);
        CREATE INDEX IF NOT EXISTS idx_result_ratings_type ON result_ratings(rating_type);
      `);

      // 更新数据库版本
      db.prepare(
        "INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)"
      ).run("version", "3");
    },
    down: (db: Database.Database) => {
      // 删除效果相关表
      db.exec("DROP TABLE IF EXISTS result_ratings;");
      db.exec("DROP TABLE IF EXISTS prompt_results;");
      console.log("已删除效果记录相关表");
    },
  },
  {
    version: 4,
    description: "Add knowledge base tables",
    up: (db: Database.Database) => {
      // 创建知识库条目表
      db.exec(`
        CREATE TABLE IF NOT EXISTS knowledge_base (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          type TEXT DEFAULT 'concept',
          description TEXT,
          tags TEXT,
          usage_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 创建知识库条目标签关联表
      db.exec(`
        CREATE TABLE IF NOT EXISTS knowledge_base_tags (
          knowledge_id TEXT,
          tag_id TEXT,
          PRIMARY KEY (knowledge_id, tag_id),
          FOREIGN KEY (knowledge_id) REFERENCES knowledge_base(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );
      `);

      // 创建知识库引用表（记录知识库条目在提示词中的使用）
      db.exec(`
        CREATE TABLE IF NOT EXISTS knowledge_base_references (
          id TEXT PRIMARY KEY,
          knowledge_id TEXT NOT NULL,
          prompt_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (knowledge_id) REFERENCES knowledge_base(id) ON DELETE CASCADE,
          FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
        );
      `);

      // 创建索引
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_base_type ON knowledge_base(type);
        CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at ON knowledge_base(created_at);
        CREATE INDEX IF NOT EXISTS idx_knowledge_base_updated_at ON knowledge_base(updated_at);
        CREATE INDEX IF NOT EXISTS idx_knowledge_base_usage_count ON knowledge_base(usage_count);
        CREATE INDEX IF NOT EXISTS idx_knowledge_base_references_knowledge ON knowledge_base_references(knowledge_id);
        CREATE INDEX IF NOT EXISTS idx_knowledge_base_references_prompt ON knowledge_base_references(prompt_id);
      `);

      // 更新数据库版本
      db.prepare(
        "INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)"
      ).run("version", "4");
    },
    down: (db: Database.Database) => {
      // 删除知识库相关表
      db.exec("DROP TABLE IF EXISTS knowledge_base_references;");
      db.exec("DROP TABLE IF EXISTS knowledge_base_tags;");
      db.exec("DROP TABLE IF EXISTS knowledge_base;");
      console.log("已删除知识库相关表");
    },
  },
  {
    version: 5,
    description: "Modify prompt_results table to make generated_content nullable",
    up: (db: Database.Database) => {
      // SQLite不支持直接修改列约束，需要重建表
      
      // 1. 创建新的临时表
      db.exec(`
        CREATE TABLE prompt_results_new (
          id TEXT PRIMARY KEY,
          prompt_id TEXT NOT NULL,
          input_variables TEXT,
          generated_content TEXT,
          result_type TEXT DEFAULT 'text',
          result_data TEXT,
          rating INTEGER DEFAULT 0,
          feedback TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
        );
      `);

      // 2. 复制现有数据
      db.exec(`
        INSERT INTO prompt_results_new 
        SELECT * FROM prompt_results;
      `);

      // 3. 删除旧表
      db.exec(`DROP TABLE prompt_results;`);

      // 4. 重命名新表
      db.exec(`ALTER TABLE prompt_results_new RENAME TO prompt_results;`);

      // 5. 重新创建索引
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_prompt_results_prompt ON prompt_results(prompt_id);
        CREATE INDEX IF NOT EXISTS idx_prompt_results_created_at ON prompt_results(created_at);
        CREATE INDEX IF NOT EXISTS idx_prompt_results_rating ON prompt_results(rating);
      `);

      // 更新数据库版本
      db.prepare(
        "INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)"
      ).run("version", "5");
    },
    down: (db: Database.Database) => {
      // 回滚：重新创建带NOT NULL约束的表
      db.exec(`
        CREATE TABLE prompt_results_old (
          id TEXT PRIMARY KEY,
          prompt_id TEXT NOT NULL,
          input_variables TEXT,
          generated_content TEXT NOT NULL,
          result_type TEXT DEFAULT 'text',
          result_data TEXT,
          rating INTEGER DEFAULT 0,
          feedback TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
        );
      `);

      db.exec(`
        INSERT INTO prompt_results_old 
        SELECT * FROM prompt_results WHERE generated_content IS NOT NULL;
      `);

      db.exec(`DROP TABLE prompt_results;`);
      db.exec(`ALTER TABLE prompt_results_old RENAME TO prompt_results;`);

      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_prompt_results_prompt ON prompt_results(prompt_id);
        CREATE INDEX IF NOT EXISTS idx_prompt_results_created_at ON prompt_results(created_at);
        CREATE INDEX IF NOT EXISTS idx_prompt_results_rating ON prompt_results(rating);
      `);

      console.log("已回滚prompt_results表结构");
    },
  },
  {
    version: 6,
    description: "Add title field to prompt_results table",
    up: (db: Database.Database) => {
      // 添加title字段到prompt_results表
      try {
        db.exec(`
          ALTER TABLE prompt_results ADD COLUMN title TEXT;
        `);
        console.log("已添加title字段到prompt_results表");
      } catch (error) {
        console.log("title字段可能已存在，跳过添加");
      }

      // 更新数据库版本
      db.prepare(
        "INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)"
      ).run("version", "6");
    },
    down: (db: Database.Database) => {
      // SQLite不支持DROP COLUMN，需要重建表来回滚
      console.log("SQLite不支持删除列，需要重建表来回滚title字段");
    },
  },
  {
    version: 7,
    description: "Add user_id fields for data isolation",
    up: (db: Database.Database) => {
      console.log("开始添加用户数据隔离字段...");
      
      // 1. 为prompts表添加user_id字段
      try {
        db.exec(`ALTER TABLE prompts ADD COLUMN user_id TEXT DEFAULT 'default_user';`);
        console.log("已为prompts表添加user_id字段");
      } catch (error) {
        console.log("prompts表的user_id字段可能已存在");
      }

      // 2. 为categories表添加user_id字段
      try {
        db.exec(`ALTER TABLE categories ADD COLUMN user_id TEXT DEFAULT 'default_user';`);
        console.log("已为categories表添加user_id字段");
      } catch (error) {
        console.log("categories表的user_id字段可能已存在");
      }

      // 3. 为tags表添加user_id字段
      try {
        db.exec(`ALTER TABLE tags ADD COLUMN user_id TEXT DEFAULT 'default_user';`);
        console.log("已为tags表添加user_id字段");
      } catch (error) {
        console.log("tags表的user_id字段可能已存在");
      }

      // 4. 为knowledge_base表添加user_id字段
      try {
        db.exec(`ALTER TABLE knowledge_base ADD COLUMN user_id TEXT DEFAULT 'default_user';`);
        console.log("已为knowledge_base表添加user_id字段");
      } catch (error) {
        console.log("knowledge_base表的user_id字段可能已存在");
      }

      // 5. 为prompt_results表添加user_id字段
      try {
        db.exec(`ALTER TABLE prompt_results ADD COLUMN user_id TEXT DEFAULT 'default_user';`);
        console.log("已为prompt_results表添加user_id字段");
      } catch (error) {
        console.log("prompt_results表的user_id字段可能已存在");
      }

      // 6. 为prompt_versions表添加user_id字段
      try {
        db.exec(`ALTER TABLE prompt_versions ADD COLUMN user_id TEXT DEFAULT 'default_user';`);
        console.log("已为prompt_versions表添加user_id字段");
      } catch (error) {
        console.log("prompt_versions表的user_id字段可能已存在");
      }

      // 7. 为usage_stats表添加user_id字段
      try {
        db.exec(`ALTER TABLE usage_stats ADD COLUMN user_id TEXT DEFAULT 'default_user';`);
        console.log("已为usage_stats表添加user_id字段");
      } catch (error) {
        console.log("usage_stats表的user_id字段可能已存在");
      }

      // 8. 创建用户相关的索引
      try {
        db.exec(`
          CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
          CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
          CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
          CREATE INDEX IF NOT EXISTS idx_knowledge_base_user_id ON knowledge_base(user_id);
          CREATE INDEX IF NOT EXISTS idx_prompt_results_user_id ON prompt_results(user_id);
          CREATE INDEX IF NOT EXISTS idx_prompt_versions_user_id ON prompt_versions(user_id);
          CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON usage_stats(user_id);
        `);
        console.log("已创建用户相关索引");
      } catch (error) {
        console.log("创建用户索引时出错:", error);
      }

      // 更新数据库版本
      db.prepare(
        "INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)"
      ).run("version", "7");
      
      console.log("用户数据隔离字段添加完成");
    },
    down: (db: Database.Database) => {
      console.log("SQLite不支持删除列，需要重建表来回滚用户隔离字段");
    },
  },
  {
    version: 8,
    description: "Add prompt sharing functionality",
    up: (db: Database.Database) => {
      console.log("开始添加提示词共享功能字段...");

      // 1. 为prompts表添加共享相关字段
      try {
        db.exec(`ALTER TABLE prompts ADD COLUMN is_shared BOOLEAN DEFAULT FALSE;`);
        console.log("已为prompts表添加is_shared字段");
      } catch (error) {
        console.log("prompts表的is_shared字段可能已存在");
      }

      try {
        db.exec(`ALTER TABLE prompts ADD COLUMN shared_at DATETIME;`);
        console.log("已为prompts表添加shared_at字段");
      } catch (error) {
        console.log("prompts表的shared_at字段可能已存在");
      }

      try {
        db.exec(`ALTER TABLE prompts ADD COLUMN share_description TEXT;`);
        console.log("已为prompts表添加share_description字段");
      } catch (error) {
        console.log("prompts表的share_description字段可能已存在");
      }

      try {
        db.exec(`ALTER TABLE prompts ADD COLUMN share_count INTEGER DEFAULT 0;`);
        console.log("已为prompts表添加share_count字段");
      } catch (error) {
        console.log("prompts表的share_count字段可能已存在");
      }

      try {
        db.exec(`ALTER TABLE prompts ADD COLUMN like_count INTEGER DEFAULT 0;`);
        console.log("已为prompts表添加like_count字段");
      } catch (error) {
        console.log("prompts表的like_count字段可能已存在");
      }

      // 2. 创建共享相关的索引
      try {
        db.exec(`
          CREATE INDEX IF NOT EXISTS idx_prompts_is_shared ON prompts(is_shared);
          CREATE INDEX IF NOT EXISTS idx_prompts_shared_at ON prompts(shared_at);
          CREATE INDEX IF NOT EXISTS idx_prompts_share_count ON prompts(share_count);
          CREATE INDEX IF NOT EXISTS idx_prompts_like_count ON prompts(like_count);
        `);
        console.log("已创建共享相关索引");
      } catch (error) {
        console.log("创建共享索引时出错:", error);
      }

      // 3. 创建用户点赞表
      try {
        db.exec(`
          CREATE TABLE IF NOT EXISTS prompt_likes (
            id TEXT PRIMARY KEY,
            prompt_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(prompt_id, user_id),
            FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
          );
        `);
        console.log("已创建prompt_likes表");
      } catch (error) {
        console.log("prompt_likes表可能已存在");
      }

      // 4. 创建用户收藏共享提示词表
      try {
        db.exec(`
          CREATE TABLE IF NOT EXISTS shared_prompt_favorites (
            id TEXT PRIMARY KEY,
            prompt_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(prompt_id, user_id),
            FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
          );
        `);
        console.log("已创建shared_prompt_favorites表");
      } catch (error) {
        console.log("shared_prompt_favorites表可能已存在");
      }

      // 5. 创建相关索引
      try {
        db.exec(`
          CREATE INDEX IF NOT EXISTS idx_prompt_likes_prompt_id ON prompt_likes(prompt_id);
          CREATE INDEX IF NOT EXISTS idx_prompt_likes_user_id ON prompt_likes(user_id);
          CREATE INDEX IF NOT EXISTS idx_shared_favorites_prompt_id ON shared_prompt_favorites(prompt_id);
          CREATE INDEX IF NOT EXISTS idx_shared_favorites_user_id ON shared_prompt_favorites(user_id);
        `);
        console.log("已创建点赞和收藏索引");
      } catch (error) {
        console.log("创建点赞和收藏索引时出错:", error);
      }

      // 更新数据库版本
      db.prepare(
        "INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)"
      ).run("version", "8");
      
      console.log("提示词共享功能字段添加完成");
    },
    down: (db: Database.Database) => {
      console.log("SQLite不支持删除列，需要重建表来回滚共享功能字段");
    },
  },
];

// 数据库初始化函数
export async function initializeDatabase(): Promise<Database.Database> {
  if (db) return db;

  try {
    // 确保数据目录存在
    const dataDir = path.dirname(DB_CONFIG.path);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 创建数据库连接
    db = new Database(DB_CONFIG.path, DB_CONFIG.options);

    // 设置PRAGMA选项
    Object.entries(DB_CONFIG.pragmas).forEach(([key, value]) => {
      db!.pragma(`${key} = ${value}`);
    });

    // 启用外键约束
    db.pragma("foreign_keys = ON");

    // 运行迁移
    await runMigrations(db);

    // 设置优雅关闭
    setupGracefulShutdown(db);

    console.log("SQLite数据库初始化成功");
    return db;
  } catch (error) {
    console.error("SQLite数据库初始化失败:", error);
    throw error;
  }
}

// 获取数据库连接
export async function getDbConnection(): Promise<Database.Database> {
  if (db) return db;
  return await initializeDatabase();
}

// 运行数据库迁移
async function runMigrations(database: Database.Database): Promise<void> {
  try {
    // 获取当前数据库版本
    let currentVersion = 0;
    try {
      const versionRow = database
        .prepare("SELECT value FROM db_meta WHERE key = ?")
        .get("version") as { value: string } | undefined;
      if (versionRow) {
        currentVersion = parseInt(versionRow.value, 10);
      }
    } catch {
      // 如果表不存在，版本为0
      console.log("数据库元信息表不存在，将创建新的数据库");
    }

    // 运行需要的迁移
    const pendingMigrations = migrations.filter(
      (m) => m.version > currentVersion
    );

    if (pendingMigrations.length === 0) {
      console.log(`数据库已是最新版本 (v${currentVersion})`);
      return;
    }

    console.log(`运行 ${pendingMigrations.length} 个数据库迁移...`);

    // 在事务中运行迁移
    const runMigration = database.transaction((migration: Migration) => {
      console.log(`运行迁移 v${migration.version}: ${migration.description}`);
      migration.up(database);
      database
        .prepare("INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)")
        .run("version", migration.version.toString());
    });

    for (const migration of pendingMigrations) {
      runMigration(migration);
    }

    console.log(`数据库迁移完成，当前版本: v${DATABASE_VERSION}`);
  } catch (error) {
    console.error("数据库迁移失败:", error);
    throw error;
  }
}

// 数据库备份
export async function backupDatabase(backupPath?: string): Promise<string> {
  const database = await getDbConnection();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const defaultBackupPath = path.join(
    process.cwd(),
    "data",
    "backups",
    `backup-${timestamp}.db`
  );
  const finalBackupPath = backupPath || defaultBackupPath;

  // 确保备份目录存在
  const backupDir = path.dirname(finalBackupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    await database.backup(finalBackupPath);
    console.log(`数据库备份成功: ${finalBackupPath}`);
    return finalBackupPath;
  } catch (error) {
    console.error("数据库备份失败:", error);
    throw error;
  }
}

// 数据库恢复
export async function restoreDatabase(backupPath: string): Promise<void> {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`备份文件不存在: ${backupPath}`);
  }

  try {
    // 关闭当前连接
    if (db) {
      db.close();
      db = null;
    }

    // 复制备份文件到当前数据库位置
    fs.copyFileSync(backupPath, DB_CONFIG.path);

    // 重新初始化数据库
    await initializeDatabase();
    console.log(`数据库恢复成功: ${backupPath}`);
  } catch (error) {
    console.error("数据库恢复失败:", error);
    throw error;
  }
}

// 获取数据库统计信息
export async function getDatabaseStats(): Promise<{
  tables: Record<string, number>;
  size: number;
  version: number;
}> {
  const database = await getDbConnection();

  try {
    // 获取表行数
    const tables: Record<string, number> = {};
    const tableNames = [
      "prompts",
      "categories",
      "tags",
      "prompt_tags",
      "prompt_versions",
      "usage_stats",
    ];

    for (const tableName of tableNames) {
      const result = database
        .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
        .get() as { count: number };
      tables[tableName] = result.count;
    }

    // 获取数据库文件大小
    const stats = fs.statSync(DB_CONFIG.path);
    const size = stats.size;

    // 获取数据库版本
    const versionRow = database
      .prepare("SELECT value FROM db_meta WHERE key = ?")
      .get("version") as { value: string } | undefined;
    const version = versionRow ? parseInt(versionRow.value, 10) : 0;

    return { tables, size, version };
  } catch (error) {
    console.error("获取数据库统计信息失败:", error);
    throw error;
  }
}

// 优雅关闭数据库
function setupGracefulShutdown(database: Database.Database): void {
  const closeDatabase = () => {
    if (database && database.open) {
      console.log("正在关闭数据库连接...");
      database.close();
      console.log("数据库连接已关闭");
    }
  };

  // 监听进程退出事件
  process.on("exit", closeDatabase);
  process.on("SIGINT", () => {
    closeDatabase();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    closeDatabase();
    process.exit(0);
  });
  process.on("SIGHUP", () => {
    closeDatabase();
    process.exit(0);
  });
}

// 事务辅助函数
export function createTransaction<T extends unknown[], R>(
  fn: (...args: T) => R
): (...args: T) => R {
  return (...args: T): R => {
    const database = db;
    if (!database) {
      throw new Error("数据库未初始化");
    }

    const transaction = database.transaction(fn);
    return transaction(...args);
  };
}

// 导出数据库实例（用于高级操作）
export async function getDatabaseInstance(): Promise<Database.Database> {
  return await getDbConnection();
}
