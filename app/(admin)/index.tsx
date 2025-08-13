import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const StatCard = ({ label, value, icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
  <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm shadow-slate-300/50 mr-3">
    <View className="flex-row items-center mb-2">
      <Ionicons name={icon} size={18} color={color} />
      <Text className="ml-2 text-xs font-quicksand-semibold text-slate-500">{label}</Text>
    </View>
    <Text className="text-2xl font-quicksand-bold text-slate-800">{value}</Text>
  </View>
);

const currencyCOP = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

export default function AdminHome() {
  const metrics = useQuery(api.admin.getMetrics);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ title: 'Inicio' }} />
      {!metrics ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : (
        <ScrollView contentContainerClassName="p-4 pb-8">
          <Text className="text-lg font-quicksand-bold text-slate-800 mb-3">Resumen</Text>
          <View className="flex-row mb-3">
            <StatCard label="Sorteos activos" value={metrics.totals.activeRaffles} icon="flash-outline" color="#16a34a" />
            <StatCard label="Pendientes por verificar" value={metrics.totals.pendingConfirmations} icon="shield-checkmark-outline" color="#2563eb" />
          </View>
          <View className="flex-row mb-3">
            <StatCard label="Total usuarios" value={metrics.totals.totalUsers} icon="people-outline" color="#7c3aed" />
            <StatCard label="Boletos vendidos" value={metrics.totals.ticketsSold} icon="pricetag-outline" color="#f59e0b" />
          </View>
          <View className="flex-row mb-6">
            <StatCard label="Ingresos" value={currencyCOP(metrics.totals.totalRevenue)} icon="cash-outline" color="#0ea5e9" />
            <StatCard label="Sorteos totales" value={metrics.totals.totalRaffles} icon="list-outline" color="#475569" />
          </View>

          <Text className="text-lg font-quicksand-bold text-slate-800 mb-3">Top sorteos</Text>
          <View className="space-y-3">
            {metrics.topRafflesByTicketsSold.length === 0 && (
              <View className="bg-white rounded-xl p-4 items-center">
                <Ionicons name="trophy-outline" size={32} color="#cbd5e1" />
                <Text className="text-slate-500 font-quicksand-medium mt-2">Aún no hay datos</Text>
              </View>
            )}
            {metrics.topRafflesByTicketsSold.map((r) => {
              const progress = r.totalTickets > 0 ? Math.min(100, Math.round(((r.ticketsSold ?? 0) / r.totalTickets) * 100)) : 0;
              return (
                <View key={String(r.id)} className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-300/50">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-base font-quicksand-bold text-slate-800 w-9/12" numberOfLines={1}>{r.title}</Text>
                    <Text className="text-xs font-quicksand-bold text-slate-600">{r.ticketsSold} / {r.totalTickets}</Text>
                  </View>
                  <View className="w-full bg-slate-200 rounded-full h-2">
                    <View className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }} />
                  </View>
                </View>
              )
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}


