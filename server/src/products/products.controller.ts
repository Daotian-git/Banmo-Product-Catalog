import { Controller, Get, Post, Put, Delete, Body, Param, Query, UploadedFile, UseInterceptors, HttpCode } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { ProductsService } from './products.service'

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 获取产品列表
  @Get()
  @HttpCode(200)
  async getProducts(@Query('category_id') categoryId?: string) {
    const result = await this.productsService.getProducts(
      categoryId ? parseInt(categoryId) : undefined
    )
    return { code: 200, msg: 'success', data: result }
  }

  // 获取单个产品详情
  @Get(':id')
  @HttpCode(200)
  async getProduct(@Param('id') id: string) {
    const result = await this.productsService.getProductById(parseInt(id))
    return { code: 200, msg: 'success', data: result }
  }

  // 创建产品（含图片上传）
  @Post()
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  async createProduct(
    @Body() body: {
      name: string
      category_id: number
      price: string
      description?: string
      material?: string
      size?: string
      weight?: string
      process?: string
      origin?: string
      features?: string
    },
    @UploadedFile() file?: Express.Multer.File
  ) {
    console.log('创建产品请求:', body)
    console.log('上传文件:', file ? `${file.originalname} (${file.size} bytes)` : '无')

    const features = body.features ? JSON.parse(body.features) : []
    const result = await this.productsService.createProduct({
      ...body,
      features,
      imageFile: file
    })
    return { code: 200, msg: 'success', data: result }
  }

  // 更新产品
  @Put(':id')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  async updateProduct(
    @Param('id') id: string,
    @Body() body: {
      name?: string
      category_id?: number
      price?: string
      description?: string
      material?: string
      size?: string
      weight?: string
      process?: string
      origin?: string
      features?: string
    },
    @UploadedFile() file?: Express.Multer.File
  ) {
    console.log('更新产品请求:', id, body)
    const features = body.features ? JSON.parse(body.features) : undefined
    const result = await this.productsService.updateProduct(parseInt(id), {
      ...body,
      features,
      imageFile: file
    })
    return { code: 200, msg: 'success', data: result }
  }

  // 删除产品
  @Delete(':id')
  @HttpCode(200)
  async deleteProduct(@Param('id') id: string) {
    await this.productsService.deleteProduct(parseInt(id))
    return { code: 200, msg: 'success', data: null }
  }
}

@Controller('categories')
export class CategoriesController {
  constructor(private readonly productsService: ProductsService) {}

  // 获取分类列表
  @Get()
  @HttpCode(200)
  async getCategories() {
    const result = await this.productsService.getCategories()
    return { code: 200, msg: 'success', data: result }
  }

  // 创建分类
  @Post()
  @HttpCode(200)
  async createCategory(@Body() body: { name: string; icon?: string; sort_order?: number }) {
    const result = await this.productsService.createCategory(body)
    return { code: 200, msg: 'success', data: result }
  }

  // 更新分类
  @Put(':id')
  @HttpCode(200)
  async updateCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; icon?: string; sort_order?: number }
  ) {
    const result = await this.productsService.updateCategory(parseInt(id), body)
    return { code: 200, msg: 'success', data: result }
  }

  // 删除分类
  @Delete(':id')
  @HttpCode(200)
  async deleteCategory(@Param('id') id: string) {
    await this.productsService.deleteCategory(parseInt(id))
    return { code: 200, msg: 'success', data: null }
  }
}