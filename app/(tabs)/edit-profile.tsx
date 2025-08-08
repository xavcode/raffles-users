import { useUser } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import React from 'react';
import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditProfilePage = () => {
    const { user } = useUser();

    const handleSaveChanges = () => {
        Alert.alert("Guardado", "Tus cambios han sido guardados (simulación).");
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <Stack.Screen options={{ title: 'Editar Perfil', headerBackTitle: 'Atrás' }} />
            <View className="p-4">
                <Text className="text-lg font-quicksand-semibold text-slate-600">
                    Aquí podrás editar tu nombre y foto de perfil.
                </Text>
                <Text className="text-base font-quicksand-medium text-slate-500 mt-2">
                    Esta funcionalidad está en desarrollo.
                </Text>
            </View>
        </SafeAreaView>
    );
};

export default EditProfilePage;