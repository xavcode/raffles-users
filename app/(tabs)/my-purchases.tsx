import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const purchaseDate = format(new Date(purchase._creationTime), "d 'de' MMMM, yyyy 'a las' h:mm a", { locale: es });
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
  const userPurchases = useQuery(
    api.tickets.getUserPurchasesWithDetails,
    convexUser ? { userId: convexUser._id } : 'skip'
  );

  if (convexUser === undefined || userPurchases === undefined) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Stack.Screen options={{ headerTitle: 'Mis Compras', headerLargeTitle: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#f8fafc' }, headerTitleStyle: { fontFamily: 'Quicksand-Bold' } }} />
      <FlatList data={userPurchases} keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }) => <PurchaseListItem purchase={item} />} contentContainerClassName="pt-4 pb-8"
        ListEmptyComponent={<View className="mt-24 items-center justify-center px-8">
          <Ionicons name="receipt-outline" size={64} color="#cbd5e1" />
          <Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">No tienes compras</Text>
          <Text className="text-sm font-quicksand-medium text-slate-400 text-center">Cuando reserves o compres boletos, tus compras aparecerán aquí.</Text>
        </View>} />
    </SafeAreaView>
  );
};

export default MyPurchases;