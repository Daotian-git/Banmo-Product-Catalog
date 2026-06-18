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
  code?: string // 产品编号
  models: ProductModel[] // 型号和尺寸数组
  image_url: string
  layout: number // 排列方式：1单列，2双列
  category_id: number
  category_name?: string // 完整分类路径如"乌金木-沙发"
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
          
          {/* 产品编号 */}
          {product.code && (
            <Text
              style={{
                display: 'block',
                fontSize: isDoubleColumn ? '12px' : '14px',
                color: '#888',
                marginBottom: '4px'
              }}
            >
              编号：{product.code}
            </Text>
          )}
          
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

  // 将产品按排列方式分组
  const singleColumnProducts = products.filter(p => p.layout === 1 || !p.layout)
  const doubleColumnProducts = products.filter(p => p.layout === 2)
  const doubleColumnGroups = groupDoubleColumnProducts(doubleColumnProducts)

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', paddingBottom: '60px' }}>
      {/* 标题 */}
      <View style={{ padding: '16px', marginBottom: '16px' }}>
        <Text style={{ display: 'block', fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
          产品图册
        </Text>
        <Text style={{ display: 'block', fontSize: '14px', color: '#666', marginTop: '4px' }}>
          新中式雅韵，匠心之作
        </Text>
      </View>

      {/* 产品列表 */}
      <View style={{ padding: '0 16px' }}>
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
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', paddingBottom: '60px' }}>
            <Text style={{ color: '#999', fontSize: '14px' }}>暂无产品，请先在后台添加</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default IndexPage