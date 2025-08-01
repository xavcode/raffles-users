import { useAuth } from '@clerk/clerk-expo'
import { FontAwesome } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import GlobalHeader from '../components/GlobalHeader'

const _layout = () => {
  const { isLoaded, isSignedIn } = useAuth()

  // Muestra un indicador de carga mientras Clerk verifica la sesión.
  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <GlobalHeader />

      <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FE8C00', // Color primario para el ícono activo
        // tabBarStyle: { height: 60, justifyContent: 'center' },
      }}
      >
        <Tabs.Screen name="index"
          options={{
            title: 'Sorteos',
            tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
          }}
        />
        <Tabs.Screen name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />,
          }}
        />
        <Tabs.Screen name="my-purchases"
          options={{
            title: 'Mis Compras',
            tabBarIcon: ({ color }) => <FontAwesome size={28} name="ticket" color={color} />,
          }}
        />
        <Tabs.Screen name='[id]'
          options={{
            href: null,
          }}
        />
        <Tabs.Screen name='edit-profile'
          options={{
            href: null,
          }}
        />

        <Tabs.Screen name='purchase/[purchaseId]'
          options={{
            href: null,
          }}
        />

      </Tabs>
    </SafeAreaView>
  )
}

export default _layout