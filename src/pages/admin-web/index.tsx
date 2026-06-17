import { View, Text, Image } from '@tarojs/components'
import { Input } from '@/components/ui/input'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// 产品类型定义
interface Product {
  id: number
  name: string
  model?: string
  category_id: number
  material?: string
  size?: string
  process?: string
  origin?: string
  image_url?: string
  categories?: { id: number; name: string }
}

interface Category {
  id: number
  name: string
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
    model: '',
    categoryId: '',
    material: '',
    size: '',
    process: '',
    origin: ''
  })
  const [currentImage, setCurrentImage] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [tempImagePath, setTempImagePath] = useState('')
  
  // 分类表单
  const [newCategory, setNewCategory] = useState({ name: '' })
  
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

  // 提交产品
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请填写产品名称', icon: 'none' })
      return
    }
    if (!formData.categoryId) {
      Taro.showToast({ title: '请选择分类', icon: 'none' })
      return
    }

    setUploading(true)
    try {
      if (editingProduct) {
        // 编辑模式
        const updateData: any = {
          name: formData.name,
          model: formData.model,
          category_id: parseInt(formData.categoryId),
          material: formData.material,
          size: formData.size,
          process: formData.process,
          origin: formData.origin
        }

        // 如果选择了新图片，需要上传
        if (tempImagePath) {
          const uploadRes = await Network.uploadFile({
            url: '/api/products',
            filePath: tempImagePath,
            name: 'image',
            formData: updateData
          })
          console.log('上传更新结果:', uploadRes.data)
        } else {
          // 没有新图片，直接更新
          await Network.request({
            url: `/api/products/${editingProduct.id}`,
            method: 'PUT',
            data: updateData
          })
        }
        Taro.showToast({ title: '修改成功', icon: 'success' })
        setEditingProduct(null)
      } else {
        // 新增模式
        if (!tempImagePath) {
          Taro.showToast({ title: '请选择产品图片', icon: 'none' })
          setUploading(false)
          return
        }

        const uploadRes = await Network.uploadFile({
          url: '/api/products',
          filePath: tempImagePath,
          name: 'image',
          formData: {
            name: formData.name,
            model: formData.model,
            category_id: parseInt(formData.categoryId),
            material: formData.material,
            size: formData.size,
            process: formData.process,
            origin: formData.origin
          }
        })
        console.log('上传结果:', uploadRes.data)
        Taro.showToast({ title: '添加成功', icon: 'success' })
      }

      // 重置表单
      setFormData({ name: '', model: '', categoryId: '', material: '', size: '', process: '', origin: '' })
      setCurrentImage('')
      setTempImagePath('')
      loadProducts()
    } catch (error: any) {
      console.error('提交失败:', error)
      Taro.showToast({ title: error.message || '提交失败', icon: 'none' })
    } finally {
      setUploading(false)
    }
  }

  // 开始编辑产品
  const startEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      model: product.model || '',
      categoryId: String(product.category_id),
      material: product.material || '',
      size: product.size || '',
      process: product.process || '',
      origin: product.origin || ''
    })
    setCurrentImage(product.image_url || '')
    setTempImagePath('')
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingProduct(null)
    setFormData({ name: '', model: '', categoryId: '', material: '', size: '', process: '', origin: '' })
    setCurrentImage('')
    setTempImagePath('')
  }

  // 删除产品
  const handleDeleteProduct = async (id: number) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个产品吗？'
    })
    if (res.confirm) {
      try {
        await Network.request({
          url: `/api/products/${id}`,
          method: 'DELETE'
        })
        Taro.showToast({ title: '删除成功', icon: 'success' })
        loadProducts()
      } catch (error) {
        Taro.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  }

  // 添加分类
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      Taro.showToast({ title: '请填写分类名称', icon: 'none' })
      return
    }
    try {
      await Network.request({
        url: '/api/categories',
        method: 'POST',
        data: { name: newCategory.name }
      })
      Taro.showToast({ title: '添加成功', icon: 'success' })
      setNewCategory({ name: '' })
      loadCategories()
    } catch (error) {
      Taro.showToast({ title: '添加失败', icon: 'none' })
    }
  }

  // 删除分类
  const handleDeleteCategory = async (id: number) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '删除分类后，该分类下的产品将变为未分类状态，确定要删除吗？'
    })
    if (res.confirm) {
      try {
        await Network.request({
          url: `/api/categories/${id}`,
          method: 'DELETE'
        })
        Taro.showToast({ title: '删除成功', icon: 'success' })
        loadCategories()
        loadProducts()
      } catch (error) {
        Taro.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  }

  // 选择Excel文件
  const handleChooseExcel = async () => {
    try {
      const res = await Taro.chooseMessageFile({ count: 1, type: 'file', extension: ['xlsx', 'xls', 'csv'] })
      setExcelFile(res.tempFiles[0].path)
      setImportResult('')
    } catch (error) {
      console.error('选择Excel失败:', error)
    }
  }

  // 选择ZIP文件
  const handleChooseZip = async () => {
    try {
      const res = await Taro.chooseMessageFile({ count: 1, type: 'file', extension: ['zip'] })
      setZipFile(res.tempFiles[0].path)
    } catch (error) {
      console.error('选择ZIP失败:', error)
    }
  }

  // 执行批量导入
  const handleBatchImport = async () => {
    if (!excelFile) {
      Taro.showToast({ title: '请先选择Excel文件', icon: 'none' })
      return
    }

    setBatchUploading(true)
    setImportResult('正在处理...')

    try {
      // 上传Excel文件
      const uploadRes = await Network.uploadFile({
        url: '/api/products/batch-upload',
        filePath: excelFile,
        name: 'excel',
        formData: {}
      })
      console.log('Excel上传结果:', uploadRes.data)
      const excelData = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data
      const excelKey = excelData?.data?.excelKey || excelData?.excelKey

      // 上传ZIP文件（如果有）
      let zipKey = ''
      if (zipFile) {
        const zipRes = await Network.uploadFile({
          url: '/api/products/batch-upload',
          filePath: zipFile,
          name: 'zip',
          formData: {}
        })
        console.log('ZIP上传结果:', zipRes.data)
        const zipData = typeof zipRes.data === 'string' ? JSON.parse(zipRes.data) : zipRes.data
        zipKey = zipData?.data?.zipKey || zipData?.zipKey
      }

      // 执行导入
      const importRes = await Network.request({
        url: '/api/products/batch-import',
        method: 'POST',
        data: { excelKey, zipKey }
      })
      console.log('导入结果:', importRes.data)

      const result = importRes.data?.data || importRes.data
      setImportResult(`导入完成！成功 ${result.success || 0} 条，失败 ${result.failed || 0} 条`)
      
      if (result.success > 0) {
        loadProducts()
        Taro.showToast({ title: '导入成功', icon: 'success' })
      }
    } catch (error: any) {
      console.error('批量导入失败:', error)
      setImportResult(`导入失败：${error.message || '请检查Excel格式'}`)
      Taro.showToast({ title: '导入失败', icon: 'none' })
    } finally {
      setBatchUploading(false)
      setExcelFile('')
      setZipFile('')
    }
  }

  const isEdit = Boolean(editingProduct)

  return (
    <View className="min-h-screen bg-gray-100" style={{ padding: '24px' }}>
      {/* 标题 */}
      <View style={{ marginBottom: '24px' }}>
        <Text className="block text-3xl font-bold text-gray-800">产品图册管理后台</Text>
        <Text className="block text-base text-gray-500" style={{ marginTop: '8px' }}>管理分类和产品信息</Text>
      </View>

      {/* Tab切换 */}
      <View style={{ display: 'flex', flexDirection: 'row', gap: '12px', marginBottom: '24px' }}>
        <Button 
          variant={activeTab === 'products' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('products'); cancelEdit() }}
        >
          <Text>产品管理</Text>
        </Button>
        <Button 
          variant={activeTab === 'batch' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('batch'); cancelEdit() }}
        >
          <Text>批量导入</Text>
        </Button>
        <Button 
          variant={activeTab === 'categories' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('categories'); cancelEdit() }}
        >
          <Text>分类管理</Text>
        </Button>
      </View>

      {/* 主内容区 - PC宽屏布局 */}
      <View style={{ display: 'flex', flexDirection: 'row', gap: '24px' }}>
        {/* 左侧：表单区 */}
        <View style={{ width: '400px', flexShrink: 0 }}>
          {activeTab === 'batch' ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Text className="text-xl font-semibold">批量导入产品</Text>
                </CardTitle>
              </CardHeader>
              <CardContent style={{ padding: '24px' }}>
                {/* 使用说明 */}
                <View style={{ backgroundColor: '#fef3c7', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                  <Text className="block text-base font-semibold text-amber-800" style={{ marginBottom: '8px' }}>使用说明：</Text>
                  <Text className="block text-sm text-gray-700">1. 准备Excel文件（xlsx格式），包含产品信息</Text>
                  <Text className="block text-sm text-gray-700">2. Excel列名：名称、型号、分类ID、材质、尺寸、工艺、产地、图片文件名</Text>
                  <Text className="block text-sm text-gray-700">3. 图片打包成ZIP文件，文件名与Excel中的图片文件名对应</Text>
                  <Text className="block text-sm text-gray-700">4. 分类ID可在右侧分类列表查看</Text>
                </View>
                
                {/* Excel文件选择 */}
                <View style={{ marginBottom: '16px' }}>
                  <Text className="block text-base font-medium text-gray-700" style={{ marginBottom: '8px' }}>Excel文件：</Text>
                  <Button 
                    variant="outline" 
                    onClick={handleChooseExcel}
                    style={{ width: '100%', padding: '12px 16px' }}
                  >
                    <Text className="text-base">{excelFile ? '已选择Excel文件' : '选择Excel文件（xlsx）'}</Text>
                  </Button>
                  {excelFile && (
                    <Text className="block text-sm text-gray-500" style={{ marginTop: '8px' }}>{excelFile.split('/').pop()}</Text>
                  )}
                </View>
                
                {/* ZIP文件选择 */}
                <View style={{ marginBottom: '20px' }}>
                  <Text className="block text-base font-medium text-gray-700" style={{ marginBottom: '8px' }}>图片ZIP包（可选）：</Text>
                  <Button 
                    variant="outline" 
                    onClick={handleChooseZip}
                    style={{ width: '100%', padding: '12px 16px' }}
                  >
                    <Text className="text-base">{zipFile ? '已选择ZIP文件' : '选择图片ZIP包'}</Text>
                  </Button>
                  {zipFile && (
                    <Text className="block text-sm text-gray-500" style={{ marginTop: '8px' }}>{zipFile.split('/').pop()}</Text>
                  )}
                </View>
                
                {/* 导入按钮 */}
                <Button 
                  className="bg-amber-800"
                  onClick={handleBatchImport}
                  disabled={batchUploading || !excelFile}
                  style={{ width: '100%', padding: '14px 16px' }}
                >
                  <Text className="text-white text-base">
                    {batchUploading ? '导入中...' : '开始批量导入'}
                  </Text>
                </Button>
                
                {/* 导入结果 */}
                {importResult && (
                  <View style={{ backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '12px', marginTop: '16px' }}>
                    <Text className="block text-base">{importResult}</Text>
                  </View>
                )}
              </CardContent>
            </Card>
          ) : activeTab === 'products' ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Text className="text-xl font-semibold">
                    {editingProduct ? `编辑产品：${editingProduct.name}` : '添加产品'}
                  </Text>
                </CardTitle>
              </CardHeader>
              <CardContent style={{ padding: '24px' }}>
                {/* 图片选择 */}
                <View style={{ marginBottom: '20px' }}>
                  <Text className="block text-base text-gray-600" style={{ marginBottom: '8px' }}>产品图片</Text>
                  <View style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' }}>
                    {currentImage ? (
                      <Image 
                        style={{ width: '120px', height: '120px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        src={currentImage}
                        mode="aspectFill"
                      />
                    ) : (
                      <View 
                        style={{ width: '120px', height: '120px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={chooseImage}
                      >
                        <Text className="block text-gray-400">点击选择图片</Text>
                      </View>
                    )}
                    <Button variant="outline" onClick={chooseImage} style={{ padding: '10px 16px' }}>
                      <Text className="text-base">{isEdit ? '更换图片' : '选择图片'}</Text>
                    </Button>
                  </View>
                </View>

                {/* 分类选择 */}
                <View style={{ marginBottom: '16px' }}>
                  <Text className="block text-base text-gray-600" style={{ marginBottom: '8px' }}>所属分类 *</Text>
                  <View 
                    style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => {
                      if (categories.length === 0) {
                        Taro.showToast({ title: '请先添加分类', icon: 'none' })
                        return
                      }
                      Taro.showActionSheet({
                        itemList: categories.map(cat => cat.name),
                        success: (res) => {
                          setFormData({ ...formData, categoryId: String(categories[res.tapIndex].id) })
                        }
                      })
                    }}
                  >
                    <Text className="block text-base">
                      {formData.categoryId 
                        ? categories.find(c => String(c.id) === formData.categoryId)?.name || '请选择分类'
                        : '请选择分类'}
                    </Text>
                    <Text className="block text-gray-400">▼</Text>
                  </View>
                </View>

                {/* 产品名称 */}
                <View style={{ marginBottom: '16px' }}>
                  <Text className="block text-base text-gray-600" style={{ marginBottom: '8px' }}>产品名称 *</Text>
                  <View style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px 16px' }}>
                    <Input 
                      style={{ width: '100%', backgroundColor: 'transparent', fontSize: '16px' }}
                      placeholder="如：明式圈椅"
                      value={formData.name}
                      onInput={(e: any) => setFormData({ ...formData, name: e.detail.value })}
                    />
                  </View>
                </View>

                {/* 产品型号 */}
                <View style={{ marginBottom: '16px' }}>
                  <Text className="block text-base text-gray-600" style={{ marginBottom: '8px' }}>产品型号</Text>
                  <View style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px 16px' }}>
                    <Input 
                      style={{ width: '100%', backgroundColor: 'transparent', fontSize: '16px' }}
                      placeholder="如：MXQY-001"
                      value={formData.model}
                      onInput={(e: any) => setFormData({ ...formData, model: e.detail.value })}
                    />
                  </View>
                </View>

                {/* 材质 */}
                <View style={{ marginBottom: '16px' }}>
                  <Text className="block text-base text-gray-600" style={{ marginBottom: '8px' }}>材质</Text>
                  <View style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px 16px' }}>
                    <Input 
                      style={{ width: '100%', backgroundColor: 'transparent', fontSize: '16px' }}
                      placeholder="如：北美黑胡桃木"
                      value={formData.material}
                      onInput={(e: any) => setFormData({ ...formData, material: e.detail.value })}
                    />
                  </View>
                </View>

                {/* 尺寸 */}
                <View style={{ marginBottom: '16px' }}>
                  <Text className="block text-base text-gray-600" style={{ marginBottom: '8px' }}>尺寸</Text>
                  <View style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px 16px' }}>
                    <Input 
                      style={{ width: '100%', backgroundColor: 'transparent', fontSize: '16px' }}
                      placeholder="如：120×60×45cm"
                      value={formData.size}
                      onInput={(e: any) => setFormData({ ...formData, size: e.detail.value })}
                    />
                  </View>
                </View>

                {/* 工艺 */}
                <View style={{ marginBottom: '16px' }}>
                  <Text className="block text-base text-gray-600" style={{ marginBottom: '8px' }}>工艺</Text>
                  <View style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px 16px' }}>
                    <Input 
                      style={{ width: '100%', backgroundColor: 'transparent', fontSize: '16px' }}
                      placeholder="如：榫卯结构，手工打磨"
                      value={formData.process}
                      onInput={(e: any) => setFormData({ ...formData, process: e.detail.value })}
                    />
                  </View>
                </View>

                {/* 产地 */}
                <View style={{ marginBottom: '20px' }}>
                  <Text className="block text-base text-gray-600" style={{ marginBottom: '8px' }}>产地</Text>
                  <View style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px 16px' }}>
                    <Input 
                      style={{ width: '100%', backgroundColor: 'transparent', fontSize: '16px' }}
                      placeholder="如：浙江东阳"
                      value={formData.origin}
                      onInput={(e: any) => setFormData({ ...formData, origin: e.detail.value })}
                    />
                  </View>
                </View>

                {/* 按钮 */}
                <View style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
                  <Button 
                    className="bg-amber-800 text-white flex-1"
                    onClick={handleSubmit}
                    disabled={uploading}
                    style={{ padding: '14px 16px' }}
                  >
                    <Text className="text-base">{uploading ? '保存中...' : (isEdit ? '保存修改' : '提交产品')}</Text>
                  </Button>
                  {isEdit && (
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={cancelEdit}
                      style={{ padding: '14px 16px' }}
                    >
                      <Text className="text-base">取消</Text>
                    </Button>
                  )}
                </View>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Text className="text-xl font-semibold">添加分类</Text>
                </CardTitle>
              </CardHeader>
              <CardContent style={{ padding: '24px' }}>
                <View style={{ marginBottom: '16px' }}>
                  <Text className="block text-base text-gray-600" style={{ marginBottom: '8px' }}>分类名称 *</Text>
                  <View style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px 16px' }}>
                    <Input 
                      style={{ width: '100%', backgroundColor: 'transparent', fontSize: '16px' }}
                      placeholder="如：座椅系列"
                      value={newCategory.name}
                      onInput={(e: any) => setNewCategory({ name: e.detail.value })}
                    />
                  </View>
                </View>
                <Button 
                  className="bg-amber-800 text-white w-full"
                  onClick={handleAddCategory}
                  style={{ padding: '14px 16px' }}
                >
                  <Text className="text-base">提交分类</Text>
                </Button>
              </CardContent>
            </Card>
          )}
        </View>

        {/* 右侧：列表区 */}
        <View style={{ flex: 1, minWidth: '400px' }}>
          <Card>
            <CardHeader>
              <CardTitle>
                <Text className="text-xl font-semibold">
                  {activeTab === 'products' ? '产品列表' : '分类列表'}
                </Text>
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '24px' }}>
              {loading ? (
                <Text className="block text-gray-400 text-base">加载中...</Text>
              ) : activeTab === 'products' ? (
                products.length > 0 ? (
                  <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {products.map(product => (
                      <View 
                        key={product.id}
                        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}
                      >
                        <View 
                          style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', flex: 1 }}
                          onClick={() => startEditProduct(product)}
                        >
                          {product.image_url ? (
                            <Image style={{ width: '80px', height: '80px', borderRadius: '8px' }} src={product.image_url} mode="aspectFill" />
                          ) : (
                            <View style={{ width: '80px', height: '80px', borderRadius: '8px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Text className="block text-gray-400">无图</Text>
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text className="block text-lg font-medium text-gray-800">{product.name}</Text>
                            <Text className="block text-base text-gray-500">{product.categories?.name || '未分类'}</Text>
                            {product.model && (
                              <Text className="block text-sm text-gray-400">型号：{product.model}</Text>
                            )}
                          </View>
                        </View>
                        <View style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                          <Button 
                            variant="outline" 
                            onClick={() => startEditProduct(product)}
                            style={{ padding: '8px 16px' }}
                          >
                            <Text className="text-amber-800">编辑</Text>
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleDeleteProduct(product.id)}
                            style={{ padding: '8px 16px' }}
                          >
                            <Text className="text-red-500">删除</Text>
                          </Button>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="block text-gray-400 text-base">暂无产品，请先添加分类</Text>
                )
              ) : (
                categories.length > 0 ? (
                  <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {categories.map(cat => (
                      <View 
                        key={cat.id}
                        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}
                      >
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                          <Badge className="bg-amber-800 text-white" style={{ padding: '6px 12px' }}>
                            ID: {cat.id}
                          </Badge>
                          <Text className="block text-lg text-gray-800">{cat.name}</Text>
                        </View>
                        <Button 
                          variant="outline" 
                          onClick={() => handleDeleteCategory(cat.id)}
                          style={{ padding: '8px 16px' }}
                        >
                          <Text className="text-red-500">删除</Text>
                        </Button>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="block text-gray-400 text-base">暂无分类，请先添加</Text>
                )
              )}
            </CardContent>
          </Card>
        </View>
      </View>
    </View>
  )
}