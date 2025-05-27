import { sql } from '@vercel/postgres';

// 数据库连接配置
export const db = {
  // 用户相关操作
  users: {
    async findById(id: number) {
      const { rows } = await sql`SELECT * FROM users WHERE id = ${id}`;
      return rows[0] || null;
    },

    async findByUsername(username: string) {
      const { rows } = await sql`SELECT * FROM users WHERE username = ${username}`;
      return rows[0] || null;
    },

    async create(user: any) {
      const { rows } = await sql`
        INSERT INTO users (username, email, display_name, bio, role)
        VALUES (${user.username}, ${user.email}, ${user.display_name}, ${user.bio}, ${user.role || 'user'})
        RETURNING *
      `;
      return rows[0];
    },

    async update(id: number, updates: any) {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = [id, ...Object.values(updates)];
      const { rows } = await sql.query(
        `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        values
      );
      return rows[0];
    }
  },

  // 提示词相关操作
  prompts: {
    async findAll(userId?: number) {
      if (userId) {
        const { rows } = await sql`
          SELECT p.*, c.name as category_name, c.color as category_color
          FROM prompts p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.user_id = ${userId}
          ORDER BY p.created_at DESC
        `;
        return rows;
      } else {
        const { rows } = await sql`
          SELECT p.*, c.name as category_name, c.color as category_color
          FROM prompts p
          LEFT JOIN categories c ON p.category_id = c.id
          ORDER BY p.created_at DESC
        `;
        return rows;
      }
    },

    async findById(id: number) {
      const { rows } = await sql`
        SELECT p.*, c.name as category_name, c.color as category_color
        FROM prompts p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ${id}
      `;
      return rows[0] || null;
    },

    async create(prompt: any) {
      const { rows } = await sql`
        INSERT INTO prompts (title, content, description, category_id, user_id, is_favorite, rating)
        VALUES (${prompt.title}, ${prompt.content}, ${prompt.description}, ${prompt.category_id}, ${prompt.user_id}, ${prompt.is_favorite || false}, ${prompt.rating || 0})
        RETURNING *
      `;
      return rows[0];
    },

    async update(id: number, updates: any) {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = [id, ...Object.values(updates)];
      const { rows } = await sql.query(
        `UPDATE prompts SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        values
      );
      return rows[0];
    },

    async delete(id: number) {
      const { rows } = await sql`DELETE FROM prompts WHERE id = ${id} RETURNING *`;
      return rows[0];
    }
  },

  // 分类相关操作
  categories: {
    async findAll(userId?: number) {
      if (userId) {
        const { rows } = await sql`
          SELECT * FROM categories 
          WHERE user_id = ${userId}
          ORDER BY name ASC
        `;
        return rows;
      } else {
        const { rows } = await sql`SELECT * FROM categories ORDER BY name ASC`;
        return rows;
      }
    },

    async findById(id: number) {
      const { rows } = await sql`SELECT * FROM categories WHERE id = ${id}`;
      return rows[0] || null;
    },

    async create(category: any) {
      const { rows } = await sql`
        INSERT INTO categories (name, color, parent_id, user_id)
        VALUES (${category.name}, ${category.color}, ${category.parent_id}, ${category.user_id})
        RETURNING *
      `;
      return rows[0];
    },

    async update(id: number, updates: any) {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = [id, ...Object.values(updates)];
      const { rows } = await sql.query(
        `UPDATE categories SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        values
      );
      return rows[0];
    },

    async delete(id: number) {
      const { rows } = await sql`DELETE FROM categories WHERE id = ${id} RETURNING *`;
      return rows[0];
    }
  },

  // 标签相关操作
  tags: {
    async findAll(userId?: number) {
      if (userId) {
        const { rows } = await sql`
          SELECT * FROM tags 
          WHERE user_id = ${userId}
          ORDER BY name ASC
        `;
        return rows;
      } else {
        const { rows } = await sql`SELECT * FROM tags ORDER BY name ASC`;
        return rows;
      }
    },

    async create(tag: any) {
      const { rows } = await sql`
        INSERT INTO tags (name, color, user_id)
        VALUES (${tag.name}, ${tag.color}, ${tag.user_id})
        RETURNING *
      `;
      return rows[0];
    }
  },

  // 知识库相关操作
  knowledge: {
    async findAll(userId?: number) {
      if (userId) {
        const { rows } = await sql`
          SELECT * FROM knowledge_base 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `;
        return rows;
      } else {
        const { rows } = await sql`SELECT * FROM knowledge_base ORDER BY created_at DESC`;
        return rows;
      }
    },

    async create(knowledge: any) {
      const { rows } = await sql`
        INSERT INTO knowledge_base (title, content, type, category, tags, user_id)
        VALUES (${knowledge.title}, ${knowledge.content}, ${knowledge.type}, ${knowledge.category}, ${knowledge.tags}, ${knowledge.user_id})
        RETURNING *
      `;
      return rows[0];
    }
  }
};

// 原始SQL查询接口
export { sql };

// 数据库初始化函数
export async function initializeDatabase() {
  try {
    // 检查数据库连接
    await sql`SELECT 1`;
    console.log('数据库连接成功');
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
} 