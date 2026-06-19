import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

interface ProductModel {
  model: string
  size: string
}

interface Product {
  id: number
  name: string
  code?: string
  models: ProductModel[]
  image_url: string
  layout: number
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
    const cardStyle = isDoubleColumn 
      ? { backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', width: '100%' }
      : { backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }
    
    return (
      <View key={product.id} style={cardStyle}>
        {/* 图片展示 - 自适应尺寸 */}
        <View style={{ position: 'relative', width: '100%' }}>
          {product.image_url ? (
            <Image
              style={{ width: '100%', minHeight: '100px', backgroundColor: '#f5f5f5' }}
              src={product.image_url}
              mode="widthFix"
              onError={() => {
                console.log('图片加载失败:', product.image_url)
              }}
            />
          ) : (
            <View style={{ 
              width: '100%', 
              minHeight: '100px',
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
        <View style={{ padding: isDoubleColumn ? '8px' : '12px' }}>
          {/* 产品名称 + 分类标签（同一行） */}
          <View style={{ marginBottom: '4px', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ 
              fontSize: isDoubleColumn ? '12px' : '14px',
              fontWeight: 'bold',
              color: '#333'
            }}
            >
              {product.name}
            </Text>
            {product.category_name && (
              <Text style={{ 
                fontSize: isDoubleColumn ? '12px' : '14px',
                color: '#92400e',
                marginLeft: '100px',
                backgroundColor: '#fff8f0',
                border: '1px solid #e8d5b8',
                borderRadius: '4px',
                paddingLeft: '6px',
                paddingRight: '6px',
                paddingTop: '2px',
                paddingBottom: '2px'
              }}
              >
                {product.category_name}
              </Text>
            )}
          </View>
          
          {/* 型号和尺寸（加3个空格分隔） */}
          {product.models && product.models.length > 0 && (
            <View>
              {product.models.map((m, idx) => (
                <Text
                  key={idx}
                  style={{
                    display: 'block',
                    fontSize: isDoubleColumn ? '12px' : '14px',
                    color: '#666'
                  }}
                >
                  {m.model}    {m.size}
                </Text>
              ))}
            </View>
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

  // 将产品按排列方式分组
  const singleColumnProducts = products.filter(p => p.layout === 1 || !p.layout)
  const doubleColumnProducts = products.filter(p => p.layout === 2)
  const doubleColumnGroups = groupDoubleColumnProducts(doubleColumnProducts)

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', paddingBottom: '60px' }}>
      {/* 产品列表 */}
      <View style={{ padding: '16px' }}>
        {products.length > 0 ? (
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
                    <View style={{ backgroundColor: 'transparent' }} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {group[1] ? renderProductCard(group[1], true) : (
                    <View style={{ backgroundColor: 'transparent' }} />
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', paddingBottom: '60px' }}>
            <Text style={{ color: '#999', fontSize: '14px' }}>暂无产品，请先在后台添加</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default IndexPage