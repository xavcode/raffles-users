import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import React from 'react';
import { ActivityIndicator, Dimensions, Easing, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SnapbackZoom } from 'react-native-zoom-toolkit';

const ModalPurchase = ({ handleConfirmPayment, confirmPaymentRecipeModalVisible, setConfirmPaymentRecipeModalVisible, isChecked, setChecked, isProcessing, setIsProcessing, imageAsset }: any) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  return (
    <View className="flex-1">
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmPaymentRecipeModalVisible(false)}
      >
        {/* 1. View principal que actúa como fondo y contenedor del layout */}
        <View className="flex-1 justify-between bg-black/80 gap-2">

          <View className="absolute top-5 right-5 active:bg-black/80 p-2 rounded-full">
            <Pressable
              className="p-3" // Más área de toque
              onPress={() => setConfirmPaymentRecipeModalVisible(false)}
            >
              <Ionicons name="close" size={32} color="white" />
            </Pressable>
          </View>

          {/* 3. Contenedor de la imagen que SÍ se centra */}
          {/* Usamos `flex-1` para que ocupe el espacio sobrante entre el header y el footer */}
          <ScrollView className="">
            <SnapbackZoom
              hitSlop={{ vertical: 50, horizontal: 50 }}
              timingConfig={{ duration: 150, easing: Easing.linear }}
            >
              <Image
                source={{ uri: imageAsset?.uri }}
                style={{ width: screenWidth, height: screenHeight }}
                resizeMode="contain"
              />
            </SnapbackZoom>
          </ScrollView>

          {/* 4. SafeAreaView para el panel inferior (solo se aplica al 'bottom') */}

          <View className="bg-white">
            <View className="p-5 rounded-t-2xl">
              <Text className="text-lg font-quicksand-bold text-slate-800 mb-3">Confirmar envío</Text>
              <Pressable onPress={() => setChecked(!isChecked)} className="flex-row items-center mb-5">
                <Checkbox value={isChecked} onValueChange={setChecked} color={isChecked ? '#22c55e' : '#64748b'} />
                <Text className="text-base font-quicksand-medium text-slate-700 ml-3">Confirmo que este es mi comprobante.</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmPayment}
                disabled={!isChecked || isProcessing}
                className="bg-green-500 h-12 rounded-lg justify-center items-center flex-row active:bg-green-600 disabled:bg-green-300">
                {isProcessing ? <ActivityIndicator color="white" /> : <><Ionicons name="send-outline" size={20} color="white" /><Text className="text-white font-quicksand-bold text-base ml-2">Enviar Comprobante</Text></>}
              </Pressable>
            </View>
          </View>

        </View>
      </Modal>
    </View>
  )
}

export default ModalPurchase