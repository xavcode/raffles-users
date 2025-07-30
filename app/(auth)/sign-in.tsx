import { Link } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { icons } from "../../constants";
import SocialButton from "../components/SocialButton";

const SignIn = () => {
    return (
        <View className="flex-1 justify-center p-6 bg-gray-50">
            <View className="w-full">
                <Text className="text-3xl font-quicksand-bold mb-8 text-center text-gray-800">Bienvenido</Text>

                <SocialButton strategy="oauth_google" icon={icons.google} text="Continuar con Google" />
                <SocialButton strategy="oauth_facebook" icon={icons.facebook} text="Continuar con Facebook" />
                {/* Instagram no soporta OAuth para login en apps de terceros, solo para obtener datos. Usaremos Google y Facebook. */}

                <View className="flex-row items-center my-6">
                    <View className="flex-1 h-px bg-gray-300" />
                    <Text className="mx-4 text-gray-500">o</Text>
                    <View className="flex-1 h-px bg-gray-300" />
                </View>

                <Text className="text-center text-gray-600">
                    ¿No tienes una cuenta?{" "}
                    <Link href="/(auth)/sign-up" asChild>
                        <Text className="text-primary font-quicksand-bold">Regístrate aquí</Text>
                    </Link>
                </Text>
            </View>
        </View>
    );
}
export default SignIn