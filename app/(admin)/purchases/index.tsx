import { getStatusBadge } from '@/constants/status';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { formatUtcToLocal } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { Authenticated, usePaginatedQuery, useQuery } from 'convex/react';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PurchaseWithDetails = Doc<'purchases'> & {
  raffleTitle: string;
  userFirstName: string;
  userLastName: string;
  userEmail?: string;
};


const PurchaseListItem = ({ purchase }: { purchase: PurchaseWithDetails }) => {
  const purchaseDate = formatUtcToLocal(purchase._creationTime, "d MMM, yyyy 'a las' h:mm a");
  const formattedAmount = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(purchase.totalAmount);

  return (
    <Link href={`./purchases/${purchase._id}`} asChild>
      <Pressable className="bg-white p-4 border-b border-slate-200 flex-row items-center space-x-4">
        <View className="flex-1">
          <View className="flex-row justify-between items-start">
            <Text className="text-base font-quicksand-bold text-slate-800 flex-1" numberOfLines={1}>{purchase.raffleTitle}</Text>
            {getStatusBadge(purchase.status)}
          </View>
          <Text className="text-sm font-quicksand-medium text-slate-600 mt-1">
            {purchase.userFirstName} {purchase.userLastName}
          </Text>
          <Text className="text-xs font-quicksand-regular text-slate-500">
            {purchase.userEmail}
          </Text>
          <View className="flex-row justify-between items-end mt-2">
            <Text className="text-sm font-quicksand-medium text-slate-500">
              {purchase.ticketCount} boletos - <Text className="font-quicksand-bold">{formattedAmount}</Text>
            </Text>
            <Text className="text-xs font-quicksand-regular text-slate-400">{purchaseDate}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </Pressable>
    </Link>
  )
}


const PurchaseSummary = () => {
  const [filterStatus, setFilterStatus] = useState<Doc<'purchases'>['status'] | null>(null);
  const convexUser = useQuery(api.users.getCurrent);

  const filterOptions: { label: string; value: Doc<'purchases'>['status'] | null }[] = [
    { label: 'Todas', value: null },
    { label: 'Pendientes de Confirmación', value: 'pending_confirmation' },
    { label: 'Pendientes de Pago', value: 'pending_payment' },
    { label: 'Completadas', value: 'completed' },
    { label: 'Expiradas', value: 'expired' },
  ];

  const {
    results: purchases,
    status,
    loadMore,
    isLoading
  } = usePaginatedQuery(
    api.tickets.getAllPurchasesWithDetails,
    // Si filterStatus es null, pasamos undefined para que Convex lo ignore.
    // Si tiene un valor, lo pasamos como el filtro de estado.
    { status: filterStatus ?? undefined },
    { initialNumItems: 15 }
  );

  if (convexUser === undefined) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  if (convexUser?.userType !== 'admin') {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-slate-50 p-8">
        <Ionicons name="lock-closed-outline" size={64} color="#cbd5e1" />
        <Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">Acceso Denegado</Text>
        <Text className="text-sm font-quicksand-medium text-slate-400 text-center">No tienes permisos para ver esta sección.</Text>
      </SafeAreaView>
    )
  }

  const handleLoadMore = () => {
    if (status === 'CanLoadMore') {
      loadMore(10);
    }
  };

  return (
    <Authenticated>
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <View className="p-2 bg-white border-b border-slate-200">
          <FlatList
            horizontal
            data={filterOptions}
            keyExtractor={(item) => item.label}
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-2 py-1"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setFilterStatus(item.value)}
                className={`px-4 py-2 rounded-full mr-2 ${filterStatus === item.value ? 'bg-primary' : 'bg-slate-100'}`}
              >
                <Text className={`font-quicksand-bold text-sm ${filterStatus === item.value ? 'text-white' : 'text-slate-600'}`}>{item.label}</Text>
              </Pressable>
            )}
          />
        </View>
        <FlatList
          key={filterStatus} // Clave dinámica para resetear la lista (y el scroll) al cambiar de filtro
          data={purchases}
          keyExtractor={(item) => item._id.toString()}
          renderItem={({ item }) => <PurchaseListItem
            purchase={item as PurchaseWithDetails} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.7}
          ListEmptyComponent={
            !isLoading ? (
              <View className="mt-24 items-center justify-center px-8">
                <Ionicons name="receipt-outline" size={64} color="#cbd5e1" />
                <Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">No hay compras</Text>
                <Text className="text-sm font-quicksand-medium text-slate-400 text-center">Cuando los usuarios reserven o compren boletos, sus compras aparecerán aquí.</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            status === 'LoadingMore' ? <ActivityIndicator className="my-8" color="#4f46e5" /> : null
          }
        />
      </SafeAreaView>
    </Authenticated>
  )
}

export default PurchaseSummary