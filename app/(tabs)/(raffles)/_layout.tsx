import CustomHeader from '@/components/CustomHeader';
import HeaderRigth from '@/components/HeaderRigth';
import { Stack } from 'expo-router';
import React from 'react';

export default function RafflesStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}>
      <Stack.Screen
        name="raffle"
        options={{
          title: 'Administrar Sorteos',
          header: ({ options }) => <CustomHeader title={options.title || ""} renderRight={() => <HeaderRigth />} />
        }}
      />
      <Stack.Screen
        name="create-raffle"
        options={{
          title: 'Crear Nuevo Sorteo',
          header: ({ options }) => <CustomHeader title={options.title || ""} showBackButton={true} />
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: 'Editar Sorteo',
          header: ({ options }) => <CustomHeader title={options.title || ""} showBackButton={true} />
        }}
      />
    </Stack>
  );
}
