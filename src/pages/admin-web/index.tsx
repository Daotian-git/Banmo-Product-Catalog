import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useRef } from 'react'

// 管理后台页面 - 表格批量操作
const AdminWebPage = () => {
  const excelInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const deleteInputRef = useRef<HTMLInputElement>(null)
  const updateInputRef = useRef<HTMLInputElement>(null)

  const [importing, setImporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [exporting, setExporting] = useState(false)

  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [deleteFile, setDeleteFile] = useState<File | null>(null)
  const [updateFile, setUpdateFile] = useState<File | null>(null)

  // 强制宽屏布局
  useEffect(() => {
    const pageEl = document.querySelector('.taro_page') || document.querySelector('taro-page') || document.querySelector('.taro-router')
    if (pageEl) {
      const el = pageEl as HTMLElement
      el.style.setProperty('max-width', 'none')
      el.style.setProperty('width', '100%')
    }
  }, [])

  // 下载导入模板
  const downloadImportTemplate = () => {
    const template = [
      { '产品编号': 'BM001', '产品名称': '乌金木沙发', '分类': '乌金木', '型号': 'MJ-001;MJ-002', '尺寸': '180×90×85cm;200×100×90cm', '排列方式': 1, '排序权重': 100, '图片文件名': 'sofa-001.jpg' },
      { '产品编号': 'BM002', '产品名称': '黑檀木茶几', '分类': '黑檀木', '型号': 'MJ-003', '尺寸': '120×60×45cm', '排列方式': 2, '排序权重': 50, '图片文件名': 'table-002.jpg' }
    ]
    downloadExcel(template, '产品导入模板.xlsx')
  }

  // 下载删除模板
  const downloadDeleteTemplate = () => {
    const template = [
      { '产品编号': 'BM001', '型号': 'MJ-001' },
      { '产品编号': 'BM002', '型号': '' }
    ]
    downloadExcel(template, '产品删除模板.xlsx')
  }

  // 下载修改模板
  const downloadUpdateTemplate = () => {
    const template = [
      { '产品编号': 'BM001', '产品名称': '新名称', '分类': '黑檀木', '型号': 'MJ-001;MJ-002', '尺寸': '180×90×85cm;200×100×90cm', '排列方式': 2, '排序权重': 200, '图片文件名': 'new-image.jpg' }
    ]
    downloadExcel(template, '产品修改模板.xlsx')
  }

  // 通用下载 Excel 函数
  const downloadExcel = (data: any[], filename: string) => {
    // 构建 CSV 内容（简单实现）
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h] || '').join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename.replace('.xlsx', '.csv')
    a.click()
    URL.revokeObjectURL(url)
    Taro.showToast({ title: '模板已下载', icon: 'success' })
  }

  // 一键导出所有产品
  const handleExport = async () => {
    try {
      setExporting(true)
      const res = await fetch('/api/products/export')
      const data = await res.json()
      
      if (data.code === 200 && data.data?.buffer) {
        // 下载导出的 Excel
        const binary = atob(data.data.buffer)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.data.filename
        a.click()
        URL.revokeObjectURL(url)
        Taro.showToast({ title: '导出成功', icon: 'success' })
      } else {
        Taro.showToast({ title: '导出失败', icon: 'error' })
      }
    } catch (err) {
      console.error('导出失败:', err)
      Taro.showToast({ title: '导出失败', icon: 'error' })
    } finally {
      setExporting(false)
    }
  }

  // 批量导入
  const handleImport = async () => {
    if (!excelFile) {
      Taro.showToast({ title: '请先选择Excel文件', icon: 'none' })
      return
    }

    try {
      setImporting(true)
      const formData = new FormData()
      formData.append('excel', excelFile)
      if (zipFile) formData.append('zip', zipFile)

      const res = await fetch('/api/products/batch-import-direct', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      
      if (data.code === 200) {
        Taro.showToast({ 
          title: `导入成功！共${data.data.created}个产品`, 
          icon: 'success',
          duration: 3000
        })
        setExcelFile(null)
        setZipFile(null)
      } else {
        Taro.showToast({ title: data.msg || '导入失败', icon: 'error' })
      }
    } catch (err) {
      console.error('导入失败:', err)
      Taro.showToast({ title: '导入失败', icon: 'error' })
    } finally {
      setImporting(false)
    }
  }

  // 批量删除
  const handleDelete = async () => {
    if (!deleteFile) {
      Taro.showToast({ title: '请先选择删除表格', icon: 'none' })
      return
    }

    try {
      setDeleting(true)
      const formData = new FormData()
      formData.append('excel', deleteFile)

      const res = await fetch('/api/products/batch-delete', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      
      if (data.code === 200) {
        Taro.showToast({ 
          title: `删除${data.data.deletedProducts}个产品`, 
          icon: 'success',
          duration: 3000
        })
        setDeleteFile(null)
      } else {
        Taro.showToast({ title: data.msg || '删除失败', icon: 'error' })
      }
    } catch (err) {
      console.error('删除失败:', err)
      Taro.showToast({ title: '删除失败', icon: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  // 批量修改
  const handleUpdate = async () => {
    if (!updateFile) {
      Taro.showToast({ title: '请先选择修改表格', icon: 'none' })
      return
    }

    try {
      setUpdating(true)
      const formData = new FormData()
      formData.append('excel', updateFile)

      const res = await fetch('/api/products/batch-update', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      
      if (data.code === 200) {
        Taro.showToast({ 
          title: `修改${data.data.updatedCount}个产品`, 
          icon: 'success',
          duration: 3000
        })
        setUpdateFile(null)
      } else {
        Taro.showToast({ title: data.msg || '修改失败', icon: 'error' })
      }
    } catch (err) {
      console.error('修改失败:', err)
      Taro.showToast({ title: '修改失败', icon: 'error' })
    } finally {
      setUpdating(false)
    }
  }

  // 文件选择处理
  const handleFileChange = (setter: (f: File) => void, e: Event) => {
    const input = e.target as HTMLInputElement
    if (input.files && input.files[0]) {
      setter(input.files[0])
    }
  }

  // 绑定事件监听
  useEffect(() => {
    const excelInput = excelInputRef.current
    const zipInput = zipInputRef.current
    const deleteInput = deleteInputRef.current
    const updateInput = updateInputRef.current

    if (excelInput) excelInput.onchange = (e) => handleFileChange(setExcelFile, e)
    if (zipInput) zipInput.onchange = (e) => handleFileChange(setZipFile, e)
    if (deleteInput) deleteInput.onchange = (e) => handleFileChange(setDeleteFile, e)
    if (updateInput) updateInput.onchange = (e) => handleFileChange(setUpdateFile, e)
  }, [])

  return (
    <View style={{ 
      minHeight: '100vh', 
      backgroundColor: '#fafafa',
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}
    >
      {/* 标题 */}
      <View style={{ marginBottom: '32px' }}>
        <Text style={{ display: 'block', fontSize: '24px', fontWeight: 'bold', color: '#3a2a1c' }}>
          产品管理后台
        </Text>
        <Text style={{ display: 'block', fontSize: '14px', color: '#666', marginTop: '8px' }}>
          批量导入、导出、删除、修改产品信息
        </Text>
      </View>

      {/* 隐藏的文件输入 */}
      <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} />
      <input ref={zipInputRef} type="file" accept=".zip" style={{ display: 'none' }} />
      <input ref={deleteInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} />
      <input ref={updateInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} />

      {/* 功能卡片 */}
      <View style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        
        {/* 一键导出 */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
        >
          <Text style={{ display: 'block', fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
            一键导出
          </Text>
          <Text style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            导出所有产品为 Excel 表格，包含完整的产品信息
          </Text>
          <button
            style={{ 
              backgroundColor: '#92400e',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 24px'
            }}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? '导出中...' : '导出产品'}
          </button>
        </View>

        {/* 批量导入 */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
        >
          <Text style={{ display: 'block', fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
            批量导入
          </Text>
          <Text style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            上传 Excel 表格导入产品，可选上传 ZIP 图片包
          </Text>
          
          <View style={{ marginBottom: '12px' }}>
            <button
              style={{ 
                backgroundColor: '#f5f5f5',
                color: '#333',
                borderRadius: '8px',
                padding: '8px 16px',
                marginRight: '8px'
              }}
              onClick={() => downloadImportTemplate()}
            >
              下载模板
            </button>
            <button
              style={{ 
                backgroundColor: excelFile ? '#e8d5b8' : '#f5f5f5',
                color: '#333',
                borderRadius: '8px',
                padding: '8px 16px'
              }}
              onClick={() => excelInputRef.current?.click()}
            >
              {excelFile ? excelFile.name : '选择Excel'}
            </button>
            <button
              style={{ 
                backgroundColor: zipFile ? '#e8d5b8' : '#f5f5f5',
                color: '#333',
                borderRadius: '8px',
                padding: '8px 16px',
                marginLeft: '8px'
              }}
              onClick={() => zipInputRef.current?.click()}
            >
              {zipFile ? zipFile.name : '选择ZIP图片'}
            </button>
          </View>
          
          <button
            style={{ 
              backgroundColor: importing ? '#ccc' : '#92400e',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 24px'
            }}
            onClick={handleImport}
            disabled={importing}
          >
            {importing ? '导入中...' : '开始导入'}
          </button>
        </View>

        {/* 批量删除 */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
        >
          <Text style={{ display: 'block', fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
            批量删除
          </Text>
          <Text style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            按产品编号删除型号，删除所有型号时删除整个产品
          </Text>
          
          <View style={{ marginBottom: '12px' }}>
            <button
              style={{ 
                backgroundColor: '#f5f5f5',
                color: '#333',
                borderRadius: '8px',
                padding: '8px 16px',
                marginRight: '8px'
              }}
              onClick={() => downloadDeleteTemplate()}
            >
              下载模板
            </button>
            <button
              style={{ 
                backgroundColor: deleteFile ? '#e8d5b8' : '#f5f5f5',
                color: '#333',
                borderRadius: '8px',
                padding: '8px 16px'
              }}
              onClick={() => deleteInputRef.current?.click()}
            >
              {deleteFile ? deleteFile.name : '选择删除表格'}
            </button>
          </View>
          
          <button
            style={{ 
              backgroundColor: deleting ? '#ccc' : '#dc2626',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 24px'
            }}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? '删除中...' : '开始删除'}
          </button>
        </View>

        {/* 批量修改 */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
        >
          <Text style={{ display: 'block', fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
            批量修改
          </Text>
          <Text style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            按产品编号修改产品名称、分类、型号、尺寸等
          </Text>
          
          <View style={{ marginBottom: '12px' }}>
            <button
              style={{ 
                backgroundColor: '#f5f5f5',
                color: '#333',
                borderRadius: '8px',
                padding: '8px 16px',
                marginRight: '8px'
              }}
              onClick={() => downloadUpdateTemplate()}
            >
              下载模板
            </button>
            <button
              style={{ 
                backgroundColor: updateFile ? '#e8d5b8' : '#f5f5f5',
                color: '#333',
                borderRadius: '8px',
                padding: '8px 16px'
              }}
              onClick={() => updateInputRef.current?.click()}
            >
              {updateFile ? updateFile.name : '选择修改表格'}
            </button>
          </View>
          
          <button
            style={{ 
              backgroundColor: updating ? '#ccc' : '#92400e',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 24px'
            }}
            onClick={handleUpdate}
            disabled={updating}
          >
            {updating ? '修改中...' : '开始修改'}
          </button>
        </View>
      </View>

      {/* 说明 */}
      <View style={{ 
        marginTop: '32px',
        backgroundColor: '#fff8f0',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e8d5b8'
      }}
      >
        <Text style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#92400e', marginBottom: '12px' }}>
          使用说明
        </Text>
        <Text style={{ display: 'block', fontSize: '14px', color: '#666', lineHeight: '24px' }}>
          1. 导入模板：产品编号、产品名称、分类（乌金木/黑檀木）、型号（多个用分号分隔）、尺寸（多个用分号分隔）、排列方式（1单列/2双列）、排序权重
        </Text>
        <Text style={{ display: 'block', fontSize: '14px', color: '#666', lineHeight: '24px' }}>
          2. 删除模板：填写产品编号可删除整个产品，填写型号可删除特定型号
        </Text>
        <Text style={{ display: 'block', fontSize: '14px', color: '#666', lineHeight: '24px' }}>
          3. 修改模板：以产品编号为标识，修改其他字段
        </Text>
      </View>

      {/* 返回按钮 */}
      <View style={{ marginTop: '24px' }}>
        <button
          style={{ 
            backgroundColor: '#f5f5f5',
            color: '#333',
            borderRadius: '8px',
            padding: '12px 24px'
          }}
          onClick={() => Taro.navigateBack()}
        >
          返回公司简介
        </button>
      </View>
    </View>
  )
}

export default AdminWebPage