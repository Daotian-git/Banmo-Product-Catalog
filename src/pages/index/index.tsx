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
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('全系列')

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

  // 筛选产品
  const filteredProducts = activeFilter === '全系列'
    ? products
    : products.filter(p => {
        const catName = p.category_name || ''
        return catName.startsWith(activeFilter.replace('系列', ''))
      })

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
              style={{ width: '100%', height: 'auto', display: 'block', backgroundColor: '#f5f5f5' }}
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
              fontSize: isDoubleColumn ? '14px' : '16px',
              fontWeight: 'bold',
              color: '#333'
            }}
            >
              {product.name}
            </Text>
            {product.category_name && (
              <Text style={{
                fontSize: isDoubleColumn ? '8px' : '10px',
                color: '#92400e',
                marginLeft: '10px',
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
                <View
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: isDoubleColumn ? 'column' : 'row',
                    fontSize: isDoubleColumn ? '12px' : '14px',
                    color: '#666',
                    marginBottom: isDoubleColumn && idx < product.models.length - 1 ? '4px' : '0'
                  }}
                >
                  <Text>{m.model}</Text>
                  <Text style={{ marginLeft: isDoubleColumn ? '0' : '10px', marginTop: isDoubleColumn ? '2px' : '0' }}>{m.size}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#999' }}>加载中...</Text>
      </View>
    )
  }

  // 按排列方式分组双列产品（保持原始排序，只是渲染时两两成行）
  const renderProductList = () => {
    const rows: (Product | null)[][] = []
    let pendingDouble: Product | null = null

    for (const product of filteredProducts) {
      const layout = product.layout || 1
      if (layout === 2) {
        // 双列：凑对
        if (pendingDouble) {
          rows.push([pendingDouble, product])
          pendingDouble = null
        } else {
          pendingDouble = product
        }
      } else {
        // 单列：先收尾之前悬空的双列
        if (pendingDouble) {
          rows.push([pendingDouble, null])
          pendingDouble = null
        }
        rows.push([product])
      }
    }
    // 收尾
    if (pendingDouble) {
      rows.push([pendingDouble, null])
    }

    return rows.map((row, rowIdx) => {
      const isDouble = row.length === 2
      if (isDouble) {
        return (
          <View key={rowIdx} style={{ display: 'flex', flexDirection: 'row', gap: '8px', marginBottom: '8px' }}>
            <View style={{ flex: 1 }}>
              {row[0] ? renderProductCard(row[0], true) : <View />}
            </View>
            <View style={{ flex: 1 }}>
              {row[1] ? renderProductCard(row[1], true) : <View />}
            </View>
          </View>
        )
      }
      return (
        <View key={rowIdx} style={{ marginBottom: '16px' }}>
          {renderProductCard(row[0]!, false)}
        </View>
      )
    })
  }

  const filterOptions = ['全系列', '乌金木系列', '黑檀木系列']

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', paddingBottom: '100px' }}>
      <View style={{ padding: '16px' }}>
        {products.length > 0 ? (
          <View>{renderProductList()}</View>
        ) : (
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', paddingBottom: '60px' }}>
            <Text style={{ color: '#999', fontSize: '14px' }}>暂无产品，请先在后台添加</Text>
          </View>
        )}
      </View>

      {/* 分类筛选按钮 */}
      <View
        style={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 200
        }}
      >
        {/* 筛选弹窗 */}
        {filterOpen && (
          <View style={{
            position: 'absolute',
            bottom: 56,
            right: 0,
            backgroundColor: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            minWidth: 160
          }}>
            {filterOptions.map((option, idx) => (
              <View
                key={option}
                style={{
                  padding: '14px 20px',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: activeFilter === option ? '#fff8f0' : '#fff',
                  borderBottom: idx < filterOptions.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}
                onClick={() => {
                  setActiveFilter(option)
                  setFilterOpen(false)
                }}
              >
                <Text style={{
                  fontSize: 15,
                  color: activeFilter === option ? '#92400e' : '#333',
                  fontWeight: activeFilter === option ? 'bold' : 'normal'
                }}>
                  {option}
                </Text>
                {activeFilter === option && (
                  <Text style={{ fontSize: 12, color: '#92400e' }}>✓</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 浮动按钮 */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: filterOpen ? '#fff' : '#92400e',
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setFilterOpen(!filterOpen)}
        >
          {filterOpen ? (
            <Text style={{ fontSize: 20, color: '#92400e', fontWeight: 'bold' }}>✕</Text>
          ) : (
            <Text style={{ fontSize: 22, color: '#fff' }}>☰</Text>
          )}
        </View>
      </View>
    </View>
  )
}

export default IndexPage