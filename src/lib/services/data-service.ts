import {
  getDbConnection,
  backupDatabase,
  restoreDatabase,
  getDatabaseStats,
} from "@/lib/db/sqlite";
import {
  addDocumentToVectorStore,
  updateDocumentInVectorStore,
  deleteDocumentFromVectorStore,
  searchSimilarDocuments,
  getDatabaseStats as getVectorStats,
} from "@/lib/vector/orama";
import {
  clientStorage,
  offlineSyncManager,
} from "@/lib/storage/client-storage";

// 数据类型定义
export interface Prompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  category_id?: string;
  rating: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color: string;
  icon: string;
  order_index: number;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  usage_count: number;
  created_at: string;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  title: string;
  content: string;
  change_description?: string;
  created_at: string;
}

export interface UsageStats {
  id: string;
  prompt_id: string;
  used_at: string;
  context?: string;
}

// 数据服务类
export class DataService {
  private static instance: DataService;

  private constructor() {}

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // 提示词相关操作
  public async getPrompts(options?: {
    limit?: number;
    offset?: number;
    categoryId?: string;
    search?: string;
    sortBy?: "created_at" | "updated_at" | "title" | "rating";
    sortOrder?: "ASC" | "DESC";
  }): Promise<Prompt[]> {
    const db = await getDbConnection();

    let sql = "SELECT * FROM prompts";
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (options?.categoryId) {
      conditions.push("category_id = ?");
      params.push(options.categoryId);
    }

    if (options?.search) {
      conditions.push("(title LIKE ? OR content LIKE ? OR description LIKE ?)");
      params.push(
        `%${options.search}%`,
        `%${options.search}%`,
        `%${options.search}%`
      );
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    const sortBy = options?.sortBy || "updated_at";
    const sortOrder = options?.sortOrder || "DESC";
    sql += ` ORDER BY ${sortBy} ${sortOrder}`;

    if (options?.limit) {
      sql += " LIMIT ?";
      params.push(options.limit);

      if (options?.offset) {
        sql += " OFFSET ?";
        params.push(options.offset);
      }
    }

    return db.prepare(sql).all(...params) as Prompt[];
  }

  public async getPromptById(id: string): Promise<Prompt | null> {
    const db = await getDbConnection();
    const result = db.prepare("SELECT * FROM prompts WHERE id = ?").get(id) as
      | Prompt
      | undefined;
    return result || null;
  }

  public async createPrompt(
    prompt: Omit<Prompt, "id" | "created_at" | "updated_at">
  ): Promise<string> {
    const db = await getDbConnection();
    const id = `prompt_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date().toISOString();

    const newPrompt = {
      id,
      ...prompt,
      created_at: now,
      updated_at: now,
    };

    // 插入到SQLite
    db.prepare(
      `
      INSERT INTO prompts (id, title, content, description, category_id, rating, is_favorite, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      newPrompt.id,
      newPrompt.title,
      newPrompt.content,
      newPrompt.description || null,
      newPrompt.category_id || null,
      newPrompt.rating,
      newPrompt.is_favorite ? 1 : 0,
      newPrompt.created_at,
      newPrompt.updated_at
    );

    // 添加到向量数据库
    try {
      await addDocumentToVectorStore(id, newPrompt.content, {
        prompt_id: id,
        title: newPrompt.title,
        description: newPrompt.description,
        category: newPrompt.category_id,
      });
    } catch (error) {
      console.error("添加到向量数据库失败:", error);
    }

    // 添加到离线同步队列
    await offlineSyncManager.addToSyncQueue({
      type: "create",
      entity: "prompt",
      data: newPrompt,
      timestamp: Date.now(),
    });

    return id;
  }

  public async updatePrompt(
    id: string,
    updates: Partial<Omit<Prompt, "id" | "created_at">>
  ): Promise<void> {
    const db = await getDbConnection();
    const now = new Date().toISOString();

    const updateFields: string[] = [];
    const params: unknown[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "id" && key !== "created_at") {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    updateFields.push("updated_at = ?");
    params.push(now);
    params.push(id);

    const sql = `UPDATE prompts SET ${updateFields.join(", ")} WHERE id = ?`;
    db.prepare(sql).run(...params);

    // 更新向量数据库
    if (updates.content || updates.title || updates.description) {
      try {
        const prompt = await this.getPromptById(id);
        if (prompt) {
          await updateDocumentInVectorStore(id, prompt.content, {
            prompt_id: id,
            title: prompt.title,
            description: prompt.description,
            category: prompt.category_id,
          });
        }
      } catch (error) {
        console.error("更新向量数据库失败:", error);
      }
    }

    // 添加到离线同步队列
    await offlineSyncManager.addToSyncQueue({
      type: "update",
      entity: "prompt",
      data: { id, ...updates, updated_at: now },
      timestamp: Date.now(),
    });
  }

  public async deletePrompt(id: string): Promise<void> {
    const db = await getDbConnection();

    // 删除SQLite记录
    db.prepare("DELETE FROM prompts WHERE id = ?").run(id);

    // 删除向量数据库记录
    try {
      await deleteDocumentFromVectorStore(id);
    } catch (error) {
      console.error("删除向量数据库记录失败:", error);
    }

    // 添加到离线同步队列
    await offlineSyncManager.addToSyncQueue({
      type: "delete",
      entity: "prompt",
      data: { id },
      timestamp: Date.now(),
    });
  }

  // 分类相关操作
  public async getCategories(): Promise<Category[]> {
    const db = await getDbConnection();
    return db
      .prepare("SELECT * FROM categories ORDER BY order_index, name")
      .all() as Category[];
  }

  public async getCategoryById(id: string): Promise<Category | null> {
    const db = await getDbConnection();
    const result = db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(id) as Category | undefined;
    return result || null;
  }

  public async createCategory(
    category: Omit<Category, "id" | "created_at">
  ): Promise<string> {
    const db = await getDbConnection();
    const id = `category_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date().toISOString();

    db.prepare(
      `
      INSERT INTO categories (id, name, description, parent_id, color, icon, order_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      category.name,
      category.description || null,
      category.parent_id || null,
      category.color,
      category.icon,
      category.order_index,
      now
    );

    return id;
  }

  public async updateCategory(
    id: string,
    updates: Partial<Omit<Category, "id" | "created_at">>
  ): Promise<void> {
    const db = await getDbConnection();

    const updateFields: string[] = [];
    const params: unknown[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "id" && key !== "created_at") {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    params.push(id);
    const sql = `UPDATE categories SET ${updateFields.join(", ")} WHERE id = ?`;
    db.prepare(sql).run(...params);
  }

  public async deleteCategory(id: string): Promise<void> {
    const db = await getDbConnection();
    db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  }

  // 标签相关操作
  public async getTags(): Promise<Tag[]> {
    const db = await getDbConnection();
    return db
      .prepare("SELECT * FROM tags ORDER BY usage_count DESC, name")
      .all() as Tag[];
  }

  public async getTagById(id: string): Promise<Tag | null> {
    const db = await getDbConnection();
    const result = db.prepare("SELECT * FROM tags WHERE id = ?").get(id) as
      | Tag
      | undefined;
    return result || null;
  }

  public async createTag(
    tag: Omit<Tag, "id" | "created_at" | "usage_count">
  ): Promise<string> {
    const db = await getDbConnection();
    const id = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    db.prepare(
      `
      INSERT INTO tags (id, name, color, description, usage_count, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `
    ).run(id, tag.name, tag.color, tag.description || null, now);

    return id;
  }

  public async updateTag(
    id: string,
    updates: Partial<Omit<Tag, "id" | "created_at">>
  ): Promise<void> {
    const db = await getDbConnection();

    const updateFields: string[] = [];
    const params: unknown[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "id" && key !== "created_at") {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    params.push(id);
    const sql = `UPDATE tags SET ${updateFields.join(", ")} WHERE id = ?`;
    db.prepare(sql).run(...params);
  }

  public async deleteTag(id: string): Promise<void> {
    const db = await getDbConnection();
    db.prepare("DELETE FROM tags WHERE id = ?").run(id);
  }

  // 搜索功能
  public async searchPrompts(
    query: string,
    options?: {
      mode?: "fulltext" | "vector" | "hybrid";
      limit?: number;
      categoryId?: string;
      tags?: string[];
    }
  ): Promise<Prompt[]> {
    const mode = options?.mode || "hybrid";
    const limit = options?.limit || 20;

    if (mode === "fulltext") {
      // 使用SQLite全文搜索
      return this.getPrompts({
        search: query,
        limit,
        categoryId: options?.categoryId,
      });
    } else {
      // 使用向量搜索
      try {
        const vectorResults = await searchSimilarDocuments(query, limit, mode);
        const promptIds = vectorResults.map((result) => result.id);

        if (promptIds.length === 0) return [];

        const db = await getDbConnection();
        const placeholders = promptIds.map(() => "?").join(",");
        let sql = `SELECT * FROM prompts WHERE id IN (${placeholders})`;
        const params: unknown[] = [...promptIds];

        if (options?.categoryId) {
          sql += " AND category_id = ?";
          params.push(options.categoryId);
        }

        const prompts = db.prepare(sql).all(...params) as Prompt[];

        // 按向量搜索结果的顺序排序
        return promptIds
          .map((id) => prompts.find((p) => p.id === id))
          .filter(Boolean) as Prompt[];
      } catch (error) {
        console.error("向量搜索失败，降级到全文搜索:", error);
        return this.getPrompts({
          search: query,
          limit,
          categoryId: options?.categoryId,
        });
      }
    }
  }

  // 统计信息
  public async getStatistics(): Promise<{
    sqlite: {
      tables: Record<string, number>;
      size: number;
      version: number;
    };
    vector: {
      totalDocuments: number;
      isVectorSearchEnabled: boolean;
      isInitialized: boolean;
      lastUpdated: string;
    };
    storage: {
      localStorage: { used: number; available: number };
      indexedDB: { used: number; available: number };
    };
  }> {
    const [sqliteStats, vectorStats, storageUsage] = await Promise.all([
      getDatabaseStats(),
      getVectorStats(),
      clientStorage.getStorageUsage(),
    ]);

    return {
      sqlite: sqliteStats,
      vector: vectorStats,
      storage: storageUsage,
    };
  }

  // 数据备份和恢复
  public async createBackup(): Promise<string> {
    return await backupDatabase();
  }

  public async restoreFromBackup(backupPath: string): Promise<void> {
    await restoreDatabase(backupPath);
  }

  // 数据导出
  public async exportData(
    format: "json" | "csv" | "markdown" = "json"
  ): Promise<string> {
    const [prompts, categories, tags] = await Promise.all([
      this.getPrompts(),
      this.getCategories(),
      this.getTags(),
    ]);

    const data = {
      prompts,
      categories,
      tags,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    switch (format) {
      case "json":
        return JSON.stringify(data, null, 2);

      case "csv":
        // 简化的CSV导出，只导出提示词
        const csvHeaders = [
          "ID",
          "Title",
          "Content",
          "Description",
          "Category",
          "Rating",
          "Favorite",
          "Created",
          "Updated",
        ];
        const csvRows = prompts.map((p) => [
          p.id,
          `"${p.title.replace(/"/g, '""')}"`,
          `"${p.content.replace(/"/g, '""')}"`,
          `"${(p.description || "").replace(/"/g, '""')}"`,
          p.category_id || "",
          p.rating.toString(),
          p.is_favorite ? "true" : "false",
          p.created_at,
          p.updated_at,
        ]);
        return [
          csvHeaders.join(","),
          ...csvRows.map((row) => row.join(",")),
        ].join("\n");

      case "markdown":
        let markdown = "# PromptVault 数据导出\n\n";
        markdown += `导出时间: ${data.exportedAt}\n\n`;

        markdown += "## 提示词\n\n";
        prompts.forEach((p) => {
          markdown += `### ${p.title}\n\n`;
          markdown += `**描述**: ${p.description || "无"}\n\n`;
          markdown += `**分类**: ${p.category_id || "无"}\n\n`;
          markdown += `**评分**: ${p.rating}/5\n\n`;
          markdown += `**内容**:\n\n\`\`\`\n${p.content}\n\`\`\`\n\n`;
          markdown += "---\n\n";
        });

        return markdown;

      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  }

  // 数据导入
  public async importData(
    data: string,
    format: "json" = "json"
  ): Promise<{
    imported: { prompts: number; categories: number; tags: number };
    errors: string[];
  }> {
    const result = {
      imported: { prompts: 0, categories: 0, tags: 0 },
      errors: [] as string[],
    };

    try {
      if (format === "json") {
        const parsedData = JSON.parse(data);

        // 导入分类
        if (parsedData.categories && Array.isArray(parsedData.categories)) {
          for (const category of parsedData.categories) {
            try {
              await this.createCategory(category);
              result.imported.categories++;
            } catch (error) {
              result.errors.push(`导入分类失败: ${category.name} - ${error}`);
            }
          }
        }

        // 导入标签
        if (parsedData.tags && Array.isArray(parsedData.tags)) {
          for (const tag of parsedData.tags) {
            try {
              await this.createTag(tag);
              result.imported.tags++;
            } catch (error) {
              result.errors.push(`导入标签失败: ${tag.name} - ${error}`);
            }
          }
        }

        // 导入提示词
        if (parsedData.prompts && Array.isArray(parsedData.prompts)) {
          for (const prompt of parsedData.prompts) {
            try {
              await this.createPrompt(prompt);
              result.imported.prompts++;
            } catch (error) {
              result.errors.push(`导入提示词失败: ${prompt.title} - ${error}`);
            }
          }
        }
      }
    } catch (error) {
      result.errors.push(`数据解析失败: ${error}`);
    }

    return result;
  }

  // 清理数据
  public async cleanupData(): Promise<{
    deletedPrompts: number;
    deletedVersions: number;
    deletedStats: number;
  }> {
    const db = await getDbConnection();

    // 删除孤立的版本记录
    const deletedVersions = db
      .prepare(
        `
      DELETE FROM prompt_versions 
      WHERE prompt_id NOT IN (SELECT id FROM prompts)
    `
      )
      .run().changes;

    // 删除孤立的使用统计
    const deletedStats = db
      .prepare(
        `
      DELETE FROM usage_stats 
      WHERE prompt_id NOT IN (SELECT id FROM prompts)
    `
      )
      .run().changes;

    // 删除空内容的提示词
    const deletedPrompts = db
      .prepare(
        `
      DELETE FROM prompts 
      WHERE content IS NULL OR content = '' OR title IS NULL OR title = ''
    `
      )
      .run().changes;

    return {
      deletedPrompts,
      deletedVersions,
      deletedStats,
    };
  }
}

// 导出单例实例
export const dataService = DataService.getInstance();
