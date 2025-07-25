import { useAuth } from '@clerk/clerk-expo'
import { FontAwesome } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { ActivityIndicator, View } from 'react-native'

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
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#6366F1', // Color primario para el ícono activo
    }}>
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
    </Tabs>
  )
}

export default _layout