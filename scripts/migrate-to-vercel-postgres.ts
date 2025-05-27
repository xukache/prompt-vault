import { sql } from '@vercel/postgres';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

interface UserRow {
  username: string;
  email: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface CategoryRow {
  name: string;
  color: string;
  parent_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TagRow {
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

interface PromptRow {
  title: string;
  content: string;
  description: string;
  category_id: string;
  user_id: string;
  is_favorite: number;
  rating: number;
  is_shared: number;
  share_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

async function migrateToVercelPostgres() {
  try {
    console.log('开始迁移数据到Vercel Postgres...');

    // 1. 创建表结构
    console.log('创建表结构...');

    // 用户表
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255),
        bio TEXT,
        avatar_url VARCHAR(500),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 分类表
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(7) DEFAULT '#3B82F6',
        parent_id INTEGER REFERENCES categories(id),
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 标签表
    await sql`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(7) DEFAULT '#10B981',
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 提示词表
    await sql`
      CREATE TABLE IF NOT EXISTS prompts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES categories(id),
        user_id INTEGER REFERENCES users(id),
        is_favorite BOOLEAN DEFAULT FALSE,
        rating INTEGER DEFAULT 0,
        is_shared BOOLEAN DEFAULT FALSE,
        share_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 提示词标签关联表
    await sql`
      CREATE TABLE IF NOT EXISTS prompt_tags (
        id SERIAL PRIMARY KEY,
        prompt_id INTEGER REFERENCES prompts(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        UNIQUE(prompt_id, tag_id)
      )
    `;

    // 知识库表
    await sql`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'general',
        category VARCHAR(100),
        tags TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 提示词结果表
    await sql`
      CREATE TABLE IF NOT EXISTS prompt_results (
        id SERIAL PRIMARY KEY,
        prompt_id INTEGER REFERENCES prompts(id) ON DELETE CASCADE,
        input_variables TEXT,
        result_content TEXT,
        result_type VARCHAR(50) DEFAULT 'text',
        rating INTEGER DEFAULT 0,
        notes TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 提示词版本表
    await sql`
      CREATE TABLE IF NOT EXISTS prompt_versions (
        id SERIAL PRIMARY KEY,
        prompt_id INTEGER REFERENCES prompts(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        change_description TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 使用统计表
    await sql`
      CREATE TABLE IF NOT EXISTS usage_stats (
        id SERIAL PRIMARY KEY,
        prompt_id INTEGER REFERENCES prompts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('表结构创建完成！');

    // 2. 迁移数据（如果有SQLite数据）
    const sqliteDbPath = path.join(process.cwd(), 'data', 'prompts.db');
    if (fs.existsSync(sqliteDbPath)) {
      console.log('发现SQLite数据库，开始迁移数据...');

      const db = new Database(sqliteDbPath);

      // 迁移用户数据
      const users = db.prepare('SELECT * FROM users').all() as UserRow[];
      for (const user of users) {
        await sql`
          INSERT INTO users (username, email, display_name, bio, avatar_url, role, created_at, updated_at)
          VALUES (${user.username}, ${user.email}, ${user.display_name}, ${user.bio}, ${user.avatar_url}, ${user.role}, ${user.created_at}, ${user.updated_at})
          ON CONFLICT (username) DO NOTHING
        `;
      }
      console.log(`迁移了 ${users.length} 个用户`);

      // 迁移分类数据
      const categories = db.prepare('SELECT * FROM categories').all() as CategoryRow[];
      for (const category of categories) {
        await sql`
          INSERT INTO categories (name, color, parent_id, user_id, created_at, updated_at)
          VALUES (${category.name}, ${category.color}, ${category.parent_id}, ${category.user_id}, ${category.created_at}, ${category.updated_at})
        `;
      }
      console.log(`迁移了 ${categories.length} 个分类`);

      // 迁移标签数据
      const tags = db.prepare('SELECT * FROM tags').all() as TagRow[];
      for (const tag of tags) {
        await sql`
          INSERT INTO tags (name, color, user_id, created_at)
          VALUES (${tag.name}, ${tag.color}, ${tag.user_id}, ${tag.created_at})
        `;
      }
      console.log(`迁移了 ${tags.length} 个标签`);

      // 迁移提示词数据
      const prompts = db.prepare('SELECT * FROM prompts').all() as PromptRow[];
      for (const prompt of prompts) {
        await sql`
          INSERT INTO prompts (title, content, description, category_id, user_id, is_favorite, rating, is_shared, share_count, like_count, created_at, updated_at)
          VALUES (${prompt.title}, ${prompt.content}, ${prompt.description}, ${prompt.category_id}, ${prompt.user_id}, ${prompt.is_favorite}, ${prompt.rating}, ${prompt.is_shared}, ${prompt.share_count}, ${prompt.like_count}, ${prompt.created_at}, ${prompt.updated_at})
        `;
      }
      console.log(`迁移了 ${prompts.length} 个提示词`);

      db.close();
    } else {
      console.log('未发现SQLite数据库，创建初始数据...');

      // 创建默认管理员用户
      await sql`
        INSERT INTO users (username, email, display_name, bio, role)
        VALUES ('admin', 'admin@promptvault.com', '系统管理员', 'PromptVault系统管理员账号', 'admin')
        ON CONFLICT (username) DO NOTHING
      `;

      // 创建默认分类
      await sql`
        INSERT INTO categories (name, color, user_id)
        VALUES
          ('通用提示词', '#3B82F6', 1),
          ('编程助手', '#10B981', 1),
          ('写作助手', '#F59E0B', 1),
          ('分析工具', '#EF4444', 1)
        ON CONFLICT DO NOTHING
      `;

      console.log('初始数据创建完成！');
    }

    console.log('数据迁移完成！');

  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateToVercelPostgres()
    .then(() => {
      console.log('迁移成功完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}

export default migrateToVercelPostgres;