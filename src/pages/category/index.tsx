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
  categoryId: number
  categoryName?: string
  image: string
  description: string
  material?: string
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
      setFilteredProducts(products.filter(p => p.categoryId === selectedCategoryId))
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

  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` })
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
              className="w-full bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm mb-4 cursor-pointer"
              onClick={() => goToDetail(product.id)}
            >
              {/* 图册风格：大图展示 */}
              <View className="relative">
                <Image
                  className="w-full h-64"
                  src={product.image}
                  mode="aspectFill"
                />
              </View>
              <CardContent className="p-4">
                <Text className="block text-lg font-semibold text-gray-800">{product.name}</Text>
                <Text className="block text-sm text-gray-500 mt-2 line-clamp-2">{product.description}</Text>
                {/* 材质和产地 */}
                <View className="flex flex-row gap-4 mt-3">
                  {product.material && (
                    <View className="flex flex-row items-center">
                      <Text className="block text-xs text-gray-400">材质：</Text>
                      <Text className="block text-xs text-amber-800">{product.material}</Text>
                    </View>
                  )}
                  {product.origin && (
                    <View className="flex flex-row items-center">
                      <Text className="block text-xs text-gray-400">产地：</Text>
                      <Text className="block text-xs text-amber-800">{product.origin}</Text>
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