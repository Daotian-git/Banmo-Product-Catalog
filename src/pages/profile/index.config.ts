export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '公司简介'
    })
  : { navigationBarTitleText: '公司简介' }