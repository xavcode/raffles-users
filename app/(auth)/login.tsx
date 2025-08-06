import { useOAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

const LoginScreen = () => {
    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

    const onGooglePress = React.useCallback(async () => {
        try {
            const { createdSessionId, setActive } = await startOAuthFlow();

            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
                // Después de un login exitoso, el "guardia" en _layout.tsx
                // se encargará de la redirección automáticamente.
            }
        } catch (err) {
            console.error('OAuth error', err);
            // Aquí podrías mostrar una alerta al usuario.
        }
    }, [startOAuthFlow]);

    return (
        <View className="flex-1 justify-center items-center bg-white p-8">
            <Text className="text-4xl font-quicksand-bold text-slate-800">¡Bienvenido!</Text>
            <Text className="text-lg font-quicksand-medium text-slate-500 mt-2 text-center">Inicia sesión para empezar a participar en los mejores sorteos.</Text>

            <View className="w-full mt-16">
                <Pressable
                    onPress={onGooglePress}
                    className="flex-row items-center justify-center bg-white border border-slate-200 p-4 rounded-xl shadow-sm active:bg-slate-50"
                >
                    <Ionicons name="logo-google" size={24} color="#4285F4" />
                    <Text className="text-slate-700 font-quicksand-semibold text-base ml-4">Continuar con Google</Text>
                </Pressable>
            </View>
        </View>
    );
};

export default LoginScreen;
