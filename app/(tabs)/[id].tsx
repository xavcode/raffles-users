// app/raffles/[id].tsx o similar

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 1. Estilos mejorados para los boletos, con mejor contraste y legibilidad
const TICKET_STYLES = {
  sold: {
    container: 'bg-slate-300 border-slate-400',
    text: 'text-slate-500',
  },
  reserved: {
    container: 'bg-amber-400 border-amber-500',
    text: 'text-white',
  },
  available: {
    container: 'bg-white border-slate-300',
    text: 'text-slate-700',
  },
  selected: {
    container: 'bg-indigo-500 border-indigo-600',
    text: 'text-white',
  },
};

// 2. Componente para la leyenda de colores
const ColorLegend = () => (
  <View className="flex-row justify-around p-3 bg-white mx-4 my-3 rounded-lg shadow-sm">
    <View className="flex-row items-center">
      <View className={`w-3.5 h-3.5 rounded-full mr-1.5 border ${TICKET_STYLES.available.container}`} />
      <Text className="text-xs font-quicksand">Disponible</Text>
    </View>
    <View className="flex-row items-center">
      <View className={`w-3.5 h-3.5 rounded-full mr-1.5 ${TICKET_STYLES.reserved.container}`} />
      <Text className="text-xs font-quicksand">Reservado</Text>
    </View>
    <View className="flex-row items-center">
      <View className={`w-3.5 h-3.5 rounded-full mr-1.5 ${TICKET_STYLES.sold.container}`} />
      <Text className="text-xs font-quicksand">Vendido</Text>
    </View>
    <View className="flex-row items-center">
      <View className={`w-3.5 h-3.5 rounded-full mr-1.5 ${TICKET_STYLES.selected.container}`} />
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
  const styles = isSelected ? TICKET_STYLES.selected : TICKET_STYLES[status];
  const isPressable = status === 'available';

  return (
    <Pressable
      onPress={isPressable ? onPress : undefined} // Solo se puede presionar si está disponible
      className={`w-16 h-12 justify-center items-center m-1.5 rounded-lg border ${styles.container} ${!isPressable && 'opacity-70'} active:scale-95 transition-transform`}
      disabled={!isPressable}
    >
      <Text className={`font-quicksand-bold text-lg ${styles.text}`}>{number.toString().padStart(3, '0')}</Text>
    </Pressable>
  );
});

// 4. Componente principal de la pantalla
export default function RaffleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [selectedTickets, setSelectedTickets] = useState(new Set<number>());
  const [isReserving, setIsReserving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const soldTickets = useMutation(api.tickets.soldTickets);

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
  const handleSold = async () => {
    if (selectedTickets.size === 0) {
      Alert.alert("Sin selección", "Debes seleccionar al menos un boleto para comprar.");
      return;
    }
    setIsReserving(true);
    try {
      const result = await soldTickets({
        ticketNumbers: Array.from(selectedTickets),
        raffleId: id as Id<'raffles'>,
      });
      Alert.alert(
        "¡Boletos Comprados!",
        `Felicidades. Compraste los boletos:${Array.from(selectedTickets).join(', ')}. Ve a 'Mis Boletos' para ver los detalles y confirmar tu compra.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
      setSelectedTickets(new Set());
    } catch (error: any) {
      console.error("Error al vender boletos:", error);
      Alert.alert("Error", error.data?.message || error.message || "No se pudieron vender los boletos. Es posible que alguien más los haya tomado. Por favor, refresca.");
    } finally {
      setIsReserving(false);
    }
  }


  return (
    <SafeAreaView className='flex-1'>
      <ScrollView className="flex-1 bg-gray-50">
        {raffle.imageUrl && <Image source={{ uri: raffle.imageUrl }} className="w-full h-56" resizeMode="cover" />}
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
            onPress={() => setIsModalVisible(true)}
            disabled={isReserving || selectedTickets.size === 0}
            className="bg-primary p-4 rounded-lg items-center active:opacity-80 disabled:opacity-50"
          >
            <Text className="text-white font-quicksand-bold text-lg">
              {isReserving ? 'Procesando...' : `Comprar ${selectedTickets.size} Boletos`}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {isModalVisible && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center">
          <View className="bg-white p-6 rounded-lg w-80">
            <Text className="text-lg font-quicksand-bold mb-4">Selecciona un método de pago</Text>
            <Pressable
              onPress={() => {
                setIsModalVisible(false);
                handleSold();
              }}
              className="bg-green-500 p-3 rounded-lg items-center mb-3"
            >
              <Text className="text-white font-quicksand-bold">Pagar con Saldo</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setIsModalVisible(false);
                handleReserve();
              }}
              className="bg-blue-500 p-3 rounded-lg items-center"
            >
              <Text className="text-white font-quicksand-bold">Pagar por Transferencia (Reservar)</Text>
            </Pressable>
            <Pressable
              onPress={() => setIsModalVisible(false)}
              className="mt-4"
            >
              <Text className="text-center text-gray-500">Cancelar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
