import { api } from '@/convex/_generated/api';
import { registerForPushNotificationsAsync } from "@/libs/notifications";

import { Ionicons } from '@expo/vector-icons';
import { Authenticated, Unauthenticated, useMutation, useQuery } from 'convex/react';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

const ADMIN = 'admin'

const GlobalHeader = () => {
  const convexUser = useQuery(api.users.getCurrent);
  const storePushToken = useMutation(api.users.storePushToken);

  useEffect(() => {
    // Se ejecuta cuando el usuario de Convex se carga.
    if (convexUser) {
      registerForPushNotificationsAsync().then(token => {
        // Si obtenemos un token del dispositivo y es diferente al que tenemos guardado (o no tenemos ninguno), lo actualizamos.
        if (token && token !== convexUser.pushToken) {
          storePushToken({ token });
        }
      });
    }
  }, [convexUser]);

  return (
    <View className="flex-row justify-between items-center px-4 p-2">
      <Authenticated>
        <View>
          {convexUser &&
            <View >
              {/* <Text className="text-lg font-quicksand-medium text-gray-500">Bienvenido,</Text> */}
              <Text className="text-2xl font-quicksand-bold text-center  text-gray-800">@{convexUser?.userName}</Text>
            </View>
          }
        </View>
        {convexUser?.userType === ADMIN && (
          <Link href="/(admin)" asChild>
            <Pressable className="flex-row items-center bg-white p-3 rounded-full shadow-lg shadow-gray-300/50 active:bg-gray-100">
              <Ionicons name="shield-checkmark-outline" size={24} color="#4f46e5" />
              <Text className="text-primary font-quicksand-bold ml-2">Admin</Text>
            </Pressable>
          </Link>
        )}
      </Authenticated >
      <Unauthenticated>
        <View className="flex-row items-center">
          <Link href="/(auth)/sign-in" asChild>
            <Pressable className="flex-row items-center bg-white p-3 rounded-full shadow-lg shadow-gray-300/50 active:bg-gray-100">
              <Ionicons name="lock-closed-outline" size={24} color="#4f46e5" />
              <Text className="text-primary font-quicksand-bold ml-2">Inicia sesión</Text>
            </Pressable>
          </Link>
        </View>
      </Unauthenticated>
    </View>
  );
};

export default GlobalHeader;