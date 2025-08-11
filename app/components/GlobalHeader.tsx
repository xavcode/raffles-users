import { api } from '@/convex/_generated/api';
import { registerForPushNotificationsAsync } from "@/libs/notifications";
import { SignedIn, SignedOut } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
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
    <View className="flex-row justify-between items-center px-4 pt-2">
      <SignedIn>
        <View>
          {convexUser &&
            <View>
              <Text className="text-lg font-quicksand-medium text-gray-500">Bienvenido,</Text>
              <Text className="text-2xl font-quicksand-bold text-gray-800">{convexUser?.firstName} {convexUser?.lastName}</Text>
              {/* <View className='flex-row items-center mt-1'>
                <Ionicons name="wallet-outline" size={16} color="#475569" />
                <Text className='text-base font-quicksand-semibold text-slate-600 ml-1.5'>Saldo: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(convexUser?.balance ?? 0)}</Text>
              </View> */}
            </View>
          }
        </View>
        {convexUser?.userType === ADMIN && (
          <Link href="/(admin)/raffles" asChild>
            <Pressable className="flex-row items-center bg-white p-3 rounded-full shadow-lg shadow-gray-300/50 active:bg-gray-100">
              <Ionicons name="shield-checkmark-outline" size={24} color="#4f46e5" />
              <Text className="text-primary font-quicksand-bold ml-2">Admin</Text>
            </Pressable>
          </Link>
        )}
      </SignedIn >
      <SignedOut>
        <View className="flex-row items-center">
          <Ionicons name="person-outline" size={24} color="#4f46e5" />
          <Text className="text-primary font-quicksand-bold ml-2">Inicia sesión</Text>
        </View>
      </SignedOut>
    </View>
  );
};

export default GlobalHeader;