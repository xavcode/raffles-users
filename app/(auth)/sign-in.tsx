import { Ionicons } from '@expo/vector-icons';
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "../../constants";
import SocialButton from "../components/SocialButton";

// Esta es la versión para WEB.
// Para evitar errores de compilación, no importamos 'moti'.
// En su lugar, creamos un 'AnimatedContainer' falso que simplemente renderiza
// a sus hijos sin animación, pero mantiene la misma estructura JSX que la versión nativa.

const SignIn = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      <View className="flex-1 justify-between p-6">
        <View />
        <View >
          <View className="items-center">
            <View className="bg-primary/10 p-6 rounded-full">
              <Ionicons name="gift-outline" size={64} color="#4f46e5" />
            </View>
            <Text className="text-3xl font-quicksand-bold text-center text-gray-800 mt-6">¡Bienvenido de Nuevo!</Text>
            <Text className="text-base font-quicksand-medium text-center text-gray-500 mt-2">Inicia sesión para continuar.</Text>
          </View>
        </View>

        <View >
          <SocialButton strategy="oauth_google" icon={icons.google} text="Continuar con Google" />
          {/* <SocialButton strategy="oauth_facebook" icon={icons.facebook} text="Continuar con Facebook" /> */}
        </View>
      </View>
    </SafeAreaView>
  );
}
export default SignIn;