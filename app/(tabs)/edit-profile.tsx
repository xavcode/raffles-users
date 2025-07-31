import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const EditProfileScreen = () => {
    const { user } = useUser();
    const router = useRouter();
    const convexUser = useQuery(api.users.getCurrent);
    const updateUser = useMutation(api.users.update);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Pre-rellena el formulario cuando los datos del usuario se cargan.
    useEffect(() => {
        if (user && convexUser) {
            setFirstName(convexUser.firstName ?? '');
            setLastName(convexUser.lastName ?? '');
            setPhone(convexUser.phone ?? '');
        }
    }, [convexUser, user]);

    const handleSave = async () => {
        if (!user || !convexUser) return;
        setIsLoading(true);
        try {
            // Validación simple antes de enviar
            if (firstName.trim() === '' || lastName.trim() === '') {
                Alert.alert("Campos requeridos", "El nombre y el apellido no pueden estar vacíos.");
                setIsLoading(false);
                return;
            }
            if (phone.trim().length > 0 && phone.trim().length !== 10) {
                Alert.alert("Teléfono inválido", "El número de teléfono debe tener 10 dígitos.");
                setIsLoading(false);
                return;
            }

            // Llamamos a una única mutación en Convex.
            await updateUser({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() });

            Alert.alert("Éxito", "Tu perfil ha sido actualizado.");
            router.back(); // Volver a la pantalla de perfil.
        } catch (error) {
            console.error("Error al actualizar el perfil:", error);
            Alert.alert("Error", "No se pudo actualizar el perfil. Inténtalo de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    if (convexUser === undefined) {
        return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>;
    }

    // Handlers para validar la entrada en tiempo real
    const handleNameChange = (setter: React.Dispatch<React.SetStateAction<string>>, text: string) => {
        // Permite letras (incluyendo tildes y ñ), espacios, apóstrofes y guiones.
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]*$/;
        if (nameRegex.test(text)) {
            setter(text);
        }
    };

    const handlePhoneChange = (text: string) => {
        // Permite solo números.
        const phoneRegex = /^[0-9]*$/;
        if (phoneRegex.test(text)) {
            setPhone(text);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 p-6">
            <Text className="text-3xl font-quicksand-bold text-gray-800 mb-8">Editar Perfil</Text>

            <View className="mb-6">
                <Text className="text-base font-quicksand-semibold text-gray-600 mb-2">Nombre</Text>
                <TextInput value={firstName} onChangeText={(text) => handleNameChange(setFirstName, text)} placeholder="Tu nombre" className="w-full p-4 border border-gray-300 rounded-lg text-base bg-white" />
            </View>

            <View className="mb-6">
                <Text className="text-base font-quicksand-semibold text-gray-600 mb-2">Apellido</Text>
                <TextInput value={lastName} onChangeText={(text) => handleNameChange(setLastName, text)} placeholder="Tu apellido" className="w-full p-4 border border-gray-300 rounded-lg text-base bg-white" />
            </View>

            <View className="mb-8">
                <Text className="text-base font-quicksand-semibold text-gray-600 mb-2">Número de Teléfono (Nequi-Daviplata)</Text>
                <TextInput value={phone} onChangeText={handlePhoneChange} placeholder="Ej: 3001234567" keyboardType="phone-pad" maxLength={10} className="w-full p-4 border border-gray-300 rounded-lg text-base bg-white" />
            </View>

            <Pressable
                onPress={handleSave}
                disabled={isLoading}
                className={`bg-primary p-4 rounded-lg items-center active:opacity-80 ${isLoading ? 'opacity-50' : ''}`}
            >
                <Text className="text-white font-quicksand-bold text-base">
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Text>
            </Pressable>
        </SafeAreaView>
    );
};

export default EditProfileScreen;