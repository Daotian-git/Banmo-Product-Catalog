import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, UploadedFile, UseInterceptors, UploadedFiles, UploadedFile as UploadedFileField } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import * as xlsx from 'xlsx';
import * as AdmZip from 'adm-zip';
import { getSupabaseClient } from '../storage/database/supabase-client';

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
        '分类': '黑檀木',
        '型号': 'MJ-001;MJ-002',
        '尺寸': '180×90×85cm;200×100×90cm',
        '排列方式': 1,
        '排序权重': 10,
        '图片文件名': 'new-image.jpg'
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
        '产品编号': 'BM-001',
        '型号': 'MJ-001'
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

    // 解析Excel
    const workbook = xlsx.read(excelBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet) as Record<string, string>[];

    console.log('Excel解析结果:', rows.length, '行数据');
    if (rows.length > 0) {
      console.log('第一行数据示例:', JSON.stringify(rows[0], null, 2));
    }

    // 获取所有分类（用于根据名称查找ID）
    const { data: categoriesData } = await getSupabaseClient()
      .from('categories')
      .select('*');
    const categories = categoriesData || [];
    console.log('可用分类数量:', categories.length);

    // 解压ZIP获取图片
    const images: Map<string, Buffer> = new Map();
    if (zipBuffer) {
      const zip = new AdmZip(zipBuffer);
      const zipEntries = zip.getEntries();
      console.log('ZIP包含文件数:', zipEntries.length);
      for (const entry of zipEntries) {
        if (!entry.isDirectory && entry.entryName.match(/\.(jpg|jpeg|png|webp)$/i)) {
          const filename = entry.entryName.split('/').pop() || entry.entryName;
          images.set(filename, entry.getData());
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
        
        // 获取图片
        const imageFilename = row['图片文件名'] || row['image'] || '';
        const imageBuffer = images.get(imageFilename) || null;

        // 解析分类ID（支持数字ID或分类名称）
        let categoryId = 1;
        const categoryValue = row['分类'] || row['分类ID'] || row['分类名称'] || row['category_id'] || row['category'] || '';
        
        if (categoryValue) {
          // 如果是数字，直接使用
          const numericId = Number(categoryValue);
          if (!isNaN(numericId) && numericId > 0) {
            categoryId = numericId;
          } else {
            // 如果是分类名称，查找对应的ID
            // 支持格式：'乌金木-沙发' 或 '沙发'（二级分类名）
            const categoryName = String(categoryValue).trim();
            
            // 尝试匹配完整路径（一级-二级）
            if (categoryName.includes('-') || categoryName.includes('/')) {
              const parts = categoryName.split(/[-\/]/).map(s => s.trim());
              const parentName = parts[0];
              const childName = parts[1];
              const parent = categories.find(c => c.name === parentName && !c.parent_id);
              if (parent) {
                const child = categories.find(c => c.name === childName && c.parent_id === parent.id);
                if (child) {
                  categoryId = child.id;
                }
              }
            } else {
              // 直接匹配分类名称（可能是二级分类）
              const matchedCategory = categories.find(c => c.name === categoryName);
              if (matchedCategory) {
                categoryId = matchedCategory.id;
              }
            }
          }
        }

        // 验证分类ID是否存在
        const categoryExists = categories.find(c => c.id === categoryId);
        if (!categoryExists) {
          console.log('分类ID不存在:', categoryId, '原始值:', categoryValue);
          categoryId = 1; // 回退到默认分类
        }

        console.log('创建产品:', row['产品名称'] || row['名称'] || row['name'], '分类ID:', categoryId);

        const product = await this.productsService.create({
          name: row['产品名称'] || row['名称'] || row['name'] || '',
          code: row['产品编号'] || row['编号'] || row['code'] || undefined,
          category_id: categoryId,
          models: modelsData,
          layout: Number(row['排列方式'] || row['layout']) || 1,
          sort_order: Number(row['排序权重'] || row['sort_order'] || row['sort']) || 0,
          imageBuffer: imageBuffer || undefined,
          imageFilename: imageFilename
        });
        created.push(product);
      } catch (error) {
        console.error('创建产品失败:', error.message, '数据:', row);
        failed.push({ row, error: error.message });
      }
    }

    console.log('导入结果: 成功', created.length, '失败', failed.length);
    if (failed.length > 0) {
      console.log('失败详情:', JSON.stringify(failed, null, 2));
    }

    return { 
      code: 200, 
      msg: 'success', 
      data: { 
        count: created.length,
        total: rows.length, 
        created: created.length, 
        failed: failed.length,
        details: { created, failed }
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
    const workbook = xlsx.read(excelBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet) as Record<string, string>[];

    // 解压ZIP获取图片
    const images: Map<string, Buffer> = new Map();
    if (zipBuffer) {
      const zip = new AdmZip(zipBuffer);
      const zipEntries = zip.getEntries();
      for (const entry of zipEntries) {
        if (!entry.isDirectory && entry.entryName.match(/\.(jpg|jpeg|png|webp)$/i)) {
          const filename = entry.entryName.split('/').pop() || entry.entryName;
          images.set(filename, entry.getData());
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
        
        // 获取图片
        const imageFilename = row['图片文件名'] || row['image'] || '';
        const imageBuffer = images.get(imageFilename) || null;

        const product = await this.productsService.create({
          name: row['产品名称'] || row['名称'] || row['name'] || '',
          code: row['产品编号'] || row['编号'] || row['code'] || undefined,
          category_id: Number(row['分类'] || row['分类ID'] || row['category_id']) || 1,
          models: modelsData,
          layout: Number(row['排列方式'] || row['layout']) || 1,
          sort_order: Number(row['排序权重'] || row['sort_order'] || row['sort']) || 0,
          imageBuffer: imageBuffer || undefined,
          imageFilename: imageFilename
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

  // 批量删除（按型号删除，当产品所有型号都被删除时删除整个产品）
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
    const workbook = xlsx.read(excelFile.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet) as ProductRow[];

    console.log('批量删除：解析到', rows.length, '行数据');

    // 获取要删除的型号列表
    const modelsToDelete: string[] = [];
    for (const row of rows) {
      const modelCode = row['产品编号'] || row['型号'] || row['code'] || row['model'] || '';
      if (modelCode.trim()) {
        modelsToDelete.push(modelCode.trim());
      }
    }

    console.log('要删除的型号:', modelsToDelete);

    // 获取所有产品
    const products = await this.productsService.findAll();
    let deletedModels = 0;
    let deletedProducts = 0;

    for (const product of products) {
      if (!product.models || product.models.length === 0) continue;

      // 查找产品编号匹配的产品
      if (product.code && modelsToDelete.includes(product.code)) {
        // 删除整个产品
        await this.productsService.remove(product.id);
        deletedProducts++;
        console.log('删除产品:', product.name, product.code);
        continue;
      }

      // 查找型号匹配的项
      const remainingModels = product.models.filter(m => 
        !modelsToDelete.includes(m.model)
      );

      if (remainingModels.length < product.models.length) {
        // 有型号被删除
        deletedModels += product.models.length - remainingModels.length;
        
        if (remainingModels.length === 0) {
          // 所有型号都删除了，删除整个产品
          await this.productsService.remove(product.id);
          deletedProducts++;
          console.log('删除产品（型号全部删除）:', product.name);
        } else {
          // 更新产品，保留剩余型号
          await this.productsService.update(product.id, {
            models: remainingModels
          });
          console.log('更新产品型号:', product.name, '剩余', remainingModels.length, '个型号');
        }
      }
    }

    return {
      code: 200,
      msg: 'success',
      data: {
        deletedModels,
        deletedProducts
      }
    };
  }

  // 批量修改（按产品编号修改所有参数）
  @Post('batch-update')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('excel'))
  async batchUpdate(
    @UploadedFile() excelFile: Express.Multer.File
  ) {
    if (!excelFile) {
      return { code: 400, msg: '请上传修改表格' };
    }

    // 解析 Excel
    const workbook = xlsx.read(excelFile.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet) as ProductRow[];

    console.log('批量修改：解析到', rows.length, '行数据');

    // 获取分类列表用于名称匹配
    const categories = await getSupabaseClient().from('categories').select('*');
    const categoryMap = new Map();
    for (const cat of categories.data || []) {
      categoryMap.set(cat.id, cat);
      categoryMap.set(cat.name, cat);
    }

    let updatedCount = 0;
    let failedRows: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const code = row['产品编号'] || row['code'] || '';
      
      if (!code) {
        failedRows.push({ row: i + 2, reason: '缺少产品编号' });
        continue;
      }

      // 查找产品
      const products = await this.productsService.findAll();
      const product = products.find(p => p.code === code);
      
      if (!product) {
        failedRows.push({ row: i + 2, reason: `产品编号 "${code}" 不存在` });
        continue;
      }

      // 解析更新数据
      const updateData: any = {};

      // 名称
      const name = row['产品名称'] || row['name'];
      if (name) updateData.name = name;

      // 分类
      const categoryStr = row['分类'] || row['分类ID'] || row['category_id'] || row['category'];
      if (categoryStr) {
        const catId = this.parseCategoryId(categoryStr, categoryMap);
        if (catId) updateData.category_id = catId;
      }

      // 型号和尺寸
      const models = this.parseModels(row);
      if (models.length > 0) updateData.models = models;

      // 排列方式
      const layout = row['排列方式'] || row['layout'];
      if (layout) updateData.layout = parseInt(layout) || 1;

      // 排序权重
      const sortOrder = row['排序权重'] || row['sort_order'] || row['sort'];
      if (sortOrder) updateData.sort_order = parseInt(sortOrder) || 0;

      // 执行更新
      try {
        await this.productsService.update(product.id, updateData);
        updatedCount++;
        console.log('更新产品:', code, updateData);
      } catch (err) {
        failedRows.push({ row: i + 2, reason: String(err) });
      }
    }

    return {
      code: 200,
      msg: 'success',
      data: {
        updatedCount,
        failedCount: failedRows.length,
        failedRows
      }
    };
  }

  // 解析分类ID
  private parseCategoryId(categoryStr: string, categoryMap: Map<any, any>): number | null {
    // 尝试直接解析为数字
    const numId = parseInt(categoryStr);
    if (!isNaN(numId) && categoryMap.has(numId)) {
      return numId;
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