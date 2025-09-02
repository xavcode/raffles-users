import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Clipboard, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
// ... otros imports como handleCopyToClipboard

const Paymentmethods = ({ paymentMethods }: any) => {

  // --- SOLUCIÓN: Hacemos la comprobación del estado de los datos ANTES de renderizar la lista ---

  // Caso 1: Los datos todavía se están cargando (paymentMethods es undefined)
  // Devolvemos un indicador de carga o simplemente null.
  if (paymentMethods === undefined) {
    // Podrías poner un ActivityIndicator aquí si lo deseas
    return <ActivityIndicator size="large" color="#4f46e5" />;
  }

  // Caso 2: Los datos han llegado, pero la lista está vacía.
  if (paymentMethods.length === 0) {
    return (
      <View className='flex-1 bg-slate-50 rounded-2xl justify-center items-center'>
        <Text className="text-center text-sm text-slate-500">No hay métodos de pago disponibles.</Text>
      </View>
    );
  }
  const handleCopyToClipboard = (phoneNumber: string) => {
    if (!phoneNumber) return;
    Clipboard.setString(phoneNumber);
    Toast.show({
      type: 'success',
      text1: 'Copiado a portapapeles',
      text2: phoneNumber,
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

  // Caso 3: Tenemos datos, renderizamos la lista completa.
  // Ahora que sabemos que paymentMethods es un array con elementos, el map es seguro.
  return (
    <SafeAreaView className='flex-1 bg-slate-50 rounded-2xl overflow-hidden shadow-lg'>
      <ScrollView className="flex-1 py-4">
        <View className="px-4">
          {paymentMethods.map((method: any, index: number) => (
            <View
              key={method._id}
              className={`flex-row items-center py-4 px-3 bg-white rounded-lg mb-3 shadow-sm shadow-slate-200/50 ${index === paymentMethods.length - 1 ? '' : 'border-b border-slate-100'}`}
            >
              <View className="flex-1 mr-3">
                <Text className="text-sm font-quicksand-bold text-slate-800 uppercase" numberOfLines={1}>{method.name}</Text>
                <Text className="text-xs font-quicksand-medium text-slate-500" numberOfLines={1}>{method.userName}</Text>
                <Text className="text-base font-quicksand-bold text-indigo-600 mt-1" numberOfLines={1} selectable>{method.paymentsNumber}</Text>
              </View>
              <Pressable
                onPress={() => handleCopyToClipboard(method.paymentsNumber)}
                className="p-2.5 bg-indigo-500 rounded-full active:bg-indigo-600 flex-row items-center justify-center"
              >
                <Ionicons name="copy-outline" size={18} color="white" />
                <Text className="text-white ml-1 font-quicksand-semibold text-xs">Copiar</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Paymentmethods;