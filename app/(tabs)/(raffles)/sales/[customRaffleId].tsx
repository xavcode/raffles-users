import { PURCHASE_STATUS_STYLES } from '@/constants/status'; // Importar PURCHASE_STATUS_STYLES
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { formatCOP } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PurchaseWithUser = Doc<'purchases'> & {
  user: { userName: string; phone?: string; email?: string } | null;
  tickets: Doc<'tickets'>[]; // Incluir los tickets directamente
  status: Doc<'purchases'>['status']; // Incluir el estado de la compra
  rejectionReason?: string; // Incluir la razón de rechazo
};

// const PurchaseItemSkeleton = () => (
//   <View className="bg-white p-4 rounded-xl mb-3 shadow-sm shadow-slate-300/50 space-y-3">
//     <View className="flex-row justify-between items-center">
//       <View className="flex-1 space-y-1.5">
//         <View className="h-5 w-3/4 bg-slate-200 rounded" />
//         <View className="h-4 w-1/2 bg-slate-200 rounded" />
//       </View>
//       <View className="h-6 w-1/4 bg-slate-200 rounded" />
//     </View>
//     <View className="space-y-2">
//       <View className="h-3 w-1/4 bg-slate-200 rounded" />
//       <View className="h-8 w-full bg-slate-200 rounded-lg" />
//     </View>
//     <View className="border-t border-slate-100 pt-3">
//       <View className="h-3 w-1/3 bg-slate-200 rounded" />
//     </View>
//   </View>
// );

