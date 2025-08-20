import { PURCHASE_STATUS } from '@/constants/status';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { formatCOP } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; // Asegúrate de que este import sea correcto
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Clipboard, Dimensions, Image, Modal, Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { SnapbackZoom } from 'react-native-zoom-toolkit';

// Reutilizamos el helper de estilos de la pantalla de listado
const PURCHASE_STATUS_STYLES = {
  pending_payment: { label: 'Pendiente', bg: 'bg-amber-100', text: 'text-amber-700', icon: 'time-outline' as const },
  pending_confirmation: { label: 'Verificando', bg: 'bg-blue-100', text: 'text-blue-700', icon: 'hourglass-outline' as const },
  completed: { label: 'Pagado', bg: 'bg-green-100', text: 'text-green-700', icon: 'checkmark-circle-outline' as const },
  expired: { label: 'Expirado', bg: 'bg-slate-100', text: 'text-slate-600', icon: 'close-circle-outline' as const },
  rejected: { label: 'Rechazado', bg: 'bg-red-100', text: 'text-red-700', icon: 'alert-circle-outline' as const }
};

const PENDING_PAYMENT = PURCHASE_STATUS.PENDING_PAYMENT;
const PENDING_CONFIRMATION = PURCHASE_STATUS.PENDING_CONFIRMATION;
const IS_ADMIN = 'admin'

