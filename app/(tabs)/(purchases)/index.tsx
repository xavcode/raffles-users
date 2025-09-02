import PurchaseListItemSkeleton from '@/app/components/skeletons/PurchaseListItemSkeleton';
import { PURCHASE_STATUS_STYLES } from '@/constants/status';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { formatUtcToLocal } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobalHeader from '../../components/GlobalHeader';


type PurchaseWithDetails = Doc<'purchases'> & { raffleTitle: string, creatorUserName: string, rejectionReason?: string };

const PurchaseListItem = ({ purchase }: { purchase: PurchaseWithDetails }) => {
  const statusStyle = PURCHASE_STATUS_STYLES[purchase.status as keyof typeof PURCHASE_STATUS_STYLES] || PURCHASE_STATUS_STYLES.expired;
  const purchaseDate = formatUtcToLocal(purchase._creationTime, "d MMM, yyyy 'a las' h:mm a");
  const formattedAmount = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(purchase.totalAmount);
  console.log(purchase)

  const isRejected = purchase.status === 'rejected'; // Variable para la condición

  return (
    <Link href={`./(purchases)/${purchase._id.toString()}`} asChild>
      <Pressable className="bg-white mx-4 mb-3 rounded-2xl shadow-sm shadow-slate-200/60 overflow-hidden active:opacity-70">
        <View className="p-4">
          {/* Header: Title and Status */}
          <View className="flex-row justify-between items-start mb-4">
            <Text className="text-base font-quicksand-bold text-slate-800 flex-1 mr-2" numberOfLines={2}>
              {purchase.raffleTitle}
            </Text>
            <View className={`flex-row items-center px-2.5 py-1 rounded-full ${statusStyle.bg}`}>
              <Ionicons name={statusStyle.icon} size={14} color={statusStyle.iconColor} />
              <Text className={`ml-1.5 text-xs font-quicksand-bold ${statusStyle.text}`}>{statusStyle.label}</Text>
            </View>
          </View>

          {/* Body: Details */}
          <View>
            {/* Seller Info */}
            <View className="flex-row items-center mb-3">
              <Text className="text-sm font-quicksand-medium text-slate-500 mr-2">Vendido por:</Text>
              <Text className="text-sm font-quicksand-bold text-slate-700 uppercase">{purchase.creatorUserName}</Text>
            </View>

            {/* Purchase Details */}
            <View className="flex-row items-center">
              <View className="flex-row items-center">
                <Ionicons name="cash-outline" size={16} color="#475569" />
                <Text className="text-sm font-quicksand-bold text-primary ml-1.5">{formattedAmount}</Text>
              </View>
              <View className="w-px h-4 bg-slate-200 mx-3" />
              <View className="flex-row items-center">
                <Ionicons name="ticket-outline" size={16} color="#475569" />
                <Text className="text-sm font-quicksand-semibold text-slate-600 ml-1.5">{purchase.ticketCount} Boletos</Text>
              </View>
            </View>
            {isRejected && purchase.rejectionReason && (
              <View className="mt-3 p-2 border-t border-red-100 bg-red-50 rounded-lg">
                <Text className="text-xs font-quicksand-bold text-red-700">Razón de rechazo:</Text>
                <Text className="text-xs font-quicksand-medium text-red-600 mt-0.5" numberOfLines={2}>{purchase.rejectionReason}</Text>
              </View>
            )}
          </View>
        </View>
        {/* Footer: Date and Chevron */}
        <View className="bg-slate-50/70 px-4 py-2 border-t border-slate-200/80 flex-row justify-between items-center">
          <Text className="text-xs font-quicksand-medium text-slate-500">{purchaseDate}</Text>
          <Ionicons name="chevron-forward-outline" size={18} color="#94a3b8" />
        </View>
      </Pressable>
    </Link>
  );
};

const MyPurchases = () => {
  const convexUser = useQuery(api.users.getCurrent);
  const router = useRouter(); // Declarar useRouter

  const {
    results: userPurchases,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.tickets.getUserPurchasesWithDetails,
    // Solo ejecutamos la query si tenemos el ID del usuario
    convexUser ? { userId: convexUser._id } : 'skip',
    // Opciones de paginación: cargamos 10 items al inicio
    { initialNumItems: 10 }
  );

  // Estado de carga (mientras se obtiene el usuario o las compras iniciales)
  if (convexUser === undefined || (convexUser && status === 'LoadingFirstPage')) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <GlobalHeader />
        <View className="pt-4">
          <PurchaseListItemSkeleton />
          <PurchaseListItemSkeleton />
          <PurchaseListItemSkeleton />

        </View>
      </SafeAreaView>
    );
  }

  // Estado cuando el usuario no está autenticado
  if (convexUser === null) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <GlobalHeader />
        {/* Contenido de fallback para usuarios no autenticados, sin el prop 'fallback' */}
        <View className="flex-1 justify-center items-center px-8">
          <Ionicons name="lock-closed-outline" size={64} color="#cbd5e1" />
          <Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">Inicia sesión para ver tus compras</Text>
          <Text className="text-sm font-quicksand-medium text-slate-400 text-center mt-1 mb-6">Aquí encontrarás el historial de todos los boletos que has reservado y comprado.</Text>
          <Pressable onPress={() => router.push('/(auth)/sign-in')} className="bg-primary px-8 py-3 rounded-lg active:opacity-80">
            <Text className="text-white font-quicksand-bold text-base">Iniciar Sesión</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <GlobalHeader />
      <FlatList
        data={userPurchases}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }) => <PurchaseListItem purchase={item} />} contentContainerClassName="pt-4 pb-8"
        onEndReached={() => {
          // Cuando el usuario llega al final, si podemos cargar más, lo hacemos.
          if (status === 'CanLoadMore') {
            loadMore(5); // Cargamos los siguientes 5 items
          }
        }}
        onEndReachedThreshold={0.8} // Llama a onEndReached cuando el final está a media pantalla de distancia
        ListEmptyComponent={
          <View className="mt-24 items-center justify-center px-8">
            <Ionicons name="receipt-outline" size={64} color="#cbd5e1" />
            <Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">No tienes compras</Text>
            <Text className="text-sm font-quicksand-medium text-slate-400 text-center">Cuando reserves o compres boletos, tus compras aparecerán aquí.</Text>
          </View>}
        ListFooterComponent={() => {
          // Muestra un indicador de carga en el pie de la lista mientras se cargan más items
          if (status === 'LoadingMore') { return <ActivityIndicator className="my-8" color="#4f46e5" />; }
          return null;
        }} />
    </SafeAreaView>
  );
};

export default MyPurchases;