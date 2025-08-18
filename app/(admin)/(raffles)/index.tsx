import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { formatCOP } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { Link, Redirect } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

type RaffleWithSales = Doc<'raffles'>;
const STATUS_ACTIVE = 'active';

const RAFFLE_STATUS_STYLES = {
  active: { label: 'Activo', bg: 'bg-green-100', text: 'text-green-700', icon: 'flash-outline' as const, iconColor: '#15803d' },
  finished: { label: 'Finalizado', bg: 'bg-blue-100', text: 'text-blue-700', icon: 'trophy-outline' as const, iconColor: '#1d4ed8' },
  cancelled: { label: 'Cancelado', bg: 'bg-red-100', text: 'text-red-700', icon: 'close-circle-outline' as const, iconColor: '#b91c1c' },
};


const RaffleCard = ({ raffle }: { raffle: RaffleWithSales }) => {
  const [winningTicket, setWinningTicket] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const finishRaffle = useMutation(api.raffles.finishRaffle);
  const handleFinishRaffle = async () => {
    const winningNumber = parseInt(winningTicket, 10);

    if (isNaN(winningNumber) || winningNumber <= 0) {
      Toast.show({ type: 'error', text1: 'Boleto inválido', text2: 'Ingresa un número de boleto ganador válido y positivo.' });
      return;
    }
    if (winningNumber > raffle.totalTickets) {
      Toast.show({ type: 'error', text1: 'Fuera de rango', text2: `El boleto ganador no puede ser mayor que ${raffle.totalTickets}.` });
      return;
    }

    setIsFinishing(true);
    try {
      await finishRaffle({
        id: raffle._id as Id<'raffles'>,
        winningTicketNumber: winningNumber
      });
      Toast.show({ type: 'success', text1: 'Éxito', text2: '¡Sorteo finalizado! Se ha asignado el ganador.' });
      setWinningTicket(''); // Limpiar input
    } catch (error) {
      console.error('Error al finalizar el sorteo:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo finalizar el sorteo.' });
    } finally {
      setIsFinishing(false);
    }
  };

  const progress = raffle.totalTickets > 0 ? ((raffle.ticketsSold ?? 0) / raffle.totalTickets) * 100 : 0;
  const formattedPrice = formatCOP(raffle.ticketPrice);
  const formattedPrize = formatCOP(raffle.prize as number);
  const statusStyle = RAFFLE_STATUS_STYLES[raffle.status as keyof typeof RAFFLE_STATUS_STYLES] || { label: raffle.status, bg: 'bg-slate-100', text: 'text-slate-600', icon: 'help-circle-outline' as const, iconColor: '#475569' };

  return (
    <View className="bg-white rounded-2xl shadow-sm shadow-slate-300/50 overflow-hidden">
      {/* --- Card Body --- */}
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-3">
          <Text className="text-base font-quicksand-bold text-slate-800 flex-1 mr-2" numberOfLines={2}>{raffle.title}</Text>
          <View className={`px-2.5 py-1 rounded-full ${statusStyle.bg}`}>
            <Text className={`text-xs font-quicksand-bold uppercase ${statusStyle.text}`}>{statusStyle.label}</Text>
          </View>
        </View>

        <View className="space-y-2 mb-4">
          <View className="flex-row items-center"><Ionicons name="gift-outline" size={16} color="#64748b" /><Text className="font-quicksand-medium text-slate-600 ml-2">Premio: </Text><Text className="font-quicksand-bold text-slate-700">{formattedPrize}</Text></View>
          <View className="flex-row items-center"><Ionicons name="pricetag-outline" size={16} color="#64748b" /><Text className="font-quicksand-medium text-slate-600 ml-2">Valor del boleto: </Text><Text className="font-quicksand-bold text-slate-700">{formattedPrice}</Text></View>
        </View>

        <View>
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-quicksand-semibold text-slate-600">Vendidos</Text>
            <Text className="text-xs font-quicksand-bold text-slate-600">{raffle.ticketsSold?.toString() ?? 0} / {raffle.totalTickets}</Text>
          </View>
          <View className="w-full bg-slate-200 rounded-full h-2.5">
            <View className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }} />
          </View>
        </View>
      </View>

      {/* --- Card Footer --- */}
      <View className="bg-slate-50/70 px-4 py-3 border-t border-slate-200/80">
        {raffle.status === STATUS_ACTIVE ? (
          <View className="flex-row items-center justify-between gap-x-4">
            {/* Left side: Main Actions */}
            <View className="flex-row items-center gap-x-1">
              <Link href={`/(admin)/(raffles)/${String(raffle._id)}/sales`} asChild>
                <Pressable className="bg-indigo-50 h-10 px-3 rounded-lg flex-row items-center active:bg-indigo-100">
                  <Ionicons name="list-outline" size={20} color="#4f46e5" />
                  <Text className="text-indigo-700 font-quicksand-bold text-sm ml-1.5">Ventas</Text>
                </Pressable>
              </Link>
              <Link href={`/(admin)/(raffles)/${String(raffle._id)}`} asChild>
                <Pressable className="h-10 w-10 rounded-lg justify-center items-center active:bg-slate-200">
                  <Ionicons name="create-outline" size={22} color="#475569" />
                </Pressable>
              </Link>
            </View>

            {/* Right side: Finish Form */}
            <View className="flex-1 flex-row items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
              <TextInput
                className="flex-1 h-10 px-3 text-base font-quicksand-medium text-slate-700"
                placeholder="Boleto ganador"
                keyboardType="number-pad"
                value={winningTicket}
                onChangeText={setWinningTicket}
              />
              <Pressable
                onPress={handleFinishRaffle}
                disabled={isFinishing || !winningTicket}
                className="w-12 h-10 bg-primary justify-center items-center active:bg-primary/80 disabled:bg-primary/40"
              >
                {isFinishing ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="checkmark-done-outline" size={24} color="white" />}
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center justify-center">
            <Ionicons name={statusStyle.icon} size={18} color={statusStyle.iconColor} />
            <Text className={`font-quicksand-bold ml-2 ${statusStyle.text}`}>
              {raffle.winningTicketNumber ? `Ganador: #${raffle.winningTicketNumber.toString().padStart(3, '0')}` : statusStyle.label}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RafflesPage = () => {
  const convexUser = useQuery(api.users.getCurrent);

  // 1. Todos los Hooks se declaran en el nivel superior.
  // Determinamos si debemos omitir la consulta de sorteos.
  const skipQuery = convexUser === undefined || (convexUser !== null && convexUser.userType !== "admin");

  const { results: raffles, status, loadMore } = usePaginatedQuery(
    api.raffles.getRaffles,
    skipQuery ? 'skip' : {},
    { initialNumItems: 5 }
  );

  // useMemo para evitar recalcular las secciones en cada render
  const sections = useMemo(() => {
    if (!raffles) return [];
    const activeRaffles = raffles.filter(r => r.status === 'active');
    const finishedRaffles = raffles.filter(r => r.status !== 'active');

    const data = [];
    if (activeRaffles.length > 0) {
      data.push({ title: 'Sorteos Activos', data: activeRaffles });
    }
    if (finishedRaffles.length > 0) {
      data.push({ title: 'Sorteos Finalizados', data: finishedRaffles });
    }
    return data;
  }, [raffles]);

  // 3. Los retornos condicionales se colocan DESPUÉS de todos los Hooks.
  if (convexUser === undefined) {
    return <View className="flex-1 bg-slate-50 justify-center items-center"><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  // Si el usuario existe pero no es admin, lo redirigimos.
  if (convexUser && convexUser.userType !== "admin") {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <View className="px-4"><RaffleCard raffle={item} /></View>}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-sm font-quicksand-bold text-slate-500 uppercase tracking-wider mb-3 px-4 pt-4">{title}</Text>
        )}
        contentContainerClassName="pb-8 pt-2 space-y-4"
        stickySectionHeadersEnabled={false}
        onEndReached={() => {
          if (status === 'CanLoadMore') loadMore(5);
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={() => status === 'LoadingFirstPage' ? <ActivityIndicator size="large" color="#4f46e5" className="mt-16" /> : null}
        ListFooterComponent={() => status === 'LoadingMore' ? <ActivityIndicator className="my-8" /> : null}
        ListEmptyComponent={() => status !== 'LoadingFirstPage' && (
          <View className="mt-24 items-center justify-center p-4 bg-slate-100 mx-4 rounded-2xl">
            <Ionicons name="journal-outline" size={64} color="#cbd5e1" />
            <Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">No hay sorteos aquí</Text>
            <Text className="text-sm font-quicksand-medium text-slate-400">Crea el primero para empezar.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default RafflesPage;