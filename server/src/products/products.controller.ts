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
      models: string;  // JSON字符串，如 [{"model": "MJ-001", "size": "120×60"}]
      layout: number;
    },
    @UploadedFile() file?: Express.Multer.File
  ) {
    const modelsData = typeof body.models === 'string' ? JSON.parse(body.models) : body.models;
    const product = await this.productsService.create({
      name: body.name,
      category_id: body.category_id,
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
      models?: string;
      layout?: number;
    },
    @UploadedFile() file?: Express.Multer.File
  ) {
    const modelsData = body.models ? (typeof body.models === 'string' ? JSON.parse(body.models) : body.models) : undefined;
    const product = await this.productsService.update(Number(id), {
      name: body.name,
      category_id: body.category_id,
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
        const categoryValue = row['分类ID'] || row['分类名称'] || row['category_id'] || row['category'] || '';
        
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

        console.log('创建产品:', row['名称'] || row['name'], '分类ID:', categoryId);

        const product = await this.productsService.create({
          name: row['名称'] || row['name'] || '',
          category_id: categoryId,
          models: modelsData,
          layout: Number(row['排列方式'] || row['layout']) || 1,
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
          name: row['名称'] || row['name'] || '',
          category_id: Number(row['分类ID'] || row['category_id']) || 1,
          models: modelsData,
          layout: Number(row['排列方式'] || row['layout']) || 1,
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
}