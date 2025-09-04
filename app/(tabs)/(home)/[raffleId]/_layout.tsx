import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
// Ya no necesitamos isSignedIn aquí, se verifica en el componente padre si es necesario
// import { useUser } from '@clerk/clerk-expo';

export default function RaffleDetailsLayout() {
    const { raffleId } = useLocalSearchParams();
    // const { isSignedIn } = useUser();
    const raffle = useQuery(api.raffles.getById, { id: raffleId as Id<'raffles'> });
    const currentUser = useQuery(api.users.getCurrent);
    const isCreator = useMemo(() => currentUser && raffle && currentUser._id === raffle.creatorId, [currentUser, raffle]);

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#f8fafc', // slate-50
                },
                headerTintColor: '#1e293b', // text-slate-800
                headerTitleStyle: {
                    fontFamily: 'Quicksand-Bold',
                },
            }}
        >
            {/* La pantalla index ahora gestiona su propio header */}
            <Stack.Screen
                name="index"
                options={{
                    // title: 'Detalles del Sorteo',
                    headerShown: false, // ¡Permitimos que index.tsx gestione su propio header!
                    // headerRight: () => (isCreator && raffle ? <HeaderLeft raffle={raffle} onDeleteRequest={openDeleteModal} /> : null),
                }}
            />
            <Stack.Screen name="sales" options={{ title: 'Historial de Ventas' }} />
        </Stack>
    );
}
