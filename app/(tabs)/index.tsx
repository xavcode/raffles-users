import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { formatUtcToLocal } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { usePaginatedQuery } from 'convex/react';
import { Link, Stack } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobalHeader from '../components/GlobalHeader';
import TabSelectorRaffleStatus from '../components/TabSelectorRaffleStatus';

const RaffleCard = ({ item }: { item: Doc<'raffles'> }) => {
  const formattedPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.ticketPrice);
  const progress = item.totalTickets > 0 ? (item.ticketsSold / item.totalTickets) * 100 : 0;

  const isActive = item.status === 'active';

  const CardContent = (
    <Pressable
      className={`bg-white mx-4 mb-5 rounded-2xl shadow-sm p-2 shadow-slate-300/50 flex-row overflow-hidden ${isActive ? 'active:opacity-80' : 'opacity-60'}`}
      disabled={!isActive}
    >
      {/* Contenido de texto a la izquierda, con espaciado vertical */}
      <View className="flex-1 p-3 justify-between">
        {/* Sección Superior: Título y Fecha */}
        <View>
          <Text className="text-base font-quicksand-bold text-slate-800" numberOfLines={2}>{item.title}</Text>
          <Text className='text-sm font-quicksand-medium text-slate-500 mt-1'>{formatUtcToLocal(item._creationTime, "d 'de' MMMM, yyyy")}</Text>
        </View>

        {/* Sección Inferior: Progreso y Estado */}
        <View className="mt-3">
          {/* Barra de Progreso */}
          <View className="w-full bg-slate-200 rounded-full h-2">
            <View className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }} />
          </View>
          <Text className="text-xs font-quicksand-semibold text-slate-500 mt-1.5">{item.ticketsSold?.toString() ?? 0} / {item.totalTickets} vendidos</Text>

          {/* Área de Estado: muestra el precio o el ganador */}
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
      {/* Imagen a la derecha */}
      <Image
        source={{ uri: item.imageUrl }}
        className="w-36 bg-slate-200 rounded-2xl" // Ancho de imagen aumentado
        resizeMode="cover"
      />
    </Pressable>
  );

  // Envolvemos la tarjeta con Link solo si está activa para evitar errores de navegación.
  if (isActive) {
    return <Link href={`/${item._id}`} asChild>{CardContent}</Link>;
  }


  return CardContent;
}

const IndexPage = () => {
  // el estado para saber qué pestaña está seleccionada. Inicia en 'active'.
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
    <SafeAreaView className="flex-1 bg-white">
      <GlobalHeader />
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
        contentContainerClassName="pt-2 pb-24"
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