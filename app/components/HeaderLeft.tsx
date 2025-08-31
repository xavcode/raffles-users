import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { api } from '../../convex/_generated/api';
import { Doc } from '../../convex/_generated/dataModel';

type HeaderLeftProps = {
    raffle: Doc<"raffles">;
};

const HeaderLeft = ({ raffle }: HeaderLeftProps) => {
    const router = useRouter();
    const deleteRaffle = useMutation(api.raffles.deleteRaffle);

    const handleDelete = () => {
        Alert.alert(
            "Eliminar Sorteo",
            "¿Estás seguro de que quieres eliminar este sorteo?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    onPress: async () => {
                        try {
                            // Tu mutación `deleteRaffle` ya verifica si el usuario es el creador
                            await deleteRaffle({ id: raffle._id });
                            Alert.alert("Éxito", "El sorteo ha sido eliminado correctamente.");
                            router.replace('/(tabs)/(home)');
                        } catch (error) {
                            // Muestra el error de la mutación (ej: "No tienes permisos", "Tiene boletos vendidos")
                            Alert.alert("Error al eliminar", (error as Error).message);
                        }
                    },
                    style: "destructive",
                },
            ]
        );
    };

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, marginRight: 5 }}>
            <Link href={`/(raffles)/edit/${raffle._id}`} asChild>
                <Pressable>
                    <Ionicons name="pencil-outline" size={24} color="#4f46e5" />
                </Pressable>
            </Link>

            <Pressable onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
            </Pressable>
        </View>
    )
}

export default HeaderLeft