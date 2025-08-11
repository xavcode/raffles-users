import { useFonts } from "expo-font";
import { Slot, SplashScreen } from "expo-router";

import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";


import { useEffect } from "react";
import { View } from "react-native";
import { configureReanimatedLogger } from "react-native-reanimated";
import './global.css';

import Toast from 'react-native-toast-message';
import toastConfig from "./components/ToastConfig";

// Deshabilita la advertencia de "strict mode" de Reanimated que aparece en la consola.
// Esta advertencia es útil para depurar, pero en este caso, es causada por cómo
// Expo Router maneja los colores animados en la barra de pestañas y no indica un problema real.
configureReanimatedLogger({
  strict: false,
});

export default function RootLayout() {

  const [fontsLoaded, error] = useFonts({
    "Quicksand-Regular": require("../assets/fonts/Quicksand-Regular.ttf"),
    "Quicksand-Bold": require("../assets/fonts/Quicksand-Bold.ttf"),
    "Quicksand-SemiBold": require("../assets/fonts/Quicksand-SemiBold.ttf"),
    "Quicksand-Light": require("../assets/fonts/Quicksand-Light.ttf"),
    "Quicksand-Medium": require("../assets/fonts/Quicksand-Medium.ttf"),
  })

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
  if (!publishableKey) {
    throw new Error("CLERK_PUBLISHABLE_KEY is not set in your .env");
  }

  const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!)

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  },

    [fontsLoaded, error])


  return (
    <View className="flex-1 items-center justify-center ">
      <View className="flex-1 w-full md:max-w-2xl md:rounded-2xl md:shadow-2xl ">
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <ClerkLoaded>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
              <Slot />
              <Toast config={toastConfig} />
            </ConvexProviderWithClerk>
          </ClerkLoaded>
        </ClerkProvider>
      </View>
    </View>
  )
}
