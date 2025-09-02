import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Doc } from '../../convex/_generated/dataModel';

type HeaderLeftProps = {
    raffle: Doc<"raffles">;
    onDeleteRequest: () => void; // Nuevo prop para manejar la solicitud de eliminación
};

const HeaderLeft = ({ raffle, onDeleteRequest }: HeaderLeftProps) => {
    const router = useRouter();
    // La mutación deleteRaffle ahora se llamará desde el modal de confirmación en el padre
    // const deleteRaffle = useMutation(api.raffles.deleteRaffle);

    // El manejador handleDelete ahora simplemente invoca el callback del padre
    const handleDelete = () => {
        onDeleteRequest();
    };

    // Comentamos la antigua lógica de Alert.alert
    // Alert.alert(
    //     "Eliminar Sorteo",
    //     "¿Estás seguro de que quieres eliminar este sorteo?",
    //     [
    //         { text: "Cancelar", style: "cancel" },
    //         {
    //             text: "Eliminar",
    //             onPress: async () => {
    //                 try {
    //                     await deleteRaffle({ id: raffle._id });
    //                     Alert.alert("Éxito", "El sorteo ha sido eliminado correctamente.");
    //                     router.replace('/(tabs)/(home)');
    //                 } catch (error) {
    //                     Alert.alert("Error al eliminar", (error as Error).message);
    //                 }
    //             },
    //             style: "destructive",
    //         },
    //     ]
    // );

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