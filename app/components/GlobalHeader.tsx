import { api } from '@/convex/_generated/api';
import { SignedIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

const ADMIN = 'admin'

const GlobalHeader = () => {
  const convexUser = useQuery(api.users.getCurrent);

  return (
    <View className="flex-row justify-between items-center px-4 pt-2 pb-4">
      <SignedIn>
        <View>
          {convexUser &&
            <View>
              <Text className="text-lg font-quicksand-medium text-gray-500">Bienvenido,</Text>
              <Text className="text-2xl font-quicksand-bold text-gray-800">{convexUser?.firstName} {convexUser?.lastName}</Text>
              <View className='flex-row items-center mt-1'>
                <Ionicons name="wallet-outline" size={16} color="#475569" />
                <Text className='text-base font-quicksand-semibold text-slate-600 ml-1.5'>Saldo: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(convexUser?.balance ?? 0)}</Text>
              </View>
            </View>
          }
        </View>
        {convexUser?.userType === ADMIN && (
          <Link href="/raffles" asChild>
            <Pressable className="flex-row items-center bg-white p-3 rounded-full shadow-lg shadow-gray-300/50 active:bg-gray-100">
              <Ionicons name="shield-checkmark-outline" size={24} color="#4f46e5" />
              <Text className="text-primary font-quicksand-bold ml-2">Admin</Text>
            </Pressable>
          </Link>
        )}
      </SignedIn >
    </View>
  );
};

export default GlobalHeader;