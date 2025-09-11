import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { formatCOP } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMutation, useQuery } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const EditRafflePage = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const raffle = useQuery(api.raffles.getById, {
    id: id as Id<'raffles'>,
  });

  const updateRaffle = useMutation(api.raffles.updateRaffle);
  const finishRaffle = useMutation(api.raffles.finishRaffle);
  const cancelRaffle = useMutation(api.raffles.cancelRaffle);
  const deleteRaffle = useMutation(api.raffles.deleteRaffle);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prize, setPrize] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [totalTickets, setTotalTickets] = useState('');
  const [winCondition, setWinCondition] = useState('');
  const [winningTicket, setWinningTicket] = useState('');

  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'end'>('start');

  const [isSaving, setIsSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (raffle) {
      setTitle(raffle.title);
      setDescription(raffle.description);
      setPrize(String(raffle.prize));
      setImageUrl(raffle.imageUrl);
      setTicketPrice(String(raffle.ticketPrice));
      setTotalTickets(String(raffle.totalTickets));
      setWinCondition(raffle.winCondition ?? '');
      setStartTime(new Date(raffle.startTime));
      setEndTime(new Date(raffle.endTime));
      if (raffle.winningTicketNumber) {
        setWinningTicket(String(raffle.winningTicketNumber));
      }
    }
  }, [raffle]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
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

  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("Cloudinary environment variables are not set.");
    // Optionally, you can show an alert or a message to the user.
  }

  const handleSaveChanges = async () => {
    const prizeNumber = parseFloat(prize);
    const ticketPriceNumber = parseFloat(ticketPrice);
    const totalTicketsNumber = parseInt(totalTickets, 10);

    if (!title || !description || !imageUrl) {
      Toast.show({ type: 'error', text1: 'Campos incompletos', text2: 'Por favor, completa todos los campos de texto.' });
      return;
    }
    if (isNaN(prizeNumber) || isNaN(ticketPriceNumber) || isNaN(totalTicketsNumber)) {
      Toast.show({ type: 'error', text1: 'Datos inválidos', text2: 'Asegúrate de premio, precio y total de boletos válidos.' });
      return;
    }

    setIsSaving(true);
    try {
      await updateRaffle({
        id: id as Id<'raffles'>,
        title,
        description,
        prize: prizeNumber,
        imageUrl,
        totalTickets: totalTicketsNumber,
        ticketPrice: ticketPriceNumber,
        winCondition,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
      });
      Toast.show({ type: 'success', text1: 'Éxito', text2: 'Sorteo actualizado correctamente.' });
    } catch (error) {
      console.error('Error al actualizar el sorteo:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo actualizar el sorteo.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('upload_preset', uploadPreset!);

      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('file', blob, asset.fileName ?? 'upload.jpg');
      } else {
        formData.append('file', {
          uri: asset.uri,
          type: asset.mimeType ?? 'image/jpeg',
          name: asset.fileName ?? 'upload.jpg',
        } as any);
      }

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      setImageUrl(data.secure_url);
      Toast.show({ type: 'success', text1: 'Imagen actualizada', text2: 'No olvides guardar los cambios.' });
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert('Error', 'No se pudo subir la nueva imagen.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinishRaffle = async () => {
    const winningNumber = parseInt(winningTicket, 10);
    const totalTicketsNumber = parseInt(totalTickets, 10);

    if (isNaN(winningNumber) || winningNumber <= 0) {
      Toast.show({ type: 'error', text1: 'Boleto inválido', text2: 'Ingresa un número de boleto ganador válido y positivo.' });
      return;
    }
    if (winningNumber > totalTicketsNumber) {
      Toast.show({ type: 'error', text1: 'Fuera de rango', text2: 'El boleto ganador no puede ser mayor que el total de boletos.' });
      return;
    }

    setIsFinishing(true);
    try {
      await finishRaffle({
        id: id as Id<'raffles'>,
        winningTicketNumber: winningNumber,
      });
      Toast.show({ type: 'success', text1: 'Éxito', text2: '¡Sorteo finalizado! Se ha asignado el ganador.' });
      router.back();
    } catch (error) {
      console.error('Error al finalizar el sorteo:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo finalizar el sorteo.' });
    } finally {
      setIsFinishing(false);
    }
  };

  const handleCancelRaffle = async () => {
    setIsDeleting(true);
    try {
      await cancelRaffle({ id: id as Id<'raffles'> });
      Toast.show({ type: 'success', text1: 'Éxito', text2: 'El sorteo ha sido cancelado.' });
      router.back();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.data?.message || 'No se pudo cancelar el sorteo. Tiene boletos vendidos o reservados.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteRaffle = async () => {
    setIsDeleting(true);
    try {
      await deleteRaffle({ id: id as Id<'raffles'> });
      Toast.show({ type: 'success', text1: 'Éxito', text2: 'El sorteo ha sido eliminado permanentemente.' });
      router.back();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.data?.message || 'No se pudo eliminar el sorteo.' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (raffle === undefined) {
    return <View className="flex-1 justify-center items-center bg-slate-50"><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  if (raffle === null) {
    return <SafeAreaView className="flex-1 bg-slate-50"><Text>Sorteo no encontrado.</Text></SafeAreaView>;
  }

  const isFinished = raffle.status === 'finished';
  const isLoading = isSaving || isFinishing || isDeleting || isUploading;

  return (

    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <Stack.Screen name="[id]/index" options={{ title: 'Detalles del Sorteqqqo', headerRight: () => <Text>Editar</Text> }}

      />
      <KeyboardAwareScrollView contentContainerClassName="p-4 pb-8" extraScrollHeight={20} enableOnAndroid={true}>
        <View className="bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50">
          <Text className="text-lg font-quicksand-bold text-slate-800 mb-4">Información General</Text>
          <View className="space-y-5">
            <View><Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Título</Text><TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" value={title} onChangeText={setTitle} editable={!isFinished} /></View>
            <View><Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Descripción</Text><TextInput className="bg-slate-100 border border-slate-200 h-28 rounded-lg px-4 text-base font-quicksand-medium align-top pt-3" value={description} onChangeText={setDescription} multiline editable={!isFinished} /></View>
            <View><Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Condición del Sorteo</Text><TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" value={winCondition} onChangeText={setWinCondition} editable={!isFinished} placeholder="Ej: Lotería de Nariño, últimos 2 dígitos" /></View>
            <View><Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Premio (en COP)</Text><TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" value={prize} onChangeText={setPrize} keyboardType="numeric" editable={!isFinished} /></View>
            <View>
              <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Imagen del Sorteo</Text>
              <Pressable
                onPress={handlePickImage}
                disabled={isFinished || isLoading}
                className="h-48 bg-slate-100 rounded-lg overflow-hidden justify-center items-center active:opacity-80"
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} className='w-full h-full' resizeMode='cover' />
                ) : (
                  <Ionicons name="image-outline" size={48} color="#94a3b8" />
                )}
                {!isFinished && (
                  <View className="absolute inset-0 bg-black/40 justify-center items-center">
                    {isUploading ? (
                      <ActivityIndicator color="white" size="large" />
                    ) : (
                      <Ionicons name="create-outline" size={32} color="white" />
                    )}
                  </View>
                )}
              </Pressable>
            </View>
            <View className="flex-row gap-x-4">
              <View className="flex-1">
                <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Fecha de Inicio</Text>
                <Pressable
                  onPress={() => showDatepickerFor('start')}
                  disabled={isFinished}
                  className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 justify-center disabled:opacity-70"
                >
                  <Text className="text-base font-quicksand-medium text-slate-800">{startTime.toLocaleDateString('es-CO')}</Text>
                </Pressable>
              </View>
              <View className="flex-1">
                <Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Fecha del Sorteo</Text>
                <Pressable
                  onPress={() => showDatepickerFor('end')}
                  disabled={isFinished}
                  className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 justify-center disabled:opacity-70"
                >
                  <Text className="text-base font-quicksand-medium text-slate-800">{endTime.toLocaleDateString('es-CO')}</Text>
                </Pressable>
              </View>
            </View>
            <View className="flex-row gap-x-4">
              <View className="flex-1"><Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Total Boletos</Text><TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" value={totalTickets} onChangeText={setTotalTickets} keyboardType="numeric" editable={!isFinished} /></View>
              <View className="flex-1"><Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Precio Boleto</Text><TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" value={ticketPrice} onChangeText={setTicketPrice} keyboardType="decimal-pad" editable={!isFinished} /></View>
            </View>
          </View>
          {!isFinished && (
            <Pressable className="bg-primary h-12 rounded-lg justify-center items-center mt-6 active:opacity-80 disabled:bg-primary/60" onPress={handleSaveChanges} disabled={isLoading}>
              {isSaving ? <ActivityIndicator color="white" /> : <Text className="text-white font-quicksand-bold text-base">Guardar Cambios</Text>}
            </Pressable>
          )}
        </View>

        <View className="mt-6 bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50">
          <Text className="text-lg font-quicksand-bold text-slate-800 mb-4">Estadísticas y Ventas</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="font-quicksand-medium text-slate-600">Boletos Vendidos</Text>
              <Text className="font-quicksand-bold text-slate-800">{raffle.ticketsSold ?? 0} / {raffle.totalTickets}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="font-quicksand-medium text-slate-600">Ingresos Totales</Text>
              <Text className="font-quicksand-bold text-green-600">{formatCOP((raffle.ticketsSold ?? 0) * raffle.ticketPrice)}</Text>
            </View>
          </View>
          <Link href={`/(admin)/(raffles)/${id}/sales`} asChild>
            <Pressable className="bg-slate-100 h-12 rounded-lg justify-center items-center mt-6 active:bg-slate-200 flex-row">
              <Ionicons name="list-outline" size={20} color="#475569" />
              <Text className="text-slate-700 font-quicksand-bold text-base ml-2">Ver Historial de Ventas</Text>
            </Pressable>
          </Link>
        </View>

        {isFinished ? (
          <View className="mt-6 bg-green-100 p-4 rounded-xl flex-row items-center">
            <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
            <View className="ml-3 flex-1">
              <Text className="text-green-800 font-quicksand-bold text-base">Sorteo Finalizado</Text>
              <Text className="text-green-700 font-quicksand-medium text-sm">El boleto ganador fue el #{raffle.winningTicketNumber}.</Text>
            </View>
          </View>
        ) : (
          <View className="mt-6 bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50">
            <Text className="text-lg font-quicksand-bold text-slate-800 mb-4">Finalizar Sorteo</Text>
            <View><Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Número de Boleto Ganador</Text><TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" placeholder="Ej: 087" value={winningTicket} onChangeText={setWinningTicket} keyboardType="number-pad" /></View>
            <Pressable className="bg-red-600 h-12 rounded-lg justify-center items-center mt-4 active:bg-red-700 disabled:bg-red-400" onPress={handleFinishRaffle} disabled={isLoading}>
              {isFinishing ? <ActivityIndicator color="white" /> : <Text className="text-white font-quicksand-bold text-base">Finalizar y Asignar Ganador</Text>}
            </Pressable>
          </View>
        )}

        {!isFinished && (
          <View className="mt-6 bg-red-50 p-5 rounded-2xl border border-red-200">
            <Text className="text-lg font-quicksand-bold text-red-800 mb-2">Zona de Peligro</Text>
            <View className="space-y-3">
              <Pressable onPress={handleCancelRaffle} disabled={isLoading} className="bg-amber-500 h-11 rounded-lg justify-center items-center active:bg-amber-600 disabled:bg-amber-300">
                <Text className="text-white font-quicksand-bold text-base">Cancelar Sorteo</Text>
              </Pressable>
              <Pressable onPress={handleDeleteRaffle} disabled={isLoading} className="bg-red-600 h-11 rounded-lg justify-center items-center active:bg-red-700 disabled:bg-red-300">
                {isDeleting ? <ActivityIndicator color="white" /> : <Text className="text-white font-quicksand-bold text-base">Eliminar Sorteo</Text>}
              </Pressable>
            </View>
          </View>
        )}
        {showDatePicker && (
          <DateTimePicker
            value={datePickerTarget === 'start' ? startTime : endTime}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>


  );
};

export default EditRafflePage;
