// PC端Web管理后台页面配置
export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '产品图册管理',
    })
  : {
      navigationBarTitleText: '产品图册管理',
    }