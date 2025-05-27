const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// 测试Excel解析功能
function testExcelParsing() {
  try {
    const filePath = path.join(__dirname, '../public/sample-knowledge.xlsx');
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error('Excel文件不存在:', filePath);
      return;
    }
    
    // 读取Excel文件
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 将工作表转换为JSON数组
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('Excel文件解析成功！');
    console.log('工作表名称:', sheetName);
    console.log('数据行数:', jsonData.length);
    
    if (jsonData.length > 0) {
      console.log('标题行:', jsonData[0]);
      
      if (jsonData.length > 1) {
        console.log('第一行数据:');
        const headers = jsonData[0];
        const firstRow = jsonData[1];
        
        headers.forEach((header, index) => {
          console.log(`  ${header}: ${firstRow[index] ? firstRow[index].toString().substring(0, 50) + '...' : 'N/A'}`);
        });
      }
    }
    
    // 模拟导入逻辑
    const headers = jsonData[0].map(h => h?.toString().trim() || '');
    const importData = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      
      const item = {
        title: row[headers.indexOf('title')]?.toString() || `导入项目 ${i}`,
        content: row[headers.indexOf('content')]?.toString() || '',
        type: row[headers.indexOf('type')]?.toString() || 'domain',
        description: row[headers.indexOf('description')]?.toString() || '',
        tags: row[headers.indexOf('tags')]?.toString() || ''
      };
      importData.push(item);
    }
    
    console.log(`\n成功解析 ${importData.length} 条记录:`);
    importData.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title} (${item.type})`);
    });
    
  } catch (error) {
    console.error('Excel解析失败:', error);
  }
}

// 运行测试
testExcelParsing(); 