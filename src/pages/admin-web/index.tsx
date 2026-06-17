import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
    description: '',
    material: '',
    size: '',
    weight: '',
    process: '',
    origin: '',
    features: ''
  })
  const [selectedImage, setSelectedImage] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // 新增分类表单
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })

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

  // 选择图片
  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] })
      const tempFilePath = res.tempFilePaths[0]
      setSelectedImage(tempFilePath)
      
      // 上传图片
      setUploading(true)
      const uploadRes = await Network.uploadFile({
        url: '/api/products/upload',
        filePath: tempFilePath,
        name: 'file'
      })
      console.log('上传响应:', uploadRes.data)
      
      // 解析响应
      const response = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data
      if (response?.code === 200 && response?.data?.imageUrl) {
        setSelectedImage(response.data.imageUrl)
        Taro.showToast({ title: '图片上传成功', icon: 'success' })
      } else {
        Taro.showToast({ title: '上传失败', icon: 'none' })
      }
    } catch (e) {
      console.error('上传失败:', e)
      Taro.showToast({ title: '上传失败', icon: 'none' })
    }
    setUploading(false)
  }

  // 提交产品
  const handleAddProduct = async () => {
    if (!newProduct.name || !selectedImage) {
      Taro.showToast({ title: '请填写产品名称并上传图片', icon: 'none' })
      return
    }
    
    try {
      const res = await Network.request({
        url: '/api/products',
        method: 'POST',
        data: {
          ...newProduct,
          imageUrl: selectedImage,
          features: newProduct.features.split(',').map(f => f.trim()).filter(Boolean)
        }
      })
      console.log('添加产品响应:', res.data)
      
      if (res.data?.code === 200) {
        Taro.showToast({ title: '添加成功', icon: 'success' })
        setNewProduct({
          name: '', categoryId: '', description: '', material: '',
          size: '', weight: '', process: '', origin: '', features: ''
        })
        setSelectedImage('')
        loadData()
      } else {
        Taro.showToast({ title: res.data?.msg || '添加失败', icon: 'none' })
      }
    } catch (e) {
      console.error('添加失败:', e)
      Taro.showToast({ title: '添加失败', icon: 'none' })
    }
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
        setNewCategory({ name: '', description: '' })
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
    <View className="min-h-screen bg-gray-100 p-6">
      {/* 页面标题 */}
      <View className="mb-6">
        <Text className="block text-2xl font-bold text-gray-800">雅木轩 · 产品图册管理后台</Text>
        <Text className="block text-sm text-gray-500 mt-1">通过此页面管理产品分类和产品信息</Text>
      </View>

      {/* Tab切换 */}
      <View className="flex flex-row gap-4 mb-6">
        <View 
          className={`px-6 py-3 rounded-lg cursor-pointer ${activeTab === 'products' ? 'bg-amber-900 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          onClick={() => setActiveTab('products')}
        >
          <Text className="block font-medium">产品管理</Text>
        </View>
        <View 
          className={`px-6 py-3 rounded-lg cursor-pointer ${activeTab === 'categories' ? 'bg-amber-900 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          onClick={() => setActiveTab('categories')}
        >
          <Text className="block font-medium">分类管理</Text>
        </View>
      </View>

      {/* 产品管理 */}
      {activeTab === 'products' && (
        <View className="flex flex-row gap-6">
          {/* 左侧：新增产品表单 */}
          <Card className="w-96 bg-white rounded-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">新增产品</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="space-y-4">
                {/* 图片上传 */}
                <View>
                  <Text className="block text-sm text-gray-600 mb-2">产品图片 *</Text>
                  <View className="border border-gray-200 rounded-lg p-4">
                    {selectedImage ? (
                      <View className="flex flex-col items-center">
                        <Image className="w-48 h-48 rounded-lg" src={selectedImage} mode="aspectFill" />
                        <Button 
                          className="mt-2 text-sm"
                          onClick={handleChooseImage}
                          disabled={uploading}
                        >
                          {uploading ? '上传中...' : '更换图片'}
                        </Button>
                      </View>
                    ) : (
                      <View 
                        className="flex flex-col items-center justify-center h-48 cursor-pointer"
                        onClick={handleChooseImage}
                      >
                        <Text className="block text-gray-400">点击上传图片</Text>
                        <Text className="block text-xs text-gray-300 mt-1">支持 JPG、PNG 格式</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* 基本信息 */}
                <View>
                  <Text className="block text-sm text-gray-600 mb-2">产品名称 *</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input 
                      className="w-full bg-transparent"
                      placeholder="例如：明式圈椅"
                      value={newProduct.name}
                      onInput={(e) => setNewProduct({...newProduct, name: e.detail.value})}
                    />
                  </View>
                </View>

                <View>
                  <Text className="block text-sm text-gray-600 mb-2">所属分类</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input 
                      className="w-full bg-transparent"
                      placeholder="选择分类"
                      value={newProduct.categoryId}
                      onInput={(e) => setNewProduct({...newProduct, categoryId: e.detail.value})}
                    />
                  </View>
                  {/* 分类选择提示 */}
                  <View className="flex flex-row gap-2 mt-2 flex-wrap">
                    {categories.map(cat => (
                      <Badge 
                        key={cat.id}
                        className={`px-2 py-1 rounded text-xs cursor-pointer ${newProduct.categoryId === String(cat.id) ? 'bg-amber-900 text-white' : 'bg-gray-100 text-gray-600'}`}
                        onClick={() => setNewProduct({...newProduct, categoryId: String(cat.id)})}
                      >
                        {cat.name}
                      </Badge>
                    ))}
                  </View>
                </View>

                <View>
                  <Text className="block text-sm text-gray-600 mb-2">产品描述</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input 
                      className="w-full bg-transparent"
                      placeholder="简洁描述产品特点"
                      value={newProduct.description}
                      onInput={(e) => setNewProduct({...newProduct, description: e.detail.value})}
                    />
                  </View>
                </View>

                <Separator />

                {/* 详细参数 */}
                <Text className="block text-sm font-medium text-gray-700">产品参数</Text>
                
                <View>
                  <Text className="block text-sm text-gray-600 mb-2">材质</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input 
                      className="w-full bg-transparent"
                      placeholder="例如：北美黑胡桃木"
                      value={newProduct.material}
                      onInput={(e) => setNewProduct({...newProduct, material: e.detail.value})}
                    />
                  </View>
                </View>

                <View>
                  <Text className="block text-sm text-gray-600 mb-2">尺寸</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input 
                      className="w-full bg-transparent"
                      placeholder="例如：宽58cm × 深48cm × 高85cm"
                      value={newProduct.size}
                      onInput={(e) => setNewProduct({...newProduct, size: e.detail.value})}
                    />
                  </View>
                </View>

                <View>
                  <Text className="block text-sm text-gray-600 mb-2">重量</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input 
                      className="w-full bg-transparent"
                      placeholder="例如：约12kg"
                      value={newProduct.weight}
                      onInput={(e) => setNewProduct({...newProduct, weight: e.detail.value})}
                    />
                  </View>
                </View>

                <View>
                  <Text className="block text-sm text-gray-600 mb-2">工艺</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input 
                      className="w-full bg-transparent"
                      placeholder="例如：传统榫卯工艺，手工打磨"
                      value={newProduct.process}
                      onInput={(e) => setNewProduct({...newProduct, process: e.detail.value})}
                    />
                  </View>
                </View>

                <View>
                  <Text className="block text-sm text-gray-600 mb-2">产地</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input 
                      className="w-full bg-transparent"
                      placeholder="例如：浙江东阳"
                      value={newProduct.origin}
                      onInput={(e) => setNewProduct({...newProduct, origin: e.detail.value})}
                    />
                  </View>
                </View>

                <View>
                  <Text className="block text-sm text-gray-600 mb-2">特点标签（逗号分隔）</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input 
                      className="w-full bg-transparent"
                      placeholder="例如：人体工学,榫卯结构,天然木蜡油"
                      value={newProduct.features}
                      onInput={(e) => setNewProduct({...newProduct, features: e.detail.value})}
                    />
                  </View>
                </View>

                {/* 提交按钮 */}
                <Button 
                  className="w-full bg-amber-900 text-white rounded-lg py-3"
                  onClick={handleAddProduct}
                >
                  提交产品
                </Button>
              </View>
            </CardContent>
          </Card>

          {/* 右侧：产品列表 */}
          <Card className="flex-1 bg-white rounded-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">产品列表 ({products.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Text className="block text-gray-400 text-center py-8">加载中...</Text>
              ) : products.length === 0 ? (
                <Text className="block text-gray-400 text-center py-8">暂无产品，请添加</Text>
              ) : (
                <View className="grid grid-cols-3 gap-4">
                  {products.map(product => (
                    <View key={product.id} className="border border-gray-100 rounded-lg overflow-hidden">
                      <Image className="w-full h-40" src={product.imageUrl} mode="aspectFill" />
                      <View className="p-3">
                        <Text className="block font-medium text-gray-800">{product.name}</Text>
                        <Text className="block text-xs text-gray-500 mt-1 truncate">{product.description}</Text>
                        <View className="flex flex-row justify-between mt-2">
                          <Badge className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            {categories.find(c => c.id === product.categoryId)?.name || '未分类'}
                          </Badge>
                          <Button 
                            className="text-xs text-red-500"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            删除
                          </Button>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        </View>
      )}

      {/* 分类管理 */}
      {activeTab === 'categories' && (
        <View className="flex flex-row gap-6">
          {/* 左侧：新增分类表单 */}
          <Card className="w-96 bg-white rounded-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">新增分类</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="space-y-4">
                <View>
                  <Text className="block text-sm text-gray-600 mb-2">分类名称 *</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input 
                      className="w-full bg-transparent"
                      placeholder="例如：座椅"
                      value={newCategory.name}
                      onInput={(e) => setNewCategory({...newCategory, name: e.detail.value})}
                    />
                  </View>
                </View>

                <View>
                  <Text className="block text-sm text-gray-600 mb-2">分类描述</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input 
                      className="w-full bg-transparent"
                      placeholder="可选描述"
                      value={newCategory.description}
                      onInput={(e) => setNewCategory({...newCategory, description: e.detail.value})}
                    />
                  </View>
                </View>

                <Button 
                  className="w-full bg-amber-900 text-white rounded-lg py-3"
                  onClick={handleAddCategory}
                >
                  提交分类
                </Button>
              </View>
            </CardContent>
          </Card>

          {/* 右侧：分类列表 */}
          <Card className="flex-1 bg-white rounded-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">分类列表 ({categories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Text className="block text-gray-400 text-center py-8">加载中...</Text>
              ) : categories.length === 0 ? (
                <Text className="block text-gray-400 text-center py-8">暂无分类，请添加</Text>
              ) : (
                <View className="space-y-3">
                  {categories.map(cat => (
                    <View key={cat.id} className="flex flex-row items-center justify-between p-4 border border-gray-100 rounded-lg">
                      <View>
                        <Text className="block font-medium text-gray-800">{cat.name}</Text>
                        <Text className="block text-xs text-gray-500 mt-1">{cat.description || '无描述'}</Text>
                      </View>
                      <Button 
                        className="text-xs text-red-500"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        删除
                      </Button>
                    </View>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        </View>
      )}
    </View>
  )
}

export default AdminWebPage