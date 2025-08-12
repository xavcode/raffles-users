import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "../../constants";
import SocialButton from "../components/SocialButton";

const AnimatedContainer = ({ children, delay }: { children: React.ReactNode, delay: number }) => (
  <MotiView
    from={{ opacity: 0, translateY: 50 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 500, delay }}
  >
    {children}
  </MotiView>
);

const SignIn = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      <View className="flex-1 justify-between p-6">
        <View />
        <AnimatedContainer delay={0}>
          <View className="items-center">
            {/* Puedes reemplazar este ícono por el logo de tu aplicación */}
            <View className="bg-primary/10 p-6 rounded-full">
              <Ionicons name="gift-outline" size={64} color="#4f46e5" />
            </View>
            <Text className="text-3xl font-quicksand-bold text-center text-gray-800 mt-6">¡Bienvenido de Nuevo!</Text>
            <Text className="text-base font-quicksand-medium text-center text-gray-500 mt-2">Inicia sesión para continuar.</Text>
          </View>
        </AnimatedContainer>

        <AnimatedContainer delay={200}>
          <SocialButton strategy="oauth_google" icon={icons.google} text="Continuar con Google" />
          <SocialButton strategy="oauth_facebook" icon={icons.facebook} text="Continuar con Facebook" />
        </AnimatedContainer>

        {/* <Text className="text-center text-xs text-gray-400 font-quicksand-medium">
                    Al continuar, aceptas nuestros <Link href="/terms" asChild><Text className="text-gray-500 font-quicksand-bold">Términos de Servicio</Text></Link> y <Link href="/privacy" asChild><Text className="text-gray-500 font-quicksand-bold">Política de Privacidad</Text></Link>.
                </Text> */}
      </View>
    </SafeAreaView>
  );
}
export default SignIn