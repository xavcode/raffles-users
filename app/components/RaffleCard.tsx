import { Doc, Id } from '@/convex/_generated/dataModel';
import { formatUtcToLocal } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

type RaffleWithDetails = Doc<'raffles'> & { creatorName?: string; winnerName?: string; };

export const RaffleCardSkeleton = React.forwardRef<View>((props, ref) => (
  <View ref={ref} className="bg-white mx-4 mb-5 rounded-2xl flex-row overflow-hidden p-2">
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
));

const RaffleCardComponent = ({ item, currentUserId }: { item: RaffleWithDetails, currentUserId?: Id<'users'> }) => {
  const formattedPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.ticketPrice);
  const progress = item.totalTickets > 0 ? (item.ticketsSold / item.totalTickets) * 100 : 0;
  const isActive = item.status === 'active';
  const isEnabledPurchases = item.enabledPurchases;
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
    <Link href={`/(tabs)/(home)/${item.customRaffleId}`} asChild>
      {CardContent}
    </Link>
  );
};

export const RaffleCard = RaffleCardComponent;
export default RaffleCardComponent;
