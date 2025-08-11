import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

const NumberCircle = ({ number, isSelected, isBought, onSelect }: { number: number, isSelected: boolean, isBought: boolean, onSelect: (num: number) => void }) => {
  // Define los estilos basados en el estado del número
  const circleClassName = isBought
    ? 'bg-slate-200 border-slate-300' // Estilo para números comprados
    : isSelected
      ? 'bg-indigo-600 border-indigo-700' // Estilo para números seleccionados por el usuario
      : 'bg-white border-gray-200 active:opacity-70'; // Estilo para números disponibles

  const textClassName = isBought
    ? 'text-gray-500'
    : isSelected
      ? 'text-white'
      : 'text-gray-700';

  return (
    <Pressable
      onPress={() => onSelect(number)}
      disabled={isBought} // Deshabilita el botón si el número ya fue comprado
      className={`
                w-14 h-14 rounded-full items-center justify-center m-1 border-2
                ${circleClassName}
            `}
    >
      <Text
        className={`
                    font-quicksand-bold text-lg
                    ${textClassName}
                `}
      >
        {number.toString().padStart(3, '0')}
      </Text>
    </Pressable>
  );
};

type TableNumbersProps = {
  totalTickets: number;
  ticketPrice: number;
  raffleId: Id<'raffles'>;
  nonAvailableTickets: { ticketNumber: number; status: 'sold' | 'reserved' }[];
};

const TableNumbers = ({ totalTickets, ticketPrice, raffleId, nonAvailableTickets }: TableNumbersProps) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isReserving, setIsReserving] = useState(false);
  const router = useRouter();
  const reserveTickets = useMutation(api.tickets.reserveTickets);

  // Usamos useMemo para evitar recalcular el Set en cada render, y para estabilizar la referencia para useCallback.
  const nonAvailableSet = useMemo(() => new Set(nonAvailableTickets.map(t => t.ticketNumber)), [nonAvailableTickets]);
  const numbers = Array.from({ length: totalTickets }, (_, i) => i + 1);

  const handleSelectNumber = useCallback((number: number) => {
    if (nonAvailableSet.has(number)) return;

    setSelectedNumbers(prevSelected =>
      prevSelected.includes(number)
        ? prevSelected.filter(n => n !== number)
        : [...prevSelected, number]
    );
  }, [nonAvailableSet]); // La función solo se recreará si los boletos no disponibles cambian.

  const handlePurchase = async () => {
    if (selectedNumbers.length === 0) {
      Toast.show({ type: 'error', text1: 'Sin selección', text2: 'Por favor, selecciona al menos un número para reservar.' });
      return;
    }

    setIsReserving(true);
    try {
      const result = await reserveTickets({
        raffleId: raffleId,
        ticketNumbers: selectedNumbers,
      });

      Toast.show({
        type: 'success',
        text1: '¡Boletos reservados!',
        text2: 'Toca para ir al pago.',
        onPress: () => router.push(`/purchase/${result.purchaseId}`),
        visibilityTime: 6000,
        swipeable: true,
        position: 'bottom',
      });
      setSelectedNumbers([]); // Limpiar selección

    } catch (error: any) {
      console.error("Error al reservar boletos:", error);
      Toast.show({ type: 'error', text1: 'Error', text2: error.data?.message || 'No se pudieron reservar los boletos. Alguien pudo haberlos tomado antes que tú.' });
    } finally {
      setIsReserving(false);
    }
  };

  const totalAmount = selectedNumbers.length * ticketPrice;
  const formattedAmount = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalAmount);

  return (
    <View className="w-full px-2 py-4 bg-slate-100 rounded-lg shadow-inner">
      <Text className="text-2xl font-quicksand-bold text-center mb-4 text-slate-800">
        Selecciona tus Números
      </Text>
      <FlatList
        data={numbers}
        renderItem={({ item }) => (
          <NumberCircle
            number={item}
            isSelected={selectedNumbers.includes(item)}
            isBought={nonAvailableSet.has(item)}
            onSelect={handleSelectNumber}
          />
        )}
        keyExtractor={item => item.toString()}
        numColumns={5} // 5 columnas se ven bien en la mayoría de móviles
        columnWrapperStyle={{ justifyContent: 'center' }}
        contentContainerStyle={{ alignItems: 'center' }}
      />
      <View className="mt-6 px-4">
        <Pressable
          onPress={handlePurchase}
          disabled={selectedNumbers.length === 0 || isReserving}
          className={`
                        p-4 rounded-xl items-center justify-center transition-colors h-16
                        ${selectedNumbers.length > 0 ? 'bg-green-500 active:bg-green-600' : 'bg-slate-400'}
                        disabled:opacity-60
                    `}
        >
          {isReserving ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="items-center">
              <Text className="text-white font-quicksand-bold text-lg">
                Reservar {selectedNumbers.length > 0 ? `${selectedNumbers.length} Número(s)` : ''}
              </Text>
              {selectedNumbers.length > 0 && (
                <Text className="text-white font-quicksand-medium text-sm">
                  Total: {formattedAmount}
                </Text>
              )}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default TableNumbers;