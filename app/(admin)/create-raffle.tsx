import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

const CreateRafflePage = () => {
    const createRaffle = useMutation(api.raffles.createRaffle);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [totalTickets, setTotalTickets] = useState('');
    const [ticketPrice, setTicketPrice] = useState('');
    const [prize, setPrize] = useState('');
    // 1. Cambiamos el estado para guardar el objeto completo de la imagen, no solo la URI.
    const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

    // 2. Función para abrir la galería de imágenes del dispositivo
    const pickImage = async () => {
        // No se necesitan permisos para abrir la galería, pero sí para la cámara.
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3], // Proporción de la imagen
            quality: 0.8, // Calidad de la imagen (0 a 1)
        });

        if (!result.canceled) {
            // Guardamos la URI del primer asset seleccionado
            setImageAsset(result.assets[0]);
        }
    };

    const handleCreateRaffle = async () => {
        // 3. Validamos que todos los campos, incluida la imagen, estén completos
        if (!title || !description || !totalTickets || !ticketPrice || !prize || !imageAsset) {
            Alert.alert('Error', 'Por favor, completa todos los campos y selecciona una imagen.');
            return;
        }

        setIsLoading(true);
        try {
            // 4. Subir la imagen a Cloudinary ANTES de crear el sorteo en Convex
            const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

            if (!cloudName || !uploadPreset) {
                throw new Error("Las variables de entorno de Cloudinary no están configuradas.");
            }

            const formData = new FormData();
            // El 'as any' es necesario para que TypeScript no se queje con la estructura del archivo en React Native
            formData.append('file', {
                uri: imageAsset.uri,
                type: imageAsset.mimeType ?? 'image/jpeg', // Usamos el mimeType real, con un fallback
                name: imageAsset.fileName ?? 'upload.jpg',
            } as any);
            formData.append('upload_preset', uploadPreset);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }
            const uploadedImageUrl = data.secure_url;

            // 5. Crear el sorteo en Convex usando la URL de la imagen recién subida
            await createRaffle({
                title,
                description,
                prize: parseFloat(prize),
                imageUrl: uploadedImageUrl,
                totalTickets: parseInt(totalTickets, 10),
                ticketPrice: parseFloat(ticketPrice),
                startTime: Date.now(),
                endTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // Sorteo dura 7 días por defecto
            });

            Alert.alert('Éxito', 'Sorteo creado correctamente.');
            router.back();
        } catch (error) {
            console.error('Failed to create raffle:', error);
            const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
            Alert.alert('Error al crear sorteo', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
            <Stack.Screen options={{ title: 'Crear Nuevo Sorteo' }} />
            {/* Reemplazamos KeyboardAvoidingView y ScrollView por este componente inteligente */}
            <KeyboardAwareScrollView contentContainerClassName="p-4" extraScrollHeight={20} enableOnAndroid={true}>
                <View className="bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50">
                    <View className="mb-5">
                        <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Título del Sorteo</Text>
                        <TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="Ej: Rifa Pro-fondos" value={title} onChangeText={setTitle} />
                    </View>

                    <View className="mb-5">
                        <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Descripción</Text>
                        <TextInput className="bg-slate-100 border border-slate-200 h-28 rounded-lg px-4 text-base font-quicksand-medium align-top pt-3" placeholder="Describe los detalles del sorteo..." value={description} onChangeText={setDescription} multiline />
                    </View>

                    <View className="mb-5">
                        <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Premio (en COP)</Text>
                        <TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="Ej: 1000000" value={prize} onChangeText={setPrize} keyboardType="numeric" />
                    </View>

                    <View className="mb-5">
                        <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Imagen del Premio</Text>
                        {/* 6. Reemplazamos el TextInput por un área presionable para subir la imagen */}
                        <Pressable onPress={pickImage} className="bg-slate-100 border-2 border-dashed border-slate-300 h-48 rounded-lg justify-center items-center overflow-hidden">
                            {imageAsset ? (
                                // Si hay una imagen seleccionada, la mostramos como vista previa
                                <Image source={{ uri: imageAsset.uri }} className="w-full h-full" resizeMode="cover" />
                            ) : (
                                // Si no, mostramos un ícono y texto para incitar a la acción
                                <View className="items-center">
                                    <Ionicons name="cloud-upload-outline" size={40} color="#94a3b8" />
                                    <Text className="text-slate-500 font-quicksand-medium mt-2">Seleccionar una imagen</Text>
                                </View>
                            )}
                        </Pressable>
                    </View>

                    <View className="flex-row gap-x-4 mb-5">
                        <View className="flex-1">
                            <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Total Boletos</Text>
                            <TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="Ej: 100" value={totalTickets} onChangeText={setTotalTickets} keyboardType="numeric" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Precio Boleto</Text>
                            <TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="Ej: 5000" value={ticketPrice} onChangeText={setTicketPrice} keyboardType="decimal-pad" />
                        </View>
                    </View>

                    <Pressable
                        className="bg-indigo-600 h-12 rounded-lg justify-center items-center active:bg-indigo-700 disabled:bg-indigo-400"
                        onPress={handleCreateRaffle}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-quicksand-bold text-base">Crear Sorteo</Text>
                        )}
                    </Pressable>
                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};

export default CreateRafflePage;