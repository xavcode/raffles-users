import { useMutation, useQuery } from 'convex/react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

const EditRaffleScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    // 1. Obtener los datos de la rifa actual usando el ID de la URL
    const raffleId = id as Id<"raffles">;
    const raffleData = useQuery(api.raffles.getById, { id: raffleId });

    // 2. Definir la mutación para actualizar la rifa
    const updateRaffle = useMutation(api.raffles.updateRaffle);

    // 3. Estado local para manejar el formulario y la carga
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        ticketPrice: '',
        totalTickets: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    // 4. Cuando los datos de la rifa se cargan desde Convex, rellenar el formulario
    useEffect(() => {
        if (raffleData) {
            setFormData({
                title: raffleData.title,
                description: raffleData.description,
                ticketPrice: raffleData.ticketPrice.toString(),
                totalTickets: raffleData.totalTickets.toString(),
            });
        }
    }, [raffleData]);

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!raffleData) return;

        // Validación simple
        if (!formData.title || !formData.description || !formData.ticketPrice || !formData.totalTickets) {
            Alert.alert("Error", "Todos los campos son obligatorios.");
            return;
        }

        setIsLoading(true);
        try {
            await updateRaffle({
                id: raffleData._id,
                title: formData.title,
                description: formData.description,
                ticketPrice: parseFloat(formData.ticketPrice),
                totalTickets: parseInt(formData.totalTickets, 10),
                // Asegúrate de pasar los campos obligatorios que no se editan
                winCondition: raffleData.winCondition as string,
                startTime: raffleData.startTime,
                endTime: raffleData.endTime,
            });

            Alert.alert("Éxito", "La rifa ha sido actualizada correctamente.");
            router.back(); // Volver a la pantalla de detalles

        } catch (error) {
            Alert.alert("Error al actualizar", (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    // Estado de carga mientras se obtienen los datos iniciales
    if (raffleData === undefined) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text>Cargando datos de la rifa...</Text>
            </View>
        );
    }

    // Si la rifa no se encuentra
    if (raffleData === null) {
        return (
            <View style={styles.centered}>
                <Text>No se encontró la rifa.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: 'Editar Rifa' }} />

            <Text style={styles.label}>Título</Text>
            <TextInput style={styles.input} value={formData.title} onChangeText={(val) => handleInputChange('title', val)} />

            <Text style={styles.label}>Descripción</Text>
            <TextInput style={styles.input} multiline value={formData.description} onChangeText={(val) => handleInputChange('description', val)} />

            <Text style={styles.label}>Precio del Boleto</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={formData.ticketPrice} onChangeText={(val) => handleInputChange('ticketPrice', val)} />

            <Text style={styles.label}>Total de Boletos</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={formData.totalTickets} onChangeText={(val) => handleInputChange('totalTickets', val)} />

            <View style={{ marginTop: 20 }}>
                <Button title={isLoading ? "Guardando..." : "Guardar Cambios"} onPress={handleSubmit} disabled={isLoading} color="#4f46e5" />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
});

export default EditRaffleScreen;