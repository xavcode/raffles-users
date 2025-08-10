import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { usePaginatedQuery } from 'convex/react';
import { Link, Stack } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabSelectorRaffleStatus from '../components/TabSelectorRaffleStatus';

const RaffleCard = ({ item }: { item: Doc<'raffles'> }) => {
  const formattedPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.ticketPrice);
  const progress = item.totalTickets > 0 ? (item.ticketsSold / item.totalTickets) * 100 : 0;

  const isActive = item.status === 'active';

  return (
    <Link href={`/${item._id}`} asChild>
      {/* Hacemos que toda la tarjeta se vea deshabilitada si no está activa */}
      <Pressable className={`bg-white mx-4 mb-25 rounded-2xl shadow-sm shadow-slate-300/50 ${isActive ? 'active:opacity-80' : 'opacity-70'}`} disabled={!isActive}>
        <Image
          source={{ uri: item.imageUrl }}
          className="w-full h-40 rounded-t-2xl bg-slate-200"
        />
        <View className="p-4">
          <Text className="text-base font-quicksand-bold text-slate-800" numberOfLines={2}>{item.title}</Text>
          <Text className="text-sm font-quicksand-medium text-slate-500 mt-1" numberOfLines={1}>Gana hasta ${item?.prize?.toLocaleString('es-CO')}</Text>
          <View className="mt-4">
            <View className="w-full bg-slate-200 rounded-full h-2">
              <View className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }} />
            </View>
            <View className="flex-row justify-between mt-1.5">
              <Text className="text-xs font-quicksand-semibold text-slate-500">{item.ticketsSold?.toString() ?? 0} / {item.totalTickets} vendidos</Text>
              <Text className="text-sm font-quicksand-bold text-primary">{formattedPrice}</Text>
            </View>
          </View>

          {/* Botón de acción unificado y con estilo condicional */}
          <View className={`mt-4 p-3 rounded-lg items-center ${isActive ? 'bg-primary' : 'bg-slate-200'}`} >
            {isActive ? (
              <Text className="font-quicksand-bold text-base text-white">Participar en el Sorteo</Text>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="trophy" size={18} color="#475569" />
                <Text className="font-quicksand-bold text-base text-slate-600 ml-2">
                  {item.winningTicketNumber
                    ? `Ganador: ${item.winningTicketNumber.toString().padStart(3, '0')}`
                    : 'Sorteo Finalizado'
                  }
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );
};

const IndexPage = () => {
  // 1. Creamos el estado para saber qué pestaña está seleccionada. Inicia en 'active'.
  const [selectedTab, setSelectedTab] = useState<'active' | 'finished'>('active');

  const {
    results: raffles,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.raffles.getRaffles,
    // 2. Usamos el estado 'selectedTab' para filtrar la consulta a Convex.
    { status: selectedTab },
    { initialNumItems: 5 }
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Stack.Screen
        options={{
          headerLargeTitle: true,
          headerTitle: 'Sorteos',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#f8fafc' },
          headerTitleStyle: { fontFamily: 'Quicksand-Bold' },
        }}
      />
      {/* 3. Añadimos nuestro nuevo componente. Le pasamos el estado actual y la función para cambiarlo. */}
      <TabSelectorRaffleStatus
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
      />

      <FlatList
        data={raffles}
        renderItem={({ item }) => <RaffleCard item={item} />}
        keyExtractor={(item) => item._id}
        contentContainerClassName="pt-4 pb-8"
        onEndReached={() => {
          if (status === 'CanLoadMore') {
            loadMore(3);
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={() => (
          status !== 'LoadingFirstPage' && (
            <View className="flex-1 justify-center items-center mt-32">
              <Text className="text-lg font-quicksand-semibold text-slate-500">No hay sorteos para mostrar</Text>
              <Text className="text-sm font-quicksand-medium text-slate-400 text-center px-8 mt-1">No se encontraron sorteos en la categoría "{selectedTab === 'active' ? 'Activos' : 'Finalizados'}".</Text>
            </View>
          )
        )}
        ListFooterComponent={() => {
          if (status === 'LoadingMore') {
            return <ActivityIndicator size="large" color="#4f46e5" className="my-8" />;
          }
          return null;
        }}
        // Opcional: Pull to refresh
        refreshing={status === 'LoadingFirstPage'}

      />
    </SafeAreaView>
  );
};

export default IndexPage;