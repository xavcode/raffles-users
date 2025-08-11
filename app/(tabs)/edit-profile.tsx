import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const EditProfilePage = () => {
  const router = useRouter();
  const convexUser = useQuery(api.users.getCurrent);
  const updateUser = useMutation(api.users.update);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (convexUser) {
      setFirstName(convexUser.firstName ?? '');
      setLastName(convexUser.lastName ?? '');
      setPhone(convexUser.phone ?? '');
    }
  }, [convexUser]);

  const handleSave = async () => {
    if (!firstName || !lastName || !phone) {
      Toast.show({ type: 'error', text1: 'Campos incompletos', text2: 'Por favor, completa todos los campos.' });
      return;
    }
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      Toast.show({ type: 'error', text1: 'Número inválido', text2: 'El número de teléfono debe tener 10 dígitos.' });
      return;
    }

    setIsLoading(true);
    try {
      await updateUser({
        firstName,
        lastName,
        phone,
      });
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
    <SafeAreaView className="flex-1">

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-gray-50"
        keyboardVerticalOffset={90}
      >
        {/* <GlobalHeader /> */}
        <Stack.Screen options={{ title: 'Editar Perfil', headerBackTitle: 'Atrás' }} />
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
          <View className="p-6">
            <View className="mb-4">
              <Text className="text-base font-quicksand-semibold text-gray-600 mb-2">Nombre</Text>
              <TextInput value={firstName} onChangeText={setFirstName} placeholder="Tu nombre" className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-800" />
            </View>
            <View className="mb-4">
              <Text className="text-base font-quicksand-semibold text-gray-600 mb-2">Apellido</Text>
              <TextInput value={lastName} onChangeText={setLastName} placeholder="Tu apellido" className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-800" />
            </View>
            <View className="mb-6">
              <Text className="text-base font-quicksand-semibold text-gray-600 mb-2">Número de Teléfono</Text>
              <TextInput value={phone} onChangeText={setPhone} placeholder="Ej: 3001234567" keyboardType="number-pad" maxLength={10} className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-800" />
              <View className="flex-row bg-blue-100 p-3 rounded-md mt-3 items-start">
                <Ionicons name="information-circle-outline" size={20} color="#2563EB" className="mt-px" />
                <Text className="text-sm text-blue-800 ml-2 flex-1">
                  Este número de teléfono será utilizado para enviarte los pagos de los premios que ganes. Asegúrate de que sea correcto.
                </Text>
              </View>
            </View>

            <Pressable onPress={handleSave} disabled={isLoading} className={`bg-primary p-4 rounded-lg items-center active:opacity-80 ${isLoading ? 'opacity-50' : ''}`}>
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-white font-quicksand-bold text-base">Guardar Cambios</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfilePage;

