import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthFallbackProps = {
    title?: string;
    message?: string;
    showHeader?: boolean;
};

const AuthFallback = ({
    title = "Esta sección es privada",
    message = "Debes iniciar sesión para acceder a esta funcionalidad.",
    showHeader = false
}: AuthFallbackProps) => {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            {showHeader && (
                <View className="bg-white border-b border-slate-200 px-4 py-3">
                    <Text className="text-lg font-quicksand-bold text-slate-800">Acceso requerido</Text>
                </View>
            )}
            <View className="flex-1 justify-center items-center px-8">
                <Ionicons name="lock-closed-outline" size={64} color="#cbd5e1" />
                <Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">{title}</Text>
                <Text className="text-sm font-quicksand-medium text-slate-400 text-center mt-1 mb-6">{message}</Text>
                <Pressable onPress={() => router.push('/(auth)/sign-in')} className="bg-primary px-8 py-3 rounded-lg active:opacity-80">
                    <Text className="text-white font-quicksand-bold text-base">Iniciar Sesión</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
};

export default AuthFallback;
