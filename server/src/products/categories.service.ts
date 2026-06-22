import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { getSupabaseClient } from '../storage/database/supabase-client';

@Injectable()
export class CategoriesService {
  private getSupabase() {
    return getSupabaseClient();
  }

  // 获取所有分类（树形结构）
  async findAll() {
    const supabase = this.getSupabase();
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    
    if (error) {
      console.error('获取分类失败:', error);
      return [];
    }

    // 构建树形结构
    const rootCategories = categories?.filter(c => c.parent_id === null) || [];
    const childCategories = categories?.filter(c => c.parent_id !== null) || [];
    
    return rootCategories.map(root => ({
      ...root,
      children: childCategories.filter(child => child.parent_id === root.id)
    }));
  }

  // 获取一级分类（材质分类）
  async findRootCategories() {
    const supabase = this.getSupabase();
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('获取一级分类失败:', error);
      return [];
    }
    
    return categories || [];
  }

  // 获取二级分类（产品类型）
  async findChildCategories(parentId: number) {
    const supabase = this.getSupabase();
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('获取二级分类失败:', error);
      return [];
    }
    
    return categories || [];
  }

  // 获取单个分类
  async findOne(id: number) {
    const supabase = this.getSupabase();
    
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !category) {
      throw new NotFoundException(`分类 #${id} 不存在`);
    }
    
    return category;
  }

  // 创建分类
  async create(data: { name: string; parent_id?: number | null; sort_order?: number }) {
    const supabase = this.getSupabase();
    
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name: data.name,
        parent_id: data.parent_id || null,
        sort_order: data.sort_order || 0,
      })
      .select()
      .single();
    
    if (error) {
      throw new BadRequestException('创建分类失败: ' + error.message);
    }
    
    return category;
  }

  // 更新分类
  async update(id: number, data: { name?: string; parent_id?: number | null; sort_order?: number }) {
    const supabase = this.getSupabase();
    
    const { data: category, error } = await supabase
      .from('categories')
      .update({
        name: data.name,
        parent_id: data.parent_id,
        sort_order: data.sort_order,
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new BadRequestException('更新分类失败: ' + error.message);
    }
    
    return category;
  }

  // 删除分类
  async remove(id: number) {
    const supabase = this.getSupabase();
    
    // 检查是否有子分类
    const { data: children } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', id);
    
    if (children && children.length > 0) {
      throw new BadRequestException('该分类下还有子分类，请先删除子分类');
    }
    
    // 检查是否有产品
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id);
    
    if (products && products.length > 0) {
      throw new BadRequestException('该分类下还有产品，请先删除或移动产品');
    }
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new BadRequestException('删除分类失败: ' + error.message);
    }
    
    return { success: true };
  }
}