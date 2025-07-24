import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useLayoutEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, Text, View } from "react-native";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const NumberCircle = ({ number, isSelected, isBought, onSelect }: { number: number, isSelected: boolean, isBought: boolean, onSelect: (num: number) => void }) => {
  const circleClassName = isBought
    ? 'bg-gray-300 border-gray-400'
    : isSelected
      ? 'bg-primary border-indigo-700'
      : 'bg-white border-gray-200 active:opacity-70';

  const textClassName = isBought ? 'text-gray-500' : isSelected ? 'text-white' : 'text-gray-700';

  return (
    <Pressable
      onPress={() => onSelect(number)}
      disabled={isBought}
      className={`w-14 h-14 rounded-full items-center justify-center m-1 border-2 ${circleClassName}`}
    >
      <Text className={`font-quicksand-bold text-lg ${textClassName}`}>
        {number}
      </Text>
    </Pressable>
  );
};

const RaffleDetail = () => {
  const { id } = useLocalSearchParams<{ id: Id<"raffles"> }>();
  const navigation = useNavigation();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { isSignedIn } = useAuth();

  const raffle = useQuery(
    api.raffles.getById,
    !id ? "skip" : { id: id as Id<"raffles"> }
  );

  const boughtTickets = useQuery(api.tickets.getTicketsByRaffle, !id ? "skip" : { sorteoId: id as Id<"raffles"> });
  // const purchaseTickets = useMutation(api.tickets.purchaseTickets);

  // Usamos useLayoutEffect para actualizar el título del header de forma segura.
  // Esto se ejecuta después de que los datos se cargan, pero antes de que la pantalla se pinte,
  // evitando el warning de Reanimated sobre actualizar el estado durante el render.
  useLayoutEffect(() => {
    navigation.setOptions({
      title: raffle?.title ?? "Cargando...",
      headerBackTitle: "Volver",
    });
  }, [navigation, raffle]);

  const handleSelectNumber = (number: number) => {
    if (boughtTickets?.some(t => t.ticketNumber === number)) return;

    setSelectedNumbers(prevSelected =>
      prevSelected.includes(number)
        ? prevSelected.filter(n => n !== number)
        : [...prevSelected, number]
    );
  };

  const handlePurchase = async () => {
    if (selectedNumbers.length === 0) {
      Alert.alert("Sin selección", "Por favor, selecciona al menos un número para comprar.");
      return;
    }
    if (!id) return;
    if (!isSignedIn) {
      Alert.alert("Acción requerida", "Debes iniciar sesión para poder comprar boletos.");
      return;
    }

    // setIsPurchasing(true);
    // try {
    //   await purchaseTickets({
    //     raffleId: id,
    //     ticketNumbers: selectedNumbers,
    //   });

    //   Alert.alert(
    //     "¡Compra Exitosa!",
    //     `Has comprado los boletos: ${selectedNumbers.sort((a, b) => a - b).join(', ')}`
    //   );
    //   setSelectedNumbers([]); // Limpiar la selección después de la compra
    // } catch (error) {
    //   console.error("Error al comprar boletos:", error);
    //   Alert.alert("Error en la compra", (error as Error).message || "No se pudo completar la compra. Inténtalo de nuevo.");
    // } finally {
    //   setIsPurchasing(false);
    // }
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (raffle === undefined || boughtTickets === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (raffle === null) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-xl font-quicksand-semibold text-gray-500">Sorteo no encontrado.</Text>
      </View>
    );
  }

  const { title, description, imageUrl, prize, ticketPrice, ticketsSold, totalTickets } = raffle;

  const numbers = Array.from({ length: totalTickets }, (_, i) => i + 1);
  const boughtTicketNumbers = boughtTickets?.map(t => t.ticketNumber) ?? [];

  return (
    <FlatList
      data={numbers}
      numColumns={5}
      keyExtractor={(item) => item.toString()}
      contentContainerStyle={{ paddingBottom: 24, backgroundColor: 'white' }}
      columnWrapperStyle={{ justifyContent: 'center', paddingHorizontal: 8 }}
      renderItem={({ item }) => (
        <NumberCircle
          number={item}
          isSelected={selectedNumbers.includes(item)}
          isBought={boughtTicketNumbers.includes(item)}
          onSelect={handleSelectNumber}
        />
      )}
      ListHeaderComponent={() => (
        <>
          <Image source={{ uri: imageUrl }} className="w-full h-64" resizeMode="cover" />
          <View className="p-6">
            <Text className="text-3xl font-quicksand-bold text-gray-800 mb-2">{title}</Text>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-2xl font-quicksand-bold text-primary">{formatCurrency(prize ?? 0)}</Text>
              <Text className="text-xl font-quicksand-semibold text-green-600">{formatCurrency(ticketPrice ?? 0)} / Boleto</Text>
            </View>
            <Text className="text-base font-quicksand-regular text-gray-700 leading-6 mb-6">{description}</Text>
            <View className="w-full bg-gray-200 rounded-full h-3 mb-2"><View className="bg-primary h-3 rounded-full" style={{ width: `${(ticketsSold / totalTickets) * 100}%` }} /></View>
            <Text className="text-right text-gray-500 font-quicksand-medium mb-8">{ticketsSold} de {totalTickets} boletos vendidos</Text>
            <Text className="text-2xl font-quicksand-bold text-center mb-2 text-gray-800">Selecciona tus Números</Text>
          </View>
        </>
      )}
      ListFooterComponent={() => (
        <View className="mt-6 px-6 pb-8">
          <Pressable onPress={handlePurchase} disabled={selectedNumbers.length === 0 || isPurchasing} className={`p-4 rounded-lg items-center transition-colors ${selectedNumbers.length > 0 ? 'bg-green-500' : 'bg-gray-400'} active:opacity-80`}>
            <Text className="text-white font-quicksand-bold text-lg">
              {isPurchasing
                ? "Procesando..."
                : `Comprar ${selectedNumbers.length > 0 ? `${selectedNumbers.length} Número(s)` : ''}`}
            </Text>
          </Pressable>
        </View>
      )}
    />
  );
};

export default RaffleDetail;