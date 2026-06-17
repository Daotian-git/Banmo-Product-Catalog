import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

// 模拟产品详情数据
const mockProductDetails = {
  1: {
    id: 1,
    name: '明式圈椅',
    category: '座椅',
    price: '¥12,800',
    image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/0c9e5f6a-amber-chair.png',
    desc: '经典明式设计，榫卯结构，匠心之作',
    material: '北美黑胡桃木',
    size: '宽58cm × 深48cm × 高85cm',
    weight: '约12kg',
    process: '传统榫卯工艺，手工打磨',
    origin: '浙江东阳',
    features: ['人体工学设计', '榫卯无钉结构', '天然木蜡油涂饰', '可拆卸座垫']
  },
  2: {
    id: 2,
    name: '新中式茶桌',
    category: '茶桌',
    price: '¥8,500',
    image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/tea-table.png',
    desc: '黑胡桃木，简约大气，茶道之选',
    material: '北美黑胡桃木',
    size: '长120cm × 宽60cm × 高75cm',
    weight: '约25kg',
    process: '榫卯结构，环保清漆',
    origin: '浙江东阳',
    features: ['内置茶盘槽', '隐藏储物空间', '可升降茶台', '防水处理']
  },
  3: {
    id: 3,
    name: '禅意书架',
    category: '书架',
    price: '¥6,200',
    image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/bookshelf.png',
    desc: '实木多层，雅致留白，文人雅趣',
    material: '白橡木',
    size: '宽80cm × 深30cm × 高180cm',
    weight: '约18kg',
    process: '榫卯拼接，手工打磨',
    origin: '福建仙游',
    features: ['五层开放式', '底部储物柜', '可调节层板', '稳定支撑']
  },
  4: {
    id: 4,
    name: '宋式案台',
    category: '案台',
    price: '¥15,000',
    image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/desk.png',
    desc: '仿古设计，文人雅趣，书房必备',
    material: '缅甸花梨木',
    size: '长180cm × 宽80cm × 高78cm',
    weight: '约35kg',
    process: '仿古榫卯，传统漆艺',
    origin: '江苏苏州',
    features: ['仿宋式样', '隐藏抽屉', '案头挡板', '可配脚踏']
  },
  5: {
    id: 5,
    name: '卧榻',
    category: '床榻',
    price: '¥22,000',
    image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/bed.png',
    desc: '楠木制作，沉稳温润，古韵悠长',
    material: '金丝楠木',
    size: '长200cm × 宽180cm × 高45cm',
    weight: '约50kg',
    process: '榫卯框架，传统工艺',
    origin: '四川雅安',
    features: ['榻面透雕', '可配榻帐', '冬夏两用', '收纳底箱']
  },
  6: {
    id: 6,
    name: '玄关柜',
    category: '柜类',
    price: '¥4,800',
    image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/cabinet.png',
    desc: '简约实用，收纳有道，入门见雅',
    material: '北美黑胡桃木',
    size: '宽100cm × 深40cm × 高80cm',
    weight: '约15kg',
    process: '榫卯拼接，环保清漆',
    origin: '浙江东阳',
    features: ['双层收纳', '隐藏鞋架', '台面置物', '简约格栅']
  },
  7: {
    id: 7,
    name: '条案',
    category: '案台',
    price: '¥9,800',
    image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/console-table.png',
    desc: '玄关条案，简约典雅，入户雅致',
    material: '北美黑胡桃木',
    size: '长120cm × 宽35cm × 高85cm',
    weight: '约12kg',
    process: '榫卯结构，手工打磨',
    origin: '浙江东阳',
    features: ['窄长设计', '案头置物', '底部储物', '格栅装饰']
  },
  8: {
    id: 8,
    name: '罗汉床',
    category: '床榻',
    price: '¥28,000',
    image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/daybed.png',
    desc: '传统罗汉床，可坐可卧，客厅雅器',
    material: '缅甸花梨木',
    size: '长200cm × 宽100cm × 高80cm',
    weight: '约40kg',
    process: '传统榫卯，仿古漆艺',
    origin: '江苏苏州',
    features: ['三面围板', '可配软垫', '客厅茶榻', '品茗会客']
  },
}

const DetailPage = () => {
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)

  useEffect(() => {
    const id = parseInt(router.params.id || '1')
    const detail = mockProductDetails[id as keyof typeof mockProductDetails]
    setProduct(detail || mockProductDetails[1])
  }, [router.params.id])

  const handleContact = () => {
    Taro.showModal({
      title: '咨询产品',
      content: '请拨打客服热线：400-888-8888\n或添加微信：YumuXuan',
      showCancel: false,
      confirmText: '知道了'
    })
  }

  if (!product) {
    return (
      <View className="min-h-full bg-gray-50 flex items-center justify-center">
        <Text className="block text-gray-400">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-full bg-gray-50 pb-16">
      {/* 产品大图 */}
      <View className="bg-white">
        <Image
          className="w-full h-64"
          src={product.image}
          mode="aspectFill"
        />
      </View>

      {/* 产品基本信息 */}
      <Card className="mt-3 mx-4 bg-white rounded-lg border border-gray-100">
        <CardHeader className="pb-2">
          <View className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{product.name}</CardTitle>
            <Badge className="bg-amber-800 text-white px-2 py-1 rounded text-xs">
              {product.category}
            </Badge>
          </View>
          <CardDescription className="text-sm text-gray-500 mt-1">
            {product.desc}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Text className="block text-amber-900 text-xl font-bold">{product.price}</Text>
        </CardContent>
      </Card>

      {/* 产品参数 */}
      <Card className="mt-3 mx-4 bg-white rounded-lg border border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-gray-700">产品参数</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <View className="space-y-2">
            <View className="flex flex-row justify-between">
              <Text className="block text-sm text-gray-500">材质</Text>
              <Text className="block text-sm text-gray-700">{product.material}</Text>
            </View>
            <Separator />
            <View className="flex flex-row justify-between">
              <Text className="block text-sm text-gray-500">尺寸</Text>
              <Text className="block text-sm text-gray-700">{product.size}</Text>
            </View>
            <Separator />
            <View className="flex flex-row justify-between">
              <Text className="block text-sm text-gray-500">重量</Text>
              <Text className="block text-sm text-gray-700">{product.weight}</Text>
            </View>
            <Separator />
            <View className="flex flex-row justify-between">
              <Text className="block text-sm text-gray-500">工艺</Text>
              <Text className="block text-sm text-gray-700">{product.process}</Text>
            </View>
            <Separator />
            <View className="flex flex-row justify-between">
              <Text className="block text-sm text-gray-500">产地</Text>
              <Text className="block text-sm text-gray-700">{product.origin}</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 产品特点 */}
      <Card className="mt-3 mx-4 bg-white rounded-lg border border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-gray-700">产品特点</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <View className="flex flex-row gap-2 flex-wrap">
            {product.features.map((feature: string, idx: number) => (
              <Badge
                key={idx}
                className="bg-gray-50 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200"
              >
                {feature}
              </Badge>
            ))}
          </View>
        </CardContent>
      </Card>

      {/* 咨询按钮 */}
      <View className="px-4 mt-4">
        <Button
          className="w-full bg-amber-900 text-white rounded-lg py-3"
          onClick={handleContact}
        >
          <Text className="text-white text-base">咨询客服</Text>
        </Button>
      </View>
    </View>
  )
}

export default DetailPage