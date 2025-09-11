// app/raffles/[id].tsx o similar

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { formatUtcToLocal } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // Importar useNavigation
import { useMutation, useQuery } from 'convex/react';
import * as Linking from 'expo-linking';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Clipboard, Dimensions, FlatList, Image, Modal, Pressable, Share, Switch, Text, TextInput, View } from 'react-native'; // Importar FlatList
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
      <Text className={`font-quicksand-bold text-base ${styles.text}`}>{number.toString().padStart(3, '0')}</Text>
    </Pressable>
  );
});

// 4. Componente principal de la pantalla
export default function RaffleDetailsScreen() {
  const { raffleId } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation(); // Obtener el objeto de navegación
  const [selectedTickets, setSelectedTickets] = useState(new Set<number>());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false); // Nuevo estado para el modal de confirmación
  const [isDeletingRaffle, setIsDeletingRaffle] = useState(false); // Estado para la carga de eliminación
  const [showFinishRaffleModal, setShowFinishRaffleModal] = useState(false); // Nuevo estado para el modal de finalizar
  const [winningTicketNumberInput, setWinningTicketNumberInput] = useState(''); // Estado para el número ganador
  const [isFinalizingRaffle, setIsFinalizingRaffle] = useState(false); // Estado para la carga de finalización


  // Hooks de Convex
  const raffle = useQuery(api.raffles.getById, { id: raffleId as Id<'raffles'> });
  const enabledPurchases = raffle?.enabledPurchases
  const setRafflePurchasesEnabled = useMutation(api.admin.setRafflePurchasesEnabled);
  const deleteRaffleMutation = useMutation(api.raffles.deleteRaffle); // Mutación de borrado
  const finishRaffleMutation = useMutation(api.raffles.finishRaffle); // Nueva mutación para finalizar sorteo

  // Obtenemos el documento del usuario actual desde Convex para poder comparar su ID.
  const currentUser = useQuery(api.users.getCurrent);

  // Comprobamos si el usuario actual es el creador de la rifa.
  const isCreator = useMemo(() => currentUser && raffle && currentUser._id === raffle.creatorId, [currentUser, raffle]);
  const isRaffleActive = raffle?.status === 'active';
  const isRaffleFinished = raffle?.status === 'finished';

  const nonAvailableTickets = useQuery(api.tickets.getNonAvailableTickets, { raffleId: raffleId as Id<'raffles'> });
  const reserveTicketsMutation = useMutation(api.tickets.reserveTickets);

  const paymentMethods = useQuery(api.admin.getPaymentMethods, raffle?.creatorId ? { ownerId: raffle.creatorId } : 'skip');

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // --- Lógica del modal de confirmación de eliminación ---
  const openDeleteModal = () => setShowDeleteConfirmationModal(true);
  const closeDeleteModal = () => setShowDeleteConfirmationModal(false);

  const handleDeleteRaffle = async () => {
    if (!raffle?._id) return; // Asegurarse de que tenemos un ID de rifa

    setIsDeletingRaffle(true);
    try {
      await deleteRaffleMutation({ id: raffle._id });
      Toast.show({
        type: 'success',
        text1: 'Éxito',
        text2: 'El sorteo ha sido eliminado correctamente.',
      });
      router.replace('/(tabs)/(home)'); // Redirigir al inicio después de eliminar
    } catch (error: any) {
      console.error("Error deleting raffle:", error);
      Toast.show({
        type: 'error',
        text1: 'Error al eliminar',
        text2: error.message || 'No se pudo eliminar el sorteo. Inténtalo de nuevo.',
      });
    } finally {
      setIsDeletingRaffle(false);
      closeDeleteModal(); // Cerrar el modal siempre
    }
  };
  // -- Fin lógica del modal de eliminación ---

  // --- Lógica del modal de finalización de sorteo ---
  const openFinishRaffleModal = () => setShowFinishRaffleModal(true);
  const closeFinishRaffleModal = () => {
    setShowFinishRaffleModal(false);
    setWinningTicketNumberInput(''); // Limpiar input al cerrar
  };

  const handleFinishRaffle = async () => {
    if (!raffle?._id) return;

    const winningNumber = parseFloat(winningTicketNumberInput);
    if (isNaN(winningNumber) || winningNumber <= 0 || winningNumber > (raffle?.totalTickets || 0)) {
      Toast.show({ type: 'error', text1: 'Número de boleto inválido', text2: 'Ingresa un número válido dentro del rango de boletos.' });
      return;
    }

    setIsFinalizingRaffle(true);
    try {
      await finishRaffleMutation({ id: raffle._id, winningTicketNumber: winningNumber });
      Toast.show({
        type: 'success',
        text1: 'Sorteo Finalizado',
        text2: `¡El sorteo ha terminado! Ganador: #${winningTicketNumberInput}`,
      });
      // No redirigimos, solo se actualiza el estado local de la rifa si es necesario
    } catch (error: any) {
      console.error("Error finalizing raffle:", error);
      Toast.show({
        type: 'error',
        text1: 'Error al finalizar',
        text2: error.message || 'No se pudo finalizar el sorteo. Inténtalo de nuevo.',
      });
    } finally {
      setIsFinalizingRaffle(false);
      closeFinishRaffleModal();
    }
  };
  // -- Fin lógica del modal de finalización ---

  // --- Funciones para compartir y copiar ---
  const generateShareUrl = useCallback(() => {
    if (!raffle?.customRaffleId) return '';
    // Creamos una URL que incluye tanto web como deep link
    return `https://milsorteos.app/sorteo/${raffle.customRaffleId}`;
  }, [raffle?.customRaffleId]);

  const generateDeepLink = useCallback(() => {
    if (!raffle?.customRaffleId) return '';
    return `milsorteos://sorteo/${raffle.customRaffleId}`;
  }, [raffle?.customRaffleId]);

  const generateShareMessage = useCallback(() => {
    if (!raffle) return '';
    const webUrl = generateShareUrl();

    return `🎉 ¡Participa en este sorteo increíble!

📝 ${raffle.title}
🎁 Premio: ${typeof raffle.prize === 'number'
        ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(raffle.prize)
        : raffle.prize}
📅 Fecha del sorteo: ${raffle.endTime ? formatUtcToLocal(raffle.endTime, "d 'de' MMMM, yyyy") : 'Próximamente'}

🔗 Abre el sorteo: ${webUrl}

¡No te lo pierdas! 🍀✨`;
  }, [raffle, generateShareUrl]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      if (!raffle?.customRaffleId) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'ID de sorteo no disponible para copiar.',
        });
        return;
      }
      Clipboard.setString(raffle.customRaffleId);
      Toast.show({
        type: 'success',
        text1: 'ID Copiado',
        text2: `${raffle.customRaffleId} copiado al portapapeles`,
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo copiar el ID al portapapeles',
      });
    }
  }, [raffle?.customRaffleId]);

  const handleShare = useCallback(async () => {
    try {
      const message = generateShareMessage();

      const result = await Share.share({
        message: message,
        title: `Sorteo: ${raffle?.title}`,
      });

      if (result.action === Share.sharedAction) {
        // Usuario compartió exitosamente
        Toast.show({
          type: 'success',
          text1: 'Compartido',
          text2: 'Sorteo compartido exitosamente',
        });
      }

    } catch (error: any) {
      console.error('Error sharing:', error);
      // Fallback: copiar al portapapeles
      try {
        Clipboard.setString(generateShareMessage());
        Toast.show({
          type: 'info',
          text1: 'Copiado al portapapeles',
          text2: 'Se copió el texto como alternativa',
        });
      } catch (clipboardError) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No se pudo compartir el sorteo',
        });
      }
    }
  }, [raffle?.title, generateShareMessage]);
  // -- Fin funciones de compartir y copiar ---

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

  // Preparamos los datos para FlatList, asegurando que se ejecute incondicionalmente
  const allTicketsNumbers = useMemo(() => Array.from({ length: raffle?.totalTickets || 0 }, (_, i) => i + 1), [raffle?.totalTickets]);

  // RenderItem para FlatList, asegurando que se ejecute incondicionalmente
  const renderTicket = useCallback(({ item: number }: { item: number }) => (
    <Ticket
      key={number}
      number={number}
      status={ticketStatusMap.get(number) || 'available'}
      isSelected={selectedTickets.has(number)}
      onPress={() => handleTicketPress(number)}
    />
  ), [selectedTickets, ticketStatusMap, handleTicketPress]);

  useLayoutEffect(() => {
    if (raffle) {
      navigation.setOptions({
        title: 'Sorteo',
        headerRight: () => (
          isCreator && raffle ? (
            <View className="flex-row items-center">
              {/* Botón de editar */}
              <Pressable
                onPress={() => router.push(`/(tabs)/(raffles)/edit/${raffle._id}`)}
                className="mr-2 p-3 rounded-xl bg-gray-100 active:bg-gray-200"
              >
                <Ionicons name="pencil-outline" size={20} color="#64748b" />
              </Pressable>

              {/* Botón de eliminar */}
              <Pressable
                onPress={openDeleteModal}
                className="p-3 rounded-xl bg-gray-100 active:bg-gray-200"
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </Pressable>
            </View>
          ) : null
        ),
      });
    }
  }, [raffle, isCreator, openDeleteModal]);

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

    // Revisamos en el frontend ANTES de llamar al backend.
    if (!currentUser?._id) { // Usamos currentUser para verificar si está logueado
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
        text1: `Tus boletos han sido reservados por ${raffle?.releaseTime} minutos.`,
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

  // Nueva constante para el padding del footer flotante
  const FLOATING_FOOTER_HEIGHT = 120; // Aproximadamente la altura del botón de reserva + padding

  const RaffleDetailsHeader = () => (
    <View className="mb-4">
      {/* Sección de la imagen principal y superposición de título/premio */}
      {raffle?.imageUrl && (
        <Pressable className='active-opacity-90 rounded-2xl overflow-hidden mx-4 mt-4 shadow-sm shadow-slate-300/50' onPress={() => setIsImageModalVisible(true)}>
          <Image source={{ uri: raffle.imageUrl }} className="w-full h-48 bg-slate-200" resizeMode="cover" />
          <View className="absolute bottom-0 left-0 right-0 p-3 bg-black/40">
            <Text className="text-white font-quicksand-bold text-lg" numberOfLines={1}>{raffle.title}</Text>
            <Text className="text-white font-quicksand-semibold text-sm mt-0.5">Gana {typeof (raffle.prize) === 'number' ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(raffle.prize ?? 0) : raffle.prize}</Text>
          </View>
        </Pressable>
      )}

      {/* Tarjeta destacada para ID del sorteo con botones de copiar y compartir */}
      <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-300/50 mx-4 mt-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-sm font-quicksand-medium text-slate-500 mb-1">ID del Sorteo</Text>
            <Text className="text-xl font-quicksand-bold text-slate-800" numberOfLines={1}>
              {raffle.customRaffleId}
            </Text>
          </View>
          <View className="flex-row items-center space-x-2">
            {/* Botón para copiar ID */}
            <Pressable
              onPress={handleCopyToClipboard}
              className="p-3 rounded-xl bg-blue-50 border border-blue-100 active:bg-blue-100"
            >
              <Ionicons name="copy-outline" size={20} color="#3b82f6" />
            </Pressable>

            {/* Botón para compartir */}
            <Pressable
              onPress={handleShare}
              className="p-3 rounded-xl bg-green-50 border border-green-100 active:bg-green-100"
            >
              <Ionicons name="share-outline" size={20} color="#22c55e" />
            </Pressable>

            {/* Botón de prueba de deep link (solo para debugging) */}
            {__DEV__ && (
              <Pressable
                onPress={() => {
                  const deepLink = generateDeepLink();
                  console.log('🧪 Probando deep link:', deepLink);
                  Linking.openURL(deepLink).catch(err => {
                    console.error('❌ Error abriendo deep link:', err);
                  });
                }}
                className="p-3 rounded-xl bg-purple-50 border border-purple-100 active:bg-purple-100"
              >
                <Ionicons name="bug-outline" size={20} color="#9333ea" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Tarjeta de Administración de Sorteo (Solo para el creador) */}
      {isCreator && (
        <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-300/50 mx-4 mt-4">
          <Text className="text-sm font-quicksand-medium text-slate-500 mb-3">Administrar Sorteo</Text>
          <View className="flex-row justify-around mb-4 border-b border-slate-200/60 pb-4">
            {/* Botón de editar */}
            <Pressable
              onPress={() => router.push(`/(tabs)/(raffles)/edit/${raffle!._id}`)}
              className="flex-1 mx-1 p-3 rounded-xl bg-gray-100 active:bg-gray-200 flex-row items-center justify-center"
            >
              <Ionicons name="pencil-outline" size={20} color="#64748b" />
              <Text className="text-slate-700 font-quicksand-semibold ml-2">Editar</Text>
            </Pressable>

            {/* Botón de eliminar */}
            <Pressable
              onPress={openDeleteModal}
              className="flex-1 mx-1 p-3 rounded-xl bg-red-500 active:bg-red-600 flex-row items-center justify-center"
            >
              <Ionicons name="trash-outline" size={20} color="white" />
              <Text className="text-white font-quicksand-semibold ml-2">Eliminar</Text>
            </Pressable>
          </View>

          {/* Habilitar compras */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-200/60 mt-4">
            <View className="flex-row items-center">
              <Ionicons name="cart-outline" size={18} color="#64748b" />
              <Text className="ml-2 text-base font-quicksand-bold text-slate-800">Habilitar compras</Text>
            </View>
            <Switch
              value={raffle?.enabledPurchases}
              onValueChange={async (next) => {
                try {
                  if (raffle && isCreator) {
                    await setRafflePurchasesEnabled({ raffleId: raffle._id, enabled: next });
                    Toast.show({ type: 'success', text1: 'Actualizado', text2: next ? 'Compras habilitadas' : 'Compras deshabilitadas' });
                  }
                } catch (e) {
                  Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo actualizar el estado.' });
                }
              }}
              thumbColor={raffle?.enabledPurchases ? '#4f46e5' : undefined}
            />
          </View>
          <Text className="text-xs text-slate-500 mt-2 mb-4">Si las deshabilitas, los usuarios no podrán reservar/comprar boletos temporalmente.</Text>

          {/* Ver Ventas */}
          <Link href={`/(tabs)/(home)/${raffle!._id}/sales`} asChild>
            <Pressable className="flex-row items-center bg-indigo-500 px-4 py-2 rounded-xl shadow-md shadow-indigo-500/30 active:opacity-80 justify-center w-full mt-3">
              <Ionicons name="stats-chart-outline" size={18} color="white" />
              <Text className="text-white font-quicksand-bold text-sm ml-2">Ver Ventas</Text>
            </Pressable>
          </Link>

          {/* Ver Pagos */}
          <Link href={`/(tabs)/(home)/${raffle!._id}/payment-methods`} asChild>
            <Pressable className="flex-row items-center bg-blue-500 px-4 py-2 rounded-xl shadow-md shadow-blue-500/30 active:opacity-80 justify-center w-full mt-3">
              <Ionicons name="card-outline" size={18} color="white" />
              <Text className="text-white font-quicksand-bold text-sm ml-2">Ver Pagos</Text>
            </Pressable>
          </Link>

          {/* Finalizar Sorteo */}
          {isCreator && isRaffleActive && (
            <Pressable
              onPress={openFinishRaffleModal}
              className="flex-row items-center bg-green-500 px-4 py-2 rounded-xl shadow-md shadow-green-500/30 active:opacity-80 justify-center w-full mt-3"
            >
              <Ionicons name="trophy-outline" size={18} color="white" />
              <Text className="text-white font-quicksand-bold text-sm ml-2">Finalizar Sorteo</Text>
            </Pressable>
          )}
          {isCreator && isRaffleFinished && raffle.winningTicketNumber !== undefined && (
            <View className="bg-green-100 border border-green-200/80 p-3 rounded-xl mt-3">
              <Text className="text-green-800 font-quicksand-bold text-sm">Sorteo Finalizado</Text>
              <Text className="text-green-700 font-quicksand-medium text-xs mt-1">Ganador: Boleto #{raffle.winningTicketNumber?.toString().padStart(3, '0')}</Text>
            </View>
          )}
        </View>
      )}

      {/* Tarjeta de información principal (Fecha, Condición, Descripción) */}
      <View className="bg-white mx-4 p-4 rounded-2xl shadow-sm shadow-slate-300/50 mt-4">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-4">
            <Text className="text-sm font-quicksand-medium text-slate-500">Fecha del sorteo</Text>
            <Text className="text-base font-quicksand-bold text-slate-800">{raffle?.endTime ? formatUtcToLocal(raffle.endTime, "d 'de' MMMM, yyyy") : 'N/A'}</Text>
          </View>
        </View>
        {raffle?.winCondition && (
          <View className="mb-3">
            <Text className="text-sm font-quicksand-medium text-slate-500">Condición de ganar</Text>
            <Text className="text-base text-slate-700 mt-1">{raffle.winCondition}</Text>
          </View>
        )}
        {raffle?.description && (
          <View className="border-t border-slate-200/60 pt-3 mt-3">
            <Text className="text-sm font-quicksand-medium text-slate-500">Descripción</Text>
            <Text className="text-base text-slate-700 mt-1" numberOfLines={4}>{raffle.description}</Text>
          </View>
        )}
      </View>
      <ColorLegend />
    </View>
  );

  return (
    <SafeAreaView className="flex-1" edges={['left', 'right', 'bottom']}>
      <FlatList
        ListHeaderComponent={RaffleDetailsHeader}
        data={allTicketsNumbers}
        renderItem={renderTicket}
        keyExtractor={(item) => item.toString()}
        numColumns={5}
        initialNumToRender={20}
        windowSize={10}
        maxToRenderPerBatch={100}
        updateCellsBatchingPeriod={0}
        columnWrapperStyle={{ justifyContent: 'center', flexWrap: 'wrap' }}
        contentContainerStyle={{ paddingHorizontal: 2.5, paddingBottom: FLOATING_FOOTER_HEIGHT }}
      />

      {/* Modal for Image Zoom */}
      {raffle?.imageUrl && (
        <Modal
          visible={isImageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsImageModalVisible(false)}
        >
          <View className="flex-1 bg-black/80 justify-center items-center">
            <Image source={{ uri: raffle.imageUrl }} style={{ width: screenWidth, height: screenHeight }} resizeMode="contain" />
            <Pressable className="absolute top-12 right-5 bg-black/50 p-2 rounded-full" onPress={() => setIsImageModalVisible(false)}>
              <Ionicons name="close" size={28} color="white" />
            </Pressable>
          </View>
        </Modal>
      )}
      {/* boton para reservar boletos */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <View className="mx-4 bg-white rounded-2xl border border-slate-200 shadow-lg p-3">
          {!currentUser?._id ? (
            <Pressable onPress={() => router.push('/(auth)/sign-in')} className="bg-primary rounded-xl py-3 items-center active:opacity-80">
              <Text className="text-white font-quicksand-bold">Iniciar sesión</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleReserve}
              disabled={isProcessing || selectedTickets.size === 0 || enabledPurchases === false}
              className={`rounded-xl py-3 items-center active:opacity-80 disabled:opacity-50 ${enabledPurchases === false ? 'bg-slate-300' : 'bg-primary'}`}
            >
              <Text className="text-white font-quicksand-bold">
                {enabledPurchases === false
                  ? 'Compras deshabilitadas'
                  : isProcessing
                    ? 'Procesando...'
                    : selectedTickets.size > 0
                      ? `Reservar ${selectedTickets.size} boletos`
                      : 'Selecciona boletos para continuar'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
      {/* Custom Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteConfirmationModal}
        onRequestClose={closeDeleteModal}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
            <Text className="text-xl font-quicksand-bold text-slate-800 mb-4">Eliminar Sorteo</Text>
            <Text className="text-base font-quicksand-medium text-slate-600 mb-6">¿Estás seguro de que quieres eliminar este sorteo? Esta acción no se puede deshacer.</Text>
            <View className="flex-row justify-end space-x-3">
              <Pressable
                onPress={closeDeleteModal}
                disabled={isDeletingRaffle}
                className="px-5 py-3 rounded-xl active:opacity-80 disabled:opacity-50"
              >
                <Text className="text-slate-600 font-quicksand-semibold">Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteRaffle}
                disabled={isDeletingRaffle}
                className="bg-red-500 px-5 py-3 rounded-xl active:bg-red-600 disabled:bg-red-300 flex-row items-center justify-center"
              >
                {isDeletingRaffle ? <ActivityIndicator color="white" /> : <Text className="text-white font-quicksand-bold">Eliminar</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Finish Raffle Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showFinishRaffleModal}
        onRequestClose={closeFinishRaffleModal}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
            <Text className="text-xl font-quicksand-bold text-slate-800 mb-4">Finalizar Sorteo</Text>
            <Text className="text-base font-quicksand-medium text-slate-600 mb-4">Ingresa el número del boleto ganador para finalizar este sorteo.</Text>
            <TextInput
              className="border border-slate-300 rounded-xl p-3 text-base text-slate-700 mb-6"
              placeholder="Ej: 123 (número del boleto ganador)"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={winningTicketNumberInput}
              onChangeText={setWinningTicketNumberInput}
            />
            <View className="flex-row justify-end space-x-3">
              <Pressable
                onPress={closeFinishRaffleModal}
                disabled={isFinalizingRaffle}
                className="px-5 py-3 rounded-xl active:opacity-80 disabled:opacity-50"
              >
                <Text className="text-slate-600 font-quicksand-semibold">Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleFinishRaffle}
                disabled={isFinalizingRaffle}
                className="bg-green-500 px-5 py-3 rounded-xl active:bg-green-600 disabled:bg-green-300 flex-row items-center justify-center"
              >
                {isFinalizingRaffle ? <ActivityIndicator color="white" /> : <Text className="text-white font-quicksand-bold">Finalizar</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
