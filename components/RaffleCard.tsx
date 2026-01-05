import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

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
  <View className="mx-4 mb-4 bg-surface p-4 rounded-3xl flex-row items-center border border-border shadow-sm">
    <View className="w-24 h-24 bg-slate-200 rounded-2xl animate-pulse" />
    <View className="flex-1 ml-4 space-y-2">
      <View className="bg-slate-200 h-4 w-3/4 rounded animate-pulse" />
      <View className="bg-slate-200 h-3 w-1/2 rounded animate-pulse" />
      <View className="bg-slate-200 h-6 w-1/2 rounded animate-pulse" />
    </View>
    <View className="w-16 h-10 bg-slate-200 rounded-full animate-pulse ml-2" />
  </View>
);

export const RaffleCard = ({ item, currentUserId }: { item: RaffleWithDetails, currentUserId?: Id<'users'> }) => {
  const router = useRouter();
  const formattedPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.ticketPrice);
  const formattedPrize = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.prize || 0);
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
        return { text: `Ganador: #${item.winningTicketNumber.toString().padStart(3, '0')}`, color: 'text-green-600', icon: 'trophy' };
      }
      return { text: 'Finalizado', color: 'text-text-muted', icon: 'checkmark-circle' };
    }
    const days = Math.ceil((item.endTime - Date.now()) / (1000 * 60 * 60 * 24));
    const isUrgent = days <= 2;
    return {
      text: getDaysRemaining(item.endTime),
      color: isUrgent ? 'text-ios-red' : 'text-text-muted',
      icon: 'timer'
    };
  };

  const statusInfo = getStatusInfo();

  const CardContent = (
    <Pressable
      className={`mx-4 mb-4 bg-surface p-4 rounded-3xl flex-row items-center border border-border shadow-sm ${!isActive ? 'opacity-80' : 'active:scale-[0.98]'}`}
    >
      {/* LEFT: Image */}
      <View className="relative shadow-inner">
        <Image
          source={{ uri: item.imageUrl }}
          className="w-24 h-24 rounded-2xl bg-slate-100 shadow-inner"
          resizeMode="cover"
        />
        {isOwner && (
          <View className="absolute -top-1 -left-1 bg-primary px-2 py-0.5 rounded-full shadow-sm z-10">
            <Text className="text-[8px] font-quicksand-bold text-white uppercase">Tuyo</Text>
          </View>
        )}
      </View>

      {/* CENTER: Content */}
      <View className="flex-1 ml-4 min-w-0">
        {/* Creator Identity */}
        <Pressable
          onPress={handleCreatorPress}
          className="flex-row items-center mb-1 self-start bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full active:opacity-70"
        >
          <Ionicons name="person" size={10} color="#94a3b8" />
          <Text className="ml-1.5 text-[10px] font-quicksand-bold text-text-muted" numberOfLines={1}>
            {item.userName}
          </Text>
        </Pressable>

        {/* Time Status */}
        <View className="flex-row items-center mb-0.5">
          <Ionicons name={statusInfo.icon as any} size={12} color={statusInfo.color === 'text-ios-red' ? '#FF3B30' : '#8E8E93'} />
          <Text className={`ml-1 text-[11px] font-quicksand-bold uppercase tracking-wide ${statusInfo.color}`}>
            {statusInfo.text}
          </Text>
        </View>

        {/* Title */}
        <Text className="text-[15px] font-quicksand-semibold text-text-main truncate" numberOfLines={1}>
          {item.title}
        </Text>

        {/* Big Prize Amount */}
        <Text className="text-[22px] font-quicksand-bold text-text-main tracking-tight leading-none mt-0.5">
          {formattedPrize !== '$ 0' ? formattedPrize : formattedPrice}
        </Text>
      </View>

      {/* RIGHT: Price Pill */}
      <View className="items-end justify-center ml-2">
        <View className="bg-ios-bg px-4 py-2 rounded-2xl min-w-[70px] items-center">
          <Text className="text-sm font-quicksand-bold text-ios-blue">{formattedPrice}</Text>
        </View>
        <Text className="text-[10px] text-ios-gray font-quicksand-medium mt-1 pr-1">por boleto</Text>
      </View>
    </Pressable>
  );

  return (
    <Link href={`/(tabs)/(home)/${item.customRaffleId}`} asChild>
      {CardContent}
    </Link>
  );
};
