import AuthFallback from '@/app/components/AuthFallback';
import { api } from '@/convex/_generated/api';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Link } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';

const profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const convexUser = useQuery(api.users.getCurrent);

  // Estado de carga mientras se obtiene el usuario
  if (convexUser === undefined) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  // Estado cuando el usuario no está autenticado
  if (convexUser === null) {
    return <AuthFallback />;
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View className="">
        <View className="items-center mb-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <Image source={{ uri: user?.imageUrl }} className="w-32 h-32 rounded-full mb-4 border-4 border-primary shadow-lg" />
          {convexUser?.userName && (
            <Text className="text-3xl font-quicksand-bold text-gray-800">@{convexUser.userName}</Text>
          )}
          {!convexUser?.userName && convexUser?.firstName && convexUser?.lastName && (
            <Text className="text-3xl font-quicksand-bold text-gray-800">{convexUser.firstName} {convexUser.lastName}</Text>
          )}
          {convexUser?.email && (
            <Text className="text-base font-quicksand-regular text-gray-500 mt-1">{convexUser.email}</Text>
          )}
          {convexUser?.freeRafflesRemaining !== undefined && (
            <View className="mt-4 p-2 px-4 bg-purple-50 rounded-full flex-row items-center space-x-2 border border-purple-200">
              <Ionicons name="gift-outline" size={20} color="#8B5CF6" />
              <Text className="text-base font-quicksand-bold text-purple-700">
                Rifas Gratuitas Restantes: {convexUser.freeRafflesRemaining}
              </Text>
            </View>
          )}
        </View>

        {!convexUser?.phone && (
          <View className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex-row items-center mb-6 shadow-sm">
            <Ionicons name="information-circle-outline" size={24} color="#F59E0B" />
            <View className="ml-3 flex-1">
              <Text className="text-base font-quicksand-bold text-yellow-800">¡Información importante!</Text>
              <Text className="text-sm text-yellow-700 mt-1">
                Agrega tu número de teléfono para poder recibir los pagos de los premios que ganes.
              </Text>
            </View>
            <Link href={'/(tabs)/profile/edit-profile'} asChild>
              <Pressable className="ml-4 px-3 py-1 bg-yellow-400 rounded-full active:opacity-80">
                <Text className="text-white font-quicksand-bold text-xs">Configurar</Text>
              </Pressable>
            </Link>
          </View>
        )}

        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Text className="text-xl font-quicksand-bold text-gray-700 mb-4">Configuración</Text>
          <Link href={"/(tabs)/profile/edit-profile"} asChild>
            <Pressable className="flex-row items-center justify-between p-3 rounded-lg active:bg-gray-100 transition-colors duration-150">
              <View className="flex-row items-center">
                <Ionicons name="person-outline" size={20} color="#4B5563" />
                <Text className="text-gray-800 font-quicksand-semibold text-base ml-4">Editar Perfil</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color="#9CA3AF" />
            </Pressable>
          </Link>
          <View className="h-px bg-gray-200 my-2" />
          <Pressable
            onPress={() => signOut()}
            className="flex-row items-center p-3 rounded-lg active:bg-gray-100 transition-colors duration-150"
          >
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text className="text-red-500 font-quicksand-semibold text-base ml-4">Cerrar Sesión</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

export default profile