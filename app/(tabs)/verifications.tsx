import { getStatusBadge } from '@/constants/status';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { formatUtcToLocal } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { usePaginatedQuery } from 'convex/react';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define el tipo para la compra con detalles adicionales
type PurchaseWithDetails = Doc<'purchases'> & {
  raffleTitle: string;
  userFirstName: string;
  userLastName: string
  UserName?: string;
};

const LOADING_FIRST_PAGE = 'LoadingFirstPage';

const VerificationCard = ({ item }: { item: PurchaseWithDetails }) => {
  const timeAgo = formatUtcToLocal(item._creationTime, "d 'de' MMMM, yyyy ' - ' h:mm a");

  const formattedAmount = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.totalAmount);

  const [modalVisible, setModalVisible] = useState(false);
  const canShowInvoice = item.imageUrl && item.imageUrl.length > 0;

  return (
    <View className="bg-white rounded-2xl shadow-sm shadow-slate-300/50 mb-4 overflow-hidden">
      {/* --- Sección de Información --- */}
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-xs text-slate-400 font-quicksand-medium">Sorteo</Text>
            <Text className="text-base font-quicksand-bold text-slate-800" numberOfLines={1}>{item.raffleTitle}</Text>
          </View>
          {getStatusBadge(item.status)}
        </View>
        <View className="border-t border-slate-100 pt-3">
          <View className="flex-row items-center mb-3">
            <Ionicons name="person-circle-outline" size={18} color="#64748b" />
            <Text className="text-sm font-quicksand-semibold text-slate-600 ml-1.5">{item.userFirstName} {item.userLastName}</Text>
          </View>
          <View className="flex-row justify-between items-end">
            <View>
              <Text className="text-xs text-slate-400 font-quicksand-medium ">Monto de la compra</Text>
              <Text className="text-sm font-quicksand-bold text-primary ml-1.5">{formattedAmount} ({item.ticketCount} boletos)</Text>
            </View>
            <Text className="text-xs font-quicksand-medium text-slate-400">{timeAgo}</Text>
          </View>
        </View>
      </View>

      {/* --- Sección de Acciones --- */}
      {canShowInvoice && (
        <View className="border-t border-slate-100 bg-slate-50/80 px-4 py-3">
          <Pressable className="bg-indigo-100 self-start flex-row items-center rounded-full px-4 py-2 active:bg-indigo-200" onPress={() => setModalVisible(true)}>
            <Ionicons name="receipt-outline" size={16} color="#4f46e5" />
            <Text className="text-indigo-600 font-quicksand-bold text-sm ml-2">Ver Comprobante</Text>
          </Pressable>
        </View>
      )}

      {/* --- Modal para ver la imagen --- */}
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