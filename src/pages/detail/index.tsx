import { View, Text, Image } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Network } from '@/network'

const DetailPage = () => {
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = router.params.id
    if (id) {
      fetchProduct(parseInt(id))
    }
  }, [router.params.id])

  const fetchProduct = async (id: number) => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/products/${id}`,
        method: 'GET'
      })
      console.log('产品详情响应:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setProduct(res.data.data)
      }
    } catch (error) {
      console.error('获取产品详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View className="min-h-full bg-gray-50 flex items-center justify-center">
        <Text className="block text-gray-400">加载中...</Text>
      </View>
    )
  }

  if (!product) {
    return (
      <View className="min-h-full bg-gray-50 flex items-center justify-center">
        <Text className="block text-gray-400">产品不存在</Text>
      </View>
    )
  }

  return (
    <View className="min-h-full bg-gray-50 pb-8">
      {/* 产品大图 - 图册风格 */}
      <View className="bg-white">
        {product.image_url ? (
          <Image
            className="w-full h-72"
            src={product.image_url}
            mode="aspectFill"
          />
        ) : (
          <View className="w-full h-72 bg-gray-200 flex items-center justify-center">
            <Text className="block text-gray-400 text-sm">暂无图片</Text>
          </View>
        )}
      </View>

      {/* 产品标题 */}
      <Card className="mt-3 mx-4 bg-white rounded-lg border border-gray-100">
        <CardHeader className="pb-2">
          <View className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-800">{product.name}</CardTitle>
            {product.categories?.name && (
              <Badge className="bg-amber-800 text-white px-3 py-1 rounded text-xs">
                {product.categories.name}
              </Badge>
            )}
          </View>
        </CardHeader>
      </Card>

      {/* 产品参数 */}
      <Card className="mt-3 mx-4 bg-white rounded-lg border border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-gray-700 font-medium">产品参数</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <View className="space-y-2">
            {/* 产品型号 */}
            {product.model && (
              <>
                <View className="flex flex-row justify-between py-1">
                  <Text className="block text-sm text-gray-500">型号</Text>
                  <Text className="block text-sm text-gray-700 font-medium">{product.model}</Text>
                </View>
                <Separator />
              </>
            )}
            {/* 材质 */}
            {product.material && (
              <>
                <View className="flex flex-row justify-between py-1">
                  <Text className="block text-sm text-gray-500">材质</Text>
                  <Text className="block text-sm text-gray-700 font-medium">{product.material}</Text>
                </View>
                <Separator />
              </>
            )}
            {/* 尺寸 */}
            {product.size && (
              <>
                <View className="flex flex-row justify-between py-1">
                  <Text className="block text-sm text-gray-500">尺寸</Text>
                  <Text className="block text-sm text-gray-700 font-medium">{product.size}</Text>
                </View>
                <Separator />
              </>
            )}
            {/* 工艺 */}
            {product.process && (
              <>
                <View className="flex flex-row justify-between py-1">
                  <Text className="block text-sm text-gray-500">工艺</Text>
                  <Text className="block text-sm text-gray-700 font-medium">{product.process}</Text>
                </View>
                <Separator />
              </>
            )}
            {/* 产地 */}
            {product.origin && (
              <View className="flex flex-row justify-between py-1">
                <Text className="block text-sm text-gray-500">产地</Text>
                <Text className="block text-sm text-gray-700 font-medium">{product.origin}</Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

export default DetailPage