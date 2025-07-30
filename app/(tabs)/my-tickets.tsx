import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Helper para el estado del boleto
const TICKET_STATUS_STYLES = {
  reserved: {
    label: 'Reservado',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    icon: 'time-outline' as const,
  },
  sold: {
    label: 'Pagado',
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: 'checkmark-circle-outline' as const,
  },
};


const TicketItem = ({ ticket }: { ticket: Doc<'tickets'> & { raffleTitle?: string } }) => {
  const statusStyle = TICKET_STATUS_STYLES[ticket.status as keyof typeof TICKET_STATUS_STYLES] || TICKET_STATUS_STYLES.reserved;
  const purchaseDate = new Date(ticket._creationTime).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <View className="bg-white mx-4 mb-4 p-4 rounded-2xl shadow-sm shadow-slate-300/50">
      <View className="flex-row justify-between items-start">
        <Text className="text-base font-quicksand-bold text-slate-800 w-8/12" numberOfLines={2}>
          {ticket.raffleTitle || 'Título no disponible'} {/* Default value */}
        </Text>
        <View className={`flex-row items-center px-2.5 py-1 rounded-full ${statusStyle.bg}`}>
          <Ionicons name={statusStyle.icon} size={14} color={statusStyle.text.replace('text-', '')} />
          <Text className={`ml-1 text-xs font-quicksand-bold ${statusStyle.text}`}>{statusStyle.label}</Text>
        </View>
      </View>
      <View className="mt-4 border-t border-slate-100 pt-3 flex-row justify-between items-center">
        <View>
          <Text className="text-sm font-quicksand-medium text-slate-500">Número de Boleto</Text>
          <Text className="text-2xl font-quicksand-bold text-primary">{ticket.ticketNumber.toString().padStart(3, '0')}</Text>
        </View>
        <View className="items-end">
          <Text className="text-sm font-quicksand-medium text-slate-500">Fecha</Text>
          <Text className="text-sm font-quicksand-semibold text-slate-700">{purchaseDate}</Text>
        </View>
      </View>
    </View>
  );
};

const MyTickets = () => {
  const convexUser = useQuery(api.users.getCurrent);
  const userTickets = useQuery(
    api.tickets.userTicketHistory,
    convexUser ? { userId: convexUser._id } : 'skip'
  );

  // Estado de carga principal
  if (convexUser === undefined || userTickets === undefined) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Stack.Screen options={{ headerTitle: 'Mis Boletos', headerLargeTitle: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#f8fafc' }, headerTitleStyle: { fontFamily: 'Quicksand-Bold' } }} />
      <FlatList data={userTickets} keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }) => <TicketItem ticket={item} />} contentContainerClassName="pt-4 pb-8"
        ListEmptyComponent={<View className="mt-24 items-center justify-center px-8">
          <Ionicons name="ticket-outline" size={64} color="#cbd5e1" />
          <Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">No tienes boletos</Text>
          <Text className="text-sm font-quicksand-medium text-slate-400 text-center">Participa en un sorteo para ver tus boletos aquí.</Text>
        </View>} />
    </SafeAreaView>
  );
};

export default MyTickets;