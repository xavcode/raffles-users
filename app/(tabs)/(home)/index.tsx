import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { formatUtcToLocal } from '@/utils/date';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { Link, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STATUS = 'LoadingFirstPage'

// --- Componente de Tarjeta de Rifa (Sin cambios) ---
const RaffleCard = ({ item, currentUserId }: { item: Doc<'raffles'>, currentUserId?: Id<'users'> }) => {
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
                    ? `Ganador: #${item.winningTicketNumber.toString().padStart(3, '0')}`
                    : 'Sorteo Finalizado'
                  }
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

  // Si el sorteo está activo, la tarjeta es un enlace a la página de detalles.
  // La marca de agua ya informa visualmente si las compras están pausadas.
  if (isActive) {
    if (isEnabledPurchases || isOwner) {
      return <Link href={`/(home)/${item._id}`} asChild>{CardContent}</Link>;
    }

    return CardContent;
  }

  return CardContent;
}

// --- Componente de Botón de Filtro ---
const FilterButton = ({ title, isActive, onPress }: { title: string, isActive: boolean, onPress: () => void }) => (
  <Pressable onPress={onPress} className={`px-4 py-2 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-gray-200'}`}>
    <Text className={`font-quicksand-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>{title}</Text>
  </Pressable>
);

// --- Componente de Esqueleto para la Tarjeta de Rifa ---
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


// --- Componente Principal de la Página ---
const IndexPage = () => {
  const [selectedTab, setSelectedTab] = useState<'active' | 'finished' | 'myRaffles'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { isSignedIn } = useUser();

  // Efecto para "debounce" la búsqueda: espera 300ms después de que el usuario deja de escribir
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Obtenemos el usuario actual para saber su ID
  const currentUser = useQuery(api.users.getCurrent);

  const isGeneralTab = selectedTab === 'active' || selectedTab === 'finished';

  // Consulta para Sorteos 'activas' y 'finalizadas', ahora con capacidad de búsqueda
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

  // Consulta específica para "Mis Sorteos", ahora con capacidad de búsqueda
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

  // Lógica para determinar qué datos y estados usar
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
        return isSignedIn ? 'Aún no has creado ninguna rifa. ¡Anímate a crear la primera!' : 'Inicia sesión para ver tus Sorteos.';
      default:
        return 'No hay sorteos para mostrar.';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerLargeTitle: true,
          headerTitle: 'Sorteos',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#f8fafc' },
          headerTitleStyle: { fontFamily: 'Quicksand-Bold' },
        }}
      />

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
        {isSignedIn && (
          <FilterButton title="Mis Sorteos" isActive={selectedTab === 'myRaffles'} onPress={() => setSelectedTab('myRaffles')} />
        )}
      </View>

      {/* Mostramos los esqueletos de carga durante la carga inicial para una mejor UX */}
      {status === STATUS ? (
        <View style={{ paddingTop: 8 }}>
          {/* Mostramos varios esqueletos para simular el contenido que se está cargando */}
          {[...Array(5)].map((_, index) => <RaffleCardSkeleton key={index} />)}
        </View>
      ) : (
        <FlatList
          data={raffles}
          renderItem={({ item }) => <RaffleCard item={item} currentUserId={currentUser?._id} />}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          onEndReached={() => {
            if (status === 'CanLoadMore') {
              loadMore(5);
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center mt-32 px-8">
              <Ionicons name="gift-outline" size={48} color="#94a3b8" />
              <Text className="text-lg font-quicksand-semibold text-slate-500 text-center mt-4">{getEmptyMessage()}</Text>
            </View>
          )}
          ListFooterComponent={() => (
            status === 'LoadingMore' ? <ActivityIndicator size="large" color="#4f46e5" className="my-8" /> : null
          )}
        // Ya no se necesita `refreshing` porque manejamos el estado de carga inicial con los esqueletos.
        />
      )}

      {/* Botón Flotante (FAB) para Crear Rifa */}
      <Link href="/(raffles)/create-raffle" asChild>
        <Pressable className="absolute bottom-10 right-6 bg-primary rounded-full p-4 shadow-2xl active:opacity-90">
          <Ionicons name="add" size={32} color="white" />
        </Pressable>
      </Link>
    </SafeAreaView>
  );
};

export default IndexPage;
