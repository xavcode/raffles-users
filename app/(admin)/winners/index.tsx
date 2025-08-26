import { api } from '@/convex/_generated/api';
import { formatCOP } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const WinnerCard = ({ item }: { item: any }) => (
    <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-300/50 mb-4">
        <Text className="text-base font-quicksand-bold text-slate-800 mb-2" numberOfLines={2}>{item.raffleTitle}</Text>
        <View className="border-t border-slate-100 pt-3 space-y-2">
            <View className="flex-row justify-between items-center">
                <Text className="font-quicksand-medium text-slate-500">Ganador:</Text>
                <Text className="font-quicksand-bold text-slate-800">{item.winnerName}</Text>
            </View>
            <View className="flex-row justify-between items-center">
                <Text className="font-quicksand-medium text-slate-500">Boleto:</Text>
                <View className="bg-primary/10 px-3 py-1 rounded-full">
                    <Text className="font-quicksand-bold text-primary text-lg">#{item.winningTicketNumber}</Text>
                </View>
            </View>
            <View className="flex-row justify-between items-center">
                <Text className="font-quicksand-medium text-slate-500">Premio:</Text>
                <Text className="font-quicksand-bold text-green-600">{formatCOP(item.rafflePrize ?? 0)}</Text>
            </View>
            <View className="flex-row justify-between items-center">
                <Text className="font-quicksand-medium text-slate-500">Fecha Finalización:</Text>
                <Text className="font-quicksand-semibold text-slate-600">{format(new Date(item.finishedAt), "d MMM, yyyy", { locale: es })}</Text>
            </View>
        </View>
    </View>
);

const WinnersPage = () => {
    const winnersData = useQuery(api.raffles.getFinishedRafflesWithWinners);

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
            <Stack.Screen options={{ title: 'Historial de Ganadores' }} />

            {winnersData === undefined && (
                <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#4f46e5" /></View>
            )}

            {winnersData && (
                <FlatList
                    data={winnersData}
                    keyExtractor={(item) => item.raffleId}
                    renderItem={({ item }) => <WinnerCard item={item} />}
                    contentContainerClassName="p-4"
                    ListEmptyComponent={() => (
                        <View className="mt-24 items-center justify-center p-4 bg-slate-100 mx-4 rounded-2xl"><Ionicons name="trophy-outline" size={64} color="#cbd5e1" /><Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">Sin Ganadores</Text><Text className="text-sm font-quicksand-medium text-slate-400 text-center">Aún no hay sorteos finalizados con un ganador asignado.</Text></View>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

export default WinnersPage;