import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import Toast from 'react-native-toast-message';

export default function HomeStackLayout() {
  const router = useRouter();
  const [deepLinkCustomRaffleId, setDeepLinkCustomRaffleId] = React.useState<string | null>(null);

  // Query Convex para buscar la rifa por customRaffleId
  const raffle = useQuery(api.raffles.getByCustomRaffleId, deepLinkCustomRaffleId ? { customRaffleId: deepLinkCustomRaffleId } : 'skip');

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      try {
        console.log('🔗 Deep link recibido en HomeStackLayout:', url);

        // Limpiar la URL para manejar casos con triple slash y el prefijo de Expo Go
        let cleanUrl = url.replace(':///', '://');

        // Lógica mejorada para Expo Go y URLs de desarrollo
        if (cleanUrl.startsWith('exp://') || cleanUrl.includes('expo-development-client') || cleanUrl.includes('localhost') || cleanUrl.includes('192.168')) {
          const parsedExpoUrl = Linking.parse(cleanUrl);
          console.log('🔍 Parsed Expo URL:', parsedExpoUrl);
          // Busca la parte de la ruta después de /--/
          if (parsedExpoUrl.path?.includes('/--/')) {
            const appPath = parsedExpoUrl.path.split('/--/')[1];
            if (appPath) {
              cleanUrl = `milsorteos://${appPath}`;
              console.log('🧹 URL limpia de Expo Go (reconstruida): ', cleanUrl);
            }
          }
        }

        const { path } = Linking.parse(cleanUrl);
        console.log('🔍 Parsed final path:', path);

        let customRaffleIdFromLink = null;
        if (path?.includes('/sorteo/')) {
          customRaffleIdFromLink = path.replace('/sorteo/', '');
        } else if (cleanUrl.includes('sorteo/')) {
          // Fallback: buscar directamente en la URL limpia si el parsing no fue perfecto
          const match = cleanUrl.match(/sorteo\/([^\/\?#]+)/);
          if (match && match[1]) {
            customRaffleIdFromLink = match[1];
          }
        }

        if (customRaffleIdFromLink) {
          console.log('🔎 customRaffleId extraído:', customRaffleIdFromLink);
          setDeepLinkCustomRaffleId(customRaffleIdFromLink);
        } else {
          console.log('❌ No se pudo extraer customRaffleId de:', cleanUrl);
        }
      } catch (error) {
        console.error('❌ Error procesando deep link en HomeStackLayout:', error);
      }
    };

    // Manejar URL inicial
    Linking.getInitialURL().then((url) => {
      if (url) {
        // Solo procesar URLs que parezcan deep links externos, no las de desarrollo de Expo Router
        if (url && !url.includes('expo-development-client') && !url.includes('localhost:8081') && !url.includes('192.168') && (url.startsWith('milsorteos://') || url.includes('/sorteo/'))) {
          handleDeepLink(url);
        }
      }
    });

    // Manejar URLs mientras la app está abierta
    const subscription = Linking.addEventListener('url', ({ url }) => {
      // Solo procesar URLs que parezcan deep links externos
      if (url && !url.includes('expo-development-client') && !url.includes('localhost:8081') && !url.includes('192.168') && (url.startsWith('milsorteos://') || url.includes('/sorteo/'))) {
        handleDeepLink(url);
      }
    });

    return () => subscription?.remove();
  }, []);

  // Efecto para navegar una vez que la rifa es encontrada por Convex
  useEffect(() => {
    if (raffle && deepLinkCustomRaffleId) {
      console.log('✅ Raffle encontrado por customRaffleId. Navegando a _id:', raffle._id);
      router.replace(`/(tabs)/(home)/${raffle._id}`);
      setDeepLinkCustomRaffleId(null); // Limpiar para evitar re-navegación
    } else if (raffle === null && deepLinkCustomRaffleId) {
      // Si raffle es null y deepLinkCustomRaffleId existe, significa que no se encontró la rifa.
      Toast.show({
        type: 'error',
        text1: 'Sorteo no encontrado',
        text2: `No se encontró el sorteo con ID: ${deepLinkCustomRaffleId}`,
      });
      router.replace('/(tabs)/(home)'); // Volver al home
      setDeepLinkCustomRaffleId(null); // Limpiar
    }
  }, [raffle, deepLinkCustomRaffleId, router]);

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
      <Stack.Screen name="[raffleId]" options={{ headerShown: false }} />
    </Stack>
  );
}