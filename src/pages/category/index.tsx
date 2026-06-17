import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// 模拟产品数据
const mockProducts = [
  { id: 1, name: '明式圈椅', category: '座椅', price: '¥12,800', image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/0c9e5f6a-amber-chair.png', desc: '经典明式设计，榫卯结构' },
  { id: 2, name: '新中式茶桌', category: '茶桌', price: '¥8,500', image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/tea-table.png', desc: '黑胡桃木，简约大气' },
  { id: 3, name: '禅意书架', category: '书架', price: '¥6,200', image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/bookshelf.png', desc: '实木多层，雅致留白' },
  { id: 4, name: '宋式案台', category: '案台', price: '¥15,000', image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/desk.png', desc: '仿古设计，文人雅趣' },
  { id: 5, name: '卧榻', category: '床榻', price: '¥22,000', image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/bed.png', desc: '楠木制作，沉稳温润' },
  { id: 6, name: '玄关柜', category: '柜类', price: '¥4,800', image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/cabinet.png', desc: '简约实用，收纳有道' },
  { id: 7, name: '条案', category: '案台', price: '¥9,800', image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/console-table.png', desc: '玄关条案，简约典雅' },
  { id: 8, name: '罗汉床', category: '床榻', price: '¥28,000', image: 'https://tos-cn-beijing.ivolces.com/images/coze-assets/daybed.png', desc: '传统罗汉床，可坐可卧' },
]

const categories = [
  { id: 'all', name: '全部', icon: '📋' },
  { id: 'seat', name: '座椅', icon: '🪑' },
  { id: 'tea', name: '茶桌', icon: '🍵' },
  { id: 'shelf', name: '书架', icon: '📚' },
  { id: 'desk', name: '案台', icon: '📜' },
  { id: 'bed', name: '床榻', icon: '🛏️' },
  { id: 'cabinet', name: '柜类', icon: '🗄️' },
]

const CategoryPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [filteredProducts, setFilteredProducts] = useState(mockProducts)

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(mockProducts)
    } else {
      const categoryName = categories.find(c => c.id === selectedCategory)?.name || ''
      setFilteredProducts(mockProducts.filter(p => p.category === categoryName))
    }
  }, [selectedCategory])

  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` })
  }

  return (
    <View className="min-h-full bg-gray-50 flex flex-col">
      {/* 分类导航 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <Text className="block text-lg font-semibold text-gray-700 mb-3">产品分类</Text>
        <View className="flex flex-row gap-3">
          {categories.map(cat => (
            <View
              key={cat.id}
              className={`flex flex-col items-center px-3 py-2 rounded-lg cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-900'
                  : 'bg-gray-50 border border-gray-200'
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <Text className={`block text-lg ${selectedCategory === cat.id ? 'text-white' : 'text-gray-700'}`}>
                {cat.icon}
              </Text>
              <Text className={`block text-xs mt-1 ${selectedCategory === cat.id ? 'text-white' : 'text-gray-600'}`}>
                {cat.name}
              </Text>
            </View>
          ))}
        </View>
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
        <View className="flex flex-row gap-3 flex-wrap">
          {filteredProducts.map(product => (
            <Card
              key={product.id}
              className="w-[calc(50%-8px)] bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm cursor-pointer"
              onClick={() => goToDetail(product.id)}
            >
              <View className="relative">
                <Image
                  className="w-full h-40"
                  src={product.image}
                  mode="aspectFill"
                />
              </View>
              <CardContent className="p-3">
                <Text className="block text-base font-medium text-gray-700 truncate">{product.name}</Text>
                <Text className="block text-xs text-gray-500 mt-1 truncate">{product.desc}</Text>
                <Text className="block text-amber-900 font-semibold mt-2">{product.price}</Text>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* 空状态 */}
        {filteredProducts.length === 0 && (
          <View className="flex flex-col items-center justify-center py-12">
            <Text className="block text-gray-400 text-sm">该分类暂无产品</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default CategoryPage