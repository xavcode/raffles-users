import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../../convex/_generated/api';

const ProfileScreen = () => {
  // Ya no necesitamos signOut de Clerk, solo redirigimos
  // const { signOut } = useAuth();

  const currentUser = useQuery(api.users.getCurrent);
  const updateUserMutation = useMutation(api.users.update); // Corregido: 'update' en lugar de 'updateUser'
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSignOut = async () => {
    // Al cerrar sesión, simplemente redirigimos
    // En un futuro, si Convex tiene una función de logout, la llamaríamos aquí.
    router.replace('/(auth)/sign-in');
  };

  if (currentUser === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  if (currentUser === null) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-1 justify-center items-center p-8">
          <Image source={require('../../../assets/images/avatar.png')} className="w-24 h-24 rounded-full mb-4" />
          <Text className="text-xl font-quicksand-bold text-slate-700 mb-2">No Has Iniciado Sesión</Text>
          <Text className="text-base font-quicksand-medium text-slate-500 text-center mb-6">Inicia sesión para ver y administrar tu perfil.</Text>
          <Pressable onPress={() => router.replace('/(auth)/sign-in')} className="bg-primary px-6 py-3 rounded-xl active:opacity-80">
            <Text className="text-white font-quicksand-bold text-base">Iniciar Sesión</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-1 p-4">
        <View className="items-center mb-6">
          <Image
            source={require('../../../assets/images/avatar.png')}
            className="w-28 h-28 rounded-full border-4 border-white shadow-md"
          />
          <Text className="text-2xl font-quicksand-bold text-slate-800 mt-4">{currentUser.firstName} {currentUser.lastName}</Text>
          {currentUser.userName && (
            <Text className="text-base font-quicksand-medium text-slate-500">@{currentUser.userName}</Text>
          )}
          {currentUser.email && (
            <Text className="text-sm font-quicksand-medium text-slate-500 mt-1">{currentUser.email}</Text>
          )}
        </View>

        <View className="bg-white rounded-2xl shadow-sm shadow-slate-300/50 p-4 mb-4">
          <Pressable
            onPress={() => router.push('/profile/edit-profile')}
            className="flex-row items-center justify-between py-3 border-b border-slate-200/60"
          >
            <View className="flex-row items-center">
              <Ionicons name="pencil-outline" size={20} color="#4f46e5" />
              <Text className="text-base font-quicksand-medium text-slate-700 ml-3">Editar Perfil</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#94a3b8" />
          </Pressable>

          <Pressable
            onPress={handleSignOut}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text className="text-base font-quicksand-medium text-red-500 ml-3">Cerrar Sesión</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#94a3b8" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen