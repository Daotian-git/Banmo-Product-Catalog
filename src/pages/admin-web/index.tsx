import { View, Text, Image } from '@tarojs/components'
import { Input } from '@/components/ui/input'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

import { Button } from '@/components/ui/button'

// 产品类型定义
interface Product {
  id: number
  name: string
  models: string[] // 多个型号
  image_url?: string
  sizes: string[] // 多个尺寸
  layout: number // 排列方式：1或2
  category_id: number
  category_name?: string
  sort_order: number // 排序权重，数值越大越靠前
}

// 分类类型定义
interface Category {
  id: number
  name: string
  parent_id: number | null
  children?: Category[]
}

export default function AdminWebPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'batch' | 'categories'>('products')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  // 产品表单数据
  const [formData, setFormData] = useState({
    name: '',
    models: [''], // 多个型号
    sizes: [''], // 多个尺寸
    layout: 1, // 默认1列
    categoryId: '',
    sortOrder: 0 // 排序值，越大越靠前
  })
  const [currentImage, setCurrentImage] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [tempImagePath, setTempImagePath] = useState('')
  
  // 分类表单
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryParent, setNewCategoryParent] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  // 批量导入
  const [excelFile, setExcelFile] = useState('')
  const [zipFile, setZipFile] = useState('')
  const [batchUploading, setBatchUploading] = useState(false)
  const [importResult, setImportResult] = useState('')

  // 加载数据
  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await Network.request({ url: '/api/categories' })
      console.log('分类数据:', res.data)
      const data = res.data?.data || res.data || []
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  }

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await Network.request({ url: '/api/products' })
      console.log('产品数据:', res.data)
      const data = res.data?.data || res.data || []
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('加载产品失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 选择图片
  const chooseImage = async () => {
    try {
      const res = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] })
      setTempImagePath(res.tempFilePaths[0])
      setCurrentImage(res.tempFilePaths[0])
    } catch (error) {
      console.error('选择图片失败:', error)
    }
  }

  // 添加型号
  const addModel = () => {
    setFormData(prev => ({ ...prev, models: [...prev.models, ''] }))
  }

  // 删除型号
  const removeModel = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      models: prev.models.filter((_, i) => i !== index) 
    }))
  }

  // 更新型号
  const updateModel = (index: number, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      models: prev.models.map((m, i) => i === index ? value : m) 
    }))
  }

  // 添加尺寸
  const addSize = () => {
    setFormData(prev => ({ ...prev, sizes: [...prev.sizes, ''] }))
  }

  // 删除尺寸
  const removeSize = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      sizes: prev.sizes.filter((_, i) => i !== index) 
    }))
  }

  // 更新尺寸
  const updateSize = (index: number, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      sizes: prev.sizes.map((s, i) => i === index ? value : s) 
    }))
  }

  // 选择分类
  const selectCategory = async () => {
    if (categories.length === 0) {
      Taro.showToast({ title: '请先添加分类', icon: 'none' })
      return
    }
    
    // 构建分类选项（一级分类 + 二级分类）
    const options: string[] = []
    categories.forEach(parent => {
      if (parent.parent_id === null) {
        options.push(parent.name)
        // 添加二级分类
        categories.forEach(child => {
          if (child.parent_id === parent.id) {
            options.push(`  ${parent.name} - ${child.name}`)
          }
        })
      }
    })
    
    try {
      const res = await Taro.showActionSheet({
        itemList: options
      })
      // 根据选择确定分类ID
      const selectedOption = options[res.tapIndex]
      // 如果是二级分类（包含" - "）
      if (selectedOption.includes(' - ')) {
        const parts = selectedOption.trim().split(' - ')
        const childName = parts[1]
        const childCategory = categories.find(c => c.name === childName && c.parent_id !== null)
        if (childCategory) {
          setFormData(prev => ({ ...prev, categoryId: String(childCategory.id) }))
        }
      } else {
        // 一级分类
        const parentCategory = categories.find(c => c.name === selectedOption && c.parent_id === null)
        if (parentCategory) {
          setFormData(prev => ({ ...prev, categoryId: String(parentCategory.id) }))
        }
      }
    } catch (error) {
      console.log('取消选择')
    }
  }

  // 提交产品
  const handleSubmit = async () => {
    if (!formData.name) {
      Taro.showToast({ title: '请输入产品名称', icon: 'none' })
      return
    }
    if (!formData.categoryId) {
      Taro.showToast({ title: '请选择分类', icon: 'none' })
      return
    }

    setUploading(true)
    try {
      if (tempImagePath) {
        // 有图片，使用 uploadFile
        const uploadData = {
          name: formData.name,
          models: JSON.stringify(formData.models.filter(m => m)),
          sizes: JSON.stringify(formData.sizes.filter(s => s)),
          layout: String(formData.layout),
          category_id: formData.categoryId,
          sort_order: String(formData.sortOrder || 0)
        }
        
        const uploadRes = await Network.uploadFile({
          url: '/api/products',
          filePath: tempImagePath,
          name: 'image',
          formData: uploadData
        })
        
        console.log('上传结果:', uploadRes)
        
        if (uploadRes.statusCode === 200 || uploadRes.statusCode === 201) {
          Taro.showToast({ title: editingProduct ? '修改成功' : '添加成功', icon: 'success' })
          resetForm()
          loadProducts()
        } else {
          Taro.showToast({ title: '提交失败', icon: 'none' })
        }
      } else if (editingProduct) {
        // 编辑模式，无新图片
        const res = await Network.request({
          url: `/api/products/${editingProduct.id}`,
          method: 'PUT',
          data: {
            name: formData.name,
            models: formData.models.filter(m => m),
            sizes: formData.sizes.filter(s => s),
            layout: formData.layout,
            category_id: parseInt(formData.categoryId)
          }
        })
        
        if (res.statusCode === 200) {
          Taro.showToast({ title: '修改成功', icon: 'success' })
          resetForm()
          loadProducts()
        }
      } else {
        Taro.showToast({ title: '请选择产品图片', icon: 'none' })
      }
    } catch (error) {
      console.error('提交失败:', error)
      Taro.showToast({ title: '提交失败', icon: 'none' })
    } finally {
      setUploading(false)
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      models: [''],
      sizes: [''],
      layout: 1,
      categoryId: '',
      sortOrder: 0
    })
    setCurrentImage('')
    setTempImagePath('')
    setEditingProduct(null)
  }

  // 编辑产品
  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      models: product.models || [''],
      sizes: product.sizes || [''],
      layout: product.layout || 1,
      categoryId: String(product.category_id),
      sortOrder: product.sort_order || 0
    })
    setCurrentImage(product.image_url || '')
    setTempImagePath('')
  }

  // 删除产品
  const handleDelete = async (productId: number) => {
    try {
      const res = await Taro.showModal({
        title: '确认删除',
        content: '确定要删除这个产品吗？'
      })
      if (res.confirm) {
        await Network.request({
          url: `/api/products/${productId}`,
          method: 'DELETE'
        })
        Taro.showToast({ title: '删除成功', icon: 'success' })
        loadProducts()
      }
    } catch (error) {
      console.error('删除失败:', error)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  // ===== 分类管理 =====
  
  // 添加分类
  const handleAddCategory = async () => {
    if (!newCategoryName) {
      Taro.showToast({ title: '请输入分类名称', icon: 'none' })
      return
    }

    try {
      const data = {
        name: newCategoryName,
        parent_id: newCategoryParent ? parseInt(newCategoryParent) : null
      }
      
      await Network.request({
        url: '/api/categories',
        method: 'POST',
        data
      })
      
      Taro.showToast({ title: '添加成功', icon: 'success' })
      setNewCategoryName('')
      setNewCategoryParent('')
      loadCategories()
    } catch (error) {
      console.error('添加分类失败:', error)
      Taro.showToast({ title: '添加失败', icon: 'none' })
    }
  }

  // 编辑分类
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryParent(category.parent_id ? String(category.parent_id) : '')
  }

  // 保存分类编辑
  const handleSaveCategory = async () => {
    if (!editingCategory || !newCategoryName) return
    
    try {
      await Network.request({
        url: `/api/categories/${editingCategory.id}`,
        method: 'PUT',
        data: {
          name: newCategoryName,
          parent_id: newCategoryParent ? parseInt(newCategoryParent) : null
        }
      })
      
      Taro.showToast({ title: '修改成功', icon: 'success' })
      setEditingCategory(null)
      setNewCategoryName('')
      setNewCategoryParent('')
      loadCategories()
    } catch (error) {
      console.error('修改分类失败:', error)
      Taro.showToast({ title: '修改失败', icon: 'none' })
    }
  }

  // 删除分类
  const handleDeleteCategory = async (categoryId: number) => {
    try {
      const res = await Taro.showModal({
        title: '确认删除',
        content: '确定要删除这个分类吗？'
      })
      if (res.confirm) {
        await Network.request({
          url: `/api/categories/${categoryId}`,
          method: 'DELETE'
        })
        Taro.showToast({ title: '删除成功', icon: 'success' })
        loadCategories()
      }
    } catch (error) {
      console.error('删除分类失败:', error)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  // ===== 批量导入 =====

  // 选择 Excel 文件
  const chooseExcelFile = async () => {
    try {
      const res = await Taro.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['xlsx', 'xls', 'csv']
      })
      setExcelFile(res.tempFiles[0].path)
    } catch (error) {
      console.error('选择文件失败:', error)
    }
  }

  // 选择 ZIP 文件
  const chooseZipFile = async () => {
    try {
      const res = await Taro.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['zip']
      })
      setZipFile(res.tempFiles[0].path)
    } catch (error) {
      console.error('选择ZIP失败:', error)
    }
  }

  // 执行批量导入
  const handleBatchImport = async () => {
    if (!excelFile) {
      Taro.showToast({ title: '请选择Excel文件', icon: 'none' })
      return
    }

    setBatchUploading(true)
    setImportResult('')

    try {
      // 先上传文件
      const uploadFormData: Record<string, string> = {}
      
      const excelRes = await Network.uploadFile({
        url: '/api/products/batch-upload',
        filePath: excelFile,
        name: 'excel',
        formData: uploadFormData
      })

      let excelKey = ''
      if (excelRes.statusCode === 200) {
        const excelData = typeof excelRes.data === 'string' ? JSON.parse(excelRes.data) : excelRes.data
        excelKey = excelData.data?.excelKey || ''
      }

      // 上传 ZIP
      let zipKey = ''
      if (zipFile) {
        const zipRes = await Network.uploadFile({
          url: '/api/products/batch-upload',
          filePath: zipFile,
          name: 'zip',
          formData: {}
        })
        if (zipRes.statusCode === 200) {
          const zipData = typeof zipRes.data === 'string' ? JSON.parse(zipRes.data) : zipRes.data
          zipKey = zipData.data?.zipKey || ''
        }
      }

      // 执行导入
      const importRes = await Network.request({
        url: '/api/products/batch-import',
        method: 'POST',
        data: { excelKey, zipKey }
      })

      if (importRes.statusCode === 200) {
        const result = importRes.data?.data || importRes.data
        setImportResult(`导入成功！共导入 ${result.count || 0} 个产品`)
        loadProducts()
      } else {
        setImportResult('导入失败，请检查文件格式')
      }
    } catch (error) {
      console.error('批量导入失败:', error)
      setImportResult('导入失败：' + String(error))
    } finally {
      setBatchUploading(false)
    }
  }

  // 获取一级分类列表
  const parentCategories = categories.filter(c => c.parent_id === null)
  
  // 获取分类树结构
  const getCategoryTree = () => {
    return parentCategories.map(parent => ({
      ...parent,
      children: categories.filter(c => c.parent_id === parent.id)
    }))
  }

  // 获取选中的分类名称
  const getSelectedCategoryName = () => {
    if (!formData.categoryId) return '请选择分类'
    const category = categories.find(c => c.id === parseInt(formData.categoryId))
    if (category?.parent_id) {
      const parent = categories.find(c => c.id === category.parent_id)
      return parent ? `${parent.name} - ${category.name}` : category.name
    }
    return category?.name || '请选择分类'
  }

  return (
    <View className="admin-full-width" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* 标题 */}
      <View style={{ padding: '16px 24px', backgroundColor: '#fff', borderBottom: '1px solid #e5e5e5' }}>
        <Text className="block" style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a' }}>
          产品管理后台
        </Text>
      </View>

      {/* Tab 切换 */}
      <View style={{ display: 'flex', borderBottom: '2px solid #e5e5e5', backgroundColor: '#fff' }}>
        <View 
          style={{ padding: '12px 24px', cursor: 'pointer', borderBottom: activeTab === 'products' ? '2px solid #b45309' : 'none', marginBottom: '-2px' }}
          onClick={() => setActiveTab('products')}
        >
          <Text className="block" style={{ fontSize: '16px', fontWeight: activeTab === 'products' ? 'bold' : 'normal', color: activeTab === 'products' ? '#b45309' : '#666' }}>
            产品管理
          </Text>
        </View>
        <View 
          style={{ padding: '12px 24px', cursor: 'pointer', borderBottom: activeTab === 'batch' ? '2px solid #b45309' : 'none', marginBottom: '-2px' }}
          onClick={() => setActiveTab('batch')}
        >
          <Text className="block" style={{ fontSize: '16px', fontWeight: activeTab === 'batch' ? 'bold' : 'normal', color: activeTab === 'batch' ? '#b45309' : '#666' }}>
            批量导入
          </Text>
        </View>
        <View 
          style={{ padding: '12px 24px', cursor: 'pointer', borderBottom: activeTab === 'categories' ? '2px solid #b45309' : 'none', marginBottom: '-2px' }}
          onClick={() => setActiveTab('categories')}
        >
          <Text className="block" style={{ fontSize: '16px', fontWeight: activeTab === 'categories' ? 'bold' : 'normal', color: activeTab === 'categories' ? '#b45309' : '#666' }}>
            分类管理
          </Text>
        </View>
      </View>

      {/* 内容区域 - 左右布局 */}
      <View style={{ display: 'flex', minHeight: 'calc(100vh - 100px)' }}>
        {/* 左侧表单区域 */}
        <View style={{ width: '60%', padding: '24px', backgroundColor: '#fff' }}>
          
          {activeTab === 'products' && (
            <View>
              <Text className="block" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                {editingProduct ? '编辑产品' : '新增产品'}
              </Text>

              {/* 产品名称 */}
              <View style={{ marginBottom: '16px' }}>
                <Text className="block" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>产品名称 *</Text>
                <View style={{ backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '8px 12px' }}>
                  <Input 
                    style={{ width: '100%', fontSize: '16px' }}
                    placeholder="输入产品名称"
                    value={formData.name}
                    onInput={(e) => setFormData(prev => ({ ...prev, name: e.detail.value }))}
                  />
                </View>
              </View>

              {/* 多型号输入 */}
              <View style={{ marginBottom: '16px' }}>
                <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Text className="block" style={{ fontSize: '14px', color: '#666' }}>型号（可添加多个）</Text>
                  <Button size="sm" onClick={addModel}>+ 添加型号</Button>
                </View>
                {formData.models.map((model, index) => (
                  <View key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                    <View style={{ flex: 1, backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '8px 12px' }}>
                      <Input 
                        style={{ width: '100%', fontSize: '16px' }}
                        placeholder={`型号 ${index + 1}`}
                        value={model}
                        onInput={(e) => updateModel(index, e.detail.value)}
                      />
                    </View>
                    {formData.models.length > 1 && (
                      <Button size="sm" variant="outline" onClick={() => removeModel(index)}>删除</Button>
                    )}
                  </View>
                ))}
              </View>

              {/* 多尺寸输入 */}
              <View style={{ marginBottom: '16px' }}>
                <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Text className="block" style={{ fontSize: '14px', color: '#666' }}>尺寸（可添加多个）</Text>
                  <Button size="sm" onClick={addSize}>+ 添加尺寸</Button>
                </View>
                {formData.sizes.map((size, index) => (
                  <View key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                    <View style={{ flex: 1, backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '8px 12px' }}>
                      <Input 
                        style={{ width: '100%', fontSize: '16px' }}
                        placeholder={`尺寸 ${index + 1}（如：120×60×45cm）`}
                        value={size}
                        onInput={(e) => updateSize(index, e.detail.value)}
                      />
                    </View>
                    {formData.sizes.length > 1 && (
                      <Button size="sm" variant="outline" onClick={() => removeSize(index)}>删除</Button>
                    )}
                  </View>
                ))}
              </View>

              {/* 排列方式 */}
              <View style={{ marginBottom: '16px' }}>
                <Text className="block" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>排列方式</Text>
                <View style={{ display: 'flex', gap: '12px' }}>
                  <View 
                    style={{ 
                      flex: 1, 
                      padding: '12px', 
                      borderRadius: '8px', 
                      backgroundColor: formData.layout === 1 ? '#fef3c7' : '#f5f5f5',
                      border: formData.layout === 1 ? '2px solid #b45309' : '2px solid transparent',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, layout: 1 }))}
                  >
                    <Text className="block" style={{ fontSize: '16px', fontWeight: formData.layout === 1 ? 'bold' : 'normal' }}>单列排版</Text>
                  </View>
                  <View 
                    style={{ 
                      flex: 1, 
                      padding: '12px', 
                      borderRadius: '8px', 
                      backgroundColor: formData.layout === 2 ? '#fef3c7' : '#f5f5f5',
                      border: formData.layout === 2 ? '2px solid #b45309' : '2px solid transparent',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, layout: 2 }))}
                  >
                    <Text className="block" style={{ fontSize: '16px', fontWeight: formData.layout === 2 ? 'bold' : 'normal' }}>双列排版</Text>
                  </View>
                </View>
              </View>

              {/* 排序值 */}
              <View style={{ marginBottom: '16px' }}>
                <Text className="block" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>排序值（数字越小越靠前）</Text>
                <View style={{ backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '8px 12px' }}>
                  <Input 
                    style={{ width: '100%', fontSize: '16px' }}
                    placeholder="输入排序值（默认100）"
                    type="number"
                    value={formData.sortOrder.toString()}
                    onInput={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.detail.value) || 100 }))}
                  />
                </View>
                <Text className="block" style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  提示：相同分类下，排序值小的产品会排在前面展示
                </Text>
              </View>

              {/* 分类选择 */}
              <View style={{ marginBottom: '16px' }}>
                <Text className="block" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>分类 *</Text>
                <View 
                  style={{ backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '12px', cursor: 'pointer' }}
                  onClick={selectCategory}
                >
                  <Text className="block" style={{ fontSize: '16px', color: formData.categoryId ? '#1a1a1a' : '#999' }}>
                    {getSelectedCategoryName()}
                  </Text>
                </View>
              </View>

              {/* 图片上传 */}
              <View style={{ marginBottom: '16px' }}>
                <Text className="block" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>产品图片</Text>
                {currentImage ? (
                  <View style={{ position: 'relative' }}>
                    <Image 
                      src={currentImage}
                      style={{ width: '200px', height: '200px', borderRadius: '8px', objectFit: 'cover' }}
                      mode="aspectFill"
                    />
                    <Button 
                      size="sm" 
                      style={{ position: 'absolute', top: '8px', right: '8px' }}
                      onClick={chooseImage}
                    >
                      {editingProduct ? '更换图片' : '重新选择'}
                    </Button>
                  </View>
                ) : (
                  <View 
                    style={{ width: '200px', height: '200px', backgroundColor: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px dashed #ccc' }}
                    onClick={chooseImage}
                  >
                    <Text className="block" style={{ fontSize: '14px', color: '#999', textAlign: 'center' }}>
                      点击选择图片
                    </Text>
                  </View>
                )}
              </View>

              {/* 操作按钮 */}
              <View style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Button 
                  style={{ flex: 1 }}
                  onClick={handleSubmit}
                  disabled={uploading}
                >
                  {uploading ? '提交中...' : (editingProduct ? '保存修改' : '提交产品')}
                </Button>
                <Button 
                  style={{ flex: 1 }}
                  variant="outline"
                  onClick={resetForm}
                >
                  重置
                </Button>
              </View>
            </View>
          )}

          {activeTab === 'categories' && (
            <View>
              <Text className="block" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                {editingCategory ? '编辑分类' : '新增分类'}
              </Text>

              {/* 分类名称 */}
              <View style={{ marginBottom: '16px' }}>
                <Text className="block" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>分类名称 *</Text>
                <View style={{ backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '8px 12px' }}>
                  <Input 
                    style={{ width: '100%', fontSize: '16px' }}
                    placeholder="输入分类名称"
                    value={newCategoryName}
                    onInput={(e) => setNewCategoryName(e.detail.value)}
                  />
                </View>
              </View>

              {/* 父级分类 */}
              <View style={{ marginBottom: '16px' }}>
                <Text className="block" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>父级分类（可选，不选则为一级分类）</Text>
                <View 
                  style={{ backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '12px', cursor: 'pointer' }}
                  onClick={async () => {
                    if (parentCategories.length === 0) {
                      Taro.showToast({ title: '暂无一级分类', icon: 'none' })
                      return
                    }
                    const options = parentCategories.map(c => c.name).concat('无（作为一级分类）')
                    try {
                      const res = await Taro.showActionSheet({ itemList: options })
                      if (res.tapIndex < parentCategories.length) {
                        setNewCategoryParent(String(parentCategories[res.tapIndex].id))
                      } else {
                        setNewCategoryParent('')
                      }
                    } catch (error) {
                      console.log('取消选择')
                    }
                  }}
                >
                  <Text className="block" style={{ fontSize: '16px', color: newCategoryParent ? '#1a1a1a' : '#999' }}>
                    {newCategoryParent ? parentCategories.find(c => c.id === parseInt(newCategoryParent))?.name || '选择父级分类' : '选择父级分类（可选）'}
                  </Text>
                </View>
              </View>

              {/* 操作按钮 */}
              <View style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Button 
                  style={{ flex: 1 }}
                  onClick={editingCategory ? handleSaveCategory : handleAddCategory}
                >
                  {editingCategory ? '保存修改' : '添加分类'}
                </Button>
                {editingCategory && (
                  <Button 
                    style={{ flex: 1 }}
                    variant="outline"
                    onClick={() => {
                      setEditingCategory(null)
                      setNewCategoryName('')
                      setNewCategoryParent('')
                    }}
                  >
                    取消编辑
                  </Button>
                )}
              </View>
            </View>
          )}

          {activeTab === 'batch' && (
            <View>
              <Text className="block" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                批量导入产品
              </Text>

              <View style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                <Text className="block" style={{ fontSize: '14px', color: '#92400e', marginBottom: '8px' }}>
                  Excel 表格格式要求：
                </Text>
                <Text className="block" style={{ fontSize: '12px', color: '#92400e' }}>
                  列名：名称、型号、尺寸、排列方式、分类名称、图片文件名{'\n'}
                  型号和尺寸可以有多个，用逗号分隔（如：型号1,型号2）{'\n'}
                  排列方式：1（单列）或 2（双列）
                </Text>
              </View>

              {/* Excel 文件 */}
              <View style={{ marginBottom: '16px' }}>
                <Text className="block" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Excel 文件 *</Text>
                <View style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Button onClick={chooseExcelFile}>选择文件</Button>
                  <Text className="block" style={{ fontSize: '14px', color: '#666' }}>
                    {excelFile ? '已选择' : '未选择'}
                  </Text>
                </View>
              </View>

              {/* ZIP 文件 */}
              <View style={{ marginBottom: '16px' }}>
                <Text className="block" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>图片 ZIP 包（可选）</Text>
                <View style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Button onClick={chooseZipFile}>选择 ZIP</Button>
                  <Text className="block" style={{ fontSize: '14px', color: '#666' }}>
                    {zipFile ? '已选择' : '未选择'}
                  </Text>
                </View>
              </View>

              {/* 导入按钮 */}
              <Button 
                style={{ marginTop: '24px' }}
                onClick={handleBatchImport}
                disabled={batchUploading}
              >
                {batchUploading ? '导入中...' : '开始批量导入'}
              </Button>

              {/* 导入结果 */}
              {importResult && (
                <View style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
                  <Text className="block" style={{ fontSize: '14px' }}>{importResult}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 右侧列表区域 */}
        <View style={{ width: '40%', padding: '24px', backgroundColor: '#fafafa', borderLeft: '1px solid #e5e5e5' }}>
          {activeTab === 'products' && (
            <View>
              <Text className="block" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                产品列表 ({products.length})
              </Text>
              
              {loading ? (
                <Text className="block" style={{ fontSize: '14px', color: '#999' }}>加载中...</Text>
              ) : products.length === 0 ? (
                <Text className="block" style={{ fontSize: '14px', color: '#999' }}>暂无产品，请添加</Text>
              ) : (
                <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {products.map(product => (
                    <View key={product.id} style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
                      <View style={{ display: 'flex', gap: '12px' }}>
                        {product.image_url && (
                          <Image 
                            src={product.image_url}
                            style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover' }}
                            mode="aspectFill"
                          />
                        )}
                        <View style={{ flex: 1 }}>
                          <Text className="block" style={{ fontSize: '16px', fontWeight: 'bold' }}>{product.name}</Text>
                          <Text className="block" style={{ fontSize: '12px', color: '#666' }}>
                            型号: {(product.models || []).join(', ') || '无'}
                          </Text>
                          <Text className="block" style={{ fontSize: '12px', color: '#666' }}>
                            尺寸: {(product.sizes || []).join(', ') || '无'}
                          </Text>
                          <Text className="block" style={{ fontSize: '12px', color: '#666' }}>
                            排列: {product.layout === 2 ? '双列' : '单列'} | 分类: {product.category_name || '无'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <Button size="sm" onClick={() => handleEdit(product)}>编辑</Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(product.id)}>删除</Button>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'categories' && (
            <View>
              <Text className="block" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                分类列表
              </Text>
              
              {categories.length === 0 ? (
                <Text className="block" style={{ fontSize: '14px', color: '#999' }}>暂无分类，请添加</Text>
              ) : (
                <View style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {getCategoryTree().map(parent => (
                    <View key={parent.id} style={{ marginBottom: '8px' }}>
                      <View style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #b45309' }}>
                        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text className="block" style={{ fontSize: '16px', fontWeight: 'bold', color: '#b45309' }}>
                            {parent.name}
                          </Text>
                          <View style={{ display: 'flex', gap: '8px' }}>
                            <Button size="sm" onClick={() => handleEditCategory(parent)}>编辑</Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteCategory(parent.id)}>删除</Button>
                          </View>
                        </View>
                      </View>
                      {/* 二级分类 */}
                      {parent.children && parent.children.length > 0 && (
                        <View style={{ marginTop: '4px', paddingLeft: '16px' }}>
                          {parent.children.map(child => (
                            <View key={child.id} style={{ padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '4px' }}>
                              <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text className="block" style={{ fontSize: '14px', color: '#666' }}>
                                  {child.name}
                                </Text>
                                <View style={{ display: 'flex', gap: '4px' }}>
                                  <Button size="sm" onClick={() => handleEditCategory(child)}>编辑</Button>
                                  <Button size="sm" variant="outline" onClick={() => handleDeleteCategory(child.id)}>删除</Button>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'batch' && (
            <View>
              <Text className="block" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                导入说明
              </Text>
              <View style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px' }}>
                <Text className="block" style={{ fontSize: '14px', marginBottom: '12px' }}>
                  1. 准备 Excel 文件，包含以下列：
                </Text>
                <Text className="block" style={{ fontSize: '12px', color: '#666', marginLeft: '16px' }}>
                  名称、型号、尺寸、排列方式、分类名称、图片文件名{'\n'}
                  （型号和尺寸可以有多个，用逗号分隔）
                </Text>
                <Text className="block" style={{ fontSize: '14px', marginBottom: '12px', marginTop: '12px' }}>
                  2. 将产品图片打包成 ZIP 文件
                </Text>
                <Text className="block" style={{ fontSize: '12px', color: '#666', marginLeft: '16px' }}>
                  图片文件名与 Excel 中的图片文件名对应
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}