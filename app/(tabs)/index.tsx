import { Ionicons } from '@expo/vector-icons';
import { useQuery } from "convex/react";
import { Link } from "expo-router";
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";


const FINISHED_STATUS = 'finished';

const RaffleItem = ({ item }: { item: Pick<Doc<"raffles">, '_id' | 'prize' | 'title' | 'status' | 'ticketPrice' | 'totalTickets' | 'imageUrl' | 'winningTicketNumber'> }) => {
  const { _id, prize, title, status, ticketPrice, totalTickets, imageUrl, winningTicketNumber } = item;

  const nonAvailableTickets = useQuery(api.tickets.getNonAvailableTickets, { raffleId: _id as Id<'raffles'> });
  const ticketsSold = nonAvailableTickets?.length


  // Helper para formatear la moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <View className="bg-white rounded-2xl shadow-md shadow-slate-200/70 overflow-hidden mb-6 border border-slate-100">
      {/* Contenedor con aspect ratio para asegurar consistencia en las imágenes */}
      <View className="aspect-video bg-slate-200">
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>
      <View className="p-4">
        <Text className="text-lg font-quicksand-bold text-slate-800 mb-2" numberOfLines={2}>{title}</Text>

        <View className="flex-row justify-between items-baseline mb-4">
          <View>
            <Text className="text-xs font-quicksand-medium text-slate-500">Premio</Text>
            <Text className="text-2xl font-quicksand-bold text-indigo-600">{formatCurrency(prize ?? 0)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-xs font-quicksand-medium text-slate-500">Por Boleto</Text>
            <Text className="text-lg font-quicksand-semibold text-emerald-600">{formatCurrency(ticketPrice ?? 0)}</Text>
          </View>
        </View>

        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-quicksand-semibold text-slate-600">Progreso</Text>
            <Text className="text-xs font-quicksand-bold text-slate-600">{ticketsSold?.toString() ?? 0} / {totalTickets}</Text>
          </View>
          <View className="w-full bg-slate-200 rounded-full h-2.5">
            <View className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${((ticketsSold ?? 0) / totalTickets) * 100}%` }} />
          </View>
        </View>

        <Link
          disabled={status === FINISHED_STATUS}
          href={{ pathname: "/[id]", params: { id: _id.toString() } }}
          asChild
        >
          {status === FINISHED_STATUS ? (
            <View className="bg-slate-100 p-3 rounded-lg items-center flex-row justify-center border border-slate-200">
              <Ionicons name="trophy-outline" size={20} color="#475569" />
              <Text className="text-slate-700 font-quicksand-bold text-base ml-2">Ganador: #{winningTicketNumber}</Text>
            </View>
          ) : (
            <Pressable className="bg-indigo-600 p-3 rounded-lg items-center active:bg-indigo-700">
              <Text className="text-white font-quicksand-bold text-base">Participar en el Sorteo</Text>
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

  const sortedRaffles = [...activeRaffles, ...finishedRaffles];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={sortedRaffles}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, paddingTop: 8 }}
        renderItem={({ item }) => <RaffleItem item={item} />}
        keyExtractor={(item) => item._id.toString()}
        ListHeaderComponent={() => (
          <View className="pb-4">
            <Text className="text-3xl font-quicksand-bold text-slate-900">Sorteos Activos</Text>
            <Text className="text-base font-quicksand-medium text-slate-500">Participa para ganar premios increíbles.</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center mt-20 p-8 bg-slate-100 rounded-2xl">
            <Ionicons name="gift-outline" size={48} color="#94a3b8" />
            <Text className="text-xl font-quicksand-semibold text-slate-600 mt-4">No hay sorteos disponibles</Text>
            <Text className="text-base font-quicksand-medium text-slate-500 text-center mt-1">Vuelve pronto para ver nuevas oportunidades.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

export default RafflesTab;