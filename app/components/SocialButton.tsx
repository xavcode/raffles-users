import { useOAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, Text } from 'react-native';
// import { useWarmUpBrowser } from '../../hooks/useWarmUpBrowser';

type SocialButtonProps = {
    strategy: 'oauth_google' | 'oauth_facebook' | 'oauth_instagram';
    icon: any; // Tipo de dato para el ícono (puede ser un require)
    text: string;
};

const SocialButton = ({ strategy, icon, text }: SocialButtonProps) => {

    const router = useRouter();
    const { startOAuthFlow } = useOAuth({ strategy });

    const handlePress = React.useCallback(async () => {
        try {
            // Inicia el flujo de autenticación de Clerk.
            const { createdSessionId, setActive } = await startOAuthFlow();

            if (createdSessionId && setActive) {
                // Si el flujo es exitoso, activa la sesión.
                await setActive({ session: createdSessionId });
                // Redirige al usuario a la página principal.
                router.replace('/(tabs)/profile');
            }
        } catch (err) {
            console.error("OAuth error", err);
        }
    }, [startOAuthFlow, router]);

    return (
        <Pressable
            onPress={handlePress}
            className="w-full flex-row items-center justify-center p-3 border border-gray-300 rounded-lg mb-4 active:bg-gray-100"
        >
            <Image source={icon} className="w-6 h-6 mr-4" resizeMode="contain" />
            <Text className="text-base font-quicksand-semibold text-gray-700">{text}</Text>
        </Pressable>
    );
};

export default SocialButton;