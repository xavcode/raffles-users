import { api } from '@/convex/_generated/api';
import { SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-expo';
import { FontAwesome } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Link } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';

const profile = () => {
    const { signOut } = useAuth();
    const { user } = useUser();
    const convexUser = useQuery(api.users.getCurrent);

    return (
        <View className="flex-1 items-center justify-center p-6 bg-gray-50">
            <SignedIn>
                {convexUser === undefined ? (
                    <ActivityIndicator size="large" color="#6366F1" />
                ) : (
                    <View className="w-full items-center">
                        <Image source={{ uri: user?.imageUrl }} className="w-24 h-24 rounded-full mb-4 border-2 border-primary" />
                        <Text className="text-2xl font-quicksand-bold text-gray-800">{convexUser?.firstName} {convexUser?.lastName}</Text>
                        <Text className="text-base text-gray-500 mb-4">{convexUser?.email}</Text>
                        <Text className="text-base text-gray-500 mb-8">{convexUser?.phone ?? 'Sin número de teléfono'}</Text>

                        <Link href={"./edit-profile"} asChild>
                            <Pressable className="flex-row items-center justify-center bg-gray-200 p-3 rounded-lg w-full mb-4 active:opacity-80">
                                <FontAwesome name="pencil" size={18} color="#4B5563" />
                                <Text className="text-gray-700 font-quicksand-bold text-base ml-2">Editar Perfil</Text>
                            </Pressable>
                        </Link>

                        <Pressable
                            onPress={() => signOut()}
                            className="bg-primary p-4 rounded-lg w-full items-center active:opacity-80"
                        >
                            <Text className="text-white font-quicksand-bold text-base">Cerrar Sesión</Text>
                        </Pressable>
                    </View>
                )}
            </SignedIn>
            <SignedOut>
                <View className="w-full items-center">
                    <Text className="text-2xl font-quicksand-bold mb-4 text-gray-800">¡Únete a la comunidad!</Text>
                    <Text className="text-lg text-center text-gray-600 mb-12">Inicia sesión para participar en sorteos, ver tus boletos y gestionar tu perfil.</Text>
                    <Link href="/(auth)/sign-in" asChild>
                        <Pressable className="bg-primary p-4 rounded-lg w-full items-center active:opacity-80">
                            <Text className="text-white font-quicksand-bold text-base">Iniciar Sesión o Registrarse</Text>
                        </Pressable>
                    </Link>
                </View>
            </SignedOut>
        </View>
    )
}

export default profile