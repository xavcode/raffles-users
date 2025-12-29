import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import StarRating from './StarRating';

type RaffleWithDetails = Doc<'raffles'> & { creatorName?: string; winnerName?: string; };

const getDaysRemaining = (endTime: number): string => {
  const now = Date.now();
  const diff = endTime - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Finalizado';
  if (days === 1) return 'Termina en 1 día';
  return `Termina en ${days} días`;
};

export const RaffleCardSkeleton = () => (
  <View className="mx-4 mb-4 bg-white rounded-2xl p-4 flex-row">
    <View className="flex-1 pr-4">
      <View className="bg-slate-200 h-3 w-20 rounded animate-pulse" />
      <View className="bg-slate-200 h-5 w-3/4 rounded mt-2 animate-pulse" />
      <View className="bg-slate-200 h-3 w-1/2 rounded mt-2 animate-pulse" />
      <View className="bg-slate-200 h-8 w-24 rounded-full mt-3 animate-pulse" />
    </View>
    <View className="w-24 h-24 bg-slate-200 rounded-xl" />
  </View>
);

export const RaffleCard = ({ item, currentUserId }: { item: RaffleWithDetails, currentUserId?: Id<'users'> }) => {
  const router = useRouter();
  const formattedPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.ticketPrice);
  const isActive = item.status === 'active';
  const isOwner = currentUserId && item.creatorId === currentUserId;

  const reputation = useQuery(api.reviews.getCreatorReputation, { userId: item.creatorId });

  const handleCreatorPress = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/(tabs)/(home)/user/${item.creatorId}`);
  };

  const getStatusInfo = () => {
    if (!isActive) {
      if (item.winningTicketNumber) {
        return { text: `Ganador: #${item.winningTicketNumber.toString().padStart(3, '0')}`, color: 'text-green-600' };
      }
      return { text: 'Finalizado', color: 'text-red-500' };
    }
    return { text: getDaysRemaining(item.endTime), color: 'text-amber-700' };
  };

  const statusInfo = getStatusInfo();

  const CardContent = (
    <Pressable
      className={`mx-4 mb-4 bg-white rounded-2xl p-4 shadow-sm ${!isActive ? 'opacity-80' : 'active:scale-[0.99]'}`}
      disabled={!isActive}
    >
      {/* ROW CONTAINER */}
      <View className="flex-row">
        {/* LEFT: Content */}
        <View className="flex-1 pr-4">
          {/* Status */}
          <Text className={`text-xs font-quicksand-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </Text>

          {/* Title */}
          <Text className="text-base font-quicksand-bold text-slate-800 mt-1 leading-5" numberOfLines={2}>
            {item.title}
          </Text>

          {/* Creator */}
          <Pressable onPress={handleCreatorPress} className="flex-row items-center mt-1 active:opacity-70">
            <Text className="text-sm font-quicksand-medium text-slate-500" numberOfLines={1}>
              {item.userName}
            </Text>
            {reputation && reputation.totalReviews > 0 && (
              <View className="flex-row items-center ml-2">
                <StarRating rating={reputation.averageRating} size={10} maxStars={1} />
                <Text className="text-xs font-quicksand-bold text-amber-600 ml-0.5">
                  {reputation.averageRating.toFixed(1)}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Button Row */}
          <View className="flex-row items-center mt-3">
            {isActive ? (
              <View className="bg-amber-100 px-4 py-2 rounded-full">
                <Text className="text-sm font-quicksand-bold text-amber-800">{formattedPrice}</Text>
              </View>
            ) : (
              <View className="bg-slate-100 px-4 py-2 rounded-full">
                <Text className="text-sm font-quicksand-semibold text-slate-600">Ver detalles</Text>
              </View>
            )}
            {isOwner && (
              <View className="bg-indigo-100 px-3 py-1.5 rounded-full ml-2">
                <Text className="text-xs font-quicksand-bold text-indigo-600">Tuyo</Text>
              </View>
            )}
          </View>
        </View>

        {/* RIGHT: Image */}
        <Image
          source={{ uri: item.imageUrl }}
          className="w-24 h-24 bg-slate-200 rounded-xl"
          resizeMode="cover"
        />
      </View>
    </Pressable>
  );

  return (
    <Link href={`/(tabs)/(home)/${item.customRaffleId}`} asChild>
      {CardContent}
    </Link>
  );
};
