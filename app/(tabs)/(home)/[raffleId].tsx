// app/raffles/[id].tsx o similar

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { formatUtcToLocal } from '@/utils/date';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { SnapbackZoom } from 'react-native-zoom-toolkit';

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
  const { raffleId } = useLocalSearchParams();
  const router = useRouter();
  const [selectedTickets, setSelectedTickets] = useState(new Set<number>());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  // const soldTickets = useMutation(api.tickets.soldTickets);

  // 1. Importamos useUser para saber si el usuario está logueado.
  const { isSignedIn } = useUser();
  const settings = useQuery(api.admin.getSettings);

  // Hooks de Convex
  const raffle = useQuery(api.raffles.getById, { id: raffleId as Id<'raffles'> });
  const nonAvailableTickets = useQuery(api.tickets.getNonAvailableTickets, { raffleId: raffleId as Id<'raffles'> });
  const reserveTicketsMutation = useMutation(api.tickets.reserveTickets);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  useEffect(() => {
    // Cuando el ID de la rifa cambia (al navegar entre diferentes rifas),
    // limpiamos los boletos seleccionados. Esto asegura que la selección
    // de una rifa no se "filtre" a la siguiente que se visite.
    setSelectedTickets(new Set());
  }, [raffleId]);

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
        type: 'warning',
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
    setIsProcessing(true);
    try {
      const result = await reserveTicketsMutation({
        raffleId: raffleId as Id<'raffles'>,
        ticketNumbers: Array.from(selectedTickets),
      });
      Toast.show({
        type: 'success',
        text1: 'Tus boletos han sido reservados por 30 minutos.',
        text2: 'Toca para ir al pago.',
        onPress: () => router.push(`/(purchases)/${result.purchaseId}`),
        position: 'bottom',
        swipeable: true,
        visibilityTime: 5000,
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
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView className="flex-1 bg-gray-50 relative">
        {/* Hero con overlay */}
        <View>
          {raffle.imageUrl && (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setIsImageModalVisible(true)}>
              <Image source={{ uri: raffle.imageUrl }} className="w-full h-56 bg-slate-200" resizeMode="cover" />
              <View className="absolute bottom-0 left-0 right-0 p-4 bg-black/40">
                <Text className="text-white font-quicksand-bold text-xl" numberOfLines={1}>{raffle.title}</Text>
                <Text className="text-white font-quicksand-semibold text-sm mt-1">Gana {typeof (raffle.prize) === 'number' ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(raffle.prize ?? 0) : raffle.prize}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        <View className="p-5 bg-white border-b border-gray-200 -mt-2 rounded-t-2xl">
          <Text className="text-base text-gray-600">Fecha: {formatUtcToLocal(raffle.endTime, "d 'de' MMMM")}</Text>
          {raffle.winCondition ? (
            <Text className="text-sm text-gray-500 mt-2">{raffle.winCondition}</Text>
          ) : null}
        </View>

        <ColorLegend />

        <View className="flex-row flex-wrap justify-center p-2.5 pb-20">
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
      </ScrollView>

      {/* Modal for Image Zoom */}
      {raffle.imageUrl && (
        <Modal
          visible={isImageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsImageModalVisible(false)}
        >
          <View className="flex-1 bg-black/80 justify-center items-center">
            <SnapbackZoom onGestureEnd={() => setIsImageModalVisible(false)}>
              <Image source={{ uri: raffle.imageUrl }} style={{ width: screenWidth, height: screenHeight }} resizeMode="contain" />
            </SnapbackZoom>
            <TouchableOpacity className="absolute top-12 right-5 bg-black/50 p-2 rounded-full" onPress={() => setIsImageModalVisible(false)}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <View className="mx-4 bg-white rounded-2xl border border-slate-200 shadow-lg p-3">
          {isSignedIn ? (
            <Pressable
              onPress={handleReserve}
              disabled={isProcessing || selectedTickets.size === 0 || settings?.purchasesEnabled === false}
              className={`rounded-xl py-3 items-center active:opacity-80 disabled:opacity-50 ${settings?.purchasesEnabled === false ? 'bg-slate-300' : 'bg-primary'}`}
            >
              <Text className="text-white font-quicksand-bold">
                {settings?.purchasesEnabled === false
                  ? 'Compras deshabilitadas'
                  : isProcessing
                    ? 'Procesando...'
                    : selectedTickets.size > 0
                      ? `Reservar ${selectedTickets.size} boletos`
                      : 'Selecciona boletos para continuar'}
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push('/(auth)/sign-in')} className="bg-primary rounded-xl py-3 items-center active:opacity-80">
              <Text className="text-white font-quicksand-bold">Iniciar sesión</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
