import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMutation, useQuery } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

const EditRaffleScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const raffleId = id as Id<"raffles">;
    const raffleData = useQuery(api.raffles.getById, { id: raffleId });

    const updateRaffle = useMutation(api.raffles.updateRaffle);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        winCondition: '',
        prize: '',
        ticketPrice: '',
        totalTickets: '',
    });
    const [releaseTime, setReleaseTime] = useState('');
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'end'>('start');

    const scrollViewRef = React.useRef<ScrollView>(null);

    // Cloudinary configuration
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    useEffect(() => {
        if (raffleData) {
            setFormData({
                title: raffleData.title,
                description: raffleData.description,
                winCondition: raffleData.winCondition || '',
                prize: raffleData.prize?.toString() || '',
                ticketPrice: raffleData.ticketPrice.toString(),
                totalTickets: raffleData.totalTickets.toString(),
            });
            setReleaseTime(raffleData.releaseTime.toString());
            setStartTime(new Date(raffleData.startTime));
            setEndTime(new Date(raffleData.endTime));
            setCurrentImageUrl(raffleData.imageUrl);
        }
    }, [raffleData]);

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
        });
        if (!result.canceled) {
            setImageAsset(result.assets[0]);
        }
    };

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            if (datePickerTarget === 'start') {
                setStartTime(selectedDate);
            } else {
                setEndTime(selectedDate);
            }
        }
    };

    const showDatepickerFor = (target: 'start' | 'end') => {
        setDatePickerTarget(target);
        setShowDatePicker(true);
    };

    const handleFocusLastInputs = () => {
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    };

    const handleSubmit = async () => {
        if (!raffleData) return;

        if (
            !formData.title ||
            !formData.description ||
            !formData.winCondition ||
            !formData.prize ||
            !formData.ticketPrice ||
            !formData.totalTickets ||
            !releaseTime ||
            !startTime ||
            !endTime ||
            (!imageAsset && !currentImageUrl) // Debe haber una imagen o una URL existente
        ) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Por favor, completa todos los campos y selecciona una imagen.',
            });
            return;
        }

        const parsedReleaseTime = parseInt(releaseTime, 10);
        if (isNaN(parsedReleaseTime) || parsedReleaseTime < 1 || parsedReleaseTime > 240) {
            Toast.show({
                type: 'error',
                text1: 'Tiempo de liberación inválido',
                text2: 'El tiempo de liberación debe ser un número entre 1 y 240 minutos.',
            });
            return;
        }

        setIsLoading(true);
        let uploadedImageUrl = currentImageUrl; // Usar la imagen actual por defecto

        try {
            if (imageAsset) {
                if (!cloudName || !uploadPreset) {
                    throw new Error("Las variables de entorno de Cloudinary no están configuradas.");
                }
                const formDataCloud = new FormData();
                formDataCloud.append('upload_preset', uploadPreset);

                if (Platform.OS === 'web') {
                    const response = await fetch(imageAsset.uri);
                    const blob = await response.blob();
                    formDataCloud.append('file', blob, imageAsset.fileName ?? 'upload.jpg');
                } else {
                    formDataCloud.append('file', {
                        uri: imageAsset.uri,
                        type: imageAsset.mimeType ?? 'image/jpeg',
                        name: imageAsset.fileName ?? 'upload.jpg',
                    } as any);
                }

                const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: 'POST',
                    body: formDataCloud,
                });
                const data = await response.json();
                if (data.error) {
                    throw new Error(data.error.message);
                }
                uploadedImageUrl = data.secure_url;
            }

            await updateRaffle({
                id: raffleData._id,
                title: formData.title,
                description: formData.description,
                winCondition: formData.winCondition,
                prize: parseFloat(formData.prize),
                ticketPrice: parseFloat(formData.ticketPrice),
                totalTickets: parseInt(formData.totalTickets, 10),
                releaseTime: parsedReleaseTime,
                startTime: startTime.getTime(),
                endTime: endTime.getTime(),
                imageUrl: uploadedImageUrl,
            });

            Toast.show({ type: 'success', text1: 'Éxito', text2: 'Rifa actualizada correctamente.' });
            router.back();
        } catch (error) {
            console.error('Failed to update raffle:', error);
            const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
            Toast.show({ type: 'error', text1: 'Error al actualizar rifa', text2: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    if (raffleData === undefined) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text className="text-slate-700 mt-2">Cargando datos de la rifa...</Text>
            </SafeAreaView>
        );
    }

    if (raffleData === null) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center p-4">
                <Text className="text-slate-700">No se encontró la rifa.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
            <Stack.Screen options={{ title: 'Editar Rifa' }} />
            <KeyboardAwareScrollView
                contentContainerClassName='flex-1'
                enableOnAndroid={true}
                enableAutomaticScroll={true}
                enableResetScrollToCoords={true}
                resetScrollToCoords={{ x: 0, y: 0 }}
                extraScrollHeight={20}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerClassName="p-4"
                    keyboardShouldPersistTaps="always"
                >
                    <View className="bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50">
                        <View className="mb-5">
                            <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Título del Sorteo</Text>
                            <TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="Ej: Sorteo Pro-fondos" value={formData.title} onChangeText={(val) => handleInputChange('title', val)} />
                        </View>
                        <View className="mb-5">
                            <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Descripción</Text>
                            <TextInput className="bg-slate-100 border border-slate-200 h-28 rounded-lg px-4 text-base font-quicksand-medium align-top pt-3" placeholder="Describe los detalles del sorteo..." value={formData.description} onChangeText={(val) => handleInputChange('description', val)} multiline />
                        </View>

                        <View className="mb-5">
                            <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Condición del Sorteo</Text>
                            <TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="Ej: Lotería de Nariño, últimos 2 dígitos" value={formData.winCondition} onChangeText={(val) => handleInputChange('winCondition', val)} />
                        </View>

                        <View className="mb-5">
                            <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Premio (en COP)</Text>
                            <TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="Ej: 1000000" value={formData.prize} onChangeText={(val) => handleInputChange('prize', val)} keyboardType="numeric" />
                        </View>

                        <View className="mb-5">
                            <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Imagen del Premio</Text>
                            <Pressable onPress={pickImage} className="bg-slate-100 border-2 border-dashed border-slate-300 h-48 rounded-lg justify-center items-center overflow-hidden relative">
                                {imageAsset ? (
                                    <Image source={{ uri: imageAsset.uri }} className="w-full h-full" resizeMode="cover" />
                                ) : currentImageUrl ? (
                                    <Image source={{ uri: currentImageUrl }} className="w-full h-full" resizeMode="cover" />
                                ) : (
                                    <View className="items-center">
                                        <Ionicons name="cloud-upload-outline" size={40} color="#94a3b8" />
                                        <Text className="text-slate-500 font-quicksand-medium mt-2">Seleccionar una imagen</Text>
                                    </View>
                                )}
                                {(imageAsset || currentImageUrl) && (
                                    <TouchableOpacity onPress={() => { setImageAsset(null); setCurrentImageUrl(''); }} className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full">
                                        <Ionicons name="close" size={20} color="white" />
                                    </TouchableOpacity>
                                )}
                            </Pressable>
                        </View>

                        <View className="flex-row gap-x-4 mb-5">
                            <View className="flex-1">
                                <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Fecha de Inicio</Text>
                                <Pressable onPress={() => showDatepickerFor('start')} className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 justify-center">
                                    <Text className="text-base font-quicksand-medium">{startTime.toLocaleDateString('es-CO')}</Text>
                                </Pressable>
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Fecha del Sorteo</Text>
                                <Pressable onPress={() => showDatepickerFor('end')} className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 justify-center">
                                    <Text className="text-base font-quicksand-medium">{endTime.toLocaleDateString('es-CO')}</Text>
                                </Pressable>
                            </View>
                        </View>

                        <View className="mb-5">
                            <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Tiempo de Liberación de Tickets (minutos)</Text>
                            <TextInput
                                className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium"
                                placeholder="Ej: 30 (entre 1 y 240 minutos)"
                                keyboardType="number-pad"
                                value={releaseTime}
                                onChangeText={setReleaseTime}
                                maxLength={3}
                                onFocus={handleFocusLastInputs}
                            />
                        </View>

                        <View className="flex-row gap-x-4 mb-5">
                            <View className="flex-1">
                                <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Total Boletos</Text>
                                <TextInput onFocus={handleFocusLastInputs} className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="Ej: 100" value={formData.totalTickets} onChangeText={(val) => handleInputChange('totalTickets', val)} keyboardType="numeric" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Precio Boleto</Text>
                                <TextInput onFocus={handleFocusLastInputs} className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="Ej: 5000" value={formData.ticketPrice} onChangeText={(val) => handleInputChange('ticketPrice', val)} keyboardType="decimal-pad" />
                            </View>
                        </View>

                        <Pressable
                            className="bg-primary h-12 rounded-lg justify-center items-center active:opacity-80 disabled:bg-primary/60"
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-quicksand-bold text-base">Guardar Cambios</Text>
                            )}
                        </Pressable>
                    </View>
                    {showDatePicker && (
                        <DateTimePicker
                            value={datePickerTarget === 'start' ? startTime : endTime}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            minimumDate={new Date()} // No se pueden seleccionar fechas pasadas
                        />
                    )}
                </ScrollView>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};

export default EditRaffleScreen;