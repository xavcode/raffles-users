import { RaffleCard, RaffleCardSkeleton } from '@/components/RaffleCard';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { usePaginatedQuery } from 'convex/react';
import React from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

type RaffleListProps = {
  type: 'active' | 'finished' | 'myRaffles';
  search: string;
  currentUserId?: Id<'users'>;
};

const RaffleList = ({ type, search, currentUserId }: RaffleListProps) => {
  const query = type === 'myRaffles' ? api.raffles.getMyRaffles : api.raffles.getRaffles;
  const args = type === 'myRaffles' ? { search } : { status: type, search };

  const { results, status, loadMore } = usePaginatedQuery(
    query as any, // Se usa 'any' para manejar la diferencia de argumentos entre queries
    args,
    { initialNumItems: 10 }
  );

  const getEmptyMessage = () => {
    if (search) {
      return `No se encontraron resultados para "${search}"`;
    }
    switch (type) {
      case 'active':
        return 'No hay sorteos activos en este momento.';
      case 'finished':
        return 'Aún no hay sorteos finalizados.';
      case 'myRaffles':
        return 'Aún no has creado ninguna rifa. ¡Anímate a crear la primera!';
      default:
        return 'No hay sorteos para mostrar.';
    }
  };

  if (status === 'LoadingFirstPage') {
    return (
      <View className="pt-4">
        {[...Array(5)].map((_, index) => <RaffleCardSkeleton key={index} />)}
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item._id.toString()}
      renderItem={({ item }) => (
        <RaffleCard item={item as Doc<'raffles'> & { winnerName?: string }} currentUserId={currentUserId} />
      )}
      className='flex-1'
      contentContainerStyle={{ flexGrow: 1, paddingTop: 16 }}
      onEndReached={() => {
        if (status === 'CanLoadMore') {
          loadMore(5);
        }
      }}
      onEndReachedThreshold={0.8}
      ListEmptyComponent={() => (
        <View className="flex-1 items-center justify-center px-8 -mt-10">
          <Ionicons name="trophy-outline" size={64} color="#cbd5e1" />
          <Text className="text-lg font-quicksand-semibold text-slate-500 mt-4 text-center">{getEmptyMessage()}</Text>
        </View>
      )}
      ListFooterComponent={() => {
        if (status === 'LoadingMore') { return <ActivityIndicator className="my-8" color="#4f46e5" />; }
        return null;
      }}
    />
  );
};

export default RaffleList;
