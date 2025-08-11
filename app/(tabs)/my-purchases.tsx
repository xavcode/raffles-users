import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { formatUtcToLocal } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { Link, router, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobalHeader from '../components/GlobalHeader';

// Helper para el estado de la compra
const PURCHASE_STATUS_STYLES = {
  pending_payment: {
    label: 'Pendiente',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    icon: 'time-outline' as const,
  },
  pending_confirmation: {
    label: 'Pendiente',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    icon: 'time-outline' as const,
  },
  completed: {
    label: 'Pagado',
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: 'checkmark-circle-outline' as const,
  },
  expired: {
    label: 'Expirado',
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: 'close-circle-outline' as const,
  }
};

type PurchaseWithDetails = Doc<'purchases'> & { raffleTitle: string };

const PurchaseListItem = ({ purchase }: { purchase: PurchaseWithDetails }) => {
  const statusStyle = PURCHASE_STATUS_STYLES[purchase.status as keyof typeof PURCHASE_STATUS_STYLES];
  const purchaseDate = formatUtcToLocal(purchase._creationTime, "d 'de' MMMM, yyyy 'a las' h:mm a");
  const formattedAmount = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(purchase.totalAmount);

  return (
    <Link href={`/purchase/${purchase._id}`} asChild>
      <TouchableOpacity activeOpacity={0.7}>
        <View className="bg-white mx-4 mb-4 p-4 rounded-2xl shadow-sm shadow-slate-300/50">
          <View className="flex-row justify-between items-start">
            <Text className="text-base font-quicksand-bold text-slate-800 w-8/12" numberOfLines={2}>
              {purchase.raffleTitle}
            </Text>
            <View className={`flex-row items-center px-2.5 py-1 rounded-full ${statusStyle.bg}`}>
              <Ionicons name={statusStyle.icon} size={14} color={statusStyle.text.replace('text-', '')} />
              <Text className={`ml-1 text-xs font-quicksand-bold ${statusStyle.text}`}>{statusStyle.label}</Text>
            </View>
          </View>
          <View className="mt-4 border-t border-slate-100 pt-3">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-sm font-quicksand-medium text-slate-500">Boletos</Text>
              <Text className="text-sm font-quicksand-semibold text-slate-700">{purchase.ticketCount}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-quicksand-medium text-slate-500">Total</Text>
              <Text className="text-sm font-quicksand-bold text-primary">{formattedAmount}</Text>
            </View>
            <Text className="text-xs font-quicksand-medium text-slate-400 text-right">{purchaseDate}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

const MyPurchases = () => {
  const convexUser = useQuery(api.users.getCurrent);
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
        <Stack.Screen options={{ headerTitle: 'Mis Compras', headerLargeTitle: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#f8fafc' }, headerTitleStyle: { fontFamily: 'Quicksand-Bold' } }} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      </SafeAreaView>
    );
  }

  // Estado cuando el usuario no está autenticado
  if (convexUser === null) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <Stack.Screen options={{ headerTitle: 'Mis Compras', headerLargeTitle: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#f8fafc' }, headerTitleStyle: { fontFamily: 'Quicksand-Bold' } }} />
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
      <Stack.Screen options={{ headerTitle: 'Mis Compras', headerLargeTitle: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#f8fafc' }, headerTitleStyle: { fontFamily: 'Quicksand-Bold' } }} />
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
        onEndReachedThreshold={0.5} // Llama a onEndReached cuando el final está a media pantalla de distancia
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