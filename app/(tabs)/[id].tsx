// app/raffles/[id].tsx o similar

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useUser } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

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
  // const soldTickets = useMutation(api.tickets.soldTickets);

  // 1. Importamos useUser para saber si el usuario está logueado.
  const { isSignedIn } = useUser();

  // Hooks de Convex
  const raffle = useQuery(api.raffles.getById, { id: id as Id<'raffles'> });
  const nonAvailableTickets = useQuery(api.tickets.getNonAvailableTickets, { raffleId: id as Id<'raffles'> });
  const reserveTicketsMutation = useMutation(api.tickets.reserveTickets);

  useEffect(() => {
    // Cuando el ID de la rifa cambia (al navegar entre diferentes rifas),
    // limpiamos los boletos seleccionados. Esto asegura que la selección
    // de una rifa no se "filtre" a la siguiente que se visite.
    setSelectedTickets(new Set());
  }, [id]);

  // Sincroniza la selección local con el estado del servidor.
  // Si un boleto seleccionado deja de estar disponible, se elimina de la selección.
  useEffect(() => {
    if (selectedTickets.size === 0 || !nonAvailableTickets) {
      return; // No hay nada que sincronizar
    }

    const nonAvailableSet = new Set(nonAvailableTickets.map(t => t.ticketNumber));
    let selectionUpdated = false;

    // Creamos una copia para poder modificarla
    const updatedSelectedTickets = new Set(selectedTickets);

    for (const ticketNumber of updatedSelectedTickets) {
      if (nonAvailableSet.has(ticketNumber)) {
        // Este boleto fue tomado por otro usuario, lo eliminamos de la selección local.
        updatedSelectedTickets.delete(ticketNumber);
        selectionUpdated = true;
      }
    }

    if (selectionUpdated) {
      setSelectedTickets(updatedSelectedTickets);
      Toast.show({
        type: 'info',
        text1: 'Algunos boletos ya no están disponibles',
        text2: 'Se han quitado de tu selección actual.',
        position: 'bottom',
      });
    }
  }, [nonAvailableTickets]); // Este efecto se ejecuta cada vez que la lista de boletos no disponibles cambia.

  // Memoizamos el mapa de estados para un rendimiento óptimo.
  // Se recalcula solo cuando `nonAvailableTickets` cambia.
  const ticketStatusMap = useMemo(() => {
    // Creamos un mapa que SOLO contendrá los boletos vendidos o reservados.
    const map = new Map<number, 'sold' | 'reserved'>();
    if (nonAvailableTickets) {
      for (const ticket of nonAvailableTickets) {
        // Ignoramos cualquier otro estado como 'expired', ya que no es relevante para esta pantalla.
        if (ticket.status === 'sold' || ticket.status === 'reserved') {
          map.set(ticket.ticketNumber, ticket.status);
        }
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

    // 2. Lógica mejorada: revisamos en el frontend ANTES de llamar al backend.
    if (!isSignedIn) {
      Toast.show({
        type: 'error',
        text1: 'Acción Requerida',
        text2: 'Debes iniciar sesión para reservar boletos.'
      });
      return; // Detenemos la ejecución aquí.
    }
    setIsReserving(true);
    try {
      const result = await reserveTicketsMutation({
        raffleId: id as Id<'raffles'>,
        ticketNumbers: Array.from(selectedTickets),
      });
      Toast.show({
        type: 'success',
        text1: 'Tus boletos han sido reservados por 30 minutos.',
        text2: 'Toca para ir al pago.',
        onPress: () => router.push(`/purchase/${result.purchaseId}`),
        position: 'bottom',
        swipeable: true,
        visibilityTime: 8000,
        text1Style: {
          fontSize: 12,
          color: '#444'
        },
        text2Style: {
          color: '#777'
        },
      })
      setSelectedTickets(new Set());
    } catch (error: any) {
      // 3. En el catch, manejamos el error del backend como un respaldo.
      // Esto se activará si la sesión expira entre que la app carga y el usuario presiona el botón.
      const errorMessage = error.data?.message || error.message || "No se pudieron reservar los boletos. Intenta de nuevo.";
      Toast.show({
        type: "error",
        text1: "Ocurrió un error",
        text2: errorMessage,
      });
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <SafeAreaView className='flex-1 mb-10'>
      <ScrollView className="flex-1 bg-gray-50">
        {raffle.imageUrl && <Image source={{ uri: raffle.imageUrl }} className="w-full h-56" resizeMode="cover" />}
        <View className="p-5 bg-white border-b border-gray-200 -mt-4 rounded-t-2xl">
          <View className='flex-row items-center justify-between'>
            <Text className="text-2xl font-quicksand-bold text-gray-800">{raffle.title}</Text>
            <Text className="text-3xl  font-quicksand-bold text-primary mt-2">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(raffle.prize ?? 0)} </Text>
          </View>
          <Text className="text-base text-gray-600 mt-2">{raffle.description}</Text>
          <Text className="text-base text-gray-600 mt-2">{raffle.winCondition}</Text>
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
          {isSignedIn ? (
            <Pressable
              onPress={handleReserve}
              disabled={isReserving || selectedTickets.size === 0}
              className="bg-primary p-4 rounded-lg items-center active:opacity-80 disabled:opacity-50"
            >
              <Text className="text-white font-quicksand-bold text-lg">
                {isReserving ? 'Procesando...' : `Reservar ${selectedTickets.size} Boletos`}
              </Text>
            </Pressable>
          ) : (
            <View className="bg-slate-100 p-4 rounded-lg items-center border border-slate-200">
              <Text className="text-slate-600 font-quicksand-semibold text-center mb-3">Debes iniciar sesión para poder comprar boletos.</Text>
              <Pressable onPress={() => router.push('/(auth)/sign-in')} className="bg-primary px-8 py-2.5 rounded-lg active:opacity-80">
                <Text className="text-white font-quicksand-bold">Iniciar Sesión</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
