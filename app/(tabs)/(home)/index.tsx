import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { formatUtcToLocal } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobalHeader from '../../components/GlobalHeader';

type RaffleWithDetails = Doc<'raffles'> & { creatorName?: string }; // 'creatorName' ahora es opcional

const RaffleListItem = ({ raffle }: { raffle: RaffleWithDetails }) => {
  const formattedPrize = typeof (raffle.prize) === 'number'
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(raffle.prize)
    : raffle.prize;

  const endDate = raffle.endTime ? formatUtcToLocal(raffle.endTime, "d 'de' MMMM, yyyy") : 'N/A';
  const remainingHours = raffle.endTime ? Math.max(0, Math.floor((raffle.endTime - Date.now()) / (1000 * 60 * 60))) : 0;

  const statusText = raffle.enabledPurchases === false
    ? "Compras Deshabilitadas"
    : remainingHours > 0
      ? `Termina en ${remainingHours} horas`
      : "Finalizado";

  return (
    <Link href={`/(tabs)/(home)/${raffle._id}`} asChild>
      <Pressable className="bg-white mx-4 mb-3 rounded-2xl shadow-sm shadow-slate-200/60 overflow-hidden active:opacity-70">
        {raffle.imageUrl && (
          <Image source={{ uri: raffle.imageUrl }} className="w-full h-40 bg-slate-200" resizeMode="cover" />
        )}
        <View className="p-4">
          <Text className="text-sm font-quicksand-medium text-slate-500 mb-1">{raffle.creatorName}</Text>
          <Text className="text-xl font-quicksand-bold text-slate-800 mb-2" numberOfLines={1}>{raffle.title}</Text>
          <View className="flex-row items-center mb-1">
            <Ionicons name="gift-outline" size={16} color="#475569" />
            <Text className="text-base font-quicksand-semibold text-primary ml-2">{formattedPrize}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={16} color="#475569" />
            <Text className="text-sm font-quicksand-semibold text-slate-600 ml-2">{statusText}</Text>
          </View>
        </View>
        <View className="bg-slate-50/70 px-4 py-2 border-t border-slate-200/80 flex-row justify-between items-center">
          <Text className="text-xs font-quicksand-medium text-slate-500">Termina: {endDate}</Text>
          <Ionicons name="chevron-forward-outline" size={18} color="#94a3b8" />
        </View>
      </Pressable>
    </Link>
  );
};

const FilterButton = ({ title, isActive, onPress }: { title: string, isActive: boolean, onPress: () => void }) => (
  <Pressable onPress={onPress} className={`px-4 py-2 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-gray-200'}`}>
    <Text className={`font-quicksand-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>{title}</Text>
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

const HomeScreen = () => {
  const router = useRouter();
  const convexUser = useQuery(api.users.getCurrent);

  const [selectedTab, setSelectedTab] = useState<'active' | 'finished' | 'myRaffles'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Efecto para "debounce" la búsqueda: espera 300ms después de que el usuario deja de escribir
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isGeneralTab = selectedTab === 'active' || selectedTab === 'finished';

  const {
    results: generalRaffles,
    status: generalStatus,
    loadMore: loadMoreGeneral,
  } = usePaginatedQuery(
    api.raffles.getRaffles,
    {
      status: isGeneralTab ? (selectedTab as 'active' | 'finished') : undefined,
      search: isGeneralTab ? debouncedSearch : undefined, // Pasamos el término de búsqueda solo si la pestaña es general
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
      search: selectedTab === 'myRaffles' ? debouncedSearch : undefined, // Pasamos el término de búsqueda solo si la pestaña es "Mis Sorteos"
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
        <GlobalHeader />
        <View className="pt-4">
          <ActivityIndicator className="my-8" color="#4f46e5" />
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
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <GlobalHeader />

      {/* Barra de Búsqueda */}
      <View className="px-4 pt-2 pb-3 bg-gray-50">
        <View className="flex-row items-center bg-white rounded-xl p-3 border border-gray-200/80 shadow-sm">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Buscar por nombre de rifa o creador..."
            className="flex-1 ml-3 text-base font-quicksand-medium text-slate-800"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} className="p-1">
              <Ionicons name="close-circle" size={20} color="#cbd5e1" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Barra de Pestañas */}
      <View className="flex-row justify-center space-x-3 px-4 pb-4 bg-gray-50 border-b border-gray-200">
        <FilterButton title="Activos" isActive={selectedTab === 'active'} onPress={() => setSelectedTab('active')} />
        {/* <FilterButton title="Finalizadas" isActive={selectedTab === 'finished'} onPress={() => setSelectedTab('finished')} /> */}
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
          renderItem={({ item }) => <RaffleListItem raffle={item} />}
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
