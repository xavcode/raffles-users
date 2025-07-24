import { useQuery } from "convex/react";
import { Link } from "expo-router";
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../convex/_generated/api";
import { Doc } from "../convex/_generated/dataModel";

const RaffleItem = ({ item }: { item: Pick<Doc<"raffles">, '_id' | 'prize' | 'title' | 'ticketPrice' | 'totalTickets' | 'ticketsSold' | 'imageUrl'> }) => {
  const { _id, prize, title, ticketPrice, totalTickets, ticketsSold, imageUrl } = item;

  // Helper para formatear la moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <View className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      <Image
        source={{ uri: "https://st3.depositphotos.com/6922808/15355/i/450/depositphotos_153557144-stock-illustration-colombian-money-on-a-white.jpg" }}
        className="w-full h-48"
        resizeMode="cover"
      />
      <View className="p-6">
        <Text className="text-2xl font-quicksand-bold text-gray-800 mb-2">{title}</Text>
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-quicksand-bold text-primary">{formatCurrency(prize ?? 0)}</Text>
          <Text className="text-lg font-quicksand-semibold text-green-600">{formatCurrency(ticketPrice ?? 0)} / Boleto</Text>
        </View>
        <View className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <View
            className="bg-primary h-2.5 rounded-full"
            style={{ width: `${(ticketsSold / totalTickets) * 100}%` }}
          />
        </View>
        <Text className="text-right text-gray-500 font-quicksand-medium mb-4">
          {ticketsSold} / {totalTickets} vendidos
        </Text>
        <Link
          href={{
            pathname: "/screens/[id]", // Apunta al archivo de la ruta dinámica
            params: { id: _id },      // Pasa el valor del ID como parámetro
          }}
          asChild
        >
          <Pressable className="bg-primary p-3 rounded-lg items-center active:opacity-80">
            <Text className="text-white font-quicksand-bold text-base">Ver Sorteo</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
};

const index = () => {
  const raffles = useQuery(api.raffles.getAllRaffles);

  if (raffles === undefined) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="mt-4 text-lg font-quicksand-semibold text-gray-600">Cargando sorteos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={raffles}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => <RaffleItem item={item} />}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={() => (
          <Text className="text-3xl font-quicksand-bold text-center pt-8 pb-4 text-gray-800">
            Sorteos Disponibles
          </Text>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-xl font-quicksand-semibold text-gray-500">No hay sorteos disponibles en este momento.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );

}

export default index