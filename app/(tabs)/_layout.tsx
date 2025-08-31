// import { useAuth } from '@clerk/clerk-expo';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useConvexAuth, usePaginatedQuery, useQuery } from 'convex/react';
import * as Notifications from 'expo-notifications';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TabsLayout = () => {

  const { isLoading, isAuthenticated } = useConvexAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const convexUser = useQuery(api.users.getCurrent);
  const { results: purchases } = usePaginatedQuery(api.tickets.getPendingConfirmationPurchases, {}, { initialNumItems: 10 });
  const pendingCount = purchases?.length;

  // Este efecto secundario es para manejar las notificaciones PUSH.
  // Es una funcionalidad NATIVA (iOS/Android) y no existe en la web.
  // Lo envolvemos en una comprobación de plataforma para evitar el error en el navegador.
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;

        // Extraemos los posibles IDs del payload de la notificación
        const purchaseId = data.purchaseId as string | undefined;
        const raffleId = data.raffleId as string | undefined;

        // Lógica para notificaciones de PAGO POR VERIFICAR (para admins)
        if (purchaseId) {
          // Navegamos a la pantalla de detalle de la compra en el panel de admin
          router.push(`/(admin)/purchases/${purchaseId}`);
          return; // Salimos para no procesar otras lógicas
        }

        // Lógica existente para notificaciones de SORTEOS (para usuarios)
        if (raffleId) {
          router.push(`/(tabs)/${raffleId}`);
        }
      });
      return () => subscription.remove();
    }
  }, [router]);

  // Muestra un indicador de carga mientras Clerk verifica la sesión.
  // Esta comprobación ahora se hace DESPUÉS de haber llamado a todos los Hooks.
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    // El componente Tabs debe ser el principal. Cada pantalla gestionará su propio SafeAreaView y Header.
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#4f46e5',
          tabBarInactiveTintColor: '#64748b',
          tabBarHideOnKeyboard: true,
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
          headerShown: false, // Las pantallas internas manejarán sus propios encabezados.
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            title: 'Sorteos',
            // 4. Usamos Ionicons para consistencia y un tamaño adecuado.
            tabBarIcon: ({ color }) => <Ionicons name="list-outline" color={color} size={26} />,
          }}
        />
        <Tabs.Screen
          name="(purchases)"
          options={{
            title: 'Mis Compras',
            tabBarIcon: ({ color }) => <Ionicons name="ticket-outline" color={color} size={26} />,
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }) => <Ionicons name="person-outline" color={color} size={26} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Configuración',
            tabBarIcon: ({ color }) => <Ionicons name="settings-outline" color={color} size={26} />,
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
        {/* Rutas que no son pestañas se ocultan con href: null */}
        <Tabs.Screen name="profile/edit-profile" options={{ href: null }} />
        <Tabs.Screen name="oauth-native-callback" options={{ href: null }} />
        <Tabs.Screen name="(raffles)" options={{ href: null }} />
      </Tabs>
    </>
  );
};

export default TabsLayout;