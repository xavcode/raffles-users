import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // SafeAreaView es genial para evitar notches

const EditRafflePage = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // 1. Obtener los datos del sorteo
  const raffle = useQuery(api.raffles.getById, {
    id: id as Id<'raffles'>,
  });

  // 2. Preparar la mutación para actualizar
  const updateRaffle = useMutation(api.raffles.updateRaffle);

  // 3. Estados para el formulario y la carga
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [totalTickets, setTotalTickets] = useState('');
  const [winningTicket, setWinningTicket] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 4. Llenar el formulario cuando los datos del sorteo se cargan
  useEffect(() => {
    if (raffle) {
      setTitle(raffle.title);
      setDescription(raffle.description);
      setTicketPrice(String(raffle.ticketPrice));
      setTotalTickets(String(raffle.totalTickets));
      // Si ya hay un ganador, lo mostramos
      if (raffle.winningTicketNumber) {
        setWinningTicket(String(raffle.winningTicketNumber));
      }
    }
  }, [raffle]);

  // 5. Manejador para guardar los cambios generales
  const handleSaveChanges = async () => {
    if (!title || !description || !ticketPrice || !totalTickets) {
      Alert.alert('Error', 'Por favor, completa los campos principales.');
      return;
    }
    setIsLoading(true);
    try {
      await updateRaffle({
        id: id as Id<'raffles'>,
        title,
        description,
        totalTickets: parseInt(totalTickets, 10),
        ticketPrice: parseFloat(ticketPrice),
      });
      Alert.alert('Éxito', 'Sorteo actualizado correctamente.');
      router.back();
    } catch (error) {
      console.error('Error al actualizar el sorteo:', error);
      Alert.alert('Error', 'No se pudo actualizar el sorteo.');
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Manejador para finalizar el sorteo
  const handleFinishRaffle = async () => {
    if (!winningTicket || parseInt(winningTicket) > parseInt(totalTickets)) {
      Alert.alert('Error', 'Debes ingresar un número de boleto ganador valido.');
      return;
    }
    setIsLoading(true);
    try {
      await updateRaffle({
        id: id as Id<'raffles'>,
        status: 'finished',
        winningTicketNumber: parseInt(winningTicket, 10),
      });
      Alert.alert('Éxito', '¡Sorteo finalizado! Se ha asignado el ganador.');
      router.back();
    } catch (error) {
      console.error('Error al finalizar el sorteo:', error);
      Alert.alert('Error', 'No se pudo finalizar el sorteo.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Renderizado del componente ---

  if (raffle === undefined) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  if (raffle === null) {
    return <Text>Sorteo no encontrado.</Text>;
  }

  return (
    // Usamos `bg-gray-50` para un fondo suave y `flex-1` para que ocupe toda la pantalla.
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="p-5"
        contentContainerStyle={{ paddingBottom: 40 }}>
        <Stack.Screen options={{ title: `Editando: ${raffle.title}` }} />

        {/* Grupo de campos del formulario para mejor estructura y espaciado */}
        <View className="mb-4">
          <Text className="text-base font-semibold mb-2 text-gray-700">Título</Text>
          <TextInput className="bg-white h-12 border border-gray-300 rounded-lg px-4 text-base" value={title} onChangeText={setTitle} />
        </View>

        <View className="mb-4">
          <Text className="text-base font-semibold mb-2 text-gray-700">Descripción</Text>
          <TextInput className="bg-white h-28 border border-gray-300 rounded-lg px-4 text-base align-top pt-3" value={description} onChangeText={setDescription} multiline />
        </View>

        <View className="mb-4">
          <Text className="text-base font-semibold mb-2 text-gray-700">Precio del Boleto</Text>
          <TextInput className="bg-white h-12 border border-gray-300 rounded-lg px-4 text-base" value={ticketPrice} onChangeText={setTicketPrice} keyboardType="decimal-pad" />
        </View>

        <View className="mb-6">
          <Text className="text-base font-semibold mb-2 text-gray-700">Número Total de Boletos</Text>
          <TextInput className="bg-white h-12 border border-gray-300 rounded-lg px-4 text-base" value={totalTickets} onChangeText={setTotalTickets} keyboardType="number-pad" />
        </View>

        {/* Botón personalizado con TouchableOpacity para un mejor estilo y estado de carga */}
        <Pressable
          // active:opacity-80 simula el efecto de TouchableOpacity con NativeWind
          className="bg-blue-600 py-3 rounded-lg flex-row justify-center items-center disabled:opacity-50 active:opacity-80"
          onPress={handleSaveChanges}
          disabled={isLoading}>
          {isLoading && raffle.status !== 'finished' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Guardar Cambios</Text>
          )}
        </Pressable>

        {/* Sección para finalizar el sorteo */}
        {raffle.status !== 'finished' && (
          <View className="mt-10 pt-6 border-t border-gray-200">
            <Text className="text-xl font-bold mb-5 text-center text-gray-800">Finalizar Sorteo</Text>
            <View className="mb-4">
              <Text className="text-base font-semibold mb-2 text-gray-700">Número de Boleto Ganador</Text>
              <TextInput
                className="bg-white h-12 border border-gray-300 rounded-lg px-4 text-base"
                placeholder="Ej: 123"
                value={winningTicket}
                onChangeText={setWinningTicket}
                keyboardType="number-pad"
              />
            </View>
            <Pressable
              className="bg-red-600 py-3 rounded-lg flex-row justify-center items-center disabled:opacity-50 active:opacity-80"
              onPress={handleFinishRaffle}
              disabled={isLoading}>
              {isLoading && raffle.status !== 'finished' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-lg">Finalizar y Asignar Ganador</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Mostrar información si el sorteo ya está finalizado */}
        {raffle.status === 'finished' && (
          <View className="mt-10 p-5 bg-green-100 border border-green-200 rounded-lg items-center">
            <Text className="text-lg font-bold text-green-800 mb-2">Sorteo Finalizado</Text>
            <Text className="text-base text-green-700">
              El boleto ganador es el número:
              <Text className="font-extrabold"> {raffle.winningTicketNumber}</Text>
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditRafflePage;