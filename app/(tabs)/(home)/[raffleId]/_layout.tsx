import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
// Ya no necesitamos isSignedIn aquí, se verifica en el componente padre si es necesario
// import { useUser } from '@clerk/clerk-expo';

export default function RaffleDetailsLayout() {
  const { raffleId } = useLocalSearchParams();
  const raffle = useQuery(api.raffles.getById, { id: raffleId as Id<'raffles'> });
  const currentUser = useQuery(api.users.getCurrent);
  const isCreator = useMemo(() => currentUser && raffle && currentUser._id === raffle.creatorId, [currentUser, raffle]);

  // Headers consistentes para todas las pantallas

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // headerStyle: { backgroundColor: 'red' },
        contentStyle: {
          backgroundColor: '#f8fafc',
          paddingTop: 0
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="sales"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="payment-methods"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
