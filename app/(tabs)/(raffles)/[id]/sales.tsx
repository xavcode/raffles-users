import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { formatCOP } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PurchaseWithUser = Doc<'purchases'> & {
  imageUrl?: string; // Asegúrate que imageUrl es parte del documento de compra
  user: { firstName: string; lastName: string; phone?: string; email?: string } | null;
};

const PurchaseItemSkeleton = () => (
  <View className="bg-white p-4 rounded-xl mb-3 shadow-sm shadow-slate-300/50 space-y-3">
    <View className="flex-row justify-between items-center">
      <View className="flex-1 space-y-1.5">
        <View className="h-5 w-3/4 bg-slate-200 rounded" />
        <View className="h-4 w-1/2 bg-slate-200 rounded" />
      </View>
      <View className="h-6 w-1/4 bg-slate-200 rounded" />
    </View>
    <View className="space-y-2">
      <View className="h-3 w-1/4 bg-slate-200 rounded" />
      <View className="h-8 w-full bg-slate-200 rounded-lg" />
    </View>
    <View className="border-t border-slate-100 pt-3">
      <View className="h-3 w-1/3 bg-slate-200 rounded" />
    </View>
  </View>
);

const PurchaseItem = ({ item }: { item: PurchaseWithUser }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const canShowInvoice = item.imageUrl && item.imageUrl.length > 0;

  const purchaseId = item._id

  const purchaseDetails = useQuery(
    api.tickets.getPurchaseDetails,
    purchaseId ? { purchaseId: purchaseId as Id<'purchases'> } : 'skip'

  );
  if (purchaseDetails === undefined || purchaseDetails === null) {
    return <PurchaseItemSkeleton />
  }
  const { tickets } = purchaseDetails;

  return (
    <View className="bg-white p-4 rounded-xl mb-3 shadow-sm shadow-slate-300/50">
      {/* Top section: User and Amount */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 pr-4">
          <Text className="text-base font-quicksand-bold text-slate-800" numberOfLines={1}>
            {item.user?.firstName ?? 'Usuario Anónimo'} {item.user?.lastName}
          </Text>
          <Text className="text-sm font-quicksand-medium text-slate-500" numberOfLines={1}>
            {item.user?.phone || 'Sin telefono '}
          </Text>
        </View>
        <Text className="text-lg font-quicksand-bold text-primary">{formatCOP(item.totalAmount)}</Text>
      </View>

      {/* Middle section: Tickets */}
      <View className="mb-4">
        <Text className="text-xs font-quicksand-semibold text-slate-400 mb-2 uppercase tracking-wider">Boletos ({tickets.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-x-2 py-1">
          {tickets.map((ticket) => (
            <View key={ticket.ticketNumber} className="bg-indigo-50 border border-indigo-200/80 rounded-full h-8 px-3 flex-row items-center justify-center">
              <Ionicons name="ticket-outline" size={14} color="#4f46e5" />
              <Text className="text-sm font-quicksand-bold text-indigo-700 ml-1.5">{String(ticket.ticketNumber).padStart(3, '0')}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Footer section: Date and Invoice */}
      <View className="border-t border-slate-100 pt-3 flex-row justify-between items-center">
        <Text className="text-xs text-slate-400 font-quicksand-medium">
          {format(new Date(item._creationTime), "d 'de' MMMM, yyyy", { locale: es })}
        </Text>
        {canShowInvoice && (
          <Pressable
            className="bg-slate-100 py-1.5 px-3 rounded-md shadow-sm shadow-slate-300/50 active:opacity-70"
            onPress={() => setModalVisible(true)}
          >
            <Text className="text-xs text-slate-500 font-quicksand-semibold">
              Ver comprobante
            </Text>
          </Pressable>
        )}
      </View>

      {canShowInvoice && (
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 bg-black/80 justify-center items-center p-4">
            <Image
              source={{ uri: item.imageUrl! }}
              className="w-full h-full"
              resizeMode="contain"
            />
            <Pressable
              className="absolute top-12 right-4 bg-black/60 p-2 rounded-full active:bg-black/80"
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="white" />
            </Pressable>
          </View>
        </Modal>
      )}
    </View>
  );
}

const RaffleSalesPage = () => {
  const { id: raffleId } = useLocalSearchParams<{ id: string }>();

  const purchases = useQuery(
    api.raffles.getPurchasesForRaffle,
    raffleId ? { raffleId: raffleId as Id<'raffles'> } : 'skip'
  );

  if (purchases === undefined || purchases === null) {
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
