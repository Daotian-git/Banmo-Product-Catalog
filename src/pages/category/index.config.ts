export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '产品分类'
    })
  : { navigationBarTitleText: '产品分类' }