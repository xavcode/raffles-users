import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function HomeStackLayout() {
  const router = useRouter();
  // Eliminamos la lógica de deep linking de aquí

  const [deepLinkCustomRaffleId, setDeepLinkCustomRaffleId] = useState<string | null>(null);
  const [hasNavigatedViaDeepLink, setHasNavigatedViaDeepLink] = useState(false);

  // Consulta la rifa si hay un customRaffleId del deep link
  const deepLinkRaffle = useQuery(api.raffles.getByCustomRaffleId, deepLinkCustomRaffleId ? { customRaffleId: deepLinkCustomRaffleId } : 'skip');

  // Efecto para manejar el deep link inicial cuando la aplicación se abre
  useEffect(() => {
    const getInitialDeepLink = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const parsedUrl = Linking.parse(initialUrl);
        const path = parsedUrl.path;
        const customRaffleId = path?.split('/').pop();

        console.log('DeepLink: initialUrl', initialUrl);
        console.log('DeepLink: parsedUrl', parsedUrl);
        console.log('DeepLink: customRaffleId', customRaffleId);

        if (customRaffleId) {
          setDeepLinkCustomRaffleId(customRaffleId);
        }
      }
    };

    getInitialDeepLink();

    // Manejar deep links mientras la app ya está abierta
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const parsedUrl = Linking.parse(url);
      const path = parsedUrl.path;
      const customRaffleId = path?.split('/').pop();

      console.log('DeepLink (event): url', url);
      console.log('DeepLink (event): parsedUrl', parsedUrl);
      console.log('DeepLink (event): customRaffleId', customRaffleId);

      if (customRaffleId) {
        setDeepLinkCustomRaffleId(customRaffleId);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Efecto para navegar una vez que el customRaffleId se ha resuelto y la rifa está disponible
  useEffect(() => {
    if (deepLinkCustomRaffleId && deepLinkRaffle !== undefined && !hasNavigatedViaDeepLink) {
      if (deepLinkRaffle === null) {
        Toast.show({
          type: 'error',
          text1: 'Sorteo no encontrado',
          text2: 'El sorteo del deep link no existe.',
        });
        router.replace('/(tabs)/(home)'); // Ir a home si no se encuentra
      } else {
        router.replace(`/(tabs)/(home)/${deepLinkCustomRaffleId}`);
      }
      setHasNavigatedViaDeepLink(true);
      setDeepLinkCustomRaffleId(null); // Limpiar para futuros deep links
    }
  }, [deepLinkCustomRaffleId, deepLinkRaffle, hasNavigatedViaDeepLink, router]);

  // Mostrar pantalla de carga si estamos esperando el deep link
  if (deepLinkCustomRaffleId && deepLinkRaffle === undefined) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#FE8C00" />
        <Text className="mt-2 text-gray-600">Abriendo sorteo...</Text>
      </SafeAreaView>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f8fafc',
        },
        headerTintColor: '#1e293b', // text-slate-800
        headerTitleStyle: {
          fontFamily: 'Quicksand-Bold',
        },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[customRaffleId]" options={{ headerShown: false }} />
    </Stack>
  );
}