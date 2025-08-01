import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Link, Redirect, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RaffleWithSales = Doc<'raffles'> & { ticketsSold: number };

const RaffleCard = ({ raffle }: { raffle: RaffleWithSales }) => {
  const progress = raffle.totalTickets > 0 ? (raffle.ticketsSold / raffle.totalTickets) * 100 : 0;
  const formattedPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(raffle.ticketPrice);
  const formattedPrize = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(raffle.prize as number);

  return (
    <View className="bg-white rounded-2xl shadow-sm shadow-slate-300/50 overflow-hidden mb-4">
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-3">
          <Text className="text-base font-quicksand-bold text-slate-800 w-10/12" numberOfLines={2}>{raffle.title}</Text>
          <View className={`px-2.5 py-1 rounded-full ${raffle.status === 'active' ? 'bg-green-100' : 'bg-slate-100'}`}>
            <Text className={`text-xs font-quicksand-bold uppercase ${raffle.status === 'active' ? 'text-green-700' : 'text-slate-600'}`}>{raffle.status === 'active' ? 'Activo' : 'Finalizado'}</Text>
          </View>
        </View>

        <View className="space-y-2 text-sm text-slate-600 mb-4">
          <View className="flex-row items-center"><Ionicons name="gift-outline" className="mr-2 text-slate-500" size={16} /><Text className="font-quicksand-medium">Premio: </Text><Text className="font-quicksand-bold">{formattedPrize}</Text></View>
          <View className="flex-row items-center"><Ionicons name="pricetag-outline" className="mr-2 text-slate-500" size={16} /><Text className="font-quicksand-medium">Valor del boleto: </Text><Text className="font-quicksand-bold">{formattedPrice}</Text></View>
        </View>

        <View>
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-sm font-quicksand-semibold text-slate-700">Boletos Vendidos</Text>
            <Text className="text-sm font-quicksand-medium text-slate-500">{raffle.ticketsSold} / {raffle.totalTickets}</Text>
          </View>
          <View className="w-full bg-slate-200 rounded-full h-2.5">
            <View className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${progress}%` }} />
          </View>
        </View>
      </View>
      <View className="bg-slate-50/70 px-4 py-3 flex-row justify-end">
        <Link href={`/${String(raffle._id)}`} asChild>
          <Pressable className="flex-row items-center bg-indigo-100 px-3 py-1.5 rounded-lg active:opacity-70">
            <Ionicons name="create-outline" size={16} color="#4338ca" />
            <Text className="text-sm font-quicksand-bold text-indigo-800 ml-1.5">Editar</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
};

const RafflesPage = () => {
  const raffles = useQuery(api.raffles.getAllRaffles);
  const convexUser = useQuery(api.users.getCurrent);

  if (convexUser === undefined) {
    return <View className="flex-1 bg-slate-50 justify-center items-center"><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  if (!convexUser || convexUser.userType !== "admin") {
    return <Redirect href="/(tabs)" />;
  }

  const activeRaffles = raffles?.filter(r => r.status === 'active');
  const finishedRaffles = raffles?.filter(r => r.status !== 'active');

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="p-4 flex-row justify-between items-center border-b border-slate-200 bg-slate-50">
        <Text className="text-2xl font-quicksand-bold text-slate-900">Gestionar Sorteos</Text>
        <Link href="/create-raffle" asChild>
          <Pressable className="bg-indigo-600 p-2.5 rounded-full active:bg-indigo-700">
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        </Link>
      </View>

      <ScrollView contentContainerClassName="p-4">
        {raffles === undefined && <ActivityIndicator size="large" color="#4f46e5" className="mt-16" />}

        {activeRaffles && activeRaffles.length > 0 && (
          <View className="mb-8">
            <Text className="text-lg font-quicksand-bold text-slate-700 mb-3">Sorteos Activos</Text>
            {activeRaffles.map(raffle => <RaffleCard key={raffle._id} raffle={raffle} />)}
          </View>
        )}

        {finishedRaffles && finishedRaffles.length > 0 && (
          <View>
            <Text className="text-lg font-quicksand-bold text-slate-700 mb-3">Sorteos Finalizados</Text>
            {finishedRaffles.map(raffle => <RaffleCard key={raffle._id} raffle={raffle} />)}
          </View>
        )}

        {raffles && raffles.length === 0 && (
          <View className="mt-24 items-center justify-center">
            <Ionicons name="journal-outline" size={64} color="#cbd5e1" />
            <Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">No hay sorteos</Text>
            <Text className="text-sm font-quicksand-medium text-slate-400">Crea el primero para empezar.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default RafflesPage;