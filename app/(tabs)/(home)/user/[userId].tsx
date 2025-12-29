import StarRating from '@/components/StarRating';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Pantalla de perfil público de un creador con su reputación.
 */
const CreatorProfileScreen = () => {
    const { userId } = useLocalSearchParams<{ userId: string }>();
    const router = useRouter();

    const profile = useQuery(
        api.reviews.getCreatorProfile,
        userId ? { userId: userId as Id<'users'> } : 'skip'
    );

    if (!userId || profile === undefined) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
                <ActivityIndicator size="large" color="#4f46e5" />
            </SafeAreaView>
        );
    }

    if (profile === null) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-4">
                <Ionicons name="person-outline" size={64} color="#cbd5e1" />
                <Text className="text-lg font-quicksand-semibold text-slate-500 mt-4">
                    Usuario no encontrado
                </Text>
            </SafeAreaView>
        );
    }

    const memberSinceDate = format(new Date(profile.memberSince), "MMMM yyyy", { locale: es });

    return (
        <>
            <Stack.Screen
                options={{
                    title: profile.userName,
                    headerStyle: { backgroundColor: '#f8fafc' },
                    headerTitleStyle: { fontFamily: 'Quicksand-Bold' },
                }}
            />
            <SafeAreaView className="flex-1 bg-slate-50" edges={['left', 'right']}>
                <ScrollView className="flex-1">
                    {/* Header con avatar y stats */}
                    <View className="bg-white px-6 py-8 items-center border-b border-slate-200">
                        {/* Avatar */}
                        <View className="mb-4">
                            {profile.profileImageUrl ? (
                                <Image
                                    source={{ uri: profile.profileImageUrl }}
                                    className="w-24 h-24 rounded-full"
                                />
                            ) : (
                                <View className="w-24 h-24 rounded-full bg-indigo-100 items-center justify-center">
                                    <Text className="text-3xl font-quicksand-bold text-indigo-600">
                                        {profile.userName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Nombre */}
                        <Text className="text-2xl font-quicksand-bold text-slate-800 mb-1">
                            {profile.userName}
                        </Text>

                        {/* Rating Badge */}
                        <View className="flex-row items-center mb-3">
                            <Text className="text-lg font-quicksand-bold text-slate-700 mr-2">
                                ({profile.totalReviewsReceived})
                            </Text>
                            <StarRating rating={profile.averageRating} size={20} />
                            {profile.averageRating > 0 && (
                                <Text className="text-lg font-quicksand-bold text-slate-700 ml-2">
                                    {profile.averageRating.toFixed(1)}
                                </Text>
                            )}
                        </View>

                        {/* Bio */}
                        {profile.bio && (
                            <Text className="text-sm font-quicksand-medium text-slate-600 text-center px-4 mb-4">
                                {profile.bio}
                            </Text>
                        )}

                        {/* Stats Row */}
                        <View className="flex-row mt-2">
                            <View className="items-center px-6">
                                <Text className="text-2xl font-quicksand-bold text-indigo-600">
                                    {profile.completedRafflesCount}
                                </Text>
                                <Text className="text-xs font-quicksand-medium text-slate-500">
                                    Sorteos
                                </Text>
                            </View>
                            <View className="w-px bg-slate-200" />
                            <View className="items-center px-6">
                                <Text className="text-2xl font-quicksand-bold text-indigo-600">
                                    {profile.totalReviewsReceived}
                                </Text>
                                <Text className="text-xs font-quicksand-medium text-slate-500">
                                    Reviews
                                </Text>
                            </View>
                        </View>

                        {/* Member since */}
                        <Text className="text-xs font-quicksand-medium text-slate-400 mt-4">
                            Miembro desde {memberSinceDate}
                        </Text>
                    </View>

                    {/* Reviews Section */}
                    <View className="p-4">
                        <Text className="text-base font-quicksand-bold text-slate-800 mb-4">
                            Reviews recientes
                        </Text>

                        {profile.recentReviews.length === 0 ? (
                            <View className="bg-white rounded-xl p-6 items-center">
                                <Ionicons name="chatbubble-outline" size={40} color="#cbd5e1" />
                                <Text className="text-sm font-quicksand-medium text-slate-500 mt-2">
                                    Aún no hay reviews
                                </Text>
                            </View>
                        ) : (
                            <View className="gap-3">
                                {profile.recentReviews.map((review) => (
                                    <View
                                        key={review._id}
                                        className="bg-white rounded-xl p-4 border border-slate-100"
                                    >
                                        <View className="flex-row items-center justify-between mb-2">
                                            <Text className="text-sm font-quicksand-bold text-slate-700">
                                                {review.reviewerName}
                                            </Text>
                                            <StarRating rating={review.rating} size={14} />
                                        </View>
                                        {review.comment && (
                                            <Text className="text-sm font-quicksand-medium text-slate-600">
                                                {review.comment}
                                            </Text>
                                        )}
                                        <Text className="text-xs font-quicksand-medium text-slate-400 mt-2">
                                            {format(new Date(review._creationTime), "d MMM, yyyy", { locale: es })}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
};

export default CreatorProfileScreen;
