import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Raffle = Doc<'raffles'> & { userName: string }; // Incluimos userName del creador

export default function AdminRafflesScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string | undefined>(undefined);

    // Implementar un debounce simple para la búsqueda
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const raffles = useQuery(api.raffles.getRafflesForAdmin, debouncedSearchQuery ? { search: debouncedSearchQuery } : {});

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
            <Stack.Screen options={{ title: 'Gestión de Rifas' }} />
            <View className="p-4 flex-1">
                <Text className="text-lg font-quicksand-bold text-slate-800 mb-4">Lista de Rifas</Text>

                <TextInput
                    className="bg-white border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium mb-4 shadow-sm shadow-slate-300/50"
                    placeholder="Buscar por título, ID o nombre de creador..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                />

                {raffles === undefined ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#4f46e5" />
                        <Text className="mt-2 text-slate-500">Cargando rifas...</Text>
                    </View>
                ) : raffles.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <Ionicons name="list-outline" size={48} color="#cbd5e1" />
                        <Text className="text-slate-500 font-quicksand-medium mt-2">No se encontraron rifas.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={raffles}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <Pressable
                                className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-300/50 mb-3"
                                onPress={() => router.push(`/(tabs)/(home)/${item._id}`)}
                            >
                                <View className="flex-row items-center mb-2">
                                    <Image
                                        source={{ uri: item.imageUrl }}
                                        className="w-16 h-16 rounded-lg mr-4"
                                        resizeMode="cover"
                                    />
                                    <View className="flex-1">
                                        <Text className="text-base font-quicksand-bold text-slate-800" numberOfLines={1}>{item.title}</Text>
                                        <Text className="text-sm text-slate-500" numberOfLines={1}>Por: {item.userName}</Text>
                                        <Text className="text-xs text-slate-400 mt-1">Estado: {item.status}</Text>
                                    </View>
                                </View>
                                <View className="flex-row justify-between items-center mt-2">
                                    <Text className="text-sm font-quicksand-semibold text-slate-700">Boletos vendidos: {item.ticketsSold}/{item.totalTickets}</Text>
                                    <Text className="text-sm font-quicksand-semibold text-primary">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.ticketPrice * (item.ticketsSold ?? 0))}</Text>
                                </View>
                                {/* Aquí no se añade ninguna funcionalidad de edición, solo visualización */}
                            </Pressable>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
