// app/raffles/[id].tsx o similar

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 1. Define las clases de Tailwind para cada estado del boleto
const TICKET_CLASSES = {
  sold: 'bg-gray-400',      // Gris para boletos vendidos
  reserved: 'bg-primary',   // Naranja (color primario del tema) para reservados
  available: 'bg-green-500',// Verde para disponibles
  selected: 'bg-blue-500',  // Azul para seleccionados por el usuario
};

// 2. Componente para la leyenda de colores
const ColorLegend = () => (
  <View className="flex-row justify-around p-3 bg-white mx-4 my-3 rounded-lg shadow-md">
    <View className="flex-row items-center">
      <View className={`w-3.5 h-3.5 rounded-full mr-1.5 ${TICKET_CLASSES.available}`} />
      <Text className="text-xs font-quicksand">Disponible</Text>
    </View>
    <View className="flex-row items-center">
      <View className={`w-3.5 h-3.5 rounded-full mr-1.5 ${TICKET_CLASSES.reserved}`} />
      <Text className="text-xs font-quicksand">Reservado</Text>
    </View>
    <View className="flex-row items-center">
      <View className={`w-3.5 h-3.5 rounded-full mr-1.5 ${TICKET_CLASSES.sold}`} />
      <Text className="text-xs font-quicksand">Vendido</Text>
    </View>
    <View className="flex-row items-center">
      <View className={`w-3.5 h-3.5 rounded-full mr-1.5 ${TICKET_CLASSES.selected}`} />
      <Text className="text-xs font-quicksand">Seleccionado</Text>
    </View>
  </View>
);

// 3. Componente de Boleto individual, optimizado para no re-renderizar innecesariamente
const Ticket = React.memo(({ number, status, isSelected, onPress }: {
  number: number;
  status: 'sold' | 'reserved' | 'available';
  isSelected: boolean;
  onPress: () => void;
}) => {
  const bgClass = isSelected ? TICKET_CLASSES.selected : TICKET_CLASSES[status];
  const isPressable = status === 'available';

  return (
    <Pressable
      onPress={isPressable ? onPress : undefined}
      className={`w-16 h-10 justify-center items-center m-1.5 rounded-lg shadow-md ${bgClass} ${!isPressable && 'opacity-70'}`}
      disabled={!isPressable}
    >
      <Text className="text-white font-quicksand-bold text-base">{number.toString().padStart(3, '0')}</Text>
    </Pressable>
  );
});

// 4. Componente principal de la pantalla
export default function RaffleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [selectedTickets, setSelectedTickets] = useState(new Set<number>());
  const [isReserving, setIsReserving] = useState(false);

  // Hooks de Convex
  const raffle = useQuery(api.raffles.getById, { id: id as Id<'raffles'> });
  const nonAvailableTickets = useQuery(api.tickets.getNonAvailableTickets, { raffleId: id as Id<'raffles'> });
  const reserveTicketsMutation = useMutation(api.tickets.reserveTickets);

  // Memoizamos el mapa de estados para un rendimiento óptimo.
  // Se recalcula solo cuando `nonAvailableTickets` cambia.
  const ticketStatusMap = useMemo(() => {
    const map = new Map<number, 'sold' | 'reserved'>();
    if (nonAvailableTickets) {
      for (const ticket of nonAvailableTickets) {
        map.set(ticket.ticketNumber, ticket.status);
      }
    }
    return map;
  }, [nonAvailableTickets]);

  // Manejador para seleccionar/deseleccionar boletos
  const handleTicketPress = useCallback((ticketNumber: number) => {
    setSelectedTickets(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(ticketNumber)) {
        newSelected.delete(ticketNumber);
      } else {
        newSelected.add(ticketNumber);
      }
      return newSelected;
    });
  }, []);

  // Muestra un indicador de carga mientras se obtienen los datos
  if (!raffle || nonAvailableTickets === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#FE8C00" />
        <Text className="mt-2 text-gray-600">Cargando rifa...</Text>
      </View>
    );
  }

  // Manejador para la reserva de boletos
  const handleReserve = async () => {
    if (selectedTickets.size === 0) {
      Alert.alert("Sin selección", "Debes seleccionar al menos un boleto para reservar.");
      return;
    }
    setIsReserving(true);
    try {
      const result = await reserveTicketsMutation({
        raffleId: id as Id<'raffles'>,
        ticketNumbers: Array.from(selectedTickets),
      });
      Alert.alert(
        "¡Boletos Reservados!",
        `Tus boletos han sido reservados por 30 minutos (Compra #${result.purchaseId}). Ve a 'Mis Boletos' para ver los detalles y confirmar tu compra.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
      setSelectedTickets(new Set());
    } catch (error: any) {
      console.error("Error al reservar boletos:", error);
      Alert.alert("Error", error.data?.message || error.message || "No se pudieron reservar los boletos. Es posible que alguien más los haya tomado. Por favor, refresca.");
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <SafeAreaView className='flex-1'>
      <ScrollView className="flex-1 bg-gray-50">
        {raffle.imageUrl && <Image source={{ uri: "https://st3.depositphotos.com/6922808/15355/i/450/depositphotos_153557144-stock-illustration-colombian-money-on-a-white.jpg" }} className="w-full h-56" resizeMode="cover" />}
        <View className="p-5 bg-white border-b border-gray-200 -mt-4 rounded-t-2xl">
          <Text className="text-2xl font-quicksand-bold text-gray-800">{raffle.title}</Text>
          <Text className="text-base text-gray-600 mt-2">{raffle.description}</Text>
        </View>

        <ColorLegend />

        <View className="flex-row flex-wrap justify-center p-2.5">
          {Array.from({ length: raffle.totalTickets }, (_, i) => i + 1).map((number) => (
            <Ticket
              key={number}
              number={number}
              status={ticketStatusMap.get(number) || 'available'}
              isSelected={selectedTickets.has(number)}
              onPress={() => handleTicketPress(number)}
            />
          ))}
        </View>

        <View className="p-5 mt-auto mb-6">
          <Pressable
            onPress={handleReserve}
            disabled={isReserving || selectedTickets.size === 0}
            className="bg-primary p-4 rounded-lg items-center active:opacity-80 disabled:opacity-50"
          >
            <Text className="text-white font-quicksand-bold text-lg">
              {isReserving ? 'Reservando...' : `Reservar ${selectedTickets.size} Boletos`}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
