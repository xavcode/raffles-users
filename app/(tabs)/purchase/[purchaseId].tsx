import { PURCHASE_STATUS } from '@/constants/status';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { formatCOP } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Reutilizamos el helper de estilos de la pantalla de listado
const PURCHASE_STATUS_STYLES = {
  pending_payment: { label: 'Pendiente', bg: 'bg-amber-100', text: 'text-amber-700', icon: 'time-outline' as const },
  pending_confirmation: { label: 'Verificando', bg: 'bg-blue-100', text: 'text-blue-700', icon: 'hourglass-outline' as const },
  completed: { label: 'Pagado', bg: 'bg-green-100', text: 'text-green-700', icon: 'checkmark-circle-outline' as const },
  expired: { label: 'Expirado', bg: 'bg-red-100', text: 'text-red-700', icon: 'close-circle-outline' as const }
};

const PENDING_PAYMENT = PURCHASE_STATUS.PENDING_PAYMENT;
const PENDING_CONFIRMATION = PURCHASE_STATUS.PENDING_CONFIRMATION;
const IS_ADMIN = 'admin'

const PurchaseDetailsPage = () => {
  const { purchaseId } = useLocalSearchParams<{ purchaseId: string }>();
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isApproving, setIsApproving] = React.useState(false);

  const purchaseDetails = useQuery(
    api.tickets.getPurchaseDetails,
    purchaseId ? { purchaseId: purchaseId as Id<'purchases'> } : 'skip'
  );
  const notifyPaymentMutation = useMutation(api.tickets.adminNotifyPayment);

  // Obtenemos el usuario actual para saber si es admin o el dueño
  const convexUser = useQuery(api.users.getCurrent);
  const confirmPurchaseMutation = useMutation(api.tickets.confirmPurchase);
  const handleConfirmPayment = async () => {
    if (!purchaseId) return;
    setIsConfirming(true);
    try {
      await notifyPaymentMutation({ purchaseId: purchaseId as Id<'purchases'> });
      Toast.show({
        type: 'success',
        text1: '¡Notificación Enviada!',
        text2: 'Los administradores han sido notificados sobre tu pago.',
      });
    } catch (error) {
      Alert.alert('Error', 'Hubo un error al notificar el pago. Por favor, inténtalo de nuevo.');
      console.error("Error notifying payment:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleApprovePayment = async () => {
    if (!purchaseId) return;
    setIsApproving(true);
    try {
      await confirmPurchaseMutation({ purchaseId: purchaseId as Id<'purchases'> });
    } catch (error) {
      alert('Hubo un error al aprobar el pago. Por favor, inténtalo de nuevo.');
      console.error("Error approving payment:", error);
    } finally {
      setIsApproving(false);
    }
  };

  if (purchaseDetails === undefined) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (purchaseDetails === null) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <Stack.Screen options={{ headerTitle: 'Error' }} />
        <View className="flex-1 justify-center items-center p-8">
          <Ionicons name="alert-circle-outline" size={64} color="#f87171" />
          <Text className="text-lg font-quicksand-bold text-slate-700 mt-4">Compra no encontrada</Text>
          <Text className="text-base font-quicksand-medium text-slate-500 text-center">No pudimos encontrar los detalles para esta compra. Es posible que haya sido eliminada.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- INICIO DE LA VALIDACIÓN DE SEGURIDAD ---
  if (convexUser === undefined) {
    return <View className="flex-1 bg-slate-50 justify-center items-center"><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  const { purchase, raffle, tickets } = purchaseDetails;

  // Si el usuario no es el dueño de la compra NI es un admin, no puede ver la página.
  if (convexUser?._id !== purchase.userId && convexUser?.userType !== 'admin') {
    return <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center p-4"><Text className="text-center font-quicksand-medium text-slate-600">No tienes permiso para ver los detalles de esta compra.</Text></SafeAreaView>;
  }
  // --- FIN DE LA VALIDACIÓN DE SEGURIDAD ---

  const statusStyle = PURCHASE_STATUS_STYLES[purchase.status as keyof typeof PURCHASE_STATUS_STYLES] || {
    label: 'Desconocido', bg: 'bg-slate-100', text: 'text-slate-700', icon: 'help-circle-outline' as const
  };
  const purchaseDate = format(new Date(purchase._creationTime), "d 'de' MMMM, yyyy' -' h:mm a", { locale: es });
  const formattedAmount = formatCOP(purchase.totalAmount);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Stack.Screen options={{ headerTitle: 'Detalle de Compra', headerBackTitle: 'Atrás', headerStyle: { backgroundColor: '#f8fafc' }, headerTitleStyle: { fontFamily: 'Quicksand-Bold' } }} />
      <ScrollView contentContainerClassName="p-4">
        <View className="bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-quicksand-bold text-slate-800 w-8/12" numberOfLines={2}>{raffle?.title}</Text>
            <View className={`flex-row items-center px-2.5 py-1 rounded-full ${statusStyle.bg}`}>
              <Ionicons name={statusStyle.icon} size={14} color={statusStyle.text.replace('text-', '')} />
              <Text className={`ml-1 text-xs font-quicksand-bold ${statusStyle.text}`}>{statusStyle.label}</Text>
            </View>
          </View>
          <View className="mt-4 border-t border-slate-100 pt-4">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-base font-quicksand-medium text-slate-500">Fecha de compra</Text>
              <Text className="text-base font-quicksand-semibold text-slate-700">{purchaseDate}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-quicksand-medium text-slate-500">Monto total</Text>
              <Text className="text-base font-quicksand-bold text-primary">{formattedAmount}</Text>
            </View>
          </View>
        </View>

        {/* Botón para el USUARIO: Solo si es el dueño y la compra está pendiente */}
        {convexUser?._id === purchase.userId && purchase.status === PENDING_PAYMENT && (
          <View className="mt-8 items-center">
            <TouchableOpacity
              onPress={handleConfirmPayment}
              disabled={isConfirming}
              className="bg-green-500 flex-row items-center justify-center p-4 rounded-xl shadow-lg shadow-green-500/30 w-full"
              activeOpacity={0.8}
            >
              {isConfirming ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle-outline" size={22} color="white" />
                  <Text className="text-white font-quicksand-bold text-base ml-2">Ya realicé el pago</Text>
                </>
              )}
            </TouchableOpacity>
            <Text className="text-center text-slate-500 font-quicksand-medium text-xs mt-3 px-4">Al presionar, notificarás al administrador para que verifique la transferencia y apruebe tu compra.</Text>
          </View>
        )}

        {/* Mensaje de espera y botón para el ADMIN */}
        {purchase.status === PENDING_CONFIRMATION && (
          <View className="mt-8">
            <View className="bg-blue-100 p-4 rounded-xl flex-row items-center">
              <Ionicons name="hourglass-outline" size={24} color="#2563eb" />
              <Text className="text-blue-800 font-quicksand-medium text-sm ml-3 flex-1">El pago está siendo verificado por un administrador. Recibirás una notificación cuando sea aprobado.</Text>
            </View>

            {/* Botón para el ADMIN: Solo si es admin y la compra está pendiente de confirmación */}
            {convexUser?.userType === IS_ADMIN && (
              <TouchableOpacity
                onPress={handleApprovePayment}
                disabled={isApproving}
                className="bg-indigo-600 flex-row items-center justify-center p-4 rounded-xl shadow-lg shadow-indigo-500/30 w-full mt-4"
                activeOpacity={0.8}
              >
                {isApproving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark-outline" size={22} color="white" />
                    <Text className="text-white font-quicksand-bold text-base ml-2">Aprobar Pago y Vender Boletos</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        <View className="mt-6">
          <Text className="text-lg font-quicksand-bold text-slate-700 px-2 mb-2">Boletos Adquiridos ({tickets.length})</Text>
          <View className="flex-row flex-wrap justify-start">
            {
              tickets.map(ticket => (
                <View key={ticket.ticketNumber}
                  className="bg-primary/10 w-[30%] aspect-square m-1.5 rounded-2xl items-center justify-center" >
                  <Text className="text-4xl font-quicksand-bold text-primary">{ticket.ticketNumber.toString().padStart(3, '0')}</Text>
                </View>))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PurchaseDetailsPage;