import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { Authenticated, Unauthenticated, usePaginatedQuery, useQuery } from 'convex/react';
import * as Notifications from 'expo-notifications';
import { Redirect, Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function AdminProtectedLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Obtenemos el usuario actual para verificar su rol
  const convexUser = useQuery(api.users.getCurrent);
  const { results: purchases } = usePaginatedQuery(api.tickets.getPendingConfirmationPurchases, {}, { initialNumItems: 10 });
  const pendingCount = purchases?.length;

  // El listener de notificaciones se mantiene igual
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const purchaseId = response.notification.request.content.data.purchaseId as string | undefined;

      // La lógica de navegación es la misma, ya que era correcta.
      if (purchaseId) {
        router.push(`/(admin)/purchases/${purchaseId}`);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  // Mientras se verifica el usuario, mostramos un indicador de carga
  if (convexUser === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // Si el usuario no es admin (o no tiene registro en Convex), lo redirigimos a la home de usuarios
  if (convexUser === null || convexUser.userType !== 'admin') {
    return <Redirect href="/(tabs)/" />;
  }

  return (
    // Si llegamos aquí, el usuario es admin y puede ver el layout de pestañas
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: '#4f46e5', // indigo-600
        tabBarInactiveTintColor: '#64748b', // slate-500
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: '#e2e8f0',
          height: (Platform.OS === 'android' ? 60 : 70) + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: Platform.select({
          web: {
            fontSize: 12,
            fontWeight: '700',
            fontFamily: 'system-ui, sans-serif',
          },
          default: {
            fontFamily: 'Quicksand-Bold',
            fontSize: 11,
            ...(Platform.OS === 'android' && {
              marginBottom: 5,
              marginTop: -5,
            }),
          },
        }),

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
            {({ pressed }) => (
              <View className={`flex mr-5 p-2 rounded-lg ${pressed ? 'bg-indigo-100' : 'bg-transparent'}`}>
                <Ionicons name="settings-outline" size={28} color={'#4f46e5'} />
              </View>
            )}
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
        name="(raffles)"
        options={{
          title: 'Sorteos',
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" color={color} size={size} />,
          headerShown: false,
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
      <Tabs.Screen
        name="purchases" // Apunta al nuevo directorio /purchases
        options={{
          title: 'Ventas',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} />,
        }}
      />
      {/* Ocultamos las rutas que no son pestañas */}
      <Tabs.Screen name='settings' options={{ href: null }} />
      <Tabs.Screen name='winners/index' options={{ href: null }} />
      <Tabs.Screen name='reports/index' options={{ href: null }} />

    </Tabs>
  );
}

export default function AdminLayout() {
  return (
    <>
      <Authenticated>
        <AdminProtectedLayout />
      </Authenticated>
      <Unauthenticated>
        <Redirect href="/login" />
      </Unauthenticated>
    </>
  );
}