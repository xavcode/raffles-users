import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput } from 'react-native';

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
        <ScrollView className="flex-1 bg-neutral-50" contentContainerClassName="p-5">
            <Stack.Screen options={{ title: 'Crear Sorteo' }} />
            <Text className="text-2xl font-quicksand-bold mb-6 text-center text-neutral-800">Nuevo Sorteo</Text>

            <TextInput className="bg-white h-12 border border-neutral-300 rounded-lg mb-4 px-4 text-base" placeholder="Título del Sorteo" value={title} onChangeText={setTitle} />
            <TextInput className="bg-white h-24 border border-neutral-300 rounded-lg mb-4 px-4 text-base align-top" placeholder="Descripción" value={description} onChangeText={setDescription} multiline />
            <TextInput className="bg-white h-12 border border-neutral-300 rounded-lg mb-4 px-4 text-base" placeholder="Premio (ej: 1000000)" value={prize} onChangeText={setPrize} keyboardType="numeric" />
            <TextInput className="bg-white h-12 border border-neutral-300 rounded-lg mb-4 px-4 text-base" placeholder="URL de la imagen del premio" value={imageUrl} onChangeText={setImageUrl} keyboardType="url" autoCapitalize="none" />
            <TextInput className="bg-white h-12 border border-neutral-300 rounded-lg mb-4 px-4 text-base" placeholder="Número total de boletos" value={totalTickets} onChangeText={setTotalTickets} keyboardType="numeric" />
            <TextInput className="bg-white h-12 border border-neutral-300 rounded-lg mb-4 px-4 text-base" placeholder="Precio del boleto (ej: 10.50)" value={ticketPrice} onChangeText={setTicketPrice} keyboardType="decimal-pad" />

            {isLoading ? (
                <ActivityIndicator size="large" color="#4f46e5" />
            ) : (
                <Pressable className="bg-secondary h-12 rounded-lg justify-center items-center active:bg-secondary-dark" onPress={handleCreateRaffle}>
                    <Text className="text-white font-quicksand-bold text-base">Crear Sorteo</Text>
                </Pressable>
            )}
        </ScrollView >
    );
};

export default CreateRafflePage;