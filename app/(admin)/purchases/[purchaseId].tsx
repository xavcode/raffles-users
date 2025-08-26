import PurchaseDetails from '@/app/components/PurchaseDetail';
import { PURCHASE_STATUS, PURCHASE_STATUS_STYLES } from '@/constants/status';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { formatCOP } from '@/utils/format';
import { Authenticated, Unauthenticated, useMutation, useQuery } from 'convex/react';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';


const PENDING_CONFIRMATION = PURCHASE_STATUS.PENDING_CONFIRMATION

const AdminPurchaseDetailsPage = () => {
  const { purchaseId } = useLocalSearchParams<{ purchaseId: Id<'purchases'> }>();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);


  const purchaseDetails = useQuery(
    api.tickets.getPurchaseDetails,
    purchaseId ? { purchaseId: purchaseId as Id<'purchases'> } : 'skip'
  );

  const aprovalPurchase = useMutation(api.tickets.aprovalPurchase);
  const rejectPurchase = useMutation(api.tickets.rejectPurchase);

  const handleApproval = async () => {
    setIsProcessing(true);
    try {
      await aprovalPurchase({ purchaseId: purchaseId as Id<'purchases'> });
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

  const handleRejection = async () => {
    setIsProcessing(true);
    try {
      await rejectPurchase({ purchaseId: purchaseId as Id<'purchases'> });
      Toast.show({ type: 'success', text1: 'Éxito', text2: 'El pago ha sido rechazado y los boletos liberados.' });
      router.back();
    } catch (error) {
      console.error("Error rejecting payment:", error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo rechazar el pago.' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (purchaseDetails === undefined) {
    return <View className="flex-1 bg-slate-50 justify-center items-center"><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  if (purchaseDetails === null) {
    return <SafeAreaView className="flex-1 bg-slate-50"><Text>Compra no encontrada.</Text></SafeAreaView>;
  }

  const { purchase, raffle, tickets, user, } = purchaseDetails;
  const statusStyle = PURCHASE_STATUS_STYLES[purchase.status as keyof typeof PURCHASE_STATUS_STYLES] || { label: 'Desconocido', bg: 'bg-slate-100', text: 'text-slate-700', icon: 'help-circle-outline' as const };
  const formattedAmount = formatCOP(purchase.totalAmount);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <Authenticated>
        {/* <Stack.Screen options={{ title: 'Verificar Compra' }} /> */}
        <PurchaseDetails
          purchaseId={purchaseId}
          handleApproval={handleApproval}
          handleRejection={handleRejection}
          isProcessing={isProcessing}
        />




        {/* <ScrollView contentContainerClassName="p-4">
        <View className="bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-quicksand-bold text-slate-800 w-8/12" numberOfLines={2}>{raffle?.title}</Text>
            <View className={`flex-row items-center px-2.5 py-1 rounded-full ${statusStyle.bg}`}>
              <Ionicons name={statusStyle.icon} size={14} color={statusStyle.text.replace('text-', '')} />
              <Text className={`ml-1 text-xs font-quicksand-bold ${statusStyle.text}`}>{statusStyle.label}</Text>
            </View>
          </View>
          <View className="border-t border-slate-100 pt-4 space-y-2">
            <View className="flex-row justify-between"><Text className="font-quicksand-medium text-slate-500">Usuario:</Text><Text className="font-quicksand-bold text-slate-800">{user?.firstName ?? 'No disponible'} {user?.lastName}</Text></View>
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

        {purchase.imageUrl && (
          <View className="bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50 mb-6">
            <Text className="text-lg font-quicksand-bold text-slate-700 mb-3">Comprobante de Pago</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsModalVisible(true)}
            >
              <Image
                source={{ uri: purchase.imageUrl }}
                className="w-full h-48 rounded-lg bg-slate-200"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/30 justify-center items-center rounded-lg">
                <Ionicons name="scan-outline" size={32} color="white" />
                <Text className="text-white font-quicksand-bold mt-1">Toca para ampliar</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View className="flex-1 bg-black/80 justify-center items-center">
            <SnapbackZoom onGestureEnd={() => setIsModalVisible(false)} >
              <Image source={{ uri: purchase.imageUrl }} style={{ width: screenWidth, height: screenHeight }} resizeMethod={"scale"} resizeMode="contain" />
            </SnapbackZoom>
            <TouchableOpacity className="absolute top-12 right-5 bg-black/50 p-2 rounded-full" onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </Modal>

        {purchase.status === PENDING_CONFIRMATION && (
          <View className="space-y-3 gap-2">
            <Pressable onPress={handleApproval} disabled={isProcessing} className="bg-green-500 h-12 rounded-lg justify-center items-center flex-row active:bg-green-600 disabled:bg-green-300">
              {isProcessing ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle-outline" size={20} color="white" /><Text className="text-white font-quicksand-bold text-base ml-2">Aprobar Pago</Text></>}
            </Pressable>
            <Pressable onPress={handleRejection} disabled={isProcessing} className="bg-red-500 h-12 rounded-lg justify-center items-center flex-row active:bg-red-600 disabled:bg-red-300">
              {isProcessing ? <ActivityIndicator color="white" /> : <><Ionicons name="close-circle-outline" size={20} color="white" /><Text className="text-white font-quicksand-bold text-base ml-2">Rechazar Pago</Text></>}
            </Pressable>
          </View>
        )}
      </ScrollView> */}
      </Authenticated>
      <Unauthenticated>
        <Redirect href="/(auth)/sign-in" />
      </Unauthenticated>
    </SafeAreaView>

  );
};

export default AdminPurchaseDetailsPage;
