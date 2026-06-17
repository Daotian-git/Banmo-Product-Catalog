import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Network } from '@/network'

interface Category {
  id: number
  name: string
  icon: string
}

interface Product {
  id: number
  name: string
  category_id: number
  price: string
  description: string
  image_url: string
  material?: string
  size?: string
  weight?: string
  process?: string
  origin?: string
  features?: string[]
  categories?: Category
}

const AdminPage = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imagePath, setImagePath] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    category_id: 0,
    price: '',
    description: '',
    material: '',
    size: '',
    weight: '',
    process: '',
    origin: '',
    features: ''
  })

  // 加载分类和产品
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // 加载分类
      const catRes = await Network.request({ url: '/api/categories' })
      console.log('分类响应:', catRes.data)
      if (catRes.data?.code === 200 && catRes.data?.data) {
        setCategories(catRes.data.data as Category[])
      }

      // 加载产品
      const prodRes = await Network.request({ url: '/api/products' })
      console.log('产品响应:', prodRes.data)
      if (prodRes.data?.code === 200 && prodRes.data?.data) {
        setProducts(prodRes.data.data as Product[])
      }
    } catch (err) {
      console.error('加载数据失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  // 选择并上传图片
  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      const tempFilePath = res.tempFilePaths[0]
      setImagePath(tempFilePath)
      setImageUrl(tempFilePath) // 先用临时路径预览

      Taro.showToast({ title: '上传中...', icon: 'loading' })

      // 上传图片
      const uploadRes = await Network.uploadFile({
        url: '/api/products',
        filePath: tempFilePath,
        name: 'image',
        formData: {
          name: formData.name || '临时产品',
          category_id: String(formData.category_id || categories[0]?.id || 1),
          price: formData.price || '0',
          description: formData.description || '',
          material: formData.material || '',
          size: formData.size || '',
          weight: formData.weight || '',
          process: formData.process || '',
          origin: formData.origin || '',
          features: formData.features || ''
        }
      })

      console.log('上传响应:', uploadRes.data)

      // 解析返回的数据
      interface UploadResult {
        code?: number
        msg?: string
        data?: {
          id?: number
          name?: string
          image_url?: string
        }
      }
      let result: UploadResult = uploadRes.data as UploadResult
      if (typeof uploadRes.data === 'string') {
        try {
          result = JSON.parse(uploadRes.data) as UploadResult
        } catch (e) {
          console.warn('解析上传响应失败')
        }
      }

      if (result?.code === 200 && result?.data) {
        setImageUrl(result.data.image_url || '')
        Taro.showToast({ title: '图片上传成功', icon: 'success' })
        // 刷新产品列表
        loadData()
        setShowForm(false)
        resetForm()
      } else {
        Taro.showToast({ title: '上传失败', icon: 'none' })
      }
    } catch (err) {
      console.error('上传失败:', err)
      Taro.showToast({ title: '上传失败', icon: 'none' })
    }
  }

  // 提交表单（创建产品）
  const handleSubmit = async () => {
    if (!formData.name || !formData.category_id || !formData.price) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    try {
      Taro.showToast({ title: '提交中...', icon: 'loading' })

      if (imagePath) {
        // 有图片时使用 uploadFile
        const uploadRes = await Network.uploadFile({
          url: '/api/products',
          filePath: imagePath,
          name: 'image',
          formData: {
            name: formData.name,
            category_id: String(formData.category_id),
            price: formData.price,
            description: formData.description,
            material: formData.material,
            size: formData.size,
            weight: formData.weight,
            process: formData.process,
            origin: formData.origin,
            features: formData.features
          }
        })

        console.log('创建响应:', uploadRes.data)
        interface UploadResult {
          code?: number
          msg?: string
          data?: {
            id?: number
            name?: string
            image_url?: string
          }
        }
        let result: UploadResult = uploadRes.data as UploadResult
        if (typeof uploadRes.data === 'string') {
          result = JSON.parse(uploadRes.data) as UploadResult
        }

        if (result?.code === 200) {
          Taro.showToast({ title: '创建成功', icon: 'success' })
          loadData()
          setShowForm(false)
          resetForm()
        } else {
          Taro.showToast({ title: '创建失败', icon: 'none' })
        }
      } else {
        // 无图片时使用普通 POST
        const res = await Network.request({
          url: '/api/products',
          method: 'POST',
          data: {
            name: formData.name,
            category_id: formData.category_id,
            price: formData.price,
            description: formData.description,
            material: formData.material,
            size: formData.size,
            weight: formData.weight,
            process: formData.process,
            origin: formData.origin,
            features: formData.features ? JSON.parse(formData.features) : []
          }
        })

        console.log('创建响应:', res.data)
        if (res.data?.code === 200) {
          Taro.showToast({ title: '创建成功', icon: 'success' })
          loadData()
          setShowForm(false)
          resetForm()
        } else {
          Taro.showToast({ title: '创建失败', icon: 'none' })
        }
      }
    } catch (err) {
      console.error('创建失败:', err)
      Taro.showToast({ title: '创建失败', icon: 'none' })
    }
  }

  // 删除产品
  const handleDelete = async (id: number) => {
    const confirm = await Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？'
    })

    if (!confirm.confirm) return

    try {
      const res = await Network.request({
        url: `/api/products/${id}`,
        method: 'DELETE'
      })

      console.log('删除响应:', res.data)
      if (res.data?.code === 200) {
        Taro.showToast({ title: '删除成功', icon: 'success' })
        loadData()
      } else {
        Taro.showToast({ title: '删除失败', icon: 'none' })
      }
    } catch (err) {
      console.error('删除失败:', err)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      category_id: 0,
      price: '',
      description: '',
      material: '',
      size: '',
      weight: '',
      process: '',
      origin: '',
      features: ''
    })
    setImageUrl('')
    setImagePath('')
    setEditingProduct(null)
  }

  return (
    <View className="min-h-full bg-gray-50 pb-12">
      {/* 标题 */}
      <View className="px-4 pt-4 pb-2">
        <Text className="block text-lg font-semibold text-gray-700">产品管理后台</Text>
        <Text className="block text-sm text-gray-500 mt-1">上传产品图片、录入产品信息</Text>
      </View>

      {/* 操作按钮 */}
      <View className="px-4 py-3 flex flex-row gap-2">
        <Button
          className="bg-amber-900 text-white rounded-lg px-4"
          onClick={() => setShowForm(true)}
        >
          <Text className="text-white">添加产品</Text>
        </Button>
        <Button
          className="bg-gray-200 text-gray-700 rounded-lg px-4"
          onClick={() => loadData()}
        >
          <Text className="text-gray-700">刷新列表</Text>
        </Button>
      </View>

      {/* 添加产品表单 */}
      {showForm && (
        <Card className="mx-4 mt-3 bg-white rounded-lg border border-gray-200">
          <CardHeader className="pb-2">
            <View className="flex flex-row justify-between items-center">
              <CardTitle className="text-base text-gray-700">
                {editingProduct ? '编辑产品' : '添加新产品'}
              </CardTitle>
              <Badge
                className="bg-gray-100 text-gray-600 px-2 py-1 rounded cursor-pointer"
                onClick={() => { setShowForm(false); resetForm() }}
              >
                取消
              </Badge>
            </View>
          </CardHeader>
          <CardContent className="pt-0">
            {/* 图片上传 */}
            <View className="mb-4">
              <Text className="block text-sm text-gray-500 mb-2">产品图片</Text>
              <View className="flex flex-row gap-2">
                {imageUrl && (
                  <Image
                    className="w-20 h-20 rounded-lg"
                    src={imageUrl}
                    mode="aspectFill"
                  />
                )}
                <Button
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                  onClick={handleChooseImage}
                >
                  <Text className="text-sm text-gray-600">选择图片</Text>
                </Button>
              </View>
            </View>

            <Separator className="my-3" />

            {/* 基本信息 */}
            <View className="space-y-3">
              <View>
                <Text className="block text-sm text-gray-500 mb-1">产品名称 *</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="w-full bg-transparent text-sm"
                    placeholder="如：明式圈椅"
                    value={formData.name}
                    onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-500 mb-1">分类 *</Text>
                <View className="flex flex-row gap-2 flex-wrap">
                  {categories.map(cat => (
                    <Badge
                      key={cat.id}
                      className={`px-3 py-2 rounded-lg cursor-pointer ${
                        formData.category_id === cat.id
                          ? 'bg-amber-900 text-white'
                          : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}
                      onClick={() => setFormData({ ...formData, category_id: cat.id })}
                    >
                      {cat.icon} {cat.name}
                    </Badge>
                  ))}
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-500 mb-1">价格 *</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="w-full bg-transparent text-sm"
                    placeholder="如：12800"
                    value={formData.price}
                    onInput={(e) => setFormData({ ...formData, price: e.detail.value })}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-500 mb-1">产品描述</Text>
                <View className="bg-gray-50 rounded-lg p-3">
                  <Textarea
                    style={{ width: '100%', minHeight: '60px', backgroundColor: 'transparent' }}
                    placeholder="如：经典明式设计，榫卯结构..."
                    value={formData.description}
                    onInput={(e) => setFormData({ ...formData, description: e.detail.value })}
                  />
                </View>
              </View>
            </View>

            <Separator className="my-3" />

            {/* 详细参数 */}
            <View className="space-y-3">
              <View>
                <Text className="block text-sm text-gray-500 mb-1">材质</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="w-full bg-transparent text-sm"
                    placeholder="如：北美黑胡桃木"
                    value={formData.material}
                    onInput={(e) => setFormData({ ...formData, material: e.detail.value })}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-500 mb-1">尺寸</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="w-full bg-transparent text-sm"
                    placeholder="如：宽58cm × 深48cm × 高85cm"
                    value={formData.size}
                    onInput={(e) => setFormData({ ...formData, size: e.detail.value })}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-500 mb-1">重量</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="w-full bg-transparent text-sm"
                    placeholder="如：约12kg"
                    value={formData.weight}
                    onInput={(e) => setFormData({ ...formData, weight: e.detail.value })}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-500 mb-1">工艺</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="w-full bg-transparent text-sm"
                    placeholder="如：传统榫卯工艺"
                    value={formData.process}
                    onInput={(e) => setFormData({ ...formData, process: e.detail.value })}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-500 mb-1">产地</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="w-full bg-transparent text-sm"
                    placeholder="如：浙江东阳"
                    value={formData.origin}
                    onInput={(e) => setFormData({ ...formData, origin: e.detail.value })}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-500 mb-1">产品特点（JSON数组）</Text>
                <View className="bg-gray-50 rounded-lg p-3">
                  <Textarea
                    style={{ width: '100%', minHeight: '60px', backgroundColor: 'transparent' }}
                    placeholder='["榫卯结构", "实木定制"]'
                    value={formData.features}
                    onInput={(e) => setFormData({ ...formData, features: e.detail.value })}
                  />
                </View>
              </View>
            </View>

            {/* 提交按钮 */}
            <View className="mt-4">
              <Button
                className="w-full bg-amber-900 text-white rounded-lg py-3"
                onClick={handleSubmit}
              >
                <Text className="text-white">提交产品</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      )}

      {/* 产品列表 */}
      <View className="px-4 mt-4">
        <Text className="block text-base font-semibold text-gray-700 mb-2">
          产品列表 ({products.length})
        </Text>
      </View>

      <View className="px-4">
        {products.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-8">
            <Text className="block text-gray-400 text-sm">暂无产品，请添加</Text>
          </View>
        ) : (
          products.map(product => (
            <Card
              key={product.id}
              className="mb-3 bg-white rounded-lg border border-gray-100"
            >
              <CardContent className="p-3 flex flex-row gap-3">
                {product.image_url && (
                  <Image
                    className="w-20 h-20 rounded-lg"
                    src={product.image_url}
                    mode="aspectFill"
                  />
                )}
                <View className="flex-1">
                  <Text className="block text-base font-medium text-gray-700">{product.name}</Text>
                  <Text className="block text-xs text-gray-500 mt-1">
                    {product.categories?.icon} {product.categories?.name}
                  </Text>
                  <Text className="block text-amber-900 font-semibold mt-1">¥{product.price}</Text>
                </View>
                <Badge
                  className="bg-red-50 text-red-600 px-2 py-1 rounded cursor-pointer border border-red-200"
                  onClick={() => handleDelete(product.id)}
                >
                  删除
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </View>
    </View>
  )
}

export default AdminPage