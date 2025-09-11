import Paymentmethods from '@/app/components/Paymentmethods';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { useLocalSearchParams } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const paymentMethodPage = () => {
  const { raffleId } = useLocalSearchParams<{ raffleId: Id<'raffles'> }>();
  const navigation = useNavigation();

  // Obtener los detalles de la rifa
  const raffle = useQuery(api.raffles.getById, { id: raffleId as Id<'raffles'> });

  // Modificar la query para obtener métodos de pago del creador de la rifa
  const paymentMethods = useQuery(api.admin.getPaymentMethods, raffle?.creatorId ? { ownerId: raffle.creatorId } : 'skip');

  // Configurar el título dinámicamente cuando tengamos los datos de la rifa
  useLayoutEffect(() => {
    if (raffle) {
      navigation.setOptions({
        title: 'Métodos de Pago',
        headerStyle: { backgroundColor: '#f8fafc' },
        headerTitleStyle: { fontFamily: 'Quicksand-Bold' },
      });
    }
  }, [raffle, navigation]);

  // Mostrar un indicador de carga mientras se obtienen los datos
  if (!raffle || paymentMethods === undefined) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-slate-50"> {/* Usar SafeAreaView con fondo */}
        <ActivityIndicator size="large" color="#FE8C00" />
        <Text className="mt-2 text-gray-600">Cargando métodos de pago...</Text>
      </SafeAreaView>
    );
  }

  // Si la rifa no se encuentra, o no tiene un creador (aunque esto debería ser raro)
  if (!raffle?.creatorId || paymentMethods === null) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center p-4 bg-slate-50"> {/* Usar SafeAreaView con fondo */}
        <Text className="text-center text-red-500">No se pudieron cargar los métodos de pago.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Paymentmethods
        paymentMethods={paymentMethods}
      />
    </SafeAreaView>
    // <SafeAreaView className='flex-1 bg-slate-50'> {/* Contenedor principal con fondo uniforme */}
    //   <View className='flex-1'>
    //   </View>
    // </SafeAreaView>
  )
}

export default paymentMethodPage