const PurchaseItem = ({ item }: { item: PurchaseWithUser }) => {

  // Reutilizamos los estilos de estado de PURCHASE_STATUS_STYLES
  const statusStyle = PURCHASE_STATUS_STYLES[item.status as keyof typeof PURCHASE_STATUS_STYLES] || {
    label: 'Desconocido', bg: 'bg-slate-100', text: 'text-slate-700', icon: 'help-circle-outline' as const
  };

  const isRejected = item.status === 'rejected'; // Nueva variable para el string literal

  return (
    <View className="bg-white p-4 rounded-xl mb-3 shadow-sm shadow-slate-300/50">
      {/* Top section: User and Amount */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 pr-4">
          <Text className="text-base font-quicksand-bold text-slate-800" numberOfLines={1}>
            {item.user?.userName ?? 'Usuario Anónimo'}
          </Text>
          <Text className="text-sm font-quicksand-medium text-slate-500" numberOfLines={1}>
            {item.user?.phone || 'Sin telefono '}
          </Text>
        </View>
        <View className="flex-col items-end">
          <Text className="text-lg font-quicksand-bold text-primary mb-1">{formatCOP(item.totalAmount)}</Text>
          <View className={`flex-row items-center px-2 py-0.5 rounded-full ${statusStyle.bg}`}>
            <Ionicons name={statusStyle.icon} size={12} color={statusStyle.text.replace('text-', '')} />
            <Text className={`ml-1 text-xs font-quicksand-bold ${statusStyle.text}`}>{statusStyle.label}</Text>
          </View>
        </View>
      </View>

      {/* Razón de Rechazo (si aplica) */}
      {isRejected && item.rejectionReason && (
        <View className="bg-red-50/80 px-4 py-3 rounded-lg border border-red-100 mb-4">
          <Text className="text-sm font-quicksand-bold text-red-700">Razón de Rechazo:</Text>
          <Text className="text-sm font-quicksand-medium text-red-600 mt-1">{item.rejectionReason}</Text>
        </View>
      )}

      {/* Middle section: Tickets */}
      <View className="mb-4">
        <Text className="text-xs font-quicksand-semibold text-slate-400 mb-2 uppercase tracking-wider">Boletos ({item.tickets.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-x-2 py-1">
          {item.tickets.map((ticket) => (
            <View key={ticket.ticketNumber} className="bg-indigo-50 border border-indigo-200/80 rounded-full h-8 px-3 flex-row items-center justify-center">
              <Ionicons name="ticket-outline" size={14} color="#4f46e5" />
              <Text className="text-sm font-quicksand-bold text-indigo-700 ml-1.5">{String(ticket.ticketNumber).padStart(3, '0')}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Footer section: Date */}
      <View className="border-t border-slate-100 pt-3">
        <Text className="text-xs text-slate-400 font-quicksand-medium">
          {format(new Date(item._creationTime), "d 'de' MMMM, yyyy", { locale: es })}
        </Text>
      </View>
    </View>
  );
}

const PurchaseSummaryItem = ({ item, onPress }: { item: PurchaseWithUser, onPress: () => void }) => {
  const statusStyle = PURCHASE_STATUS_STYLES[item.status as keyof typeof PURCHASE_STATUS_STYLES] || {
    label: 'Desconocido', bg: 'bg-slate-100', text: 'text-slate-700', icon: 'help-circle-outline' as const
  };

  return (
    <Pressable className="bg-white p-4 rounded-xl mb-3 shadow-sm shadow-slate-300/50 active:opacity-70" onPress={onPress}>
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 pr-4">
          <Text className="text-base font-quicksand-bold text-slate-800" numberOfLines={1}>
            {item.user?.userName ?? 'Usuario Anónimo'}
          </Text>
          <Text className="text-sm font-quicksand-medium text-slate-500" numberOfLines={1}>
            {item.user?.phone || 'Sin teléfono'}
          </Text>
        </View>
        <View className="flex-col items-end">
          <Text className="text-lg font-quicksand-bold text-primary mb-1">{formatCOP(item.totalAmount)}</Text>
          <View className={`flex-row items-center px-2 py-0.5 rounded-full ${statusStyle.bg}`}>
            <Ionicons name={statusStyle.icon} size={12} color={statusStyle.text.replace('text-', '')} />
            <Text className={`ml-1 text-xs font-quicksand-bold ${statusStyle.text}`}>{statusStyle.label}</Text>
          </View>
        </View>
      </View>
      <View className="flex-row justify-between items-center">
        <Text className="text-sm font-quicksand-medium text-slate-600">Boletos: {item.tickets.length}</Text>
        <Text className="text-xs text-slate-400 font-quicksand-medium">
          {format(new Date(item._creationTime), "d 'de' MMMM, yyyy", { locale: es })}
        </Text>
      </View>
    </Pressable>
  );
};

const RaffleSalesPage = () => {
  const { customRaffleId } = useLocalSearchParams<{ customRaffleId: string }>();
  console.log('customRaffleId:', customRaffleId);
const navigation = useNavigation();

const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithUser | null>(null);
const [modalVisible, setModalVisible] = useState(false);

// Obtener el usuario actual
  const currentUser = useQuery(api.users.getCurrent);

  // Obtener los detalles de la rifa por customRaffleId
  const raffle = useQuery(api.raffles.getByCustomRaffleId, customRaffleId ? { customRaffleId: customRaffleId } : 'skip');

  // Obtener las compras para la rifa, usando el _id de la rifa cargada
  const purchases = useQuery(
    api.raffles.getPurchasesForRaffle,
    raffle?._id ? { raffleId: raffle._id as Id<'raffles'> } : 'skip'
  );

  // Configurar el título dinámicamente cuando tengamos los datos de la rifa
  useLayoutEffect(() => {
    if (raffle) {
      navigation.setOptions({
        title: `Ventas: ${raffle.title}`,
        headerStyle: { backgroundColor: '#f8fafc' },
        headerTitleStyle: { fontFamily: 'Quicksand-Bold' },
      });
    }
  }, [raffle, navigation]);

  // Mostrar un indicador de carga mientras se obtienen los datos
  if (!customRaffleId || !raffle || purchases === undefined || currentUser === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-2 text-gray-600">Cargando ventas...</Text>
      </View>
    );
  }

  // Si la rifa no se encuentra (raffle es null después de la carga)
  if (raffle === null) {
    // Podrías redirigir al home o mostrar un mensaje de error más específico.
    return (
      <View className="flex-1 justify-center items-center p-4 bg-slate-50">
        <Text className="text-center text-red-500">El sorteo no existe o no se pudo cargar.</Text>
      </View>
    );
  }

  // Verificar que el usuario actual sea el creador de la rifa
  if (currentUser && raffle && currentUser._id !== raffle.creatorId) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
        <View className="flex-1 justify-center items-center p-4 bg-slate-50">
          <Text className="text-center text-red-500">No tienes permisos para ver las ventas de este sorteo.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{headerShown:true,   title: raffle?.title ? `Ventas: ${raffle.title}` : 'Historial de Ventas' }} />
      <Text className="text-lg font-quicksand-bold text-slate-800 mb-4 px-4 pt-4">Ventas Completadas ({purchases?.length || 0})</Text>
      <FlatList
        data={purchases}
        renderItem={({ item }) => <PurchaseSummaryItem item={item} onPress={() => { setSelectedPurchase(item); setModalVisible(true); }} />}
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

      {selectedPurchase && (
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 bg-black/80 justify-center items-center p-4">
            <ScrollView className="bg-white rounded-2xl p-6 w-full max-h-4/5">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-quicksand-bold text-slate-800">Detalles de la Venta</Text>
                <Pressable onPress={() => setModalVisible(false)} className="p-2">
                  <Ionicons name="close" size={24} color="#64748b" />
                </Pressable>
              </View>

              <View className="mb-4">
                <Text className="text-lg font-quicksand-bold text-slate-800 mb-2">Comprador</Text>
                <Text className="text-base font-quicksand-medium text-slate-700">{selectedPurchase.user?.userName ?? 'Usuario Anónimo'}</Text>
                <Text className="text-sm font-quicksand-medium text-slate-500">{selectedPurchase.user?.phone || 'Sin teléfono'}</Text>
                <Text className="text-sm font-quicksand-medium text-slate-500">{selectedPurchase.user?.email || 'Sin email'}</Text>
              </View>

              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-quicksand-bold text-primary">{formatCOP(selectedPurchase.totalAmount)}</Text>
                <View className={`flex-row items-center px-3 py-1 rounded-full ${PURCHASE_STATUS_STYLES[selectedPurchase.status as keyof typeof PURCHASE_STATUS_STYLES]?.bg || 'bg-slate-100'}`}>
                  <Ionicons name={PURCHASE_STATUS_STYLES[selectedPurchase.status as keyof typeof PURCHASE_STATUS_STYLES]?.icon || 'help-circle-outline'} size={14} color={PURCHASE_STATUS_STYLES[selectedPurchase.status as keyof typeof PURCHASE_STATUS_STYLES]?.text?.replace('text-', '') || '#64748b'} />
                  <Text className={`ml-1 text-sm font-quicksand-bold ${PURCHASE_STATUS_STYLES[selectedPurchase.status as keyof typeof PURCHASE_STATUS_STYLES]?.text || 'text-slate-700'}`}>{PURCHASE_STATUS_STYLES[selectedPurchase.status as keyof typeof PURCHASE_STATUS_STYLES]?.label || 'Desconocido'}</Text>
                </View>
              </View>

              {selectedPurchase.status === 'rejected' && selectedPurchase.rejectionReason && (
                <View className="bg-red-50 p-4 rounded-lg mb-4">
                  <Text className="text-sm font-quicksand-bold text-red-700">Razón de Rechazo:</Text>
                  <Text className="text-sm font-quicksand-medium text-red-600 mt-1">{selectedPurchase.rejectionReason}</Text>
                </View>
              )}

              <View className="mb-4">
                <Text className="text-lg font-quicksand-bold text-slate-800 mb-2">Boletos ({selectedPurchase.tickets.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-x-2 py-1">
                  {selectedPurchase.tickets.map((ticket) => (
                    <View key={ticket.ticketNumber} className="bg-indigo-50 border border-indigo-200/80 rounded-full h-10 px-4 flex-row items-center justify-center">
                      <Ionicons name="ticket-outline" size={16} color="#4f46e5" />
                      <Text className="text-sm font-quicksand-bold text-indigo-700 ml-2">{String(ticket.ticketNumber).padStart(3, '0')}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {selectedPurchase.imageUrl && (
                <View className="mb-4">
                  <Text className="text-lg font-quicksand-bold text-slate-800 mb-2">Comprobante de Pago</Text>
                  <Image source={{ uri: selectedPurchase.imageUrl }} className="w-full h-64 rounded-lg" resizeMode="contain" />
                </View>
              )}

              <Text className="text-sm text-slate-500 font-quicksand-medium">
                Fecha: {format(new Date(selectedPurchase._creationTime), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
              </Text>
            </ScrollView>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

export default RaffleSalesPage;
