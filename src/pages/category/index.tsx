import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Network } from '@/network'

interface Category {
  id: number
  name: string
  icon?: string
}

interface Product {
  id: number
  name: string
  model?: string
  category_id: number
  categories?: {
    name: string
  }
  image_url: string
  material?: string
  size?: string
  process?: string
  origin?: string
}

const CategoryPage = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedCategoryId === null) {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(products.filter(p => p.category_id === selectedCategoryId))
    }
  }, [selectedCategoryId, products])

  const loadData = async () => {
    try {
      setLoading(true)
      // 获取分类
      const catRes = await Network.request({ url: '/api/categories' })
      console.log('分类响应:', catRes.data)
      const catData = catRes.data?.data || []
      setCategories(catData)

      // 获取产品
      const prodRes = await Network.request({ url: '/api/products' })
      console.log('产品响应:', prodRes.data)
      const prodData = prodRes.data?.data || []
      setProducts(prodData)
      setFilteredProducts(prodData)
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View className="min-h-full bg-gray-50 flex flex-col items-center justify-center">
        <Text className="block text-gray-500">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-full bg-gray-50 flex flex-col">
      {/* 产品数量 */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <Text className="block text-sm text-gray-500">
          共 {filteredProducts.length} 件产品
        </Text>
      </View>

      {/* 产品列表 - 单列展示 */}
      <View className="flex-1 px-4 pt-4 pb-20 overflow-y-auto">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <Card
              key={product.id}
              className="w-full bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm mb-4"
            >
              {/* 图册风格：大图展示 */}
              <View className="relative">
                {product.image_url ? (
                  <Image
                    className="w-full h-64"
                    src={product.image_url}
                    mode="aspectFill"
                  />
                ) : (
                  <View className="w-full h-64 bg-gray-200 flex items-center justify-center">
                    <Text className="block text-gray-400 text-sm">暂无图片</Text>
                  </View>
                )}
              </View>
              
              {/* 产品参数 - 直接展示在图片下面 */}
              <CardContent className="p-4">
                {/* 名称和型号 */}
                <View className="flex flex-row items-center gap-2">
                  <Text className="block text-lg font-semibold text-gray-800">{product.name}</Text>
                  {product.model && (
                    <Text className="block text-sm text-gray-500">({product.model})</Text>
                  )}
                </View>
                
                {/* 参数网格 */}
                <View className="mt-3 grid grid-cols-2 gap-2">
                  {product.material && (
                    <View className="flex flex-row items-center gap-1">
                      <Text className="block text-xs text-gray-400">材质：</Text>
                      <Text className="block text-xs text-gray-600">{product.material}</Text>
                    </View>
                  )}
                  {product.size && (
                    <View className="flex flex-row items-center gap-1">
                      <Text className="block text-xs text-gray-400">尺寸：</Text>
                      <Text className="block text-xs text-gray-600">{product.size}</Text>
                    </View>
                  )}
                  {product.process && (
                    <View className="flex flex-row items-center gap-1">
                      <Text className="block text-xs text-gray-400">工艺：</Text>
                      <Text className="block text-xs text-gray-600">{product.process}</Text>
                    </View>
                  )}
                  {product.origin && (
                    <View className="flex flex-row items-center gap-1">
                      <Text className="block text-xs text-gray-400">产地：</Text>
                      <Text className="block text-xs text-gray-600">{product.origin}</Text>
                    </View>
                  )}
                </View>
              </CardContent>
            </Card>
          ))
        ) : (
          <View className="flex flex-col items-center justify-center py-12">
            <Text className="block text-gray-400 text-sm">
              {categories.length === 0 ? '请先在后台添加分类和产品' : '该分类暂无产品'}
            </Text>
          </View>
        )}
      </View>

      {/* 底部分类导航 - 固定在屏幕下方，避开 TabBar */}
      {categories.length > 0 && (
        <View
          style={{
            position: 'fixed',
            bottom: 50,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            borderTop: '1px solid #e5e7eb',
            padding: '12px 16px',
            zIndex: 100
          }}
        >
          <View className="flex flex-row gap-3 overflow-x-auto">
            {/* 全部选项 */}
            <View
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: selectedCategoryId === null ? '#78350f' : '#f9fafb',
                borderWidth: selectedCategoryId === null ? 0 : 1,
                borderColor: '#e5e7eb'
              }}
              onClick={() => setSelectedCategoryId(null)}
            >
              <Text className={`block text-sm ${selectedCategoryId === null ? 'text-white' : 'text-gray-700'}`}>
                全部
              </Text>
            </View>
            {/* 分类列表 */}
            {categories.map(cat => (
              <View
                key={cat.id}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: selectedCategoryId === cat.id ? '#78350f' : '#f9fafb',
                  borderWidth: selectedCategoryId === cat.id ? 0 : 1,
                  borderColor: '#e5e7eb'
                }}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                <Text className={`block text-sm ${selectedCategoryId === cat.id ? 'text-white' : 'text-gray-700'}`}>
                  {cat.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

export default CategoryPage