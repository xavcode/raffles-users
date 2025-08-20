import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { usePaginatedQuery } from 'convex/react';
import * as Notifications from 'expo-notifications';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderLeft from '../components/HeaderLeft';
import HeaderRigth from '../components/HeaderRigth';

export default function AdminLayout() {
  // 1. Todos los hooks se declaran al principio del componente.
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { results: purchases, status, loadMore
  } = usePaginatedQuery(
    api.tickets.getPendingConfirmationPurchases,
    {},
    {
      initialNumItems: 10
    });
  const pendingCount = purchases?.length;

  // 2. El listener (efecto secundario) se envuelve en un useEffect.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const purchaseId = response.notification.request.content.data.purchaseId as string | undefined;

      // La lógica de navegación es la misma, ya que era correcta.
      if (purchaseId) {
        router.push(`/(admin)/purchases/${purchaseId}`);
      }
    });

    // 3. Se devuelve una función de limpieza para eliminar el listener cuando
    //    el componente se desmonte, evitando fugas de memoria.
    return () => {
      subscription.remove();
    };
  }, [router]); // Se añade `router` como dependencia del efecto.

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: '#4f46e5', // indigo-600
        tabBarInactiveTintColor: '#64748b', // slate-500
        // headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: '#e2e8f0',
          // 1. Altura controlada: base + área segura inferior (notch).
          height: (Platform.OS === 'android' ? 60 : 70) + insets.bottom,
          // 2. Padding para empujar el contenido hacia arriba desde el notch.
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
        // headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: '#f8fafc', // slate-50
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0', // slate-200
        },
        headerTitle: '',


        headerTitleStyle: {
          fontFamily: 'Quicksand-Bold',
          fontSize: 18,
        },

        headerLeft: () => <HeaderLeft />,
        headerRight: () => <HeaderRigth />,

      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Resumen',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        // 1. Apuntamos al GRUPO de rutas, no a un archivo específico.
        name="(raffles)"
        options={{
          title: 'Sorteos',
          tabBarIcon: ({ color, size }) => <Ionicons name="ticket-outline" color={color} size={size} />,
          // 2. Ocultamos el header del Tab, porque el Stack de adentro ya tiene el suyo.
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="create-raffle"
        options={{
          title: 'Crear',
          headerShown: false,
          tabBarLabel: 'Nuevo Sorteo',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="verifications"
        options={{
          title: 'Verificaciones',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark-outline" color={color} size={size} />,
          tabBarBadge: pendingCount && pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      {/* Ocultamos las rutas que no son pestañas */}
      <Tabs.Screen name="purchases/[purchaseId]" options={{ href: null }} />
      <Tabs.Screen name='settings' options={{ href: null }} />

    </Tabs>
  );
}