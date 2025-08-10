import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { usePaginatedQuery } from 'convex/react';
import { Link, router, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RaffleCard = ({ item }: { item: Doc<'raffles'> }) => {
  const formattedPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.ticketPrice);
  const progress = item.totalTickets > 0 ? (item.ticketsSold / item.totalTickets) * 100 : 0;

  return (
    <Link href={`/${item._id}`} asChild>
      <Pressable className="bg-white mx-4 mb-5 rounded-2xl shadow-sm shadow-slate-300/50 active:opacity-80">
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
          <Pressable className="bg-primary p-3 rounded-lg items-center active:opacity-80"
            onPress={() => { router.push(`/${item._id}`) }}
          >
            <Text className="text-white font-quicksand-bold text-base">Participar en el Sorteo</Text>
          </Pressable>
        </View>
      </Pressable>
    </Link>
  );
};

const IndexPage = () => {
  const {
    results: raffles,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.raffles.getRaffles,
    { status: 'active' },
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
              <Text className="text-lg font-quicksand-semibold text-slate-500">No hay sorteos activos</Text>
              <Text className="text-sm font-quicksand-medium text-slate-400">Vuelve más tarde</Text>
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