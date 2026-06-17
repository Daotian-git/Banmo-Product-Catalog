import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

// 模拟产品数据（图册展示，无价格）
const mockProducts = [
  { id: 1, name: '明式圈椅', category: '座椅', image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/0c9e5f6a-amber-chair.png', desc: '经典明式设计，榫卯结构，匠心之作' },
  { id: 2, name: '新中式茶桌', category: '茶桌', image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/tea-table.png', desc: '黑胡桃木，简约大气，茶道之选' },
  { id: 3, name: '禅意书架', category: '书架', image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/bookshelf.png', desc: '实木多层，雅致留白，文人雅趣' },
  { id: 4, name: '宋式案台', category: '案台', image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/desk.png', desc: '仿古设计，书房必备' },
  { id: 5, name: '卧榻', category: '床榻', image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/bed.png', desc: '楠木制作，沉稳温润' },
  { id: 6, name: '玄关柜', category: '柜类', image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/cabinet.png', desc: '简约实用，入门见雅' },
]

const categories = ['全部', '座椅', '茶桌', '书架', '案台', '床榻', '柜类']

const IndexPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [searchText, setSearchText] = useState('')
  const [filteredProducts, setFilteredProducts] = useState(mockProducts)

  useEffect(() => {
    let result = mockProducts
    if (selectedCategory !== '全部') {
      result = result.filter(p => p.category === selectedCategory)
    }
    if (searchText) {
      result = result.filter(p => p.name.includes(searchText) || p.desc.includes(searchText))
    }
    setFilteredProducts(result)
  }, [selectedCategory, searchText])

  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` })
  }

  const goToCategory = () => {
    Taro.switchTab({ url: '/pages/category/index' })
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
      <View className="px-4 py-3">
        <View className="flex flex-row gap-2 overflow-x-auto">
          {categories.map(cat => (
            <Badge
              key={cat}
              className={`px-3 py-2 rounded-full text-sm whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </View>
      </View>

      {/* 推荐标题 */}
      <View className="px-4 mb-3">
        <Text className="block text-lg font-semibold text-gray-700">精选推荐</Text>
        <Text className="block text-sm text-gray-500 mt-1">新中式雅韵，匠心之作</Text>
      </View>

      {/* 产品图册 - 瀑布流展示 */}
      <View className="px-4">
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
                <Badge className="absolute top-2 right-2 bg-amber-800 bg-opacity-80 text-white px-2 py-1 rounded text-xs">
                  {product.category}
                </Badge>
              </View>
              {/* 简洁信息 */}
              <CardContent className="p-3">
                <Text className="block text-base font-medium text-gray-800">{product.name}</Text>
                <Text className="block text-xs text-gray-500 mt-1 line-clamp-2">{product.desc}</Text>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* 空状态 */}
        {filteredProducts.length === 0 && (
          <View className="flex flex-col items-center justify-center py-12">
            <Text className="block text-gray-400 text-sm">暂无匹配产品</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default IndexPage