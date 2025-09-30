import ImagePickerWithPreview from '@/app/components/ImagePickerWithPreview';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

const EditProfilePage = () => {
  const router = useRouter();
  const convexUser = useQuery(api.users.getCurrent);
  const updateUser = useMutation(api.users.update);

  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (convexUser) {
      setUserName(convexUser.userName ?? '');
      setPhone(convexUser.phone ?? '');
      setProfileImageUrl(convexUser.profileImageUrl ?? '');
    }
  }, [convexUser]);

  const handleSave = async () => {
    if (!userName) {
      Toast.show({ type: 'error', text1: 'Campos incompletos', text2: 'Por favor, completa tu nombre de usuario.' });
      return;
    }
    if (phone && (phone.length !== 10 || !/^\d+$/.test(phone))) {
      Toast.show({ type: 'error', text1: 'Número inválido', text2: 'El número de teléfono debe tener 10 dígitos o estar vacío.' });
      return;
    }

    setIsLoading(true);
    try {
      // Solo enviar los campos que han cambiado
      const updates: any = {};

      if (userName !== (convexUser?.userName || '')) {
        updates.userName = userName;
      }

      if (phone !== (convexUser?.phone || '')) {
        updates.phone = phone || undefined;
      }

      if (profileImageUrl !== (convexUser?.profileImageUrl || '')) {
        updates.profileImageUrl = profileImageUrl || undefined;
      }

      // Si no hay cambios, no hacer la actualización
      if (Object.keys(updates).length === 0) {
        Toast.show({ type: 'info', text1: 'Sin cambios', text2: 'No hay cambios para guardar.' });
        router.back();
        return;
      }

      await updateUser(updates);
      Toast.show({ type: 'success', text1: 'Éxito', text2: 'Tu perfil ha sido actualizado.' });
      router.back();
    } catch (error) {
      console.error("Error updating profile:", error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo actualizar tu perfil. Inténtalo de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (convexUser === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={90}
      >
        {/* <GlobalHeader /> */}
        <Stack.Screen
          options={{
            headerTitle: 'Perfil',
            headerLargeTitle: false,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: '#f8fafc' },
            headerTitleStyle: { fontFamily: 'Quicksand-Bold', fontSize: 18 },
            headerLeft: () => (
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 items-center justify-center ml-2"
              >
                <Ionicons name="arrow-back" size={24} color="#4B5563" />
              </Pressable>
            ),
          }}
        />
        <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 30 }}>
          <View className="bg-white rounded-2xl p-6 shadow-sm shadow-slate-300/50 border border-gray-100">
            {/* Selector de imagen de perfil */}
            <ImagePickerWithPreview
              currentImageUrl={convexUser?.profileImageUrl}
              onImageSelected={setProfileImageUrl}
              onUploadStart={() => setIsUploadingImage(true)}
              onUploadComplete={() => setIsUploadingImage(false)}
              isUploading={isUploadingImage}
            />

            <View className="mb-5">
              <Text className="text-sm font-quicksand-bold text-slate-600 mb-2">Nombre de Usuario</Text>
              <TextInput
                value={userName}
                onChangeText={setUserName}
                placeholder="Tu nombre de usuario"
                className="bg-slate-50 border border-slate-200 h-12 rounded-xl px-4 text-base font-quicksand-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View className="mb-6">
              <Text className="text-sm font-quicksand-bold text-slate-600 mb-2">Número de Teléfono</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Ej: 3001234567"
                keyboardType="number-pad"
                maxLength={10}
                className="bg-slate-50 border border-slate-200 h-12 rounded-xl px-4 text-base font-quicksand-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                placeholderTextColor="#94a3b8"
              />
              <View className="flex-row bg-indigo-50 border border-indigo-200 p-4 rounded-xl mt-3 items-start shadow-sm">
                <Ionicons name="information-circle-outline" size={20} color="#4f46e5" className="mt-px" />
                <Text className="text-sm text-indigo-700 ml-2 flex-1">
                  Este número será utilizado para enviarte los pagos de premios que ganes.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleSave}
              disabled={isLoading || isUploadingImage}
              className={`h-12 rounded-xl items-center justify-center transition-all duration-200 ${(isLoading || isUploadingImage)
                ? 'bg-slate-400'
                : 'bg-indigo-600 active:bg-indigo-700 shadow-lg active:shadow-xl'
                }`}
            >
              {isLoading || isUploadingImage ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-quicksand-bold text-base">Guardar Cambios</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default EditProfilePage;

