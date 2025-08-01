import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';

const NotificationItem = ({ notification }: { notification: Doc<'notifications'> }) => {
    const markAsRead = useMutation(api.notifications.markAsRead);
    const router = useRouter();

    const handlePress = () => {
        // Navega al detalle de la compra y luego marca como leída
        if (notification.purchaseId) {
            router.push(`/purchase/${notification.purchaseId}`);
        }
        markAsRead({ notificationId: notification._id });
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            className="bg-white p-4 border-b border-slate-100 flex-row items-start"
            activeOpacity={0.7}
        >
            <View className="bg-blue-100 p-2 rounded-full mr-4">
                <Ionicons name="notifications-outline" size={20} color="#2563eb" />
            </View>
            <View className="flex-1">
                <Text className="font-quicksand-medium text-slate-700">{notification.message}</Text>
                <Text className="font-quicksand-regular text-xs text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(notification._creationTime), { addSuffix: true, locale: es })}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const AdminNotifications = () => {
    const notifications = useQuery(api.notifications.getUnread);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);

    if (notifications === undefined) {
        return <ActivityIndicator size="small" color="#4f46e5" className="my-4" />;
    }

    return (
        <View className="bg-white rounded-2xl shadow-sm shadow-slate-300/50 overflow-hidden">
            <View className="p-4 flex-row justify-between items-center border-b border-slate-100">
                <Text className="font-quicksand-bold text-lg text-slate-800">Notificaciones</Text>
                {notifications.length > 0 && (
                    <TouchableOpacity onPress={() => markAllAsRead()}>
                        <Text className="font-quicksand-semibold text-sm text-primary">Marcar todas como leídas</Text>
                    </TouchableOpacity>
                )}
            </View>
            {notifications.length === 0 ? (
                <View className="p-8 items-center justify-center">
                    <Ionicons name="checkmark-done-outline" size={48} color="#cbd5e1" />
                    <Text className="text-base font-quicksand-semibold text-slate-500 mt-2">Todo en orden</Text>
                    <Text className="text-sm font-quicksand-medium text-slate-400 text-center">No hay notificaciones nuevas.</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <NotificationItem notification={item} />}
                    scrollEnabled={false} // Ideal para usar dentro de un ScrollView más grande
                />
            )}
        </View>
    );
};

export default AdminNotifications;

