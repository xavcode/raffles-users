import { useAuth } from '@clerk/clerk-expo';
import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
// 1. Importamos 'Animated' de react-native-reanimated
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobalHeader from '../components/GlobalHeader';

type TabBarIconProps = {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  title: string;
  focused: boolean;
};

// 2. Creamos una versión animada de FontAwesome que puede manejar props animadas.
const AnimatedFontAwesome = Animated.createAnimatedComponent(FontAwesome);

const TabBarIcon = ({ name, color, title, focused }: TabBarIconProps) => (
  // Simplificamos el componente. El contenedor padre se encargará del centrado.
  <View className="flex-1 min-w-24 items-center pt-2 gap-y-1">
    {/* 3. Usamos los componentes animados. El color ahora se pasa correctamente. */}
    <AnimatedFontAwesome size={24} name={name} color={color} />
    <Animated.Text style={{ color }} className={`text-sm ${focused ? 'font-quicksand-bold' : 'font-quicksand-medium'}`}>{title}</Animated.Text>
  </View>
);

const TabsLayout = () => {
  const { isLoaded, isSignedIn } = useAuth()

  // Muestra un indicador de carga mientras Clerk verifica la sesión.
  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#FE8C00" />
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
        tabBarActiveTintColor: '#4f46e5', // Usamos el valor hexadecimal de 'primary'
        tabBarInactiveTintColor: '#5D5F6D',
        tabBarItemStyle: {
          justifyContent: 'center',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          marginHorizontal: 20,
          height: 60,
          elevation: 8,
          backgroundColor: '#f0f0f0',
          borderRadius: 20,
          shadowColor: '#1a1a1a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
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

        <Tabs.Screen name='oauth-native-callback'
          options={{
            href: null,
          }}
        />

      </Tabs>
    </SafeAreaView>
  )
}

export default TabsLayout