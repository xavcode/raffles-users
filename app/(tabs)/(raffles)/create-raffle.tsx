import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const CreateRaffle = () => {
  const createRaffle = useMutation(api.raffles.createRaffle);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalTickets, setTotalTickets] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [prize, setPrize] = useState('');
  // 1. Cambiamos el estado para guardar el objeto completo de la imagen, no solo la URI.
  const [winCondition, setWinCondition] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Por defecto, 7 días
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'end'>('start');

  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const resetStates = () => {
    setTitle('');
    setDescription('');
    setPrize('');
    setWinCondition('');
    setStartTime(new Date());
    setEndTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Por defecto, 7 días
    setShowDatePicker(false);
    setDatePickerTarget('start');
    setImageAsset(null);
  }

  // 2. Función para abrir la galería de imágenes del dispositivo
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

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // En iOS se mantiene abierto, en Android se cierra solo
    if (selectedDate) {
      if (datePickerTarget === 'start') {
        setStartTime(selectedDate);
      } else {
        setEndTime(selectedDate);
      }
    }
  };

  const showDatepickerFor = (target: 'start' | 'end') => {
    setDatePickerTarget(target);
    setShowDatePicker(true);
  };

  /**
   * Cuando un input inferior recibe el foco, nos aseguramos de que el ScrollView
   * se desplace hasta el final para que el botón de "Crear Sorteo" sea visible.
   */
  const handleFocusLastInputs = () => {
    // Usamos un pequeño delay para dar tiempo a que el teclado se anime completamente.
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
  };

  const handleCreateRaffle = async () => {
    // Validamos que todos los campos, incluida la imagen, estén completos
    if (!title || !description || !totalTickets || !ticketPrice || !prize || !imageAsset) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor, completa todos los campos y selecciona una imagen.',
      })

      return;
    }

    setIsLoading(true);
    try {
      // 4. Subir la imagen a Cloudinary ANTES de crear el sorteo en Convex
      const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error("Las variables de entorno de Cloudinary no están configuradas.");
      }

      const formData = new FormData();
      formData.append('upload_preset', uploadPreset);

      // La forma de adjuntar el archivo es diferente en web y en nativo.
      if (Platform.OS === 'web') {
        // En web, obtenemos el blob de la URI y lo adjuntamos.
        const response = await fetch(imageAsset.uri);
        const blob = await response.blob();
        formData.append('file', blob, imageAsset.fileName ?? 'upload.jpg');
      } else {
        // En nativo, usamos el formato de objeto específico de React Native.
        formData.append('file', {
          uri: imageAsset.uri,
          type: imageAsset.mimeType ?? 'image/jpeg',
          name: imageAsset.fileName ?? 'upload.jpg',
        } as any);
      }

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
        // NOTA: No establecemos el header 'Content-Type'. El navegador (en web)
        // o la librería de red (en nativo) lo harán automáticamente con el boundary correcto.
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      const uploadedImageUrl = data.secure_url;

      // 5. Crear el sorteo en Convex usando la URL de la imagen recién subida
      await createRaffle({
        title,
        description,
        prize: parseFloat(prize),
        imageUrl: uploadedImageUrl,
        totalTickets: parseInt(totalTickets, 10),
        ticketPrice: parseFloat(ticketPrice),
        winCondition: winCondition,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
      });

      Toast.show({
        type: 'success',
        text1: 'Éxito',
        text2: 'Sorteo creado correctamente.'
      });
      resetStates();
      router.back();


    } catch (error) {
      console.error('Failed to create raffle:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
      Toast.show({ type: 'error', text1: 'Error al crear sorteo', text2: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <KeyboardAwareScrollView
        contentContainerClassName='flex-1'
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        enableResetScrollToCoords={true}
        resetScrollToCoords={{ x: 0, y: 0 }}
        extraScrollHeight={20}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerClassName="p-4"
          keyboardShouldPersistTaps="always" // Evita que el teclado se cierre al tocar fuera de un input
        >
          <View className="bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50">
            <View className="mb-5">
              <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Título del Sorteo</Text>
              <TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="Ej: Sorteo Pro-fondos" value={title} onChangeText={setTitle} />
            </View>
            <View className="mb-5">
              <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Descripción</Text>
              <TextInput className="bg-slate-100 border border-slate-200 h-28 rounded-lg px-4 text-base font-quicksand-medium align-top pt-3" placeholder="Describe los detalles del sorteo..." value={description} onChangeText={setDescription} multiline />
            </View>

            <View className="mb-5">
              <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Condición del Sorteo</Text>
              <TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="Ej: Lotería de Nariño, últimos 2 dígitos" value={winCondition} onChangeText={setWinCondition} />
            </View>

            <View className="mb-5">
              <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Premio (en COP)</Text>
              <TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="Ej: 1000000" value={prize} onChangeText={setPrize} keyboardType="numeric" />
            </View>

            <View className="mb-5">
              <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Imagen del Premio</Text>
              <Pressable onPress={pickImage} className="bg-slate-100 border-2 border-dashed border-slate-300 h-48 rounded-lg justify-center items-center overflow-hidden">
                {imageAsset ? (
                  <Image source={{ uri: imageAsset.uri }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="items-center">
                    <Ionicons name="cloud-upload-outline" size={40} color="#94a3b8" />
                    <Text className="text-slate-500 font-quicksand-medium mt-2">Seleccionar una imagen</Text>
                  </View>
                )}
              </Pressable>
            </View>

            <View className="flex-row gap-x-4 mb-5">
              <View className="flex-1">
                <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Fecha de Inicio</Text>
                <Pressable onPress={() => showDatepickerFor('start')} className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 justify-center">
                  <Text className="text-base font-quicksand-medium">{startTime.toLocaleDateString('es-CO')}</Text>
                </Pressable>
              </View>
              <View className="flex-1">
                <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Fecha del Sorteo</Text>
                <Pressable onPress={() => showDatepickerFor('end')} className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 justify-center">
                  <Text className="text-base font-quicksand-medium">{endTime.toLocaleDateString('es-CO')}</Text>
                </Pressable>
              </View>
            </View>

            <View className="flex-row gap-x-4 mb-5">
              <View className="flex-1">
                <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Total Boletos</Text>
                <TextInput onFocus={handleFocusLastInputs} className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="Ej: 100" value={totalTickets} onChangeText={setTotalTickets} keyboardType="numeric" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Precio Boleto</Text>
                <TextInput onFocus={handleFocusLastInputs} className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="Ej: 5000" value={ticketPrice} onChangeText={setTicketPrice} keyboardType="decimal-pad" />
              </View>
            </View>

            <Pressable
              className="bg-primary h-12 rounded-lg justify-center items-center active:opacity-80 disabled:bg-primary/60"
              onPress={handleCreateRaffle}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-quicksand-bold text-base">Crear Sorteo</Text>
              )}
            </Pressable>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={datePickerTarget === 'start' ? startTime : endTime}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()} // No se pueden seleccionar fechas pasadas
            />
          )}
        </ScrollView>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default CreateRaffle;