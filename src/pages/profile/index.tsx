import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'

const ProfilePage = () => {
  // H5端显示管理入口
  const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB

  const handleCall = () => {
    // 直接弹窗显示电话号码
    Taro.showModal({
      title: '联系客服',
      content: '199 8040 2169',
      confirmText: '拨打电话',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          Taro.makePhoneCall({
            phoneNumber: '19980402169'
          })
        }
      }
    })
  }

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#fafafa', padding: '20px', paddingBottom: '80px' }}>
      {/* 公司简介 */}
      <View style={{ 
        backgroundColor: '#fff', 
        borderRadius: '12px', 
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}
      >
        <Text style={{ display: 'block', fontSize: '15px', color: '#333', lineHeight: '28px', letterSpacing: '1px' }}>
          四十年，于木而言，足以让一道年轮沉淀风骨；于匠心而言，足以将一门技艺淬炼成诗。
        </Text>
        <View style={{ height: '16px' }} />
        <Text style={{ display: 'block', fontSize: '15px', color: '#333', lineHeight: '28px', letterSpacing: '1px' }}>
          半墨家具，始于一九八五年，立足成都，辐射西南。二零一五年，迁至南北通衢的江苏徐州，依托其地利与气候，精研木性，沉潜深耕。在为一线新中式品牌代工的岁月里，我们于木作中凝练东方居住的智慧，深谙品质与尺度。由此，创立【半墨】与【久阅】，将这份凝练的美学完整承载。
        </Text>
      </View>

      {/* H5端专属：管理后台入口 */}
      {isH5 && (
        <View style={{ 
          backgroundColor: '#fff8f0', 
          borderRadius: '12px', 
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid #e8d5b8'
        }}
        >
          <View
            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            onClick={() => Taro.navigateTo({ url: '/pages/admin-web/index' })}
          >
            <View>
              <Text style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#92400e' }}>
                产品管理后台
              </Text>
              <Text style={{ display: 'block', fontSize: '12px', color: '#b45309', marginTop: '4px' }}>
                管理产品信息、批量操作
              </Text>
            </View>
            <View style={{ 
              backgroundColor: '#92400e', 
              borderRadius: '6px', 
              paddingLeft: '12px',
              paddingRight: '12px',
              paddingTop: '6px',
              paddingBottom: '6px'
            }}
            >
              <Text style={{ color: '#fff', fontSize: '12px' }}>进入</Text>
            </View>
          </View>
        </View>
      )}

      {/* 联系客服 */}
      <View style={{ 
        backgroundColor: '#fff8f0', 
        borderRadius: '12px', 
        padding: '16px',
        border: '1px solid #e8d5b8'
      }}
      >
        <View
          style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          onClick={handleCall}
        >
          <Text style={{ fontSize: '14px', color: '#333' }}>联系客服</Text>
          <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#92400e' }}>199 8040 2169</Text>
        </View>
      </View>
    </View>
  )
}

export default ProfilePage