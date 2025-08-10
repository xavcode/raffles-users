import { api } from '@/convex/_generated/api';
import { SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-expo';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Link } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';

const profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const convexUser = useQuery(api.users.getCurrent);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <SignedIn>
        {convexUser === undefined ? (
          <View className="flex-1 justify-center items-center h-screen">
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : (
          <View className="p-6">
            <View className="items-center mb-8">
              <Image source={{ uri: user?.imageUrl }} className="w-28 h-28 rounded-full mb-4 border-4 border-primary" />
              <Text className="text-2xl font-quicksand-bold text-gray-800">{convexUser?.firstName} {convexUser?.lastName}</Text>
              <Text className="text-base text-gray-500 mt-1">{convexUser?.email}</Text>
            </View>

            {!convexUser?.phone && (
              <View className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-md mb-6">
                <View className="flex-row items-center">
                  <Ionicons name="warning-outline" size={24} color="#F59E0B" />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-quicksand-bold text-yellow-800">¡Acción requerida!</Text>
                    <Text className="text-sm text-yellow-700 mt-1">
                      Agrega tu número de teléfono para poder recibir los pagos de los premios que ganes.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-lg font-quicksand-bold text-gray-700 mb-4">Cuenta</Text>
              <Link href={"./edit-profile"} asChild>
                <Pressable className="flex-row items-center justify-between p-3 rounded-lg active:bg-gray-100">
                  <View className="flex-row items-center">
                    <FontAwesome name="user-o" size={20} color="#4B5563" />
                    <Text className="text-gray-800 font-quicksand-semibold text-base ml-4">Editar Perfil</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color="#9CA3AF" />
                </Pressable>
              </Link>
              <View className="h-px bg-gray-200 my-2" />
              <Pressable
                onPress={() => signOut()}
                className="flex-row items-center p-3 rounded-lg active:bg-gray-100"
              >
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <Text className="text-red-500 font-quicksand-semibold text-base ml-4">Cerrar Sesión</Text>
              </Pressable>
            </View>
          </View>
        )}
      </SignedIn>
      <SignedOut>
        <View className="w-full items-center p-6 mt-20">
          <Text className="text-2xl font-quicksand-bold mb-4 text-gray-800">¡Únete a la comunidad!</Text>
          <Text className="text-lg text-center text-gray-600 mb-12">Inicia sesión para participar en sorteos, ver tus boletos y gestionar tu perfil.</Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable className="bg-primary p-4 rounded-lg w-full items-center active:opacity-80">
              <Text className="text-white font-quicksand-bold text-base">Iniciar Sesión o Registrarse</Text>
            </Pressable>
          </Link>
        </View>
      </SignedOut>
    </ScrollView>
  )
}

export default profile