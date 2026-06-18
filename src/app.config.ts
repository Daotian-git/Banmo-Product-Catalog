export default defineAppConfig({
  pages: [
    'pages/profile/index',
    'pages/index/index',
    'pages/admin-web/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fafafa',
    navigationBarTitleText: '半墨家具',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#6b7280',
    selectedColor: '#92400e',
    backgroundColor: '#fafafa',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/profile/index',
        text: '公司简介',
        iconPath: './assets/tabbar/building.png',
        selectedIconPath: './assets/tabbar/building-active.png'
      },
      {
        pagePath: 'pages/index/index',
        text: '产品图册',
        iconPath: './assets/tabbar/image.png',
        selectedIconPath: './assets/tabbar/image-active.png'
      }
    ]
  }
})