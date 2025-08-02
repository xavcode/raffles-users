import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define el tipo para la compra con detalles adicionales
type PurchaseWithDetails = Doc<'purchases'> & {
    raffleTitle: string;
    userFirstName: string;
};

const VerificationCard = ({ item }: { item: PurchaseWithDetails }) => {
    const timeAgo = formatDistanceToNow(new Date(item._creationTime), {
        addSuffix: true,
        locale: es,
    });
    const formattedAmount = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.totalAmount);

    return (
        <Link href={`/(admin)/purchases/${item._id}`} asChild>
            <Pressable className="bg-white rounded-2xl shadow-sm shadow-slate-300/50 overflow-hidden mb-4 active:opacity-80">
                <View className="p-4">
                    <View className="flex-row justify-between items-start mb-3">
                        <Text className="text-base font-quicksand-bold text-slate-800 w-8/12" numberOfLines={2}>{item.raffleTitle}</Text>
                        <Text className="text-lg font-quicksand-bold text-primary">{formattedAmount}</Text>
                    </View>
                    <View className="flex-row justify-between items-center border-t border-slate-100 pt-3">
                        <View className="flex-row items-center">
                            <Ionicons name="person-circle-outline" size={18} color="#64748b" />
                            <Text className="text-sm font-quicksand-semibold text-slate-600 ml-1.5">{item.userFirstName}</Text>
                        </View>
                        <Text className="text-xs font-quicksand-medium text-slate-500">{timeAgo}</Text>
                    </View>
                </View>
            </Pressable>
        </Link>
    );
};

const VerificationsPage = () => {
    const pendingPurchases = useQuery(api.tickets.getPendingConfirmationPurchases);

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
            <Stack.Screen options={{ title: 'Verificaciones', }} />
            {pendingPurchases === undefined && (
                <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#4f46e5" /></View>
            )}
            {pendingPurchases && (
                <FlatList
                    data={pendingPurchases}
                    renderItem={({ item }) => <VerificationCard item={item} />}
                    keyExtractor={(item) => item._id}
                    contentContainerClassName="p-4"
                    ListEmptyComponent={
                        <View className="mt-24 items-center justify-center p-4"><Ionicons name="shield-checkmark-outline" size={64} color="#cbd5e1" /><Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">Todo en orden</Text><Text className="text-sm font-quicksand-medium text-slate-400 text-center">No hay pagos pendientes de verificación en este momento.</Text></View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default VerificationsPage;