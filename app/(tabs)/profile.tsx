import { SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-expo';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

const profile = () => {
    const { signOut } = useAuth();
    const { user } = useUser();

    return (
        <View className="flex-1 items-center justify-center p-6 bg-gray-50">
            <SignedIn>
                <View className="w-full items-center">
                    <Image source={{ uri: user?.imageUrl }} className="w-24 h-24 rounded-full mb-4 border-2 border-primary" />
                    <Text className="text-2xl font-quicksand-bold text-gray-800">{user?.fullName}</Text>
                    <Text className="text-base text-gray-500 mb-12">{user?.primaryEmailAddress?.emailAddress}</Text>

                    <Pressable
                        onPress={() => signOut()}
                        className="bg-primary p-4 rounded-lg w-full items-center active:opacity-80"
                    >
                        <Text className="text-white font-quicksand-bold text-base">Cerrar Sesión</Text>
                    </Pressable>
                </View>
            </SignedIn>
            <SignedOut>
                <Text className="text-lg text-center text-gray-600">Inicia sesión para ver tu perfil.</Text>
            </SignedOut>
        </View>
    )
}

export default profile