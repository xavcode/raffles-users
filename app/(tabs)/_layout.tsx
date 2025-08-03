import { useAuth } from '@clerk/clerk-expo'
import { FontAwesome } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import GlobalHeader from '../components/GlobalHeader'

type TabBarIconProps = {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  title: string;
  focused: boolean;
};

const TabBarIcon = ({ name, color, title, focused }: TabBarIconProps) => (
  // Simplificamos el componente. El contenedor padre se encargará del centrado.
  <View className="flex-1 min-w-24 items-center pt-2 gap-y-1">
    <FontAwesome size={24} name={name} color={color} />
    <Text style={{ color, }} className={`text-sm ${focused ? 'font-quicksand-bold' : 'font-quicksand-medium'}`}>{title}</Text>
  </View>
);

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
    // Usamos un View normal para permitir que la TabBar se posicione de forma absoluta
    <SafeAreaView className='flex-1 bg-white'>
      <GlobalHeader />

      <Tabs screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FE8C00',
        tabBarInactiveTintColor: '#98989A', // Un gris más claro para mejor contraste sobre fondo oscuro
        // AQUÍ ESTÁ LA MAGIA: Le decimos a cada "slot" de la pestaña que centre su contenido.
        tabBarItemStyle: {
          justifyContent: 'center',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 25, // Un poco más de espacio inferior para mejor balance
          left: 20,
          right: 20,
          height: 70,
          elevation: 8, // Sombra más pronunciada para Android
          backgroundColor: '#1C1C1E', // Un fondo oscuro, elegante y moderno
          borderRadius: 35, // La mitad de la altura para una forma de píldora perfecta
          shadowColor: '#1a1a1a', // Un negro más suave para la sombra
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08, // Sombra más sutil
          shadowRadius: 12, // Sombra más difusa y elegante
        }
      }}
      >
        <Tabs.Screen name="index"
          options={{
            title: 'Sorteos',
            tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} title="Sorteos" focused={focused} />,
          }}
        />
        <Tabs.Screen name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, focused }) => <TabBarIcon name="user" color={color} title="Perfil" focused={focused} />,
          }}
        />
        <Tabs.Screen name="my-purchases"
          options={{
            title: 'Mis Compras',
            tabBarIcon: ({ color, focused }) => <TabBarIcon name="ticket" color={color} title="Mis Compras" focused={focused} />,
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