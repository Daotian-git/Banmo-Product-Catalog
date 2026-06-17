import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'

// PC端Web管理后台 - 产品图册管理
const AdminWebPage = () => {
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products')
  
  // 新增产品表单
  const [newProduct, setNewProduct] = useState({
    name: '',
    categoryId: '',
    model: '',
    material: '',
    size: '',
    process: '',
    origin: ''
  })
  const [selectedImage, setSelectedImage] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // 新增分类表单
  const [newCategory, setNewCategory] = useState({ name: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // 加载分类
      const catRes = await Network.request({ url: '/api/categories' })
      console.log('分类响应:', catRes.data)
      if (catRes.data?.code === 200) {
        setCategories(catRes.data.data || [])
      }
      
      // 加载产品
      const prodRes = await Network.request({ url: '/api/products' })
      console.log('产品响应:', prodRes.data)
      if (prodRes.data?.code === 200) {
        setProducts(prodRes.data.data || [])
      }
    } catch (e) {
      console.error('加载数据失败:', e)
    }
    setLoading(false)
  }

  // 选择图片（仅预览，不上传）
  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] })
      setSelectedImage(res.tempFilePaths[0])
    } catch (e) {
      console.error('选择图片失败:', e)
    }
  }

  // 提交产品（图片和表单一起上传）
  const handleAddProduct = async () => {
    if (!newProduct.name) {
      Taro.showToast({ title: '请填写产品名称', icon: 'none' })
      return
    }
    if (!selectedImage) {
      Taro.showToast({ title: '请选择产品图片', icon: 'none' })
      return
    }
    
    try {
      setUploading(true)
      
      // 使用 uploadFile 同时上传图片和表单数据
      const uploadRes = await Network.uploadFile({
        url: '/api/products',
        filePath: selectedImage,
        name: 'image',  // 后端 FileInterceptor('image')
        formData: {
          name: newProduct.name,
          category_id: newProduct.categoryId,
          model: newProduct.model,
          material: newProduct.material,
          size: newProduct.size,
          process: newProduct.process,
          origin: newProduct.origin
        }
      })
      
      console.log('上传响应:', uploadRes.data)
      const response = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data
      
      if (response?.code === 200) {
        Taro.showToast({ title: '添加成功', icon: 'success' })
        setNewProduct({
          name: '', categoryId: '', model: '', material: '',
          size: '', process: '', origin: ''
        })
        setSelectedImage('')
        loadData()
      } else {
        Taro.showToast({ title: response?.msg || '添加失败', icon: 'none' })
      }
    } catch (e) {
      console.error('添加失败:', e)
      Taro.showToast({ title: '添加失败', icon: 'none' })
    }
    setUploading(false)
  }

  // 提交分类
  const handleAddCategory = async () => {
    if (!newCategory.name) {
      Taro.showToast({ title: '请填写分类名称', icon: 'none' })
      return
    }
    
    try {
      const res = await Network.request({
        url: '/api/categories',
        method: 'POST',
        data: newCategory
      })
      console.log('添加分类响应:', res.data)
      
      if (res.data?.code === 200) {
        Taro.showToast({ title: '添加成功', icon: 'success' })
        setNewCategory({ name: '' })
        loadData()
      } else {
        Taro.showToast({ title: res.data?.msg || '添加失败', icon: 'none' })
      }
    } catch (e) {
      console.error('添加失败:', e)
      Taro.showToast({ title: '添加失败', icon: 'none' })
    }
  }

  // 删除产品
  const handleDeleteProduct = async (id: number) => {
    try {
      const res = await Network.request({
        url: `/api/products/${id}`,
        method: 'DELETE'
      })
      if (res.data?.code === 200) {
        Taro.showToast({ title: '删除成功', icon: 'success' })
        loadData()
      }
    } catch (e) {
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  // 删除分类
  const handleDeleteCategory = async (id: number) => {
    try {
      const res = await Network.request({
        url: `/api/categories/${id}`,
        method: 'DELETE'
      })
      if (res.data?.code === 200) {
        Taro.showToast({ title: '删除成功', icon: 'success' })
        loadData()
      }
    } catch (e) {
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  return (
    <View className="min-h-screen bg-gray-100 p-4">
      {/* 标题 */}
      <View className="mb-6">
        <Text className="block text-2xl font-bold text-gray-800">产品图册管理后台</Text>
        <Text className="block text-sm text-gray-500 mt-1">管理分类和产品信息</Text>
      </View>

      {/* Tab切换 */}
      <View className="flex flex-row gap-2 mb-4">
        <Button 
          variant={activeTab === 'products' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('products')}
        >
          <Text>产品管理</Text>
        </Button>
        <Button 
          variant={activeTab === 'categories' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('categories')}
        >
          <Text>分类管理</Text>
        </Button>
      </View>

      {/* 主内容区 - PC布局 */}
      <View className="flex flex-row gap-4" style={{ minHeight: '400px' }}>
        {/* 左侧：表单 */}
        <View className="flex-1">
          {activeTab === 'products' ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Text className="text-lg font-semibold">添加产品</Text>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 图片选择 */}
                <View>
                  <Text className="block text-sm text-gray-600 mb-2">产品图片 *</Text>
                  <View className="flex flex-row gap-2">
                    {selectedImage ? (
                      <Image 
                        className="w-32 h-32 rounded border border-gray-200 object-cover"
                        src={selectedImage}
                        mode="aspectFill"
                      />
                    ) : (
                      <View 
                        className="w-32 h-32 rounded border border-gray-200 bg-gray-50 flex items-center justify-center"
                        onClick={handleChooseImage}
                      >
                        <Text className="block text-gray-400 text-xs">点击选择图片</Text>
                      </View>
                    )}
                    <Button variant="outline" size="sm" onClick={handleChooseImage}>
                      <Text>选择图片</Text>
                    </Button>
                  </View>
                </View>

                {/* 分类选择 */}
                <View>
                  <Text className="block text-sm text-gray-600 mb-2">所属分类 *</Text>
                  <View 
                    className="bg-gray-50 rounded px-3 py-2 flex flex-row justify-between items-center"
                    onClick={() => {
                      if (categories.length === 0) {
                        Taro.showToast({ title: '请先添加分类', icon: 'none' })
                        return
                      }
                      Taro.showActionSheet({
                        itemList: categories.map(cat => cat.name),
                        success: (res) => {
                          setNewProduct({ ...newProduct, categoryId: String(categories[res.tapIndex].id) })
                        }
                      })
                    }}
                  >
                    <Text className="block text-sm">
                      {newProduct.categoryId 
                        ? categories.find(c => String(c.id) === newProduct.categoryId)?.name || '请选择分类'
                        : '请选择分类'}
                    </Text>
                    <Text className="block text-gray-400">▼</Text>
                  </View>
                </View>

                {/* 产品名称 */}
                <View>
                  <Text className="block text-sm text-gray-600 mb-2">产品名称 *</Text>
                  <View className="bg-gray-50 rounded px-3 py-2">
                    <Input 
                      className="w-full bg-transparent text-sm"
                      placeholder="如：明式圈椅"
                      value={newProduct.name}
                      onInput={(e: any) => setNewProduct({ ...newProduct, name: e.detail.value })}
                    />
                  </View>
                </View>

                {/* 产品型号 */}
                <View>
                  <Text className="block text-sm text-gray-600 mb-2">产品型号</Text>
                  <View className="bg-gray-50 rounded px-3 py-2">
                    <Input 
                      className="w-full bg-transparent text-sm"
                      placeholder="如：MXQY-001"
                      value={newProduct.model}
                      onInput={(e: any) => setNewProduct({ ...newProduct, model: e.detail.value })}
                    />
                  </View>
                </View>

                {/* 材质 */}
                <View>
                  <Text className="block text-sm text-gray-600 mb-2">材质</Text>
                  <View className="bg-gray-50 rounded px-3 py-2">
                    <Input 
                      className="w-full bg-transparent text-sm"
                      placeholder="如：北美黑胡桃木"
                      value={newProduct.material}
                      onInput={(e: any) => setNewProduct({ ...newProduct, material: e.detail.value })}
                    />
                  </View>
                </View>

                {/* 尺寸 */}
                <View>
                  <Text className="block text-sm text-gray-600 mb-2">尺寸</Text>
                  <View className="bg-gray-50 rounded px-3 py-2">
                    <Input 
                      className="w-full bg-transparent text-sm"
                      placeholder="如：120×60×45cm"
                      value={newProduct.size}
                      onInput={(e: any) => setNewProduct({ ...newProduct, size: e.detail.value })}
                    />
                  </View>
                </View>

                {/* 工艺 */}
                <View>
                  <Text className="block text-sm text-gray-600 mb-2">工艺</Text>
                  <View className="bg-gray-50 rounded px-3 py-2">
                    <Input 
                      className="w-full bg-transparent text-sm"
                      placeholder="如：榫卯结构，手工打磨"
                      value={newProduct.process}
                      onInput={(e: any) => setNewProduct({ ...newProduct, process: e.detail.value })}
                    />
                  </View>
                </View>

                {/* 产地 */}
                <View>
                  <Text className="block text-sm text-gray-600 mb-2">产地</Text>
                  <View className="bg-gray-50 rounded px-3 py-2">
                    <Input 
                      className="w-full bg-transparent text-sm"
                      placeholder="如：浙江东阳"
                      value={newProduct.origin}
                      onInput={(e: any) => setNewProduct({ ...newProduct, origin: e.detail.value })}
                    />
                  </View>
                </View>

                {/* 提交按钮 */}
                <Button 
                  className="w-full bg-amber-800 text-white"
                  onClick={handleAddProduct}
                  disabled={uploading}
                >
                  <Text>{uploading ? '上传中...' : '提交产品'}</Text>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Text className="text-lg font-semibold">添加分类</Text>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <View>
                  <Text className="block text-sm text-gray-600 mb-2">分类名称 *</Text>
                  <View className="bg-gray-50 rounded px-3 py-2">
                    <Input 
                      className="w-full bg-transparent text-sm"
                      placeholder="如：座椅系列"
                      value={newCategory.name}
                      onInput={(e: any) => setNewCategory({ name: e.detail.value })}
                    />
                  </View>
                </View>
                <Button 
                  className="w-full bg-amber-800 text-white"
                  onClick={handleAddCategory}
                >
                  <Text>提交分类</Text>
                </Button>
              </CardContent>
            </Card>
          )}
        </View>

        {/* 右侧：列表 */}
        <View className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>
                <Text className="text-lg font-semibold">
                  {activeTab === 'products' ? '产品列表' : '分类列表'}
                </Text>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Text className="block text-gray-400 text-sm">加载中...</Text>
              ) : activeTab === 'products' ? (
                products.length > 0 ? (
                  <View className="space-y-2">
                    {products.map(product => (
                      <View 
                        key={product.id}
                        className="flex flex-row items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <View className="flex flex-row items-center gap-2">
                          {product.image_url ? (
                            <Image className="w-12 h-12 rounded" src={product.image_url} mode="aspectFill" />
                          ) : (
                            <View className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                              <Text className="block text-gray-400 text-xs">无图</Text>
                            </View>
                          )}
                          <View>
                            <Text className="block text-sm font-medium text-gray-800">{product.name}</Text>
                            <Text className="block text-xs text-gray-500">{product.categories?.name || '未分类'}</Text>
                          </View>
                        </View>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Text className="text-red-500 text-xs">删除</Text>
                        </Button>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="block text-gray-400 text-sm">暂无产品，请先添加分类</Text>
                )
              ) : (
                categories.length > 0 ? (
                  <View className="space-y-2">
                    {categories.map(cat => (
                      <View 
                        key={cat.id}
                        className="flex flex-row items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <View className="flex flex-row items-center gap-2">
                          <Badge className="bg-amber-800 text-white px-2 py-1 text-xs">
                            ID: {cat.id}
                          </Badge>
                          <Text className="block text-sm text-gray-800">{cat.name}</Text>
                        </View>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCategory(cat.id)}
                        >
                          <Text className="text-red-500 text-xs">删除</Text>
                        </Button>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="block text-gray-400 text-sm">暂无分类</Text>
                )
              )}
            </CardContent>
          </Card>
        </View>
      </View>
    </View>
  )
}

export default AdminWebPage