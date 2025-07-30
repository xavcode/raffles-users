import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Link, Redirect, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, Text, View } from 'react-native';

const RafflesPage = () => {
  const raffles = useQuery(api.raffles.getAllRaffles);
  const convexUser = useQuery(api.users.getCurrent);

  // 1. Mostrar un indicador de carga mientras se verifica el tipo de usuario.
  if (convexUser === undefined) {
    return <View className="flex-1 bg-slate-50 justify-center items-center"><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  if (!convexUser || convexUser.userType !== "admin") {
    return <Redirect href={'/(tabs)'} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Stack.Screen options={{
        headerTitle: 'Panel de Sorteos',
        headerLargeTitle: true,
        headerStyle: { backgroundColor: '#f8fafc' },
        headerTitleStyle: {
          fontFamily: 'Quicksand-Bold',
        },
      }} />
      {raffles === undefined ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={raffles}
          keyExtractor={(item) => item._id.toString()}
          renderItem={({ item }) => {
            const progress = item.totalTickets > 0 ? (item.ticketsSold / item.totalTickets) * 100 : 0;
            return (
              <Link href={`/edit-raffle/${String(item._id)}`} asChild>
                <Pressable className="bg-white mx-4 mb-4 rounded-2xl active:opacity-80 active:scale-[0.98] transition-transform">
                  <View className="p-4 flex-row items-center ">
                    <View className="flex-1">
                      <View className="flex-row justify-between items-start">
                        <Text className="text-base font-quicksand-bold text-slate-800 w-10/12" numberOfLines={2}>{item.title}</Text>
                        <View className={`px-2 py-1 rounded-full ${item.status === 'active' ? 'bg-green-100' : 'bg-red-100'}`}>
                          <Text className={`text-xs font-quicksand-bold uppercase ${item.status === 'active' ? 'text-green-700' : 'text-red-700'}`}>{item.status}</Text>
                        </View>
                      </View>
                      <Text className="text-sm font-quicksand-medium text-slate-500 mt-1">Premio: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.prize!)}</Text>
                      <View className="mt-3">
                        <View className="w-full bg-slate-200 rounded-full h-2">
                          <View className="bg-indigo-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
                        </View>
                        <Text className="text-xs text-slate-500 font-quicksand-medium text-right mt-1">{item.ticketsSold} / {item.totalTickets} vendidos</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
                  </View>
                </Pressable>
              </Link>
            )
          }}
          ListEmptyComponent={
            <View className="mt-24 items-center justify-center">
              <Ionicons name="journal-outline" size={64} color="#cbd5e1" />
              <Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">No hay sorteos</Text>
              <Text className="text-sm font-quicksand-medium text-slate-400">Crea el primero para empezar</Text>
            </View>
          }
          contentContainerClassName="pt-4 pb-28"
        />
      )}
      <Link href="/create-raffle" asChild>
        <Pressable className="absolute right-6 bottom-6 bg-indigo-600 w-16 h-16 rounded-full justify-center items-center active:bg-indigo-700">
          <Ionicons name="add" size={32} color="white" />
        </Pressable>
      </Link>
    </SafeAreaView>
  );
};


export default RafflesPage;