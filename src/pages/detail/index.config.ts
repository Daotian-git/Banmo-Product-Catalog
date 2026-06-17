export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '产品详情'
    })
  : { navigationBarTitleText: '产品详情' }