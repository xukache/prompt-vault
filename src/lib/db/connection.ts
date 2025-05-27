import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

export async function getDbConnection(): Promise<Database.Database> {
  if (db) {
    return db;
  }

  // 确保数据目录存在
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 数据库文件路径
  const dbPath = path.join(dataDir, "prompts.db");

  // 创建数据库连接
  db = new Database(dbPath);

  // 启用WAL模式以提高性能
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("cache_size = 1000000");
  db.pragma("foreign_keys = ON");

  // 初始化数据库表
  await initializeTables(db);

  return db;
}

async function initializeTables(db: Database.Database) {
  // 创建提示词表
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      category_id TEXT,
      rating INTEGER DEFAULT 0,
      is_favorite BOOLEAN DEFAULT FALSE,
      version TEXT DEFAULT '1.0',
      instructions TEXT,
      notes TEXT,
      variables TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 检查并添加缺失的列
  try {
    // 检查version列是否存在
    const columns = db
      .prepare("PRAGMA table_info(prompts)")
      .all() as ColumnInfo[];

    const versionColumn = columns.find((col) => col.name === "version");
    if (!versionColumn) {
      db.exec("ALTER TABLE prompts ADD COLUMN version TEXT DEFAULT '1.0'");
    }

    // 检查instructions列是否存在
    const instructionsColumn = columns.find(
      (col) => col.name === "instructions"
    );
    if (!instructionsColumn) {
      db.exec("ALTER TABLE prompts ADD COLUMN instructions TEXT");
    }

    // 检查notes列是否存在
    const notesColumn = columns.find((col) => col.name === "notes");
    if (!notesColumn) {
      db.exec("ALTER TABLE prompts ADD COLUMN notes TEXT");
    }

    // 检查variables列是否存在
    const variablesColumn = columns.find((col) => col.name === "variables");
    if (!variablesColumn) {
      db.exec("ALTER TABLE prompts ADD COLUMN variables TEXT");
    }
  } catch (error) {
    console.log("添加列时出现错误（可能列已存在）:", error);
  }

  // 创建分类表
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT DEFAULT '#6366f1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建标签表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#10b981',
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建提示词标签关联表（使用tag_id）
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompt_tags (
      prompt_id TEXT,
      tag_id TEXT,
      PRIMARY KEY (prompt_id, tag_id),
      FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
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
    )
  `);

  // 创建变量定义表
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompt_variables (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('text', 'number', 'select', 'textarea')),
      default_value TEXT,
      description TEXT,
      options TEXT, -- JSON array for select type
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
    )
  `);

  // 创建索引以提高查询性能
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category_id);
    CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at);
    CREATE INDEX IF NOT EXISTS idx_prompts_updated_at ON prompts(updated_at);
    CREATE INDEX IF NOT EXISTS idx_prompt_tags_prompt_id ON prompt_tags(prompt_id);
    CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag_id ON prompt_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
    CREATE INDEX IF NOT EXISTS idx_prompt_versions_version_number ON prompt_versions(version_number);
    CREATE INDEX IF NOT EXISTS idx_prompt_variables_prompt_id ON prompt_variables(prompt_id);
  `);

  // 插入默认分类（如果不存在）
  const defaultCategories = [
    {
      id: "cat_general",
      name: "通用",
      description: "通用提示词",
      color: "#6366f1",
    },
    {
      id: "cat_writing",
      name: "写作",
      description: "写作相关提示词",
      color: "#8b5cf6",
    },
    {
      id: "cat_coding",
      name: "编程",
      description: "编程相关提示词",
      color: "#06b6d4",
    },
    {
      id: "cat_analysis",
      name: "分析",
      description: "分析相关提示词",
      color: "#10b981",
    },
    {
      id: "cat_creative",
      name: "创意",
      description: "创意相关提示词",
      color: "#f59e0b",
    },
  ];

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (id, name, description, color)
    VALUES (?, ?, ?, ?)
  `);

  defaultCategories.forEach((category) => {
    insertCategory.run(
      category.id,
      category.name,
      category.description,
      category.color
    );
  });

  // 插入默认标签（如果不存在）
  const defaultTags = [
    { id: "tag-ai", name: "AI", color: "#6366f1" },
    { id: "tag-chatgpt", name: "ChatGPT", color: "#10b981" },
    { id: "tag-productivity", name: "效率", color: "#f59e0b" },
    { id: "tag-business", name: "商务", color: "#ef4444" },
    { id: "tag-education", name: "教育", color: "#8b5cf6" },
  ];

  const insertTag = db.prepare(`
    INSERT OR IGNORE INTO tags (id, name, color)
    VALUES (?, ?, ?)
  `);

  defaultTags.forEach((tag) => {
    insertTag.run(tag.id, tag.name, tag.color);
  });
}

// 关闭数据库连接
export function closeDbConnection() {
  if (db) {
    db.close();
    db = null;
  }
}
