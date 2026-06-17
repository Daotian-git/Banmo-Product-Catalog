import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

interface Category {
  id: number
  name: string
  parent_id: number | null
  children?: Category[]
}

interface ProductModel {
  model: string
  size: string
}

interface Product {
  id: number
  name: string
  models: ProductModel[] // 型号和尺寸数组
  image_url: string
  layout: number // 排列方式：1单列，2双列
  category_id: number
  category_name?: string // 完整分类路径
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
    const cardStyle = isDoubleColumn 
      ? { backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', width: '100%' }
      : { backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }
    
    return (
      <View key={product.id} style={cardStyle}>
        {/* 图片展示 - 不裁切，自适应 */}
        <View style={{ position: 'relative', width: '100%' }}>
          {product.image_url ? (
            <Image
              style={{ width: '100%', height: isDoubleColumn ? '180px' : '300px' }}
              src={product.image_url}
              mode="aspectFit"
            />
          ) : (
            <View style={{ 
              width: '100%', 
              height: isDoubleColumn ? '180px' : '300px', 
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            >
              <Text style={{ color: '#999', fontSize: '12px' }}>暂无图片</Text>
            </View>
          )}
        </View>
        
        {/* 产品信息 */}
        <View style={{ padding: isDoubleColumn ? '8px' : '16px' }}>
          {/* 名称 */}
          <Text style={{ 
            display: 'block',
            fontSize: isDoubleColumn ? '14px' : '18px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '8px'
          }}
          >
            {product.name}
          </Text>
          
          {/* 型号和对应尺寸 */}
          {product.models && product.models.length > 0 && (
            <View style={{ marginBottom: '8px' }}>
              {product.models.map((m, idx) => (
                <Text
                  key={idx}
                  style={{
                    display: 'block',
                    fontSize: isDoubleColumn ? '12px' : '14px',
                    color: '#666',
                    marginBottom: '4px'
                  }}
                >
                  {m.model} · {m.size}
                </Text>
              ))}
            </View>
          )}
          
          {/* 分类（小字显示完整路径） */}
          {product.category_name && (
            <Text style={{ 
              display: 'block',
              fontSize: '10px',
              color: '#999'
            }}
            >
              {product.category_name}
            </Text>
          )}
        </View>
      </View>
    )
  }

  // 将双列产品按两行分组，处理奇数情况
  const groupDoubleColumnProducts = (productList: Product[]) => {
    const groups: (Product | null)[][] = []
    for (let i = 0; i < productList.length; i += 2) {
      const group: (Product | null)[] = [productList[i]]
      if (i + 1 < productList.length) {
        group.push(productList[i + 1])
      } else {
        // 奇数时最后一个位置空着
        group.push(null)
      }
      groups.push(group)
    }
    return groups
  }

  if (loading) {
    return (
      <View style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#999' }}>加载中...</Text>
      </View>
    )
  }

  // 获取一级分类
  const parentCategories = categories.filter(c => !c.parent_id)
  
  // 将产品按排列方式分组
  const singleColumnProducts = filteredProducts.filter(p => p.layout === 1 || !p.layout)
  const doubleColumnProducts = filteredProducts.filter(p => p.layout === 2)
  const doubleColumnGroups = groupDoubleColumnProducts(doubleColumnProducts)

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      {/* 产品数量 */}
      <View style={{ padding: '12px 16px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <Text style={{ display: 'block', fontSize: '14px', color: '#666' }}>
          共 {filteredProducts.length} 件产品
        </Text>
      </View>

      {/* 产品列表 */}
      <View style={{ flex: 1, padding: '16px', paddingBottom: '120px' }}>
        {filteredProducts.length > 0 ? (
          <View>
            {/* 单列产品 */}
            {singleColumnProducts.map(product => (
              <View key={product.id} style={{ marginBottom: '16px' }}>
                {renderProductCard(product, false)}
              </View>
            ))}
            
            {/* 双列产品 - 两列布局，奇数时最后一个位置空着 */}
            {doubleColumnGroups.map((group, groupIdx) => (
              <View 
                key={groupIdx}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  gap: '8px',
                  marginBottom: '8px'
                }}
              >
                <View style={{ flex: 1 }}>
                  {group[0] ? renderProductCard(group[0], true) : (
                    <View style={{ backgroundColor: 'transparent', height: '280px' }} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {group[1] ? renderProductCard(group[1], true) : (
                    <View style={{ backgroundColor: 'transparent', height: '280px' }} />
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
            <Text style={{ display: 'block', color: '#999', fontSize: '14px' }}>
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
          <View style={{ display: 'flex', flexDirection: 'row', gap: '8px', overflowX: 'auto' }}>
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
              <Text style={{ display: 'block', fontSize: '14px', color: selectedCategoryId === null ? '#fff' : '#333' }}>
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
                <Text style={{ display: 'block', fontSize: '14px', color: selectedCategoryId === cat.id ? '#fff' : '#333' }}>
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
                <View style={{ display: 'flex', flexDirection: 'row', gap: '8px', marginTop: '8px', overflowX: 'auto' }}>
                  {selectedParent.children.map(child => (
                    <View
                      key={child.id}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        backgroundColor: '#fef3c7'
                      }}
                      onClick={() => setSelectedCategoryId(child.id)}
                    >
                      <Text style={{ display: 'block', fontSize: '12px', color: '#92400e' }}>
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