import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type User = Doc<'users'>;

export default function AdminUsersScreen() {
    const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string | undefined>(undefined);

    // Implementar un debounce simple para la búsqueda
    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const users = useQuery(api.users.getUsersForAdmin, debouncedSearchQuery ? { search: debouncedSearchQuery } : {});

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
            <Stack.Screen options={{ title: 'Gestión de Usuarios' }} />
            <View className="p-4 flex-1">
                <Text className="text-lg font-quicksand-bold text-slate-800 mb-4">Lista de Usuarios</Text>

                <TextInput
                    className="bg-white border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium mb-4 shadow-sm shadow-slate-300/50"
                    placeholder="Buscar por nombre de usuario o email..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                />

                {users === undefined ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#4f46e5" />
                        <Text className="mt-2 text-slate-500">Cargando usuarios...</Text>
                    </View>
                ) : users.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                        <Text className="text-slate-500 font-quicksand-medium mt-2">No se encontraron usuarios.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-300/50 mb-3 flex-row items-center justify-between">
                                <View className="flex-1 mr-4">
                                    <Text className="text-base font-quicksand-bold text-slate-800" numberOfLines={1}>{item.userName}</Text>
                                    {item.email && <Text className="text-sm text-slate-500" numberOfLines={1}>{item.email}</Text>}
                                    <Text className="text-xs text-slate-400 mt-1">Rol: {item.userType}</Text>
                                </View>
                                {/* Aquí no se añade ninguna funcionalidad de edición, solo visualización */}
                            </View>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
