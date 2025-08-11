import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
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
  const cancelRaffle = useMutation(api.raffles.cancelRaffle);
  const deleteRaffle = useMutation(api.raffles.deleteRaffle);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prize, setPrize] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [totalTickets, setTotalTickets] = useState('');
  const [winningTicket, setWinningTicket] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (raffle) {
      setTitle(raffle.title);
      setDescription(raffle.description);
      setPrize(String(raffle.prize));
      setImageUrl(raffle.imageUrl);
      setTicketPrice(String(raffle.ticketPrice));
      setTotalTickets(String(raffle.totalTickets));
      if (raffle.winningTicketNumber) {
        setWinningTicket(String(raffle.winningTicketNumber));
      }
    }
  }, [raffle]);

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
      });
      Toast.show({ type: 'success', text1: 'Éxito', text2: 'Sorteo actualizado correctamente.' });
    } catch (error) {
      console.error('Error al actualizar el sorteo:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo actualizar el sorteo.' });
    } finally {
      setIsSaving(false);
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
      await updateRaffle({
        id: id as Id<'raffles'>,
        status: 'finished',
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
  const isLoading = isSaving || isFinishing || isDeleting;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ title: 'Editar Sorteo' }} />
      <KeyboardAwareScrollView contentContainerClassName="p-4 pb-8" extraScrollHeight={20} enableOnAndroid={true}>
        <View className="bg-white p-5 rounded-2xl shadow-sm shadow-slate-300/50">
          <Text className="text-lg font-quicksand-bold text-slate-800 mb-4">Información General</Text>
          <View className="space-y-5">
            <View><Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Título</Text><TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" value={title} onChangeText={setTitle} editable={!isFinished} /></View>
            <View><Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Descripción</Text><TextInput className="bg-slate-100 border border-slate-200 h-28 rounded-lg px-4 text-base font-quicksand-medium align-top pt-3" value={description} onChangeText={setDescription} multiline editable={!isFinished} /></View>
            <View><Text className="text-base font-quicksand-semibold mb-2 text-slate-700">Premio (en COP)</Text><TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" value={prize} onChangeText={setPrize} keyboardType="numeric" editable={!isFinished} /></View>
            <View><Text className="text-base font-quicksand-semibold mb-2 text-slate-700">URL de la Imagen</Text><TextInput className="bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium" value={imageUrl} onChangeText={setImageUrl} keyboardType="url" autoCapitalize="none" editable={!isFinished} /></View>
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
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default EditRafflePage;