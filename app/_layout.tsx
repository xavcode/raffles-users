import { NetworkProvider } from '@/contexts/NetworkContext';
import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useFonts } from "expo-font";
import { Slot, SplashScreen } from "expo-router";
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import OfflineBanner from './components/OfflineBanner';
import toastConfig from './components/ToastConfig';
import './global.css';

SplashScreen.preventAutoHideAsync();

// --- Variables de Entorno ---
// Leemos las variables de entorno aquí para asegurar que existan antes de que la app intente usarlas.
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!publishableKey) {
  throw new Error('Clave publicable de Clerk no encontrada. Asegúrate de que EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY esté en tu archivo .env');
}
if (!convexUrl) {
  throw new Error('URL de Convex no encontrada. Asegúrate de que EXPO_PUBLIC_CONVEX_URL esté en tu archivo .env');
}

// Deshabilita la advertencia de "strict mode" de Reanimated que aparece en la consola.
// Esta advertencia es útil para depurar, pero en este caso, es causada por cómo
// Expo Router maneja los colores animados en la barra de pestañas y no indica un problema real.
configureReanimatedLogger({
  strict: false,
});

const RootLayout = () => {
  const [fontsLoaded, error] = useFonts({
    "Quicksand-Regular": require("../assets/fonts/Quicksand-Regular.ttf"),
    "Quicksand-Bold": require("../assets/fonts/Quicksand-Bold.ttf"),
    "Quicksand-SemiBold": require("../assets/fonts/Quicksand-SemiBold.ttf"),
    "Quicksand-Light": require("../assets/fonts/Quicksand-Light.ttf"),
    "Quicksand-Medium": require("../assets/fonts/Quicksand-Medium.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded) {
    return null;
  }

  return <RootLayoutNav />;
};

// const InitialLayout = () => {
//   const { isLoaded, isSignedIn } = useAuth();
//   const segments = useSegments();
//   const router = useRouter();

//   useEffect(() => {
//     if (!isLoaded) return;
//     const inAuthGroup = segments[0] === '(auth)';
//     if (isSignedIn && inAuthGroup) {
//       router.replace('/(tabs)');
//     } else if (!isSignedIn && !inAuthGroup) {
//       router.replace('/(auth)/sign-in');
//     }
//   }, [isLoaded, isSignedIn, segments]);

//   return <Slot />;
// };

const RootLayoutNav = () => {
  const convex = new ConvexReactClient(convexUrl);

  return (
    <View className="flex-1 items-center justify-center ">
      <View className="flex-1 w-full md:max-w-2xl md:rounded-2xl md:shadow-2xl ">
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SafeAreaProvider>
                <NetworkProvider>
                  <ClerkLoaded>
                    <Slot />
                    <OfflineBanner />
                    <Toast config={toastConfig} />
                    {/* <InitialLayout /> */}
                  </ClerkLoaded>
                </NetworkProvider>
              </SafeAreaProvider>
            </GestureHandlerRootView>
          </ConvexProviderWithClerk>
        </ClerkProvider>
      </View>
    </View>
  );
};

export default RootLayout;