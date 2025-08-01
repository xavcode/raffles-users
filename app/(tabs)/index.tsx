import { Ionicons } from '@expo/vector-icons';
import { useQuery } from "convex/react";
import { Link } from "expo-router";
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";


const FINISHED_STATUS = 'finished';

const RaffleItem = ({ item }: { item: Pick<Doc<"raffles">, '_id' | 'prize' | 'title' | 'status' | 'ticketPrice' | 'totalTickets' | 'ticketsSold' | 'imageUrl' | 'winningTicketNumber'> }) => {
  const { _id, prize, title, status, ticketPrice, totalTickets, ticketsSold, imageUrl, winningTicketNumber } = item;


  // Helper para formatear la moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <View className="bg-white rounded-2xl shadow-sm shadow-slate-300/50 overflow-hidden mb-6">
      <Image

        source={{ uri: "https://st3.depositphotos.com/6922808/15355/i/450/depositphotos_153557144-stock-illustration-colombian-money-on-a-white.jpg" }}
        className="w-full h-48"
        resizeMode="cover"
      />
      <View className="p-5">
        <Text className="text-xl font-quicksand-bold text-slate-800 mb-2" numberOfLines={2}>{title}</Text>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-2xl font-quicksand-bold text-primary">{formatCurrency(prize ?? 0)}</Text>
          <Text className="text-base font-quicksand-semibold text-green-600">{formatCurrency(ticketPrice ?? 0)} / Boleto</Text>
        </View>
        <View className="w-full bg-slate-200 rounded-full h-2 mb-1">
          <View
            className="bg-primary h-2 rounded-full"
            style={{ width: `${(ticketsSold / totalTickets) * 100}%` }}
          />
        </View>
        <Text className="text-right text-slate-500 font-quicksand-medium text-xs mb-4">
          {ticketsSold} / {totalTickets} vendidos
        </Text>
        <Link
          disabled={status === FINISHED_STATUS}
          href={{
            pathname: "/[id]",
            params: { id: _id.toString() },
          }}
          asChild
        >
          {status === FINISHED_STATUS ? (
            <View className="bg-green-100 p-3 rounded-lg items-center flex-row justify-center">
              <Ionicons name="trophy" size={20} color="#15803d" />
              <Text className="text-green-800 font-quicksand-bold text-base ml-2">Ganador: #{winningTicketNumber}</Text>
            </View>
          ) : (
            <Pressable className="bg-primary p-3 rounded-lg items-center active:opacity-80">
              <Text className="text-white font-quicksand-bold text-base">Ver Sorteo</Text>
            </Pressable>
          )}
        </Link>
      </View>
    </View>
  );
};



const RafflesTab = () => {
  const raffles = useQuery(api.raffles.getAllRaffles);
  const convexUser = useQuery(api.users.getCurrent);

  if (raffles === undefined || convexUser === undefined) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }


  const activeRaffles = raffles ? raffles.filter(raffle => raffle.status === "active") : [];
  const finishedRaffles = raffles ? raffles.filter(raffle => raffle.status === FINISHED_STATUS) : [];

  // Combina los sorteos activos y finalizados
  const sortedRaffles = [...activeRaffles, ...finishedRaffles];



  return (

    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Custom Header */}


      <FlatList
        data={sortedRaffles}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => <RaffleItem item={item} />}
        keyExtractor={(item) => item._id.toString()}
        ListHeaderComponent={() => (<Text className="text-3xl font-quicksand-bold text-center pb-4 text-gray-800">Sorteos Disponibles</Text>)}
        ListEmptyComponent={() => (<View className="flex-1 items-center justify-center mt-20"><Text className="text-xl font-quicksand-semibold text-gray-500">No hay sorteos disponibles.</Text></View>)}
      />
    </SafeAreaView>
  );
}

export default RafflesTab;