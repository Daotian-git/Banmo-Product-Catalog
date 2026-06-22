import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, UploadedFile, UseInterceptors, UploadedFiles, UploadedFile as UploadedFileField } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import * as xlsx from 'xlsx';
import * as AdmZip from 'adm-zip';
import * as ExcelJS from 'exceljs';
import * as iconv from 'iconv-lite';
import { getSupabaseClient } from '../storage/database/supabase-client';
import { writeOperationLog, LogEntry } from '../storage/operation-log';

// 类型定义
interface ProductRow {
  '名称'?: string;
  '型号'?: string;
  '分类ID'?: string;
  '尺寸'?: string;
  '排列方式'?: string;
  '图片文件名'?: string;
  name?: string;
  model?: string;
  category_id?: string;
  size?: string;
  layout?: string;
  image?: string;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 获取所有产品（带分类信息）
  @Get()
  async findAll() {
    const products = await this.productsService.findAll();
    return { code: 200, msg: 'success', data: products };
  }

  // 导出产品（必须在 :id 路由之前）
  @Get('export')
  async exportProducts() {
    const products = await this.productsService.findAll();
    
    // 构建 Excel 数据
    const excelData = products.map(p => ({
      '产品编号': p.code || '',
      '产品名称': p.name,
      '分类': p.category_name || '',
      '型号': p.models?.map(m => m.model).join(';') || '',
      '尺寸': p.models?.map(m => m.size).join(';') || '',
      '排列方式': p.layout || 1,
      '排序权重': p.sort_order || 0,
      '图片URL': p.image_url || '',
      '图片文件名': p.image_key?.split('/').pop() || ''
    }));

    // 创建工作簿
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(excelData);
    xlsx.utils.book_append_sheet(wb, ws, '产品列表');
    
    // 生成 Excel 文件
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    return {
      code: 200,
      msg: 'success',
      data: {
        filename: '产品导出_' + new Date().toISOString().slice(0,10) + '.xlsx',
        content: buffer.toString('base64')
      }
    };
  }

  // 获取导入模板（必须在 :id 路由之前）
  @Get('template/import')
  async getImportTemplate() {
    const templateData = [
      {
        '产品编号': 'BM-001',
        '产品名称': '示例产品',
        '分类': '乌金木',
        '型号': 'MJ-001;MJ-002',
        '尺寸': '180×90×85cm;200×100×90cm',
        '排列方式': 1,
        '排序权重': 0,
        '图片文件名': 'product-001.jpg'
      }
    ];
    
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(templateData);
    xlsx.utils.book_append_sheet(wb, ws, '导入模板');
    
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    return {
      code: 200,
      msg: 'success',
      data: {
        filename: '产品导入模板.xlsx',
        content: buffer.toString('base64')
      }
    };
  }

  // 获取修改模板（必须在 :id 路由之前）
  @Get('template/update')
  async getUpdateTemplate() {
    const templateData = [
      {
        '产品编号': 'BM-001',
        '产品名称': '修改后的名称',
        '分类': '黑檀木系列',
        '型号': 'MJ-001;MJ-002',
        '尺寸': '180×90×85cm;200×100×90cm',
        '排列方式': 1,
        '排序权重': 10,
        '图片文件名': 'new-image.jpg'
      },
      {
        '产品编号': 'BM-002',
        '产品名称': '',
        '分类': '',
        '型号': '',
        '尺寸': '',
        '排列方式': '',
        '排序权重': '',
        '图片文件名': ''
      }
    ];

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(templateData);
    xlsx.utils.book_append_sheet(wb, ws, '修改模板');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return {
      code: 200,
      msg: 'success',
      data: {
        filename: '产品修改模板.xlsx',
        content: buffer.toString('base64')
      }
    };
  }

  // 获取删除模板（必须在 :id 路由之前）
  @Get('template/delete')
  async getDeleteTemplate() {
    const templateData = [
      {
        '产品编号': 'BM-001'
      },
      {
        '产品编号': 'BM-002'
      }
    ];

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(templateData);
    xlsx.utils.book_append_sheet(wb, ws, '删除模板');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return {
      code: 200,
      msg: 'success',
      data: {
        filename: '产品删除模板.xlsx',
        content: buffer.toString('base64')
      }
    };
  }

