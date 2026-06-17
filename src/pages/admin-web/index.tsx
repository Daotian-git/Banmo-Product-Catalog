import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'

// PC端Web管理后台 - 产品图册管理
const AdminWebPage = () => {
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'batch'>('products')
  
  // 编辑状态
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    categoryId: '',
    model: '',
    material: '',
    size: '',
    process: '',
    origin: ''
  })
  const [editSelectedImage, setEditSelectedImage] = useState('')
  
  // 新增产品表单
  const [newProduct, setNewProduct] = useState({
    name: '',
    categoryId: '',
    model: '',
    material: '',
    size: '',
    process: '',
    origin: ''
  })
  const [selectedImage, setSelectedImage] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // 批量导入
  const [excelFile, setExcelFile] = useState('')
  const [zipFile, setZipFile] = useState('')
  const [batchUploading, setBatchUploading] = useState(false)
  const [importResult, setImportResult] = useState<string>('')
  
  // 新增分类表单
  const [newCategory, setNewCategory] = useState({ name: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // 加载分类
      const catRes = await Network.request({ url: '/api/categories' })
      console.log('分类响应:', catRes.data)
      if (catRes.data?.code === 200) {
        setCategories(catRes.data.data || [])
      }
      
      // 加载产品
      const prodRes = await Network.request({ url: '/api/products' })
      console.log('产品响应:', prodRes.data)
      if (prodRes.data?.code === 200) {
        setProducts(prodRes.data.data || [])
      }
    } catch (e) {
      console.error('加载数据失败:', e)
    }
    setLoading(false)
  }

  // 选择图片（仅预览，不上传）
  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] })
      setSelectedImage(res.tempFilePaths[0])
    } catch (e) {
      console.error('选择图片失败:', e)
    }
  }

  // 编辑时选择图片
  const handleEditChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] })
      setEditSelectedImage(res.tempFilePaths[0])
    } catch (e) {
      console.error('选择图片失败:', e)
    }
  }

  // 开始编辑产品
  const startEditProduct = (product: any) => {
    setEditingProduct(product)
    setEditFormData({
      name: product.name || '',
      categoryId: String(product.category_id || product.categories?.id || ''),
      model: product.model || '',
      material: product.material || '',
      size: product.size || '',
      process: product.process || '',
      origin: product.origin || ''
    })
    setEditSelectedImage('')
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingProduct(null)
    setEditFormData({
      name: '', categoryId: '', model: '', material: '', size: '', process: '', origin: ''
    })
    setEditSelectedImage('')
  }

  // 提交编辑（更新产品）
  const handleUpdateProduct = async () => {
    if (!editFormData.name) {
      Taro.showToast({ title: '请填写产品名称', icon: 'none' })
      return
    }
    
    try {
      setUploading(true)
      
      // 如果选择了新图片，用 uploadFile 上传
      if (editSelectedImage) {
        const uploadRes = await Network.uploadFile({
          url: `/api/products/${editingProduct.id}`,
          filePath: editSelectedImage,
          name: 'image',
          formData: {
            name: editFormData.name,
            category_id: editFormData.categoryId,
            model: editFormData.model,
            material: editFormData.material,
            size: editFormData.size,
            process: editFormData.process,
            origin: editFormData.origin
          }
        })
        
        console.log('更新响应:', uploadRes.data)
        const response = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data
        
        if (response?.code === 200) {
          Taro.showToast({ title: '更新成功', icon: 'success' })
          cancelEdit()
          loadData()
        } else {
          Taro.showToast({ title: response?.msg || '更新失败', icon: 'none' })
        }
      } else {
        // 没有新图片，用普通 request 更新
        const res = await Network.request({
          url: `/api/products/${editingProduct.id}`,
          method: 'PUT',
          data: {
            name: editFormData.name,
            category_id: editFormData.categoryId ? parseInt(editFormData.categoryId) : undefined,
            model: editFormData.model,
            material: editFormData.material,
            size: editFormData.size,
            process: editFormData.process,
            origin: editFormData.origin
          }
        })
        
        console.log('更新响应:', res.data)
        if (res.data?.code === 200) {
          Taro.showToast({ title: '更新成功', icon: 'success' })
          cancelEdit()
          loadData()
        } else {
          Taro.showToast({ title: res.data?.msg || '更新失败', icon: 'none' })
        }
      }
    } catch (e) {
      console.error('更新失败:', e)
      Taro.showToast({ title: '更新失败', icon: 'none' })
    }
    setUploading(false)
  }

  // 提交产品（图片和表单一起上传）
  const handleAddProduct = async () => {
    if (!newProduct.name) {
      Taro.showToast({ title: '请填写产品名称', icon: 'none' })
      return
    }
    if (!selectedImage) {
      Taro.showToast({ title: '请选择产品图片', icon: 'none' })
      return
    }
    
    try {
      setUploading(true)
      
      // 使用 uploadFile 同时上传图片和表单数据
      const uploadRes = await Network.uploadFile({
        url: '/api/products',
        filePath: selectedImage,
        name: 'image',  // 后端 FileInterceptor('image')
        formData: {
          name: newProduct.name,
          category_id: newProduct.categoryId,
          model: newProduct.model,
          material: newProduct.material,
          size: newProduct.size,
          process: newProduct.process,
          origin: newProduct.origin
        }
      })
      
      console.log('上传响应:', uploadRes.data)
      const response = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data
      
      if (response?.code === 200) {
        Taro.showToast({ title: '添加成功', icon: 'success' })
        setNewProduct({
          name: '', categoryId: '', model: '', material: '',
          size: '', process: '', origin: ''
        })
        setSelectedImage('')
        loadData()
      } else {
        Taro.showToast({ title: response?.msg || '添加失败', icon: 'none' })
      }
    } catch (e) {
      console.error('添加失败:', e)
      Taro.showToast({ title: '添加失败', icon: 'none' })
    }
    setUploading(false)
  }

  // 提交分类
  const handleAddCategory = async () => {
    if (!newCategory.name) {
      Taro.showToast({ title: '请填写分类名称', icon: 'none' })
      return
    }
    
    try {
      const res = await Network.request({
        url: '/api/categories',
        method: 'POST',
        data: newCategory
      })
      console.log('添加分类响应:', res.data)
      
      if (res.data?.code === 200) {
        Taro.showToast({ title: '添加成功', icon: 'success' })
        setNewCategory({ name: '' })
        loadData()
      } else {
        Taro.showToast({ title: res.data?.msg || '添加失败', icon: 'none' })
      }
    } catch (e) {
      console.error('添加失败:', e)
      Taro.showToast({ title: '添加失败', icon: 'none' })
    }
  }

  // 删除产品
  const handleDeleteProduct = async (id: number) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？'
    })
    if (!result.confirm) return
    
    try {
      const res = await Network.request({
        url: `/api/products/${id}`,
        method: 'DELETE'
      })
      if (res.data?.code === 200) {
        Taro.showToast({ title: '删除成功', icon: 'success' })
        loadData()
      }
    } catch (e) {
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  // 删除分类
  const handleDeleteCategory = async (id: number) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: '删除分类会影响相关产品，确定要删除吗？'
    })
    if (!result.confirm) return
    
    try {
      const res = await Network.request({
        url: `/api/categories/${id}`,
        method: 'DELETE'
      })
      if (res.data?.code === 200) {
        Taro.showToast({ title: '删除成功', icon: 'success' })
        loadData()
      }
    } catch (e) {
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  // 选择Excel文件
  const handleChooseExcel = async () => {
    try {
      // H5端使用 chooseMessageFile 选择文件
      if (Taro.getEnv() === Taro.ENV_TYPE.WEB) {
        const res = await Taro.chooseMessageFile({
          count: 1,
          type: 'file',
          extension: ['xlsx', 'xls', 'csv']
        })
        setExcelFile(res.tempFiles[0].path)
      } else {
        Taro.showToast({ title: '请在H5端操作', icon: 'none' })
      }
    } catch (e) {
      console.error('选择Excel失败:', e)
      Taro.showToast({ title: '选择文件失败', icon: 'none' })
    }
  }

  // 选择ZIP文件
  const handleChooseZip = async () => {
    try {
      if (Taro.getEnv() === Taro.ENV_TYPE.WEB) {
        const res = await Taro.chooseMessageFile({
          count: 1,
          type: 'file',
          extension: ['zip']
        })
        setZipFile(res.tempFiles[0].path)
      } else {
        Taro.showToast({ title: '请在H5端操作', icon: 'none' })
      }
    } catch (e) {
      console.error('选择ZIP失败:', e)
      Taro.showToast({ title: '选择文件失败', icon: 'none' })
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
      // 上传Excel文件
      const excelUploadRes = await Network.uploadFile({
        url: '/api/products/batch-upload',
        filePath: excelFile,
        name: 'excel',
        formData: {}
      })
      
      const excelResponse = typeof excelUploadRes.data === 'string' 
        ? JSON.parse(excelUploadRes.data) 
        : excelUploadRes.data
      
      if (excelResponse?.code !== 200) {
        Taro.showToast({ title: excelResponse?.msg || 'Excel上传失败', icon: 'none' })
        setBatchUploading(false)
        return
      }
      
      const excelKey = excelResponse.data?.excelKey
      
      // 上传ZIP文件（如果有）
      let zipKey = ''
      if (zipFile) {
        const zipUploadRes = await Network.uploadFile({
          url: '/api/products/batch-upload',
          filePath: zipFile,
          name: 'zip',
          formData: {}
        })
        
        const zipResponse = typeof zipUploadRes.data === 'string' 
          ? JSON.parse(zipUploadRes.data) 
          : zipUploadRes.data
        
        if (zipResponse?.code === 200) {
          zipKey = zipResponse.data?.zipKey || ''
        }
      }
      
      // 执行批量导入
      const importRes = await Network.request({
        url: '/api/products/batch-import',
        method: 'POST',
        data: {
          excelKey,
          zipKey
        }
      })
      
      console.log('导入结果:', importRes.data)
      
      if (importRes.data?.code === 200) {
        const result = importRes.data.data
        setImportResult(`导入成功！共处理 ${result.total} 条，成功 ${result.success} 条，失败 ${result.failed} 条`)
        Taro.showToast({ title: '导入成功', icon: 'success' })
        loadData()
      } else {
        setImportResult(`导入失败: ${importRes.data?.msg || '未知错误'}`)
        Taro.showToast({ title: importRes.data?.msg || '导入失败', icon: 'none' })
      }
    } catch (e) {
      console.error('批量导入失败:', e)
      setImportResult(`导入失败: ${e}`)
      Taro.showToast({ title: '导入失败', icon: 'none' })
    }
    
    setBatchUploading(false)
  }

  // 渲染产品表单（新增或编辑共用）
  const renderProductForm = (isEdit: boolean) => {
    const formData = isEdit ? editFormData : newProduct
    const setFormData = isEdit ? setEditFormData : setNewProduct
    const currentImage = isEdit 
      ? (editSelectedImage || editingProduct?.image_url) 
      : selectedImage
    const chooseImage = isEdit ? handleEditChooseImage : handleChooseImage
    const handleSubmit = isEdit ? handleUpdateProduct : handleAddProduct
    const existingImage = isEdit ? editingProduct?.image_url : null
    
    return (
      <CardContent className="space-y-4">
        {/* 图片选择 */}
        <View>
          <Text className="block text-sm text-gray-600 mb-2">
            产品图片 {isEdit ? '' : '*'} {isEdit && existingImage && '(不选则保留原图)'}
          </Text>
          <View className="flex flex-row gap-2">
            {currentImage ? (
              <Image 
                className="w-32 h-32 rounded border border-gray-200 object-cover"
                src={currentImage}
                mode="aspectFill"
              />
            ) : (
              <View 
                className="w-32 h-32 rounded border border-gray-200 bg-gray-50 flex items-center justify-center"
                onClick={chooseImage}
              >
                <Text className="block text-gray-400 text-xs">点击选择图片</Text>
              </View>
            )}
            <Button variant="outline" size="sm" onClick={chooseImage}>
              <Text>{isEdit ? '更换图片' : '选择图片'}</Text>
            </Button>
          </View>
        </View>

        {/* 分类选择 */}
        <View>
          <Text className="block text-sm text-gray-600 mb-2">所属分类</Text>
          <View 
            className="bg-gray-50 rounded px-3 py-2 flex flex-row justify-between items-center"
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
            <Text className="block text-sm">
              {formData.categoryId 
                ? categories.find(c => String(c.id) === formData.categoryId)?.name || '请选择分类'
                : '请选择分类'}
            </Text>
            <Text className="block text-gray-400">▼</Text>
          </View>
        </View>

        {/* 产品名称 */}
        <View>
          <Text className="block text-sm text-gray-600 mb-2">产品名称 *</Text>
          <View className="bg-gray-50 rounded px-3 py-2">
            <Input 
              className="w-full bg-transparent text-sm"
              placeholder="如：明式圈椅"
              value={formData.name}
              onInput={(e: any) => setFormData({ ...formData, name: e.detail.value })}
            />
          </View>
        </View>

        {/* 产品型号 */}
        <View>
          <Text className="block text-sm text-gray-600 mb-2">产品型号</Text>
          <View className="bg-gray-50 rounded px-3 py-2">
            <Input 
              className="w-full bg-transparent text-sm"
              placeholder="如：MXQY-001"
              value={formData.model}
              onInput={(e: any) => setFormData({ ...formData, model: e.detail.value })}
            />
          </View>
        </View>

        {/* 材质 */}
        <View>
          <Text className="block text-sm text-gray-600 mb-2">材质</Text>
          <View className="bg-gray-50 rounded px-3 py-2">
            <Input 
              className="w-full bg-transparent text-sm"
              placeholder="如：北美黑胡桃木"
              value={formData.material}
              onInput={(e: any) => setFormData({ ...formData, material: e.detail.value })}
            />
          </View>
        </View>

        {/* 尺寸 */}
        <View>
          <Text className="block text-sm text-gray-600 mb-2">尺寸</Text>
          <View className="bg-gray-50 rounded px-3 py-2">
            <Input 
              className="w-full bg-transparent text-sm"
              placeholder="如：120×60×45cm"
              value={formData.size}
              onInput={(e: any) => setFormData({ ...formData, size: e.detail.value })}
            />
          </View>
        </View>

        {/* 工艺 */}
        <View>
          <Text className="block text-sm text-gray-600 mb-2">工艺</Text>
          <View className="bg-gray-50 rounded px-3 py-2">
            <Input 
              className="w-full bg-transparent text-sm"
              placeholder="如：榫卯结构，手工打磨"
              value={formData.process}
              onInput={(e: any) => setFormData({ ...formData, process: e.detail.value })}
            />
          </View>
        </View>

        {/* 产地 */}
        <View>
          <Text className="block text-sm text-gray-600 mb-2">产地</Text>
          <View className="bg-gray-50 rounded px-3 py-2">
            <Input 
              className="w-full bg-transparent text-sm"
              placeholder="如：浙江东阳"
              value={formData.origin}
              onInput={(e: any) => setFormData({ ...formData, origin: e.detail.value })}
            />
          </View>
        </View>

        {/* 按钮 */}
        <View className="flex flex-row gap-2">
          <Button 
            className="flex-1 bg-amber-800 text-white"
            onClick={handleSubmit}
            disabled={uploading}
          >
            <Text>{uploading ? '保存中...' : (isEdit ? '保存修改' : '提交产品')}</Text>
          </Button>
          {isEdit && (
            <Button 
              variant="outline"
              className="flex-1"
              onClick={cancelEdit}
            >
              <Text>取消</Text>
            </Button>
          )}
        </View>
      </CardContent>
    )
  }

  return (
    <View className="min-h-screen bg-gray-100 p-4">
      {/* 标题 */}
      <View className="mb-6">
        <Text className="block text-2xl font-bold text-gray-800">产品图册管理后台</Text>
        <Text className="block text-sm text-gray-500 mt-1">管理分类和产品信息</Text>
      </View>

      {/* Tab切换 */}
      <View className="flex flex-row gap-2 mb-4">
        <Button 
          variant={activeTab === 'products' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setActiveTab('products'); cancelEdit() }}
        >
          <Text>产品管理</Text>
        </Button>
        <Button 
          variant={activeTab === 'batch' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setActiveTab('batch'); cancelEdit() }}
        >
          <Text>批量导入</Text>
        </Button>
        <Button 
          variant={activeTab === 'categories' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setActiveTab('categories'); cancelEdit() }}
        >
          <Text>分类管理</Text>
        </Button>
      </View>

      {/* 主内容区 - PC布局 */}
      <View className="flex flex-row gap-4" style={{ minHeight: '400px' }}>
        {/* 左侧：表单 */}
        <View className="flex-1">
          {activeTab === 'batch' ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Text className="text-lg font-semibold">批量导入产品</Text>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 使用说明 */}
                <View className="bg-amber-50 rounded-lg p-4">
                  <Text className="block text-sm font-semibold text-amber-800 mb-2">使用说明：</Text>
                  <Text className="block text-xs text-gray-600">1. 准备Excel文件（xlsx格式），包含产品信息</Text>
                  <Text className="block text-xs text-gray-600">2. Excel列名：名称、型号、分类ID、材质、尺寸、工艺、产地、图片文件名</Text>
                  <Text className="block text-xs text-gray-600">3. 图片打包成ZIP文件，文件名与Excel中的图片文件名对应</Text>
                  <Text className="block text-xs text-gray-600">4. 分类ID可在右侧分类列表查看</Text>
                </View>
                
                {/* Excel文件选择 */}
                <View className="space-y-2">
                  <Text className="block text-sm font-medium">Excel文件：</Text>
                  <Button 
                    variant="outline" 
                    onClick={handleChooseExcel}
                    className="w-full"
                  >
                    <Text>{excelFile ? '已选择Excel文件' : '选择Excel文件（xlsx）'}</Text>
                  </Button>
                  {excelFile && (
                    <Text className="block text-xs text-gray-500">{excelFile.split('/').pop()}</Text>
                  )}
                </View>
                
                {/* ZIP文件选择 */}
                <View className="space-y-2">
                  <Text className="block text-sm font-medium">图片ZIP包（可选）：</Text>
                  <Button 
                    variant="outline" 
                    onClick={handleChooseZip}
                    className="w-full"
                  >
                    <Text>{zipFile ? '已选择ZIP文件' : '选择图片ZIP包'}</Text>
                  </Button>
                  {zipFile && (
                    <Text className="block text-xs text-gray-500">{zipFile.split('/').pop()}</Text>
                  )}
                </View>
                
                {/* 导入按钮 */}
                <Button 
                  className="w-full bg-amber-800"
                  onClick={handleBatchImport}
                  disabled={batchUploading || !excelFile}
                >
                  <Text className="text-white">
                    {batchUploading ? '导入中...' : '开始批量导入'}
                  </Text>
                </Button>
                
                {/* 导入结果 */}
                {importResult && (
                  <View className="bg-gray-50 rounded-lg p-3">
                    <Text className="block text-sm">{importResult}</Text>
                  </View>
                )}
              </CardContent>
            </Card>
          ) : activeTab === 'products' ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Text className="text-lg font-semibold">
                    {editingProduct ? `编辑产品：${editingProduct.name}` : '添加产品'}
                  </Text>
                </CardTitle>
              </CardHeader>
              {renderProductForm(Boolean(editingProduct))}
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Text className="text-lg font-semibold">添加分类</Text>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <View>
                  <Text className="block text-sm text-gray-600 mb-2">分类名称 *</Text>
                  <View className="bg-gray-50 rounded px-3 py-2">
                    <Input 
                      className="w-full bg-transparent text-sm"
                      placeholder="如：座椅系列"
                      value={newCategory.name}
                      onInput={(e: any) => setNewCategory({ name: e.detail.value })}
                    />
                  </View>
                </View>
                <Button 
                  className="w-full bg-amber-800 text-white"
                  onClick={handleAddCategory}
                >
                  <Text>提交分类</Text>
                </Button>
              </CardContent>
            </Card>
          )}
        </View>

        {/* 右侧：列表 */}
        <View className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>
                <Text className="text-lg font-semibold">
                  {activeTab === 'products' ? '产品列表' : '分类列表'}
                </Text>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Text className="block text-gray-400 text-sm">加载中...</Text>
              ) : activeTab === 'products' ? (
                products.length > 0 ? (
                  <View className="space-y-2">
                    {products.map(product => (
                      <View 
                        key={product.id}
                        className="flex flex-row items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <View 
                          className="flex flex-row items-center gap-2 flex-1"
                          onClick={() => startEditProduct(product)}
                        >
                          {product.image_url ? (
                            <Image className="w-12 h-12 rounded" src={product.image_url} mode="aspectFill" />
                          ) : (
                            <View className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                              <Text className="block text-gray-400 text-xs">无图</Text>
                            </View>
                          )}
                          <View className="flex-1">
                            <Text className="block text-sm font-medium text-gray-800">{product.name}</Text>
                            <View className="flex flex-row gap-2">
                              <Text className="block text-xs text-gray-500">{product.categories?.name || '未分类'}</Text>
                              {product.model && (
                                <Text className="block text-xs text-gray-400">{product.model}</Text>
                              )}
                            </View>
                          </View>
                        </View>
                        <View className="flex flex-row gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => startEditProduct(product)}
                          >
                            <Text className="text-amber-800 text-xs">编辑</Text>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Text className="text-red-500 text-xs">删除</Text>
                          </Button>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="block text-gray-400 text-sm">暂无产品，请先添加分类</Text>
                )
              ) : (
                categories.length > 0 ? (
                  <View className="space-y-2">
                    {categories.map(cat => (
                      <View 
                        key={cat.id}
                        className="flex flex-row items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <View className="flex flex-row items-center gap-2">
                          <Badge className="bg-amber-800 text-white px-2 py-1 text-xs">
                            ID: {cat.id}
                          </Badge>
                          <Text className="block text-sm text-gray-800">{cat.name}</Text>
                        </View>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCategory(cat.id)}
                        >
                          <Text className="text-red-500 text-xs">删除</Text>
                        </Button>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="block text-gray-400 text-sm">暂无分类，请先添加</Text>
                )
              )}
            </CardContent>
          </Card>
        </View>
      </View>
    </View>
  )
}

export default AdminWebPage