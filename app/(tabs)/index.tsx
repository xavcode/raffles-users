import { Ionicons } from '@expo/vector-icons';
import { useQuery } from "convex/react";
import { Link, Stack } from "expo-router";
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";

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
          disabled={status === "finished"}
          href={{
            pathname: "/screens/[id]",
            params: { id: _id.toString() },
          }}
          asChild
        >
          {status === "finished" ? (
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

  return (

    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View className="flex-row justify-between items-center px-4 pt-2 pb-4">
        <View>
          <Text className="text-lg font-quicksand-medium text-gray-500">Bienvenido,</Text>
          <Text className="text-2xl font-quicksand-bold text-gray-800">{convexUser?.firstName || 'Usuario'}</Text>
          <View className='flex-row items-center mt-1'>
            <Ionicons name="wallet-outline" size={16} color="#475569" />
            <Text className='text-base font-quicksand-semibold text-slate-600 ml-1.5'>Saldo: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(convexUser?.balance ?? 0)}</Text>
          </View>
        </View>
        {convexUser?.userType === "admin" && (
          <Link href="/raffles" asChild>
            <Pressable className="flex-row items-center bg-white p-3 rounded-full shadow-lg shadow-gray-300/50 active:bg-gray-100">
              <Ionicons name="shield-checkmark-outline" size={24} color="#4f46e5" />
              <Text className="text-primary font-quicksand-bold ml-2">Admin</Text>
            </Pressable>
          </Link>
        )}
      </View>

      <FlatList
        data={raffles}
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