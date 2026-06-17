export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '产品管理'
    })
  : { navigationBarTitleText: '产品管理' }