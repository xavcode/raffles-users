import HeaderRigth from '@/app/components/HeaderRigth';
import { Stack } from 'expo-router';
import React from 'react';

export default function RafflesStackLayout() {
  return (
    <Stack
      screenOptions={{
        // Reutilizamos los estilos de header que ya tenías para consistencia
        headerStyle: {
          backgroundColor: '#f8fafc', // slate-50
        },
        headerTintColor: '#1e293b', // text-slate-800
        headerTitleStyle: {
          fontFamily: 'Quicksand-Bold',
          fontSize: 18,
        },
        // headerTitleAlign: 'center',
        // headerLeft: () => <HeaderLeft />,
        headerRight: () => <HeaderRigth />,

      }}>
      {/* Esta es la pantalla principal del Stack. El header no tendrá botón de "atrás", lo cual es correcto. */}
      <Stack.Screen name="raffleIndex" options={{ title: 'Administrar Sorteos', headerShown: false }} />
      {/* Al navegar a estas pantallas, el Stack añadirá automáticamente un botón de "Atrás" a la izquierda. */}
      <Stack.Screen name="[id]/index" options={{ title: 'Editar Sorteo' }} />
      <Stack.Screen name="[id]/sales" options={{ title: 'Ventas del Sorteo' }} />
    </Stack>
  );
}