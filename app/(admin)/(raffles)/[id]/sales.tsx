import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { formatCOP } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PurchaseWithUser = Doc<'purchases'> & {
  user: { firstName: string; email?: string } | null;
};

const PurchaseItem = ({ item }: { item: PurchaseWithUser }) => (
  <Link href={`/(admin)/purchases/${item._id}`} asChild>
    <Pressable className="bg-white p-4 rounded-xl mb-3 shadow-sm shadow-slate-300/50 active:opacity-70">
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-base font-quicksand-bold text-slate-800" numberOfLines={1}>
            {item.user?.firstName ?? 'Usuario Anónimo'}
          </Text>
          <Text className="text-sm font-quicksand-medium text-slate-500" numberOfLines={1}>
            {item.user?.email}
          </Text>
        </View>
        <View className="items-end ml-2">
          <Text className="text-base font-quicksand-bold text-primary">{formatCOP(item.totalAmount)}</Text>
          <Text className="text-xs font-quicksand-medium text-slate-400">{item.ticketCount} boletos</Text>
        </View>
      </View>
      <View className="border-t border-slate-100 mt-3 pt-2">
        <Text className="text-xs text-slate-400 font-quicksand-medium">
          {format(new Date(item._creationTime), "d 'de' MMMM, yyyy", { locale: es })}
        </Text>
      </View>
    </Pressable>
  </Link>
);

const RaffleSalesPage = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  const purchases = useQuery(api.raffles.getPurchasesForRaffle, {
    raffleId: id as Id<'raffles'>,
  });

  if (purchases === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ title: 'Historial de Ventas' }} />
      <FlatList
        data={purchases}
        renderItem={({ item }) => <PurchaseItem item={item} />}
        keyExtractor={(item) => item._id}
        contentContainerClassName="p-4"
        ListEmptyComponent={() => (
          <View className="mt-24 items-center justify-center p-4 bg-white mx-4 rounded-2xl">
            <Ionicons name="receipt-outline" size={54} color="#cbd5e1" />
            <Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">Sin ventas completadas</Text>
            <Text className="text-sm font-quicksand-medium text-slate-400 text-center">Aún no hay compras aprobadas para este sorteo.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default RaffleSalesPage;
