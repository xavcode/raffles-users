import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { usePaginatedQuery } from 'convex/react';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const { results: purchases, status, loadMore
  } = usePaginatedQuery(
    api.tickets.getPendingConfirmationPurchases,
    {},
    {
      initialNumItems: 10

    });
  const pendingCount = purchases?.length;
  const router = useRouter();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: '#4f46e5', // indigo-600
        tabBarInactiveTintColor: '#64748b', // slate-500
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0', // slate-200
          paddingBottom: Math.max(8, insets.bottom),
        },
        tabBarLabelStyle: {
          fontFamily: 'Quicksand-Bold',

        },
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: '#f8fafc', // slate-50
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0', // slate-200
        },
        headerTitleStyle: {
          fontFamily: 'Quicksand-Bold',
          fontSize: 18,
        },
        headerLeft: () => (
          <Pressable onPress={() => router.replace('/(tabs)/')} className="ml-3">
            {({ pressed }) => (
              <View className={`flex-row items-center rounded-lg p-2 ${pressed ? 'bg-indigo-100' : 'bg-transparent'}`}>
                <Ionicons name="home-outline" size={20} color="#4f46e5" />
                <Text className="text-indigo-600 font-quicksand-bold text-base ml-1.5">Inicio</Text>
              </View>
            )}
          </Pressable>
        ),
        headerRight: () => (
          <Pressable onPress={() => { router.push('/(admin)/settings') }}>
            {
              ({ pressed }) => (
                <View className={`flex mr-5 p-2 rounded-lg ${pressed ? 'bg-indigo-100' : 'bg-transparent'}`}>
                  <Ionicons name="settings-outline" size={28} color={'#4f46e5'} />
                </View>
              )
            }
          </Pressable>
        )
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="raffles"
        options={{
          title: 'Sorteos',
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="create-raffle"
        options={{
          title: 'Crear',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="verifications"
        options={{
          title: 'Verificaciones',
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark-outline" color={color} size={size} />,
          tabBarBadge: pendingCount && pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      {/* Ocultamos las rutas que no son pestañas */}
      <Tabs.Screen name="[id]" options={{ href: null }} />
      <Tabs.Screen name="purchases/[purchaseId]" options={{ href: null }} />
      <Tabs.Screen name='settings' options={{ href: null }} />
    </Tabs>
  );
}