// PC端Web管理后台页面配置
export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '产品图册管理',
      navigationBarBackgroundColor: '#f5f5f4',
      navigationBarTextStyle: 'black',
    })
  : {
      navigationBarTitleText: '产品图册管理',
      navigationBarBackgroundColor: '#f5f5f4',
      navigationBarTextStyle: 'black',
    }