import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { formatUtcToLocal } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { usePaginatedQuery } from 'convex/react';
import { Link, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define el tipo para la compra con detalles adicionales
type PurchaseWithDetails = Doc<'purchases'> & {
  raffleTitle: string;
  userFirstName: string;
};

const LOADING_FIRST_PAGE = 'LoadingFirstPage';

const VerificationCard = ({ item }: { item: PurchaseWithDetails }) => {
  const timeAgo = formatUtcToLocal(item._creationTime, "d 'de' MMMM, yyyy 'a las' h:mm a");

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
  const {
    results: pendingPurchases,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.tickets.getPendingConfirmationPurchases,
    {}, // Argumentos de la query (vacío en este caso)
    { initialNumItems: 10 } // Opciones de paginación
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ title: 'Verificaciones', }} />
      {status === LOADING_FIRST_PAGE && (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#4f46e5" /></View>
      )}
      {status !== LOADING_FIRST_PAGE && (
        <FlatList
          data={pendingPurchases}
          renderItem={({ item }) => <VerificationCard item={item} />}
          keyExtractor={(item) => item._id}
          contentContainerClassName="p-4"
          onEndReached={() => {
            if (status === 'CanLoadMore') {
              loadMore(10); // Carga los siguientes 10
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View className="mt-24 items-center justify-center p-4"><Ionicons name="shield-checkmark-outline" size={64} color="#cbd5e1" /><Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">Todo en orden</Text><Text className="text-sm font-quicksand-medium text-slate-400 text-center">No hay pagos pendientes de verificación en este momento.</Text></View>
          }
          ListFooterComponent={() => {
            if (status === 'LoadingMore') { return <ActivityIndicator className="my-8" color="#4f46e5" />; }
            return null;
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default VerificationsPage;