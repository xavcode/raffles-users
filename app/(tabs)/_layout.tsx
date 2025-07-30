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
        <ActivityIndicator size="large" color="#FE8C00" />
      </View>
    )
  }

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#FE8C00', // Color primario para el ícono activo
      tabBarLabelStyle: { fontFamily: 'Quicksand-Bold', fontSize: 12 }, // Estilo de fuente para los títulos de las pestañas
    }}
    >
      <Tabs.Screen name="index"
        options={{
          title: 'Sorteos',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="user" color={color} />,
        }}
      />
      <Tabs.Screen name="my-tickets"
        options={{
          title: 'Mis Boletos',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="ticket" color={color} />,
        }}
      />
    </Tabs>
  )
}

export default _layout