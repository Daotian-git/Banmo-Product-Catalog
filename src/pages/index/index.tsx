import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'

interface Category {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  categoryId: number
  categoryName?: string
  image: string
  description: string
}

const IndexPage = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [searchText, setSearchText] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let result = products
    if (selectedCategoryId !== null) {
      result = result.filter(p => p.categoryId === selectedCategoryId)
    }
    if (searchText) {
      result = result.filter(p => 
        p.name.includes(searchText) || 
        p.description?.includes(searchText) ||
        p.categoryName?.includes(searchText)
      )
    }
    setFilteredProducts(result)
  }, [selectedCategoryId, searchText, products])

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
    } finally {
      setLoading(false)
    }
  }

  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` })
  }

  const goToCategory = () => {
    Taro.switchTab({ url: '/pages/category/index' })
  }

  if (loading) {
    return (
      <View className="min-h-full bg-gray-50 flex flex-col items-center justify-center">
        <Text className="block text-gray-500">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-full bg-gray-50 pb-12">
      {/* 搜索区域 */}
      <View className="px-4 pt-3 pb-2">
        <View className="flex items-center gap-2">
          <View className="flex-1 bg-white rounded-lg px-3 py-2 border border-gray-200">
            <Input
              className="w-full bg-transparent text-sm"
              placeholder="搜索家具..."
              value={searchText}
              onInput={(e) => setSearchText(e.detail.value)}
            />
          </View>
          <Badge
            className="bg-amber-900 text-white px-3 py-2 rounded-lg text-sm cursor-pointer"
            onClick={goToCategory}
          >
            分类
          </Badge>
        </View>
      </View>

      {/* 分类标签 */}
      {categories.length > 0 && (
        <View className="px-4 py-3">
          <View className="flex flex-row gap-2 overflow-x-auto">
            {/* 全部选项 */}
            <Badge
              className={`px-3 py-2 rounded-full text-sm whitespace-nowrap cursor-pointer ${
                selectedCategoryId === null
                  ? 'bg-amber-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
              onClick={() => setSelectedCategoryId(null)}
            >
              全部
            </Badge>
            {/* 分类列表 */}
            {categories.map(cat => (
              <Badge
                key={cat.id}
                className={`px-3 py-2 rounded-full text-sm whitespace-nowrap cursor-pointer ${
                  selectedCategoryId === cat.id
                    ? 'bg-amber-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                {cat.name}
              </Badge>
            ))}
          </View>
        </View>
      )}

      {/* 推荐标题 */}
      <View className="px-4 mb-3">
        <Text className="block text-lg font-semibold text-gray-700">精选推荐</Text>
        <Text className="block text-sm text-gray-500 mt-1">新中式雅韵，匠心之作</Text>
      </View>

      {/* 产品图册 */}
      <View className="px-4">
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
                  {/* 分类标签 */}
                  {product.categoryName && (
                    <Badge className="absolute top-2 right-2 bg-amber-800 text-white px-2 py-1 rounded text-xs">
                      {product.categoryName}
                    </Badge>
                  )}
                </View>
                {/* 简洁信息 */}
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
              {products.length === 0 ? '暂无产品，请先在后台添加' : '暂无匹配产品'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default IndexPage