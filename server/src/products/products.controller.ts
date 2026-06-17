import { Controller, Get, Post, Put, Delete, Body, Param, Query, UploadedFile, UploadedFiles, UseInterceptors, HttpCode, BadRequestException } from '@nestjs/common'
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { ProductsService } from './products.service'
import * as xlsx from 'xlsx'
import * as AdmZip from 'adm-zip'

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
      category_id?: number
      model?: string
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
    console.log('创建产品请求:', body)
    console.log('上传文件:', file ? `${file.originalname} (${file.size} bytes)` : '无')

    const features = body.features ? JSON.parse(body.features) : []
    const result = await this.productsService.createProduct({
      ...body,
      category_id: body.category_id,
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
    const result = await this.productsService.updateProduct(parseInt(id), {
      ...body,
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

  // 批量导入产品（Excel + ZIP图片包）
  @Post('batch-import')
  @HttpCode(200)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'excel', maxCount: 1 },
    { name: 'zip', maxCount: 1 }
  ], { storage: memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }))
  async batchImport(
    @UploadedFiles() files: { excel?: Express.Multer.File[], zip?: Express.Multer.File[] },
    @Body() body: { category_id?: string }
  ) {
    console.log('批量导入请求:', body)
    
    if (!files.excel?.[0]) {
      throw new BadRequestException('请上传Excel文件')
    }
    if (!files.zip?.[0]) {
      throw new BadRequestException('请上传ZIP图片包')
    }

    const excelFile = files.excel[0]
    const zipFile = files.zip[0]
    const categoryId = body.category_id ? parseInt(body.category_id) : undefined

    // 解析Excel
    const workbook = xlsx.read(excelFile.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json(sheet) as any[]

    console.log(`Excel解析完成: ${rows.length} 行数据`)

    // 解压ZIP获取图片
    const zip = new AdmZip(zipFile.buffer)
    const zipEntries = zip.getEntries()
    const imageMap: Map<string, Buffer> = new Map()

    zipEntries.forEach(entry => {
      if (!entry.isDirectory && entry.entryName.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
        const fileName = entry.entryName.split('/').pop() || entry.entryName
        imageMap.set(fileName, entry.getData())
        console.log(`图片: ${fileName}`)
      }
    })

    console.log(`ZIP解压完成: ${imageMap.size} 张图片`)

    // 批量创建产品
    const results: { success: any[], failed: any[] } = { success: [], failed: [] }

    for (const row of rows) {
      try {
        // Excel列名映射（支持中文和英文）
        const productData = {
          name: row['产品名称'] || row['name'] || row['名称'] || '',
          model: row['型号'] || row['model'] || '',
          material: row['材质'] || row['material'] || '',
          size: row['尺寸'] || row['size'] || '',
          process: row['工艺'] || row['process'] || '',
          origin: row['产地'] || row['origin'] || '',
          imageName: row['图片文件名'] || row['image'] || row['图片'] || ''
        }

        if (!productData.name) {
          results.failed.push({ row, reason: '缺少产品名称' })
          continue
        }

        // 根据文件名匹配图片
        let imageBuffer: Buffer | undefined
        if (productData.imageName && imageMap.has(productData.imageName)) {
          imageBuffer = imageMap.get(productData.imageName)
        }

        // 创建产品
        const product = await this.productsService.createProduct({
          name: productData.name,
          category_id: categoryId,
          model: productData.model,
          material: productData.material,
          size: productData.size,
          process: productData.process,
          origin: productData.origin,
          imageBuffer
        })

        results.success.push(product)
        console.log(`创建成功: ${productData.name}`)
      } catch (error: any) {
        results.failed.push({ row, reason: error.message })
        console.error(`创建失败:`, error.message)
      }
    }

    return {
      code: 200,
      msg: '批量导入完成',
      data: {
        total: rows.length,
        success: results.success.length,
        failed: results.failed.length,
        failedItems: results.failed
      }
    }
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