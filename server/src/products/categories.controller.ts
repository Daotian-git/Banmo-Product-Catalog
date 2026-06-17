import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common'
import { CategoriesService } from './categories.service'

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // 获取所有分类（树形结构）
  @Get()
  async getCategories() {
    const categories = await this.categoriesService.findAll()
    // 构建树形结构
    const tree = this.buildTree(categories)
    return { code: 200, msg: 'success', data: tree }
  }

  // 获取所有分类（平铺列表）
  @Get('list')
  async getCategoryList() {
    const categories = await this.categoriesService.findAll()
    return { code: 200, msg: 'success', data: categories }
  }

  // 获取一级分类
  @Get('parents')
  async getParentCategories() {
    const parents = await this.categoriesService.findRootCategories()
    return { code: 200, msg: 'success', data: parents }
  }

  // 获取某个一级分类下的二级分类
  @Get('children/:parentId')
  async getChildren(@Param('parentId') parentId: string) {
    const children = await this.categoriesService.findChildCategories(Number(parentId))
    return { code: 200, msg: 'success', data: children }
  }

  // 创建分类
  @Post()
  @HttpCode(HttpStatus.OK)
  async createCategory(@Body() body: {
    name: string;
    parent_id?: number;
    sort_order?: number;
  }) {
    const category = await this.categoriesService.create({
      name: body.name,
      parent_id: body.parent_id || null,
      sort_order: body.sort_order || 0
    })
    return { code: 200, msg: 'success', data: category }
  }

  // 更新分类
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateCategory(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      parent_id?: number;
      sort_order?: number;
    }
  ) {
    const category = await this.categoriesService.update(Number(id), body)
    return { code: 200, msg: 'success', data: category }
  }

  // 删除分类
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteCategory(@Param('id') id: string) {
    await this.categoriesService.remove(Number(id))
    return { code: 200, msg: 'success', data: { id: Number(id) } }
  }

  // 构建树形结构
  private buildTree(categories: any[]) {
    const parents = categories.filter(c => !c.parent_id)
    const children = categories.filter(c => c.parent_id)
    
    return parents.map(parent => ({
      ...parent,
      children: children.filter(c => c.parent_id === parent.id)
    }))
  }
}