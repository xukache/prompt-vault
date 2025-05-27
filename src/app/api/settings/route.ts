import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const settingsPath = path.join(process.cwd(), "data", "settings.json");

// 获取设置
export async function GET() {
  try {
    const data = await fs.readFile(settingsPath, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    // 如果文件不存在，返回默认设置
    const defaultSettings = {
      theme: "system",
      language: "zh-CN",
      editor: {
        fontSize: 14,
        tabSize: 2,
        wordWrap: true,
        autoSave: true,
        autoSaveInterval: 30,
      },
      search: {
        enableSemanticSearch: true,
        maxResults: 20,
        searchMode: "hybrid",
        showSearchHistory: true,
      },
      ui: {
        sidebarCollapsed: false,
        defaultView: "grid",
        showPreview: true,
        compactMode: false,
      },
    };
    
    try {
      // 确保目录存在
      await fs.mkdir(path.dirname(settingsPath), { recursive: true });
      await fs.writeFile(settingsPath, JSON.stringify(defaultSettings, null, 2));
    } catch {
      // 忽略写入错误
    }
    
    return NextResponse.json(defaultSettings);
  }
}

// 更新设置
export async function POST(request: Request) {
  try {
    const settings = await request.json();
    
    // 确保目录存在
    await fs.mkdir(path.dirname(settingsPath), { recursive: true });
    
    // 写入设置文件
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "保存设置失败" },
      { status: 500 }
    );
  }
}

// 重置设置
export async function DELETE() {
  try {
    await fs.unlink(settingsPath);
    return NextResponse.json({ success: true });
  } catch {
    // 文件不存在也算成功
    return NextResponse.json({ success: true });
  }
}

// 导出设置
export async function PUT() {
  try {
    const data = await fs.readFile(settingsPath, "utf-8");
    return NextResponse.json({
      settings: JSON.parse(data),
      exportedAt: new Date().toISOString()
    });
  } catch {
    return NextResponse.json(
      { error: "导出设置失败" },
      { status: 500 }
    );
  }
} 