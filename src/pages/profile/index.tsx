import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const ProfilePage = () => {
  const handleCall = () => {
    Taro.showModal({
      title: '联系客服',
      content: '客服热线：400-888-8888\n工作时间：周一至周日 9:00-18:00',
      showCancel: false,
      confirmText: '知道了'
    })
  }

  return (
    <View className="min-h-full bg-gray-50 pb-12">
      {/* 用户信息 */}
      <Card className="mt-4 mx-4 bg-white rounded-lg border border-gray-100">
        <CardHeader className="pb-2">
          <View className="flex flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-amber-900 flex items-center justify-center">
              <Text className="text-white text-lg">雅</Text>
            </View>
            <View>
              <CardTitle className="text-base">雅木轩会员</CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-1">
                专注新中式，匠心之作
              </CardDescription>
            </View>
          </View>
        </CardHeader>
      </Card>

      {/* 功能列表 */}
      <Card className="mt-3 mx-4 bg-white rounded-lg border border-gray-100">
        <CardContent className="p-0">
          <View className="divide-y divide-gray-100">
            <View
              className="flex flex-row items-center justify-between px-4 py-3 cursor-pointer"
              onClick={() => Taro.showToast({ title: '收藏功能即将上线', icon: 'none' })}
            >
              <Text className="block text-sm text-gray-700">我的收藏</Text>
              <Badge className="bg-gray-50 text-gray-500 px-2 py-1 rounded text-xs border border-gray-200">
                0
              </Badge>
            </View>
            <View
              className="flex flex-row items-center justify-between px-4 py-3 cursor-pointer"
              onClick={() => Taro.showToast({ title: '浏览历史即将上线', icon: 'none' })}
            >
              <Text className="block text-sm text-gray-700">浏览历史</Text>
              <Badge className="bg-gray-50 text-gray-500 px-2 py-1 rounded text-xs border border-gray-200">
                0
              </Badge>
            </View>
            <View
              className="flex flex-row items-center justify-between px-4 py-3 cursor-pointer"
              onClick={handleCall}
            >
              <Text className="block text-sm text-gray-700">联系客服</Text>
              <Text className="block text-xs text-gray-400">400-888-8888</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 关于品牌 */}
      <Card className="mt-3 mx-4 bg-white rounded-lg border border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-gray-700">雅木轩 · 新中式家具</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Text className="block text-sm text-gray-500 leading-relaxed">
            雅木轩创立于2010年，专注于新中式家具设计与制作。我们秉承&apos;雅致、简约、匠心&apos;的理念，将传统东方美学与现代生活方式完美融合。
          </Text>
          <View className="my-3 border-t border-gray-200" />
          <View className="flex flex-row gap-2 flex-wrap">
            <Badge className="bg-amber-800 text-white px-2 py-1 rounded text-xs">榫卯工艺</Badge>
            <Badge className="bg-amber-800 text-white px-2 py-1 rounded text-xs">实木定制</Badge>
            <Badge className="bg-amber-800 text-white px-2 py-1 rounded text-xs">匠心之作</Badge>
          </View>
        </CardContent>
      </Card>

      {/* 底部信息 */}
      <View className="mt-6 px-4">
        <Text className="block text-center text-xs text-gray-400">
          雅木轩 © 2010-2024
        </Text>
        <Text className="block text-center text-xs text-gray-400 mt-1">
          浙江东阳 · 新中式家具工艺传承
        </Text>
      </View>
    </View>
  )
}

export default ProfilePage