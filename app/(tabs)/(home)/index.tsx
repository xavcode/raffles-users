import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { formatUtcToLocal } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobalHeader from '../../components/GlobalHeader';
import SearchBar from '../../components/SearchBar';

type RaffleWithDetails = Doc<'raffles'> & { creatorName?: string; winnerName?: string; }; // Añadido winnerName
// const ACTIVE = 'active';

const FilterButton = ({ title, isActive, onPress }: { title: string, isActive: boolean, onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    className={`flex-1 items-center py-3 ${isActive ? 'bg-white border-b-2 border-primary' : 'bg-slate-50'}`}
  >
    <Text className={`font-quicksand-bold text-sm ${isActive ? 'text-primary' : 'text-slate-500'}`}>{title}</Text>
  </Pressable>
);

const RaffleCardSkeleton = () => (
  <View className="bg-white mx-4 mb-5 rounded-2xl flex-row overflow-hidden p-2 animate-pulse">
    <View className="flex-1 p-3 justify-between">
      <View>
        <View className="bg-gray-200 h-5 w-3/4 rounded-md" />
        <View className="bg-gray-200 h-4 w-1/2 rounded-md mt-2" />
      </View>
      <View className="mt-3">
        <View className="w-full bg-slate-200 rounded-full h-2" />
        <View className="bg-gray-200 h-3 w-1/3 rounded-md mt-1.5" />
        <View className="mt-3 p-2.5 rounded-lg items-center bg-slate-100 border border-slate-200/80">
          <View className="bg-gray-200 h-6 w-2/4 rounded-md" />
        </View>
      </View>
    </View>
    <View className="w-36 bg-slate-200 rounded-2xl" />
  </View>
);

const RaffleCard = ({ item, currentUserId }: { item: RaffleWithDetails, currentUserId?: Id<'users'> }) => {
  const formattedPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.ticketPrice);
  const progress = item.totalTickets > 0 ? (item.ticketsSold / item.totalTickets) * 100 : 0;
  const isActive = item.status === 'active';
  const isEnabledPurchases = item.enabledPurchases;

  // Comprobamos si el usuario actual es el dueño de esta rifa.
  const isOwner = currentUserId && item.creatorId === currentUserId;

  const CardContent = (
    <Pressable
      className={`mx-4 mb-5 rounded-2xl shadow-sm flex-row overflow-hidden ${isActive ? 'active:opacity-80' : 'opacity-60'} ${isOwner ? 'bg-indigo-50' : 'bg-white'}`}
      disabled={!isActive}
    >
      <View className="flex-1 p-3 justify-between">
        <View>
          <View className="flex-row items-start justify-between">
            <Text className="text-base font-quicksand-bold text-slate-800 flex-1 mr-2" numberOfLines={2}>{item.title}</Text>
          </View>
          <Text className='text-sm font-quicksand-medium text-slate-500 mt-1'>
            Por {item.userName}
          </Text>
          <Text className='text-sm font-quicksand-medium text-slate-500 mt-1'>
            Fecha del sorteo {formatUtcToLocal(item.endTime, "d MMM")}
          </Text>
        </View>

        {!isActive && (
          <View className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
            {item.winningTicketNumber && (
              <Text className="text-sm font-quicksand-bold text-slate-800 text-center">
                Boleto Ganador: #{item.winningTicketNumber.toString().padStart(3, '0')}
              </Text>
            )}
            {item.winnerName && (
              <Text className="font-quicksand-medium text-xs text-slate-600 text-center mt-0.5">
                {item.winnerName}
              </Text>
            )}
            {item.winCondition && (
              <Text className="font-quicksand-medium text-xs text-slate-600 text-center mt-0.5">
                Condición: {item.winCondition}
              </Text>
            )}
          </View>
        )}

        <View className="mt-3">
          <View className="w-full bg-slate-200 rounded-full h-2">
            <View className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }} />
          </View>
          <Text className="text-xs font-quicksand-semibold text-slate-500 mt-1.5">{item.ticketsSold?.toString() ?? 0} / {item.totalTickets} vendidos</Text>
          <View className="mt-3 p-2.5 rounded-lg items-center bg-slate-100 border border-slate-200/80">
            {isActive ? (
              <Text className="font-quicksand-bold text-base text-primary">{formattedPrice}</Text>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="trophy" size={16} color="#475569" />
                <Text className="font-quicksand-bold text-sm text-slate-600 ml-2">
                  {item.winningTicketNumber
                    ? `Boleto Ganador: #${item.winningTicketNumber.toString().padStart(3, '0')}`
                    : 'Sorteo Finalizado'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <Image
        source={{ uri: item.imageUrl }}
        className="w-36 bg-slate-200 rounded-2xl"
        resizeMode="cover"
      />

      {/* Marca de agua si las compras están deshabilitadas */}
      {isActive && !isEnabledPurchases && !isOwner && (
        <View className="absolute inset-0 bg-black/40 flex-1 justify-center items-center rounded-2xl">
          <View className="border-2 border-yellow-400/80 py-2 px-4 rounded-lg -rotate-15 shadow-xl shadow-black/30">
            <Text className="text-yellow-300 font-black text-base tracking-wider uppercase" >
              Compras Pausadas
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );

  return (
    <Link href={`/(tabs)/(home)/${item._id}`} asChild>
      {CardContent}
    </Link>
  );
};

const HomeScreen = () => {
  const router = useRouter();
  const convexUser = useQuery(api.users.getCurrent);

  const [selectedTab, setSelectedTab] = useState<'active' | 'myRaffles' | 'finished'>('active');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // const isGeneralTab = selectedTab === 'active';

  const {
    results: generalRaffles,
    status: generalStatus,
    loadMore: loadMoreGeneral,
  } = usePaginatedQuery(
    api.raffles.getRaffles,
    {
      status: selectedTab === 'active' ? 'active' : selectedTab === 'finished' ? 'finished' : undefined,
      search: debouncedSearch,
    },
    { initialNumItems: 5 }
  );

  const {
    results: myRaffles,
    status: myStatus,
    loadMore: loadMoreMy,
  } = usePaginatedQuery(
    api.raffles.getMyRaffles,
    {
      search: debouncedSearch,
    },
    { initialNumItems: 5 }
  );

  const raffles = selectedTab === 'myRaffles' ? myRaffles : generalRaffles;
  const status = selectedTab === 'myRaffles' ? myStatus : generalStatus;
  const loadMore = selectedTab === 'myRaffles' ? loadMoreMy : loadMoreGeneral;

  const getEmptyMessage = () => {
    if (debouncedSearch) {
      return `No se encontraron resultados para "${debouncedSearch}"`;
    }
    switch (selectedTab) {
      case 'active':
        return 'No hay sorteos activos en este momento.';
      case 'finished':
        return 'Aún no hay sorteos finalizados.';
      case 'myRaffles':
        return convexUser ? 'Aún no has creado ninguna rifa. ¡Anímate a crear la primera!' : 'Inicia sesión para ver tus Sorteos.';
      default:
        return 'No hay sorteos para mostrar.';
    }
  };

  const LOADING_FIRST_PAGE_STATUS = 'LoadingFirstPage'; // Constante para el estado de carga inicial

  if (convexUser === undefined || (selectedTab === 'myRaffles' ? myStatus === LOADING_FIRST_PAGE_STATUS : generalStatus === LOADING_FIRST_PAGE_STATUS)) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        {/* <GlobalHeader /> */}
        <View className="pt-4">
          {[...Array(3)].map((_, index) => <RaffleCardSkeleton key={index} />)}
        </View>
      </SafeAreaView>
    );
  }

  if (convexUser === null) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <GlobalHeader />
        <View className="flex-1 justify-center items-center px-8">
          <Ionicons name="lock-closed-outline" size={64} color="#cbd5e1" />
          <Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">Inicia sesión para ver los sorteos</Text>
          <Text className="text-sm font-quicksand-medium text-slate-400 text-center mt-1 mb-6">Explora y participa en los sorteos disponibles.</Text>
          <Pressable onPress={() => router.push('/(auth)/sign-in')} className="bg-primary px-8 py-3 rounded-lg active:opacity-80">
            <Text className="text-white font-quicksand-bold text-base">Iniciar Sesión</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['left', 'right', 'bottom']}>

      {/* Barra de Búsqueda */}
      <SearchBar onSearch={setDebouncedSearch} initialQuery={debouncedSearch} />

      {/* Barra de Pestañas */}
      <View className="flex-row bg-slate-50 border-b border-gray-200">
        <FilterButton title="Activos" isActive={selectedTab === 'active'} onPress={() => setSelectedTab('active')} />
        <FilterButton title="Finalizados" isActive={selectedTab === 'finished'} onPress={() => setSelectedTab('finished')} />
        {convexUser && (
          <FilterButton title="Mis Sorteos" isActive={selectedTab === 'myRaffles'} onPress={() => setSelectedTab('myRaffles')} />
        )}
      </View>

      {status === LOADING_FIRST_PAGE_STATUS ? (
        <View style={{ paddingTop: 8 }}>
          {[...Array(3)].map((_, index) => <RaffleCardSkeleton key={index} />)}
        </View>
      ) : (
        <FlatList
          data={raffles}
          keyExtractor={(item) => item._id.toString()}
          renderItem={({ item }) => (
            <RaffleCard item={item} currentUserId={convexUser?._id} />
          )}
          contentContainerClassName="pt-4 pb-8"
          onEndReached={() => {
            if (status === 'CanLoadMore') {
              loadMore(5);
            }
          }}
          onEndReachedThreshold={0.8}
          ListEmptyComponent={() => (
            <View className="mt-24 items-center justify-center px-8">
              <Ionicons name="trophy-outline" size={64} color="#cbd5e1" />
              <Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">{getEmptyMessage()}</Text>
            </View>)}
          ListFooterComponent={() => {
            if (status === 'LoadingMore') { return <ActivityIndicator className="my-8" color="#4f46e5" />; }
            return null;
          }} />
      )}

      <Link href="/(raffles)/create-raffle" asChild>
        <Pressable className="absolute bottom-10 right-6 bg-primary rounded-full p-4 shadow-2xl active:opacity-90">
          <Ionicons name="add" size={32} color="white" />
        </Pressable>
      </Link>
    </SafeAreaView>
  );
};

export default HomeScreen;