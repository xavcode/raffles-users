import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
    const [imageUrl, setImageUrl] = useState('');

    const handleCreateRaffle = async () => {
        if (!title || !description || !totalTickets || !ticketPrice || !prize || !imageUrl) {
            Alert.alert('Error', 'Por favor, completa todos los campos.');
            return;
        }

        setIsLoading(true);
        try {
            let prizeNumber = parseFloat(prize);
            await createRaffle({
                title,
                description,
                prize: prizeNumber,
                imageUrl,
                totalTickets: parseInt(totalTickets, 10),
                ticketPrice: parseFloat(ticketPrice),
                // Usamos timestamps para las fechas. Aquí un ejemplo simple.
                // En una app real, podrías usar un componente de selección de fecha (Date Picker).
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
            <ScrollView contentContainerClassName="p-4">
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
                        <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">URL de la Imagen del Premio</Text>
                        <TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="https://ejemplo.com/imagen.png" value={imageUrl} onChangeText={setImageUrl} keyboardType="url" autoCapitalize="none" />
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
            </ScrollView>
        </SafeAreaView>
    );
};

export default CreateRafflePage;