export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '雅木轩'
    })
  : { navigationBarTitleText: '雅木轩' }