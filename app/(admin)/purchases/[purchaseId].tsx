import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const PURCHASE_STATUS_STYLES = {
  pending_payment: { label: 'Pendiente', bg: 'bg-amber-100', text: 'text-amber-700', icon: 'time-outline' as const },
  pending_confirmation: { label: 'Verificando', bg: 'bg-blue-100', text: 'text-blue-700', icon: 'hourglass-outline' as const },
  completed: { label: 'Pagado', bg: 'bg-green-100', text: 'text-green-700', icon: 'checkmark-circle-outline' as const },
  expired: { label: 'Expirado', bg: 'bg-red-100', text: 'text-red-700', icon: 'close-circle-outline' as const }
};

const PENDING_CONFIRMATION = 'pending_confirmation'

const AdminPurchaseDetailsPage = () => {
  const { purchaseId } = useLocalSearchParams<{ purchaseId: string }>();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const purchaseDetails = useQuery(
    api.tickets.getPurchaseDetails,
    purchaseId ? { purchaseId: purchaseId as Id<'purchases'> } : 'skip'
  );

  const confirmPurchase = useMutation(api.tickets.confirmPurchase);
  const rejectPurchase = useMutation(api.tickets.rejectPurchase);

  const handleApproval = async () => {
    setIsProcessing(true);
    try {
      await confirmPurchase({ purchaseId: purchaseId as Id<'purchases'> });
      Toast.show({
        type: 'success',
        text1: 'Éxito',
        text2: 'El pago ha sido aprobado y se han asignado los boletos..',
      })
      router.back();
    } catch (error) {
      console.error("Error approving payment:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo aprobar el pago. Por favor, inténtalo de nuevo.',
      })
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejection = () => {
    Alert.alert(
      "Confirmar Rechazo",
      "¿Estás seguro de que quieres rechazar este pago? Los boletos serán liberados.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, Rechazar",
          style: "destructive",
          onPress: async () => {
            setIsProcessing(true);
            try {
              await rejectPurchase({ purchaseId: purchaseId as Id<'purchases'> });
              Alert.alert('Éxito', 'El pago ha sido rechazado y los boletos liberados.');
              router.back();
            } catch (error) {
              console.error("Error rejecting payment:", error);
              Alert.alert('Error', 'No se pudo rechazar el pago.');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  if (purchaseDetails === undefined) {
    return <View className="flex-1 bg-slate-50 justify-center items-center"><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  if (purchaseDetails === null) {
    return <SafeAreaView className="flex-1 bg-slate-50"><Text>Compra no encontrada.</Text></SafeAreaView>;
  }

  const { purchase, raffle, tickets, user } = purchaseDetails;
  const statusStyle = PURCHASE_STATUS_STYLES[purchase.status as keyof typeof PURCHASE_STATUS_STYLES] || { label: 'Desconocido', bg: 'bg-slate-100', text: 'text-slate-700', icon: 'help-circle-outline' as const };
  const formattedAmount = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(purchase.totalAmount);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ title: 'Verificar Compra' }} />
      <ScrollView contentContainerClassName="p-4">
        <View className="bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-quicksand-bold text-slate-800 w-8/12" numberOfLines={2}>{raffle?.title}</Text>
            <View className={`flex-row items-center px-2.5 py-1 rounded-full ${statusStyle.bg}`}>
              <Ionicons name={statusStyle.icon} size={14} color={statusStyle.text.replace('text-', '')} />
              <Text className={`ml-1 text-xs font-quicksand-bold ${statusStyle.text}`}>{statusStyle.label}</Text>
            </View>
          </View>
          <View className="border-t border-slate-100 pt-4 space-y-2">
            <View className="flex-row justify-between"><Text className="font-quicksand-medium text-slate-500">Usuario:</Text><Text className="font-quicksand-bold text-slate-800">{user?.firstName ?? 'No disponible'}</Text></View>
            <View className="flex-row justify-between"><Text className="font-quicksand-medium text-slate-500">Boletos:</Text><Text className="font-quicksand-bold text-slate-800">{purchase.ticketCount}</Text></View>
            <View className="flex-row justify-between"><Text className="font-quicksand-medium text-slate-500">Monto Total:</Text><Text className="font-quicksand-bold text-primary">{formattedAmount}</Text></View>
            <View className="flex-row justify-between"><Text className="font-quicksand-medium text-slate-500">Fecha:</Text><Text className="font-quicksand-semibold text-slate-600">{format(new Date(purchase._creationTime), "d MMM, yyyy h:mm a", { locale: es })}</Text></View>
          </View>
        </View>

        <View className="bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50 mb-6">
          <Text className="text-lg font-quicksand-bold text-slate-700 mb-2">Boletos Reservados</Text>
          <View className="flex-row flex-wrap">
            {tickets.map(ticket => (
              <View key={ticket.ticketNumber} className="bg-primary/10 w-16 h-16 m-1 rounded-lg items-center justify-center">
                <Text className="text-2xl font-quicksand-bold text-primary">{ticket.ticketNumber.toString().padStart(3, '0')}</Text>
              </View>
            ))}
          </View>
        </View>

        {purchase.status === PENDING_CONFIRMATION && (
          <View className="space-y-3">
            <Pressable onPress={handleApproval} disabled={isProcessing} className="bg-green-500 h-12 rounded-lg justify-center items-center flex-row active:bg-green-600 disabled:bg-green-300">
              {isProcessing ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle-outline" size={20} color="white" /><Text className="text-white font-quicksand-bold text-base ml-2">Aprobar Pago</Text></>}
            </Pressable>
            <Pressable onPress={handleRejection} disabled={isProcessing} className="bg-red-500 h-12 rounded-lg justify-center items-center flex-row active:bg-red-600 disabled:bg-red-300">
              {isProcessing ? <ActivityIndicator color="white" /> : <><Ionicons name="close-circle-outline" size={20} color="white" /><Text className="text-white font-quicksand-bold text-base ml-2">Rechazar Pago</Text></>}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminPurchaseDetailsPage;

