import { Stack } from 'expo-router';
// Ya no necesitamos isSignedIn aquí, se verifica en el componente padre si es necesario
// import { useUser } from '@clerk/clerk-expo';

export default function RaffleDetailsLayout() {
  // const { raffleId } = useLocalSearchParams();
  // const currentUser = useQuery(api.users.getCurrent);
  // const isCreator = useMemo(() => currentUser && raffle && currentUser._id === raffle.creatorId, [currentUser, raffle]);

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
          headerShown: false, // Deshabilitar header para la pantalla de detalles de la rifa
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