  // 获取单个产品
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(Number(id));
    return { code: 200, msg: 'success', data: product };
  }

  // 创建产品（带图片上传）
  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() body: {
      name: string;
      category_id: number;
      code?: string; // 产品编号
      models: string;  // JSON字符串，如 [{"model": "MJ-001", "size": "120×60"}]
      layout: number;
    },
    @UploadedFile() file?: Express.Multer.File
  ) {
    const modelsData = typeof body.models === 'string' ? JSON.parse(body.models) : body.models;
    const product = await this.productsService.create({
      name: body.name,
      category_id: body.category_id,
      code: body.code,
      models: modelsData,
      layout: body.layout || 1,
      imageFile: file
    });
    return { code: 200, msg: 'success', data: product };
  }

  // 更新产品（可更新图片）
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      category_id?: number;
      code?: string; // 产品编号
      models?: string;
      layout?: number;
    },
    @UploadedFile() file?: Express.Multer.File
  ) {
    const modelsData = body.models ? (typeof body.models === 'string' ? JSON.parse(body.models) : body.models) : undefined;
    const product = await this.productsService.update(Number(id), {
      name: body.name,
      category_id: body.category_id,
      code: body.code,
      models: modelsData,
      layout: body.layout,
      imageFile: file
    });
    return { code: 200, msg: 'success', data: product };
  }

  // 删除产品
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.productsService.remove(Number(id));
    return { code: 200, msg: 'success', data: null };
  }

  // 批量上传文件（Excel + ZIP）
  @Post('batch-upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('files', 2))
  async batchUpload(@UploadedFiles() files: Express.Multer.File[]) {
    const result: { excel: { filename: string; size: number; buffer: string } | null; zip: { filename: string; size: number; buffer: string } | null } = { excel: null, zip: null };
    
    for (const file of files) {
      if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls') || file.originalname.endsWith('.csv')) {
        result.excel = {
          filename: file.originalname,
          size: file.size,
          buffer: file.buffer.toString('base64')
        };
      } else if (file.originalname.endsWith('.zip')) {
        result.zip = {
          filename: file.originalname,
          size: file.size,
          buffer: file.buffer.toString('base64')
        };
      }
    }
    
    return { code: 200, msg: 'success', data: result };
  }

  // 直接批量导入（前端使用 FormData，字段名为 excel 和 zip）
  @Post('batch-import-direct')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'excel', maxCount: 1 },
    { name: 'zip', maxCount: 1 }
  ]))
  async batchImportDirect(
    @UploadedFiles() files: { excel?: Express.Multer.File[]; zip?: Express.Multer.File[] }
  ) {
    const excelFile = files?.excel?.[0];
    const zipFile = files?.zip?.[0];
    
    let excelBuffer: Buffer | null = excelFile?.buffer || null;
    let zipBuffer: Buffer | null = zipFile?.buffer || null;

    console.log('接收到的文件:', {
      excel: excelFile ? { name: excelFile.originalname, size: excelFile.size } : null,
      zip: zipFile ? { name: zipFile.originalname, size: zipFile.size } : null
    });

    if (!excelBuffer) {
      return { code: 400, msg: '请上传Excel文件', data: null };
    }

    // 使用ExcelJS解析Excel（更好地处理中文编码）
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(excelBuffer as any);
    const worksheet = workbook.worksheets[0];
    
    const rows: Record<string, string>[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过标题行
      const rowData: Record<string, string> = {};
      row.eachCell((cell, colNumber) => {
        const header = worksheet.getRow(1).getCell(colNumber).value?.toString() || '';
        rowData[header] = cell.value?.toString() || '';
      });
      rows.push(rowData);
    });

    console.log('Excel解析结果:', rows.length, '行数据');
    if (rows.length > 0) {
      console.log('第一行数据示例:', JSON.stringify(rows[0], null, 2));
      console.log('列名:', Object.keys(rows[0]));
    }

    // 获取所有分类（用于根据名称查找ID）
    const { data: categoriesData } = await getSupabaseClient()
      .from('categories')
      .select('*');
    const categories = categoriesData || [];
    console.log('可用分类数量:', categories.length);

    // 从文件名中提取产品编码（用于匹配）
    const extractCode = (filename: string): string => {
      // 匹配像 MYSF901, MYDT905, X-C611 这样的产品编码
      const match = filename.match(/([A-Z]+[\d]+(?:[.-]\d+)*)/i);
      return match ? match[1] : '';
    };

    // 解压ZIP获取图片
    const images: Map<string, Buffer> = new Map();
    const imageCodeMap: Map<string, string> = new Map(); // code → filename
    if (zipBuffer) {
      const zip = new AdmZip(zipBuffer);
      const zipEntries = zip.getEntries();
      console.log('ZIP包含文件数:', zipEntries.length);
      for (const entry of zipEntries) {
        if (!entry.isDirectory && entry.entryName.match(/\.(jpg|jpeg|png|webp)$/i)) {
          let filename = entry.entryName.split('/').pop() || entry.entryName;

          // 尝试用GBK从原始header解码（处理Windows中文ZIP）
          try {
            const rawName = (entry.header as any)?.fileName;
            if (rawName && Buffer.isBuffer(rawName)) {
              const gbkName = iconv.decode(rawName, 'gbk');
              if (gbkName && !gbkName.includes('�')) {
                filename = gbkName.split('/').pop() || gbkName;
              }
            }
          } catch {
            // GBK解码失败，保持原名
          }

          const imageBuffer = entry.getData();
          images.set(filename, imageBuffer);
          // 同时按产品编码索引，用于乱码时的回退匹配
          const code = extractCode(filename);
          if (code) {
            imageCodeMap.set(code, filename);
          }
          console.log('发现图片:', filename, '(编码匹配:', code || '无', ')');
        }
      }
    }

    // 批量创建产品
    const entries: LogEntry[] = [];

    for (const row of rows) {
      const rowCode = row['产品编号'] || row['编号'] || row['code'] || '';
      const rowName = row['产品名称'] || row['名称'] || row['name'] || '';
      try {
        // 解析型号和尺寸（支持多个，用分号分隔）
        const modelsData = this.parseModels(row);

        // 获取图片 — 三路匹配：精确名 → 编码匹配 → 后缀匹配
        const excelImageName = row['图片文件名'] || row['image'] || '';
        let imageBuffer: Buffer | null = images.get(excelImageName) || null;

        if (!imageBuffer && excelImageName) {
          const excelCode = extractCode(excelImageName);
          if (excelCode && imageCodeMap.has(excelCode)) {
            const matchedName = imageCodeMap.get(excelCode)!;
            imageBuffer = images.get(matchedName) || null;
            console.log('编码匹配图片:', excelImageName, '→', matchedName);
          }
        }

        if (!imageBuffer && excelImageName) {
          const suffix = excelImageName.replace(/^.*[\\/_\-]/, '').toLowerCase();
          for (const [name, buf] of images.entries()) {
            if (name.toLowerCase().endsWith(suffix)) {
              imageBuffer = buf;
              console.log('后缀匹配图片:', excelImageName, '→', name);
              break;
            }
          }
        }

        // 解析分类ID（支持数字ID或分类名称）
        let categoryId: number | null = null;
        const categoryValue = row['分类'] || row['分类ID'] || row['分类名称'] || row['category_id'] || row['category'] || '';

        // 先获取一级分类列表（按 sort_order 排序）
        const primaryCategories = categories
          .filter(c => !c.parent_id)
          .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));

        if (categoryValue) {
          const numericId = Number(categoryValue);
          if (!isNaN(numericId) && numericId > 0) {
            // 数字情况：先当 ID 查，查不到则当序号映射到一级分类
            const byId = categories.find(c => c.id === numericId);
            if (byId) {
              categoryId = numericId;
            } else {
              // 序号映射：1→第一个一级分类, 2→第二个一级分类
              const idx = numericId - 1;
              if (primaryCategories[idx]) {
                categoryId = primaryCategories[idx].id;
              } else {
                categoryId = primaryCategories[0]?.id || null;
              }
            }
          } else {
            // 文本情况：按名称匹配
            const categoryName = String(categoryValue).trim();
            if (categoryName.includes('-') || categoryName.includes('/')) {
              const parts = categoryName.split(/[-\/]/).map(s => s.trim());
              const parent = categories.find(c => c.name === parts[0] && !c.parent_id);
              if (parent) {
                const child = categories.find(c => c.name === parts[1] && c.parent_id === parent.id);
                if (child) categoryId = child.id;
              }
            } else {
              const matched = categories.find(c => c.name === categoryName);
              if (matched) categoryId = matched.id;
            }
          }
        }

        // 兜底
        if (!categoryId && primaryCategories.length > 0) {
          categoryId = primaryCategories[0].id;
        }
        if (!categoryId) {
          categoryId = 1; // last resort
        }

        console.log('创建产品:', rowName, '分类ID:', categoryId);

        await this.productsService.create({
          name: rowName,
          code: rowCode || undefined,
          category_id: categoryId,
          models: modelsData,
          layout: Number(row['排列方式'] || row['layout']) || 1,
          sort_order: Number(row['排序权重'] || row['sort_order'] || row['sort']) || 0,
          imageBuffer: imageBuffer || undefined,
          imageFilename: excelImageName
        });
        entries.push({ code: rowCode, name: rowName, success: true });
      } catch (error) {
        console.error('创建产品失败:', error.message, '数据:', row);
        entries.push({ code: rowCode, name: rowName, success: false, error: error.message });
      }
    }

    const successCount = entries.filter(e => e.success).length;
    const failedCount = entries.filter(e => !e.success).length;
    console.log('导入结果: 成功', successCount, '失败', failedCount);

    const logResult = writeOperationLog({
      type: '导入',
      total: rows.length,
      success: successCount,
      failed: failedCount,
      entries,
      filename: ''
    });

    return {
      code: 200,
      msg: 'success',
      data: {
        total: rows.length,
        success: successCount,
        failed: failedCount,
        logFile: logResult,
        entries
      }
    };
  }

  // 执行批量导入
  @Post('batch-import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('files', 2))
  async batchImport(@UploadedFiles() files: Express.Multer.File[]) {
    let excelBuffer: Buffer | null = null;
    let zipBuffer: Buffer | null = null;
    
    for (const file of files) {
      if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
        excelBuffer = file.buffer;
      } else if (file.originalname.endsWith('.zip')) {
        zipBuffer = file.buffer;
      }
    }

    if (!excelBuffer) {
      return { code: 400, msg: '请上传Excel文件', data: null };
    }

    // 解析Excel
    const workbook = xlsx.read(excelBuffer, { type: 'buffer', codepage: 65001 });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false }) as Record<string, string>[];

    // 从文件名中提取产品编码（用于匹配）
    const extractCode2 = (filename: string): string => {
      const match = filename.match(/([A-Z]+[\d]+(?:[.-]\d+)*)/i);
      return match ? match[1] : '';
    };

    // 解压ZIP获取图片
    const images: Map<string, Buffer> = new Map();
    const imageCodeMap: Map<string, string> = new Map();
    if (zipBuffer) {
      const zip = new AdmZip(zipBuffer);
      const zipEntries = zip.getEntries();
      for (const entry of zipEntries) {
        if (!entry.isDirectory && entry.entryName.match(/\.(jpg|jpeg|png|webp)$/i)) {
          let filename = entry.entryName.split('/').pop() || entry.entryName;

          // 尝试用GBK从原始header解码（处理Windows中文ZIP）
          try {
            const rawName = (entry.header as any)?.fileName;
            if (rawName && Buffer.isBuffer(rawName)) {
              const gbkName = iconv.decode(rawName, 'gbk');
              if (gbkName && !gbkName.includes('�')) {
                filename = gbkName.split('/').pop() || gbkName;
              }
            }
          } catch {
            // GBK解码失败，保持原名
          }

          const imageBuffer = entry.getData();
          images.set(filename, imageBuffer);
          const code = extractCode2(filename);
          if (code) imageCodeMap.set(code, filename);
          console.log('发现图片:', filename);
        }
      }
    }

    // 批量创建产品
    const created: any[] = [];
    const failed: any[] = [];

    for (const row of rows) {
      try {
        // 解析型号和尺寸（支持多个，用分号分隔）
        const modelsData = this.parseModels(row);

        // 获取图片 — 三路匹配
        const excelImageName = row['图片文件名'] || row['image'] || '';
        let imageBuffer: Buffer | null = images.get(excelImageName) || null;

        if (!imageBuffer && excelImageName) {
          const excelCode = extractCode2(excelImageName);
          if (excelCode && imageCodeMap.has(excelCode)) {
            const matchedName = imageCodeMap.get(excelCode)!;
            imageBuffer = images.get(matchedName) || null;
          }
        }

        if (!imageBuffer && excelImageName) {
          const suffix = excelImageName.replace(/^.*[\\/_\-]/, '').toLowerCase();
          for (const [name, buf] of images.entries()) {
            if (name.toLowerCase().endsWith(suffix)) {
              imageBuffer = buf;
              break;
            }
          }
        }

        const product = await this.productsService.create({
          name: row['产品名称'] || row['名称'] || row['name'] || '',
          code: row['产品编号'] || row['编号'] || row['code'] || undefined,
          category_id: Number(row['分类'] || row['分类ID'] || row['category_id']) || 1,
          models: modelsData,
          layout: Number(row['排列方式'] || row['layout']) || 1,
          sort_order: Number(row['排序权重'] || row['sort_order'] || row['sort']) || 0,
          imageBuffer: imageBuffer || undefined,
          imageFilename: excelImageName
        });
        created.push(product);
      } catch (error) {
        failed.push({ row, error: error.message });
      }
    }

    return { 
      code: 200, 
      msg: 'success', 
      data: { 
        total: rows.length, 
        created: created.length, 
        failed: failed.length,
        details: { created, failed }
      }
    };
  }

  // 解析型号和尺寸（支持多个）
  private parseModels(row: any): { model: string; size: string }[] {
    const models: { model: string; size: string }[] = [];
    
    // 支持多种格式：
    // 1. 型号字段用分号分隔多个型号：MJ-001;MJ-002;MJ-003
    // 2. 尺寸字段用分号分隔多个尺寸：120×60×45;100×50×40;80×40×35
    // 3. 或者用 JSON 格式：[{"model":"MJ-001","size":"120×60"}]
    
    const modelStr = row['型号'] || row['model'] || '';
    const sizeStr = row['尺寸'] || row['size'] || '';
    
    // 如果是JSON格式
    if (modelStr.startsWith('[')) {
      try {
        return JSON.parse(modelStr);
      } catch {
        // 解析失败，使用分号分隔方式
      }
    }
    
    // 分号分隔方式
    const modelList = modelStr.split(/[;；,，]/).filter(s => s.trim());
    const sizeList = sizeStr.split(/[;；,，]/).filter(s => s.trim());
    
    // 型号和尺寸一一对应，或者只有一个尺寸对应所有型号
    for (let i = 0; i < modelList.length; i++) {
      models.push({
        model: modelList[i].trim(),
        size: (sizeList[i] || sizeList[0] || '').trim()
      });
    }
    
    // 如果没有型号但有尺寸
    if (modelList.length === 0 && sizeList.length > 0) {
      for (const size of sizeList) {
        models.push({ model: '', size: size.trim() });
      }
    }
    
    return models.length > 0 ? models : [{ model: '', size: '' }];
  }

  // ==================== 批量操作接口 ====================

  // 批量删除（按产品编号删除整个产品）
  @Post('batch-delete')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('excel'))
  async batchDelete(
    @UploadedFile() excelFile: Express.Multer.File
  ) {
    if (!excelFile) {
      return { code: 400, msg: '请上传删除表格' };
    }

    // 解析 Excel
    const workbook = xlsx.read(excelFile.buffer, { type: 'buffer', codepage: 65001 });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false }) as ProductRow[];

    console.log('批量删除：解析到', rows.length, '行数据');

    // 获取要删除的产品编号列表
    const codesToDelete: string[] = [];
    for (const row of rows) {
      const code = row['产品编号'] || row['code'] || '';
      if (code.trim()) {
        codesToDelete.push(code.trim());
      }
    }

    console.log('要删除的产品编号:', codesToDelete);

    // 获取所有产品，按编号匹配删除
    const products = await this.productsService.findAll();
    const entries: LogEntry[] = [];

    for (const code of codesToDelete) {
      const product = products.find(p => p.code === code);
      try {
        if (product) {
          await this.productsService.remove(product.id);
          entries.push({ code, name: product.name, success: true });
          console.log('删除产品:', product.name, code);
        } else {
          entries.push({ code, name: '(未找到)', success: false, error: '产品编号不存在' });
        }
      } catch (error) {
        entries.push({ code, name: product?.name || '(未知)', success: false, error: error.message });
      }
    }

    const successCount = entries.filter(e => e.success).length;
    const failedCount = entries.filter(e => !e.success).length;

    const logResult = writeOperationLog({
      type: '删除',
      total: codesToDelete.length,
      success: successCount,
      failed: failedCount,
      entries,
      filename: ''
    });

    return {
      code: 200,
      msg: 'success',
      data: { total: codesToDelete.length, success: successCount, failed: failedCount, logFile: logResult, entries }
    };
  }

  // 批量修改（按产品编号修改所有参数，可选 ZIP 图片包）
  @Post('batch-update')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'excel', maxCount: 1 },
    { name: 'zip', maxCount: 1 }
  ]))
  async batchUpdate(
    @UploadedFiles() files: { excel?: Express.Multer.File[]; zip?: Express.Multer.File[] }
  ) {
    const excelFile = files?.excel?.[0];
    const zipFile = files?.zip?.[0];

    if (!excelFile) {
      return { code: 400, msg: '请上传修改表格' };
    }

    // 解析 Excel
    const workbook = xlsx.read(excelFile.buffer, { type: 'buffer', codepage: 65001 });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false }) as ProductRow[];

    console.log('批量修改：解析到', rows.length, '行数据');

    // 获取分类列表用于名称匹配
    const categories = await getSupabaseClient().from('categories').select('*');
    const categoryMap = new Map();
    for (const cat of categories.data || []) {
      categoryMap.set(cat.id, cat);
      categoryMap.set(cat.name, cat);
    }

    // 从文件名提取编码（用于ZIP图片匹配）
    const extractCode3 = (filename: string): string => {
      const match = filename.match(/([A-Z]+[\d]+(?:[.-]\d+)*)/i);
      return match ? match[1] : '';
    };

    // 解压 ZIP 获取图片
    const images: Map<string, Buffer> = new Map();
    const imageCodeMap: Map<string, string> = new Map();
    if (zipFile) {
      const zip = new AdmZip(zipFile.buffer);
      const zipEntries = zip.getEntries();
      console.log('修改-ZIP包含文件数:', zipEntries.length);
      for (const entry of zipEntries) {
        if (!entry.isDirectory && entry.entryName.match(/\.(jpg|jpeg|png|webp)$/i)) {
          let filename = entry.entryName.split('/').pop() || entry.entryName;
          try {
            const rawName = (entry.header as any)?.fileName;
            if (rawName && Buffer.isBuffer(rawName)) {
              const gbkName = iconv.decode(rawName, 'gbk');
              if (gbkName && !gbkName.includes('�')) {
                filename = gbkName.split('/').pop() || gbkName;
              }
            }
          } catch { /* keep original */ }
          const imgBuf = entry.getData();
          images.set(filename, imgBuf);
          const code = extractCode3(filename);
          if (code) imageCodeMap.set(code, filename);
          console.log('修改-发现图片:', filename);
        }
      }
    }

    const entries: LogEntry[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const code = row['产品编号'] || row['code'] || '';
      const rowName = row['产品名称'] || row['name'] || '';

      if (!code) {
        entries.push({ code: '', name: rowName, success: false, error: '缺少产品编号' });
        continue;
      }

      // 查找产品
      const products = await this.productsService.findAll();
      const product = products.find(p => p.code === code);

      if (!product) {
        entries.push({ code, name: rowName, success: false, error: `产品编号 "${code}" 不存在` });
        continue;
      }

      // 解析更新数据
      const updateData: any = {};
      if (rowName) updateData.name = rowName;
      const categoryStr = row['分类'] || row['分类ID'] || row['category_id'] || row['category'];
      if (categoryStr) {
        const catId = this.parseCategoryId(categoryStr, categoryMap);
        if (catId) updateData.category_id = catId;
      }
      const models = this.parseModels(row);
      if (models.length > 0) updateData.models = models;
      const layout = row['排列方式'] || row['layout'];
      if (layout) updateData.layout = parseInt(layout) || 1;
      const sortOrder = row['排序权重'] || row['sort_order'] || row['sort'];
      if (sortOrder) updateData.sort_order = parseInt(sortOrder) || 0;

      // 匹配图片
      const excelImageName = row['图片文件名'] || row['image'] || '';
      let imageBuffer: Buffer | null = null;
      if (excelImageName) {
        imageBuffer = images.get(excelImageName) || null;
        if (!imageBuffer) {
          const excelCode = extractCode3(excelImageName);
          if (excelCode && imageCodeMap.has(excelCode)) {
            imageBuffer = images.get(imageCodeMap.get(excelCode)!) || null;
          }
        }
        if (!imageBuffer) {
          const suffix = excelImageName.replace(/^.*[\\/_\-]/, '').toLowerCase();
          for (const [name, buf] of images.entries()) {
            if (name.toLowerCase().endsWith(suffix)) { imageBuffer = buf; break; }
          }
        }
        if (imageBuffer) {
          updateData.imageBuffer = imageBuffer;
          updateData.imageFilename = excelImageName;
        }
      }

      // 执行更新
      try {
        await this.productsService.update(product.id, updateData);
        entries.push({ code, name: product.name, success: true });
        console.log('更新产品:', code, Object.keys(updateData));
      } catch (err) {
        entries.push({ code, name: product.name, success: false, error: String(err) });
      }
    }

    const successCount = entries.filter(e => e.success).length;
    const failedCount = entries.filter(e => !e.success).length;

    const logResult = writeOperationLog({
      type: '修改',
      total: rows.length,
      success: successCount,
      failed: failedCount,
      entries,
      filename: ''
    });

    return {
      code: 200,
      msg: 'success',
      data: { total: rows.length, success: successCount, failed: failedCount, logFile: logResult, entries }
    };
  }

  // 解析分类ID
  private parseCategoryId(categoryStr: string, categoryMap: Map<any, any>): number | null {
    // 尝试直接解析为数字 → 查 ID
    const numId = parseInt(categoryStr);
    if (!isNaN(numId) && categoryMap.has(numId)) {
      return numId;
    }

    // 数字但 ID 不存在 → 序号映射到一级分类（1→第一个一级，2→第二个一级）
    if (!isNaN(numId) && numId > 0) {
      const seen = new Set<number>();
      const allCats = Array.from(categoryMap.values())
        .filter((c: any) => !c.parent_id && !seen.has(c.id) && seen.add(c.id))
        .sort((a: any, b: any) => Number(a.sort_order) - Number(b.sort_order));
      const mapped = allCats[numId - 1];
      if (mapped) return mapped.id;
    }

    // 尝试按名称匹配
    const cat = categoryMap.get(categoryStr);
    if (cat) return cat.id;

    // 尝试分割匹配（如"乌金木-沙发"）
    const parts = categoryStr.split(/[-\/]/);
    for (const part of parts) {
      const found = categoryMap.get(part.trim());
      if (found) return found.id;
    }

    return null;
  }
}