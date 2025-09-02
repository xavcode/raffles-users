import { getStatusBadge } from '@/constants/status';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { formatUtcToLocal } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Define el tipo para la compra con detalles adicionales
type PurchaseWithDetails = Doc<'purchases'> & {
  raffleTitle: string;
  userFirstName: string;
  userLastName: string
  UserName?: string;
  rejectionReason?: string; // Añadido para la razón de rechazo
};

const LOADING_FIRST_PAGE = 'LoadingFirstPage';

interface VerificationCardProps {
  item: PurchaseWithDetails;
  onApprove: (purchaseId: Id<'purchases'>) => Promise<void>;
  onReject: (purchaseId: Id<'purchases'>) => void; // Cambiado de Promise<void> a void
  isProcessing: boolean;
}

const VerificationCard = ({ item, onApprove, onReject, isProcessing }: VerificationCardProps) => {
  const timeAgo = formatUtcToLocal(item._creationTime, "d 'de' MMMM, yyyy ' - ' h:mm a");

  const formattedAmount = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.totalAmount);

  const [modalVisible, setModalVisible] = useState(false);
  const canShowInvoice = item.imageUrl && item.imageUrl.length > 0;

  const isPendingConfirmation = item.status === 'pending_confirmation';
  const isRejected = item.status === 'rejected'; // Nueva variable para el estado 'rejected'

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

      {/* --- Sección de Comprobante --- */}
      {canShowInvoice && (
        <View className="border-t border-slate-100 bg-slate-50/80 px-4 py-3">
          <Pressable className="bg-indigo-100 self-start flex-row items-center rounded-full px-4 py-2 active:bg-indigo-200" onPress={() => setModalVisible(true)}>
            <Ionicons name="receipt-outline" size={16} color="#4f46e5" />
            <Text className="text-indigo-600 font-quicksand-bold text-sm ml-2">Ver Comprobante</Text>
          </Pressable>
        </View>
      )}

      {/* --- Sección de Acciones (Aprobar/Rechazar) --- */}
      {/* eslint-disable-next-line react-native/no-raw-text */}
      {isPendingConfirmation && (
        <View className="flex-row justify-between p-4 border-t border-slate-100 bg-slate-50/80">
          <Pressable
            onPress={() => onApprove(item._id)}
            disabled={isProcessing}
            className="bg-green-500 flex-1 h-10 rounded-lg justify-center items-center mr-2 active:bg-green-600 disabled:bg-green-300"
          >
            {isProcessing ? <ActivityIndicator color="white" /> : <Text className="text-white font-quicksand-bold text-sm">Aprobar</Text>}
          </Pressable>
          <Pressable
            onPress={() => onReject(item._id)}
            disabled={isProcessing}
            className="bg-red-500 flex-1 h-10 rounded-lg justify-center items-center ml-2 active:bg-red-600 disabled:bg-red-300"
          >
            {isProcessing ? <ActivityIndicator color="white" /> : <Text className="text-white font-quicksand-bold text-sm">Rechazar</Text>}
          </Pressable>
        </View>
      )}
      {isRejected && item.rejectionReason && (
        <View className="p-4 border-t border-slate-100 bg-red-50/80">
          <Text className="text-sm font-quicksand-bold text-red-700">Razón de rechazo:</Text>
          <Text className="text-sm font-quicksand-medium text-red-600 mt-1">{item.rejectionReason}</Text>
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
  const currentUser = useQuery(api.users.getCurrent);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [showRejectionReasonModal, setShowRejectionReasonModal] = useState(false); // Nuevo estado para el modal
  const [currentPurchaseIdForRejection, setCurrentPurchaseIdForRejection] = useState<Id<'purchases'> | null>(null); // ID de la compra a rechazar
  const [rejectionReasonInput, setRejectionReasonInput] = useState(''); // Input del modal

  const aprovalPurchase = useMutation(api.tickets.aprovalPurchase);
  const rejectPurchase = useMutation(api.tickets.rejectPurchase);

  const handleApproval = async (purchaseId: Id<'purchases'>) => {
    setIsProcessingAction(true);
    try {
      await aprovalPurchase({ purchaseId });
      Toast.show({
        type: 'success',
        text1: 'Éxito',
        text2: 'El pago ha sido aprobado y los boletos asignados.',
      });
    } catch (error: any) {
      console.error("Error approving payment:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo aprobar el pago. Inténtalo de nuevo.',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Abre el modal de razón de rechazo
  const handleRejection = (purchaseId: Id<'purchases'>) => {
    setCurrentPurchaseIdForRejection(purchaseId);
    setShowRejectionReasonModal(true);
  };

  // Cierra el modal y limpia el input
  const closeRejectionModal = () => {
    setShowRejectionReasonModal(false);
    setRejectionReasonInput('');
    setCurrentPurchaseIdForRejection(null);
  };

  // Confirma el rechazo con la razón ingresada
  const confirmRejectionWithReason = async () => {
    if (!rejectionReasonInput || rejectionReasonInput.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Razón requerida',
        text2: 'Debes ingresar una razón para rechazar la compra.',
      });
      return;
    }

    if (!currentPurchaseIdForRejection) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo obtener el ID de la compra.' });
      return;
    }

    setIsProcessingAction(true);
    try {
      await rejectPurchase({ purchaseId: currentPurchaseIdForRejection, reason: rejectionReasonInput });
      Toast.show({
        type: 'success',
        text1: 'Éxito',
        text2: 'El pago ha sido rechazado y los boletos liberados.',
      });
      closeRejectionModal(); // Cierra el modal al completar
    } catch (error: any) {
      console.error("Error rejecting payment:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo rechazar el pago. Inténtalo de nuevo.',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const {
    results: pendingPurchases,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.tickets.getPendingConfirmationPurchases,
    currentUser?._id ? { creatorId: currentUser._id } : 'skip',
    { initialNumItems: 10 }
  );

  // Redirigir si no está logueado
  if (currentUser === undefined || status === LOADING_FIRST_PAGE) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-2 text-slate-600">Cargando verificaciones...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ title: 'Verificaciones', }} />
      {currentUser?._id && (
        <FlatList
          data={pendingPurchases}
          renderItem={({ item }) => (
            <VerificationCard
              item={item}
              onApprove={handleApproval}
              onReject={handleRejection}
              isProcessing={isProcessingAction}
            />
          )}
          keyExtractor={(item) => item._id}
          contentContainerClassName="p-4"
          onEndReached={() => {
            if (status === 'CanLoadMore') {
              loadMore(10);
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
      {(currentUser === null) && (
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="alert-circle-outline" size={64} color="#f87171" />
          <Text className="text-lg font-quicksand-bold text-slate-700 mt-4">Error al cargar usuario</Text>
          <Text className="text-base font-quicksand-medium text-slate-500 text-center">No pudimos obtener tu información de usuario. Por favor, intenta de nuevo.</Text>
        </View>
      )}

      {/* Custom Rejection Reason Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showRejectionReasonModal}
        onRequestClose={closeRejectionModal}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
            <Text className="text-xl font-quicksand-bold text-slate-800 mb-4">Razón del Rechazo</Text>
            <TextInput
              className="border border-slate-300 rounded-lg p-3 text-base text-slate-700 font-quicksand-medium mb-4"
              placeholder="Ej: Comprobante ilegible, datos incorrectos..."
              multiline
              numberOfLines={4}
              value={rejectionReasonInput}
              onChangeText={setRejectionReasonInput}
              editable={!isProcessingAction}
            />
            <View className="flex-row justify-end space-x-3">
              <Pressable
                onPress={closeRejectionModal}
                disabled={isProcessingAction}
                className="px-5 py-3 rounded-xl active:opacity-80 disabled:opacity-50"
              >
                <Text className="text-slate-600 font-quicksand-semibold">Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={confirmRejectionWithReason}
                disabled={isProcessingAction || !rejectionReasonInput.trim()}
                className="bg-red-500 px-5 py-3 rounded-xl active:bg-red-600 disabled:bg-red-300 flex-row items-center justify-center"
              >
                {isProcessingAction ? <ActivityIndicator color="white" /> : <Text className="text-white font-quicksand-bold">Confirmar Rechazo</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default VerificationsPage;