import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TabsLayout = () => {
  const { isLoaded } = useAuth();
  const insets = useSafeAreaInsets();

  // Muestra un indicador de carga mientras Clerk verifica la sesión.
  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }




  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { actionIdentifier, notification } = response;
      const raffleId = notification.request.content.data.raffleId as string | undefined;

      // Si se presionó el botón "Ver Sorteo" y hay un raffleId
      if (actionIdentifier === 'view_raffle' && raffleId) {
        router.push(`/(tabs)/${raffleId}`);
      }
      // Si se presionó la notificación misma y hay un raffleId
      else if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER && raffleId) {
        router.push(`/(tabs)/${raffleId}`);
      }
    });

    return () => subscription.remove();
  }, [router]);

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
            height: (Platform.OS === 'android' ? 60 : 50) + insets.bottom,
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
          name="index"
          options={{
            title: 'Sorteos',
            // 4. Usamos Ionicons para consistencia y un tamaño adecuado.
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" color={color} size={26} />,
          }}
        />
        <Tabs.Screen
          name="my-purchases"
          options={{
            title: 'Mis Compras',
            tabBarIcon: ({ color }) => <Ionicons name="ticket-outline" color={color} size={26} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }) => <Ionicons name="person-outline" color={color} size={26} />,
          }}
        />

        {/* Rutas que no son pestañas se ocultan con href: null */}
        <Tabs.Screen name="[id]" options={{ href: null }} />
        <Tabs.Screen name="edit-profile" options={{ href: null }} />
        <Tabs.Screen name="purchase/[purchaseId]" options={{ href: null }} />
        <Tabs.Screen name="oauth-native-callback" options={{ href: null }} />
      </Tabs>
    </>
  );
};

export default TabsLayout;