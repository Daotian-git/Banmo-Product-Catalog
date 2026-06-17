import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'

interface Product {
  id: number
  name: string
  models: string[] // 多个型号
  image_url: string
  sizes: string[] // 多个尺寸
  layout: number // 排列方式：1单列，2双列
  category_id: number
  category_name?: string
}

const IndexPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/products' })
      console.log('产品响应:', res.data)
      const data = res.data?.data || []
      setProducts(data)
    } catch (error) {
      console.error('加载产品失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 渲染单个产品卡片
  const renderProductCard = (product: Product, isDoubleColumn: boolean = false) => {
    return (
      <Card
        key={product.id}
        className="bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm"
      >
        {/* 图册风格：大图展示 */}
        <View className="relative">
          {product.image_url ? (
            <Image
              className={isDoubleColumn ? "w-full h-36" : "w-full h-64"}
              src={product.image_url}
              mode="aspectFill"
            />
          ) : (
            <View className={isDoubleColumn ? "w-full h-36 bg-gray-200 flex items-center justify-center" : "w-full h-64 bg-gray-200 flex items-center justify-center"}>
              <Text className="block text-gray-400 text-xs">暂无图片</Text>
            </View>
          )}
          {/* 分类标签 */}
          {product.category_name && (
            <Badge className="absolute top-2 right-2 bg-amber-800 text-white px-2 py-1 rounded text-xs">
              {product.category_name}
            </Badge>
          )}
        </View>
        
        {/* 产品参数 - 直接展示在图片下面 */}
        <CardContent className={isDoubleColumn ? "p-2" : "p-4"}>
          {/* 名称 */}
          <Text className={isDoubleColumn ? "block text-sm font-medium text-gray-800" : "block text-lg font-medium text-gray-800"}>
            {product.name}
          </Text>
          
          {/* 型号列表 */}
          {product.models && product.models.length > 0 && (
            <View className="mt-1">
              <Text className={isDoubleColumn ? "block text-xs text-gray-500" : "block text-sm text-gray-500"}>
                型号: {product.models.join(' / ')}
              </Text>
            </View>
          )}
          
          {/* 尺寸列表 */}
          {product.sizes && product.sizes.length > 0 && (
            <View className="mt-1">
              <Text className={isDoubleColumn ? "block text-xs text-gray-500" : "block text-sm text-gray-500"}>
                尺寸: {product.sizes.join(' / ')}
              </Text>
            </View>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <View className="min-h-full bg-gray-50 flex flex-col items-center justify-center">
        <Text className="block text-gray-500">加载中...</Text>
      </View>
    )
  }

  // 将产品按排列方式分组
  const singleColumnProducts = products.filter(p => p.layout === 1 || !p.layout)
  const doubleColumnProducts = products.filter(p => p.layout === 2)

  return (
    <View className="min-h-full bg-gray-50 pb-12">
      {/* 标题 */}
      <View className="px-4 pt-4 mb-4">
        <Text className="block text-xl font-semibold text-gray-700">产品图册</Text>
        <Text className="block text-sm text-gray-500 mt-1">新中式雅韵，匠心之作</Text>
      </View>

      {/* 产品列表 */}
      <View className="px-4">
        {products.length > 0 ? (
          <View className="flex flex-col gap-4">
            {/* 单列产品 */}
            {singleColumnProducts.map(product => renderProductCard(product, false))}
            
            {/* 双列产品 - 两列布局 */}
            {doubleColumnProducts.length > 0 && (
              <View className="flex flex-row gap-2">
                {doubleColumnProducts.map(product => (
                  <View key={product.id} className="flex-1">
                    {renderProductCard(product, true)}
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View className="flex flex-col items-center justify-center py-16">
            <Text className="block text-gray-400 text-sm">暂无产品，请先在后台添加</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default IndexPage