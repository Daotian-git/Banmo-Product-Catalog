import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '../storage/database/supabase-client';

// 产品数据类型（用于创建）
export interface CreateProductData {
  name: string;
  category_id: number;
  models?: Array<{ model: string; size: string }>;
  layout?: number;
  imageFile?: Express.Multer.File;
  imageBuffer?: Buffer;
  imageFilename?: string;
}

// 产品数据类型（用于更新）
export interface UpdateProductData {
  name?: string;
  category_id?: number;
  models?: Array<{ model: string; size: string }>;
  layout?: number;
  imageFile?: Express.Multer.File;
}

@Injectable()
export class ProductsService {
  private storage: S3Storage;

  constructor() {
    this.storage = new S3Storage();
  }

  // 获取 Supabase Client
  private getSupabase() {
    return getSupabaseClient();
  }

  // 获取所有产品（带分类信息）
  async findAll() {
    const supabase = this.getSupabase();
    
    // 先获取所有产品
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    
    if (productsError) {
      console.error('获取产品失败:', productsError);
      return [];
    }
    
    // 获取所有分类
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*');
    
    // 组合数据 - 构建完整分类路径
    const categoryMap = new Map(categoriesData?.map(c => [c.id, c]) || []);
    return productsData?.map(p => {
      const category = categoryMap.get(p.category_id);
      let categoryPath = '';
      if (category) {
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          categoryPath = parent ? `${parent.name}-${category.name}` : category.name;
        } else {
          categoryPath = category.name;
        }
      }
      return {
        ...p,
        category,
        category_name: categoryPath
      };
    }) || [];
  }

  // 按分类获取产品
  async findByCategory(categoryId: number) {
    const supabase = this.getSupabase();
    
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    
    // 获取所有分类（用于构建完整路径）
    const { data: allCategories } = await supabase
      .from('categories')
      .select('*');
    const categoryMap = new Map(allCategories?.map(c => [c.id, c]) || []);
    
    // 获取当前分类信息
    const { data: categoryData } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();
    
    // 构建完整分类路径
    let categoryPath = '';
    if (categoryData) {
      if (categoryData.parent_id) {
        const parent = categoryMap.get(categoryData.parent_id);
        categoryPath = parent ? `${parent.name}-${categoryData.name}` : categoryData.name;
      } else {
        categoryPath = categoryData.name;
      }
    }
    
    return productsData?.map(p => ({
      ...p,
      category: categoryData,
      category_name: categoryPath
    })) || [];
  }

  // 获取单个产品
  async findOne(id: number) {
    const supabase = this.getSupabase();
    
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !product) {
      throw new NotFoundException(`产品 #${id} 不存在`);
    }
    
    // 获取分类信息
    const { data: categoryData } = await supabase
      .from('categories')
      .select('*')
      .eq('id', product.category_id)
      .single();
    
    return {
      ...product,
      category: categoryData
    };
  }

  // 创建产品
  async create(data: CreateProductData) {
    const supabase = this.getSupabase();
    let imageKey: string | undefined;
    let imageUrl: string | undefined;

    // 上传图片（如果有）
    if (data.imageFile && data.imageFile.buffer) {
      const filename = `products/${Date.now()}_${data.imageFile.originalname}`;
      imageKey = await this.storage.uploadFile({
        fileContent: data.imageFile.buffer,
        fileName: filename,
        contentType: data.imageFile.mimetype
      });
      imageUrl = await this.storage.generatePresignedUrl({ key: imageKey });
    } else if (data.imageBuffer) {
      const filename = `products/${Date.now()}_${data.imageFilename || 'image.jpg'}`;
      imageKey = await this.storage.uploadFile({
        fileContent: data.imageBuffer,
        fileName: filename,
        contentType: 'image/jpeg'
      });
      imageUrl = await this.storage.generatePresignedUrl({ key: imageKey });
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: data.name,
        category_id: data.category_id,
        models: data.models || [],
        layout: data.layout || 1,
        image_key: imageKey,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException('创建产品失败: ' + error.message);
    }

    return product;
  }

  // 更新产品
  async update(id: number, data: UpdateProductData) {
    const supabase = this.getSupabase();
    const existing = await this.findOne(id);
    
    let imageKey: string | undefined = existing.image_key;
    let imageUrl: string | undefined = existing.image_url;

    // 更新图片（如果有新图片）
    if (data.imageFile && data.imageFile.buffer) {
      const filename = `products/${Date.now()}_${data.imageFile.originalname}`;
      imageKey = await this.storage.uploadFile({
        fileContent: data.imageFile.buffer,
        fileName: filename,
        contentType: data.imageFile.mimetype
      });
      imageUrl = await this.storage.generatePresignedUrl({ key: imageKey });
    }

    const { data: product, error } = await supabase
      .from('products')
      .update({
        name: data.name ?? existing.name,
        category_id: data.category_id ?? existing.category_id,
        models: data.models ?? existing.models,
        layout: data.layout ?? existing.layout,
        image_key: imageKey,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('更新产品失败: ' + error.message);
    }

    return product;
  }

  // 删除产品
  async remove(id: number) {
    const supabase = this.getSupabase();
    const product = await this.findOne(id);
    
    // 删除对象存储中的图片
    if (product.image_key) {
      try {
        await this.storage.deleteFile({ fileKey: product.image_key });
      } catch (e) {
        console.log('删除图片失败:', e.message);
      }
    }
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new BadRequestException('删除产品失败: ' + error.message);
    }
    
    return { success: true };
  }
}