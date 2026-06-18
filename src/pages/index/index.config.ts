export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '半墨家具'
    })
  : { navigationBarTitleText: '半墨家具' }