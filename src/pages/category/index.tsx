import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
      {/* 分类导航 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <Text className="block text-lg font-semibold text-gray-700 mb-3">产品分类</Text>
        {categories.length > 0 ? (
          <View className="flex flex-row gap-3 overflow-x-auto">
            {/* 全部选项 */}
            <View
              className={`flex flex-col items-center px-3 py-2 rounded-lg cursor-pointer ${
                selectedCategoryId === null
                  ? 'bg-amber-900'
                  : 'bg-gray-50 border border-gray-200'
              }`}
              onClick={() => setSelectedCategoryId(null)}
            >
              <Text className={`block text-lg ${selectedCategoryId === null ? 'text-white' : 'text-gray-700'}`}>
                📋
              </Text>
              <Text className={`block text-xs mt-1 ${selectedCategoryId === null ? 'text-white' : 'text-gray-600'}`}>
                全部
              </Text>
            </View>
            {/* 分类列表 */}
            {categories.map(cat => (
              <View
                key={cat.id}
                className={`flex flex-col items-center px-3 py-2 rounded-lg cursor-pointer ${
                  selectedCategoryId === cat.id
                    ? 'bg-amber-900'
                    : 'bg-gray-50 border border-gray-200'
                }`}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                <Text className={`block text-lg ${selectedCategoryId === cat.id ? 'text-white' : 'text-gray-700'}`}>
                  {cat.icon || '📦'}
                </Text>
                <Text className={`block text-xs mt-1 ${selectedCategoryId === cat.id ? 'text-white' : 'text-gray-600'}`}>
                  {cat.name}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="flex flex-col items-center py-4">
            <Text className="block text-gray-500 text-sm">暂无分类，请先在后台添加分类</Text>
          </View>
        )}
      </View>

      <Separator className="my-2" />

      {/* 产品数量 */}
      <View className="px-4 py-2">
        <Text className="block text-sm text-gray-500">
          共 {filteredProducts.length} 件产品
        </Text>
      </View>

      {/* 产品列表 */}
      <View className="flex-1 px-4 pb-12 overflow-y-auto">
        {filteredProducts.length > 0 ? (
          <View className="flex flex-row gap-3 flex-wrap">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className="w-[calc(50%-8px)] bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm cursor-pointer"
                onClick={() => goToDetail(product.id)}
              >
                {/* 图册风格：大图展示 */}
                <View className="relative">
                  <Image
                    className="w-full h-52"
                    src={product.image}
                    mode="aspectFill"
                  />
                </View>
                <CardContent className="p-3">
                  <Text className="block text-base font-medium text-gray-800">{product.name}</Text>
                  <Text className="block text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</Text>
                </CardContent>
              </Card>
            ))}
          </View>
        ) : (
          <View className="flex flex-col items-center justify-center py-12">
            <Text className="block text-gray-400 text-sm">
              {categories.length === 0 ? '请先在后台添加分类和产品' : '该分类暂无产品'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default CategoryPage