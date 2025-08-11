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

const TabBarIcon = ({ name, color, title }: TabBarIconProps) => (
  <View style={{ minWidth: 96 }} className="items-center justify-center px-2">
    <AnimatedFontAwesome size={22} name={name} color={color} />
    <Animated.Text
      numberOfLines={1}
      ellipsizeMode="tail"
      style={{ color }}
      className={`text-xs mt-1 font-quicksand-medium`}
    >
      {title}
    </Animated.Text>
  </View>
);

// Eliminamos TabBarButton personalizado para volver al comportamiento previo

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
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: { justifyContent: 'center', paddingVertical: 8 },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          height: 60,
          elevation: 12,
          backgroundColor: '#ffffff',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
        },
        sceneStyle: { backgroundColor: '#ffffff' },
      }}
      >
        <Tabs.Screen name="index"
          options={{
            title: 'Sorteos',
            tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} title="Sorteos" focused={focused} />,
          }}
        />
        <Tabs.Screen name='[id]'
          options={{
            href: null,
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