import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'

interface Category {
  id: number
  name: string
  parent_id: number | null
  children?: Category[]
}

interface Product {
  id: number
  name: string
  models: string[]
  category_id: number
  category_name?: string
  image_url: string
  sizes: string[]
  layout: number
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
      // 如果选的是一级分类，需要包含其下所有二级分类的产品
      const selectedCat = categories.find(c => c.id === selectedCategoryId)
      if (selectedCat && selectedCat.children && selectedCat.children.length > 0) {
        // 一级分类：包含所有子分类的产品
        const childIds = selectedCat.children.map(c => c.id)
        setFilteredProducts(products.filter(p => childIds.includes(p.category_id) || p.category_id === selectedCategoryId))
      } else {
        // 二级分类：只显示该分类的产品
        setFilteredProducts(products.filter(p => p.category_id === selectedCategoryId))
      }
    }
  }, [selectedCategoryId, products, categories])

  const loadData = async () => {
    try {
      setLoading(true)
      // 获取分类（树形结构）
      const catRes = await Network.request({ url: '/api/categories/tree' })
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
        
        {/* 产品参数 */}
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

  // 获取一级分类
  const parentCategories = categories.filter(c => !c.parent_id)
  
  // 将产品按排列方式分组
  const singleColumnProducts = filteredProducts.filter(p => p.layout === 1 || !p.layout)
  const doubleColumnProducts = filteredProducts.filter(p => p.layout === 2)

  return (
    <View className="min-h-full bg-gray-50 flex flex-col">
      {/* 产品数量 */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <Text className="block text-sm text-gray-500">
          共 {filteredProducts.length} 件产品
        </Text>
      </View>

      {/* 产品列表 */}
      <View className="flex-1 px-4 pt-4 pb-20 overflow-y-auto">
        {filteredProducts.length > 0 ? (
          <View className="flex flex-col gap-4">
            {/* 单列产品 */}
            {singleColumnProducts.map(product => renderProductCard(product, false))}
            
            {/* 双列产品 */}
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
          <View className="flex flex-col items-center justify-center py-12">
            <Text className="block text-gray-400 text-sm">
              {categories.length === 0 ? '请先在后台添加分类和产品' : '该分类暂无产品'}
            </Text>
          </View>
        )}
      </View>

      {/* 底部分类导航 */}
      {categories.length > 0 && (
        <View
          style={{
            position: 'fixed',
            bottom: 50,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            borderTop: '1px solid #e5e7eb',
            padding: '8px 16px',
            zIndex: 100
          }}
        >
          {/* 一级分类 */}
          <View className="flex flex-row gap-2 overflow-x-auto">
            {/* 全部选项 */}
            <View
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
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
            {/* 一级分类列表 */}
            {parentCategories.map(cat => (
              <View
                key={cat.id}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
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
          
          {/* 二级分类 - 当选中一级分类时显示 */}
          {selectedCategoryId !== null && (() => {
            const selectedParent = parentCategories.find(c => c.id === selectedCategoryId)
            if (selectedParent && selectedParent.children && selectedParent.children.length > 0) {
              return (
                <View className="flex flex-row gap-2 mt-2 overflow-x-auto">
                  {selectedParent.children.map(child => (
                    <View
                      key={child.id}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#fef3c7',
                        borderWidth: 0
                      }}
                      onClick={() => setSelectedCategoryId(child.id)}
                    >
                      <Text className="block text-xs text-gray-700">
                        {child.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )
            }
            return null
          })()}
        </View>
      )}
    </View>
  )
}

export default CategoryPage