import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'

interface Product {
  id: number
  name: string
  model?: string
  categories?: {
    name: string
  }
  image_url: string
  material?: string
  size?: string
  process?: string
  origin?: string
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

  if (loading) {
    return (
      <View className="min-h-full bg-gray-50 flex flex-col items-center justify-center">
        <Text className="block text-gray-500">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-full bg-gray-50 pb-12">
      {/* 标题 */}
      <View className="px-4 pt-4 mb-4">
        <Text className="block text-xl font-semibold text-gray-700">产品图册</Text>
        <Text className="block text-sm text-gray-500 mt-1">新中式雅韵，匠心之作</Text>
      </View>

      {/* 产品列表 - 单列展示 */}
      <View className="px-4">
        {products.length > 0 ? (
          <View className="flex flex-col gap-4">
            {products.map(product => (
              <Card
                key={product.id}
                className="bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm"
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
                  {/* 分类标签 */}
                  {product.categories?.name && (
                    <Badge className="absolute top-3 right-3 bg-amber-800 text-white px-3 py-1 rounded text-xs">
                      {product.categories.name}
                    </Badge>
                  )}
                </View>
                
                {/* 产品参数 - 直接展示在图片下面 */}
                <CardContent className="p-4">
                  {/* 名称和型号 */}
                  <View className="flex flex-row items-center gap-2">
                    <Text className="block text-lg font-medium text-gray-800">{product.name}</Text>
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
            ))}
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