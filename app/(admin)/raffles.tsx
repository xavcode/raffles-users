import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { Link, Redirect, Stack } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RaffleWithSales = Doc<'raffles'>;
const STATUS_ACTIVE = 'active';


const RaffleCard = ({ raffle }: { raffle: RaffleWithSales }) => {
  const [winningTicket, setWinningTicket] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const updateRaffle = useMutation(api.raffles.updateRaffle);

  const nonAvailableTickets = useQuery(api.tickets.getNonAvailableTickets, { raffleId: raffle._id as Id<'raffles'> });
  const ticketsSold = nonAvailableTickets?.length

  const handleFinishRaffle = async () => {
    const winningNumber = parseInt(winningTicket, 10);

    if (isNaN(winningNumber) || winningNumber <= 0) {
      Alert.alert('Boleto Inválido', 'Debes ingresar un número de boleto ganador válido y positivo.');
      return;
    }
    if (winningNumber > raffle.totalTickets) {
      Alert.alert('Boleto Fuera de Rango', `El boleto ganador no puede ser mayor que ${raffle.totalTickets}.`);
      return;
    }

    setIsFinishing(true);
    try {
      await updateRaffle({
        id: raffle._id as Id<'raffles'>,
        status: 'finished',
        winningTicketNumber: winningNumber,
      });
      Alert.alert('Éxito', '¡Sorteo finalizado! Se ha asignado el ganador.');
      setWinningTicket(''); // Limpiar input
    } catch (error) {
      console.error('Error al finalizar el sorteo:', error);
      Alert.alert('Error', 'No se pudo finalizar el sorteo.');
    } finally {
      setIsFinishing(false);
    }
  };

  const progress = raffle.totalTickets > 0 ? (raffle.ticketsSold / raffle.totalTickets) * 100 : 0;
  const formattedPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(raffle.ticketPrice);
  const formattedPrize = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(raffle.prize as number);

  return (
    <View className="bg-white rounded-2xl shadow-sm shadow-slate-300/50 overflow-hidden mb-4">
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-3">
          <Text className="text-base font-quicksand-bold text-slate-800 w-10/12" numberOfLines={2}>{raffle.title}</Text>
          <View className={`px-2.5 py-1 rounded-full ${raffle.status === 'active' ? 'bg-green-100' : raffle.status === 'cancelled' ? 'bg-red-100' : 'bg-slate-100'}`}>
            <Text className={`text-xs font-quicksand-bold uppercase ${raffle.status === 'active' ? 'text-green-700' :
              raffle.status === 'cancelled' ? 'text-red-700' :
                'text-slate-600'
              }`}>{raffle.status}</Text>
          </View>
        </View>

        <View className="space-y-2 text-sm text-slate-600 mb-4">
          <View className="flex-row items-center"><Ionicons name="gift-outline" className="mr-2 text-slate-500" size={16} /><Text className="font-quicksand-medium">Premio: </Text><Text className="font-quicksand-bold">{formattedPrize}</Text></View>
          <View className="flex-row items-center"><Ionicons name="pricetag-outline" className="mr-2 text-slate-500" size={16} /><Text className="font-quicksand-medium">Valor del boleto: </Text><Text className="font-quicksand-bold">{formattedPrice}</Text></View>
        </View>

        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-quicksand-semibold text-slate-600">Vendidos</Text>
            <Text className="text-xs font-quicksand-bold text-slate-600">{ticketsSold?.toString() ?? 0} / {raffle.totalTickets}</Text>
          </View>
          <View className="w-full bg-slate-200 rounded-full h-2.5">
            <View className="bg-primary h-2.5 rounded-full" style={{ width: `${((ticketsSold ?? 0) / raffle.totalTickets) * 100}%` }} />
          </View>
        </View>

        {raffle.status === STATUS_ACTIVE && (
          <View className="mt-4 pt-4 border-t border-slate-200/80 flex-row items-center gap-x-2">
            <TextInput
              className="flex-1 bg-slate-100 border border-slate-200 h-10 rounded-lg px-3 text-base font-quicksand-medium"
              placeholder="Boleto ganador"
              keyboardType="number-pad"
              value={winningTicket}
              onChangeText={setWinningTicket}
            />
            <Pressable onPress={handleFinishRaffle} disabled={isFinishing || !winningTicket} className="bg-red-600 px-3 h-10 rounded-lg justify-center items-center active:bg-red-700 disabled:bg-red-300">
              {isFinishing ? <ActivityIndicator color="white" size="small" /> : <Text className="text-white font-quicksand-bold text-sm">Finalizar</Text>}
            </Pressable>
          </View>
        )}
      </View>
      <View className="bg-slate-50/70 px-4 py-3 flex-row justify-end">
        <Link href={`/(admin)/${String(raffle._id)}`} asChild>
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
    <SafeAreaView className="flex-1 bg-slate-50">
      <Stack.Screen options={{ title: 'Sorteos' }} />
      <ScrollView contentContainerClassName="p-4 pb-8">
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