import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '../storage/database/supabase-client'
import { S3Storage } from 'coze-coding-dev-sdk'

interface CreateProductData {
  name: string
  category_id: number
  price: string
  description?: string
  material?: string
  size?: string
  weight?: string
  process?: string
  origin?: string
  features?: string[]
  imageFile?: Express.Multer.File
}

interface UpdateProductData {
  name?: string
  category_id?: number
  price?: string
  description?: string
  material?: string
  size?: string
  weight?: string
  process?: string
  origin?: string
  features?: string[]
  imageFile?: Express.Multer.File
}

@Injectable()
export class ProductsService {
  private client = getSupabaseClient()
  private storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: '',
    secretKey: '',
    bucketName: process.env.COZE_BUCKET_NAME,
    region: 'cn-beijing',
  })

  // 获取产品列表
  async getProducts(categoryId?: number) {
    let query = this.client
      .from('products')
      .select('id, name, category_id, price, description, image_url, material, size, weight, process, origin, features, sort_order, created_at, categories(id, name, icon)')
      .order('sort_order', { ascending: false })
      .order('created_at', { ascending: false })

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query.limit(100)
    if (error) throw new Error(`查询产品失败: ${error.message}`)

    // 刷新图片URL（签名URL可能过期）
    const products = data as any[]
    for (const product of products) {
      if (product.image_key) {
        product.image_url = await this.storage.generatePresignedUrl({
          key: product.image_key,
          expireTime: 86400
        })
      }
    }

    return products
  }

  // 获取单个产品
  async getProductById(id: number) {
    const { data, error } = await this.client
      .from('products')
      .select('id, name, category_id, price, description, image_url, image_key, material, size, weight, process, origin, features, sort_order, created_at, updated_at, categories(id, name, icon)')
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(`查询产品详情失败: ${error.message}`)

    // 刷新图片URL
    if (data && (data as any).image_key) {
      (data as any).image_url = await this.storage.generatePresignedUrl({
        key: (data as any).image_key,
        expireTime: 86400
      })
    }

    return data
  }

  // 创建产品
  async createProduct(data: CreateProductData) {
    let imageKey: string | undefined
    let imageUrl: string | undefined

    // 上传图片到对象存储
    if (data.imageFile && data.imageFile.buffer) {
      const fileName = `products/${Date.now()}_${data.imageFile.originalname}`
      imageKey = await this.storage.uploadFile({
        fileContent: data.imageFile.buffer,
        fileName: fileName,
        contentType: data.imageFile.mimetype
      })
      imageUrl = await this.storage.generatePresignedUrl({
        key: imageKey,
        expireTime: 86400
      })
      console.log('图片上传成功:', imageKey)
    }

    const { data: result, error } = await this.client
      .from('products')
      .insert({
        name: data.name,
        category_id: data.category_id,
        price: data.price,
        description: data.description,
        material: data.material,
        size: data.size,
        weight: data.weight,
        process: data.process,
        origin: data.origin,
        features: data.features,
        image_key: imageKey,
        image_url: imageUrl,
        sort_order: 0
      })
      .select()

    if (error) throw new Error(`创建产品失败: ${error.message}`)
    return result?.[0]
  }

  // 更新产品
  async updateProduct(id: number, data: UpdateProductData) {
    let imageKey: string | undefined
    let imageUrl: string | undefined

    // 上传新图片
    if (data.imageFile && data.imageFile.buffer) {
      const fileName = `products/${Date.now()}_${data.imageFile.originalname}`
      imageKey = await this.storage.uploadFile({
        fileContent: data.imageFile.buffer,
        fileName: fileName,
        contentType: data.imageFile.mimetype
      })
      imageUrl = await this.storage.generatePresignedUrl({
        key: imageKey,
        expireTime: 86400
      })
      console.log('图片更新成功:', imageKey)
    }

    const updateData: any = { ...data, updated_at: new Date().toISOString() }
    if (imageKey) {
      updateData.image_key = imageKey
      updateData.image_url = imageUrl
    }
    delete updateData.imageFile

    const { data: result, error } = await this.client
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw new Error(`更新产品失败: ${error.message}`)
    return result?.[0]
  }

  // 删除产品
  async deleteProduct(id: number) {
    // 先获取产品信息，删除图片
    const product = await this.getProductById(id)
    if (product && (product as any).image_key) {
      try {
        await this.storage.deleteFile({ fileKey: (product as any).image_key })
        console.log('图片删除成功:', (product as any).image_key)
      } catch (err) {
        console.warn('图片删除失败:', err)
      }
    }

    const { error } = await this.client
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`删除产品失败: ${error.message}`)
  }

  // 获取分类列表
  async getCategories() {
    const { data, error } = await this.client
      .from('categories')
      .select('id, name, icon, sort_order, created_at')
      .order('sort_order', { ascending: false })

    if (error) throw new Error(`查询分类失败: ${error.message}`)
    return data
  }

  // 创建分类
  async createCategory(data: { name: string; icon?: string; sort_order?: number }) {
    const { data: result, error } = await this.client
      .from('categories')
      .insert({
        name: data.name,
        icon: data.icon || '📋',
        sort_order: data.sort_order || 0
      })
      .select()

    if (error) throw new Error(`创建分类失败: ${error.message}`)
    return result?.[0]
  }

  // 更新分类
  async updateCategory(id: number, data: { name?: string; icon?: string; sort_order?: number }) {
    const { data: result, error } = await this.client
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()

    if (error) throw new Error(`更新分类失败: ${error.message}`)
    return result?.[0]
  }

  // 删除分类
  async deleteCategory(id: number) {
    const { error } = await this.client
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`删除分类失败: ${error.message}`)
  }
}