const PurchaseDetailsPage = () => {
  const { purchaseId } = useLocalSearchParams<{ purchaseId: string }>();
  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  // --- MUTATIONS ---

  const notifyPaymentMutation = useMutation(api.tickets.adminNotifyPayment);

  // --- QUERIES DE DATOS ---

  const purchaseDetails = useQuery(
    api.tickets.getPurchaseDetails,
    purchaseId ? { purchaseId: purchaseId as Id<'purchases'> } : 'skip'
  );
  const convexUser = useQuery(api.users.getCurrent);
  const settings = useQuery(api.admin.getSettings);
  const paymentMethods = useQuery(api.admin.getPaymentMethods);

  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Las variables de entorno de Cloudinary no están configuradas.");
  }

  const formData = new FormData();
  formData.append('upload_preset', uploadPreset);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  //  Función para abrir la galería de imágenes del dispositivo
  const pickImage = async () => {
    // No se necesitan permisos para abrir la galería, pero sí para la cámara.
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      // Guardamos la URI del primer asset seleccionado
      setImageAsset(result.assets[0]);
    }
  };
  // --- ESTADO DE CARGA UNIFICADO ---
  // La pantalla está cargando si CUALQUIERA de los datos esenciales aún no ha llegado.
  const isLoading = purchaseDetails === undefined || convexUser === undefined || settings === undefined;


  // --- MANEJADORES DE EVENTOS ---
  const handleConfirmPayment = async () => {
    if (!purchaseId) return;
    setIsProcessing(true);
    try {
      if (!imageAsset) return
      if (Platform.OS === 'web') {
        const response = await fetch(imageAsset.uri);
        const blob = await response.blob();
        formData.append('file', blob, imageAsset?.fileName ?? 'upload.jpg');
      } else {
        // En nativo, usamos el formato de objeto específico de React Native.
        formData.append('file', {
          uri: imageAsset?.uri,
          type: imageAsset?.mimeType ?? 'image/jpeg',
          name: imageAsset?.fileName ?? 'upload.jpg',
        } as any);
      }
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      const uploadedImageUrl = data.secure_url;

      await notifyPaymentMutation({ purchaseId: purchaseId as Id<'purchases'>, imageUrl: uploadedImageUrl });
      Toast.show({
        type: 'success',
        text1: '¡Notificación Enviada!',
        text2: 'Los administradores han sido notificados sobre tu pago.',
      });
    } catch (error) {
      Alert.alert('Error', 'Hubo un error al notificar el pago. Por favor, inténtalo de nuevo.');
      console.error("Error notifying payment:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyToClipboard = async (phoneNumber: string) => {
    if (!phoneNumber) return;
    Clipboard.setString(phoneNumber);
    Toast.show({
      type: 'success',
      text1: `${phoneNumber}`,
      text2: `copiado al portapapeles.`,
      visibilityTime: 2000
    });
  };

  // --- RENDERIZADO CONDICIONAL ---
  if (isLoading) {
    return ( // Mostramos un solo indicador de carga mientras esperamos todos los datos.
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (purchaseDetails === null) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-1 justify-center items-center p-8">
          <Ionicons name="alert-circle-outline" size={64} color="#f87171" />
          <Text className="text-lg font-quicksand-bold text-slate-700 mt-4">Compra no encontrada</Text>
          <Text className="text-base font-quicksand-medium text-slate-500 text-center">No pudimos encontrar los detalles para esta compra. Es posible que haya sido eliminada.</Text>
        </View>
      </SafeAreaView>
    );
  }


  const { purchase, raffle, tickets } = purchaseDetails;

  // Si el usuario no es el dueño de la compra NI es un admin, no puede ver la página.
  if (convexUser?._id !== purchase.userId && convexUser?.userType !== 'admin') {
    return <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center p-4"><Text className="text-center font-quicksand-medium text-slate-600">No tienes permiso para ver los detalles de esta compra.</Text></SafeAreaView>;
  }

  const statusStyle = PURCHASE_STATUS_STYLES[purchase.status as keyof typeof PURCHASE_STATUS_STYLES] || {
    label: 'Desconocido', bg: 'bg-slate-100', text: 'text-slate-700', icon: 'help-circle-outline' as const
  };
  const purchaseDate = format(new Date(purchase._creationTime), "d 'de' MMMM, yyyy' -' h:mm a", { locale: es });
  const formattedAmount = formatCOP(purchase.totalAmount);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Stack.Screen options={{ title: 'Detalle de la Compra' }} />
      <ScrollView contentContainerClassName="p-4 space-y-5">
        {/* --- Card de Información Principal --- */}
        <View className="bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50">
          <View className="flex-row justify-between items-start">
            <Text className="text-xl font-quicksand-bold text-slate-800 w-8/12" numberOfLines={2}>{raffle?.title}</Text>
            <View className={`flex-row items-center px-2.5 py-1 rounded-full ${statusStyle.bg}`}>
              <Ionicons name={statusStyle.icon} size={14} color={statusStyle.text.replace('text-', '')} />
              <Text className={`ml-1 text-xs font-quicksand-bold ${statusStyle.text}`}>{statusStyle.label}</Text>
            </View>
          </View>
          <View className="mt-4 border-t border-slate-200/60 pt-4 space-y-3">
            <View className="flex-row justify-between items-baseline">
              <Text className="text-sm font-quicksand-medium text-slate-500">Fecha de compra</Text>
              <Text className="text-sm font-quicksand-semibold text-slate-700">{purchaseDate}</Text>
            </View>
            <View className="flex-row justify-between items-baseline">
              <Text className="text-sm font-quicksand-medium text-slate-500">Monto total</Text>
              <Text className="text-lg font-quicksand-bold text-primary">{formattedAmount}</Text>
            </View>
          </View>
        </View>

        {/* Mostramos el comprobante si ya fue subido */}
        {purchase.imageUrl && (
          <View className="bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50">
            <Text className="text-lg font-quicksand-bold text-slate-700 mb-3">Comprobante Enviado</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsImageModalVisible(true)}
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

        {/* Botón para el USUARIO: Solo si es el dueño y la compra está pendiente */}
        {convexUser?._id === purchase.userId && purchase.status === PENDING_PAYMENT && (
          <View className="bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50 space-y-5">
            {/* --- Sección de Métodos de Pago --- */}
            <View>
              <Text className="text-lg font-quicksand-bold text-slate-700 mb-2">Realiza tu pago aquí</Text>
              <Text className="text-sm font-quicksand-medium text-slate-600 mb-4">Copia los datos de pago. Una vez realizado, sube el comprobante más abajo.</Text>
              <View className="space-y-2 gap-2">
                {paymentMethods?.map((method) => (
                  <Pressable key={method._id} className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl p-2 justify-between active:bg-slate-400">
                    <View style={{ flex: 1 }}>
                      <Text className="text-xs font-quicksand-medium text-slate-500">Entidad</Text>
                      <Text className="text-base font-quicksand-bold text-slate-800 mb-1">{method.name}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text className="text-xs font-quicksand-medium text-slate-500">Titular</Text>
                      <Text className="text-sm font-quicksand-semibold text-slate-700">{method.userName}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text className="text-xs font-quicksand-medium text-slate-500">Número</Text>
                      <Text className="text-sm font-quicksand-semibold text-slate-700">{method.paymentsNumber}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleCopyToClipboard(method.paymentsNumber)} className="h-9 w-9 items-center justify-center active:bg-red-100 rounded-full">
                      <Ionicons name="copy-outline" size={32} color="#94a3b8" />
                    </TouchableOpacity>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* --- Sección para Subir Comprobante --- */}
            <View className="border-t border-slate-200/80 pt-5">
              <Text className="text-lg font-quicksand-bold text-slate-700 mb-3">Sube tu comprobante</Text>
              <Pressable onPress={pickImage} className="bg-slate-100 border-2 border-dashed border-slate-300 h-48 rounded-xl justify-center items-center overflow-hidden active:bg-slate-200/70 transition-colors">
                {imageAsset ? (
                  <>
                    <Image source={{ uri: imageAsset.uri }} className="w-full h-full" resizeMode="cover" />
                    <TouchableOpacity
                      onPress={() => setImageAsset(null)}
                      className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full">
                      <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View className="items-center">
                    <Ionicons name="cloud-upload-outline" size={40} color="#94a3b8" />
                    <Text className="text-slate-500 font-quicksand-medium mt-2">Toca para seleccionar una imagen</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* --- Botón de Confirmación de Pago --- */}
            <View className="items-center">
              <TouchableOpacity
                onPress={handleConfirmPayment}
                disabled={isProcessing || !imageAsset || settings?.purchasesEnabled === false}
                className={`bg-green-500 flex-row items-center justify-center p-4 rounded-xl w-full shadow-lg active:opacity-80 disabled:opacity-50 disabled:bg-slate-400 ${settings?.purchasesEnabled === false ? 'bg-slate-400' : 'shadow-green-500/40'}`} activeOpacity={0.8}>
                {isProcessing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-circle-outline" size={22} color="white" />
                    <Text className="text-white font-quicksand-bold text-base ml-2"> {settings?.purchasesEnabled === false
                      ? 'Compras deshabilitadas'
                      : !imageAsset
                        ? 'Sube tu comprobante'
                        : 'Ya realicé el pago'
                    }
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Mensaje de espera y botón para el ADMIN */}
        {purchase.status === PENDING_CONFIRMATION && (
          <View>
            <View className="bg-blue-100 border border-blue-200/80 p-4 rounded-xl flex-row items-center">
              <Ionicons name="hourglass-outline" size={24} color="#2563eb" />
              <Text className="text-blue-900 font-quicksand-medium text-sm ml-3 flex-1">El pago está siendo verificado por un administrador. Recibirás una notificación cuando sea aprobado.</Text>
            </View>
          </View>
        )}

        <View className="bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50">
          <Text className="text-lg font-quicksand-bold text-slate-700 mb-2">Boletos Adquiridos ({tickets.length})</Text>
          <View className="flex-row flex-wrap justify-center -m-1 pt-2">
            {
              tickets.map(ticket => (
                <View key={ticket.ticketNumber}
                  className="bg-primary/10 border border-primary/20 w-20 h-20 m-1.5 rounded-2xl items-center justify-center" >
                  <Text className="text-3xl font-quicksand-bold text-primary">{ticket.ticketNumber.toString().padStart(3, '0')}</Text>
                </View>))}
          </View>
        </View>
      </ScrollView>

      {/* Modal para hacer zoom a la imagen del comprobante */}
      {purchase.imageUrl && (
        <Modal
          visible={isImageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsImageModalVisible(false)}
        >
          <View className="flex-1 bg-black/80 justify-center items-center">
            <SnapbackZoom onGestureEnd={() => setIsImageModalVisible(false)}>
              <Image source={{ uri: purchase.imageUrl }} style={{ width: screenWidth, height: screenHeight }} resizeMode="contain" />
            </SnapbackZoom>
            <TouchableOpacity className="absolute top-12 right-5 bg-black/50 p-2 rounded-full" onPress={() => setIsImageModalVisible(false)}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default PurchaseDetailsPage;