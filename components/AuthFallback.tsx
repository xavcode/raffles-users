import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobalHeader from './GlobalHeader';

type AuthFallbackProps = {
    title: string;
    message: string;
};

const AuthFallback = ({ title, message }: AuthFallbackProps) => {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <GlobalHeader />
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
